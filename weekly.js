// ---------- 需求周进展看板 ----------

const STORAGE_KEY = "weekly_progress_board_v2";
const FILTER_KEY = "weekly_progress_product_filter_v1";

const NOTE_FIELDS = {
  progress: { title: "周进展", hint: "由产品填写本周进展", placeholder: "请输入本周进展，如：本周完成 xxx，当前开发中…" },
  risk: { title: "风险项", hint: "由产品填写风险项", placeholder: "请输入风险项，无可留空" },
  ops: { title: "运营事项", hint: "由运营填写运营事项", placeholder: "请输入运营事项，无可留空" },
};

/** 演示用假数据：按「距今第几周」准备，保证当前周也有内容 */
const SEED_NOTES_BY_OFFSET = {
  0: {
    1: { progress: "本周完成触达通道联调，当前开发中", risk: "接口延迟偏高，需压测确认", ops: "" },
    4: { progress: "评审材料已补充，待会签", risk: "", ops: "" },
    5: { progress: "入口改版视觉走查中", risk: "权限弹窗与改版冲突", ops: "需同步运营侧入口文案" },
    6: { progress: "AI 方案评审通过，待排期细化", risk: "", ops: "需配合运营准备上线素材" },
    8: { progress: "性能优化合入主分支", risk: "低端机帧率仍不稳定", ops: "" },
    9: { progress: "排序策略 A/B 实验设计中", risk: "", ops: "" },
    11: { progress: "开发联调 80%", risk: "", ops: "" },
    15: { progress: "摘要能力接入完成初版", risk: "长文摘要质量待评估", ops: "" },
  },
  1: {
    1: { progress: "完成通道选型与方案评审", risk: "依赖方排期未确定", ops: "" },
    6: { progress: "完成竞品分析与初稿", risk: "", ops: "" },
    8: { progress: "定位卡顿根因，方案评审中", risk: "", ops: "" },
    9: { progress: "完成指标口径对齐", risk: "", ops: "需运营确认实验流量" },
  },
  2: {
    1: { progress: "需求澄清完成，进入方案设计", risk: "", ops: "" },
    8: { progress: "收集线上卡顿日志", risk: "", ops: "" },
  },
};

const state = {
  weekIndex: 0,
  product: localStorage.getItem(FILTER_KEY) || "全部",
  page: 1,
  pageSize: 10,
  sortKey: null,
  sortAsc: true,
  editReqId: null,
  editField: null,
  overviewReqId: null,
};

const STATUS_ORDER = ["未启动", "进行中", "待评审", "已评审", "已排期", "开发中", "测试中", "已完成", "已取消", "待开发", "待规划"];
const PRIORITY_ORDER = ["P0", "P1", "P2"];

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function badge(cls, text) {
  return `<span class="${cls}">${escapeHtml(text)}</span>`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatWeekLabel(year, week, start, end) {
  const s = `${start.getMonth() + 1}.${start.getDate()}`;
  const e = `${end.getMonth() + 1}.${end.getDate()}`;
  return `${year}年 第${week}周（${s} - ${e}）`;
}

/** ISO 周：周一为一周开始 */
function getIsoWeekParts(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

function startOfIsoWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfIsoWeek(start) {
  const d = new Date(start);
  d.setDate(d.getDate() + 6);
  return d;
}

function makeWeekFromDate(date) {
  const start = startOfIsoWeek(date);
  const end = endOfIsoWeek(start);
  const { year, week } = getIsoWeekParts(start);
  return {
    id: `${year}-W${pad(week)}`,
    label: formatWeekLabel(year, week, start, end),
    start: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    end: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  };
}

function defaultStore(anchorDate = new Date()) {
  const weeks = [0, 1, 2].map((offset) => {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() - offset * 7);
    return makeWeekFromDate(d);
  });
  const notes = {};
  weeks.forEach((week, offset) => {
    notes[week.id] = deepCopyWeekNotes(SEED_NOTES_BY_OFFSET[offset] || {});
  });
  return { weeks, notes };
}

function deepCopyWeekNotes(src) {
  const out = {};
  Object.keys(src || {}).forEach((reqId) => {
    const item = src[reqId] || {};
    out[reqId] = {
      progress: item.progress || "",
      risk: item.risk || "",
      ops: item.ops || "",
    };
  });
  return out;
}

/** 随时间自动补齐周；新周深拷贝上一周内容，之后互不影响 */
function ensureWeeksAuto(anchorDate = new Date()) {
  if (!store.weeks.length) {
    const seed = makeWeekFromDate(anchorDate);
    store.weeks = [seed];
    store.notes[seed.id] = {};
    saveStore(store);
    return;
  }

  store.weeks.sort((a, b) => String(b.start).localeCompare(String(a.start)));
  const todayWeek = makeWeekFromDate(anchorDate);
  let guard = 0;
  while (guard < 60) {
    guard += 1;
    const newest = store.weeks[0];
    if (newest.id === todayWeek.id || newest.start >= todayWeek.start) break;
    const nextDate = new Date(newest.start);
    nextDate.setDate(nextDate.getDate() + 7);
    const next = makeWeekFromDate(nextDate);
    if (store.weeks.some((w) => w.id === next.id)) break;
    store.notes[next.id] = deepCopyWeekNotes(store.notes[newest.id] || {});
    store.weeks.unshift(next);
  }
  saveStore(store);
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = defaultStore();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.weeks || !parsed.weeks.length) return defaultStore();
    if (!parsed.notes) parsed.notes = {};
    return parsed;
  } catch {
    return defaultStore();
  }
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

