const state = {
  view: "work",
  search: "",
  product: "全部",
  devStatus: "全部",
  testStatus: "全部",
  hideDone: false,
  page: 1,
  pageSize: 10,
  sortKey: null,
  sortAsc: true,
  bdSearch: "",
  bdStatus: "全部",
  bdExpandAll: false,
};

const STATUS_ORDER = ["已超期", "进行中", "部分完成", "未开始", "已完成"];
const WORK_STATUS_OPTIONS = ["全部", "未开始", "进行中", "已完成", "已超期"];
const BD_STATUS_OPTIONS = ["全部", "待拆解", "拆解完成"];
const BD_PAGE_DESC = "研发将需求拆成可排期的 SR / AR，并核对优先级与落地版本";
const WORK_PAGE_DESC = "按迭代追踪研测前置、开发测试状态与质量/代码指标";

const collapsedIds = new Set();
let splitDraft = null;

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusBadge(status) {
  const cls =
    status === "已完成"
      ? "iter-phase-badge is-done"
      : status === "超期完成"
        ? "iter-phase-badge is-done-late"
        : status === "进行中"
          ? "iter-phase-badge is-running"
          : status === "已超期"
            ? "iter-phase-badge is-overdue"
            : status === "部分完成"
              ? "iter-phase-badge is-partial"
              : "iter-phase-badge is-pending";
  return `<span class="${cls}">${escapeHtml(displayRdWorkStatus(status))}</span>`;
}

function statusSortValue(status) {
  const key = status === "超期完成" ? "已完成" : status;
  const idx = STATUS_ORDER.indexOf(key);
  return idx < 0 ? 999 : idx;
}

