const DAY_W = 36;
const ROW_H = 40;
const GROUP_GAP = 12;

const todayParts = (() => {
  const t = todayISO();
  const [y, m] = t.split("-").map(Number);
  return { year: y, month: m };
})();

const state = {
  shuttles: getShuttles(),
  editingId: null,
  didCenterToday: false,
  year: todayParts.year,
  month: "全部", // 默认不筛月份；选中后只展示当月那一条
};

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isWeekend(iso) {
  const w = parseISODate(iso).getDay();
  return w === 0 || w === 6;
}

function collectStageDates(stages) {
  const dates = [];
  Object.values(stages || {}).forEach((st) => {
    if (st && st.start) dates.push(st.start);
    if (st && st.end) dates.push(st.end);
  });
  return dates;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** 从班车名称/阶段日期推断归属年、月（如「7月份班车」「2025年11月班车」） */
function getShuttlePeriod(shuttle) {
  const name = String(shuttle.name || "");
  const named = name.match(/(?:(\d{4})年)?(\d{1,2})月份?班车/);
  const dates = collectStageDates(shuttle.stages).sort();
  const ref = shuttle.stages?.plan?.start || dates[Math.floor(dates.length / 2)] || todayISO();
  if (named) {
    const month = Number(named[2]);
    const year = named[1] ? Number(named[1]) : Number(ref.slice(0, 4));
    return { year, month };
  }
  if (!dates.length && !shuttle.stages?.plan?.start) return null;
  return { year: Number(ref.slice(0, 4)), month: Number(ref.slice(5, 7)) };
}

function getVisibleShuttles() {
  const year = Number(state.year);
  const list = state.shuttles.filter((s) => {
    const period = getShuttlePeriod(s);
    if (!period) return false;
    if (period.year !== year) return false;
    if (state.month === "全部") return true;
    return period.month === Number(state.month);
  });
  // 选中月份时只保留一条（同月多条时取第一条）
  if (state.month !== "全部" && list.length > 1) return list.slice(0, 1);
  return list;
}

function getYearOptions() {
  const years = new Set([todayParts.year, todayParts.year - 1, todayParts.year + 1]);
  state.shuttles.forEach((s) => {
    const period = getShuttlePeriod(s);
    if (period) years.add(period.year);
  });
  return [...years].sort((a, b) => b - a);
}

/** 时间轴范围：随可见班车实际日期伸缩 */
function computeRange(shuttles) {
  let min = null;
  let max = null;
  shuttles.forEach((s) => {
    collectStageDates(s.stages).forEach((iso) => {
      if (!min || iso < min) min = iso;
      if (!max || iso > max) max = iso;
    });
  });
  if (!min || !max) {
    const year = Number(state.year);
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
  // 默认不筛选时，若含今日所在年则略扩以容纳今日线
  const padStart = addDaysISO(min, -3);
  const padEnd = addDaysISO(max, 3);
  if (state.month === "全部") {
    const today = todayISO();
    if (Number(today.slice(0, 4)) === Number(state.year)) {
      return {
        start: padStart < today ? padStart : addDaysISO(today, -20),
        end: padEnd > today ? padEnd : addDaysISO(today, 20),
      };
    }
  }
  return { start: padStart, end: padEnd };
}

/** 仅工作日列，匹配飞书/表格班车看板 */
function buildWorkdayCells(start, end) {
  const days = [];
  const total = daysBetween(start, end) + 1;
  let col = 0;
  for (let i = 0; i < total; i++) {
    const iso = addDaysISO(start, i);
    if (isWeekend(iso)) continue;
    days.push({
      iso,
      day: Number(iso.slice(8, 10)),
      month: Number(iso.slice(5, 7)),
      year: Number(iso.slice(0, 4)),
      left: col * DAY_W,
      col,
    });
    col += 1;
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
      const label =
        Number(state.year) === d.year ? `${d.month}月` : `${d.year}年${d.month}月`;
      cur = { key, label, left: d.left, width: DAY_W };
      spans.push(cur);
    } else {
      cur.width += DAY_W;
    }
  });
  return spans;
}

