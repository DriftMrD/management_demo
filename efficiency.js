// ---------- AI 提效看板（复用需求池 data.js，对齐 Figma 111:228） ----------
const STATUS_ORDER = ["未启动", "进行中", "待评审", "已评审", "已排期", "开发中", "测试中", "已完成", "已取消", "待开发", "待规划"];

const state = {
  search: "",
  product: "全部",
  deliverMonth: "全部",
  iteration: "全部",
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

function linkOrDash(url, label) {
  if (!url) return `<span class="eff-empty">-</span>`;
  const text = label || url;
  return `<a class="eff-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(text)}">${escapeHtml(text)}</a>`;
}

function trackLinkCell(row) {
  const url = (row.aiTrackUrl && String(row.aiTrackUrl).trim()) || "";
  const display = url
    ? `<a class="eff-link eff-track-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(url)}">${escapeHtml(url)}</a>`
    : `<span class="eff-empty eff-track-placeholder">-</span>`;
  return `
    <div class="eff-track-cell" data-id="${row.id}">
      <div class="eff-track-display">
        ${display}
        <button type="button" class="eff-track-edit-btn" title="编辑埋点链接" aria-label="编辑埋点链接">
          <img src="assets/icons/edit.svg" alt="" />
        </button>
      </div>
      <input class="eff-track-input" type="url" hidden value="${escapeHtml(url)}" placeholder="https://" />
    </div>`;
}

function textOrDash(value) {
  if (!value || value === "-") return `<span class="eff-empty">-</span>`;
  return `<span title="${escapeHtml(value)}">${escapeHtml(value)}</span>`;
}

function badge(cls, text) {
  return `<span class="${cls}">${escapeHtml(text)}</span>`;
}

const AVATAR_TONES = [
  { bg: "#e5edf7", color: "#5d7599" },
  { bg: "#edf7ed", color: "#3e8e41" },
  { bg: "#f7efe5", color: "#b87d4b" },
  { bg: "#eee8f7", color: "#7a5ea8" },
];

function avatarTone(name) {
  const code = Array.from(String(name || "")).reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return AVATAR_TONES[code % AVATAR_TONES.length];
}

function feedbackSummaryCell(row) {
  const list = getAiPrdFeedbacks(row);
  if (!list.length) return `<span class="eff-empty">-</span>`;
  const summary = row.aiPrdFeedback || String(list[0].content || "").split("\n")[0];
  return `
    <div class="eff-feedback-cell" data-id="${row.id}">
      <button type="button" class="eff-feedback-trigger" data-id="${row.id}" title="${escapeHtml(summary)}">${escapeHtml(summary)}</button>
      <button type="button" class="eff-feedback-view-btn" data-id="${row.id}" title="查看反馈" aria-label="查看反馈">
        <img src="assets/icons/eye.svg" alt="" />
      </button>
    </div>`;
}

function followUpNoteCell(row) {
  const text = (row.followUpNote && String(row.followUpNote).trim()) || "";
  const summary = text ? text.split("\n")[0] : "";
  const empty = !summary;
  return `
    <div class="eff-followup-cell" data-id="${row.id}">
      <button type="button" class="eff-followup-trigger ${empty ? "is-empty" : ""}" title="${escapeHtml(summary || "点击填写跟进说明")}">
        ${empty ? "点击填写" : escapeHtml(summary)}
      </button>
    </div>`;
}

function formatFeedbackContent(content) {
  return escapeHtml(content || "")
    .split("\n")
    .map((line) => `<p>${line || "&nbsp;"}</p>`)
    .join("");
}

function nowFeedbackTime() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function parseDurationMinutes(value) {
  if (!value) return -1;
  const h = /(\d+)\s*h/i.exec(value);
  const m = /(\d+)\s*min/i.exec(value);
  const hours = h ? Number(h[1]) : 0;
  const mins = m ? Number(m[1]) : 0;
  if (!h && !m) return -1;
  return hours * 60 + mins;
}

function formatDurationTotal(minutes) {
  if (!minutes || minutes <= 0) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${m}min` : `${h}h`;
}

function uniqueSorted(values, compareFn) {
  return [...new Set(values.filter(Boolean))].sort(compareFn);
}

function getProductOptions() {
  return ["全部", ...uniqueSorted(getAiEfficiencyRows().map((r) => r.product))];
}

function getMonthOptions() {
  return [
    "全部",
    ...uniqueSorted(getAiEfficiencyRows().map((r) => r.deliverMonth), (a, b) => String(b).localeCompare(String(a))),
  ];
}

function getIterationOptions() {
  return [
    "全部",
    ...uniqueSorted(getAiEfficiencyRows().map((r) => r.iteration), (a, b) => {
      const na = Number(String(a).replace(/\D/g, "")) || 0;
      const nb = Number(String(b).replace(/\D/g, "")) || 0;
      return nb - na;
    }),
  ];
}

function getFilteredRows() {
  let rows = getAiEfficiencyRows().filter((r) => {
    if (state.search && !r.title.toLowerCase().includes(state.search.toLowerCase())) return false;
    if (state.product !== "全部" && r.product !== state.product) return false;
    if (state.deliverMonth !== "全部" && r.deliverMonth !== state.deliverMonth) return false;
    if (state.iteration !== "全部" && r.iteration !== state.iteration) return false;
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
      } else if (k === "aiDemoDuration") {
        va = parseDurationMinutes(va);
        vb = parseDurationMinutes(vb);
      } else if (k === "iteration") {
        va = Number(String(va || "").replace(/\D/g, "")) || 0;
        vb = Number(String(vb || "").replace(/\D/g, "")) || 0;
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
    const options = getOptions();
    dropdown.innerHTML = options
      .map((o) => {
        const label = o === "全部" && labelId.includes("iteration") ? "全部" : o;
        return `<button type="button" class="${o === getVal() ? "selected" : ""}" data-value="${escapeHtml(o)}">${escapeHtml(label)}</button>`;
      })
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

  document.getElementById("efficiency-total-count").textContent = `共 ${total} 条需求`;

  const el = document.getElementById("efficiency-pagination");
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
  const body = document.getElementById("efficiency-tbody");
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
      const prdFiles = typeof resolveAiPrdFiles === "function" ? resolveAiPrdFiles(r) : r.aiPrdFiles;
      const prd = prdFiles && prdFiles[0];
      const prdUrl = prd ? `https://ai-prd.example.com/req/${r.id}` : "";
      const prdName = prd ? prd.name : "";
      return `
      <div class="table-row">
        <div class="td td-title" title="${escapeHtml(r.title)}">${escapeHtml(r.title)}</div>
        <div class="td w-80">${escapeHtml(r.product)}</div>
        <div class="td w-100">${badge(`status-badge status-${r.status}`, r.status)}</div>
        <div class="td w-110">${escapeHtml(r.deliverMonth || "-")}</div>
        <div class="td w-90">${escapeHtml(r.iteration || "-")}</div>
        <div class="td w-160">${prd ? linkOrDash(prdUrl, prdName) : textOrDash("-")}</div>
        <div class="td w-180">${feedbackSummaryCell(r)}</div>
        <div class="td w-160">${linkOrDash(r.aiDemoUrl)}</div>
        <div class="td w-110">${textOrDash(r.aiDemoDuration)}</div>
        <div class="td w-160">${trackLinkCell(r)}</div>
        <div class="td w-180">${followUpNoteCell(r)}</div>
      </div>`;
    })
    .join("");
}