let store = loadStore();
ensureWeeksAuto();

function currentWeek() {
  return store.weeks[state.weekIndex] || store.weeks[0];
}

function getNote(reqId, field) {
  const week = currentWeek();
  const row = (store.notes[week.id] && store.notes[week.id][reqId]) || {};
  return row[field] || "";
}

function setNote(reqId, field, value) {
  const week = currentWeek();
  if (!store.notes[week.id]) store.notes[week.id] = {};
  if (!store.notes[week.id][reqId]) store.notes[week.id][reqId] = {};
  store.notes[week.id][reqId][field] = value;
  saveStore(store);
}

function getProductOptions() {
  return ["全部", ...[...new Set(getPoolRows().map((r) => r.product))].sort()];
}

function getFilteredRows() {
  let rows = getPoolRows().filter((r) => {
    if (state.product !== "全部" && r.product !== state.product) return false;
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
        if (va < 0) va = 999;
        if (vb < 0) vb = 999;
      } else if (k === "priority") {
        va = PRIORITY_ORDER.indexOf(va);
        vb = PRIORITY_ORDER.indexOf(vb);
        if (va < 0) va = 999;
        if (vb < 0) vb = 999;
      } else if (k === "version") {
        va = parseFloat(String(va || "").replace(/[^\d.]/g, "")) || 0;
        vb = parseFloat(String(vb || "").replace(/[^\d.]/g, "")) || 0;
      } else {
        va = va == null ? "" : String(va);
        vb = vb == null ? "" : String(vb);
      }
      if (va < vb) return state.sortAsc ? -1 : 1;
      if (va > vb) return state.sortAsc ? 1 : -1;
      return 0;
    });
  }
  return rows;
}

function noteCell(reqId, field) {
  const text = getNote(reqId, field);
  const summary = text ? String(text).split("\n")[0] : "";
  const empty = !summary;
  return `
    <div class="weekly-note-cell" data-id="${reqId}" data-field="${field}">
      <button type="button" class="weekly-note-trigger ${empty ? "is-empty" : ""}" title="${escapeHtml(summary || "点击填写")}">
        ${empty ? "点击填写" : escapeHtml(summary)}
      </button>
    </div>`;
}

function renderTable() {
  const body = document.getElementById("weekly-tbody");
  const rows = getFilteredRows();
  renderPagination(rows.length);

  const start = (state.page - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);

  if (!pageRows.length) {
    body.innerHTML = `<div class="empty-row">暂无符合条件的需求</div>`;
    return;
  }

  body.innerHTML = pageRows
    .map(
      (r) => `
    <div class="table-row">
      <div class="td td-title" title="${escapeHtml(r.title)}">
        <button type="button" class="req-link weekly-req-link" data-id="${r.id}">${escapeHtml(r.title)}</button>
      </div>
      <div class="td w-100">${escapeHtml(r.product)}</div>
      <div class="td w-100">${badge(`status-badge status-${r.status}`, r.status)}</div>
      <div class="td w-80">${badge(`priority-badge priority-${r.priority}`, r.priority)}</div>
      <div class="td w-100">${badge(`type-label type-${r.type}`, r.type)}</div>
      <div class="td w-90">${escapeHtml(r.version || "-")}</div>
      <div class="td w-180">${noteCell(r.id, "progress")}</div>
      <div class="td w-160">${noteCell(r.id, "risk")}</div>
      <div class="td w-160">${noteCell(r.id, "ops")}</div>
    </div>`
    )
    .join("");
}

function renderPagination(total) {
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;
  document.getElementById("weekly-total-count").textContent = `共 ${total} 条需求`;

  const el = document.getElementById("weekly-pagination");
  let html = `<button class="page-btn" data-page="prev" ${state.page === 1 ? "disabled" : ""}>&lt;</button>`;
  for (let p = 1; p <= totalPages; p++) {
    if (totalPages > 7 && Math.abs(p - state.page) > 2 && p !== 1 && p !== totalPages) {
      if (p === 2 || p === totalPages - 1) html += `<span class="page-ellipsis">…</span>`;
      continue;
    }
    html += `<button class="page-btn ${p === state.page ? "active" : ""}" data-page="${p}">${p}</button>`;
  }
  html += `<button class="page-btn" data-page="next" ${state.page === totalPages ? "disabled" : ""}>&gt;</button>`;
  el.innerHTML = html;
}