function dayIndexMap(days) {
  const map = new Map();
  days.forEach((d) => map.set(d.iso, d.col));
  return map;
}

function snapToWorkday(iso, days, prefer = "start") {
  if (!iso || !days.length) return null;
  if (days.some((d) => d.iso === iso)) return iso;
  if (prefer === "end") {
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].iso <= iso) return days[i].iso;
    }
    return days[0].iso;
  }
  for (let i = 0; i < days.length; i++) {
    if (days[i].iso >= iso) return days[i].iso;
  }
  return days[days.length - 1].iso;
}

function barGeometry(stage, days, idxMap) {
  if (!stage || !stage.start || !stage.end) return null;
  const s = snapToWorkday(stage.start, days, "start");
  const e = snapToWorkday(stage.end, days, "end");
  if (!s || !e || e < s) return null;
  const startCol = idxMap.get(s);
  const endCol = idxMap.get(e);
  if (startCol == null || endCol == null) return null;
  return {
    left: startCol * DAY_W,
    width: Math.max(endCol - startCol + 1, 1) * DAY_W,
  };
}

function dayGridHtml(days) {
  return days
    .map(
      (d) =>
        `<div class="shuttle-day-col" style="left:${d.left}px;width:${DAY_W}px"></div>`
    )
    .join("");
}

function renderTimelineHeader(days, todayIso, todayLeft, showToday) {
  const months = buildMonthSpans(days);
  const width = Math.max(days.length * DAY_W, 1);
  const monthHtml = months
    .map(
      (m) =>
        `<div class="shuttle-month-cell" style="left:${m.left}px;width:${m.width}px">${escapeHtml(m.label)}</div>`
    )
    .join("");
  const dayHtml = days
    .map(
      (d) =>
        `<div class="shuttle-day-cell${showToday && todayIso && d.iso === todayIso ? " is-today" : ""}" style="left:${d.left}px;width:${DAY_W}px" title="${d.iso}">${d.day}</div>`
    )
    .join("");
  const todayLine = showToday
    ? `<div class="gantt-today-line" style="left:${todayLeft}px" title="今天 ${todayIso}"><i class="gantt-today-dot"></i></div>`
    : "";

  return `
    <div class="shuttle-header-months" style="width:${width}px">${monthHtml}</div>
    <div class="shuttle-header-days" style="width:${width}px">${dayHtml}</div>
    ${todayLine}
  `;
}

function renderBarsForRow(shuttle, rowDef, days, idxMap) {
  return rowDef.bars
    .map((barDef) => {
      const stage = shuttle.stages[barDef.field];
      const geo = barGeometry(stage, days, idxMap);
      if (!geo) return "";
      const label = rowDef.label;
      return `
        <div class="shuttle-bar ${barDef.cls}" style="left:${geo.left}px;width:${geo.width}px" title="${escapeHtml(label)}">
          <span>${escapeHtml(label)}</span>
        </div>
      `;
    })
    .join("");
}

function centerToday(todayLeft) {
  const right = document.getElementById("shuttle-right");
  if (!right || !right.clientWidth) return false;
  right.scrollLeft = Math.max(0, todayLeft - right.clientWidth / 2);
  return true;
}

function scheduleCenterToday(todayLeft) {
  const tryCenter = () => centerToday(todayLeft);
  requestAnimationFrame(() => {
    if (tryCenter()) return;
    requestAnimationFrame(() => {
      if (tryCenter()) return;
      setTimeout(tryCenter, 50);
    });
  });
}

function findTodayMarker(days, today) {
  if (!days.length) return { showToday: false, todayLeft: 0, todayIso: null };
  // 今天正好在轴上
  let day = days.find((d) => d.iso === today);
  if (day) {
    return { showToday: true, todayLeft: day.left + DAY_W / 2, todayIso: today };
  }
  // 仅周末：吸附到相邻工作日（不得把轴外的「今天」硬吸到时间轴两端）
  const w = parseISODate(today).getDay();
  if (w === 0 || w === 6) {
    const prefer =
      w === 6
        ? [addDaysISO(today, -1), addDaysISO(today, 2)]
        : [addDaysISO(today, 1), addDaysISO(today, -2)];
    for (const iso of prefer) {
      day = days.find((d) => d.iso === iso);
      if (day) {
        return { showToday: true, todayLeft: day.left + DAY_W / 2, todayIso: iso };
      }
    }
  }
  return { showToday: false, todayLeft: 0, todayIso: null };
}

