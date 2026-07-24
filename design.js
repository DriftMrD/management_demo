// ---------- 需求设计看板 ----------
const PRIORITY_ORDER = ["P0", "P1", "P2"];

const state = {
  search: "",
  product: "全部",
  priority: "全部",
  sortKey: null,
  sortAsc: true,
  page: 1,
  pageSize: 10,
};

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

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "zh"));
}

function getProductOptions() {
  return ["全部", ...uniqueSorted(getDesignBoardRows().map((r) => r.product))];
}

function getPriorityOptions() {
  return ["全部", ...PRIORITY_ORDER];
}

function reqCodeOf(row) {
  if (row.reqCode) return row.reqCode;
  if (typeof isAR === "function" && isAR(row)) return makeArCode(row.id, row.requestDate);
  if (typeof isIR === "function" && isIR(row)) return makeReqCode(row.id, row.requestDate);
  return makeSrCode(row.id, row.requestDate);
}

function getDesignTimes(row) {
  const dates = getDesignSchedule(row) || {};
  return {
    uxStart: dates.uxStart || "",
    uxEnd: dates.uxEnd || "",
    uiStart: dates.uiStart || "",
    uiEnd: dates.uiEnd || "",
    uxTime: formatDesignDateRange(dates.uxStart, dates.uxEnd),
    uiTime: formatDesignDateRange(dates.uiStart, dates.uiEnd),
  };
}

/** UX/UI 时间态：已交交付物优先绿；否则超截止红 */
function designTimeTone(endDate, deliverableUrl) {
  const hasDoc = !!(deliverableUrl && String(deliverableUrl).trim());
  if (hasDoc) return "is-done";
  const end = String(endDate || "").trim();
  if (!end || end === "-") return "";
  const today = typeof todayISO === "function" ? todayISO() : "";
  if (today && today > end) return "is-overdue";
  return "";
}

function designTimeCell(label, endDate, deliverableUrl) {
  const text = label && label !== "-" ? label : "-";
  if (text === "-") return `<span class="design-mono design-time is-empty">-</span>`;
  const tone = designTimeTone(endDate, deliverableUrl);
  return `<span class="design-mono design-time ${tone}">${escapeHtml(text)}</span>`;
}

function getParentIr(row) {
  if (!row || !row.parentId) return null;
  return REQUIREMENTS.find((r) => r.id === row.parentId) || null;
}

/** 列表用：与需求详情同一套字段 —— PRD=链接，AI PRD=附件，AI Demo=链接 */
function getDesignDocFields(row) {
  if (!row) return { demoUrl: "", prd: null, aiPrd: null };
  const parent = getParentIr(row);
  const docs =
    typeof resolvePrdDocsForDisplay === "function"
      ? resolvePrdDocsForDisplay(row)
      : { prdUrl: row.prdUrl || "", aiPrdFiles: row.aiPrdFiles || [], attachments: row.attachments || [] };

  // AI Demo：详情页链接字段（打标点自身，或回退父 IR）
  const demoUrl = String(row.aiDemoUrl || (parent && parent.aiDemoUrl) || "").trim();

  // PRD：详情页「PRD 链接」，展示 URL 本身（与 AI Demo 同形态）
  const prdUrl = String(docs.prdUrl || row.prdUrl || "").trim();
  const prd = prdUrl ? { label: prdUrl, href: prdUrl } : null;

  // AI PRD：详情页上传附件；文件名可点，链到预览地址
  const aiFiles = (docs.aiPrdFiles && docs.aiPrdFiles.length ? docs.aiPrdFiles : null) || row.aiPrdFiles || [];
  let aiPrd = null;
  if (aiFiles.length) {
    const file = aiFiles[0];
    const fileUrl = String(file.url || "").trim() || `https://ai-prd.example.com/req/${row.id}`;
    const label = file.name || fileUrl;
    aiPrd = { label, href: fileUrl };
  }

  return { demoUrl, prd, aiPrd };
}

function docLinkCell(item, empty = "-") {
  if (!item || !item.label) return `<span class="design-doc-empty">${escapeHtml(empty)}</span>`;
  if (item.href) {
    return `<a class="design-doc-link" href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</a>`;
  }
  return `<span class="design-doc-file" title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</span>`;
}

