// ---------- 假数据与排期种子见 data.js ----------
// 看板列顺序
const STATUS_ORDER = ["未启动", "进行中", "待评审", "已评审", "已排期", "开发中", "测试中", "已完成", "已取消"];
// 新建可选状态
const MANUAL_STATUSES = ["未启动", "进行中", "待评审", "已取消"];
// 完全不可手动改
const LOCKED_STATUSES = ["已排期", "开发中", "测试中", "已完成"];
// 详情页：当前状态 → 可切换到的目标（含自身，便于下拉展示当前值）
const STATUS_TRANSITIONS = {
  未启动: ["未启动", "进行中", "已取消"],
  进行中: ["未启动", "进行中", "待评审", "已取消"],
  待评审: ["进行中", "待评审", "已取消"],
  已评审: ["已评审", "已取消"],
  已排期: ["已排期"],
  开发中: ["开发中"],
  测试中: ["测试中"],
  已完成: ["已完成"],
  已取消: ["未启动", "进行中", "待评审", "已取消"],
};

const FEISHU_RAT_URL = "https://transsioner.feishu.cn/share/base/form/shrcn6UxGj3Ou4nb2ngSkCuEdth";

let toastTimer = null;
function showToast(message) {
  const el = document.getElementById("app-toast");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
  }, 2800);
}

function notifyPmSchedule(row) {
  const code = row.reqCode ? `（${row.reqCode}）` : "";
  showToast(`已向项管发送飞书消息，提醒为「${row.title}」${code}排期`);
}

function notifyPmIterationChange(row, reason) {
  const code = row.reqCode ? `（${row.reqCode}）` : "";
  const iter = row.iteration ? `，当前迭代 ${row.iteration}` : "";
  showToast(`已提醒项管修改「${row.title}」${code}${iter}；原因：${reason.slice(0, 40)}${reason.length > 40 ? "…" : ""}`);
}

// ---------- 状态 ----------
const state = {
  search: "",
  product: "全部",
  priority: "全部",
  sortKey: null,
  sortAsc: true,
  page: 1,
  pageSize: 10,
  view: getViewFromUrl(),
};

function getViewFromUrl() {
  try {
    const v = new URLSearchParams(window.location.search).get("view");
    return v === "board" ? "board" : "list";
  } catch {
    return "list";
  }
}

function poolHref({ id, view } = {}) {
  const params = new URLSearchParams();
  const v = view || state.view;
  if (v === "board") params.set("view", "board");
  if (id != null && id !== "") params.set("id", String(id));
  const q = params.toString();
  return q ? `pool.html?${q}` : "pool.html";
}

function syncViewUrl(view, { replace = false } = {}) {
  const url = new URL(window.location.href);
  if (view === "board") url.searchParams.set("view", "board");
  else url.searchParams.delete("view");
  const method = replace ? "replaceState" : "pushState";
  history[method]({ ...(history.state || {}), view }, "", url);
}

function syncViewToggleUI() {
  document.querySelectorAll("#view-toggle .toggle-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === state.view);
  });
}

// ---------- 数据处理 ----------
function getFiltered() {
  let rows = getPoolRows().filter((r) => {
    if (state.search && !r.title.toLowerCase().includes(state.search.toLowerCase())) return false;
    if (state.product !== "全部" && r.product !== state.product) return false;
    if (state.priority !== "全部" && r.priority !== state.priority) return false;
    return true;
  });

  if (state.sortKey) {
    const k = state.sortKey;
    rows = [...rows].sort((a, b) => {
      let va = a[k];
      let vb = b[k];
      if (k === "status") {
        va = STATUS_ORDER.indexOf(va);
        vb = STATUS_ORDER.indexOf(vb);
      }
      if (typeof va === "boolean") {
        va = va ? 0 : 1;
        vb = vb ? 0 : 1;
      }
      if (va < vb) return state.sortAsc ? -1 : 1;
      if (va > vb) return state.sortAsc ? 1 : -1;
      return 0;
    });
  }
  return rows;
}

// ---------- 渲染:徽标 ----------
function badge(cls, text) {
  return `<span class="${cls}">${text}</span>`;
}

function ownerChip(row) {
  return `<span class="owner-chip"><img src="${row.avatar}" alt="${row.owner}" /><span>${row.owner}</span></span>`;
}

/** 操作列：按状态与评审结果决定按钮 */
function getAction(row) {
  if (row.status === "进行中") return { type: "feishu", label: "去评审" };
  if (row.status === "待评审") return { type: "review", label: "填写评审结果" };
  if (row.status === "已评审" && row.reviewResult === "通过") {
    // tOS：填写基础信息后，操作改为「提醒排期」
    if (isTosType(row) && row.schedulePrepared) {
      return { type: "remind", label: "提醒排期" };
    }
    return { type: "schedule", label: "去排期" };
  }
  return null;
}

/** 评审不通过时直接回退到进行中（不停留在已评审） */
function applyReviewOutcome(row, result) {
  row.reviewResult = result;
  if (result === "不通过") {
    row.status = "进行中";
  } else {
    row.status = "已评审";
  }
}

function actionCell(row) {
  const action = getAction(row);
  if (!action) return `<span class="action-empty">-</span>`;
  // 飞书跳转用 <a>，保证新标签打开；状态回退在 click 里处理
  if (action.type === "feishu") {
    return `<a class="action-link" href="${FEISHU_RAT_URL}" target="_blank" rel="noopener noreferrer" data-action="feishu" data-id="${row.id}">${action.label}</a>`;
  }
  return `<button type="button" class="action-link" data-action="${action.type}" data-id="${row.id}">${action.label}</button>`;
}

/** 当前状态允许切换到的目标状态 */
function getAllowedManualStatuses(current) {
  return (STATUS_TRANSITIONS[current] || [current]).slice();
}

function isStatusLocked(status) {
  return LOCKED_STATUSES.includes(status);
}

// ---------- 渲染:列表 ----------
function renderTable(rows) {
  const body = document.getElementById("table-body");
  if (rows.length === 0) {
    body.innerHTML = `<div class="empty-row">没有符合条件的需求</div>`;
    return;
  }
  body.innerHTML = rows
    .map(
      (r) => `
    <div class="table-row">
      <div class="td td-title"><a class="req-link" href="${poolHref({ id: r.id })}" data-id="${r.id}">${r.title}</a></div>
      <div class="td w-110">${r.product}</div>
      <div class="td w-100">${badge(`status-badge status-${r.status}`, r.status)}</div>
      <div class="td w-80">${badge(`priority-badge priority-${r.priority}`, r.priority)}</div>
      <div class="td w-100">${badge(`type-label type-${r.type}`, r.type)}</div>
      <div class="td w-120"><span class="${r.isValue ? "value-yes" : "value-no"}">${r.isValue ? "是" : "否"}</span></div>
      <div class="td w-120">${ownerChip(r)}</div>
      <div class="td w-110">${r.requestDate}</div>
      <div class="td w-110">${r.deliverMonth}</div>
      <div class="td w-90 centered">${r.version}</div>
      <div class="td w-110 td-action">${actionCell(r)}</div>
    </div>`
    )
    .join("");
}

function ratLabel(row) {
  if (row.reviewResult === "通过") return "审核通过";
  if (row.reviewResult === "不通过") return "审核驳回";
  if (row.status === "待评审") return "待审核";
  return "不涉及";
}

// ---------- 渲染:卡片看板 ----------
function renderBoard(rows) {
  const board = document.getElementById("board-view");
  board.innerHTML = STATUS_ORDER.map((status) => {
    const cards = rows.filter((r) => r.status === status);
    return `
      <div class="board-column">
        <div class="board-column-title">
          ${badge(`status-badge status-${status}`, status)}
          <span class="board-column-count">${cards.length}</span>
        </div>
        ${cards
          .map(
            (r) => `
          <div class="board-card" data-id="${r.id}" role="button" tabindex="0">
            <div class="board-card-title">${r.title}</div>
            <div class="board-card-tags">
              <span class="card-tag card-tag-product">${r.product}</span>
              ${badge(`priority-badge priority-${r.priority}`, r.priority)}
              ${badge(`type-label type-${r.type}`, r.type)}
              ${badge(`rat-badge rat-${ratLabel(r)}`, ratLabel(r))}
            </div>
            <div class="board-card-divider"></div>
            <div class="board-card-footer">
              ${ownerChip(r)}
              ${getAction(r) ? `<div class="board-card-action">${actionCell(r)}</div>` : ""}
            </div>
          </div>`
          )
          .join("")}
        ${cards.length === 0 ? `<div class="empty-row" style="padding:24px">暂无需求</div>` : ""}
      </div>`;
  }).join("");
}

// ---------- 渲染:分页 ----------
function renderPagination(total) {
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;

  document.getElementById("total-count").textContent = `共 ${total} 条需求`;

  const el = document.getElementById("pagination");
  let html = `<button class="page-btn" data-page="prev" ${state.page === 1 ? "disabled" : ""}>&lt;</button>`;

  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - state.page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  for (const p of pages) {
    if (p === "...") html += `<span class="page-ellipsis">...</span>`;
    else html += `<button class="page-btn ${p === state.page ? "active" : ""}" data-page="${p}">${p}</button>`;
  }

  html += `<button class="page-btn" data-page="next" ${state.page === totalPages ? "disabled" : ""}>&gt;</button>`;
  el.innerHTML = html;
}

// ---------- 主渲染 ----------
function render() {
  const filtered = getFiltered();

  if (state.view === "list") {
    const start = (state.page - 1) * state.pageSize;
    renderTable(filtered.slice(start, start + state.pageSize));
  } else {
    renderBoard(filtered);
  }
  renderPagination(filtered.length);

  document.getElementById("list-view").hidden = state.view !== "list";
  document.getElementById("board-view").hidden = state.view !== "board";
  document.querySelector(".pagination-bar").hidden = state.view !== "list";

  // 排序箭头方向
  document.querySelectorAll(".th.sortable").forEach((th) => {
    th.classList.toggle("sorted-desc", th.dataset.key === state.sortKey && !state.sortAsc);
  });
}

// ---------- 下拉筛选 ----------
function setupDropdown(btnId, dropdownId, options, getVal, setVal, labelId) {
  const btn = document.getElementById(btnId);
  const dropdown = document.getElementById(dropdownId);

  function renderOptions() {
    dropdown.innerHTML = options
      .map((o) => `<button class="${o === getVal() ? "selected" : ""}" data-value="${o}">${o}</button>`)
      .join("");
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    document.querySelectorAll(".dropdown").forEach((d) => {
      if (d !== dropdown) d.hidden = true;
    });
    renderOptions();
    dropdown.hidden = !dropdown.hidden;
  });

  dropdown.addEventListener("click", (e) => {
    const value = e.target.dataset.value;
    if (!value) return;
    setVal(value);
    document.getElementById(labelId).textContent = value;
    dropdown.hidden = true;
    state.page = 1;
    render();
  });
}

// ---------- 事件绑定 ----------
function init() {
  // 搜索
  document.getElementById("search-input").addEventListener("input", (e) => {
    state.search = e.target.value.trim();
    state.page = 1;
    render();
  });

  // 筛选
  const products = ["全部", ...new Set(getPoolRows().map((r) => r.product))];
  setupDropdown("product-filter-btn", "product-dropdown", products, () => state.product, (v) => (state.product = v), "product-filter-value");

  const priorities = ["全部", "P0", "P1", "P2"];
  setupDropdown("priority-filter-btn", "priority-dropdown", priorities, () => state.priority, (v) => (state.priority = v), "priority-filter-value");

  document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown").forEach((d) => (d.hidden = true));
  });

  // 排序
  document.querySelectorAll(".th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      if (state.sortKey === key) {
        state.sortAsc = !state.sortAsc;
      } else {
        state.sortKey = key;
        state.sortAsc = true;
      }
      render();
    });
  });

  // 视图切换（列表 / 卡片看板独立链接）
  document.getElementById("view-toggle").addEventListener("click", (e) => {
    const btn = e.target.closest(".toggle-btn");
    if (!btn) return;
    e.preventDefault();
    const next = btn.dataset.view === "board" ? "board" : "list";
    if (state.view === next) return;
    state.view = next;
    syncViewToggleUI();
    syncViewUrl(next);
    render();
  });
  syncViewToggleUI();

  // 分页
  document.getElementById("pagination").addEventListener("click", (e) => {
    const btn = e.target.closest(".page-btn");
    if (!btn || btn.disabled) return;
    const p = btn.dataset.page;
    if (p === "prev") state.page -= 1;
    else if (p === "next") state.page += 1;
    else state.page = Number(p);
    render();
  });

  // 演示用按钮
  document.getElementById("btn-export").addEventListener("click", () => alert("演示:导出需求文档"));
  document.getElementById("btn-add").addEventListener("click", openCreateModal);

  // 先渲染列表，避免弹窗初始化异常时整表空白
  render();
  initCreateModal();
  initDetailModal();
  // 深链：pool.html?id=123 直接打开对应需求抽屉
  syncDetailFromUrl();
}

// ---------- 新建需求弹窗 ----------
const OWNERS = [
  { name: "黄志阳", avatar: "assets/avatars/avatar-1.png" },
  { name: "李明", avatar: "assets/avatars/avatar-2.png" },
  { name: "王芳", avatar: "assets/avatars/avatar-3.png" },
  { name: "张伟", avatar: "assets/avatars/avatar-4.png" },
];

const SELECT_OPTIONS = {
  product: ["日活", "搜索", "百宝箱", "时刻", "Note"],
  status: MANUAL_STATUSES.slice(), // 新建仅可选手动状态
  priority: ["P0", "P1", "P2"],
  owner: OWNERS.map((o) => o.name),
};

