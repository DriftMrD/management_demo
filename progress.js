// ---------- AI 提效进展 ----------

const WEEKS = [
  {
    id: 28,
    label: "2026年 第28周（7.7 - 7.13）",
    prd: [
      { title: "时刻感相关大需求", product: "时刻", file: "时刻感AI方案.md", action: "新增", time: "2026-07-10" },
      { title: "Note AI 摘要能力接入", product: "Note", file: "Note摘要AI方案.md", action: "更新", time: "2026-07-12" },
    ],
    feedback: [
      { title: "时刻感相关大需求", product: "时刻", content: "边界场景待补齐", action: "新增", time: "2026-07-11", name: "李明", role: "后端研发" },
    ],
    demo: [
      { title: "Note AI 摘要能力接入", product: "Note", url: "https://demo.example.com/req/15", duration: "2h40min", action: "新增", time: "2026-07-13" },
    ],
    track: [],
  },
  {
    id: 29,
    label: "2026年 第29周（7.14 - 7.20）",
    prd: [
      { title: "日活长期人口服务端触达需求", product: "日活", file: "日活触达AI方案.md", action: "更新", time: "2026-07-15" },
      { title: "搜索自需求", product: "搜索", file: "搜索AI方案.md", action: "更新", time: "2026-07-16" },
      { title: "商城首页改版需求", product: "商城", file: "商城改版AI方案.md", action: "新增", time: "2026-07-18" },
    ],
    feedback: [
      {
        title: "日活长期人口服务端触达需求",
        product: "日活",
        content: "接口延迟问题",
        detail: "压测发现触达接口 P99 超过 800ms，建议补充限流与降级策略说明。",
        action: "新增",
        time: "2026-07-15",
        name: "张伟",
        role: "后端研发",
      },
      {
        title: "大字版首页",
        product: "大字版",
        content: "补充性能指标",
        detail: "建议补充首屏渲染、滚动流畅度及低端机适配相关验收指标。",
        action: "新增",
        time: "2026-07-16",
        name: "王芳",
        role: "前端研发",
      },
      {
        title: "商城首页改版需求",
        product: "商城",
        content: "接口文档待补充",
        detail: "AI PRD 中缺少商品卡片推荐接口字段定义，请补齐入参与返回示例。",
        action: "新增",
        time: "2026-07-18",
        name: "李明",
        role: "测试开发",
      },
    ],
    demo: [
      { title: "日活长期人口服务端触达需求", product: "日活", url: "https://demo.xx/601", duration: "3h20min", action: "更新", time: "2026-07-17" },
      { title: "百宝箱相关需求", product: "百宝箱", url: "https://demo.xx/605", duration: "4h10min", action: "新增", time: "2026-07-19" },
    ],
    track: [
      { title: "日活触达需求", product: "日活", url: "https://track.xx/601", action: "新增", time: "2026-07-18" },
      { title: "百宝箱相关需求", product: "百宝箱", url: "https://track.xx/605", action: "更新", time: "2026-07-19" },
    ],
  },
  {
    id: 30,
    label: "2026年 第30周（7.21 - 7.27）",
    prd: [
      { title: "桌面小组件性能优化", product: "日活", file: "小组件性能AI方案.md", action: "新增", time: "2026-07-22" },
    ],
    feedback: [],
    demo: [
      { title: "搜索联想词排序策略升级", product: "搜索", url: "https://demo.example.com/req/9", duration: "1h30min", action: "更新", time: "2026-07-23" },
    ],
    track: [
      { title: "搜索联想词排序策略升级", product: "搜索", url: "https://track.example.com/req/9", action: "新增", time: "2026-07-24" },
    ],
  },
];

const state = {
  tab: "week",
  weekIndex: 1,
};

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function actionBadge(action) {
  const cls = action === "新增" ? "op-add" : "op-update";
  return `<span class="progress-op ${cls}">${escapeHtml(action)}</span>`;
}