function demoLinkCell(url) {
  const val = String(url || "").trim();
  if (!val) return `<span class="design-doc-empty">-</span>`;
  return `<a class="design-doc-link" href="${escapeHtml(val)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(val)}">${escapeHtml(val)}</a>`;
}

function deliverableCell(row, field) {
  const url = (row[field] && String(row[field]).trim()) || "";
  const kind = field === "uiUrl" ? "ui" : "ux";
  if (url) {
    return `
      <div class="design-deliverable-cell" data-id="${row.id}" data-field="${field}" data-kind="${kind}">
        <a class="design-deliverable-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(url)}">${escapeHtml(url)}</a>
        <button type="button" class="design-deliverable-edit-btn" title="编辑链接" aria-label="编辑链接">
          <img src="assets/icons/edit.svg" alt="" />
        </button>
        <input class="design-deliverable-input" type="url" hidden value="${escapeHtml(url)}" placeholder="点击输入" />
      </div>`;
  }
  return `
    <div class="design-deliverable-cell is-empty" data-id="${row.id}" data-field="${field}" data-kind="${kind}">
      <input class="design-deliverable-input" type="url" value="" placeholder="点击输入" />
    </div>`;
}

function getFilteredRows() {
  let rows = getDesignBoardRows().filter((r) => {
    if (state.search && !String(r.title).toLowerCase().includes(state.search.toLowerCase())) return false;
    if (state.product !== "全部" && r.product !== state.product) return false;
    if (state.priority !== "全部" && r.priority !== state.priority) return false;
    return true;
  });

  if (state.sortKey) {
    const k = state.sortKey;
    rows = [...rows].sort((a, b) => {
      let va = a[k];
      let vb = b[k];
      if (k === "priority") {
        va = PRIORITY_ORDER.indexOf(va);
        vb = PRIORITY_ORDER.indexOf(vb);
        if (va < 0) va = 999;
        if (vb < 0) vb = 999;
      } else if (k === "isValue") {
        va = va ? 1 : 0;
        vb = vb ? 1 : 0;
      } else if (k === "uxTime" || k === "uiTime") {
        const key = k === "uxTime" ? "uxStart" : "uiStart";
        va = getDesignTimes(a)[key] || "";
        vb = getDesignTimes(b)[key] || "";
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

function setupDropdown(btnId, dropdownId, getOptions, getVal, setVal, labelId) {
  const btn = document.getElementById(btnId);
  const dropdown = document.getElementById(dropdownId);

  function renderOptions() {
    dropdown.innerHTML = getOptions()
      .map((o) => `<button type="button" class="${o === getVal() ? "selected" : ""}" data-value="${escapeHtml(o)}">${escapeHtml(o)}</button>`)
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
    setVal(opt.dataset.value);
    document.getElementById(labelId).textContent = opt.dataset.value;
    dropdown.hidden = true;
    state.page = 1;
    render();
  });
}

function renderPagination(total) {
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;

  document.getElementById("design-total-count").textContent = `共 ${total} 条需求`;

  const el = document.getElementById("design-pagination");
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

function renderTable() {
  const body = document.getElementById("design-tbody");
  const rows = getFilteredRows();
  renderPagination(rows.length);

  const start = (state.page - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);

  if (!pageRows.length) {
    body.innerHTML = `<div class="empty-row">暂无符合条件的需求</div>`;
    return;
  }

  body.innerHTML = pageRows
    .map((r) => {
      const times = getDesignTimes(r);
      const code = reqCodeOf(r);
      const docs = getDesignDocFields(r);
      return `
      <div class="table-row">
        <div class="td td-title">
          <div class="design-title-stack">
            <span class="design-title-text" title="${escapeHtml(r.title)}">${escapeHtml(r.title)}</span>
            <span class="design-title-code">${escapeHtml(code)}</span>
          </div>
        </div>
        <div class="td w-60 centered"><span class="${r.isValue ? "value-yes" : "value-no"}">${r.isValue ? "是" : "否"}</span></div>
        <div class="td w-90">${escapeHtml(r.product)}</div>
        <div class="td w-70 centered">${badge(`priority-badge priority-${r.priority}`, r.priority)}</div>
        <div class="td w-90">${badge(`type-label type-${r.type}`, r.type)}</div>
        <div class="td w-80">${escapeHtml(r.version || "-")}</div>
        <div class="td w-160">${docLinkCell(docs.aiPrd)}</div>
        <div class="td w-140">${docLinkCell(docs.prd)}</div>
        <div class="td w-160">${demoLinkCell(docs.demoUrl)}</div>
        <div class="td w-140">${designTimeCell(times.uxTime, times.uxEnd, r.uxUrl)}</div>
        <div class="td w-140">${designTimeCell(times.uiTime, times.uiEnd, r.uiUrl)}</div>
        <div class="td w-180">${deliverableCell(r, "uiUrl")}</div>
        <div class="td w-180">${deliverableCell(r, "uxUrl")}</div>
      </div>`;
    })
    .join("");
}

function renderSortIndicators() {
  document.querySelectorAll(".design-table-header .th.sortable").forEach((th) => {
    th.classList.toggle("sorted-desc", th.dataset.key === state.sortKey && !state.sortAsc);
    th.classList.toggle("sorted-asc", th.dataset.key === state.sortKey && state.sortAsc);
  });
}

function render() {
  document.getElementById("design-product-filter-value").textContent = state.product;
  document.getElementById("design-priority-filter-value").textContent = state.priority;
  renderTable();
  renderSortIndicators();
}

function findRowById(id) {
  return getDesignBoardRows().find((r) => String(r.id) === String(id));
}

function startDeliverableEdit(cell) {
  if (!cell) return;
  const input = cell.querySelector(".design-deliverable-input");
  if (!input) return;
  cell.classList.add("is-editing");
  input.hidden = false;
  input.focus();
  input.select();
}

function commitDeliverableEdit(cell) {
  if (!cell) return;
  const input = cell.querySelector(".design-deliverable-input");
  if (!input) return;
  const row = findRowById(cell.dataset.id);
  if (!row) return;
  row[cell.dataset.field] = input.value.trim();
  cell.classList.remove("is-editing");
  render();
}

function bindEvents() {
  document.getElementById("design-search-input").addEventListener("input", (e) => {
    state.search = e.target.value.trim();
    state.page = 1;
    render();
  });

  setupDropdown(
    "design-product-filter-btn",
    "design-product-dropdown",
    getProductOptions,
    () => state.product,
    (v) => (state.product = v),
    "design-product-filter-value"
  );
  setupDropdown(
    "design-priority-filter-btn",
    "design-priority-dropdown",
    getPriorityOptions,
    () => state.priority,
    (v) => (state.priority = v),
    "design-priority-filter-value"
  );

  document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown").forEach((d) => (d.hidden = true));
  });

  document.querySelector(".design-table-header").addEventListener("click", (e) => {
    const th = e.target.closest(".th.sortable");
    if (!th) return;
    const key = th.dataset.key;
    if (state.sortKey === key) state.sortAsc = !state.sortAsc;
    else {
      state.sortKey = key;
      state.sortAsc = true;
    }
    render();
  });

  document.getElementById("design-pagination").addEventListener("click", (e) => {
    const btn = e.target.closest(".page-btn");
    if (!btn || btn.disabled) return;
    const total = getFilteredRows().length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    const page = btn.dataset.page;
    if (page === "prev") state.page = Math.max(1, state.page - 1);
    else if (page === "next") state.page = Math.min(totalPages, state.page + 1);
    else state.page = Number(page);
    render();
  });

  const body = document.getElementById("design-tbody");

  body.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".design-deliverable-edit-btn");
    if (editBtn) {
      e.preventDefault();
      e.stopPropagation();
      startDeliverableEdit(editBtn.closest(".design-deliverable-cell"));
    }
  });

  body.addEventListener("keydown", (e) => {
    const input = e.target.closest(".design-deliverable-input");
    if (!input) return;
    if (e.key === "Enter") {
      e.preventDefault();
      commitDeliverableEdit(input.closest(".design-deliverable-cell"));
    } else if (e.key === "Escape") {
      e.preventDefault();
      render();
    }
  });

  body.addEventListener("focusout", (e) => {
    const input = e.target.closest(".design-deliverable-input");
    if (!input) return;
    const cell = input.closest(".design-deliverable-cell");
    if (cell.classList.contains("is-empty") || cell.classList.contains("is-editing")) {
      commitDeliverableEdit(cell);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  render();
});