const SCHEDULE_DATE_IDS = [
  "schedule-prd-start",
  "schedule-prd-end",
  "schedule-ux-start",
  "schedule-ux-end",
  "schedule-ui-start",
  "schedule-ui-end",
  "schedule-dev-start",
  "schedule-dev-end",
  "schedule-test-start",
  "schedule-test-end",
];

const SCHEDULE_PHASES = [
  {
    key: "prd",
    checkId: "schedule-phase-prd",
    startId: "schedule-prd-start",
    endId: "schedule-prd-end",
    startKey: "prdStart",
    endKey: "prdEnd",
    required: false,
  },
  {
    key: "ux",
    checkId: "schedule-phase-ux",
    startId: "schedule-ux-start",
    endId: "schedule-ux-end",
    startKey: "uxStart",
    endKey: "uxEnd",
    required: false,
  },
  {
    key: "ui",
    checkId: "schedule-phase-ui",
    startId: "schedule-ui-start",
    endId: "schedule-ui-end",
    startKey: "uiStart",
    endKey: "uiEnd",
    required: false,
  },
  {
    key: "dev",
    checkId: "schedule-phase-dev",
    startId: "schedule-dev-start",
    endId: "schedule-dev-end",
    startKey: "devStart",
    endKey: "devEnd",
    required: true,
  },
  {
    key: "test",
    checkId: "schedule-phase-test",
    startId: "schedule-test-start",
    endId: "schedule-test-end",
    startKey: "testStart",
    endKey: "testEnd",
    required: true,
  },
];

function fillScheduleDates(dates = {}) {
  document.getElementById("schedule-prd-start").value = dates.prdStart || "";
  document.getElementById("schedule-prd-end").value = dates.prdEnd || "";
  document.getElementById("schedule-ux-start").value = dates.uxStart || "";
  document.getElementById("schedule-ux-end").value = dates.uxEnd || "";
  document.getElementById("schedule-ui-start").value = dates.uiStart || "";
  document.getElementById("schedule-ui-end").value = dates.uiEnd || "";
  document.getElementById("schedule-dev-start").value = dates.devStart || "";
  document.getElementById("schedule-dev-end").value = dates.devEnd || "";
  document.getElementById("schedule-test-start").value = dates.testStart || "";
  document.getElementById("schedule-test-end").value = dates.testEnd || "";
}

function phaseHasDates(dates, phase) {
  return !!(dates && dates[phase.startKey] && dates[phase.endKey]);
}

function hasSchedulePrdDoc() {
  const url = (document.getElementById("schedule-prd-url")?.value || "").trim();
  return !!(url || (schedulePrdFiles && schedulePrdFiles.length));
}

function isSchedulePhaseChecked(phase) {
  const el = document.getElementById(phase.checkId);
  return !!(el && el.checked);
}

function readScheduleDatesFromForm() {
  const dates = {
    prdStart: "",
    prdEnd: "",
    uxStart: "",
    uxEnd: "",
    uiStart: "",
    uiEnd: "",
    devStart: "",
    devEnd: "",
    testStart: "",
    testEnd: "",
  };
  SCHEDULE_PHASES.forEach((phase) => {
    if (!isSchedulePhaseChecked(phase)) return;
    dates[phase.startKey] = document.getElementById(phase.startId).value || "";
    dates[phase.endKey] = document.getElementById(phase.endId).value || "";
  });
  return dates;
}

/** 迭代是否已有排期（以必填的开发+测试为准） */
function iterationHasSchedule(it) {
  const d = it && it.dates;
  return !!(d && d.devStart && d.devEnd && d.testStart && d.testEnd);
}

function phaseNeedKey(phaseKey) {
  if (phaseKey === "prd") return "needPrd";
  if (phaseKey === "ux") return "needUx";
  if (phaseKey === "ui") return "needUi";
  return "";
}

/**
 * 按需求自身的「涉及」标记设置开关。
 * 有时间 ≠ 涉及：不根据日期自动打开选填阶段。
 */
function setSchedulePhaseChecksFromNeeds(row) {
  const prdDoc = hasSchedulePrdDoc();
  SCHEDULE_PHASES.forEach((phase) => {
    const check = document.getElementById(phase.checkId);
    if (!check) return;
    if (phase.required) {
      check.checked = true;
      return;
    }
    if (phase.key === "prd" && prdDoc) {
      check.checked = true;
      return;
    }
    const key = phaseNeedKey(phase.key);
    const val = row && key ? row[key] : undefined;
    check.checked = val === true;
  });
}

/** @deprecated 保留别名，避免旧调用按日期反推涉及 */
function setSchedulePhaseChecksFromDates(_dates = {}) {
  const row = REQUIREMENTS.find((r) => r.id === actionTargetId);
  setSchedulePhaseChecksFromNeeds(row);
}

/** 根据迭代选择 / 涉及开关，同步日期可编辑性与必填星号 */
function syncSchedulePhaseUI() {
  const iterationName = document.getElementById("schedule-iteration")?.value || "";
  const row = REQUIREMENTS.find((r) => r.id === actionTargetId);
  const it = iterationName ? findIteration(iterationName, row && row.product) : null;
  const hasIter = !!iterationName;
  const locked = hasIter && iterationHasSchedule(it);
  const prdDoc = hasSchedulePrdDoc();

  const section = document.getElementById("schedule-section-dates");
  if (section) section.classList.toggle("dates-locked", locked);
  const hint = document.getElementById("schedule-dates-hint");
  const lockedHint = document.getElementById("schedule-dates-locked-hint");
  if (hint) hint.hidden = true;
  if (lockedHint) lockedHint.hidden = !locked;

  SCHEDULE_PHASES.forEach((phase) => {
    const check = document.getElementById(phase.checkId);
    const startEl = document.getElementById(phase.startId);
    const endEl = document.getElementById(phase.endId);
    const dateRow = document.querySelector(`#schedule-phase-list .schedule-date-row[data-phase="${phase.key}"]`);
    if (!check || !startEl || !endEl) return;

    if (phase.required) {
      check.checked = true;
      check.disabled = true;
    } else if (phase.key === "prd" && prdDoc) {
      check.checked = true;
      check.disabled = true;
    } else {
      check.disabled = false;
    }

    const involved = !!check.checked;
    // 选填阶段：勾选涉及后显示必填 *
    if (dateRow && !phase.required) {
      dateRow.querySelectorAll(".schedule-phase-req").forEach((el) => {
        el.hidden = !involved;
      });
    }

    const datesEnabled = hasIter && involved && !locked;
    [startEl, endEl].forEach((el) => {
      el.disabled = !datesEnabled;
      el.classList.toggle("is-readonly", !datesEnabled);
      if (!involved && !locked) el.value = "";
    });
    if (dateRow) {
      dateRow.classList.toggle("is-disabled", !datesEnabled);
      dateRow.classList.toggle("is-na", !involved);
    }
  });
}

function setScheduleDatesLocked(locked) {
  // 兼容旧调用：真正状态由 syncSchedulePhaseUI 按迭代/涉及决定
  if (locked) {
    SCHEDULE_DATE_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.disabled = true;
      el.classList.add("is-readonly");
    });
    const section = document.getElementById("schedule-section-dates");
    if (section) section.classList.add("dates-locked");
    // 日期锁定，但选填「涉及」仍可改
    syncSchedulePhaseUI();
  } else {
    syncSchedulePhaseUI();
  }
}

function applyIterationSelection(name) {
  setSelectValue("schedule-iteration", name || "");
  document.getElementById("schedule-iteration-btn").classList.remove("field-error");
  const row = REQUIREMENTS.find((r) => r.id === actionTargetId);
  const it = findIteration(name, row && row.product);
  const dates = it && it.dates ? it.dates : {};
  fillScheduleDates(dates);
  setSchedulePhaseChecksFromNeeds(row);
  syncSchedulePhaseUI();
}

/** 该产品已有排期的最大迭代号（不含「待填写排期」） */
function getMaxScheduledIterationNum(product) {
  return getSelectableIterations(product).reduce((max, it) => {
    if (iterationHasSchedule(it)) {
      return Math.max(max, iterationNum(it.name));
    }
    return max;
  }, 0);
}

/** 只保留一个最新未排期号；多次点「新增」都落在同一号 */
function ensureNextPendingIteration(product) {
  const maxScheduled = getMaxScheduledIterationNum(product);
  const name = `S${(maxScheduled || 21) + 1}`;
  for (let i = ITERATIONS.length - 1; i >= 0; i--) {
    const it = ITERATIONS[i];
    if (it.product !== product) continue;
    if (!iterationHasSchedule(it) && it.name !== name) ITERATIONS.splice(i, 1);
  }
  upsertIterationCatalog({ product, name, dates: null });
  return name;
}

function createIterationWithoutSchedule() {
  const row = REQUIREMENTS.find((r) => r.id === actionTargetId);
  const product = row && row.product;
  if (!product) return null;
  const name = ensureNextPendingIteration(product);
  setSelectValue("schedule-iteration", name);
  document.getElementById("schedule-iteration-btn").classList.remove("field-error");
  fillScheduleDates({});
  setSchedulePhaseChecksFromNeeds(row);
  syncSchedulePhaseUI();
  return name;
}

let uploadedFiles = [];
let schedulePrdFiles = [];
let actionTargetId = null;

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function anyModalOpen() {
  return ["create-modal", "detail-modal", "review-modal", "schedule-modal"].some((id) => {
    const el = document.getElementById(id);
    return el && !el.hidden;
  });
}

function openCreateModal() {
  resetCreateForm();
  document.getElementById("create-modal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeCreateModal() {
  document.getElementById("create-modal").hidden = true;
  if (!anyModalOpen()) document.body.classList.remove("modal-open");
  document.querySelectorAll(".select-menu").forEach((m) => (m.hidden = true));
}

function resetCreateForm() {
  document.getElementById("create-form").reset();
  document.getElementById("f-title").value = "";
  document.getElementById("f-detail").value = "";
  document.getElementById("f-product").value = "";
  document.getElementById("f-product-text").textContent = "请选择所属产品";
  document.getElementById("f-product-text").classList.add("placeholder");
  document.getElementById("f-status").value = "未启动";
  document.getElementById("f-status-text").textContent = "未启动";
  document.getElementById("f-status-text").classList.remove("placeholder");
  document.getElementById("f-priority").value = "";
  document.getElementById("f-priority-text").textContent = "请选择优先级 (P0/P1/P2)";
  document.getElementById("f-priority-text").classList.add("placeholder");
  document.getElementById("f-owner").value = "";
  document.getElementById("f-owner-text").textContent = "请选择产品负责人";
  document.getElementById("f-owner-text").classList.add("placeholder");
  document.getElementById("f-request-date").value = todayStr();
  document.getElementById("f-deliver-month").value = "";
  document.getElementById("f-version").value = "";
  document.querySelectorAll('input[name="f-type"]').forEach((input) => {
    input.checked = false;
  });
  document.querySelectorAll('input[name="f-value"]').forEach((input) => {
    input.checked = false;
  });
  document.querySelectorAll('input[name="f-analytics"]').forEach((input) => {
    input.checked = false;
  });
  uploadedFiles = [];
  renderUploadList();
  document.querySelectorAll("#create-modal .field-error").forEach((el) => el.classList.remove("field-error"));
}

function setupFormSelect(wrap) {
  const key = wrap.dataset.select;
  const btn = wrap.querySelector(".field-select");
  const menu = wrap.querySelector(".select-menu");
  const hidden = wrap.querySelector('input[type="hidden"]');
  const text = wrap.querySelector(".select-text");
  // 甘特迭代等自定义下拉没有 .field-select，由各自 setup 处理
  if (!btn || !menu || !hidden) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (btn.disabled) return;
    document.querySelectorAll(".select-menu").forEach((m) => {
      if (m !== menu) m.hidden = true;
    });
    const options =
      key === "status" && wrap.closest("#detail-modal")
        ? getAllowedManualStatuses(document.getElementById("d-status").dataset.original || hidden.value)
        : SELECT_OPTIONS[key];
    menu.innerHTML = options
      .map((o) => `<button type="button" class="${o === hidden.value ? "selected" : ""}" data-value="${o}">${o}</button>`)
      .join("");
    menu.hidden = !menu.hidden;
  });

  menu.addEventListener("click", (e) => {
    const value = e.target.dataset.value;
    if (!value) return;
    const prefix = hidden.id;
    if (prefix === "d-owner") setSelectValue("d-owner", value, true);
    else {
      hidden.value = value;
      text.textContent = value;
      text.classList.remove("placeholder");
    }
    menu.hidden = true;
    btn.classList.remove("field-error");
    if (prefix === "d-status") updateStatusSelectStyle();
  });
}

function renderUploadList() {
  const list = document.getElementById("upload-list");
  list.innerHTML = uploadedFiles
    .map((f, i) => `<li><span>${f.name}</span><button type="button" data-index="${i}">移除</button></li>`)
    .join("");
}

