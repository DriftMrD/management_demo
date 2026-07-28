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
    followUp: [
      { title: "Note AI 摘要能力接入", note: "摘要质量需下周补一轮评测", action: "新增", time: "2026-07-13" },
    ],
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
      { title: "日活长期人口服务端触达需求", product: "日活", url: "https://track.xx/601", action: "新增", time: "2026-07-18" },
      { title: "百宝箱相关需求", product: "百宝箱", url: "https://track.xx/605", action: "更新", time: "2026-07-19" },
    ],
    followUp: [
      { title: "日活长期人口服务端触达需求", note: "周会：限流方案本周补进 PRD，张伟跟进", action: "更新", time: "2026-07-16" },
      { title: "商城首页改版需求", note: "接口字段待研发对齐后再改 Demo", action: "新增", time: "2026-07-18" },
      { title: "百宝箱相关需求", note: "埋点口径已对齐数据侧", action: "更新", time: "2026-07-19" },
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
    followUp: [
      { title: "搜索联想词排序策略升级", note: "实验流量待运营确认", action: "新增", time: "2026-07-24" },
    ],
  },
];

const state = {
  tab: "req",
  weekIndex: 1,
  followUpEditId: null,
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

function openFeedbackModalByRow(row) {
  if (!row) return;
  document.getElementById("progress-feedback-req-title").textContent = row.title || "";

  const week = WEEKS[state.weekIndex];
  const weekFields = lookupWeekFields(getWeekUpdateMap(week), row.title);
  let list = [];

  // 优先展示本周更新里的反馈（与单元格摘要一致）
  if (weekFields.feedback) {
    list = resolveFeedbackList(weekFields.feedback);
  }
  if (!list.length && !row._synthetic && typeof getAiPrdFeedbacks === "function") {
    list = getAiPrdFeedbacks(row);
  }
  // 再兜底：周数据摘要 / 需求摘要字段
  if (!list.length) {
    const content =
      weekFields.feedback?.detail ||
      weekFields.feedback?.content ||
      row.aiPrdFeedback ||
      "";
    if (content) {
      list = [
        {
          name: weekFields.feedback?.name || "研发同学",
          role: weekFields.feedback?.role || "后端研发",
          time: weekFields.feedback?.time || "",
          content,
        },
      ];
    }
  }

  renderFeedbackList(list);
  document.getElementById("progress-feedback-modal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeFeedbackModal() {
  document.getElementById("progress-feedback-modal").hidden = true;
  document.body.classList.remove("modal-open");
}

function openFollowUpModal(row) {
  if (!row) return;
  state.followUpEditId = row.id;
  document.getElementById("progress-followup-req-title").textContent = row.title;
  document.getElementById("progress-followup-content").value = row.followUpNote || "";
  document.getElementById("progress-followup-modal").hidden = false;
  document.body.classList.add("modal-open");
  setTimeout(() => document.getElementById("progress-followup-content").focus(), 0);
}

function closeFollowUpModal() {
  document.getElementById("progress-followup-modal").hidden = true;
  state.followUpEditId = null;
  if (document.getElementById("progress-feedback-modal").hidden) {
    document.body.classList.remove("modal-open");
  }
}

function saveFollowUpModal() {
  const row = REQUIREMENTS.find((r) => r.id === Number(state.followUpEditId));
  if (!row) return;
  row.followUpNote = document.getElementById("progress-followup-content").value.trim();
  closeFollowUpModal();
  if (state.tab === "req") renderReqView();
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

function normalizeTitle(title) {
  return String(title || "")
    .replace(/\s+/g, "")
    .replace(/需求$/g, "");
}

function titlesMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function findRowByTitle(title) {
  if (typeof REQUIREMENTS === "undefined") return null;
  return REQUIREMENTS.find((r) => titlesMatch(r.title, title)) || null;
}

function getWeekUpdateMap(week) {
  const map = new Map();
  const touch = (title, field, item) => {
    if (!title) return;
    if (!map.has(title)) {
      map.set(title, { prd: null, feedback: null, demo: null, track: null, followUp: null });
    }
    const entry = map.get(title);
    entry[field] = item;
  };

  (week.prd || []).forEach((item) => touch(item.title, "prd", item));
  (week.feedback || []).forEach((item) => touch(item.title, "feedback", item));
  (week.demo || []).forEach((item) => touch(item.title, "demo", item));
  (week.track || []).forEach((item) => touch(item.title, "track", item));
  (week.followUp || []).forEach((item) => touch(item.title, "followUp", item));

  return map;
}

function lookupWeekFields(updateMap, title) {
  for (const [key, value] of updateMap.entries()) {
    if (titlesMatch(key, title)) return value;
  }
  return { prd: null, feedback: null, demo: null, track: null, followUp: null };
}

function applyWeekFollowUps(week) {
  (week.followUp || []).forEach((item) => {
    const row = findRowByTitle(item.title);
    if (!row) return;
    if (!row.followUpNote || !String(row.followUpNote).trim()) {
      row.followUpNote = item.note || "";
    }
  });
}

function cellActionStatus(weekItem) {
  if (!weekItem) return "none";
  return weekItem.action === "新增" ? "add" : weekItem.action === "更新" ? "update" : "none";
}

function statusCell({ status, text, title, interactive, href, dataAttrs }) {
  const hasText = !!(text && String(text).trim());
  const display = hasText ? text : "-";
  const tip = title || text || "";
  const attrs = Object.entries(dataAttrs || {})
    .map(([k, v]) => `${k}="${escapeHtml(String(v))}"`)
    .join(" ");
  const emptyCls = !hasText && status === "none" ? " is-blank" : "";
  const cls = `progress-status-cell is-${status}${emptyCls}${interactive || href ? " is-interactive" : ""}`;
  if (href && hasText) {
    return `
      <a class="${cls}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(tip)}" ${attrs}>
        <span>${escapeHtml(display)}</span>
      </a>`;
  }
  if (interactive) {
    return `
      <button type="button" class="${cls}" title="${escapeHtml(tip)}" ${attrs}>
        <span>${escapeHtml(display)}</span>
      </button>`;
  }
  return `
    <div class="${cls}" title="${escapeHtml(tip)}" ${attrs}>
      <span>${escapeHtml(display)}</span>
    </div>`;
}

function badge(cls, text) {
  return `<span class="${cls}">${escapeHtml(text)}</span>`;
}

function updateChrome() {
  const week = WEEKS[state.weekIndex];
  document.getElementById("week-label").textContent = week.label;
  document.getElementById("week-prev").disabled = state.weekIndex === 0;
  document.getElementById("week-next").disabled = state.weekIndex === WEEKS.length - 1;
  document.getElementById("progress-status-legend").hidden = state.tab !== "req";

  // 仅按交付物四维：PRD / 研发反馈 / Demo / 埋点
  const deliverableItems = [
    ...(week.prd || []),
    ...(week.feedback || []),
    ...(week.demo || []),
    ...(week.track || []),
  ];
  const reqTitles = [];
  deliverableItems.forEach((item) => {
    if (!item?.title) return;
    if (!reqTitles.some((t) => titlesMatch(t, item.title))) reqTitles.push(item.title);
  });
  document.getElementById("week-summary").textContent =
    `本周变更 ${deliverableItems.length} 项，涉及 ${reqTitles.length} 项需求`;
}

function collectWeekReqRows(week, updateMap) {
  const seen = [];
  const pushUnique = (title, productHint) => {
    if (!title) return;
    if (seen.some((x) => titlesMatch(x.title, title))) return;
    const row = findRowByTitle(title);
    if (row) {
      seen.push(row);
      return;
    }
    seen.push({
      id: `week-${seen.length}-${normalizeTitle(title)}`,
      title,
      product: productHint || "-",
      status: "-",
      followUpNote: "",
      aiDemoUrl: "",
      aiDemoDuration: "",
      aiTrackUrl: "",
      aiPrdFeedback: "",
      aiPrdFiles: [],
      _synthetic: true,
    });
  };

  (week.prd || []).forEach((item) => pushUnique(item.title, item.product));
  (week.feedback || []).forEach((item) => pushUnique(item.title, item.product));
  (week.demo || []).forEach((item) => pushUnique(item.title, item.product));
  (week.track || []).forEach((item) => pushUnique(item.title, item.product));
  (week.followUp || []).forEach((item) => pushUnique(item.title, item.product));

  return seen.sort((a, b) => String(a.title).localeCompare(String(b.title), "zh"));
}

function renderReqView() {
  updateChrome();
  const week = WEEKS[state.weekIndex];
  applyWeekFollowUps(week);
  const updateMap = getWeekUpdateMap(week);
  const rows = collectWeekReqRows(week, updateMap);
  const body = document.getElementById("progress-req-tbody");

  if (!rows.length) {
    body.innerHTML = `<div class="progress-empty">本周暂无需求更新</div>`;
    return;
  }

  body.innerHTML = rows
    .map((r) => {
      const weekFields = lookupWeekFields(updateMap, r.title);
      const prdFiles = typeof resolveAiPrdFiles === "function" ? resolveAiPrdFiles(r) : r.aiPrdFiles;
      const prd = (prdFiles && prdFiles[0]) || null;
      const prdText = weekFields.prd?.file || prd?.name || "";
      const prdHref = prdText
        ? `https://ai-prd.example.com/${encodeURIComponent(weekFields.prd?.file || prd?.name || prdText)}`
        : "";
      const feedbacks =
        !r._synthetic && typeof getAiPrdFeedbacks === "function" ? getAiPrdFeedbacks(r) : [];
      const feedbackText =
        weekFields.feedback?.content ||
        r.aiPrdFeedback ||
        (feedbacks[0] && String(feedbacks[0].content || "").split("\n")[0]) ||
        "";
      const hasFeedback = !!(feedbackText || weekFields.feedback || feedbacks.length);
      const demoText = weekFields.demo?.url || r.aiDemoUrl || "";
      const demoHref = demoText && /^https?:\/\//i.test(demoText) ? demoText : "";
      const durationText = weekFields.demo?.duration || r.aiDemoDuration || "";
      const trackText = weekFields.track?.url || r.aiTrackUrl || "";
      const trackHref = trackText && /^https?:\/\//i.test(trackText) ? trackText : "";
      const followText = weekFields.followUp?.note || r.followUpNote || "";
      const canOpenFeedback = hasFeedback;
      const canOpenFollow = !r._synthetic;

      return `
      <div class="progress-req-row" data-id="${escapeHtml(String(r.id))}">
        <div class="ptd col-req-title" title="${escapeHtml(r.title)}">
          <span>${escapeHtml(r.title)}</span>
        </div>
        <div class="ptd col-req-product">${escapeHtml(r.product || "-")}</div>
        <div class="ptd col-req-status">${
          r.status && r.status !== "-"
            ? escapeHtml(r.status)
            : `<span class="eff-empty">-</span>`
        }</div>
        <div class="ptd col-req-prd">
          ${statusCell({
            status: cellActionStatus(weekFields.prd),
            text: prdText,
            title: prdText,
            href: prdHref,
          })}
        </div>
        <div class="ptd col-req-feedback">
          ${statusCell({
            status: cellActionStatus(weekFields.feedback),
            text: feedbackText,
            title: feedbackText,
            interactive: canOpenFeedback,
            dataAttrs: canOpenFeedback ? { "data-open": "feedback", "data-id": r.id } : {},
          })}
        </div>
        <div class="ptd col-req-demo">
          ${statusCell({
            status: cellActionStatus(weekFields.demo),
            text: demoText,
            title: demoText,
            href: demoHref,
          })}
        </div>
        <div class="ptd col-req-duration">
          ${statusCell({
            status: weekFields.demo ? cellActionStatus(weekFields.demo) : "none",
            text: durationText,
            title: durationText,
          })}
        </div>
        <div class="ptd col-req-track">
          ${statusCell({
            status: cellActionStatus(weekFields.track),
            text: trackText,
            title: trackText,
            href: trackHref,
          })}
        </div>
        <div class="ptd col-req-followup">
          ${statusCell({
            status: "none",
            text: followText,
            title: followText || (canOpenFollow ? "点击填写跟进说明" : ""),
            interactive: canOpenFollow,
            dataAttrs: canOpenFollow ? { "data-open": "followup", "data-id": r.id } : {},
          })}
        </div>
      </div>`;
    })
    .join("");
}

function renderDeliverableView() {
  updateChrome();
  const week = WEEKS[state.weekIndex];

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

  const prdRows = (week.prd || [])
    .map((r, i) =>
      rowHtml(r, i, linkCell(`https://ai-prd.example.com/${encodeURIComponent(r.file)}`, r.file))
    )
    .join("");
  const feedbackRows = (week.feedback || [])
    .map((r, i) => rowHtml(r, i, feedbackCell(r, i)))
    .join("");
  const demoRows = (week.demo || [])
    .map((r, i) => rowHtml(r, i, linkCell(r.url), escapeHtml(r.duration)))
    .join("");
  const trackRows = (week.track || []).map((r, i) => rowHtml(r, i, linkCell(r.url))).join("");

  document.getElementById("week-sections").innerHTML = `
    <div class="progress-section-row">
      ${sectionCard("本周AI PRD更新", (week.prd || []).length, head("AI PRD", false), prdRows)}
      ${sectionCard("本周研发反馈更新", (week.feedback || []).length, head("反馈内容", false), feedbackRows)}
    </div>
    <div class="progress-section-row">
      ${sectionCard("本周AI Demo更新", (week.demo || []).length, head("AI Demo链接", true), demoRows)}
      ${sectionCard("本周埋点更新", (week.track || []).length, head("AI埋点链接", false), trackRows)}
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

function renderCurrentView() {
  if (state.tab === "req") renderReqView();
  else renderDeliverableView();
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
  renderCurrentView();
}

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll("#progress-tab-toggle .toggle-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  document.getElementById("progress-req-view").hidden = tab !== "req";
  document.getElementById("progress-deliverable-view").hidden = tab !== "deliverable";
  closeWeekDropdown();
  renderCurrentView();
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
      renderCurrentView();
    }
  });
  document.getElementById("week-next").addEventListener("click", () => {
    closeWeekDropdown();
    if (state.weekIndex < WEEKS.length - 1) {
      state.weekIndex += 1;
      renderCurrentView();
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
    if (e.key !== "Escape") return;
    closeWeekDropdown();
    if (!document.getElementById("progress-followup-modal").hidden) closeFollowUpModal();
    else if (!document.getElementById("progress-feedback-modal").hidden) closeFeedbackModal();
  });

  document.getElementById("progress-req-tbody").addEventListener("click", (e) => {
    const cell = e.target.closest("[data-open]");
    if (!cell) return;
    const rawId = cell.dataset.id;
    const week = WEEKS[state.weekIndex];
    const updateMap = getWeekUpdateMap(week);
    let row = REQUIREMENTS.find((r) => String(r.id) === String(rawId));
    if (!row) {
      // 合成行：用本周数据拼一个最小对象
      const titleFromCell = cell.closest(".progress-req-row")?.querySelector(".col-req-title")?.textContent?.trim();
      row = collectWeekReqRows(week, updateMap).find((r) => String(r.id) === String(rawId)) ||
        (titleFromCell ? { id: rawId, title: titleFromCell, _synthetic: true } : null);
    }
    if (!row) return;
    if (cell.dataset.open === "feedback") openFeedbackModalByRow(row);
    else if (cell.dataset.open === "followup") {
      if (row._synthetic) return;
      openFollowUpModal(row);
    }
  });

  document.getElementById("progress-feedback-close").addEventListener("click", closeFeedbackModal);
  document.getElementById("progress-feedback-ok").addEventListener("click", closeFeedbackModal);
  document.getElementById("progress-feedback-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeFeedbackModal();
  });

  document.getElementById("progress-followup-close").addEventListener("click", closeFollowUpModal);
  document.getElementById("progress-followup-cancel").addEventListener("click", closeFollowUpModal);
  document.getElementById("progress-followup-save").addEventListener("click", saveFollowUpModal);
  document.getElementById("progress-followup-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeFollowUpModal();
  });

  switchTab("req");
}

init();