function renderWeekChrome() {
  const week = currentWeek();
  document.getElementById("week-label").textContent = week.label;
  document.getElementById("week-prev").disabled = state.weekIndex >= store.weeks.length - 1;
  document.getElementById("week-next").disabled = state.weekIndex <= 0;
}

function render() {
  renderWeekChrome();
  document.getElementById("weekly-product-filter-value").textContent = state.product;
  renderTable();
  document.querySelectorAll(".weekly-table-header .th.sortable").forEach((th) => {
    th.classList.toggle("sorted-desc", th.dataset.key === state.sortKey && !state.sortAsc);
  });
}

function closeWeekDropdown() {
  const dropdown = document.getElementById("week-dropdown");
  const btn = document.getElementById("week-label-btn");
  if (!dropdown || dropdown.hidden) return;
  dropdown.hidden = true;
  btn.setAttribute("aria-expanded", "false");
}

function openWeekDropdown() {
  const dropdown = document.getElementById("week-dropdown");
  const btn = document.getElementById("week-label-btn");
  dropdown.innerHTML = store.weeks
    .map(
      (w, i) => `
    <button type="button" role="option" data-index="${i}" class="${i === state.weekIndex ? "selected" : ""}" aria-selected="${i === state.weekIndex}">
      ${escapeHtml(w.label)}
    </button>`
    )
    .join("");
  dropdown.hidden = false;
  btn.setAttribute("aria-expanded", "true");
}

function selectWeek(index) {
  if (index < 0 || index >= store.weeks.length) {
    closeWeekDropdown();
    return;
  }
  state.weekIndex = index;
  state.page = 1;
  closeWeekDropdown();
  render();
}

function showToast(msg) {
  let el = document.getElementById("weekly-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "weekly-toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    el.hidden = true;
  }, 1800);
}

function openOverviewModal(reqId) {
  const row = REQUIREMENTS.find((r) => r.id === Number(reqId));
  if (!row) return;
  state.overviewReqId = row.id;
  const week = currentWeek();
  document.getElementById("weekly-overview-req-title").textContent = row.title;
  document.getElementById("weekly-overview-week").textContent = week.label;
  document.getElementById("weekly-overview-progress").value = getNote(row.id, "progress");
  document.getElementById("weekly-overview-risk").value = getNote(row.id, "risk");
  document.getElementById("weekly-overview-ops").value = getNote(row.id, "ops");
  document.getElementById("weekly-overview-modal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeOverviewModal() {
  document.getElementById("weekly-overview-modal").hidden = true;
  if (document.getElementById("weekly-note-modal").hidden) {
    document.body.classList.remove("modal-open");
  }
  state.overviewReqId = null;
}

function saveOverviewModal() {
  if (state.overviewReqId == null) return;
  setNote(state.overviewReqId, "progress", document.getElementById("weekly-overview-progress").value.trim());
  setNote(state.overviewReqId, "risk", document.getElementById("weekly-overview-risk").value.trim());
  setNote(state.overviewReqId, "ops", document.getElementById("weekly-overview-ops").value.trim());
  closeOverviewModal();
  renderTable();
  showToast("已保存");
}

function openNoteModal(reqId, field) {
  const meta = NOTE_FIELDS[field];
  const row = REQUIREMENTS.find((r) => r.id === Number(reqId));
  if (!meta || !row) return;

  state.editReqId = row.id;
  state.editField = field;
  document.getElementById("weekly-note-title").textContent = meta.title;
  document.getElementById("weekly-note-req-title").textContent = row.title;
  document.getElementById("weekly-note-field-label").textContent = meta.title;
  document.getElementById("weekly-note-hint").textContent = meta.hint;
  const textarea = document.getElementById("weekly-note-content");
  textarea.placeholder = meta.placeholder;
  textarea.value = getNote(row.id, field);
  document.getElementById("weekly-note-modal").hidden = false;
  document.body.classList.add("modal-open");
  setTimeout(() => textarea.focus(), 0);
}

function closeNoteModal() {
  document.getElementById("weekly-note-modal").hidden = true;
  if (document.getElementById("weekly-overview-modal").hidden) {
    document.body.classList.remove("modal-open");
  }
  state.editReqId = null;
  state.editField = null;
}

function saveNoteModal() {
  if (state.editReqId == null || !state.editField) return;
  const value = document.getElementById("weekly-note-content").value.trim();
  setNote(state.editReqId, state.editField, value);
  closeNoteModal();
  renderTable();
  showToast("已保存");
}

function setupProductFilter() {
  const btn = document.getElementById("weekly-product-filter-btn");
  const dropdown = document.getElementById("weekly-product-dropdown");

  function renderOptions() {
    dropdown.innerHTML = getProductOptions()
      .map(
        (o) =>
          `<button type="button" class="${o === state.product ? "selected" : ""}" data-value="${escapeHtml(o)}">${escapeHtml(o)}</button>`
      )
      .join("");
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = dropdown.hidden;
    document.querySelectorAll(".dropdown").forEach((d) => (d.hidden = true));
    if (willOpen) {
      renderOptions();
      dropdown.hidden = false;
    }
  });

  dropdown.addEventListener("click", (e) => {
    const opt = e.target.closest("button[data-value]");
    if (!opt) return;
    e.stopPropagation();
    state.product = opt.dataset.value;
    localStorage.setItem(FILTER_KEY, state.product);
    document.getElementById("weekly-product-filter-value").textContent = state.product;
    dropdown.hidden = true;
    state.page = 1;
    render();
  });
}

