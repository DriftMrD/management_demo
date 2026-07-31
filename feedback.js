(() => {
  const state = {
    product: "全部",
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

  function showToast(msg) {
    const el = document.getElementById("feedback-toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      el.hidden = true;
    }, 2200);
  }

  function getFilteredRows() {
    let rows = FEEDBACK_WEEKS.slice();
    if (state.product !== "全部") {
      rows = rows.filter((r) => r.product === state.product);
    }
    rows.sort((a, b) => {
      if (a.periodStart !== b.periodStart) return a.periodStart < b.periodStart ? 1 : -1;
      return a.product.localeCompare(b.product);
    });
    return rows;
  }

  function renderPagination(total) {
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;

    document.getElementById("feedback-total-count").textContent = `共 ${total} 条反馈周期记录`;

    const el = document.getElementById("feedback-pagination");
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

  function renderWeekRows(rows) {
    const body = document.getElementById("week-table-body");
    if (!rows.length) {
      body.innerHTML = `<div class="feedback-empty">暂无符合条件的反馈周报</div>`;
      return;
    }

    body.innerHTML = rows
      .map(
        (r, i) => `
      <div class="feedback-row ${i % 2 ? "is-alt" : ""}" data-id="${escapeHtml(r.id)}">
        <div class="fb-td fb-w-period fb-strong">${escapeHtml(r.period)}</div>
        <div class="fb-td fb-w-product">${escapeHtml(r.product)}</div>
        <div class="fb-td fb-w-num">${r.total}</div>
        <div class="fb-td fb-w-num">${r.valid}</div>
        <div class="fb-td fb-w-sent">
          <span class="sent-neg">${r.negative}</span>
          <span class="sent-sep">/</span>
          <span class="sent-demand">${r.demand}</span>
          <span class="sent-sep">/</span>
          <span class="sent-pos">${r.positive}</span>
        </div>
        <div class="fb-td fb-w-gp">${r.gp != null ? r.gp : "-"}</div>
        <div class="fb-td fb-w-cms">${r.cms != null ? r.cms : "-"}</div>
        <div class="fb-td fb-w-issue" title="${escapeHtml(r.topIssue)}">${escapeHtml(r.topIssue)}</div>
        <div class="fb-td fb-w-action">
          <button type="button" class="fb-link-btn" data-action="view-week" data-id="${escapeHtml(r.id)}">查看</button>
        </div>
      </div>`
      )
      .join("");
  }

  function render() {
    const rows = getFilteredRows();
    renderPagination(rows.length);
    const start = (state.page - 1) * state.pageSize;
    renderWeekRows(rows.slice(start, start + state.pageSize));
  }

  function setupProductFilter() {
    const btn = document.getElementById("feedback-product-btn");
    const dropdown = document.getElementById("feedback-product-dropdown");
    const label = document.getElementById("feedback-product-value");

    dropdown.innerHTML = FEEDBACK_PRODUCTS.map(
      (p) =>
        `<button type="button" class="${p === state.product ? "selected" : ""}" data-value="${escapeHtml(p)}">${escapeHtml(p)}</button>`
    ).join("");

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".dropdown").forEach((d) => {
        if (d !== dropdown) d.hidden = true;
      });
      dropdown.hidden = !dropdown.hidden;
    });

    dropdown.addEventListener("click", (e) => {
      const item = e.target.closest("button[data-value]");
      if (!item) return;
      state.product = item.dataset.value;
      state.page = 1;
      label.textContent = state.product;
      dropdown.querySelectorAll("button[data-value]").forEach((el) => {
        el.classList.toggle("selected", el.dataset.value === state.product);
      });
      dropdown.hidden = true;
      render();
    });

    document.addEventListener("click", () => {
      dropdown.hidden = true;
    });
  }

  function setupPagination() {
    document.getElementById("feedback-pagination").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn || btn.disabled) return;
      const total = getFilteredRows().length;
      const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
      const val = btn.dataset.page;
      if (val === "prev") state.page = Math.max(1, state.page - 1);
      else if (val === "next") state.page = Math.min(totalPages, state.page + 1);
      else state.page = Number(val);
      render();
    });
  }

  function setupActions() {
    document.querySelector(".feedback-body").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === "view-week") {
        window.location.href = `feedback-week.html?id=${encodeURIComponent(id)}`;
      }
    });
  }

  function setupSidebar() {
    const sidebar = document.getElementById("home-sidebar");
    const collapseBtn = document.getElementById("home-collapse-btn");
    collapseBtn.addEventListener("click", () => {
      const collapsed = sidebar.classList.toggle("collapsed");
      collapseBtn.setAttribute("aria-expanded", String(!collapsed));
      collapseBtn.setAttribute("aria-label", collapsed ? "展开导航" : "收起导航");
    });
  }

  function init() {
    setupSidebar();
    setupProductFilter();
    setupPagination();
    setupActions();
    render();
  }

  init();
})();