function productBadge(product) {
  return escapeHtml(product);
}

function formatFeedbackContent(content) {
  return escapeHtml(content || "")
    .split("\n")
    .map((line) => `<p>${line || "&nbsp;"}</p>`)
    .join("");
}

const AVATAR_TONES = [
  { bg: "#e5edf7", color: "#5d7599" },
  { bg: "#ebf0e8", color: "#4d7a5c" },
  { bg: "#f5f0e0", color: "#948059" },
  { bg: "#e8e9f0", color: "#656a80" },
];

function avatarTone(name) {
  const code = Array.from(String(name || "")).reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return AVATAR_TONES[code % AVATAR_TONES.length];
}

function feedbackCell(item, index) {
  const summary = item.content || "";
  return `
    <div class="eff-feedback-cell" data-feedback-index="${index}">
      <button type="button" class="eff-feedback-trigger" title="${escapeHtml(summary)}">${escapeHtml(summary)}</button>
      <button type="button" class="eff-feedback-view-btn" title="查看反馈" aria-label="查看反馈">
        <img src="assets/icons/eye.svg" alt="" />
      </button>
    </div>`;
}

function resolveFeedbackList(item) {
  const row =
    typeof REQUIREMENTS !== "undefined"
      ? REQUIREMENTS.find((r) => r.title === item.title)
      : null;
  if (row && typeof getAiPrdFeedbacks === "function") {
    const list = getAiPrdFeedbacks(row);
    if (list.length) return list;
  }
  return [
    {
      name: item.name || "研发同学",
      role: item.role || "后端研发",
      time: item.time || "",
      content: item.detail || item.content || "",
    },
  ];
}

function renderFeedbackList(list) {
  const el = document.getElementById("progress-feedback-list");
  if (!list.length) {
    el.innerHTML = `<div class="empty-row" style="padding:32px 0">暂无反馈</div>`;
    return;
  }
  el.innerHTML = list
    .map((entry, idx) => {
      const tone = avatarTone(entry.name);
      const initial = String(entry.name || "?").slice(0, 1);
      return `
      <div class="eff-feedback-entry">
        <div class="eff-feedback-entry-header">
          <div class="eff-feedback-author">
            <span class="eff-feedback-avatar" style="background:${tone.bg};color:${tone.color}">${escapeHtml(initial)}</span>
            <span class="eff-feedback-name">${escapeHtml(entry.name)}</span>
            <span class="eff-feedback-role">${escapeHtml(entry.role || "")}</span>
          </div>
          <span class="eff-feedback-time">${escapeHtml(entry.time || "")}</span>
        </div>
        <div class="eff-feedback-content">${formatFeedbackContent(entry.content)}</div>
      </div>${idx < list.length - 1 ? `<div class="eff-feedback-divider"></div>` : ""}`;
    })
    .join("");
}