function init() {
  ensureWeeksAuto();
  // 默认定位到当前周；若无匹配则最新周
  const todayId = makeWeekFromDate(new Date()).id;
  const idxToday = store.weeks.findIndex((w) => w.id === todayId);
  state.weekIndex = idxToday >= 0 ? idxToday : 0;

  setupProductFilter();

  document.querySelectorAll(".weekly-table-header .th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      if (state.sortKey === key) {
        state.sortAsc = !state.sortAsc;
      } else {
        state.sortKey = key;
        state.sortAsc = true;
      }
      state.page = 1;
      render();
    });
  });

  document.getElementById("week-prev").addEventListener("click", () => {
    closeWeekDropdown();
    if (state.weekIndex < store.weeks.length - 1) {
      state.weekIndex += 1;
      state.page = 1;
      render();
    }
  });
  document.getElementById("week-next").addEventListener("click", () => {
    closeWeekDropdown();
    if (state.weekIndex > 0) {
      state.weekIndex -= 1;
      state.page = 1;
      render();
    }
  });
  document.getElementById("week-label-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById("week-dropdown");
    if (dropdown.hidden) openWeekDropdown();
    else closeWeekDropdown();
  });
  document.getElementById("week-dropdown").addEventListener("click", (e) => {
    const item = e.target.closest("button[data-index]");
    if (!item) return;
    selectWeek(Number(item.dataset.index));
  });

  document.getElementById("weekly-tbody").addEventListener("click", (e) => {
    const titleBtn = e.target.closest(".weekly-req-link");
    if (titleBtn) {
      openOverviewModal(titleBtn.dataset.id);
      return;
    }
    const cell = e.target.closest(".weekly-note-cell");
    if (!cell) return;
    if (e.target.closest(".weekly-note-trigger") || e.target === cell) {
      openNoteModal(cell.dataset.id, cell.dataset.field);
    }
  });
  document.getElementById("weekly-tbody").addEventListener("dblclick", (e) => {
    const cell = e.target.closest(".weekly-note-cell");
    if (!cell) return;
    openNoteModal(cell.dataset.id, cell.dataset.field);
  });

  document.getElementById("weekly-pagination").addEventListener("click", (e) => {
    const btn = e.target.closest(".page-btn");
    if (!btn || btn.disabled) return;
    const total = getFilteredRows().length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    let page = state.page;
    if (btn.dataset.page === "prev") page -= 1;
    else if (btn.dataset.page === "next") page += 1;
    else page = Number(btn.dataset.page);
    state.page = Math.min(totalPages, Math.max(1, page));
    renderTable();
  });

  document.getElementById("weekly-note-close").addEventListener("click", closeNoteModal);
  document.getElementById("weekly-note-cancel").addEventListener("click", closeNoteModal);
  document.getElementById("weekly-note-save").addEventListener("click", saveNoteModal);
  document.getElementById("weekly-note-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeNoteModal();
  });

  document.getElementById("weekly-overview-close").addEventListener("click", closeOverviewModal);
  document.getElementById("weekly-overview-cancel").addEventListener("click", closeOverviewModal);
  document.getElementById("weekly-overview-save").addEventListener("click", saveOverviewModal);
  document.getElementById("weekly-overview-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeOverviewModal();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#week-selector")) closeWeekDropdown();
    if (!e.target.closest(".filter-btn-wrap")) {
      document.querySelectorAll(".dropdown").forEach((d) => {
        if (d.id !== "week-dropdown") d.hidden = true;
      });
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeWeekDropdown();
      if (!document.getElementById("weekly-note-modal").hidden) closeNoteModal();
      if (!document.getElementById("weekly-overview-modal").hidden) closeOverviewModal();
    }
  });

  render();
}

init();