function renderSortIndicators() {
  document.querySelectorAll(".efficiency-table-header .th.sortable").forEach((th) => {
    th.classList.toggle("sorted-desc", th.dataset.key === state.sortKey && !state.sortAsc);
    th.classList.toggle("sorted-asc", th.dataset.key === state.sortKey && state.sortAsc);
  });
}

function render() {
  document.getElementById("eff-product-filter-value").textContent = state.product;
  document.getElementById("eff-month-filter-value").textContent = state.deliverMonth;
  document.getElementById("eff-iteration-filter-value").textContent = state.iteration;
  renderTable();
  renderSortIndicators();
}

function openProgressModal() {
  const rows = getFilteredRows();
  const total = rows.length;
  const withPrd = rows.filter((r) => {
    const files = typeof resolveAiPrdFiles === "function" ? resolveAiPrdFiles(r) : r.aiPrdFiles;
    return files && files.length;
  }).length;
  const withDemo = rows.filter((r) => r.aiDemoUrl && String(r.aiDemoUrl).trim()).length;
  const withTrack = rows.filter((r) => r.aiTrackUrl && String(r.aiTrackUrl).trim()).length;
  const durationSum = rows.reduce((sum, r) => {
    const m = parseDurationMinutes(r.aiDemoDuration);
    return sum + (m > 0 ? m : 0);
  }, 0);

  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  document.getElementById("eff-progress-scope").textContent =
    state.iteration === "全部" && state.product === "全部" && state.deliverMonth === "全部" && !state.search
      ? "基于全部 AI 提效需求统计"
      : "基于当前筛选结果统计";

  document.getElementById("eff-progress-grid").innerHTML = `
    <div class="eff-stat-card">
      <div class="eff-stat-label">AI 需求总数</div>
      <div class="eff-stat-value">${total}</div>
    </div>
    <div class="eff-stat-card">
      <div class="eff-stat-label">AI PRD 覆盖</div>
      <div class="eff-stat-value">${withPrd}<span class="eff-stat-unit">/ ${total}</span></div>
      <div class="eff-stat-sub">${pct(withPrd)}%</div>
    </div>
    <div class="eff-stat-card">
      <div class="eff-stat-label">AI Demo 覆盖</div>
      <div class="eff-stat-value">${withDemo}<span class="eff-stat-unit">/ ${total}</span></div>
      <div class="eff-stat-sub">${pct(withDemo)}%</div>
    </div>
    <div class="eff-stat-card">
      <div class="eff-stat-label">AI 埋点覆盖</div>
      <div class="eff-stat-value">${withTrack}<span class="eff-stat-unit">/ ${total}</span></div>
      <div class="eff-stat-sub">${pct(withTrack)}%</div>
    </div>
    <div class="eff-stat-card">
      <div class="eff-stat-label">Demo 时长合计</div>
      <div class="eff-stat-value">${formatDurationTotal(durationSum)}</div>
    </div>
  `;

  const byIter = {};
  rows.forEach((r) => {
    const key = r.iteration || "未归属";
    byIter[key] = (byIter[key] || 0) + 1;
  });
  const iterEntries = Object.entries(byIter).sort((a, b) => {
    const na = Number(String(a[0]).replace(/\D/g, "")) || 0;
    const nb = Number(String(b[0]).replace(/\D/g, "")) || 0;
    return nb - na;
  });
  const max = Math.max(1, ...iterEntries.map(([, n]) => n));

  document.getElementById("eff-progress-bars").innerHTML = iterEntries.length
    ? iterEntries
        .map(
          ([name, count]) => `
      <div class="eff-bar-row">
        <span class="eff-bar-label">${escapeHtml(name)}</span>
        <div class="eff-bar-track"><div class="eff-bar-fill" style="width:${(count / max) * 100}%"></div></div>
        <span class="eff-bar-count">${count}</span>
      </div>`
        )
        .join("")
    : `<div class="empty-row">暂无数据</div>`;

  document.getElementById("eff-progress-modal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeProgressModal() {
  document.getElementById("eff-progress-modal").hidden = true;
  if (document.getElementById("eff-feedback-modal").hidden) {
    document.body.classList.remove("modal-open");
  }
}

let feedbackTargetId = null;

function renderFeedbackList(row) {
  const list = getAiPrdFeedbacks(row);
  const el = document.getElementById("eff-feedback-list");
  if (!list.length) {
    el.innerHTML = `<div class="empty-row" style="padding:32px 0">暂无反馈，点击下方「添加反馈」补充</div>`;
    return;
  }
  el.innerHTML = list
    .map((item, idx) => {
      const tone = avatarTone(item.name);
      const initial = String(item.name || "?").slice(0, 1);
      return `
      <div class="eff-feedback-entry">
        <div class="eff-feedback-entry-header">
          <div class="eff-feedback-author">
            <span class="eff-feedback-avatar" style="background:${tone.bg};color:${tone.color}">${escapeHtml(initial)}</span>
            <span class="eff-feedback-name">${escapeHtml(item.name)}</span>
            <span class="eff-feedback-role">${escapeHtml(item.role || "")}</span>
          </div>
          <span class="eff-feedback-time">${escapeHtml(item.time || "")}</span>
        </div>
        <div class="eff-feedback-content">${formatFeedbackContent(item.content)}</div>
      </div>${idx < list.length - 1 ? `<div class="eff-feedback-divider"></div>` : ""}`;
    })
    .join("");
}

function openFeedbackModal(id) {
  const row = REQUIREMENTS.find((r) => r.id === Number(id));
  if (!row) return;
  feedbackTargetId = row.id;
  document.getElementById("eff-feedback-req-title").textContent = row.title;
  document.getElementById("eff-feedback-compose").hidden = true;
  document.getElementById("eff-feedback-add").hidden = false;
  document.getElementById("eff-feedback-add").disabled = true;
  renderFeedbackList(row);
  document.getElementById("eff-feedback-modal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeFeedbackModal() {
  document.getElementById("eff-feedback-modal").hidden = true;
  document.getElementById("eff-feedback-compose").hidden = true;
  feedbackTargetId = null;
  if (document.getElementById("eff-progress-modal").hidden) {
    document.body.classList.remove("modal-open");
  }
}

function showFeedbackCompose() {
  document.getElementById("eff-feedback-compose").hidden = false;
  document.getElementById("eff-feedback-add").hidden = true;
  document.getElementById("eff-feedback-content").value = "";
  document.getElementById("eff-feedback-content").focus();
}

function hideFeedbackCompose() {
  document.getElementById("eff-feedback-compose").hidden = true;
  document.getElementById("eff-feedback-add").hidden = false;
}

function submitFeedback() {
  const row = REQUIREMENTS.find((r) => r.id === feedbackTargetId);
  if (!row) return;
  const name = document.getElementById("eff-feedback-name").value.trim();
  const role = document.getElementById("eff-feedback-role").value;
  const content = document.getElementById("eff-feedback-content").value.trim();
  if (!name || !content) {
    document.getElementById("eff-feedback-content").classList.toggle("field-error", !content);
    document.getElementById("eff-feedback-name").classList.toggle("field-error", !name);
    return;
  }
  document.getElementById("eff-feedback-content").classList.remove("field-error");
  document.getElementById("eff-feedback-name").classList.remove("field-error");

  if (!Array.isArray(row.aiPrdFeedbacks)) row.aiPrdFeedbacks = [];
  row.aiPrdFeedbacks.push({ name, role, time: nowFeedbackTime(), content });
  syncAiPrdFeedbackSummary(row);
  hideFeedbackCompose();
  renderFeedbackList(row);
  render();
}

let trackClickTimer = null;

function startTrackEdit(cell) {
  if (!cell || cell.classList.contains("is-editing")) return;
  const input = cell.querySelector(".eff-track-input");
  const display = cell.querySelector(".eff-track-display");
  if (!input || !display) return;
  cell.classList.add("is-editing");
  display.hidden = true;
  input.hidden = false;
  input.value = input.value || "";
  input.focus();
  input.select();
}

function finishTrackEdit(cell, save) {
  if (!cell || !cell.classList.contains("is-editing")) return;
  const input = cell.querySelector(".eff-track-input");
  const id = Number(cell.dataset.id);
  const row = REQUIREMENTS.find((r) => r.id === id);
  if (save && row && input) {
    row.aiTrackUrl = input.value.trim();
  }
  cell.classList.remove("is-editing");
  render();
}

let followUpEditId = null;

function openFollowUpModal(id) {
  const row = REQUIREMENTS.find((r) => r.id === Number(id));
  if (!row) return;
  followUpEditId = row.id;
  document.getElementById("eff-followup-req-title").textContent = row.title;
  document.getElementById("eff-followup-content").value = row.followUpNote || "";
  document.getElementById("eff-followup-modal").hidden = false;
  setTimeout(() => document.getElementById("eff-followup-content").focus(), 0);
}

function closeFollowUpModal() {
  document.getElementById("eff-followup-modal").hidden = true;
  followUpEditId = null;
}

function saveFollowUpModal() {
  const row = REQUIREMENTS.find((r) => r.id === Number(followUpEditId));
  if (!row) return;
  row.followUpNote = document.getElementById("eff-followup-content").value.trim();
  closeFollowUpModal();
  render();
}

function init() {
  setupDropdown(
    "eff-product-filter-btn",
    "eff-product-dropdown",
    getProductOptions,
    () => state.product,
    (v) => (state.product = v),
    "eff-product-filter-value"
  );
  setupDropdown(
    "eff-month-filter-btn",
    "eff-month-dropdown",
    getMonthOptions,
    () => state.deliverMonth,
    (v) => (state.deliverMonth = v),
    "eff-month-filter-value"
  );
  setupDropdown(
    "eff-iteration-filter-btn",
    "eff-iteration-dropdown",
    getIterationOptions,
    () => state.iteration,
    (v) => (state.iteration = v),
    "eff-iteration-filter-value"
  );

  document.getElementById("eff-search-input").addEventListener("input", (e) => {
    state.search = e.target.value.trim();
    state.page = 1;
    render();
  });

  document.querySelectorAll(".efficiency-table-header .th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      if (state.sortKey === key) state.sortAsc = !state.sortAsc;
      else {
        state.sortKey = key;
        state.sortAsc = true;
      }
      render();
    });
  });

  document.getElementById("efficiency-pagination").addEventListener("click", (e) => {
    const btn = e.target.closest(".page-btn");
    if (!btn || btn.disabled) return;
    const p = btn.dataset.page;
    if (p === "prev") state.page -= 1;
    else if (p === "next") state.page += 1;
    else state.page = Number(p);
    render();
  });

  // 查看提效进展 → progress.html（按钮为链接，无需 JS）
  const progressClose = document.getElementById("eff-progress-close");
  if (progressClose) {
    progressClose.addEventListener("click", closeProgressModal);
    document.getElementById("eff-progress-ok").addEventListener("click", closeProgressModal);
    document.getElementById("eff-progress-modal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeProgressModal();
    });
  }
  document.getElementById("efficiency-tbody").addEventListener("click", (e) => {
    const feedbackView = e.target.closest(".eff-feedback-view-btn, .eff-feedback-trigger");
    if (feedbackView) {
      e.preventDefault();
      const id = feedbackView.dataset.id || feedbackView.closest(".eff-feedback-cell")?.dataset.id;
      openFeedbackModal(id);
      return;
    }

    const followUp = e.target.closest(".eff-followup-cell");
    if (followUp) {
      e.preventDefault();
      openFollowUpModal(followUp.dataset.id);
      return;
    }

    const editBtn = e.target.closest(".eff-track-edit-btn");
    if (editBtn) {
      e.preventDefault();
      e.stopPropagation();
      startTrackEdit(editBtn.closest(".eff-track-cell"));
      return;
    }

    const trackLink = e.target.closest(".eff-track-link");
    if (trackLink) {
      e.preventDefault();
      if (trackClickTimer) {
        clearTimeout(trackClickTimer);
        trackClickTimer = null;
        return;
      }
      const href = trackLink.getAttribute("href");
      trackClickTimer = setTimeout(() => {
        trackClickTimer = null;
        if (href) window.open(href, "_blank", "noopener,noreferrer");
      }, 250);
    }
  });

  document.getElementById("efficiency-tbody").addEventListener("dblclick", (e) => {
    const feedbackCell = e.target.closest(".eff-feedback-cell");
    if (feedbackCell) {
      e.preventDefault();
      openFeedbackModal(feedbackCell.dataset.id);
      return;
    }

    const followUpCell = e.target.closest(".eff-followup-cell");
    if (followUpCell) {
      e.preventDefault();
      openFollowUpModal(followUpCell.dataset.id);
      return;
    }

    const cell = e.target.closest(".eff-track-cell");
    if (!cell) return;
    e.preventDefault();
    if (trackClickTimer) {
      clearTimeout(trackClickTimer);
      trackClickTimer = null;
    }
    startTrackEdit(cell);
  });

  document.getElementById("efficiency-tbody").addEventListener("keydown", (e) => {
    const input = e.target.closest(".eff-track-input");
    if (!input) return;
    const cell = input.closest(".eff-track-cell");
    if (e.key === "Enter") {
      e.preventDefault();
      finishTrackEdit(cell, true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      finishTrackEdit(cell, false);
    }
  });

  document.getElementById("efficiency-tbody").addEventListener("focusout", (e) => {
    const input = e.target.closest(".eff-track-input");
    if (!input) return;
    const cell = input.closest(".eff-track-cell");
    // 延迟，避免点到同一单元格内其它控件时误关
    setTimeout(() => {
      if (!cell.classList.contains("is-editing")) return;
      if (cell.contains(document.activeElement)) return;
      finishTrackEdit(cell, true);
    }, 0);
  });

  document.getElementById("eff-feedback-close").addEventListener("click", closeFeedbackModal);
  document.getElementById("eff-feedback-ok").addEventListener("click", closeFeedbackModal);
  document.getElementById("eff-feedback-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeFeedbackModal();
  });
  document.getElementById("eff-feedback-compose-cancel").addEventListener("click", hideFeedbackCompose);
  document.getElementById("eff-feedback-compose-submit").addEventListener("click", submitFeedback);
  // 「添加反馈」暂不可用，保留按钮样式占位
  document.getElementById("eff-feedback-add").disabled = true;

  document.getElementById("eff-followup-close").addEventListener("click", closeFollowUpModal);
  document.getElementById("eff-followup-cancel").addEventListener("click", closeFollowUpModal);
  document.getElementById("eff-followup-save").addEventListener("click", saveFollowUpModal);
  document.getElementById("eff-followup-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeFollowUpModal();
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown").forEach((d) => (d.hidden = true));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!document.getElementById("eff-followup-modal").hidden) closeFollowUpModal();
    else if (!document.getElementById("eff-feedback-modal").hidden) closeFeedbackModal();
    else if (!document.getElementById("eff-progress-modal").hidden) closeProgressModal();
  });

  render();
}

init();