function initCreateModal() {
  document.querySelectorAll("#create-modal .select-wrap").forEach(setupFormSelect);

  document.getElementById("modal-close").addEventListener("click", closeCreateModal);
  document.getElementById("modal-cancel").addEventListener("click", closeCreateModal);
  document.getElementById("create-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeCreateModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!document.getElementById("review-modal").hidden) closeReviewModal();
    else if (!document.getElementById("schedule-modal").hidden) closeScheduleModal();
    else if (!document.getElementById("detail-modal").hidden) closeDetailModal();
    else if (!document.getElementById("create-modal").hidden) closeCreateModal();
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".select-menu").forEach((m) => (m.hidden = true));
  });

  const uploadBox = document.getElementById("upload-box");
  const fileInput = document.getElementById("f-file");
  uploadBox.addEventListener("click", () => fileInput.click());
  uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.classList.add("dragover");
  });
  uploadBox.addEventListener("dragleave", () => uploadBox.classList.remove("dragover"));
  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("dragover");
    if (e.dataTransfer.files.length) {
      uploadedFiles.push(...Array.from(e.dataTransfer.files));
      renderUploadList();
    }
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      uploadedFiles.push(...Array.from(fileInput.files));
      renderUploadList();
      fileInput.value = "";
    }
  });
  document.getElementById("upload-list").addEventListener("click", (e) => {
    const idx = e.target.dataset.index;
    if (idx == null) return;
    uploadedFiles.splice(Number(idx), 1);
    renderUploadList();
  });

  document.getElementById("create-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("f-title").value.trim();
    const detail = document.getElementById("f-detail").value.trim();
    const product = document.getElementById("f-product").value;
    const status = document.getElementById("f-status").value;
    const priority = document.getElementById("f-priority").value;
    const typeInput = document.querySelector('input[name="f-type"]:checked');
    const type = typeInput ? typeInput.value : "";
    const valueInput = document.querySelector('input[name="f-value"]:checked');
    const isValue = valueInput ? valueInput.value === "true" : null;
    const analyticsInput = document.querySelector('input[name="f-analytics"]:checked');
    const needAnalytics = analyticsInput ? analyticsInput.value === "true" : null;
    const owner = document.getElementById("f-owner").value;
    const requestDate = document.getElementById("f-request-date").value;
    const deliverMonth = document.getElementById("f-deliver-month").value;
    const version = document.getElementById("f-version").value.trim();

    let valid = true;
    const mark = (id, ok) => {
      const el = document.getElementById(id);
      if (!ok) {
        el.classList.add("field-error");
        valid = false;
      } else el.classList.remove("field-error");
    };
    mark("f-title", !!title);
    mark("f-product-btn", !!product);
    mark("f-status-btn", !!status && MANUAL_STATUSES.includes(status));
    mark("f-priority-btn", !!priority);
    mark("f-owner-btn", !!owner);
    mark("f-request-date", !!requestDate);
    mark("f-deliver-month", !!deliverMonth);
    mark("f-version", !!version);
    const typeGroup = document.getElementById("f-type-group");
    if (!type) {
      typeGroup.classList.add("field-error");
      valid = false;
    } else {
      typeGroup.classList.remove("field-error");
    }
    const valueGroup = document.getElementById("f-value-group");
    if (isValue === null) {
      valueGroup.classList.add("field-error");
      valid = false;
    } else {
      valueGroup.classList.remove("field-error");
    }
    const analyticsGroup = document.getElementById("f-analytics-group");
    if (needAnalytics === null) {
      analyticsGroup.classList.add("field-error");
      valid = false;
    } else {
      analyticsGroup.classList.remove("field-error");
    }
    if (!valid) return;

    const ownerInfo = OWNERS.find((o) => o.name === owner) || OWNERS[0];
    const nextId = REQUIREMENTS.reduce((m, r) => Math.max(m, r.id), 0) + 1;
    REQUIREMENTS.unshift({
      id: nextId,
      title,
      detail: detail || `${title}：待补充需求背景、用户诉求与落地价值。`,
      product,
      status,
      priority,
      type,
      isValue,
      needAnalytics,
      owner,
      avatar: ownerInfo.avatar,
      requestDate,
      deliverMonth,
      version,
      reviewResult: null,
      reqLevel: "IR",
      parentId: null,
      attachments: uploadedFiles.map((f) => ({ name: f.name, size: formatSize(f.size) })),
    });
    closeCreateModal();
    state.page = 1;
    render();
  });
}

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function defaultDetail(title) {
  return `围绕「${title}」开展落地：梳理用户诉求与业务背景，明确价值点与验收标准，并协同研发推进排期与交付。`;
}

// ---------- 需求详情弹窗 ----------
let editingId = null;
let detailAttachments = [];
let detailAiPrdFiles = [];

function renderReviewResultDisplay(result) {
  const field = document.getElementById("d-review-result-field");
  const el = document.getElementById("d-review-result");
  if (!result) {
    field.hidden = true;
    el.innerHTML = "";
    return;
  }
  field.hidden = false;
  el.innerHTML = `<span class="review-badge review-${result}">${result}</span>`;
}

function setStatusFieldLocked(locked, status) {
  const btn = document.getElementById("d-status-btn");
  const hint = document.getElementById("d-status-lock-hint");
  btn.disabled = locked;
  btn.classList.toggle("field-locked", locked);
  if (hint) hint.hidden = !locked;
  setSelectValue("d-status", status);
  document.getElementById("d-status").dataset.original = status;
}

function renderDetailAiPrdList() {
  const list = document.getElementById("d-ai-prd-list");
  list.innerHTML = detailAiPrdFiles
    .map((f, i) => {
      const isPdf = /\.pdf$/i.test(f.name);
      return `<li class="file-item">
        <div class="file-info">
          <span class="file-icon ${isPdf ? "pdf" : "file"}">${isPdf ? "PDF" : "FILE"}</span>
          <div class="file-text">
            <p class="file-name">${f.name}</p>
            <p class="file-size">${f.size || ""}</p>
          </div>
        </div>
        <button type="button" class="file-delete" data-index="${i}">删除</button>
      </li>`;
    })
    .join("");
}

function renderDetailScheduleInfo(row) {
  const wrap = document.getElementById("d-schedule-info");
  // AI PRD / Demo / 埋点仅在排期时填写，详情里只对已排期及之后展示
  const isScheduled = typeof SCHEDULED_STATUSES !== "undefined" && SCHEDULED_STATUSES.includes(row.status);
  wrap.hidden = !isScheduled;
  if (!isScheduled) {
    detailAiPrdFiles = [];
    document.getElementById("d-ai-track-field").hidden = true;
    renderDetailGantt(row);
    // TOS 已提醒排期但尚未进排期态：仍展示是否涉及 PRD/UX/UI
    if (isTosType(row) && row.schedulePrepared) {
      applyDetailPhaseNeedsFromRow(row);
      syncDetailPhaseNeedsEnabled();
    }
    return;
  }

  const hasTrack = !!(row.aiTrackUrl && String(row.aiTrackUrl).trim());
  document.getElementById("d-req-code").value = row.reqCode || "";
  const prdInput = document.getElementById("d-prd-url");
  prdInput.value = row.prdUrl || "";
  prdInput.readOnly = true;
  document.getElementById("d-prd-url-edit").hidden = false;
  const demoInput = document.getElementById("d-ai-demo");
  demoInput.value = row.aiDemoUrl || "";
  demoInput.readOnly = true;
  document.getElementById("d-ai-demo-edit").hidden = false;
  detailAiPrdFiles = (row.aiPrdFiles || []).map((f) => ({ ...f }));
  renderDetailAiPrdList();

  // 已排期及之后：始终可添加/编辑埋点链接；无链接时直接可填
  const trackField = document.getElementById("d-ai-track-field");
  const trackInput = document.getElementById("d-ai-track");
  const trackEditBtn = document.getElementById("d-ai-track-edit");
  trackField.hidden = false;
  trackInput.value = row.aiTrackUrl || "";
  if (hasTrack) {
    trackInput.readOnly = true;
    trackEditBtn.hidden = false;
  } else {
    trackInput.readOnly = false;
    trackEditBtn.hidden = true;
  }

  renderDetailGantt(row);
}

const DETAIL_GANTT_PHASES = [
  { key: "prd", label: "PRD", start: "prdStart", end: "prdEnd", cls: "phase-prd", needKey: "needPrd", optional: true },
  { key: "ux", label: "UX", start: "uxStart", end: "uxEnd", cls: "phase-ux", needKey: "needUx", optional: true },
  { key: "ui", label: "UI", start: "uiStart", end: "uiEnd", cls: "phase-ui", needKey: "needUi", optional: true },
  { key: "dev", label: "开发", start: "devStart", end: "devEnd", cls: "phase-dev", optional: false },
  { key: "test", label: "测试", start: "testStart", end: "testEnd", cls: "phase-test", optional: false },
];

const DETAIL_NEED_CHECK_IDS = {
  prd: "d-need-prd",
  ux: "d-need-ux",
  ui: "d-need-ui",
};

/** 补阶段默认跨度（起止相差天数） */
const DETAIL_PHASE_SUGGEST_SPAN = { prd: 9, ux: 5, ui: 1 };

let swapEditMode = false;
let swapEditBaselineIteration = "";
let swapEditBaselineNeeds = null;

function getEffectiveNeedRow(row) {
  if (!row) return null;
  if (typeof isIR === "function" && isIR(row) && typeof isSR === "function") {
    const child = REQUIREMENTS.find((r) => isSR(r) && r.parentId === row.id);
    if (child) return child;
  }
  return row;
}

/** IR 显式 need*（去排期/提醒项管）优先；否则看落地 SR/自身 */
function getPhaseNeedValue(row, needKey) {
  if (!row || !needKey) return false;
  if (row[needKey] === true || row[needKey] === false) return row[needKey] === true;
  const src = getEffectiveNeedRow(row) || row;
  if (src !== row && (src[needKey] === true || src[needKey] === false)) {
    return src[needKey] === true;
  }
  return false;
}

function hasDetailPrdDoc() {
  const url = (document.getElementById("d-prd-url")?.value || "").trim();
  return !!(url || (detailAiPrdFiles && detailAiPrdFiles.length));
}

function readDetailPhaseNeeds() {
  return {
    prd: !!document.getElementById("d-need-prd")?.checked,
    ux: !!document.getElementById("d-need-ux")?.checked,
    ui: !!document.getElementById("d-need-ui")?.checked,
    dev: true,
    test: true,
  };
}

/** 详情展示用涉及：有文档则视为涉及 PRD；其余仅认 need* */
function resolveDetailPhaseNeeds(row) {
  return {
    prd: getPhaseNeedValue(row, "needPrd") || hasDetailPrdDoc(),
    ux: getPhaseNeedValue(row, "needUx"),
    ui: getPhaseNeedValue(row, "needUi"),
    dev: true,
    test: true,
  };
}

function phaseHasScheduleDates(dates, phase) {
  return !!(dates && dates[phase.start] && dates[phase.end]);
}

function applyDetailPhaseNeedsFromRow(row) {
  const needs = resolveDetailPhaseNeeds(row);

  DETAIL_GANTT_PHASES.forEach((phase) => {
    if (!phase.optional) return;
    const check = document.getElementById(DETAIL_NEED_CHECK_IDS[phase.key]);
    if (!check) return;
    // 有时间 ≠ 涉及：仅认显式 need* / 文档，未设置则默认不涉及
    check.checked = !!needs[phase.key];
  });
}

function syncDetailPhaseNeedsEnabled() {
  const row = REQUIREMENTS.find((r) => r.id === editingId);
  const tos = !!(row && isTosType(row));
  // 敏捷可改涉及；TOS 在详情只读展示（改涉及走去排期）
  const editable = !!(row && !tos);
  const prdDoc = hasDetailPrdDoc();
  const section = document.getElementById("d-phase-needs-section");
  if (section) {
    const gantt = document.getElementById("d-gantt-section");
    const ganttVisible = !!(gantt && !gantt.hidden);
    // TOS：有甘特，或已提醒排期（尚无甘特）时也要能看到是否涉及
    const show = !!(row && (ganttVisible || (tos && row.schedulePrepared)));
    section.hidden = !show;
  }

  DETAIL_GANTT_PHASES.forEach((phase) => {
    if (!phase.optional) return;
    const check = document.getElementById(DETAIL_NEED_CHECK_IDS[phase.key]);
    if (!check) return;
    if (phase.key === "prd" && prdDoc) {
      check.checked = true;
      check.disabled = true;
      return;
    }
    check.disabled = !editable;
  });
}

/** 当前详情迭代排期是否锁定（迭代已有开发+测试日期，同去排期） */
function isDetailScheduleDatesLocked(row) {
  if (!row) return false;
  const name = document.getElementById("swap-iteration")?.value || row.iteration || "";
  if (!name) return false;
  const it = findIteration(name, row.product);
  return iterationHasSchedule(it);
}

/** 取消涉及时清空该阶段草稿日期（迭代已锁定则不清，同去排期） */
function clearDetailPhaseDraftDates(phaseKey, { force = false } = {}) {
  const row = REQUIREMENTS.find((r) => r.id === editingId);
  if (!force && isDetailScheduleDatesLocked(row)) return;
  const startEl = document.getElementById(`swap-${phaseKey}-start`);
  const endEl = document.getElementById(`swap-${phaseKey}-end`);
  if (startEl) startEl.value = "";
  if (endEl) endEl.value = "";
}

/**
 * 为缺失的选填阶段建议日期：插在「下一已有阶段」之前。
 * 例：仅有开发+测试时勾选 UX → UX 结束=开发开始前一天，开始再往前推若干天。
 */
function suggestMissingPhaseDates(baseDates, needs) {
  const out = { ...(baseDates || {}) };
  const order = DETAIL_GANTT_PHASES;

  order.forEach((phase, idx) => {
    if (!phase.optional) return;
    if (!needs[phase.key]) return;
    if (phaseHasScheduleDates(out, phase)) return;

    const span = DETAIL_PHASE_SUGGEST_SPAN[phase.key] ?? 5;
    let nextStart = "";
    for (let i = idx + 1; i < order.length; i++) {
      const n = order[i];
      if (out[n.start]) {
        nextStart = out[n.start];
        break;
      }
    }
    let prevEnd = "";
    for (let i = idx - 1; i >= 0; i--) {
      const p = order[i];
      if (out[p.end]) {
        prevEnd = out[p.end];
        break;
      }
    }

    if (nextStart) {
      out[phase.end] = addDaysISO(nextStart, -1);
      out[phase.start] = addDaysISO(out[phase.end], -span);
    } else if (prevEnd) {
      out[phase.start] = addDaysISO(prevEnd, 1);
      out[phase.end] = addDaysISO(out[phase.start], span);
    }
  });

  return out;
}