function openFeedbackModal(item) {
  if (!item) return;
  document.getElementById("progress-feedback-req-title").textContent = item.title || "";
  renderFeedbackList(resolveFeedbackList(item));
  document.getElementById("progress-feedback-modal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeFeedbackModal() {
  document.getElementById("progress-feedback-modal").hidden = true;
  document.body.classList.remove("modal-open");
}

function linkCell(url, label) {
  if (!url) return `<span class="eff-empty">-</span>`;
  const text = label || url;
  return `<a class="eff-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
}

function sectionCard(title, count, headerCols, rowsHtml) {
  return `
    <div class="progress-section-card">
      <div class="progress-section-header">
        <div class="progress-section-title">
          <span class="progress-dot"></span>
          <span>${escapeHtml(title)}</span>
        </div>
        <span class="progress-count-badge">${count}项更新</span>
      </div>
      <div class="progress-table-wrap">
        <div class="progress-table-header">${headerCols}</div>
        <div class="progress-table-body">
          ${rowsHtml || `<div class="progress-empty">本周暂无更新</div>`}
        </div>
      </div>
    </div>`;
}

function renderWeekView() {
  const week = WEEKS[state.weekIndex];
  document.getElementById("week-label").textContent = week.label;
  document.getElementById("week-prev").disabled = state.weekIndex === 0;
  document.getElementById("week-next").disabled = state.weekIndex === WEEKS.length - 1;

  const all = [...week.prd, ...week.feedback, ...week.demo, ...week.track];
  const reqSet = new Set(all.map((r) => r.title));
  document.getElementById("week-summary").textContent =
    `本周共更新 ${all.length} 项，涉及 ${reqSet.size} 个需求`;

  // 四表共用列：名称 | 产品 | 内容 | 时长 | 操作 | 时间（保证竖向对齐）
  const rowHtml = (r, i, contentHtml, durationHtml = "") => `
    <div class="progress-table-row ${i % 2 ? "alt" : ""}">
      <div class="ptd col-name" title="${escapeHtml(r.title)}">${escapeHtml(r.title)}</div>
      <div class="ptd col-product">${productBadge(r.product)}</div>
      <div class="ptd col-content">${contentHtml}</div>
      <div class="ptd col-duration">${durationHtml || '<span class="progress-dash">—</span>'}</div>
      <div class="ptd col-action">${actionBadge(r.action)}</div>
      <div class="ptd col-time muted">${escapeHtml(r.time)}</div>
    </div>`;

  const head = (contentLabel, showDuration) => `
    <div class="pth col-name">需求名称</div>
    <div class="pth col-product">所属产品</div>
    <div class="pth col-content">${escapeHtml(contentLabel)}</div>
    <div class="pth col-duration">${showDuration ? "时长估计" : ""}</div>
    <div class="pth col-action">操作</div>
    <div class="pth col-time">更新时间</div>`;

  const prdRows = week.prd
    .map((r, i) =>
      rowHtml(r, i, linkCell(`https://ai-prd.example.com/${encodeURIComponent(r.file)}`, r.file))
    )
    .join("");
  const feedbackRows = week.feedback
    .map((r, i) => rowHtml(r, i, feedbackCell(r, i)))
    .join("");
  const demoRows = week.demo
    .map((r, i) => rowHtml(r, i, linkCell(r.url), escapeHtml(r.duration)))
    .join("");
  const trackRows = week.track.map((r, i) => rowHtml(r, i, linkCell(r.url))).join("");

  document.getElementById("week-sections").innerHTML = `
    <div class="progress-section-row">
      ${sectionCard("本周AI PRD更新", week.prd.length, head("AI PRD", false), prdRows)}
      ${sectionCard("本周研发反馈更新", week.feedback.length, head("反馈内容", false), feedbackRows)}
    </div>
    <div class="progress-section-row">
      ${sectionCard("本周AI Demo更新", week.demo.length, head("AI Demo链接", true), demoRows)}
      ${sectionCard("本周埋点更新", week.track.length, head("AI埋点链接", false), trackRows)}
    </div>`;

  document.getElementById("week-sections").querySelectorAll(".eff-feedback-cell").forEach((cell) => {
    const open = () => {
      const idx = Number(cell.dataset.feedbackIndex);
      openFeedbackModal(week.feedback[idx]);
    };
    cell.querySelector(".eff-feedback-trigger")?.addEventListener("click", open);
    cell.querySelector(".eff-feedback-view-btn")?.addEventListener("click", open);
    cell.addEventListener("dblclick", open);
  });
}