function getRow(it) {
  return getRdWorkspaceRow(it);
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

function getSortValue(row, key) {
  if (key === "total") return row.total;
  if (key === "remaining") return row.remaining;
  if (key === "developed") return row.developed;
  if (key === "count") return row.total;
  if (key === "pre") return statusSortValue(row.preStatus);
  if (key === "dev") return statusSortValue(row.devStatus);
  if (key === "test") return statusSortValue(row.testStatus);
  if (key === "bug") return row.bugCount;
  if (key === "gerritAdd") return row.gerritAdd;
  if (key === "gerritDel") return row.gerritDel;
  if (key === "di") return row.diRate;
  return 0;
}

function getSortedRows(rows) {
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
  const rows = ITERATIONS.map(getRow).filter((row) => {
    if (state.product !== "全部" && row.product !== state.product) return false;
    if (!matchRdWorkStatusFilter(row.devStatus, state.devStatus)) return false;
    if (!matchRdWorkStatusFilter(row.testStatus, state.testStatus)) return false;
    if (
      state.hideDone &&
      (row.devStatus === "已完成" || row.devStatus === "超期完成") &&
      (row.testStatus === "已完成" || row.testStatus === "超期完成")
    ) {
      return false;
    }
    if (q && !String(row.name).toLowerCase().includes(q)) return false;
    return true;
  });
  return getSortedRows(rows);
}

function updateSortHeaders() {
  document.querySelectorAll(".iterations-table-header th.sortable").forEach((th) => {
    const active = th.dataset.key === state.sortKey;
    th.classList.toggle("sorted", active);
    th.classList.toggle("sorted-desc", active && !state.sortAsc);
    th.classList.toggle("sorted-asc", active && state.sortAsc);
  });
}

function renderPagination(total, label) {
  const el = document.getElementById("rd-pagination");
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  if (state.page > pages) state.page = pages;
  let html = `<button class="page-btn" data-page="prev" ${state.page === 1 ? "disabled" : ""}>&lt;</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button type="button" class="page-btn ${i === state.page ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  html += `<button class="page-btn" data-page="next" ${state.page === pages ? "disabled" : ""}>&gt;</button>`;
  el.innerHTML = html;
  document.getElementById("rd-total-count").textContent = label;
}

function renderTable() {
  const doneToggle = document.getElementById("rd-hide-done-toggle");
  if (doneToggle) doneToggle.checked = !!state.hideDone;
  updateSortHeaders();
  const body = document.getElementById("rd-workspace-tbody");
  const rows = getFiltered();
  renderPagination(rows.length, `共 ${rows.length} 条迭代记录`);
  const start = (state.page - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);

  if (!pageRows.length) {
    body.innerHTML = `<tr><td class="empty-row" colspan="11">暂无符合条件的迭代</td></tr>`;
    return;
  }

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
    .map((row, idx) => {
      let productCell = "";
      if (productSpans[idx] > 0) {
        const latest =
          getLatestInProductGroup(pageRows, idx, productSpans[idx]) ||
          getLatestIterationForProduct(row.product) ||
          row;
        const href = `rd-workspace-detail.html?product=${encodeURIComponent(row.product)}&name=${encodeURIComponent(latest.name)}&drawer=open`;
        productCell = `<td class="td-product" rowspan="${productSpans[idx]}"><a class="product-cell-link" href="${href}">${escapeHtml(row.product || "-")}</a></td>`;
      }
      return `
      <tr class="iterations-data-row">
        ${productCell}
        <td class="td-iter">
          <a class="iter-cell-link" href="rd-workspace-detail.html?product=${encodeURIComponent(row.product)}&name=${encodeURIComponent(row.name)}">
            <span class="iter-cell-name">${escapeHtml(row.name)}</span>
          </a>
        </td>
        <td class="td-count td-rd-count">${row.total}</td>
        <td class="td-count td-rd-count">${row.remaining}</td>
        <td class="td-phase">${statusBadge(row.preStatus)}</td>
        <td class="td-phase">${statusBadge(row.devStatus)}</td>
        <td class="td-phase">${statusBadge(row.testStatus)}</td>
        <td class="td-rd-num">${row.bugCount}</td>
        <td class="td-rd-num">${row.gerritAdd}</td>
        <td class="td-rd-num">${row.gerritDel}</td>
        <td class="td-rd-num">${row.diRate != null ? `${row.diRate}%` : "-"}</td>
      </tr>`;
    })
    .join("");
}

function getReqCode(row) {
  if (typeof getReqDisplayCode === "function") return getReqDisplayCode(row);
  if (isAR(row)) return makeArCode(row.id, row.requestDate);
  if (isSR(row)) return makeSrCode(row.id, row.requestDate);
  return makeReqCode(row.id, row.requestDate);
}

function getChildrenOf(row) {
  if (isIR(row)) return getChildSrsOf(row.id);
  if (isSR(row)) return getChildArsOf(row.id);
  return [];
}

function collectDescendants(row, acc = []) {
  getChildrenOf(row).forEach((child) => {
    acc.push(child);
    collectDescendants(child, acc);
  });
  return acc;
}

function matchesBreakdownNode(row) {
  if (state.product !== "全部" && row.product !== state.product) return false;
  if (state.bdStatus !== "全部" && getBreakdownStatus(row) !== state.bdStatus) return false;
  const q = state.bdSearch.trim().toLowerCase();
  if (q) {
    const title = String(row.title || "").toLowerCase();
    const code = getReqCode(row).toLowerCase();
    if (!title.includes(q) && !code.includes(q)) return false;
  }
  return true;
}

function sortBreakdownRows(rows) {
  return rows.slice().sort((a, b) => {
    const pc = String(a.product || "").localeCompare(String(b.product || ""), "zh");
    if (pc !== 0) return pc;
    return b.id - a.id;
  });
}

function isFilteredBreakdownRoot(row) {
  if (!matchesBreakdownNode(row)) return false;
  const parent = getParentReq(row);
  if (!parent) return true;
  return !matchesBreakdownNode(parent);
}

function getBreakdownTrees() {
  if (state.bdStatus !== "全部") {
    return sortBreakdownRows(REQUIREMENTS.filter(isFilteredBreakdownRoot));
  }
  return sortBreakdownRows(REQUIREMENTS.filter(isIR)).filter((ir) => {
    if (matchesBreakdownNode(ir)) return true;
    return collectDescendants(ir).some(matchesBreakdownNode);
  });
}

function breakdownBadge(status, opts = {}) {
  const cls = status === "拆解完成" ? "rd-bd-badge is-done" : "rd-bd-badge is-todo";
  const locked = opts.locked ? " is-locked" : "";
  return `<span class="${cls}${locked}">${escapeHtml(status)}</span>`;
}

function otherBreakdownStatus(status) {
  return status === "拆解完成" ? "待拆解" : "拆解完成";
}

function badgeClass(status) {
  return status === "拆解完成" ? "is-done" : "is-todo";
}

function renderStatusCell(row) {
  const status = getBreakdownStatus(row);
  if (canEditBreakdownStatus(row)) {
    const next = otherBreakdownStatus(status);
    return `<td class="td-bd-status">
      <button type="button" class="rd-bd-flip" data-status-id="${row.id}" aria-label="切换为${next}">
        <span class="rd-bd-flip-inner">
          <span class="rd-bd-flip-face rd-bd-badge ${badgeClass(status)}">${escapeHtml(status)}</span>
          <span class="rd-bd-flip-face is-back rd-bd-badge ${badgeClass(next)}">${escapeHtml(next)}</span>
        </span>
      </button>
    </td>`;
  }
  const hint = isIR(row)
    ? "下方没有 SR 时不可改为拆解完成"
    : "AR 默认为拆解完成，不可修改";
  return `<td class="td-bd-status" title="${hint}">${breakdownBadge(status, { locked: true })}</td>`;
}

function flattenVisibleRows(roots) {
  const rows = [];
  const walk = (row, depth) => {
    const match = state.bdStatus === "全部" || getBreakdownStatus(row) === state.bdStatus;
    const children = getChildrenOf(row);
    const isDraftParent = !!(splitDraft && splitDraft.parentId === row.id);
    if (!match) {
      children.forEach((child) => walk(child, depth));
      return;
    }
    rows.push({ row, depth });
    if (isDraftParent) collapsedIds.delete(row.id);
    if (!children.length && !isDraftParent) return;
    if (collapsedIds.has(row.id)) return;
    if (isDraftParent) rows.push({ draft: true, parent: row, depth: depth + 1 });
    children.forEach((child) => walk(child, depth + 1));
  };
  roots.forEach((root) => walk(root, 0));
  return rows;
}

let collapsedSeeded = false;
function seedCollapsedByDefault() {
  if (collapsedSeeded) return;
  collapsedSeeded = true;
  if (!state.bdExpandAll) collapseAllBreakdown();
}

function parentReqIds() {
  return REQUIREMENTS.filter((row) => getChildrenOf(row).length).map((row) => row.id);
}

function collapseAllBreakdown() {
  parentReqIds().forEach((id) => collapsedIds.add(id));
  state.bdExpandAll = false;
}

function expandAllBreakdown() {
  collapsedIds.clear();
  state.bdExpandAll = true;
}

function syncExpandAllState() {
  const ids = parentReqIds();
  state.bdExpandAll = ids.length > 0 && ids.every((id) => !collapsedIds.has(id));
  const el = document.getElementById("rd-bd-expand-all");
  if (el) el.checked = state.bdExpandAll;
}

function renderBreakdownToggle(row, children) {
  const hasBelow = (children && children.length > 0) || (splitDraft && splitDraft.parentId === row.id);
  if (!hasBelow) {
    return `<span class="rd-bd-toggle is-leaf"><img src="assets/icons/rd-breakdown-file.svg" alt="" /></span>`;
  }
  const collapsed = collapsedIds.has(row.id);
  const src = collapsed ? "assets/icons/chevron-right.svg" : "assets/icons/chevron-down.svg";
  return `<button type="button" class="rd-bd-toggle" data-toggle-id="${row.id}" aria-label="${collapsed ? "展开" : "收起"}"><img src="${src}" alt="" /></button>`;
}

function peekNextReqId() {
  return REQUIREMENTS.reduce((m, r) => Math.max(m, r.id), 0) + 1;
}

function makeAgileSplitCode(level, id, requestDate) {
  const base = level === "AR" ? makeArCode(id, requestDate) : makeSrCode(id, requestDate);
  return `${base}s`;
}

function startInlineSplit(parent) {
  if (!parent || (!isIR(parent) && !isSR(parent))) return;
  collapsedIds.delete(parent.id);
  const childLevel = isIR(parent) ? "SR" : "AR";
  splitDraft = {
    parentId: parent.id,
    title: "",
    reqCode: isTosType(parent) ? "" : makeAgileSplitCode(childLevel, peekNextReqId(), parent.requestDate),
  };
  renderBreakdownTable();
  const input = document.getElementById("rd-bd-draft-title");
  if (input) input.focus();
}

function cancelInlineSplit() {
  splitDraft = null;
  renderBreakdownTable();
}

function confirmInlineSplit() {
  if (!splitDraft) return;
  const parent = REQUIREMENTS.find((r) => r.id === splitDraft.parentId);
  const input = document.getElementById("rd-bd-draft-title");
  const title = (input ? input.value : splitDraft.title).trim();
  if (!parent) {
    cancelInlineSplit();
    return;
  }
  if (!title) {
    if (input) input.focus();
    return;
  }
  const nextId = peekNextReqId();
  const childLevel = isIR(parent) ? "SR" : "AR";
  const codeInput = document.getElementById("rd-bd-draft-code");
  let reqCode = (splitDraft.reqCode || "").trim();
  if (isTosType(parent)) {
    reqCode = (codeInput ? codeInput.value : reqCode).trim();
    if (!reqCode) {
      if (codeInput) codeInput.focus();
      return;
    }
  } else if (!reqCode) {
    reqCode = makeAgileSplitCode(childLevel, nextId, parent.requestDate);
  }
  REQUIREMENTS.push({
    id: nextId,
    parentId: parent.id,
    title,
    detail: `${title}：由「${parent.title}」拆解。`,
    product: parent.product,
    status: parent.status === "待评审" ? "待评审" : "已评审",
    priority: parent.priority || "P1",
    type: parent.type,
    isValue: !!parent.isValue,
    needAnalytics: !!parent.needAnalytics,
    owner: parent.owner,
    avatar: parent.avatar,
    requestDate: parent.requestDate || new Date().toISOString().slice(0, 10),
    deliverMonth: parent.deliverMonth,
    version: parent.version,
    reviewResult: parent.reviewResult === "通过" ? "通过" : null,
    reqLevel: childLevel,
    reqCode,
    iteration: "",
    breakdownStatus: "拆解完成",
  });
  splitDraft = null;
  renderBreakdownTable();
}

function renderDraftRow(item) {
  const parent = item.parent;
  const depth = item.depth;
  const childLevel = isIR(parent) ? "SR" : "AR";
  const tos = isTosType(parent);
  const previewCode = tos
    ? splitDraft.reqCode || ""
    : splitDraft.reqCode || makeAgileSplitCode(childLevel, peekNextReqId(), parent.requestDate);
  const codeCell = tos
    ? `<input id="rd-bd-draft-code" class="rd-bd-draft-input rd-bd-code-input" type="text" maxlength="40" placeholder="请输入需求编号" value="${escapeHtml(previewCode)}" />`
    : `<span class="rd-bd-muted">${escapeHtml(previewCode)}</span>`;
  const pad = 12 + depth * 20;
  return `
    <tr class="iterations-data-row rd-bd-row is-draft" data-draft-parent="${parent.id}">
      <td class="td-bd-plus">
        <div class="rd-bd-plus-cell">
          <span class="rd-bd-plus is-disabled" aria-hidden="true"><img src="assets/icons/plus.svg" alt="" /></span>
        </div>
      </td>
      <td class="td-bd-title">
        <div class="rd-bd-title-cell" style="padding-left:${pad}px">
          <span class="rd-bd-toggle is-leaf"><img src="assets/icons/rd-breakdown-file.svg" alt="" /></span>
          <input id="rd-bd-draft-title" class="rd-bd-draft-input" type="text" maxlength="80" placeholder="请输入子需求标题..." value="${escapeHtml(splitDraft.title || "")}" />
        </div>
      </td>
      <td class="td-bd-code">${codeCell}</td>
      <td class="td-bd-status">${breakdownBadge("拆解完成")}</td>
      <td class="td-bd-priority"><span class="priority-badge priority-${escapeHtml(parent.priority || "P2")}">${escapeHtml(parent.priority || "—")}</span></td>
      <td class="td-bd-type"><span class="type-label type-${escapeHtml(parent.type || "")}">${escapeHtml(parent.type || "—")}</span></td>
      <td class="td-bd-version">${escapeHtml(parent.version || "—")}</td>
      <td class="td-bd-product">
        <div class="rd-bd-draft-actions">
          <button type="button" class="rd-bd-action is-confirm" data-bd-confirm aria-label="确认">
            <img src="assets/icons/rd-bd-check.svg" alt="" />
          </button>
          <button type="button" class="rd-bd-action is-cancel" data-bd-cancel aria-label="取消">
            <img src="assets/icons/rd-bd-close.svg" alt="" />
          </button>
        </div>
      </td>
    </tr>`;
}

function renderBreakdownRow(item) {
  if (item.draft) return renderDraftRow(item);
  const { row, depth } = item;
  const children = getChildrenOf(row);
  const canSplit = isIR(row) || isSR(row);
  const plus = canSplit
    ? `<button type="button" class="rd-bd-plus" data-split-id="${row.id}" aria-label="拆解子需求"><img src="assets/icons/plus.svg" alt="" /></button>`
    : `<span class="rd-bd-plus-spacer"></span>`;
  const titleCls = isIR(row) ? "rd-bd-title is-ir" : isSR(row) ? "rd-bd-title is-sr" : "rd-bd-title is-ar";
  const pad = 12 + depth * 20;
  return `
    <tr class="iterations-data-row rd-bd-row ${depth === 0 ? "is-root" : ""}" data-id="${row.id}">
      <td class="td-bd-plus"><div class="rd-bd-plus-cell">${plus}</div></td>
      <td class="td-bd-title">
        <div class="rd-bd-title-cell" style="padding-left:${pad}px">
          ${renderBreakdownToggle(row, children)}
          <span class="${titleCls}" title="${escapeHtml(row.title || "")}">${escapeHtml(row.title || "—")}</span>
        </div>
      </td>
      <td class="td-bd-code">${escapeHtml(getReqCode(row))}</td>
      ${renderStatusCell(row)}
      <td class="td-bd-priority"><span class="priority-badge priority-${escapeHtml(row.priority || "P2")}">${escapeHtml(row.priority || "—")}</span></td>
      <td class="td-bd-type"><span class="type-label type-${escapeHtml(row.type || "")}">${escapeHtml(row.type || "—")}</span></td>
      <td class="td-bd-version">${escapeHtml(row.version || "—")}</td>
      <td class="td-bd-product">${escapeHtml(row.product || "—")}</td>
    </tr>`;
}

function renderBreakdownTable() {
  seedCollapsedByDefault();
  const expandAll = document.getElementById("rd-bd-expand-all");
  if (expandAll) expandAll.checked = !!state.bdExpandAll;
  const body = document.getElementById("rd-breakdown-tbody");
  const trees = getBreakdownTrees();
  const visibleCount = trees.reduce((n, root) => {
    const desc = collectDescendants(root);
    if (state.bdStatus === "全部") return n + 1 + desc.length;
    return n + 1 + desc.filter((r) => getBreakdownStatus(r) === state.bdStatus).length;
  }, 0);
  renderPagination(trees.length, `共 ${visibleCount} 条需求`);
  const start = (state.page - 1) * state.pageSize;
  const pageTrees = trees.slice(start, start + state.pageSize);
  if (!pageTrees.length) {
    body.innerHTML = `<tr><td class="empty-row" colspan="8">暂无符合条件的需求</td></tr>`;
    return;
  }
  body.innerHTML = flattenVisibleRows(pageTrees).map(renderBreakdownRow).join("");
  const input = document.getElementById("rd-bd-draft-title");
  const codeInput = document.getElementById("rd-bd-draft-code");
  if (codeInput) codeInput.value = splitDraft?.reqCode || "";
  if (input) {
    input.value = splitDraft?.title || "";
    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }
}

function renderView() {
  const isBreakdown = state.view === "breakdown";
  document.getElementById("rd-work-view").hidden = isBreakdown;
  document.getElementById("rd-breakdown-view").hidden = !isBreakdown;
  document.getElementById("rd-toolbar-work").hidden = isBreakdown;
  document.getElementById("rd-toolbar-breakdown").hidden = !isBreakdown;
  document.getElementById("rd-page-desc").textContent = isBreakdown ? BD_PAGE_DESC : WORK_PAGE_DESC;
  document.querySelectorAll("#rd-view-toggle .toggle-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === state.view);
  });
  if (isBreakdown) renderBreakdownTable();
  else renderTable();
}

function setView(view) {
  if (view !== "breakdown") {
    splitDraft = null;
    view = "work";
  }
  if (state.view === view) {
    renderView();
    return;
  }
  state.view = view;
  state.page = 1;
  const url = new URL(window.location.href);
  if (view === "breakdown") url.searchParams.set("view", "breakdown");
  else url.searchParams.delete("view");
  history.replaceState({}, "", url);
  renderView();
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
      .map((o) => `<button type="button" class="${o === current ? "selected" : ""}" data-value="${escapeHtml(o)}">${escapeHtml(o)}</button>`)
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
    renderView();
  });
}

function init() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") === "breakdown") state.view = "breakdown";

  const products = ["全部", ...Object.keys(PRODUCT_ITERATION_OFFSETS || {}).sort((a, b) => a.localeCompare(b, "zh"))];

  setupDropdown(
    "rd-product-filter-btn",
    "rd-product-dropdown",
    () => products,
    () => state.product,
    (v) => (state.product = v),
    "rd-product-filter-value"
  );
  setupDropdown(
    "rd-dev-filter-btn",
    "rd-dev-dropdown",
    () => WORK_STATUS_OPTIONS,
    () => state.devStatus,
    (v) => (state.devStatus = v),
    "rd-dev-filter-value"
  );
  setupDropdown(
    "rd-test-filter-btn",
    "rd-test-dropdown",
    () => WORK_STATUS_OPTIONS,
    () => state.testStatus,
    (v) => (state.testStatus = v),
    "rd-test-filter-value"
  );
  setupDropdown(
    "rd-bd-status-btn",
    "rd-bd-status-dropdown",
    () => BD_STATUS_OPTIONS,
    () => state.bdStatus,
    (v) => (state.bdStatus = v),
    "rd-bd-status-value"
  );

  const hideDone = document.getElementById("rd-hide-done-toggle");
  if (hideDone) {
    hideDone.addEventListener("change", () => {
      state.hideDone = hideDone.checked;
      state.page = 1;
      renderView();
    });
  }

  const expandAll = document.getElementById("rd-bd-expand-all");
  if (expandAll) {
    expandAll.addEventListener("change", () => {
      if (expandAll.checked) expandAllBreakdown();
      else collapseAllBreakdown();
      renderBreakdownTable();
    });
  }

  let timer;
  document.getElementById("rd-search-input").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.search = e.target.value;
      state.page = 1;
      renderView();
    }, 180);
  });

  let bdTimer;
  document.getElementById("rd-bd-search-input").addEventListener("input", (e) => {
    clearTimeout(bdTimer);
    bdTimer = setTimeout(() => {
      state.bdSearch = e.target.value;
      state.page = 1;
      renderView();
    }, 180);
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown").forEach((d) => (d.hidden = true));
  });

  document.getElementById("rd-view-toggle").addEventListener("click", (e) => {
    const btn = e.target.closest(".toggle-btn");
    if (!btn) return;
    setView(btn.dataset.view);
  });

  document.getElementById("rd-pagination").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;
    const total = state.view === "breakdown" ? getBreakdownTrees().length : getFiltered().length;
    const pages = Math.max(1, Math.ceil(total / state.pageSize));
    let page = state.page;
    if (btn.dataset.page === "prev") page -= 1;
    else if (btn.dataset.page === "next") page += 1;
    else page = Number(btn.dataset.page);
    state.page = Math.min(pages, Math.max(1, page));
    renderView();
  });

  document.getElementById("btn-export-rd").addEventListener("click", () => {
    alert("演示环境：导出功能待接入");
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
      renderView();
    });
  });

  document.getElementById("rd-breakdown-tbody").addEventListener("click", (e) => {
    if (e.target.closest("[data-bd-confirm]")) {
      confirmInlineSplit();
      return;
    }
    if (e.target.closest("[data-bd-cancel]")) {
      cancelInlineSplit();
      return;
    }
    const statusBtn = e.target.closest("[data-status-id]");
    if (statusBtn) {
      if (statusBtn.classList.contains("is-flipping")) return;
      const id = Number(statusBtn.dataset.statusId);
      const row = REQUIREMENTS.find((r) => r.id === id);
      if (!row || !canEditBreakdownStatus(row)) return;
      statusBtn.classList.add("is-flipping");
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        row.breakdownStatus = otherBreakdownStatus(getBreakdownStatus(row));
        renderBreakdownTable();
      };
      const inner = statusBtn.querySelector(".rd-bd-flip-inner");
      if (inner) {
        inner.addEventListener(
          "transitionend",
          (ev) => {
            if (ev.propertyName === "transform") finish();
          },
          { once: true }
        );
      }
      setTimeout(finish, 520);
      return;
    }
    const toggle = e.target.closest("[data-toggle-id]");
    if (toggle) {
      const id = Number(toggle.dataset.toggleId);
      if (collapsedIds.has(id)) collapsedIds.delete(id);
      else collapsedIds.add(id);
      syncExpandAllState();
      renderBreakdownTable();
      return;
    }
    const plus = e.target.closest("[data-split-id]");
    if (plus) {
      const id = Number(plus.dataset.splitId);
      const parent = REQUIREMENTS.find((r) => r.id === id);
      if (parent) startInlineSplit(parent);
    }
  });

  document.getElementById("rd-breakdown-tbody").addEventListener("input", (e) => {
    if (!splitDraft) return;
    if (e.target.id === "rd-bd-draft-title") splitDraft.title = e.target.value;
    if (e.target.id === "rd-bd-draft-code") splitDraft.reqCode = e.target.value;
  });

  document.getElementById("rd-breakdown-tbody").addEventListener("keydown", (e) => {
    if (e.target.id !== "rd-bd-draft-title" && e.target.id !== "rd-bd-draft-code") return;
    if (e.key === "Enter") {
      e.preventDefault();
      confirmInlineSplit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelInlineSplit();
    }
  });

  renderView();
}

init();