function mergeSwapFormIntoDates(baseDates) {
  const form = readSwapScheduleDates();
  const merged = { ...(baseDates || {}) };
  Object.entries(form).forEach(([k, v]) => {
    if (v) merged[k] = v;
  });
  return merged;
}

function detailNeedsMissingDates(dates, needs) {
  return DETAIL_GANTT_PHASES.some(
    (p) => p.optional && needs[p.key] && !phaseHasScheduleDates(dates, p)
  );
}

function applySuggestedDatesToSwapForm(dates, needs) {
  DETAIL_GANTT_PHASES.forEach((phase) => {
    if (!phase.optional || !needs[phase.key]) return;
    const startEl = document.getElementById(`swap-${phase.key}-start`);
    const endEl = document.getElementById(`swap-${phase.key}-end`);
    if (!startEl || !endEl) return;
    if (!startEl.value && dates[phase.start]) startEl.value = dates[phase.start];
    if (!endEl.value && dates[phase.end]) endEl.value = dates[phase.end];
  });
  // 开发/测试若表单空也带上，便于预览与校验
  ["dev", "test"].forEach((key) => {
    const startEl = document.getElementById(`swap-${key}-start`);
    const endEl = document.getElementById(`swap-${key}-end`);
    const phase = DETAIL_GANTT_PHASES.find((p) => p.key === key);
    if (!startEl || !endEl || !phase) return;
    if (!startEl.value && dates[phase.start]) startEl.value = dates[phase.start];
    if (!endEl.value && dates[phase.end]) endEl.value = dates[phase.end];
  });
}

function persistDetailPhaseNeeds(row, needs) {
  const targets = [];
  if (typeof isIR === "function" && isIR(row) && typeof isSR === "function") {
    targets.push(...REQUIREMENTS.filter((r) => isSR(r) && r.parentId === row.id));
  }
  if (!targets.length) targets.push(row);

  targets.forEach((t) => {
    t.needPrd = !!needs.prd;
    t.needUx = !!needs.ux;
    t.needUi = !!needs.ui;
  });
  if (typeof isIR === "function" && isIR(row)) {
    row.needPrd = !!needs.prd;
    row.needUx = !!needs.ux;
    row.needUi = !!needs.ui;
  }
}

function isSwapEditPristine() {
  const row = REQUIREMENTS.find((r) => r.id === editingId);
  if (!row) return true;
  const reason = document.getElementById("swap-reason")?.value.trim() || "";
  if (reason) return false;
  const selected = document.getElementById("swap-iteration")?.value || "";
  if (selected && selected !== (swapEditBaselineIteration || row.iteration || "")) return false;
  const draft = readSwapScheduleDates();
  if (Object.values(draft).some((v) => !!v)) return false;
  if (swapEditBaselineNeeds) {
    const cur = readDetailPhaseNeeds();
    if (
      cur.prd !== swapEditBaselineNeeds.prd ||
      cur.ux !== swapEditBaselineNeeds.ux ||
      cur.ui !== swapEditBaselineNeeds.ui
    ) {
      return false;
    }
  }
  return true;
}

function tryCollapseSwapEdit() {
  if (!swapEditMode) return;
  if (!isSwapEditPristine()) return;
  closeSwapPanel();
}

function setGanttIterationControlsEnabled(canChangeIteration) {
  const btn = document.getElementById("swap-iteration-btn");
  const addBtn = document.getElementById("swap-iteration-add");
  // 触发器始终可点：TOS 仅打开原因面板，非 TOS 可换迭代
  if (btn) btn.disabled = false;
  if (addBtn) addBtn.disabled = !canChangeIteration;
  if (!canChangeIteration) {
    const menu = document.getElementById("swap-iteration-menu");
    if (menu) menu.hidden = true;
    btn?.classList.remove("is-open");
    btn?.setAttribute("aria-expanded", "false");
  }
}

function syncGanttIterationPlain(name) {
  setSelectValue("swap-iteration", name || "");
}

/** @deprecated alias kept for older call sites */
function setGanttIterationSelectEnabled(enabled) {
  setGanttIterationControlsEnabled(enabled);
}

function fillSwapScheduleDates(dates = {}) {
  document.getElementById("swap-prd-start").value = dates.prdStart || "";
  document.getElementById("swap-prd-end").value = dates.prdEnd || "";
  document.getElementById("swap-ux-start").value = dates.uxStart || "";
  document.getElementById("swap-ux-end").value = dates.uxEnd || "";
  document.getElementById("swap-ui-start").value = dates.uiStart || "";
  document.getElementById("swap-ui-end").value = dates.uiEnd || "";
  document.getElementById("swap-dev-start").value = dates.devStart || "";
  document.getElementById("swap-dev-end").value = dates.devEnd || "";
  document.getElementById("swap-test-start").value = dates.testStart || "";
  document.getElementById("swap-test-end").value = dates.testEnd || "";
}

function readSwapScheduleDates() {
  return {
    prdStart: document.getElementById("swap-prd-start").value,
    prdEnd: document.getElementById("swap-prd-end").value,
    uxStart: document.getElementById("swap-ux-start").value,
    uxEnd: document.getElementById("swap-ux-end").value,
    uiStart: document.getElementById("swap-ui-start").value,
    uiEnd: document.getElementById("swap-ui-end").value,
    devStart: document.getElementById("swap-dev-start").value,
    devEnd: document.getElementById("swap-dev-end").value,
    testStart: document.getElementById("swap-test-start").value,
    testEnd: document.getElementById("swap-test-end").value,
  };
}

function clearSwapScheduleDateErrors() {
  [
    "swap-prd-start",
    "swap-prd-end",
    "swap-ux-start",
    "swap-ux-end",
    "swap-ui-start",
    "swap-ui-end",
    "swap-dev-start",
    "swap-dev-end",
    "swap-test-start",
    "swap-test-end",
  ].forEach((id) => document.getElementById(id)?.classList.remove("field-error"));
}

function validateSwapScheduleDates(dates, needs = { prd: true, ux: true, ui: true, dev: true, test: true }) {
  clearSwapScheduleDateErrors();
  const required = [
    ["swap-dev-start", dates.devStart],
    ["swap-dev-end", dates.devEnd],
    ["swap-test-start", dates.testStart],
    ["swap-test-end", dates.testEnd],
  ];
  if (needs.prd) {
    required.push(["swap-prd-start", dates.prdStart], ["swap-prd-end", dates.prdEnd]);
  }
  if (needs.ux) {
    required.push(["swap-ux-start", dates.uxStart], ["swap-ux-end", dates.uxEnd]);
  }
  if (needs.ui) {
    required.push(["swap-ui-start", dates.uiStart], ["swap-ui-end", dates.uiEnd]);
  }
  let ok = true;
  required.forEach(([id, val]) => {
    if (!val) {
      document.getElementById(id)?.classList.add("field-error");
      ok = false;
    }
  });
  return ok;
}

function setGanttDatesFormVisible(visible) {
  const form = document.getElementById("d-gantt-dates-form");
  // 日期改在甘特行内下划线填写；隐藏表单仅作取值容器，始终不参与布局
  if (form) {
    form.hidden = true;
    form.dataset.active = visible ? "1" : "";
    form.setAttribute("aria-hidden", "true");
  }
}

/** 仅滚动详情抽屉 body，避免 scrollIntoView 在 transform 抽屉上撑破布局 */
function scrollDetailDrawerTo(el, { behavior = "smooth", offset = 12 } = {}) {
  const body = document.getElementById("detail-form");
  if (!body || !el || body.hidden) return;
  const bodyRect = body.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const nextTop = body.scrollTop + (elRect.top - bodyRect.top) - offset;
  const maxTop = Math.max(0, body.scrollHeight - body.clientHeight);
  body.scrollTo({ top: Math.max(0, Math.min(nextTop, maxTop)), behavior });
}

function renderDateCell(p, dates, { editable, involved }) {
  if (!involved) {
    return `<span class="detail-mini-gantt-dates">不涉及</span>`;
  }
  const s = (dates && dates[p.start]) || "";
  const e = (dates && dates[p.end]) || "";
  if (editable) {
    const startId = `swap-${p.key}-start`;
    const endId = `swap-${p.key}-end`;
    const startErr = document.getElementById(startId)?.classList.contains("field-error") ? " field-error" : "";
    const endErr = document.getElementById(endId)?.classList.contains("field-error") ? " field-error" : "";
    return `<span class="detail-mini-gantt-dates is-edit">
      <input class="detail-gantt-date-underline${startErr}" type="date" data-swap-id="${startId}" value="${s}" aria-label="${p.label}开始时间" />
      <span class="detail-mini-gantt-dates-sep">~</span>
      <input class="detail-gantt-date-underline${endErr}" type="date" data-swap-id="${endId}" value="${e}" aria-label="${p.label}结束时间" />
    </span>`;
  }
  if (!s || !e) {
    return `<span class="detail-mini-gantt-dates">未排期</span>`;
  }
  return `<span class="detail-mini-gantt-dates">${s} ~ ${e}</span>`;
}

function renderMiniGanttBars(dates, needs, options = {}) {
  const ganttEl = document.getElementById("d-mini-gantt");
  if (!ganttEl) return;

  const phaseNeeds = needs || { prd: true, ux: true, ui: true, dev: true, test: true };
  const editable = !!options.editable;
  const clearBars = !!options.clearBars;
  const range = clearBars ? { start: "", end: "" } : getGanttVisibleRange(dates);
  const rangeStart = range.start;
  const rangeEnd = range.end;
  const hasTimeline = !!(rangeStart && rangeEnd);
  const totalDays = hasTimeline ? Math.max(1, daysBetween(rangeStart, rangeEnd)) : 1;

  ganttEl.hidden = false;
  ganttEl.innerHTML = DETAIL_GANTT_PHASES.map((p) => {
    const involved = !p.optional || !!phaseNeeds[p.key];
    const s = dates && dates[p.start];
    const e = dates && dates[p.end];
    const showBar = involved && hasTimeline && s && e;
    let barHtml = "";
    if (showBar) {
      const left = (daysBetween(rangeStart, s) / totalDays) * 100;
      const width = (Math.max(1, daysBetween(s, e) + 1) / (totalDays + 1)) * 100;
      barHtml = `<div class="detail-mini-gantt-bar gantt-bar ${p.cls}" style="left:${Math.max(0, left)}%;width:${Math.min(100 - left, width)}%"></div>`;
    }
    const indicatorCls = involved && s && e ? p.cls : `${p.cls} is-empty`;
    return `<div class="detail-mini-gantt-row${involved ? "" : " is-na"}" data-phase="${p.key}">
      <span class="detail-mini-gantt-label">${p.label}</span>
      <span class="detail-mini-gantt-indicator ${indicatorCls}" aria-hidden="true"></span>
      <div class="detail-mini-gantt-track">${barHtml}</div>
      ${renderDateCell(p, dates, { editable: editable && involved, involved })}
    </div>`;
  }).join("");
}

/** 排期时间轴起点：PRD 可选，回退到最早有值的阶段 */
function getScheduleTimelineStart(dates) {
  if (!dates) return "";
  return dates.prdStart || dates.uxStart || dates.uiStart || dates.devStart || dates.testStart || "";
}

/** 甘特预览轴：按已填起止动态取最早开始、最晚结束（不必等测试结束） */
function getGanttVisibleRange(dates) {
  if (!dates) return { start: "", end: "" };
  let start = "";
  let end = "";
  DETAIL_GANTT_PHASES.forEach((p) => {
    const s = dates[p.start];
    const e = dates[p.end];
    if (s && (!start || s < start)) start = s;
    if (e && (!end || e > end)) end = e;
  });
  if (!start || !end) return { start: "", end: "" };
  if (end < start) end = start;
  return { start, end };
}

function scheduleHasTimeline(dates) {
  return !!(dates && getScheduleTimelineStart(dates) && dates.testEnd);
}

/** 详情甘特用的排期：SR 用自身；IR 取子 SR / 所属迭代 */
function getRowScheduleDates(row) {
  if (!row) return null;
  if (scheduleHasTimeline(row.scheduleDates)) return row.scheduleDates;

  if (typeof isIR === "function" && isIR(row) && typeof isSR === "function") {
    const children = REQUIREMENTS.filter((r) => isSR(r) && r.parentId === row.id);
    const childWithDates = children.find((r) => scheduleHasTimeline(r.scheduleDates));
    if (childWithDates) return childWithDates.scheduleDates;
    const iterName = row.iteration || (children[0] && children[0].iteration) || "";
    const it = findIteration(iterName, row.product);
    if (it && scheduleHasTimeline(it.dates)) return it.dates;
  }

  if (row.iteration) {
    const it = findIteration(row.iteration, row.product);
    if (it && scheduleHasTimeline(it.dates)) return it.dates;
  }
  return null;
}

function getPreviewIterationDates(row, iterationName) {
  if (!row) return null;
  if (!iterationName || iterationName === row.iteration) {
    return getRowScheduleDates(row);
  }
  const it = findIteration(iterationName, row.product);
  return it && scheduleHasTimeline(it.dates) ? it.dates : null;
}