function renderOverallView() {
  const rows = typeof getAiEfficiencyRows === "function" ? getAiEfficiencyRows() : [];
  document.getElementById("overall-count").textContent = `${rows.length} 条需求`;

  const byIter = {};
  rows.forEach((r) => {
    const key = r.iteration || "未归属";
    if (!byIter[key]) byIter[key] = { total: 0, prd: 0, demo: 0, track: 0 };
    byIter[key].total += 1;
    if (r.aiPrdFiles && r.aiPrdFiles.length) byIter[key].prd += 1;
    if (r.aiDemoUrl) byIter[key].demo += 1;
    if (r.aiTrackUrl) byIter[key].track += 1;
  });

  const entries = Object.entries(byIter).sort((a, b) => {
    const na = Number(String(a[0]).replace(/\D/g, "")) || 0;
    const nb = Number(String(b[0]).replace(/\D/g, "")) || 0;
    return nb - na;
  });

  const body = document.getElementById("overall-tbody");
  if (!entries.length) {
    body.innerHTML = `<div class="progress-empty">暂无数据</div>`;
    return;
  }

  body.innerHTML = entries
    .map(
      ([name, s], i) => `
    <div class="progress-table-row progress-overall-row ${i % 2 ? "alt" : ""}">
      <div class="ptd col-iter">${escapeHtml(name)}</div>
      <div class="ptd col-num">${s.total}</div>
      <div class="ptd col-num">${s.prd}</div>
      <div class="ptd col-num">${s.demo}</div>
      <div class="ptd col-num">${s.track}</div>
    </div>`
    )
    .join("");
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
  dropdown.innerHTML = [...WEEKS]
    .map((w, i) => ({ w, i }))
    .reverse()
    .map(
      ({ w, i }) => `
    <button type="button" role="option" data-index="${i}" class="${i === state.weekIndex ? "selected" : ""}" aria-selected="${i === state.weekIndex}">
      ${escapeHtml(w.label)}
    </button>`
    )
    .join("");
  dropdown.hidden = false;
  btn.setAttribute("aria-expanded", "true");
}

function toggleWeekDropdown() {
  const dropdown = document.getElementById("week-dropdown");
  if (dropdown.hidden) openWeekDropdown();
  else closeWeekDropdown();
}

function selectWeek(index) {
  if (index < 0 || index >= WEEKS.length || index === state.weekIndex) {
    closeWeekDropdown();
    return;
  }
  state.weekIndex = index;
  closeWeekDropdown();
  renderWeekView();
}

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll("#progress-tab-toggle .toggle-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  document.getElementById("progress-week-view").hidden = tab !== "week";
  document.getElementById("progress-overall-view").hidden = tab !== "overall";
  closeWeekDropdown();
  if (tab === "week") renderWeekView();
  else renderOverallView();
}

function init() {
  document.getElementById("progress-tab-toggle").addEventListener("click", (e) => {
    const btn = e.target.closest(".toggle-btn");
    if (!btn || !btn.dataset.tab || btn.disabled) return;
    switchTab(btn.dataset.tab);
  });
  document.getElementById("week-prev").addEventListener("click", () => {
    closeWeekDropdown();
    if (state.weekIndex > 0) {
      state.weekIndex -= 1;
      renderWeekView();
    }
  });
  document.getElementById("week-next").addEventListener("click", () => {
    closeWeekDropdown();
    if (state.weekIndex < WEEKS.length - 1) {
      state.weekIndex += 1;
      renderWeekView();
    }
  });
  document.getElementById("week-label-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleWeekDropdown();
  });
  document.getElementById("week-dropdown").addEventListener("click", (e) => {
    const item = e.target.closest("button[data-index]");
    if (!item) return;
    selectWeek(Number(item.dataset.index));
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#week-selector")) closeWeekDropdown();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeWeekDropdown();
      if (!document.getElementById("progress-feedback-modal").hidden) closeFeedbackModal();
    }
  });
  document.getElementById("progress-feedback-close").addEventListener("click", closeFeedbackModal);
  document.getElementById("progress-feedback-ok").addEventListener("click", closeFeedbackModal);
  document.getElementById("progress-feedback-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeFeedbackModal();
  });
  switchTab("week");
}

init();
