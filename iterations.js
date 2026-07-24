const state = {
  search: "",
  product: "全部",
  status: "全部",
  hideDone: false,
  page: 1,
  pageSize: 10,
  sortKey: null,
  sortAsc: true,
  editName: null,
  editProduct: null,
  isCreate: false,
};

/** 进展 / 阶段状态排序权重：越紧急越靠前（升序时） */
const ITER_STATUS_ORDER = ["已超期", "进行中", "未开始", "已完成", "不涉及", "未排期"];

const DATE_KEYS = [
  ["prdStart", "iter-prd-start"],
  ["prdEnd", "iter-prd-end"],
  ["uxStart", "iter-ux-start"],
  ["uxEnd", "iter-ux-end"],
  ["uiStart", "iter-ui-start"],
  ["uiEnd", "iter-ui-end"],
  ["devStart", "iter-dev-start"],
  ["devEnd", "iter-dev-end"],
  ["testStart", "iter-test-start"],
  ["testEnd", "iter-test-end"],
];

const PHASE_STATUS_COLS = ITERATION_PHASE_DEFS.map((p) => ({
  key: p.key,
  label: p.label,
}));

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function phaseBadge(status, plannedEnd) {
  const cls =
    status === "已完成"
      ? "iter-phase-badge is-done"
      : status === "进行中"
        ? "iter-phase-badge is-running"
        : status === "已超期"
          ? "iter-phase-badge is-overdue"
          : status === "不涉及"
            ? "iter-phase-badge is-na"
            : "iter-phase-badge is-pending";
  const hasTip = status === "已超期" && plannedEnd;
  const tipClass = hasTip ? " has-tip" : "";
  const tipAttr = hasTip ? ` data-tip="计划完成时间：${escapeHtml(plannedEnd)}"` : "";
  return `<span class="${cls}${tipClass}"${tipAttr}>${escapeHtml(status)}</span>`;
}

function progressBadge(status, plannedEnd) {
  const cls =
    status === "已完成"
      ? "iter-phase-badge is-done"
      : status === "进行中"
        ? "iter-phase-badge is-running"
        : status === "已超期"
          ? "iter-phase-badge is-overdue"
          : status === "未排期"
            ? "iter-phase-badge is-na"
            : "iter-phase-badge is-pending";
  const hasTip = status === "已超期" && plannedEnd;
  const tipClass = hasTip ? " has-tip" : "";
  const tipAttr = hasTip ? ` data-tip="计划完成时间：${escapeHtml(plannedEnd)}"` : "";
  return `<span class="${cls}${tipClass}"${tipAttr}>${escapeHtml(status)}</span>`;
}

function iterationTypeTags(it) {
  const { hasAgile, hasTos } = getIterationTypeFlags(it.name, it.product);
  let html = "";
  if (hasAgile) html += '<span class="iter-type-tag is-agile">敏</span>';
  if (hasTos) html += '<span class="iter-type-tag is-tos">T</span>';
  return html;
}

function getPhasePlannedEnd(it, phaseKey) {
  const def = ITERATION_PHASE_DEFS.find((p) => p.key === phaseKey);
  if (!def || !it || !it.dates) return "";
  return it.dates[def.end] || "";
}

function getProgressStatus(it) {
  return getIterationStatus(it) === "未排期" ? "未排期" : getIterationProgressStatus(it);
}

function statusSortValue(status) {
  const idx = ITER_STATUS_ORDER.indexOf(status);
  return idx < 0 ? 999 : idx;
}

function getSortValue(it, key) {
  if (key === "progress") return statusSortValue(getProgressStatus(it));
  if (key === "count") return getIterationReqCount(it.name, it.product);
  if (["prd", "ux", "ui", "dev", "test"].includes(key)) {
    return statusSortValue(getIterationPhaseStatus(it, key));
  }
  return 0;
}

/** 默认：按产品分组，组内迭代号升序；有 sortKey 时按该列排 */
function getSortedIterations(rows) {
  const list = rows.slice();
  if (!state.sortKey) {
    return list.sort((a, b) => {
      const pc = String(a.product || "").localeCompare(String(b.product || ""), "zh");
      if (pc !== 0) return pc;
      return iterationNum(a.name) - iterationNum(b.name);
    });
  }
  const dir = state.sortAsc ? 1 : -1;
  return list.sort((a, b) => {
    const va = getSortValue(a, state.sortKey);
    const vb = getSortValue(b, state.sortKey);
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    const pc = String(a.product || "").localeCompare(String(b.product || ""), "zh");
    if (pc !== 0) return pc;
    return iterationNum(a.name) - iterationNum(b.name);
  });
}