function refreshGanttPreview() {
  const row = REQUIREMENTS.find((r) => r.id === editingId);
  if (!row) return;
  const name = document.getElementById("swap-iteration")?.value || row.iteration || "";
  const baseDates = getPreviewIterationDates(row, name) || {};
  // 敏捷改迭代时跟勾选；只读/TOS 用数据上的 need*，甘特右侧显示「不涉及」
  const needs =
    swapEditMode && !isTosType(row) ? readDetailPhaseNeeds() : resolveDetailPhaseNeeds(row);
  const iterChanged = !!(swapEditMode && name && name !== (row.iteration || ""));
  const targetHasSchedule = scheduleHasTimeline(baseDates) && iterationHasSchedule({ dates: baseDates });
  const isNewEmptyIter = !!(swapEditMode && iterChanged && !targetHasSchedule);

  if (swapEditMode && !isTosType(row)) {
    let dates = mergeSwapFormIntoDates(baseDates);
    if (!isNewEmptyIter) {
      dates = suggestMissingPhaseDates(dates, needs);
    }

    const needDateForm = isNewEmptyIter || detailNeedsMissingDates(mergeSwapFormIntoDates(baseDates), needs);

    if (needDateForm) {
      if (!isNewEmptyIter) {
        applySuggestedDatesToSwapForm(dates, needs);
        dates = mergeSwapFormIntoDates(baseDates);
        dates = suggestMissingPhaseDates(dates, needs);
      }
      setGanttDatesFormVisible(true);
      const preview = { ...dates };
      DETAIL_GANTT_PHASES.forEach((p) => {
        if (p.optional && !needs[p.key]) {
          preview[p.start] = "";
          preview[p.end] = "";
        }
      });
      const formDates = readSwapScheduleDates();
      const formFilled = Object.values(formDates).some((v) => !!v);
      const showDates = isNewEmptyIter && !formFilled ? {} : preview;
      renderMiniGanttBars(showDates, needs, {
        editable: true,
        // 新建空迭代且尚未填任何日期时清空色条；一旦有日期即按已填起止即时着色
        clearBars: isNewEmptyIter && !formFilled,
      });
    } else {
      setGanttDatesFormVisible(false);
      clearSwapScheduleDateErrors();
      renderMiniGanttBars(dates, needs, { editable: false, clearBars: false });
    }
  } else {
    setGanttDatesFormVisible(false);
    clearSwapScheduleDateErrors();
    renderMiniGanttBars(baseDates, needs, {
      editable: false,
      clearBars: false,
    });
  }

  syncDetailPhaseNeedsEnabled();
}

/** 仅根据当前表单值重绘色条，避免打断行内日期输入焦点 */
function repaintMiniGanttBarsFromForm() {
  const row = REQUIREMENTS.find((r) => r.id === editingId);
  if (!row || !swapEditMode) return;
  const name = document.getElementById("swap-iteration")?.value || row.iteration || "";
  const baseDates = getPreviewIterationDates(row, name) || {};
  const needs = readDetailPhaseNeeds();
  const iterChanged = !!(name && name !== (row.iteration || ""));
  const targetHasSchedule = scheduleHasTimeline(baseDates) && iterationHasSchedule({ dates: baseDates });
  const isNewEmptyIter = iterChanged && !targetHasSchedule;
  let dates = mergeSwapFormIntoDates(isNewEmptyIter ? {} : baseDates);
  if (!isNewEmptyIter) dates = suggestMissingPhaseDates(dates, needs);
  DETAIL_GANTT_PHASES.forEach((p) => {
    if (p.optional && !needs[p.key]) {
      dates[p.start] = "";
      dates[p.end] = "";
    }
  });
  const range = getGanttVisibleRange(dates);
  const rangeStart = range.start;
  const rangeEnd = range.end;
  const hasTimeline = !!(rangeStart && rangeEnd);
  const totalDays = hasTimeline ? Math.max(1, daysBetween(rangeStart, rangeEnd)) : 1;
  const ganttEl = document.getElementById("d-mini-gantt");
  if (!ganttEl) return;

  DETAIL_GANTT_PHASES.forEach((p) => {
    const rowEl = ganttEl.querySelector(`.detail-mini-gantt-row[data-phase="${p.key}"]`);
    if (!rowEl) return;
    const involved = !p.optional || !!needs[p.key];
    const s = dates[p.start];
    const e = dates[p.end];
    const track = rowEl.querySelector(".detail-mini-gantt-track");
    const indicator = rowEl.querySelector(".detail-mini-gantt-indicator");
    if (track) {
      if (involved && hasTimeline && s && e) {
        const left = (daysBetween(rangeStart, s) / totalDays) * 100;
        const width = (Math.max(1, daysBetween(s, e) + 1) / (totalDays + 1)) * 100;
        track.innerHTML = `<div class="detail-mini-gantt-bar gantt-bar ${p.cls}" style="left:${Math.max(0, left)}%;width:${Math.min(100 - left, width)}%"></div>`;
      } else {
        track.innerHTML = "";
      }
    }
    if (indicator) {
      indicator.className = `detail-mini-gantt-indicator ${
        involved && s && e ? p.cls : `${p.cls} is-empty`
      }`;
    }
  });
}

function renderLatestScheduleReason(row) {
  const reasonEl = document.getElementById("d-gantt-latest-reason");
  if (!reasonEl) return;

  const latest = getLatestScheduleChange(row);
  reasonEl.replaceChildren();

  if (!latest || !latest.reason) {
    reasonEl.hidden = true;
    return;
  }

  reasonEl.hidden = false;
  reasonEl.appendChild(document.createTextNode(`最近变更（${latest.time} · `));

  if (latest.type === "tos_remind") {
    const remindBtn = document.createElement("button");
    remindBtn.type = "button";
    remindBtn.className = "detail-gantt-remind-link";
    remindBtn.textContent = "提醒项管";
    reasonEl.appendChild(remindBtn);
  } else if (latest.type === "schedule_patch") {
    reasonEl.appendChild(document.createTextNode("更新排期阶段"));
  } else {
    const action = `置换 ${latest.fromIteration || "-"} → ${latest.toIteration || "-"}`;
    reasonEl.appendChild(document.createTextNode(action));
  }

  reasonEl.appendChild(document.createTextNode(`）：${latest.reason}`));
}

function remindPmAgain() {
  const row = REQUIREMENTS.find((r) => r.id === editingId);
  if (!row) return;

  const latest = getLatestScheduleChange(row);
  if (!latest || !latest.reason || latest.type !== "tos_remind") return;

  pushScheduleChange(row, {
    type: "tos_remind",
    fromIteration: row.iteration || "",
    toIteration: "",
    reason: latest.reason,
    operator: row.owner,
  });
  notifyPmIterationChange(row, latest.reason);
  renderLatestScheduleReason(row);
}

function isRowGanttVisible(row) {
  return (
    row &&
    typeof SCHEDULED_STATUSES !== "undefined" &&
    SCHEDULED_STATUSES.includes(row.status) &&
    !!getRowScheduleDates(row)
  );
}

function resetSwapPanelState() {
  swapEditMode = false;
  swapEditBaselineIteration = "";
  swapEditBaselineNeeds = null;
  const panel = document.getElementById("d-swap-panel");
  if (panel) panel.hidden = true;
  const menu = document.getElementById("swap-iteration-menu");
  if (menu) menu.hidden = true;
  document.getElementById("swap-iteration-btn")?.classList.remove("is-open");
  document.getElementById("swap-iteration-btn")?.setAttribute("aria-expanded", "false");
  setGanttDatesFormVisible(false);
  fillSwapScheduleDates({});
  clearSwapScheduleDateErrors();
}

function renderDetailGantt(row) {
  const section = document.getElementById("d-gantt-section");
  const involveSection = document.getElementById("d-phase-needs-section");
  const isScheduled = isRowGanttVisible(row);

  if (!section) return;
  section.hidden = !isScheduled;
  if (!isScheduled) {
    resetSwapPanelState();
    // 未进排期态时默认藏涉及；TOS 已提醒排期由外层 syncDetailPhaseNeedsEnabled 再打开
    if (involveSection && !(isTosType(row) && row.schedulePrepared)) {
      involveSection.hidden = true;
    }
    return;
  }

  // IR 可能本身无 iteration，用子 SR / 排期反推展示
  let iterName = row.iteration || "";
  if (!iterName && typeof isIR === "function" && isIR(row) && typeof isSR === "function") {
    const child = REQUIREMENTS.find((r) => isSR(r) && r.parentId === row.id && r.iteration);
    if (child) iterName = child.iteration;
  }

  const tos = isTosType(row);
  if (!swapEditMode) {
    setSelectValue("swap-iteration", iterName);
    setGanttIterationControlsEnabled(!tos);
    setGanttDatesFormVisible(false);
    fillSwapScheduleDates({});
    applyDetailPhaseNeedsFromRow(row);
  } else {
    setGanttIterationControlsEnabled(!tos);
  }

  refreshGanttPreview();
  // TOS 也展示涉及阶段（只读）；可见性由 syncDetailPhaseNeedsEnabled 统一处理
  if (involveSection && tos && isScheduled) {
    applyDetailPhaseNeedsFromRow(row);
    syncDetailPhaseNeedsEnabled();
  }
  renderLatestScheduleReason(row);
}

function syncSwapReasonPanelVisibility() {
  const panel = document.getElementById("d-swap-panel");
  const row = REQUIREMENTS.find((r) => r.id === editingId);
  if (!panel) return;
  if (!row || !swapEditMode) {
    panel.hidden = true;
    return;
  }
  // TOS：只能填原因提醒项管
  if (isTosType(row)) {
    panel.hidden = false;
    return;
  }
  const selected = document.getElementById("swap-iteration")?.value || "";
  const current = row.iteration || "";
  const iterChanged = !!(selected && selected !== current);
  const needs = readDetailPhaseNeeds();
  const needsChanged =
    !!swapEditBaselineNeeds &&
    (needs.prd !== swapEditBaselineNeeds.prd ||
      needs.ux !== swapEditBaselineNeeds.ux ||
      needs.ui !== swapEditBaselineNeeds.ui);
  const baseDates = getPreviewIterationDates(row, selected || current) || {};
  const missingPhaseDates = detailNeedsMissingDates(mergeSwapFormIntoDates(baseDates), needs);
  // 换迭代 / 改涉及并需补日期时展示修改原因
  panel.hidden = !(iterChanged || (needsChanged && missingPhaseDates) || (needsChanged && Object.values(readSwapScheduleDates()).some(Boolean)));
}

function openSwapPanel({ openMenu = false, showReason = false } = {}) {
  const row = REQUIREMENTS.find((r) => r.id === editingId);
  const panel = document.getElementById("d-swap-panel");
  if (!row || !panel) return;

  const tos = isTosType(row);
  const wasEditing = swapEditMode;
  if (!wasEditing) {
    swapEditMode = true;
    swapEditBaselineIteration = row.iteration || "";
    applyDetailPhaseNeedsFromRow(row);
    swapEditBaselineNeeds = readDetailPhaseNeeds();
    document.getElementById("swap-tos-banner").hidden = !tos;

    setSelectValue("swap-iteration", row.iteration || "");
    setGanttIterationControlsEnabled(!tos);
    fillSwapScheduleDates({});
    clearSwapScheduleDateErrors();
    setGanttDatesFormVisible(false);
    document.getElementById("swap-iteration-btn").classList.remove("field-error");
    document.getElementById("swap-reason").value = "";
    document.getElementById("swap-reason").classList.remove("field-error");

    const latest = getLatestScheduleChange(row);
    const hint = document.getElementById("swap-latest-reason-hint");
    if (latest && latest.reason) {
      hint.hidden = false;
      hint.textContent = `上次原因：${latest.reason}`;
    } else {
      hint.hidden = true;
      hint.textContent = "";
    }

    refreshGanttPreview();
  }

  // TOS 或显式要求展示原因时才亮面板；仅打开下拉不展示
  if (tos || showReason) {
    syncSwapReasonPanelVisibility();
  } else if (!wasEditing) {
    panel.hidden = true;
  } else {
    syncSwapReasonPanelVisibility();
  }

  if (openMenu && !tos) {
    renderSwapIterationMenu();
    const menu = document.getElementById("swap-iteration-menu");
    const btn = document.getElementById("swap-iteration-btn");
    if (menu) menu.hidden = false;
    btn?.classList.add("is-open");
    btn?.setAttribute("aria-expanded", "true");
  }

  if (!panel.hidden) {
    scrollDetailDrawerTo(panel);
  }
}

function closeSwapPanel() {
  const row = REQUIREMENTS.find((r) => r.id === editingId);
  resetSwapPanelState();
  if (!row) return;
  setSelectValue("swap-iteration", row.iteration || "");
  setGanttIterationControlsEnabled(!isTosType(row));
  if (isRowGanttVisible(row)) renderDetailGantt(row);
}

function createIterationForSwap() {
  const row = REQUIREMENTS.find((r) => r.id === editingId);
  if (!row || !row.product) return null;
  openSwapPanel({ showReason: true });
  const name = ensureNextPendingIteration(row.product);
  applySwapIterationSelection(name, { clearSchedule: true });
  return name;
}

function applySwapIterationSelection(name, { clearSchedule = false } = {}) {
  setSelectValue("swap-iteration", name || "");
  document.getElementById("swap-iteration-btn").classList.remove("field-error");
  fillSwapScheduleDates({});
  clearSwapScheduleDateErrors();
  if (clearSchedule) {
    setGanttDatesFormVisible(true);
  }
  refreshGanttPreview();
  syncSwapReasonPanelVisibility();
  const panel = document.getElementById("d-swap-panel");
  if (panel && !panel.hidden) {
    scrollDetailDrawerTo(panel);
  }
}

function renderSwapIterationMenu() {
  const menu = document.getElementById("swap-iteration-menu");
  const hidden = document.getElementById("swap-iteration");
  if (!menu || !hidden) return;
  const row = REQUIREMENTS.find((r) => r.id === editingId);
  if (!row || isTosType(row)) {
    menu.innerHTML = "";
    return;
  }
  const currentReqIter = row.iteration || "";
  const selectable = getSelectableIterations(row.product);
  const selected = hidden.value;
  menu.innerHTML = selectable.length
    ? selectable
        .map((it) => {
          const isCurrent = it.name === currentReqIter;
          const isSelected = it.name === selected;
          const check = `<span class="iteration-option-check" aria-hidden="true"><img src="assets/icons/gantt-menu-check.svg" alt="" /></span>`;
          const markClass = [isSelected ? "selected" : "", isCurrent ? "is-current" : ""].filter(Boolean).join(" ");
          return `<button type="button" class="${markClass}" data-value="${it.name}">
              ${check}
              <span class="iteration-option-name">${it.name}</span>
            </button>`;
        })
        .join("")
    : `<div class="empty-row" style="padding:12px;font-size:12px">暂无可选迭代，请先点 + 新增</div>`;
}

