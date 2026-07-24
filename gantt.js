const state = {
  search: "",
  product: "全部",
  iteration: "全部",
  didCenterToday: false,
};

const DAY_W = 32;
const ROW_H = 36;
const PHASE_DEFS = [
  { cls: "phase-prd", label: "PRD", start: "prdStart", end: "prdEnd" },
  { cls: "phase-ux", label: "UX", start: "uxStart", end: "uxEnd" },
  { cls: "phase-ui", label: "UI", start: "uiStart", end: "uiEnd" },
  { cls: "phase-dev", label: "开发", start: "devStart", end: "devEnd" },
  { cls: "phase-test", label: "测试", start: "testStart", end: "testEnd" },
];

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function uniqueSorted(arr, cmp) {
  return [...new Set(arr.filter(Boolean))].sort(cmp || undefined);
}

function getFilteredRows() {
  const q = state.search.trim().toLowerCase();
  return getGanttRows()
    .filter((r) => {
      if (state.product !== "全部" && r.product !== state.product) return false;
      if (state.iteration !== "全部" && r.iteration !== state.iteration) return false;
      if (q && !String(r.title).toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => {
      const pc = String(a.product || "").localeCompare(String(b.product || ""), "zh");
      if (pc !== 0) return pc;
      const ia = iterationNum(a.iteration || "");
      const ib = iterationNum(b.iteration || "");
      if (ib !== ia) return ib - ia;
      return String(a.title).localeCompare(String(b.title), "zh");
    });
}

/** 产品 → 迭代 → 需求（扁平分列用） */
function groupByProductThenIteration(rows) {
  const products = new Map();
  rows.forEach((r) => {
    const product = r.product || "未归属产品";
    const iter = r.iteration || "未归属";
    if (!products.has(product)) products.set(product, new Map());
    const iters = products.get(product);
    if (!iters.has(iter)) iters.set(iter, []);
    iters.get(iter).push(r);
  });

  return [...products.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "zh"))
    .map(([product, iterMap]) => ({
      product,
      iterations: [...iterMap.entries()]
        .sort((a, b) => iterationNum(a[0]) - iterationNum(b[0]))
        .map(([iteration, items]) => ({ iteration, items })),
    }));
}

function computeRange(rows) {
  let min = null;
  let max = null;
  rows.forEach((r) => {
    const d = r.scheduleDates;
    if (!d) return;
    ["prdStart", "uxStart", "uiStart", "devStart", "testStart"].forEach((k) => {
      if (d[k] && (!min || d[k] < min)) min = d[k];
    });
    ["prdEnd", "uxEnd", "uiEnd", "devEnd", "testEnd"].forEach((k) => {
      if (d[k] && (!max || d[k] > max)) max = d[k];
    });
  });

  const today = todayISO();
  const padStart = addDaysISO(today, -45);
  const padEnd = addDaysISO(today, 45);
  if (!min || !max) return { start: padStart, end: padEnd };
  return {
    start: min < padStart ? min : padStart,
    end: max > padEnd ? max : padEnd,
  };
}

function buildDayCells(start, end) {
  const days = [];
  const total = daysBetween(start, end) + 1;
  for (let i = 0; i < total; i++) {
    const iso = addDaysISO(start, i);
    const d = parseISODate(iso);
    const weekday = d.getDay();
    days.push({
      iso,
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      weekend: weekday === 0 || weekday === 6,
      left: i * DAY_W,
    });
  }
  return days;
}

function buildMonthSpans(days) {
  if (!days.length) return [];
  const spans = [];
  let cur = null;
  days.forEach((d) => {
    const key = `${d.year}-${d.month}`;
    if (!cur || cur.key !== key) {
      cur = {
        key,
        label: `${d.year}年${d.month}月`,
        left: d.left,
        width: DAY_W,
      };
      spans.push(cur);
    } else {
      cur.width += DAY_W;
    }
  });
  return spans;
}

/** 每个日期一列竖线，贯穿整张甘特图 */
function dayGridHtml(days) {
  return days
    .map(
      (d) =>
        `<div class="gantt-day-col${d.weekend ? " is-weekend" : ""}" style="left:${d.left}px;width:${DAY_W}px"></div>`
    )
    .join("");
}

function phaseBarHtml(rangeStart, dates, phase) {
  const s = dates[phase.start];
  const e = dates[phase.end];
  if (!s || !e) return "";
  const left = daysBetween(rangeStart, s) * DAY_W;
  const dayCount = Math.max(daysBetween(s, e) + 1, 1);
  const w = dayCount * DAY_W;
  const label = dayCount >= 2 ? `${dayCount}天` : phase.label;
  return `<div class="gantt-bar ${phase.cls}" style="left:${left}px;width:${w}px" title="${phase.label}: ${s} ~ ${e}（${dayCount}天）"><span>${label}</span></div>`;
}

function centerToday(todayLeft) {
  const right = document.getElementById("gantt-right");
  if (!right) return;
  right.scrollLeft = Math.max(0, todayLeft - right.clientWidth / 2);
}

function getIterationDates(product, iteration, items) {
  const it = findIteration(iteration, product);
  if (it && it.dates) return it.dates;
  const first = items && items[0];
  return (first && first.scheduleDates) || {};
}

function buildFlatRows(groups) {
  /** 按迭代排期：同一迭代只出一套阶段行，需求列合并展示 */
  const flat = [];
  groups.forEach(({ product, iterations }) => {
    const productPhaseCount = iterations.length * PHASE_DEFS.length;
    let productFirst = true;
    iterations.forEach(({ iteration, items }) => {
      const dates = getIterationDates(product, iteration, items);
      let iterFirst = true;
      PHASE_DEFS.forEach((phase) => {
        flat.push({
          product,
          showProduct: productFirst,
          productSpan: productPhaseCount,
          iteration,
          showIter: iterFirst,
          iterSpan: PHASE_DEFS.length,
          reqs: items,
          showReqs: iterFirst,
          reqSpan: PHASE_DEFS.length,
          dates,
          phase,
        });
        productFirst = false;
        iterFirst = false;
      });
    });
  });
  return flat;
}

function render(options = {}) {
  const { keepScroll = false, center = false } = options;
  const rows = getFilteredRows();
  const productCount = new Set(rows.map((r) => r.product || "未归属产品")).size;
  const iterCount = new Set(rows.map((r) => r.iteration || "未归属")).size;
  document.getElementById("gantt-total-count").textContent =
    `共 ${productCount} 个产品 · ${iterCount} 个迭代 · ${rows.length} 条排期需求`;

  const leftBody = document.getElementById("gantt-left-body");
  const header = document.getElementById("gantt-timeline-header");
  const body = document.getElementById("gantt-timeline-body");
  const right = document.getElementById("gantt-right");
  const prevScrollLeft = right.scrollLeft;
  const prevScrollTop = right.scrollTop;

  if (!rows.length) {
    leftBody.innerHTML = `<div class="gantt-empty">暂无符合条件的排期需求</div>`;
    header.innerHTML = "";
    body.innerHTML = "";
    return;
  }

  const groups = groupByProductThenIteration(rows);
  const flat = buildFlatRows(groups);
  const range = computeRange(rows);
  const days = buildDayCells(range.start, range.end);
  const months = buildMonthSpans(days);
  const width = days.length * DAY_W;
  const today = todayISO();
  const todayOffset = daysBetween(range.start, today);
  const showToday = todayOffset >= 0 && todayOffset < days.length;
  const todayLeft = todayOffset * DAY_W + DAY_W / 2;
  const dayGrid = dayGridHtml(days);
  const todayLine = showToday
    ? `<div class="gantt-today-line" style="left:${todayLeft}px" title="今天 ${today}"><i class="gantt-today-dot"></i></div>`
    : "";

  header.style.width = `${width}px`;
  header.innerHTML = `
    <div class="gantt-header-months">
      ${months
        .map(
          (m) =>
            `<div class="gantt-month-cell" style="left:${m.left}px;width:${m.width}px">${escapeHtml(m.label)}</div>`
        )
        .join("")}
    </div>
    <div class="gantt-header-days">
      ${days
        .map(
          (d) =>
            `<div class="gantt-day-cell${d.weekend ? " is-weekend" : ""}${d.iso === today ? " is-today" : ""}" style="left:${d.left}px;width:${DAY_W}px" title="${d.iso}">${d.day}</div>`
        )
        .join("")}
    </div>
    ${todayLine}
  `;

  // 用 table + rowspan：同一迭代的需求合并到一个框，阶段按迭代排期只渲染一套
  leftBody.innerHTML = `
    <table class="gantt-left-table">
      <tbody>
        ${flat
          .map((row) => {
            const productCell = row.showProduct
              ? `<td class="gantt-col-product" rowspan="${row.productSpan}"><span class="gantt-product-text">${escapeHtml(
                  row.product
                )}</span></td>`
              : "";
            const iterCell = row.showIter
              ? `<td class="gantt-col-iter" rowspan="${row.iterSpan}"><span class="gantt-iter-text">${escapeHtml(
                  row.iteration
                )}</span></td>`
              : "";
            const reqCell = row.showReqs
              ? `<td class="gantt-col-req" rowspan="${row.reqSpan}">
                  <div class="gantt-req-box">
                    ${row.reqs
                      .map((req) => {
                        const code = req.reqCode || `REQ-${req.id}`;
                        return `<div class="gantt-req-item" title="${escapeHtml(req.title)}">
                          <div class="gantt-req-title">${escapeHtml(req.title)}</div>
                          <div class="gantt-req-code">${escapeHtml(code)}</div>
                        </div>`;
                      })
                      .join("")}
                  </div>
                </td>`
              : "";
            return `
            <tr class="gantt-left-tr" style="height:${ROW_H}px">
              ${productCell}
              ${iterCell}
              ${reqCell}
              <td class="gantt-col-phase"><span class="gantt-phase-chip ${row.phase.cls}">${row.phase.label}</span></td>
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>`;

  const rowsHtml = flat
    .map((row) => {
      return `
      <div class="gantt-timeline-row" style="width:${width}px;height:${ROW_H}px">
        <div class="gantt-bars">${phaseBarHtml(range.start, row.dates || {}, row.phase)}</div>
      </div>`;
    })
    .join("");

  body.style.width = `${width}px`;
  body.innerHTML = `
    <div class="gantt-day-grid" aria-hidden="true">${dayGrid}</div>
    <div class="gantt-timeline-rows">${rowsHtml}</div>
    ${showToday ? `<div class="gantt-today-line gantt-today-line-body" style="left:${todayLeft}px"></div>` : ""}
  `;

  requestAnimationFrame(() => {
    if (center || (!state.didCenterToday && showToday)) {
      centerToday(todayLeft);
      state.didCenterToday = true;
    } else if (keepScroll) {
      right.scrollLeft = prevScrollLeft;
      right.scrollTop = prevScrollTop;
    }
    document.getElementById("gantt-left-body").scrollTop = right.scrollTop;
  });
}

function setupFilter(btnId, menuId, valueId, getOptions, getValue, setValue, options = {}) {
  const btn = document.getElementById(btnId);
  const menu = document.getElementById(menuId);
  const { beforeOpen, afterSelect } = options;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (beforeOpen && beforeOpen() === false) return;
    document.querySelectorAll(".dropdown").forEach((d) => {
      if (d !== menu) d.hidden = true;
    });
    const opts = getOptions();
    const current = getValue();
    menu.innerHTML = opts
      .map(
        (o) =>
          `<button type="button" class="${o === current ? "selected" : ""}" data-value="${escapeHtml(o)}">${escapeHtml(o)}</button>`
      )
      .join("");
    menu.hidden = !menu.hidden;
  });

  menu.addEventListener("click", (e) => {
    const opt = e.target.closest("button[data-value]");
    if (!opt) return;
    setValue(opt.dataset.value);
    document.getElementById(valueId).textContent = opt.dataset.value;
    menu.hidden = true;
    if (afterSelect) afterSelect(opt.dataset.value);
    state.didCenterToday = false;
    render({ center: true });
  });
}

function syncIterationFilterUi() {
  const btn = document.getElementById("gantt-iteration-filter-btn");
  const label = document.getElementById("gantt-iteration-filter-value");
  const enabled = state.product !== "全部";
  btn.disabled = !enabled;
  btn.classList.toggle("is-disabled", !enabled);
  btn.title = enabled ? "" : "请先选择所属产品";
  if (!enabled) {
    state.iteration = "全部";
    label.textContent = "全部";
  }
}

function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlProduct = urlParams.get("product");
  const urlIteration = urlParams.get("iteration");
  if (urlProduct) {
    state.product = urlProduct;
    document.getElementById("gantt-product-filter-value").textContent = urlProduct;
  }
  if (urlIteration) {
    state.iteration = urlIteration;
    document.getElementById("gantt-iteration-filter-value").textContent = urlIteration;
  }

  setupFilter(
    "gantt-product-filter-btn",
    "gantt-product-dropdown",
    "gantt-product-filter-value",
    () => ["全部", ...uniqueSorted(getGanttRows().map((r) => r.product))],
    () => state.product,
    (v) => {
      state.product = v;
      state.iteration = "全部";
      syncIterationFilterUi();
      document.getElementById("gantt-iteration-filter-value").textContent = "全部";
    }
  );

  setupFilter(
    "gantt-iteration-filter-btn",
    "gantt-iteration-dropdown",
    "gantt-iteration-filter-value",
    () => {
      if (state.product === "全部") return ["全部"];
      const names = uniqueSorted(
        getGanttRows()
          .filter((r) => r.product === state.product)
          .map((r) => r.iteration),
        (a, b) => iterationNum(b) - iterationNum(a)
      );
      return ["全部", ...names];
    },
    () => state.iteration,
    (v) => (state.iteration = v),
    {
      beforeOpen: () => {
        if (state.product === "全部") {
          alert("请先选择所属产品");
          return false;
        }
        return true;
      },
    }
  );

  syncIterationFilterUi();

  let timer;
  document.getElementById("gantt-search-input").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.search = e.target.value;
      state.didCenterToday = false;
      render({ center: true });
    }, 180);
  });

  document.getElementById("gantt-today-btn").addEventListener("click", () => {
    state.didCenterToday = false;
    render({ center: true, keepScroll: true });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown").forEach((d) => (d.hidden = true));
  });

  const left = document.getElementById("gantt-left-body");
  const right = document.getElementById("gantt-right");
  let syncing = false;
  right.addEventListener("scroll", () => {
    if (syncing) return;
    syncing = true;
    left.scrollTop = right.scrollTop;
    syncing = false;
  });
  left.addEventListener("scroll", () => {
    if (syncing) return;
    syncing = true;
    right.scrollTop = left.scrollTop;
    syncing = false;
  });

  render({ center: true });
}

init();
