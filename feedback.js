(() => {
  const state = {
    view: "week",
    product: "全部",
    page: 1,
    pageSize: 10,
    dataPage: 1,
    dataPageSize: 8,
    search: "",
    category: "全部",
    conversion: "全部",
    progress: "全部",
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

  function getWeekRows() {
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

  function getIssueUniverse() {
    if (state.product === "全部") return FEEDBACK_ISSUES.slice();
    return FEEDBACK_ISSUES.filter((r) => r.product === state.product);
  }

  function getFilteredIssues() {
    let rows = getIssueUniverse();
    const q = state.search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.product.toLowerCase().includes(q)
      );
    }
    if (state.category !== "全部") rows = rows.filter((r) => r.category === state.category);
    if (state.conversion !== "全部") rows = rows.filter((r) => r.conversion === state.conversion);
    if (state.progress !== "全部") {
      rows = rows.filter((r) => (r.progress || "") === state.progress);
    }
    return rows;
  }

  function pct(part, whole) {
    if (!whole) return "0%";
    return `${((part / whole) * 100).toFixed(1)}%`;
  }

  function buildPaginationHtml(page, totalPages) {
    let html = `<button class="page-btn" data-page="prev" ${page === 1 ? "disabled" : ""}>&lt;</button>`;
    const pages = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
      else if (pages[pages.length - 1] !== "...") pages.push("...");
    }
    for (const p of pages) {
      if (p === "...") html += `<span class="page-ellipsis">...</span>`;
      else html += `<button class="page-btn ${p === page ? "active" : ""}" data-page="${p}">${p}</button>`;
    }
    html += `<button class="page-btn" data-page="next" ${page === totalPages ? "disabled" : ""}>&gt;</button>`;
    return html;
  }

  function renderWeekPagination(total) {
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    document.getElementById("feedback-total-count").textContent = `共 ${total} 条反馈周期记录`;
    document.getElementById("feedback-pagination").innerHTML = buildPaginationHtml(state.page, totalPages);
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

  function polar(cx, cy, r, deg) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function donutSlicePath(cx, cy, rOuter, rInner, startPct, endPct) {
    const start = startPct * 3.6;
    const end = endPct * 3.6;
    if (end - start <= 0.01) return "";
    const large = end - start > 180 ? 1 : 0;
    const [x0, y0] = polar(cx, cy, rOuter, start);
    const [x1, y1] = polar(cx, cy, rOuter, end);
    const [x2, y2] = polar(cx, cy, rInner, end);
    const [x3, y3] = polar(cx, cy, rInner, start);
    return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${rOuter} ${rOuter} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} A ${rInner} ${rInner} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)} Z`;
  }

  function renderKpis(universe) {
    const total = universe.length;
    const converted = universe.filter((r) => r.conversion === "已转需求").length;
    const launched = universe.filter((r) => r.progress === "已完成").length;
    const convRate = pct(converted, total);
    const launchRate = pct(launched, converted || 1);

    document.getElementById("fb-data-kpis").innerHTML = `
      <div class="fb-data-kpi-card">
        <div class="fb-data-kpi-label">总反馈问题</div>
        <div class="fb-data-kpi-value">
          <strong>${total}</strong>
          <span>条</span>
        </div>
      </div>
      <div class="fb-data-kpi-card">
        <div class="fb-data-kpi-label">已转需求</div>
        <div class="fb-data-kpi-value">
          <strong class="is-accent">${converted}</strong>
          <span>条</span>
          <em class="is-accent">(${convRate})</em>
        </div>
      </div>
      <div class="fb-data-kpi-card">
        <div class="fb-data-kpi-label">已上线</div>
        <div class="fb-data-kpi-value">
          <strong class="is-accent">${launched}</strong>
          <span>条</span>
          <em class="is-accent">(${converted ? launchRate : "0%"})</em>
        </div>
      </div>`;
  }

  function setPieHot(wrap, key) {
    if (!wrap) return;
    wrap.querySelectorAll("[data-pie-key]").forEach((el) => {
      el.classList.toggle("is-hot", Boolean(key) && el.dataset.pieKey === key);
      el.classList.toggle("is-dim", Boolean(key) && el.dataset.pieKey !== key);
    });
  }

  function buildDonutMarkup(segments, { twoCol = false, legendMeta } = {}) {
    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
    const cx = 85;
    const cy = 85;
    const rOuter = 78;
    const rInner = 44;
    const pop = 11;
    let cursor = 0;

    const slices = segments
      .map((seg) => {
        const startPct = (cursor / total) * 100;
        cursor += seg.value;
        const endPct = (cursor / total) * 100;
        if (seg.value <= 0) return null;
        const midDeg = ((startPct + endPct) / 2) * 3.6;
        const midRad = ((midDeg - 90) * Math.PI) / 180;
        const dx = (Math.cos(midRad) * pop).toFixed(2);
        const dy = (Math.sin(midRad) * pop).toFixed(2);
        const d = donutSlicePath(cx, cy, rOuter, rInner, startPct, endPct);
        return `<path class="fb-pie-slice" data-pie-key="${escapeHtml(seg.key)}" d="${d}" fill="${seg.color}" style="--dx:${dx}px;--dy:${dy}px" />`;
      })
      .filter(Boolean)
      .join("");

    const legend = segments
      .map((seg) => {
        const meta =
          typeof legendMeta === "function"
            ? legendMeta(seg, total)
            : `<span class="fb-data-legend-pct">${pct(seg.value, total)}</span><span class="fb-data-legend-count">${seg.value}条</span>`;
        return `
          <button type="button" class="fb-legend-item fb-data-legend-item" data-pie-key="${escapeHtml(seg.key)}">
            <span class="fb-dot" style="background:${seg.color}"></span>
            <span class="fb-data-legend-label">${escapeHtml(seg.label)}</span>
            <span class="fb-data-legend-value">${meta}</span>
          </button>`;
      })
      .join("");

    const legendCls = twoCol ? "fb-pie-legend fb-data-legend is-two-col" : "fb-pie-legend fb-data-legend";

    return `
      <div class="fb-pie-wrap fb-data-pie-wrap">
        <svg class="fb-pie-svg" viewBox="0 0 170 170" width="170" height="170" aria-hidden="true">
          <g class="fb-pie-slices">${slices}</g>
          <circle class="fb-pie-hole" cx="85" cy="85" r="44" fill="#fff" />
        </svg>
        <div class="${legendCls}">${legend}</div>
      </div>`;
  }

  function renderCharts(universe) {
    const converted = universe.filter((r) => r.conversion === "已转需求").length;
    const unconverted = universe.length - converted;
    const convTotal = universe.length || 1;

    document.getElementById("fb-conv-chart").innerHTML = buildDonutMarkup(
      [
        { key: "converted", label: "已转需求", value: converted, color: "#5d7599" },
        { key: "unconverted", label: "未转需求", value: unconverted, color: "#e5e7eb" },
      ],
      {
        legendMeta: (seg) =>
          `<span class="fb-data-legend-pct">${pct(seg.value, convTotal)}</span><span class="fb-data-legend-count">${seg.value}条</span>`,
      }
    );

    const withProgress = universe.filter((r) => r.conversion === "已转需求" && r.progress);
    const progressOrder = Object.keys(FEEDBACK_PROGRESS_COLORS);
    const progressSegs = progressOrder
      .map((label) => ({
        key: label,
        label,
        value: withProgress.filter((r) => r.progress === label).length,
        color: FEEDBACK_PROGRESS_COLORS[label],
      }))
      .filter((s) => s.value > 0);

    document.getElementById("fb-progress-chart").innerHTML = buildDonutMarkup(progressSegs, {
      twoCol: true,
    });
  }

  function severityTag(sev) {
    return `<span class="fb-data-tag fb-sev">${escapeHtml(sev)}</span>`;
  }

  function conversionTag(conv) {
    const cls = conv === "已转需求" ? "fb-conv-yes" : "fb-conv-no";
    return `<span class="fb-data-tag ${cls}">${escapeHtml(conv)}</span>`;
  }

  function progressTag(prog) {
    if (!prog) return `<span class="fb-data-dash">—</span>`;
    return `<span class="status-badge status-${escapeHtml(prog)}">${escapeHtml(prog)}</span>`;
  }

  function renderDataRows(rows) {
    const body = document.getElementById("data-table-body");
    if (!rows.length) {
      body.innerHTML = `<div class="feedback-empty">暂无符合条件的问题点</div>`;
      return;
    }

    body.innerHTML = rows
      .map(
        (r, i) => `
      <div class="feedback-row fb-data-row ${i % 2 ? "is-alt" : ""}">
        <div class="fb-td fb-d-cat">${escapeHtml(r.category)}</div>
        <div class="fb-td fb-d-product">${escapeHtml(r.product)}</div>
        <div class="fb-td fb-d-name" title="${escapeHtml(r.name)}">${escapeHtml(r.name)}</div>
        <div class="fb-td fb-d-sev">${severityTag(r.severity)}</div>
        <div class="fb-td fb-d-conv">${conversionTag(r.conversion)}</div>
        <div class="fb-td fb-d-prog">${progressTag(r.progress)}</div>
      </div>`
      )
      .join("");
  }

  function renderDataPagination(total) {
    const totalPages = Math.max(1, Math.ceil(total / state.dataPageSize));
    if (state.dataPage > totalPages) state.dataPage = totalPages;
    document.getElementById("fb-data-total-count").textContent = `共 ${total} 条问题点`;
    document.getElementById("fb-data-pagination").innerHTML = buildPaginationHtml(
      state.dataPage,
      totalPages
    );
  }

  function renderWeek() {
    const rows = getWeekRows();
    renderWeekPagination(rows.length);
    const start = (state.page - 1) * state.pageSize;
    renderWeekRows(rows.slice(start, start + state.pageSize));
  }

  function renderData() {
    const universe = getIssueUniverse();
    renderKpis(universe);
    renderCharts(universe);

    const rows = getFilteredIssues();
    renderDataPagination(rows.length);
    const start = (state.dataPage - 1) * state.dataPageSize;
    renderDataRows(rows.slice(start, start + state.dataPageSize));
  }

  function render() {
    const isData = state.view === "data";
    document.getElementById("pane-week").hidden = isData;
    document.getElementById("pane-data").hidden = !isData;
    document.querySelectorAll("#feedback-view-toggle .toggle-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === state.view);
    });

    if (isData) renderData();
    else renderWeek();
  }

  function setupViewToggle() {
    document.getElementById("feedback-view-toggle").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-view]");
      if (!btn || btn.dataset.view === state.view) return;
      state.view = btn.dataset.view;
      const url = new URL(window.location.href);
      if (state.view === "week") url.searchParams.delete("view");
      else url.searchParams.set("view", state.view);
      history.replaceState(null, "", url);
      render();
    });
  }

  function bindFilterDropdown({ btnId, dropdownId, valueId, options, getValue, setValue }) {
    const btn = document.getElementById(btnId);
    const dropdown = document.getElementById(dropdownId);
    const label = document.getElementById(valueId);

    function paint() {
      const current = getValue();
      label.textContent = current;
      dropdown.innerHTML = options
        .map(
          (p) =>
            `<button type="button" class="${p === current ? "selected" : ""}" data-value="${escapeHtml(p)}">${escapeHtml(p)}</button>`
        )
        .join("");
    }

    paint();

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = dropdown.hidden;
      document.querySelectorAll(".dropdown").forEach((d) => {
        d.hidden = true;
      });
      dropdown.hidden = !willOpen;
    });

    dropdown.addEventListener("click", (e) => {
      const item = e.target.closest("button[data-value]");
      if (!item) return;
      setValue(item.dataset.value);
      paint();
      dropdown.hidden = true;
      render();
    });

    return paint;
  }

  function setupProductFilter() {
    bindFilterDropdown({
      btnId: "feedback-product-btn",
      dropdownId: "feedback-product-dropdown",
      valueId: "feedback-product-value",
      options: FEEDBACK_PRODUCTS,
      getValue: () => state.product,
      setValue: (v) => {
        state.product = v;
        state.page = 1;
        state.dataPage = 1;
      },
    });
  }

  function setupDataFilters() {
    bindFilterDropdown({
      btnId: "fb-cat-btn",
      dropdownId: "fb-cat-dropdown",
      valueId: "fb-cat-value",
      options: FEEDBACK_ISSUE_CATEGORIES,
      getValue: () => state.category,
      setValue: (v) => {
        state.category = v;
        state.dataPage = 1;
      },
    });
    bindFilterDropdown({
      btnId: "fb-conv-btn",
      dropdownId: "fb-conv-dropdown",
      valueId: "fb-conv-value",
      options: FEEDBACK_CONV_STATUSES,
      getValue: () => state.conversion,
      setValue: (v) => {
        state.conversion = v;
        state.dataPage = 1;
      },
    });
    bindFilterDropdown({
      btnId: "fb-prog-btn",
      dropdownId: "fb-prog-dropdown",
      valueId: "fb-prog-value",
      options: FEEDBACK_PROGRESS_STATUSES,
      getValue: () => state.progress,
      setValue: (v) => {
        state.progress = v;
        state.dataPage = 1;
      },
    });

    const search = document.getElementById("fb-data-search");
    search.addEventListener("input", () => {
      state.search = search.value;
      state.dataPage = 1;
      renderData();
    });
  }

  function setupPagination() {
    document.getElementById("feedback-pagination").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn || btn.disabled) return;
      const total = getWeekRows().length;
      const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
      const val = btn.dataset.page;
      if (val === "prev") state.page = Math.max(1, state.page - 1);
      else if (val === "next") state.page = Math.min(totalPages, state.page + 1);
      else state.page = Number(val);
      renderWeek();
    });

    document.getElementById("fb-data-pagination").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn || btn.disabled) return;
      const total = getFilteredIssues().length;
      const totalPages = Math.max(1, Math.ceil(total / state.dataPageSize));
      const val = btn.dataset.page;
      if (val === "prev") state.dataPage = Math.max(1, state.dataPage - 1);
      else if (val === "next") state.dataPage = Math.min(totalPages, state.dataPage + 1);
      else state.dataPage = Number(val);
      renderData();
    });
  }

  function setupActions() {
    const body = document.querySelector(".feedback-body");

    body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === "view-week") {
        window.location.href = `feedback-week.html?id=${encodeURIComponent(id)}`;
      }
    });

    body.addEventListener("pointerover", (e) => {
      const hit = e.target.closest("[data-pie-key]");
      if (!hit || !body.contains(hit)) return;
      const wrap = hit.closest(".fb-pie-wrap");
      if (!wrap) return;
      setPieHot(wrap, hit.dataset.pieKey);
    });

    body.addEventListener("pointerout", (e) => {
      const from = e.target.closest("[data-pie-key]");
      if (!from) return;
      const wrap = from.closest(".fb-pie-wrap");
      if (!wrap) return;
      const to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest("[data-pie-key]") : null;
      if (to && wrap.contains(to) && to.dataset.pieKey === from.dataset.pieKey) return;
      if (to && wrap.contains(to)) {
        setPieHot(wrap, to.dataset.pieKey);
        return;
      }
      setPieHot(wrap, null);
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

  function readUrlState() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view === "data") state.view = "data";
    const product = params.get("product");
    if (product && FEEDBACK_PRODUCTS.includes(product)) state.product = product;
  }

  function init() {
    readUrlState();
    setupSidebar();
    setupViewToggle();
    setupProductFilter();
    setupDataFilters();
    setupPagination();
    setupActions();
    document.addEventListener("click", () => {
      document.querySelectorAll(".dropdown").forEach((d) => {
        d.hidden = true;
      });
    });
    render();
  }

  init();
})();