function setupSwapIterationSelect() {
  const btn = document.getElementById("swap-iteration-btn");
  const menu = document.getElementById("swap-iteration-menu");
  const hidden = document.getElementById("swap-iteration");
  if (!btn || !menu || !hidden) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const row = REQUIREMENTS.find((r) => r.id === editingId);
    if (!row) return;
    if (isTosType(row)) {
      openSwapPanel();
      return;
    }
    document.querySelectorAll(".select-menu").forEach((m) => {
      if (m !== menu) m.hidden = true;
    });
    if (!swapEditMode) {
      openSwapPanel({ openMenu: true });
      return;
    }
    const willOpen = menu.hidden;
    if (willOpen) renderSwapIterationMenu();
    menu.hidden = !willOpen;
    btn.classList.toggle("is-open", willOpen);
    btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });

  menu.addEventListener("click", (e) => {
    const option = e.target.closest("button[data-value]");
    if (!option) return;
    applySwapIterationSelection(option.dataset.value);
    menu.hidden = true;
    btn.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  });
}

/** 保存详情时处理迭代修改 / 补阶段排期。返回 false 表示校验未通过 */
function applyPendingIterationChange(row) {
  if (!swapEditMode || !row) return true;

  const reasonEl = document.getElementById("swap-reason");
  const reason = reasonEl.value.trim();
  const tos = isTosType(row);
  const needs = readDetailPhaseNeeds();

  if (tos) {
    if (!reason) {
      reasonEl.classList.add("field-error");
      scrollDetailDrawerTo(document.getElementById("d-swap-panel"));
      return false;
    }
    reasonEl.classList.remove("field-error");
    persistDetailPhaseNeeds(row, needs);
    pushScheduleChange(row, {
      type: "tos_remind",
      fromIteration: row.iteration || "",
      toIteration: "",
      reason,
      operator: row.owner,
    });
    notifyPmIterationChange(row, reason);
    return true;
  }

  const nextIter = document.getElementById("swap-iteration").value.trim();
  const iterBtn = document.getElementById("swap-iteration-btn");
  const fromIteration = row.iteration || "";
  const iterChanged = !!(nextIter && nextIter !== fromIteration);
  const needsChanged =
    !swapEditBaselineNeeds ||
    needs.prd !== swapEditBaselineNeeds.prd ||
    needs.ux !== swapEditBaselineNeeds.ux ||
    needs.ui !== swapEditBaselineNeeds.ui;

  const baseDates = getPreviewIterationDates(row, nextIter || fromIteration) || {};
  const formDates = readSwapScheduleDates();
  const formDirty = Object.entries(formDates).some(([k, v]) => v && v !== (baseDates[k] || ""));
  const missingPhaseDates = detailNeedsMissingDates(baseDates, needs);
  const needWriteDates =
    missingPhaseDates || formDirty || (iterChanged && !iterationHasSchedule({ dates: baseDates }));

  if (!iterChanged && !needsChanged && !needWriteDates) {
    return true;
  }

  if (!nextIter) {
    if (iterBtn) iterBtn.classList.add("field-error");
    scrollDetailDrawerTo(document.getElementById("d-swap-panel"));
    return false;
  }

  let valid = true;
  if (!reason) {
    reasonEl.classList.add("field-error");
    valid = false;
  } else {
    reasonEl.classList.remove("field-error");
  }
  if (iterBtn) iterBtn.classList.remove("field-error");

  let mergedDates = mergeSwapFormIntoDates(baseDates);
  mergedDates = suggestMissingPhaseDates(mergedDates, needs);

  // 勾选但缺日期 / 新迭代无排期 / 用户改了日期：必须校验
  if (needWriteDates) {
    const draft = { ...mergedDates };
    DETAIL_GANTT_PHASES.forEach((p) => {
      if (p.optional && !needs[p.key]) {
        draft[p.start] = draft[p.start] || "";
        draft[p.end] = draft[p.end] || "";
        // 本需求不涉及：不强制清空迭代上已有日期（其他需求可能仍用）
      }
    });
    if (!validateSwapScheduleDates(draft, needs)) {
      setGanttDatesFormVisible(true);
      applySuggestedDatesToSwapForm(draft, needs);
      refreshGanttPreview();
      scrollDetailDrawerTo(document.getElementById("d-mini-gantt"));
      valid = false;
    } else {
      mergedDates = draft;
    }
  }

  if (!valid) {
    scrollDetailDrawerTo(document.getElementById("d-swap-panel"));
    return false;
  }

  // 写回迭代 dates：补齐新勾选阶段；不因本需求「不涉及」删掉迭代已有阶段日期
  const it = findIteration(nextIter, row.product);
  const nextDates = { ...(it && it.dates ? it.dates : {}) };
  DETAIL_GANTT_PHASES.forEach((p) => {
    if (!p.optional || needs[p.key]) {
      if (mergedDates[p.start]) nextDates[p.start] = mergedDates[p.start];
      if (mergedDates[p.end]) nextDates[p.end] = mergedDates[p.end];
    }
  });
  nextDates.devStart = mergedDates.devStart || nextDates.devStart || "";
  nextDates.devEnd = mergedDates.devEnd || nextDates.devEnd || "";
  nextDates.testStart = mergedDates.testStart || nextDates.testStart || "";
  nextDates.testEnd = mergedDates.testEnd || nextDates.testEnd || "";

  upsertIterationCatalog({ product: row.product, name: nextIter, dates: nextDates });

  row.iteration = nextIter;
  row.scheduleDates = { ...nextDates };
  if (nextDates.testEnd) row.deliverMonth = nextDates.testEnd.slice(0, 7);
  persistDetailPhaseNeeds(row, needs);

  if (typeof isIR === "function" && isIR(row) && typeof isSR === "function") {
    REQUIREMENTS.filter((r) => isSR(r) && r.parentId === row.id).forEach((sr) => {
      sr.iteration = nextIter;
      sr.scheduleDates = { ...nextDates };
      if (nextDates.testEnd) sr.deliverMonth = nextDates.testEnd.slice(0, 7);
    });
  }

  pushScheduleChange(row, {
    type: iterChanged ? "swap" : "schedule_patch",
    fromIteration,
    toIteration: nextIter,
    reason,
    operator: row.owner,
  });
  if (typeof rebuildIterationsFromGantt === "function") rebuildIterationsFromGantt();
  showToast(iterChanged ? `已置换至迭代 ${nextIter}` : "已更新排期阶段");
  return true;
}

function getDetailIdFromUrl() {
  const id = new URLSearchParams(window.location.search).get("id");
  return id ? Number(id) : null;
}

function syncDetailUrl(id, { replace = false } = {}) {
  const url = new URL(window.location.href);
  const cur = url.searchParams.get("id");
  if (id == null || id === "") {
    if (!cur) return;
    url.searchParams.delete("id");
    history[replace ? "replaceState" : "pushState"]({ detailId: null }, "", url);
    return;
  }
  const next = String(id);
  if (cur === next) return;
  url.searchParams.set("id", next);
  // 同页切换详情用 replace，首次打开用 push，便于浏览器后退关闭
  const method = cur || replace ? "replaceState" : "pushState";
  history[method]({ detailId: Number(next) }, "", url);
}

let detailCloseTimer = null;

function showDetailDrawer() {
  const overlay = document.getElementById("detail-modal");
  if (detailCloseTimer) {
    clearTimeout(detailCloseTimer);
    detailCloseTimer = null;
  }
  overlay.hidden = false;
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add("is-open"));
  });
}

function hideDetailDrawer() {
  const overlay = document.getElementById("detail-modal");
  overlay.classList.remove("is-open");
  const finish = () => {
    overlay.hidden = true;
    detailCloseTimer = null;
    if (!anyModalOpen()) document.body.classList.remove("modal-open");
  };
  if (detailCloseTimer) clearTimeout(detailCloseTimer);
  detailCloseTimer = setTimeout(finish, 320);
}

function openDetailModal(id, { syncUrl = true, replaceUrl = false } = {}) {
  const row = REQUIREMENTS.find((r) => r.id === Number(id));
  if (!row) return;

  editingId = row.id;
  document.getElementById("d-title").value = row.title;
  document.getElementById("d-detail").value = row.detail || defaultDetail(row.title);
  setSelectValue("d-product", row.product);
  setSelectValue("d-priority", row.priority);
  setSelectValue("d-owner", row.owner, true);
  setStatusFieldLocked(isStatusLocked(row.status), row.status);
  renderReviewResultDisplay(row.reviewResult);
  renderDetailScheduleInfo(row);

  document.querySelector(`input[name="d-type"][value="${row.type === "TOS版本" ? "TOS版本" : "敏捷迭代"}"]`).checked = true;
  document.querySelector(`input[name="d-value"][value="${row.isValue ? "true" : "false"}"]`).checked = true;
  document.querySelector(`input[name="d-analytics"][value="${row.needAnalytics === true ? "true" : "false"}"]`).checked = true;
  document.getElementById("d-request-date").value = row.requestDate;
  document.getElementById("d-deliver-month").value = row.deliverMonth === "-" ? "" : row.deliverMonth;
  document.getElementById("d-version").value = row.version && row.version !== "-" ? row.version : "";

  detailAttachments = (row.attachments || []).map((a) => ({ ...a }));
  renderDetailAttachments();
  updateStatusSelectStyle();

  if (syncUrl) syncDetailUrl(row.id, { replace: replaceUrl });
  showDetailDrawer();
  closeSwapPanel();
}

function closeDetailModal({ syncUrl = true } = {}) {
  closeSwapPanel();
  swapEditMode = false;
  document.querySelectorAll("#detail-modal .select-menu").forEach((m) => (m.hidden = true));
  editingId = null;
  detailAiPrdFiles = [];
  if (syncUrl) syncDetailUrl(null, { replace: true });
  hideDetailDrawer();
}

function syncDetailFromUrl() {
  const id = getDetailIdFromUrl();
  const view = getViewFromUrl();
  if (view !== state.view) {
    state.view = view;
    syncViewToggleUI();
    render();
  }
  if (id != null && !Number.isNaN(id)) {
    openDetailModal(id, { syncUrl: false });
    return;
  }
  const overlay = document.getElementById("detail-modal");
  if (overlay && !overlay.hidden) closeDetailModal({ syncUrl: false });
}

function setSelectValue(prefix, value, withOwnerAvatar = false) {
  const hidden = document.getElementById(prefix);
  const text = document.getElementById(`${prefix}-text`);
  if (!hidden || !text) return;
  hidden.value = value || "";
  if (!value) {
    text.textContent = text.dataset.placeholder || "";
    text.classList.add("placeholder");
    return;
  }
  text.classList.remove("placeholder");
  if (withOwnerAvatar) {
    text.innerHTML = `<span class="owner-initial">${value.slice(0, 1)}</span><span>${value}</span>`;
  } else {
    text.textContent = value;
  }
}

function updateStatusSelectStyle() {
  const btn = document.getElementById("d-status-btn");
  const status = document.getElementById("d-status").value;
  btn.classList.toggle("status-select-active", !!status && !btn.disabled);
}

function renderDetailAttachments() {
  const list = document.getElementById("d-upload-list");
  list.innerHTML = detailAttachments
    .map((f, i) => {
      const isPdf = /\.pdf$/i.test(f.name);
      return `<li class="file-item">
        <div class="file-info">
          <span class="file-icon ${isPdf ? "pdf" : "file"}">${isPdf ? "PDF" : "FILE"}</span>
          <div class="file-text">
            <p class="file-name">${f.name}</p>
            <p class="file-size">${f.size || ""}</p>
          </div>
        </div>
        <button type="button" class="file-delete" data-index="${i}">删除</button>
      </li>`;
    })
    .join("");
}

function setupDetailSelect(wrap) {
  setupFormSelect(wrap);
}

function handleActionClick(e) {
  const btn = e.target.closest(".action-link");
  if (!btn) return;
  e.stopPropagation();
  const id = Number(btn.dataset.id);
  const type = btn.dataset.action;
  const row = REQUIREMENTS.find((r) => r.id === id);
  if (!row) return;

  if (type === "feishu") {
    e.preventDefault();
    // 仅跳转飞书；进行中状态不变（暂无法检测飞书申请结果）
    window.open(FEISHU_RAT_URL, "_blank", "noopener,noreferrer");
    return;
  }
  if (type === "review") {
    e.preventDefault();
    openReviewModal(id);
    return;
  }
  if (type === "schedule") {
    e.preventDefault();
    openScheduleModal(id);
    return;
  }
  if (type === "remind") {
    e.preventDefault();
    notifyPmSchedule(row);
  }
}

function syncReviewResultOptions() {
  document.querySelectorAll("#review-result-options .result-option").forEach((opt) => {
    const input = opt.querySelector('input[type="radio"]');
    opt.classList.toggle("selected", !!(input && input.checked));
  });
}