function getFiltered() {
  const q = state.search.trim().toLowerCase();
  const filtered = ITERATIONS.filter((it) => {
    if (state.product !== "全部" && it.product !== state.product) return false;
    const st = getProgressStatus(it);
    if (state.hideDone && st === "已完成") return false;
    if (state.status !== "全部" && st !== state.status) return false;
    if (q && !String(it.name).toLowerCase().includes(q)) return false;
    return true;
  });
  return getSortedIterations(filtered);
}

function updateSortHeaders() {
  document.querySelectorAll(".iterations-table-header th.sortable").forEach((th) => {
    const active = th.dataset.key === state.sortKey;
    th.classList.toggle("sorted", active);
    th.classList.toggle("sorted-desc", active && !state.sortAsc);
    th.classList.toggle("sorted-asc", active && state.sortAsc);
  });
}

function renderPagination(total) {
  const el = document.getElementById("iterations-pagination");
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  if (state.page > pages) state.page = pages;
  let html = `<button class="page-btn" data-page="prev" ${state.page === 1 ? "disabled" : ""}>&lt;</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button type="button" class="page-btn ${i === state.page ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  html += `<button class="page-btn" data-page="next" ${state.page === pages ? "disabled" : ""}>&gt;</button>`;
  el.innerHTML = html;
  document.getElementById("iterations-total-count").textContent = `共 ${total} 条迭代记录`;
}

function getLatestIterationForProduct(product) {
  const list = ITERATIONS.filter((it) => it.product === product);
  if (!list.length) return null;
  return list.slice().sort((a, b) => iterationNum(b.name) - iterationNum(a.name))[0];
}

function getLatestInProductGroup(pageRows, startIdx, span) {
  const groupRows = pageRows.slice(startIdx, startIdx + span);
  if (!groupRows.length) return null;
  return groupRows.slice().sort((a, b) => iterationNum(b.name) - iterationNum(a.name))[0];
}

function renderTable() {
  const doneToggle = document.getElementById("iter-status-done-toggle");
  if (doneToggle) doneToggle.checked = !!state.hideDone;
  updateSortHeaders();
  const body = document.getElementById("iterations-tbody");
  const rows = getFiltered();
  renderPagination(rows.length);
  const start = (state.page - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);

  if (!pageRows.length) {
    body.innerHTML = `<tr><td class="empty-row" colspan="9">暂无符合条件的迭代</td></tr>`;
    return;
  }

  // 当前页内：同产品合并「所属产品」列（与甘特对齐）
  const productSpans = [];
  for (let i = 0; i < pageRows.length; ) {
    const product = pageRows[i].product;
    let j = i + 1;
    while (j < pageRows.length && pageRows[j].product === product) j += 1;
    productSpans[i] = j - i;
    for (let k = i + 1; k < j; k++) productSpans[k] = 0;
    i = j;
  }

  body.innerHTML = pageRows
    .map((it, idx) => {
      const count = getIterationReqCount(it.name, it.product);
      let productCell = "";
      if (productSpans[idx] > 0) {
        const latest =
          getLatestInProductGroup(pageRows, idx, productSpans[idx]) ||
          getLatestIterationForProduct(it.product) ||
          it;
        const href = `iteration-detail.html?product=${encodeURIComponent(it.product)}&name=${encodeURIComponent(latest.name)}&drawer=open`;
        productCell = `<td class="td-product" rowspan="${productSpans[idx]}"><a class="product-cell-link" href="${href}">${escapeHtml(it.product || "-")}</a></td>`;
      }
      const progressStatus = getIterationProgressStatus(it);
      const overdueTag = isIterationOverdueCompleted(it)
        ? '<span class="iter-overdue-tag">超期完成</span>'
        : "";
      const phaseCells = PHASE_STATUS_COLS.map((p) => {
        const st = getIterationPhaseStatus(it, p.key);
        const plannedEnd = getPhasePlannedEnd(it, p.key);
        return `<td class="td-phase">${phaseBadge(st, plannedEnd)}</td>`;
      }).join("");
      const progressPlannedEnd = progressStatus === "已超期" ? getPhasePlannedEnd(it, "test") : "";
      return `
      <tr class="iterations-data-row">
        ${productCell}
        <td class="td-iter">
          <a class="iter-cell-link" href="iteration-detail.html?product=${encodeURIComponent(it.product)}&name=${encodeURIComponent(it.name)}">
            <span class="iter-cell-name">${escapeHtml(it.name)}</span>${overdueTag}
          </a>
        </td>
        <td class="td-progress">${progressBadge(progressStatus, progressPlannedEnd)}</td>
        <td class="td-count">${count}${iterationTypeTags(it)}</td>
        ${phaseCells}
      </tr>`;
    })
    .join("");
}

function fillDates(dates) {
  DATE_KEYS.forEach(([key, id]) => {
    document.getElementById(id).value = (dates && dates[key]) || "";
  });
}

function readDates() {
  const dates = {};
  DATE_KEYS.forEach(([key, id]) => {
    dates[key] = document.getElementById(id).value || "";
  });
  return dates;
}

function setProductSelect(product, { locked }) {
  const hidden = document.getElementById("iter-product");
  const text = document.getElementById("iter-product-text");
  const btn = document.getElementById("iter-product-btn");
  hidden.value = product || "";
  if (product) {
    text.textContent = product;
    text.classList.remove("placeholder");
  } else {
    text.textContent = text.dataset.placeholder || "请选择所属产品";
    text.classList.add("placeholder");
  }
  btn.disabled = !!locked;
  btn.classList.toggle("is-disabled", !!locked);
}

function openModal({ isCreate, name, product }) {
  state.isCreate = isCreate;
  state.editName = name || null;
  state.editProduct = product || null;
  document.getElementById("iteration-modal-title").textContent = isCreate ? "新建迭代" : "编辑迭代排期";
  const nameInput = document.getElementById("iter-name");
  if (isCreate) {
    setProductSelect("", { locked: false });
    nameInput.value = "";
    nameInput.readOnly = false;
    fillDates({});
  } else {
    const it = findIteration(name, product);
    setProductSelect(product || (it && it.product) || "", { locked: true });
    nameInput.value = it ? it.name : name;
    nameInput.readOnly = true;
    fillDates(it && it.dates ? it.dates : {});
  }
  document.getElementById("iter-name").classList.remove("field-error");
  document.getElementById("iter-product-btn").classList.remove("field-error");
  ["iter-dev-start", "iter-dev-end", "iter-test-start", "iter-test-end"].forEach((id) => {
    document.getElementById(id).classList.remove("field-error");
  });
  document.getElementById("iteration-modal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeModal() {
  document.getElementById("iteration-modal").hidden = true;
  document.body.classList.remove("modal-open");
  document.getElementById("iter-product-menu").hidden = true;
  state.editName = null;
  state.editProduct = null;
  state.isCreate = false;
}

function saveModal() {
  const nameInput = document.getElementById("iter-name");
  const product = document.getElementById("iter-product").value.trim();
  const name = nameInput.value.trim();
  let valid = true;
  if (!product) {
    document.getElementById("iter-product-btn").classList.add("field-error");
    valid = false;
  } else {
    document.getElementById("iter-product-btn").classList.remove("field-error");
  }
  if (!name) {
    nameInput.classList.add("field-error");
    valid = false;
  } else {
    nameInput.classList.remove("field-error");
  }
  const requiredDateIds = ["iter-dev-start", "iter-dev-end", "iter-test-start", "iter-test-end"];
  requiredDateIds.forEach((id) => {
    const el = document.getElementById(id);
    if (!el.value) {
      el.classList.add("field-error");
      valid = false;
    } else {
      el.classList.remove("field-error");
    }
  });
  if (!valid) return;

  const dates = readDates();
  const datePayload = dates;

  if (state.isCreate) {
    if (findBoardIteration(name, product)) {
      nameInput.classList.add("field-error");
      alert("该产品下迭代代号已存在");
      return;
    }
    ITERATIONS.unshift({ product, name, dates: datePayload });
    if (typeof upsertIterationCatalog === "function") {
      upsertIterationCatalog({ product, name, dates: datePayload });
    }
  } else {
    const it = findIteration(state.editName, state.editProduct);
    if (!it) return;
    it.dates = datePayload;
    // 同步该产品该迭代下 SR 的排期
    REQUIREMENTS.forEach((r) => {
      if (isSR(r) && r.product === it.product && r.iteration === it.name && datePayload) {
        r.scheduleDates = { ...datePayload };
        if (datePayload.testEnd) r.deliverMonth = datePayload.testEnd.slice(0, 7);
      }
    });
  }
  closeModal();
  renderTable();
}

function setupDropdown(btnId, menuId, getOptions, getValue, setValue, labelId) {
  const btn = document.getElementById(btnId);
  const menu = document.getElementById(menuId);
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    document.querySelectorAll(".dropdown").forEach((d) => {
      if (d !== menu) d.hidden = true;
    });
    const options = getOptions();
    const current = getValue();
    menu.innerHTML = options
      .map((o) => {
        return `<button type="button" class="${o === current ? "selected" : ""}" data-value="${escapeHtml(o)}">${escapeHtml(o)}</button>`;
      })
      .join("");
    menu.hidden = !menu.hidden;
  });
  menu.addEventListener("click", (e) => {
    const opt = e.target.closest("button[data-value]");
    if (!opt) return;
    setValue(opt.dataset.value);
    document.getElementById(labelId).textContent = opt.dataset.value;
    menu.hidden = true;
    state.page = 1;
    renderTable();
  });
}

function setupProductSelect() {
  const btn = document.getElementById("iter-product-btn");
  const menu = document.getElementById("iter-product-menu");
  const products = Object.keys(PRODUCT_ITERATION_OFFSETS || {}).sort((a, b) => a.localeCompare(b, "zh"));

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (btn.disabled) return;
    menu.innerHTML = products
      .map((p) => {
        const cur = document.getElementById("iter-product").value;
        return `<button type="button" class="${p === cur ? "selected" : ""}" data-value="${escapeHtml(p)}">${escapeHtml(p)}</button>`;
      })
      .join("");
    menu.hidden = !menu.hidden;
  });

  menu.addEventListener("click", (e) => {
    const opt = e.target.closest("button[data-value]");
    if (!opt) return;
    setProductSelect(opt.dataset.value, { locked: false });
    btn.classList.remove("field-error");
    menu.hidden = true;
    const product = opt.dataset.value;
    const maxN = getSelectableIterations(product).reduce((m, it) => Math.max(m, iterationNum(it.name)), 0);
    document.getElementById("iter-name").value = `S${maxN + 1}`;
  });
}

function init() {
  const products = ["全部", ...Object.keys(PRODUCT_ITERATION_OFFSETS || {}).sort((a, b) => a.localeCompare(b, "zh"))];
  setupDropdown(
    "iter-product-filter-btn",
    "iter-product-dropdown",
    () => products,
    () => state.product,
    (v) => (state.product = v),
    "iter-product-filter-value"
  );
  setupDropdown(
    "iter-status-filter-btn",
    "iter-status-dropdown",
    () => ["全部", "未开始", "进行中", "已完成", "已超期"],
    () => state.status,
    (v) => (state.status = v),
    "iter-status-filter-value",
  );
  setupProductSelect();

  const doneToggle = document.getElementById("iter-status-done-toggle");
  if (doneToggle) {
    doneToggle.checked = !!state.hideDone;
    doneToggle.addEventListener("change", () => {
      state.hideDone = doneToggle.checked;
      state.page = 1;
      renderTable();
    });
  }

  let timer;
  document.getElementById("iter-search-input").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.search = e.target.value;
      state.page = 1;
      renderTable();
    }, 180);
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown").forEach((d) => (d.hidden = true));
    document.getElementById("iter-product-menu").hidden = true;
  });

  document.getElementById("iterations-pagination").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;
    const total = getFiltered().length;
    const pages = Math.max(1, Math.ceil(total / state.pageSize));
    let page = state.page;
    if (btn.dataset.page === "prev") page -= 1;
    else if (btn.dataset.page === "next") page += 1;
    else page = Number(btn.dataset.page);
    state.page = Math.min(pages, Math.max(1, page));
    renderTable();
  });

  document.getElementById("btn-export-iteration").addEventListener("click", () => {
    alert("演示环境：导出功能待接入");
  });

  document.getElementById("btn-add-iteration").addEventListener("click", () => {
    openModal({ isCreate: true });
  });

  document.querySelectorAll(".iterations-table-header th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      if (!key) return;
      if (state.sortKey === key) {
        state.sortAsc = !state.sortAsc;
      } else {
        state.sortKey = key;
        state.sortAsc = true;
      }
      state.page = 1;
      renderTable();
    });
  });

  document.getElementById("iteration-modal-close").addEventListener("click", closeModal);
  document.getElementById("iteration-modal-cancel").addEventListener("click", closeModal);
  document.getElementById("iteration-modal-save").addEventListener("click", saveModal);
  document.getElementById("iteration-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  renderTable();
}

init();