function renderBoard(options = {}) {
  const { center = false } = options;
  const shuttles = getVisibleShuttles();
  const leftBody = document.getElementById("shuttle-left-body");
  const header = document.getElementById("shuttle-timeline-header");
  const body = document.getElementById("shuttle-timeline-body");
  const totalEl = document.getElementById("shuttle-total-count");
  const right = document.getElementById("shuttle-right");

  totalEl.textContent = `共 ${shuttles.length} 条班车`;

  if (!shuttles.length) {
    leftBody.innerHTML = "";
    header.innerHTML = "";
    header.style.width = "";
    body.innerHTML = `<div class="shuttle-empty">当前年/月暂无班车，可切换筛选或点击「新增班车」</div>`;
    body.style.width = "";
    body.style.height = "";
    return;
  }

  const range = computeRange(shuttles);
  const days = buildWorkdayCells(range.start, range.end);
  const idxMap = dayIndexMap(days);
  const width = Math.max(days.length * DAY_W, 1);
  const rowCount = shuttles.length * SHUTTLE_ROW_DEFS.length;
  const height = rowCount * ROW_H + Math.max(shuttles.length - 1, 0) * GROUP_GAP;
  const today = todayISO();
  const marker = findTodayMarker(days, today);
  // 选了具体月份后不展示「今日」线；仅「全部」时展示
  const showToday = state.month === "全部" && marker.showToday;
  const todayLeft = marker.todayLeft;
  const todayIso = marker.todayIso;

  let leftHtml = "";
  let rowsHtml = "";
  let y = 0;

  shuttles.forEach((shuttle, si) => {
    if (si > 0) {
      y += GROUP_GAP;
      rowsHtml += `<div class="shuttle-group-gap" style="top:${y - GROUP_GAP}px;height:${GROUP_GAP}px;width:${width}px"></div>`;
    }

    leftHtml += `
      <div class="shuttle-group-block${si > 0 ? " has-gap" : ""}" style="height:${SHUTTLE_ROW_DEFS.length * ROW_H}px">
        <div class="shuttle-group-name">
          <button type="button" class="shuttle-edit-btn" data-edit-id="${shuttle.id}" title="编辑班车">
            <img src="assets/icons/pencil.svg" alt="" />
          </button>
          <span>${escapeHtml(shuttle.name)}</span>
        </div>
        <div class="shuttle-row-labels">
          ${SHUTTLE_ROW_DEFS.map((r) => `<div class="shuttle-row-label" style="height:${ROW_H}px">${escapeHtml(r.label)}</div>`).join("")}
        </div>
      </div>
    `;

    SHUTTLE_ROW_DEFS.forEach((rowDef) => {
      rowsHtml += `
        <div class="shuttle-timeline-row" style="top:${y}px;height:${ROW_H}px;width:${width}px">
          <div class="shuttle-bars">
            ${renderBarsForRow(shuttle, rowDef, days, idxMap)}
          </div>
        </div>
      `;
      y += ROW_H;
    });
  });

  leftBody.innerHTML = leftHtml;
  header.style.width = `${width}px`;
  header.innerHTML = renderTimelineHeader(days, todayIso, todayLeft, showToday);
  body.style.width = `${width}px`;
  body.style.height = `${height}px`;
  body.innerHTML = `
    <div class="shuttle-day-grid" style="width:${width}px;height:${height}px">${dayGridHtml(days)}</div>
    <div class="shuttle-timeline-rows" style="width:${width}px;height:${height}px">${rowsHtml}</div>
    ${showToday ? `<div class="gantt-today-line gantt-today-line-body" style="left:${todayLeft}px"></div>` : ""}
  `;

  if (center && showToday) {
    scheduleCenterToday(todayLeft);
    state.didCenterToday = true;
  } else if (center) {
    right.scrollLeft = 0;
    state.didCenterToday = true;
  }
}