function openReviewModal(id) {
  const row = REQUIREMENTS.find((r) => r.id === Number(id));
  if (!row) return;
  actionTargetId = row.id;
  document.getElementById("review-req-title").textContent = row.title;
  document.querySelectorAll('input[name="review-result"]').forEach((input) => {
    input.checked = false;
  });
  document.getElementById("review-remark").value = row.reviewRemark || "";
  document.getElementById("review-result-options").classList.remove("field-error");
  syncReviewResultOptions();
  document.getElementById("review-modal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeReviewModal() {
  document.getElementById("review-modal").hidden = true;
  if (!anyModalOpen()) document.body.classList.remove("modal-open");
  actionTargetId = null;
}

function renderSchedulePrdList() {
  const list = document.getElementById("schedule-prd-list");
  if (!list) return;
  list.innerHTML = schedulePrdFiles
    .map((f, i) => `<li><span>${f.name}</span><button type="button" data-index="${i}">移除</button></li>`)
    .join("");
}

function clearScheduleFormErrors() {
  document.querySelectorAll("#schedule-modal .field-error").forEach((el) => el.classList.remove("field-error"));
}

function openScheduleModal(id) {
  const row = REQUIREMENTS.find((r) => r.id === Number(id));
  if (!row) return;
  actionTargetId = row.id;
  clearScheduleFormErrors();

  const tos = isTosType(row);
  const card = document.getElementById("schedule-modal-card");
  card.classList.toggle("modal-schedule-tos", tos);

  document.getElementById("schedule-modal-title").textContent = tos ? "需求排期（TOS）" : "需求排期";
  document.getElementById("schedule-tos-banner").hidden = !tos;
  document.getElementById("schedule-basic-title").hidden = tos;
  document.getElementById("schedule-prd-hint").hidden = !tos;
  document.getElementById("schedule-section-iteration").hidden = tos;
  document.getElementById("schedule-section-involve").hidden = false;
  document.getElementById("schedule-section-dates").hidden = tos;
  document.getElementById("schedule-confirm").hidden = tos;
  document.getElementById("schedule-confirm").textContent = "确认排期";
  document.getElementById("schedule-remind").hidden = !tos;

  document.getElementById("schedule-req-title").textContent = row.title;
  document.getElementById("schedule-req-code").value = row.reqCode || "";
  document.getElementById("schedule-prd-url").value = row.prdUrl || "";
  document.getElementById("schedule-demo-url").value = row.aiDemoUrl || "";
  document.getElementById("schedule-demo-duration").value = row.aiDemoDuration || "";

  if (tos) {
    setSelectValue("schedule-iteration", "");
    fillScheduleDates({});
    setSchedulePhaseChecksFromNeeds(row);
    syncSchedulePhaseUI();
  } else {
    const iterName = row.iteration || "";
    setSelectValue("schedule-iteration", iterName);
    if (iterName) {
      applyIterationSelection(iterName);
      // 需求自身已有排期时，优先展示需求上的日期（与迭代一致时仍锁定）
      if (row.scheduleDates && iterationHasSchedule({ dates: row.scheduleDates })) {
        fillScheduleDates(row.scheduleDates);
        setSchedulePhaseChecksFromNeeds(row);
        setScheduleDatesLocked(true);
      }
    } else {
      fillScheduleDates({});
      setSchedulePhaseChecksFromNeeds(row);
      syncSchedulePhaseUI();
    }
  }

  schedulePrdFiles = (row.aiPrdFiles || []).map((f) => ({ ...f }));
  renderSchedulePrdList();
  // PRD / AI PRD 可能已存在：敏捷与 TOS 都再同步一次「涉及 PRD」勾选
  syncSchedulePhaseUI();

  document.getElementById("schedule-modal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeScheduleModal() {
  document.getElementById("schedule-modal").hidden = true;
  if (!anyModalOpen()) document.body.classList.remove("modal-open");
  document.querySelectorAll("#schedule-modal .select-menu").forEach((m) => (m.hidden = true));
  actionTargetId = null;
  schedulePrdFiles = [];
}

function setupIterationSelect() {
  const btn = document.getElementById("schedule-iteration-btn");
  const menu = document.getElementById("schedule-iteration-menu");
  const hidden = document.getElementById("schedule-iteration");

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    document.querySelectorAll(".select-menu").forEach((m) => {
      if (m !== menu) m.hidden = true;
    });
    const row = REQUIREMENTS.find((r) => r.id === actionTargetId);
    const selectable = getSelectableIterations(row && row.product);
    const current = hidden.value;
    menu.innerHTML = selectable.length
      ? selectable
          .map((it) => {
            const meta = iterationHasSchedule(it)
              ? `${it.dates.devStart} ~ ${it.dates.testEnd}`
              : "待填写排期";
            return `<button type="button" class="${it.name === current ? "selected" : ""}" data-value="${it.name}">
                <span>${it.name}</span>
                <span class="iteration-option-meta">${meta}</span>
              </button>`;
          })
          .join("")
      : `<div class="empty-row" style="padding:12px;font-size:12px">暂无可选迭代</div>`;
    menu.hidden = !menu.hidden;
  });

  menu.addEventListener("click", (e) => {
    const option = e.target.closest("button[data-value]");
    if (!option) return;
    applyIterationSelection(option.dataset.value);
    menu.hidden = true;
  });
}

function initActionFlows() {
  // capture 阶段优先处理，避免被卡片打开详情抢走
  document.getElementById("table-body").addEventListener("click", handleActionClick, true);
  document.getElementById("board-view").addEventListener("click", handleActionClick, true);

  document.getElementById("review-close").addEventListener("click", closeReviewModal);
  document.getElementById("review-cancel").addEventListener("click", closeReviewModal);
  document.getElementById("review-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeReviewModal();
  });
  document.getElementById("review-result-options").addEventListener("change", () => {
    document.getElementById("review-result-options").classList.remove("field-error");
    syncReviewResultOptions();
  });
  document.getElementById("review-confirm").addEventListener("click", () => {
    const row = REQUIREMENTS.find((r) => r.id === actionTargetId);
    if (!row) return;
    const selected = document.querySelector('input[name="review-result"]:checked');
    if (!selected) {
      document.getElementById("review-result-options").classList.add("field-error");
      return;
    }
    document.getElementById("review-result-options").classList.remove("field-error");
    row.reviewRemark = document.getElementById("review-remark").value.trim();
    applyReviewOutcome(row, selected.value);
    closeReviewModal();
    render();
  });

  document.getElementById("schedule-close").addEventListener("click", closeScheduleModal);
  document.getElementById("schedule-cancel").addEventListener("click", closeScheduleModal);
  document.getElementById("schedule-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeScheduleModal();
  });

  document.getElementById("schedule-remind").addEventListener("click", () => {
    const row = REQUIREMENTS.find((r) => r.id === actionTargetId);
    if (!row) return;
    clearScheduleFormErrors();

    const reqCode = document.getElementById("schedule-req-code").value.trim();
    if (!reqCode) {
      document.getElementById("schedule-req-code").classList.add("field-error");
      return;
    }

    row.reqCode = reqCode;
    row.prdUrl = document.getElementById("schedule-prd-url").value.trim();
    row.aiDemoUrl = document.getElementById("schedule-demo-url").value.trim();
    row.aiDemoDuration = document.getElementById("schedule-demo-duration").value.trim();
    row.aiPrdFiles = schedulePrdFiles.slice();
    row.needPrd = isSchedulePhaseChecked(SCHEDULE_PHASES.find((p) => p.key === "prd")) || hasSchedulePrdDoc();
    row.needUx = isSchedulePhaseChecked(SCHEDULE_PHASES.find((p) => p.key === "ux"));
    row.needUi = isSchedulePhaseChecked(SCHEDULE_PHASES.find((p) => p.key === "ui"));
    row.schedulePrepared = true;
    notifyPmSchedule(row);
    closeScheduleModal();
    render();
  });

  setupIterationSelect();

  document.getElementById("schedule-iteration-add").addEventListener("click", (e) => {
    e.stopPropagation();
    createIterationWithoutSchedule();
    document.getElementById("schedule-iteration-menu").hidden = true;
  });

  document.getElementById("schedule-involve-list").addEventListener("change", (e) => {
    const check = e.target.closest(".schedule-phase-check");
    if (!check || check.disabled) return;
    syncSchedulePhaseUI();
  });

  document.getElementById("schedule-prd-url").addEventListener("input", () => {
    syncSchedulePhaseUI();
  });

  const prdBox = document.getElementById("schedule-prd-box");
  const prdInput = document.getElementById("schedule-prd-file");
  prdBox.addEventListener("click", () => prdInput.click());
  prdBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    prdBox.classList.add("dragover");
  });
  prdBox.addEventListener("dragleave", () => prdBox.classList.remove("dragover"));
  prdBox.addEventListener("drop", (e) => {
    e.preventDefault();
    prdBox.classList.remove("dragover");
    if (e.dataTransfer.files.length) {
      schedulePrdFiles.push(
        ...Array.from(e.dataTransfer.files).map((f) => ({ name: f.name, size: formatSize(f.size) }))
      );
      renderSchedulePrdList();
      syncSchedulePhaseUI();
    }
  });
  prdInput.addEventListener("change", () => {
    if (prdInput.files.length) {
      schedulePrdFiles.push(
        ...Array.from(prdInput.files).map((f) => ({ name: f.name, size: formatSize(f.size) }))
      );
      renderSchedulePrdList();
      syncSchedulePhaseUI();
      prdInput.value = "";
    }
  });
  document.getElementById("schedule-prd-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-index]");
    if (!btn) return;
    schedulePrdFiles.splice(Number(btn.dataset.index), 1);
    renderSchedulePrdList();
    syncSchedulePhaseUI();
  });

  document.getElementById("schedule-confirm").addEventListener("click", () => {
    const row = REQUIREMENTS.find((r) => r.id === actionTargetId);
    if (!row || isTosType(row)) return;
    clearScheduleFormErrors();

    const reqCode = document.getElementById("schedule-req-code").value.trim();
    const aiDemoUrl = document.getElementById("schedule-demo-url").value.trim();
    const aiDemoDuration = document.getElementById("schedule-demo-duration").value.trim();
    const iteration = document.getElementById("schedule-iteration").value;
    const scheduleDates = readScheduleDatesFromForm();
    const { devStart, devEnd, testStart, testEnd } = scheduleDates;

    let valid = true;
    const mark = (id, ok) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!ok) {
        el.classList.add("field-error");
        valid = false;
      }
    };
    mark("schedule-req-code", !!reqCode);
    mark("schedule-iteration-btn", !!iteration);
    SCHEDULE_PHASES.forEach((phase) => {
      if (!isSchedulePhaseChecked(phase)) return;
      mark(phase.startId, !!document.getElementById(phase.startId).value);
      mark(phase.endId, !!document.getElementById(phase.endId).value);
    });
    mark("schedule-dev-start", !!devStart);
    mark("schedule-dev-end", !!devEnd);
    mark("schedule-test-start", !!testStart);
    mark("schedule-test-end", !!testEnd);
    if (!valid) return;

    row.reqCode = reqCode;
    row.iteration = iteration;
    row.prdUrl = document.getElementById("schedule-prd-url").value.trim();
    row.aiDemoUrl = aiDemoUrl;
    row.aiDemoDuration = aiDemoDuration;
    row.aiPrdFiles = schedulePrdFiles.slice();
    row.scheduleDates = scheduleDates;
    row.needPrd = isSchedulePhaseChecked(SCHEDULE_PHASES.find((p) => p.key === "prd")) || hasSchedulePrdDoc();
    row.needUx = isSchedulePhaseChecked(SCHEDULE_PHASES.find((p) => p.key === "ux"));
    row.needUi = isSchedulePhaseChecked(SCHEDULE_PHASES.find((p) => p.key === "ui"));
    const it = findIteration(iteration, row.product);
    if (it) {
      if (iterationHasSchedule(it)) {
        // 已有排期：沿用迭代日期，不可在此改写
        row.scheduleDates = { ...(it.dates || {}) };
      } else {
        it.dates = { ...scheduleDates };
        upsertIterationCatalog(it);
      }
    }
    if (testEnd) row.deliverMonth = testEnd.slice(0, 7);
    row.status = "已排期";
    if (typeof rebuildIterationsFromGantt === "function") rebuildIterationsFromGantt();
    closeScheduleModal();
    render();
  });
}

