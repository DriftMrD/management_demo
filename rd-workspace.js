const state = {
  search: "",
  product: "全部",
  devStatus: "全部",
  testStatus: "全部",
  hideDone: false,
  page: 1,
  pageSize: 10,
  sortKey: null,
  sortAsc: true,
};

const STATUS_ORDER = ["已超期", "进行中", "部分完成", "未开始", "已完成"];
const WORK_STATUS_OPTIONS = ["全部", "未开始", "进行中", "已完成", "已超期"];

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

function renderPagination(total) {
  const el = document.getElementById("rd-pagination");
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  if (state.page > pages) state.page = pages;
  let html = `<button class="page-btn" data-page="prev" ${state.page === 1 ? "disabled" : ""}>&lt;</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button type="button" class="page-btn ${i === state.page ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  html += `<button class="page-btn" data-page="next" ${state.page === pages ? "disabled" : ""}>&gt;</button>`;
  el.innerHTML = html;
  document.getElementById("rd-total-count").textContent = `共 ${total} 条迭代记录`;
}

function renderTable() {
  const doneToggle = document.getElementById("rd-hide-done-toggle");
  if (doneToggle) doneToggle.checked = !!state.hideDone;
  updateSortHeaders();
  const body = document.getElementById("rd-workspace-tbody");
  const rows = getFiltered();
  renderPagination(rows.length);
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
    renderTable();
  });
}

function init() {
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

  const hideDone = document.getElementById("rd-hide-done-toggle");
  if (hideDone) {
    hideDone.addEventListener("change", () => {
      state.hideDone = hideDone.checked;
      state.page = 1;
      renderTable();
    });
  }

  let timer;
  document.getElementById("rd-search-input").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.search = e.target.value;
      state.page = 1;
      renderTable();
    }, 180);
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown").forEach((d) => (d.hidden = true));
  });

  document.getElementById("rd-pagination").addEventListener("click", (e) => {
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
      renderTable();
    });
  });

  renderTable();
}

init();