function syncScroll() {
  const leftBody = document.getElementById("shuttle-left-body");
  const right = document.getElementById("shuttle-right");
  let locking = false;

  right.addEventListener("scroll", () => {
    if (locking) return;
    locking = true;
    leftBody.scrollTop = right.scrollTop;
    locking = false;
  });

  leftBody.addEventListener("scroll", () => {
    if (locking) return;
    locking = true;
    right.scrollTop = leftBody.scrollTop;
    locking = false;
  });
}

function buildDateGrid() {
  const grid = document.getElementById("shuttle-date-grid");
  grid.innerHTML = SHUTTLE_FORM_FIELDS.map((f) => {
    return `
      <div class="shuttle-stage-block" data-stage="${f.key}">
        <div class="shuttle-stage-title">${escapeHtml(f.label)}</div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">开始日期</label>
            <input class="field-input" id="shuttle-stage-${f.key}-start" type="date" />
          </div>
          <div class="field">
            <label class="field-label">结束日期</label>
            <input class="field-input" id="shuttle-stage-${f.key}-end" type="date" />
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function fillFormStages(stages) {
  SHUTTLE_FORM_FIELDS.forEach((f) => {
    const st = (stages && stages[f.key]) || {};
    document.getElementById(`shuttle-stage-${f.key}-start`).value = st.start || "";
    document.getElementById(`shuttle-stage-${f.key}-end`).value = st.end || "";
  });
}

function readFormStages() {
  const stages = {};
  SHUTTLE_FORM_FIELDS.forEach((f) => {
    const start = document.getElementById(`shuttle-stage-${f.key}-start`).value;
    const end = document.getElementById(`shuttle-stage-${f.key}-end`).value;
    if (!start && !end) return;
    stages[f.key] = {
      start: start || end,
      end: end || start,
    };
  });
  return stages;
}

function openModal({ isCreate, shuttle }) {
  state.editingId = isCreate ? null : shuttle.id;
  const modal = document.getElementById("shuttle-modal");
  const title = document.getElementById("shuttle-modal-title");
  const nameInput = document.getElementById("shuttle-name");

  title.textContent = isCreate ? "新增班车" : "编辑班车";
  nameInput.value = isCreate ? "" : shuttle.name || "";

  if (isCreate) {
    fillFormStages({});
  } else {
    fillFormStages(shuttle.stages);
  }

  modal.hidden = false;
  document.body.classList.add("modal-open");
  nameInput.focus();
}

function closeModal() {
  document.getElementById("shuttle-modal").hidden = true;
  document.body.classList.remove("modal-open");
  state.editingId = null;
}

function validateAndSave() {
  const name = document.getElementById("shuttle-name").value.trim();
  const stages = readFormStages();
  const nameEl = document.getElementById("shuttle-name");

  nameEl.classList.toggle("field-error", !name);
  if (!name) {
    nameEl.focus();
    return;
  }

  const hasAny = Object.keys(stages).length > 0;
  if (!hasAny) {
    alert("请至少填写一个阶段的日期");
    return;
  }

  // 结束不得早于开始
  for (const [key, st] of Object.entries(stages)) {
    if (st.start && st.end && st.end < st.start) {
      alert(`${SHUTTLE_FORM_FIELDS.find((f) => f.key === key)?.label || key}：结束日期不能早于开始日期`);
      return;
    }
  }

  // 按阶段顺序校验：时间首尾相接，不允许交集
  const ordered = SHUTTLE_FORM_FIELDS.map((f) => ({ ...f, stage: stages[f.key] })).filter((x) => x.stage);
  for (let i = 1; i < ordered.length; i++) {
    const prev = ordered[i - 1];
    const cur = ordered[i];
    if (cur.stage.start <= prev.stage.end) {
      alert(`${cur.label} 与 ${prev.label} 时间有交集，请改为首尾相接（后一阶段开始须晚于前一阶段结束）`);
      return;
    }
  }

  if (state.editingId == null) {
    const item = {
      id: nextShuttleId(state.shuttles),
      name,
      stages,
    };
    state.shuttles = [...state.shuttles, item];
  } else {
    state.shuttles = state.shuttles.map((s) =>
      s.id === state.editingId ? { ...s, name, stages } : s
    );
  }

  saveShuttles(state.shuttles);
  closeModal();
  renderBoard();
}

function setupFilter(btnId, menuId, valueId, getOptions, getValue, setValue, formatLabel) {
  const btn = document.getElementById(btnId);
  const menu = document.getElementById(menuId);
  const label = document.getElementById(valueId);

  const renderMenu = () => {
    const current = getValue();
    menu.innerHTML = getOptions()
      .map((opt) => {
        const selected = String(opt) === String(current) ? " selected" : "";
        return `<button type="button" class="${selected.trim()}" data-value="${escapeHtml(String(opt))}">${escapeHtml(
          formatLabel(opt)
        )}</button>`;
      })
      .join("");
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = menu.hidden;
    document.querySelectorAll(".shuttle-toolbar .dropdown").forEach((d) => {
      d.hidden = true;
    });
    if (willOpen) {
      renderMenu();
      menu.hidden = false;
    }
  });

  menu.addEventListener("click", (e) => {
    const opt = e.target.closest("button[data-value]");
    if (!opt) return;
    const raw = opt.dataset.value;
    setValue(raw === "全部" ? "全部" : Number(raw));
    label.textContent = formatLabel(getValue());
    menu.hidden = true;
    state.didCenterToday = false;
    renderBoard({ center: true });
  });
}

function initPeriodFilters() {
  document.getElementById("shuttle-year-value").textContent = String(state.year);
  document.getElementById("shuttle-month-value").textContent =
    state.month === "全部" ? "全部" : `${state.month}月`;

  setupFilter(
    "shuttle-year-btn",
    "shuttle-year-dropdown",
    "shuttle-year-value",
    getYearOptions,
    () => state.year,
    (v) => {
      state.year = Number(v);
    },
    (v) => String(v)
  );

  setupFilter(
    "shuttle-month-btn",
    "shuttle-month-dropdown",
    "shuttle-month-value",
    () => ["全部", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    () => state.month,
    (v) => {
      state.month = v === "全部" ? "全部" : Number(v);
    },
    (v) => (v === "全部" ? "全部" : `${v}月`)
  );
}

function bindEvents() {
  document.getElementById("btn-add-shuttle").addEventListener("click", () => {
    openModal({ isCreate: true });
  });

  document.getElementById("shuttle-today-btn").addEventListener("click", () => {
    state.year = todayParts.year;
    state.month = "全部";
    document.getElementById("shuttle-year-value").textContent = String(state.year);
    document.getElementById("shuttle-month-value").textContent = "全部";
    state.didCenterToday = false;
    renderBoard({ center: true });
  });

  document.getElementById("shuttle-modal-close").addEventListener("click", closeModal);
  document.getElementById("shuttle-modal-cancel").addEventListener("click", closeModal);
  document.getElementById("shuttle-modal-save").addEventListener("click", validateAndSave);

  document.getElementById("shuttle-modal").addEventListener("click", (e) => {
    if (e.target.id === "shuttle-modal") closeModal();
  });

  document.getElementById("shuttle-left-body").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-edit-id]");
    if (!btn) return;
    const id = Number(btn.dataset.editId);
    const shuttle = state.shuttles.find((s) => s.id === id);
    if (shuttle) openModal({ isCreate: false, shuttle });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".shuttle-toolbar .dropdown").forEach((d) => {
      d.hidden = true;
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !document.getElementById("shuttle-modal").hidden) {
      closeModal();
    }
  });
}

function init() {
  buildDateGrid();
  initPeriodFilters();
  syncScroll();
  bindEvents();
  renderBoard({ center: true });
}

init();