function initDetailModal() {
  document.querySelectorAll("#detail-modal .select-wrap").forEach(setupDetailSelect);

  document.getElementById("detail-close").addEventListener("click", () => closeDetailModal());
  document.getElementById("detail-cancel").addEventListener("click", () => closeDetailModal());
  document.getElementById("detail-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeDetailModal();
  });

  window.addEventListener("popstate", syncDetailFromUrl);

  document.getElementById("table-body").addEventListener("click", (e) => {
    if (e.target.closest(".action-link")) return;
    const link = e.target.closest(".req-link");
    if (!link) return;
    // 保留 Cmd/Ctrl 点击在新标签打开专属链接
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    openDetailModal(link.dataset.id);
  });
  document.getElementById("board-view").addEventListener("click", (e) => {
    if (e.target.closest(".action-link")) return;
    const card = e.target.closest(".board-card[data-id]");
    if (card) openDetailModal(card.dataset.id);
  });

  const uploadBox = document.getElementById("d-upload-box");
  const fileInput = document.getElementById("d-file");
  uploadBox.addEventListener("click", () => fileInput.click());
  uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.classList.add("dragover");
  });
  uploadBox.addEventListener("dragleave", () => uploadBox.classList.remove("dragover"));
  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("dragover");
    if (e.dataTransfer.files.length) {
      detailAttachments.push(
        ...Array.from(e.dataTransfer.files).map((f) => ({ name: f.name, size: formatSize(f.size) }))
      );
      renderDetailAttachments();
    }
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      detailAttachments.push(
        ...Array.from(fileInput.files).map((f) => ({ name: f.name, size: formatSize(f.size) }))
      );
      renderDetailAttachments();
      fileInput.value = "";
    }
  });
  document.getElementById("d-upload-list").addEventListener("click", (e) => {
    const idx = e.target.dataset.index;
    if (idx == null) return;
    detailAttachments.splice(Number(idx), 1);
    renderDetailAttachments();
  });

  const aiPrdBox = document.getElementById("d-ai-prd-box");
  const aiPrdInput = document.getElementById("d-ai-prd-file");
  aiPrdBox.addEventListener("click", () => aiPrdInput.click());
  aiPrdBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    aiPrdBox.classList.add("dragover");
  });
  aiPrdBox.addEventListener("dragleave", () => aiPrdBox.classList.remove("dragover"));
  aiPrdBox.addEventListener("drop", (e) => {
    e.preventDefault();
    aiPrdBox.classList.remove("dragover");
    if (e.dataTransfer.files.length) {
      detailAiPrdFiles.push(
        ...Array.from(e.dataTransfer.files).map((f) => ({ name: f.name, size: formatSize(f.size) }))
      );
      renderDetailAiPrdList();
      syncDetailPhaseNeedsEnabled();
      if (document.getElementById("d-need-prd")) {
        document.getElementById("d-need-prd").checked = true;
      }
      refreshGanttPreview();
    }
  });
  aiPrdInput.addEventListener("change", () => {
    if (aiPrdInput.files.length) {
      detailAiPrdFiles.push(
        ...Array.from(aiPrdInput.files).map((f) => ({ name: f.name, size: formatSize(f.size) }))
      );
      renderDetailAiPrdList();
      syncDetailPhaseNeedsEnabled();
      if (document.getElementById("d-need-prd")) {
        document.getElementById("d-need-prd").checked = true;
      }
      refreshGanttPreview();
      aiPrdInput.value = "";
    }
  });
  document.getElementById("d-ai-prd-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-index]");
    if (!btn) return;
    detailAiPrdFiles.splice(Number(btn.dataset.index), 1);
    renderDetailAiPrdList();
    syncDetailPhaseNeedsEnabled();
    refreshGanttPreview();
  });

  document.getElementById("d-ai-demo-edit").addEventListener("click", (e) => {
    e.stopPropagation();
    const input = document.getElementById("d-ai-demo");
    input.readOnly = false;
    document.getElementById("d-ai-demo-edit").hidden = true;
    input.focus();
    input.select();
  });

  document.getElementById("d-prd-url-edit").addEventListener("click", (e) => {
    e.stopPropagation();
    const input = document.getElementById("d-prd-url");
    input.readOnly = false;
    document.getElementById("d-prd-url-edit").hidden = true;
    input.focus();
    input.select();
  });

  document.getElementById("d-prd-url").addEventListener("click", (e) => {
    const input = document.getElementById("d-prd-url");
    if (!input.readOnly) {
      e.stopPropagation();
      return;
    }
    const url = input.value.trim();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  });

  function exitPrdUrlEdit() {
    const input = document.getElementById("d-prd-url");
    if (!input || input.readOnly) return;
    input.readOnly = true;
    document.getElementById("d-prd-url-edit").hidden = false;
    input.blur();
    if (hasDetailPrdDoc()) {
      const check = document.getElementById("d-need-prd");
      if (check) check.checked = true;
    }
    syncDetailPhaseNeedsEnabled();
    refreshGanttPreview();
  }

  document.getElementById("d-prd-url").addEventListener("input", () => {
    if (hasDetailPrdDoc()) {
      const check = document.getElementById("d-need-prd");
      if (check) check.checked = true;
    }
    syncDetailPhaseNeedsEnabled();
    refreshGanttPreview();
  });

  document.getElementById("d-phase-needs")?.addEventListener("change", (e) => {
    const check = e.target.closest(".detail-phase-need-check");
    if (!check || check.disabled) return;
    const phase = check.dataset.phase;
    const row = REQUIREMENTS.find((r) => r.id === editingId);
    if (!row || isTosType(row)) return;

    // 与去排期一致：取消涉及时清空可编辑草稿日期；有时间 ≠ 涉及
    if (!check.checked && phase) {
      clearDetailPhaseDraftDates(phase);
    }

    const afterNeeds = readDetailPhaseNeeds();
    const src = getEffectiveNeedRow(row) || row;
    const beforeNeeds = {
      prd: src.needPrd === true,
      ux: src.needUx === true,
      ui: src.needUi === true,
      dev: true,
      test: true,
    };
    const name = document.getElementById("swap-iteration")?.value || row.iteration || "";
    const baseDates = getPreviewIterationDates(row, name) || {};
    const merged = mergeSwapFormIntoDates(baseDates);
    const needDates = check.checked && detailNeedsMissingDates(merged, afterNeeds);

    // 新勾选且缺日期：进入甘特编辑以补齐（涉及 ⇒ 必须有时间）
    if (needDates && !swapEditMode) {
      openSwapPanel({ showReason: true });
      // openSwapPanel 会按行数据重置勾选，恢复用户刚改的涉及状态
      DETAIL_GANTT_PHASES.forEach((p) => {
        if (!p.optional) return;
        const el = document.getElementById(DETAIL_NEED_CHECK_IDS[p.key]);
        if (el && !el.disabled) el.checked = !!afterNeeds[p.key];
      });
      swapEditBaselineNeeds = beforeNeeds;
      syncDetailPhaseNeedsEnabled();
      refreshGanttPreview();
      syncSwapReasonPanelVisibility();
      return;
    }

    refreshGanttPreview();
    syncSwapReasonPanelVisibility();
  });

  document.getElementById("d-ai-demo").addEventListener("click", (e) => {
    const input = document.getElementById("d-ai-demo");
    if (!input.readOnly) {
      e.stopPropagation();
      return;
    }
    const url = input.value.trim();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  });

  function exitAiDemoEdit() {
    const input = document.getElementById("d-ai-demo");
    if (!input || input.readOnly) return;
    input.readOnly = true;
    document.getElementById("d-ai-demo-edit").hidden = false;
    input.blur();
  }

  document.getElementById("d-ai-track-edit").addEventListener("click", (e) => {
    e.stopPropagation();
    const input = document.getElementById("d-ai-track");
    input.readOnly = false;
    document.getElementById("d-ai-track-edit").hidden = true;
    input.focus();
    input.select();
  });

  document.getElementById("d-ai-track").addEventListener("click", (e) => {
    const input = document.getElementById("d-ai-track");
    if (!input.readOnly) {
      e.stopPropagation();
      return;
    }
    const url = input.value.trim();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  });

  function exitAiTrackEdit() {
    const input = document.getElementById("d-ai-track");
    if (!input || input.readOnly) return;
    // 仍为空：保持直接可填；已填写：切回只读 + 铅笔
    if (!input.value.trim()) {
      input.readOnly = false;
      document.getElementById("d-ai-track-edit").hidden = true;
      return;
    }
    input.readOnly = true;
    document.getElementById("d-ai-track-edit").hidden = false;
    input.blur();
  }

  document.getElementById("detail-modal").addEventListener("mousedown", (e) => {
    const prdInput = document.getElementById("d-prd-url");
    if (prdInput && !prdInput.readOnly) {
      if (!e.target.closest("#d-prd-url") && !e.target.closest("#d-prd-url-edit")) {
        exitPrdUrlEdit();
      }
    }
    const demoInput = document.getElementById("d-ai-demo");
    if (demoInput && !demoInput.readOnly) {
      if (!e.target.closest("#d-ai-demo") && !e.target.closest("#d-ai-demo-edit")) {
        exitAiDemoEdit();
      }
    }
    const trackInput = document.getElementById("d-ai-track");
    if (trackInput && !trackInput.readOnly) {
      if (!e.target.closest("#d-ai-track") && !e.target.closest("#d-ai-track-edit")) {
        exitAiTrackEdit();
      }
    }
  });

  document.getElementById("detail-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (editingId == null) return;

    const row = REQUIREMENTS.find((r) => r.id === editingId);
    if (!row) return;

    const title = document.getElementById("d-title").value.trim();
    const detail = document.getElementById("d-detail").value.trim();
    const product = document.getElementById("d-product").value;
    const status = document.getElementById("d-status").value;
    const priority = document.getElementById("d-priority").value;
    const type = document.querySelector('input[name="d-type"]:checked').value;
    const isValue = document.querySelector('input[name="d-value"]:checked').value === "true";
    const needAnalytics = document.querySelector('input[name="d-analytics"]:checked').value === "true";
    const owner = document.getElementById("d-owner").value;
    const requestDate = document.getElementById("d-request-date").value;
    const deliverMonth = document.getElementById("d-deliver-month").value;
    const version = document.getElementById("d-version").value.trim();
    const originalStatus = document.getElementById("d-status").dataset.original || row.status;

    let valid = true;
    const mark = (id, ok) => {
      const el = document.getElementById(id);
      if (!ok) {
        el.classList.add("field-error");
        valid = false;
      } else el.classList.remove("field-error");
    };
    mark("d-title", !!title);
    mark("d-product-btn", !!product);
    mark("d-priority-btn", !!priority);
    mark("d-owner-btn", !!owner);
    mark("d-version", !!version);
    mark("d-request-date", !!requestDate);
    mark("d-deliver-month", !!deliverMonth);

    if (isStatusLocked(originalStatus)) {
      // 锁定状态不可改进展
      if (status !== originalStatus) {
        mark("d-status-btn", false);
        valid = false;
      }
    } else {
      const allowed = getAllowedManualStatuses(originalStatus);
      mark("d-status-btn", allowed.includes(status));
    }
    if (!valid) return;

    const iterationBefore = row.iteration || "";
    if (!applyPendingIterationChange(row)) return;
    const iterationSwapped = (row.iteration || "") !== iterationBefore;

    const ownerInfo = OWNERS.find((o) => o.name === owner) || OWNERS[0];
    const scheduleInfoVisible = !document.getElementById("d-schedule-info").hidden;
    Object.assign(row, {
      title,
      detail,
      product,
      status: isStatusLocked(originalStatus) ? originalStatus : status,
      priority,
      type,
      version,
      isValue,
      needAnalytics,
      owner,
      avatar: ownerInfo.avatar,
      requestDate,
      deliverMonth: iterationSwapped ? row.deliverMonth : deliverMonth,
      attachments: detailAttachments.slice(),
    });
    if (typeof syncIrTypeToChildSrs === "function" && typeof isIR === "function" && isIR(row)) {
      syncIrTypeToChildSrs(row.id, type);
    }
    if (scheduleInfoVisible) {
      row.reqCode = document.getElementById("d-req-code").value.trim();
      row.prdUrl = document.getElementById("d-prd-url").value.trim();
      row.aiDemoUrl = document.getElementById("d-ai-demo").value.trim();
      if (!document.getElementById("d-ai-track-field").hidden) {
        row.aiTrackUrl = document.getElementById("d-ai-track").value.trim();
      }
      row.aiPrdFiles = detailAiPrdFiles.slice();
    }
    // 涉及阶段在排期甘特外独立保存（与去排期 need* 一致）
    const involveSection = document.getElementById("d-phase-needs-section");
    if (involveSection && !involveSection.hidden && !isTosType(row)) {
      persistDetailPhaseNeeds(row, readDetailPhaseNeeds());
    }

    closeDetailModal();
    render();
  });

  document.getElementById("d-gantt-latest-reason")?.addEventListener("click", (e) => {
    if (e.target.closest(".detail-gantt-remind-link")) remindPmAgain();
  });
  setupSwapIterationSelect();
  document.getElementById("swap-iteration-add").addEventListener("click", (e) => {
    e.stopPropagation();
    if (e.currentTarget.disabled) return;
    createIterationForSwap();
    const menu = document.getElementById("swap-iteration-menu");
    if (menu) menu.hidden = true;
    document.getElementById("swap-iteration-btn")?.classList.remove("is-open");
    document.getElementById("swap-iteration-btn")?.setAttribute("aria-expanded", "false");
  });
  const miniGantt = document.getElementById("d-mini-gantt");
  if (miniGantt) {
    miniGantt.addEventListener("change", (e) => {
      const dateInput = e.target.closest(".detail-gantt-date-underline");
      if (!dateInput || !swapEditMode) return;
      const targetId = dateInput.dataset.swapId;
      const hidden = targetId ? document.getElementById(targetId) : null;
      if (hidden) {
        hidden.value = dateInput.value;
        hidden.classList.toggle("field-error", false);
        dateInput.classList.remove("field-error");
      }
      repaintMiniGanttBarsFromForm();
    });
    miniGantt.addEventListener("input", (e) => {
      const dateInput = e.target.closest(".detail-gantt-date-underline");
      if (!dateInput || !swapEditMode) return;
      const targetId = dateInput.dataset.swapId;
      const hidden = targetId ? document.getElementById(targetId) : null;
      if (hidden) {
        hidden.value = dateInput.value;
        dateInput.classList.remove("field-error");
      }
      repaintMiniGanttBarsFromForm();
    });
  }
  const swapDatesForm = document.getElementById("d-gantt-dates-form");
  if (swapDatesForm) {
    swapDatesForm.addEventListener("change", () => {
      if (!swapEditMode) return;
      refreshGanttPreview();
    });
  }
  document.addEventListener("click", (e) => {
    if (!swapEditMode) return;
    const section = document.getElementById("d-gantt-section");
    if (!section || section.hidden) return;
    const menu = document.getElementById("swap-iteration-menu");
    const btn = document.getElementById("swap-iteration-btn");
    if (menu && !menu.hidden && !menu.contains(e.target) && !btn?.contains(e.target)) {
      menu.hidden = true;
      btn?.classList.remove("is-open");
      btn?.setAttribute("aria-expanded", "false");
    }
    if (section.contains(e.target)) return;
    if (e.target.closest("#d-phase-needs-section")) return;
    // 下拉菜单在 section 内；点详情其它空白处且无改动则收起
    tryCollapseSwapEdit();
  });

  initActionFlows();
}

init();

