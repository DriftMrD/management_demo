(() => {
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

  function getQueryId() {
    return new URLSearchParams(window.location.search).get("id") || "";
  }

  function pct(part, total) {
    if (!total) return 0;
    return Math.round((part / total) * 1000) / 10;
  }

  function buildFallbackDetail(row) {
    const valid = row.valid || 1;
    const neutral = Math.max(0, valid - row.negative - row.demand - row.positive);
    const syncDate = new Date(`${row.periodStart}T00:00:00`);
    syncDate.setDate(syncDate.getDate() + 7);
    const syncedAt = `${syncDate.getFullYear()}-${String(syncDate.getMonth() + 1).padStart(2, "0")}-${String(syncDate.getDate()).padStart(2, "0")} 08:00`;
    const modules = [
      { name: row.topIssue.split("/")[0].slice(0, 6) || "核心问题", count: Math.round(valid * 0.27), pct: 27.0, tone: "neg" },
      { name: "功能体验", count: Math.round(valid * 0.15), pct: 15.0, tone: "demand" },
      { name: "稳定性", count: Math.round(valid * 0.13), pct: 13.0, tone: "pos" },
      { name: "其他模块", count: Math.round(valid * 0.1), pct: 10.0, tone: "muted" },
      { name: "其他", count: Math.round(valid * 0.35), pct: 35.0, tone: "other" },
    ];
    return {
      syncedAt,
      channelOverview: {
        gp: {
          total: row.gp ?? 0,
          positive: Math.round((row.gp || 0) * 0.4),
          negative: Math.round((row.gp || 0) * 0.45),
          demand: Math.round((row.gp || 0) * 0.1),
        },
        cms:
          row.cms == null
            ? null
            : {
                total: row.cms,
                positive: Math.round(row.cms * 0.05),
                negative: Math.round(row.cms * 0.7),
                demand: Math.round(row.cms * 0.2),
              },
      },
      sentiment: {
        positive: pct(row.positive, valid),
        negative: pct(row.negative, valid),
        demand: pct(row.demand, valid),
        neutral: pct(neutral, valid),
      },
      modules,
      regions: [
        { name: "印度尼西亚", count: Math.round(valid * 0.29), pct: 29.0 },
        { name: "巴西", count: Math.round(valid * 0.19), pct: 19.0 },
        { name: "印度", count: Math.round(valid * 0.15), pct: 15.0 },
        { name: "墨西哥", count: Math.round(valid * 0.12), pct: 12.0 },
        { name: "越南", count: Math.round(valid * 0.08), pct: 8.0 },
      ],
      issues: [
        {
          id: "iss-main",
          title: modules[0].name,
          count: modules[0].count,
          pct: modules[0].pct,
          severity: "体验问题",
          sentiment: "负面",
          problem: row.topIssue,
          analysis: `本周期围绕「${row.topIssue}」的反馈较集中，建议优先排查高频路径与弱网场景。`,
          status: "未转需求",
          voices: [
            {
              channel: "GP",
              lang: "en",
              version: "-",
              device: "-",
              stars: 1,
              text: `"Users keep reporting: ${row.topIssue}."`,
              translation: `翻译：用户持续反馈：${row.topIssue}。`,
            },
          ],
        },
        {
          id: "iss-second",
          title: modules[1].name,
          count: modules[1].count,
          pct: modules[1].pct,
          severity: "体验问题",
          sentiment: "需求",
          problem: `${modules[1].name}相关诉求`,
          analysis: "次要问题簇，可结合需求池评估优先级。",
          status: "未转需求",
          voices: [],
        },
      ],
      praises: [
        {
          id: "praise-fallback",
          channel: "GP",
          lang: "en",
          version: "-",
          device: "-",
          stars: 5,
          text: '"Overall experience is getting better this week."',
          translation: "翻译：本周整体体验在变好。",
        },
      ],
      versions: FEEDBACK_VERSIONS.filter((v) => v.product === row.product)
        .slice(0, 3)
        .map((v, vi) => ({
          version: v.version,
          type: v.type,
          count: v.feedbackCount,
          countText: `${v.feedbackCount} 条负面/需求`,
          topIssue: v.topIssue,
          issues: [
            {
              id: `${row.id}-ver${vi + 1}-iss-1`,
              title: v.topIssue.split("/")[0].slice(0, 8) || "核心问题",
              count: Math.round(v.feedbackCount * 0.4),
              pct: 40,
              severity: "体验问题",
              sentiment: "负面",
              problem: v.topIssue,
              analysis: `版本 ${v.version} 下「${v.topIssue}」反馈较集中。`,
              status: "未转需求",
              voices: [],
            },
          ],
        })),
    };
  }

  function mergeIssuesByTitle(issues, valid) {
    const map = new Map();
    for (const iss of issues || []) {
      const key = String(iss.title || "").trim();
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, {
          ...iss,
          voices: [...(iss.voices || [])],
          problems: [iss.problem].filter(Boolean),
          analyses: iss.analysis ? [iss.analysis] : [],
        });
        continue;
      }
      const cur = map.get(key);
      cur.count += iss.count || 0;
      if (iss.problem) cur.problems.push(iss.problem);
      if (iss.analysis) cur.analyses.push(iss.analysis);
      const rank = (s) => (String(s).includes("阻断") ? 3 : String(s).includes("体验") ? 2 : 1);
      if (rank(iss.severity) > rank(cur.severity)) cur.severity = iss.severity;
      if (iss.sentiment === "负面") cur.sentiment = "负面";
      for (const v of iss.voices || []) {
        if (cur.voices.length < 4) cur.voices.push(v);
      }
    }
    return [...map.values()]
      .map((iss, i) => ({
        id: `${String(iss.id || "iss").replace(/iss-\d+$/, "iss")}-${i + 1}`.replace(/--+/g, "-"),
        title: iss.title,
        count: iss.count,
        pct: valid ? Math.round((iss.count / valid) * 1000) / 10 : iss.pct,
        severity: iss.severity,
        sentiment: iss.sentiment,
        problem: [...new Set(iss.problems)].join(" / "),
        analysis: [...new Set(iss.analyses)].join(" "),
        status: iss.status || "未转需求",
        voices: iss.voices.slice(0, 2),
      }))
      .sort((a, b) => b.count - a.count);
  }

  function resolveDetail(row) {
    const custom = FEEDBACK_WEEK_DETAILS[row.id];
    const detail = custom ? { ...buildFallbackDetail(row), ...custom } : buildFallbackDetail(row);
    detail.issues = mergeIssuesByTitle(detail.issues, row.valid);
    detail.versions = (detail.versions || []).map((ver, vi) => ({
      ...ver,
      issues: mergeIssuesByTitle(
        (ver.issues || []).map((iss, i) => ({
          ...iss,
          id: iss.id || `${row.id}-ver${vi + 1}-iss-${i + 1}`,
        })),
        ver.count || row.valid
      ),
    }));
    return detail;
  }

  function renderStars(n) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
      const src = i <= n ? "assets/icons/star-filled.svg" : "assets/icons/star-empty.svg";
      html += `<img class="fb-star" src="${src}" alt="" width="12" height="12" />`;
    }
    return `<span class="fb-stars" aria-label="${n}星">${html}</span>`;
  }

  function renderChannelOverview(row, detail) {
    const gp = detail.channelOverview.gp;
    const cms = detail.channelOverview.cms;
    const gpText = `${row.product}_GP: ${gp.total}（正${gp.positive}/负${gp.negative}/需${gp.demand}）`;
    const cmsText =
      cms == null
        ? `${row.product}_CMS: -`
        : `${row.product}_CMS: ${cms.total}（正${cms.positive}/负${cms.negative}/需${cms.demand}）`;
    return `<div class="fb-info-bar"><p><strong>渠道概览：</strong>${escapeHtml(gpText)} | ${escapeHtml(cmsText)}</p></div>`;
  }

  function polar(cx, cy, r, angleDeg) {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
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

  function renderPie(sentiment) {
    const segments = [
      { key: "pos", label: "正面情绪", value: sentiment.positive || 0, color: "#617a61" },
      { key: "neg", label: "负面情绪", value: sentiment.negative || 0, color: "#c75c5c" },
      { key: "demand", label: "需求提出", value: sentiment.demand || 0, color: "#f59e0b" },
      { key: "neutral", label: "中性态度", value: sentiment.neutral || 0, color: "#9ca3af" },
    ];

    const cx = 85;
    const cy = 85;
    const rOuter = 78;
    const rInner = 44;
    const pop = 11;
    let cursor = 0;
    const slices = segments
      .map((seg) => {
        const start = cursor;
        const end = cursor + seg.value;
        cursor = end;
        if (seg.value <= 0) return null;
        const midDeg = ((start + end) / 2) * 3.6;
        const midRad = ((midDeg - 90) * Math.PI) / 180;
        const dx = (Math.cos(midRad) * pop).toFixed(2);
        const dy = (Math.sin(midRad) * pop).toFixed(2);
        const d = donutSlicePath(cx, cy, rOuter, rInner, start, end);
        return `<path class="fb-pie-slice" data-pie-key="${seg.key}" d="${d}" fill="${seg.color}" style="--dx:${dx}px;--dy:${dy}px" />`;
      })
      .filter(Boolean)
      .join("");

    const legend = segments
      .map(
        (seg) => `
        <button type="button" class="fb-legend-item" data-pie-key="${seg.key}">
          <span class="fb-dot" style="background:${seg.color}"></span>
          <span>${seg.label}: ${Number(seg.value).toFixed(1)}%</span>
        </button>`
      )
      .join("");

    return `
      <div class="fb-pie-wrap">
        <svg class="fb-pie-svg" viewBox="0 0 170 170" width="170" height="170" aria-hidden="true">
          <g class="fb-pie-slices">${slices}</g>
          <circle class="fb-pie-hole" cx="85" cy="85" r="44" fill="#fff" />
        </svg>
        <div class="fb-pie-legend">${legend}</div>
      </div>`;
  }

  function setPieHot(wrap, key) {
    if (!wrap) return;
    wrap.querySelectorAll("[data-pie-key]").forEach((el) => {
      el.classList.toggle("is-hot", Boolean(key) && el.dataset.pieKey === key);
      el.classList.toggle("is-dim", Boolean(key) && el.dataset.pieKey !== key);
    });
  }

  function renderModules(modules) {
    const maxPct = Math.max(...modules.map((m) => m.pct), 1);
    return modules
      .map((m) => {
        const width = Math.max(4, Math.round((m.pct / maxPct) * 100));
        return `
          <div class="fb-bar-row">
            <span class="fb-bar-label">${escapeHtml(m.name)}</span>
            <div class="fb-bar-track"><div class="fb-bar-fill" style="width:${width}%"></div></div>
            <div class="fb-bar-meta"><b>${m.count}条</b><span>${m.pct.toFixed(1)}%</span></div>
          </div>`;
      })
      .join("");
  }

  function renderRegions(regions) {
    const rows = regions
      .map(
        (r) => `
      <div class="fb-region-row">
        <span class="fb-region-name">${escapeHtml(r.name)}</span>
        <span class="fb-region-count">${r.count}</span>
        <span class="fb-region-pct">${r.pct.toFixed(1)}%</span>
      </div>`
      )
      .join("");
    return `
      <div class="fb-region-table">
        <div class="fb-region-head">
          <span class="fb-region-name">国家/地区</span>
          <span class="fb-region-count">反馈量</span>
          <span class="fb-region-pct">占比</span>
        </div>
        ${rows}
      </div>`;
  }

  function sentimentBadgeClass(sentiment) {
    if (sentiment === "正面") return "is-pos";
    if (sentiment === "需求") return "is-demand";
    return "is-neg";
  }

  function renderVoices(voices) {
    if (!voices.length) {
      return `<div class="fb-voices"><p class="fb-voices-title">Top 用户原声</p><p class="fb-voice-empty">暂无原声样本</p></div>`;
    }
    return `
      <div class="fb-voices">
        <p class="fb-voices-title">Top 用户原声</p>
        ${voices
          .map(
            (v, i) => `
          <div class="fb-voice ${i ? "has-sep" : ""}">
            <div class="fb-voice-meta">
              <span class="fb-channel-badge">${escapeHtml(v.channel)}</span>
              <span class="fb-voice-info">语言: ${escapeHtml(v.lang)} | 版本: ${escapeHtml(v.version)} | 设备: ${escapeHtml(v.device)}</span>
              ${renderStars(v.stars)}
            </div>
            <p class="fb-voice-text">${escapeHtml(v.text)}</p>
            <p class="fb-voice-trans">${escapeHtml(v.translation)}</p>
          </div>`
          )
          .join("")}
      </div>`;
  }

  function renderIssueCard(issue, expanded) {
    const converted = issue.status === "已转为需求";
    const actionHtml = converted
      ? `<span class="fb-converted-label">已转为需求</span>`
      : `<button type="button" class="btn-outline-brand fb-convert-btn" data-action="convert-req" data-issue="${escapeHtml(issue.id)}">转为需求</button>`;
    return `
      <article class="fb-issue-card ${expanded ? "is-open" : ""}" data-issue="${escapeHtml(issue.id)}">
        <button type="button" class="fb-issue-toggle" data-action="toggle-issue" aria-expanded="${expanded}" aria-label="${expanded ? "收起" : "展开"}">
          <span class="fb-issue-title">${escapeHtml(issue.title)}（${issue.count}条，${issue.pct.toFixed(1)}%）</span>
          <img class="fb-issue-chevron" src="assets/icons/chevron-down.svg" alt="" width="16" height="16" />
        </button>
        <div class="fb-issue-body" ${expanded ? "" : "hidden"}>
          <div class="fb-issue-tags">
            <span class="fb-tag">严重度：${escapeHtml(issue.severity)}</span>
            <span class="fb-tag ${sentimentBadgeClass(issue.sentiment)}">情感：${escapeHtml(issue.sentiment)}</span>
          </div>
          <div class="fb-issue-divider"></div>
          <div class="fb-issue-analysis">
            <div class="fb-issue-problem-row">
              <p class="fb-issue-problem">问题点：${escapeHtml(issue.problem)}</p>
              ${actionHtml}
            </div>
            <p class="fb-issue-desc">${escapeHtml(issue.analysis)}</p>
            <p class="fb-issue-status">流转状态：${escapeHtml(issue.status || "未转需求")}</p>
          </div>
          ${renderVoices(issue.voices || [])}
        </div>
      </article>`;
  }

  function renderPraiseCards(praises) {
    if (!praises.length) return `<div class="feedback-empty">暂无好评原声</div>`;
    return `
      <div class="fb-voices fb-praise-list">
        <p class="fb-voices-title">用户好评原声</p>
        ${praises
          .map(
            (v, i) => `
          <div class="fb-voice ${i ? "has-sep" : ""}">
            <div class="fb-voice-meta">
              <span class="fb-channel-badge">${escapeHtml(v.channel)}</span>
              <span class="fb-voice-info">语言: ${escapeHtml(v.lang)} | 版本: ${escapeHtml(v.version)} | 设备: ${escapeHtml(v.device)}</span>
              ${renderStars(v.stars)}
            </div>
            <p class="fb-voice-text">${escapeHtml(v.text)}</p>
            <p class="fb-voice-trans">${escapeHtml(v.translation)}</p>
          </div>`
          )
          .join("")}
      </div>`;
  }

  function findIssueById(id) {
    if (!state.detail) return null;
    const fromMain = (state.detail.issues || []).find((i) => i.id === id);
    if (fromMain) return fromMain;
    for (const ver of state.detail.versions || []) {
      const hit = (ver.issues || []).find((i) => i.id === id);
      if (hit) return hit;
    }
    return null;
  }

  function isIssueExpanded(id) {
    return !state.collapsedIssueIds.has(id);
  }

  function getVersionOptions(detail) {
    return (detail?.versions || []).map((v) => v.version).filter(Boolean);
  }

  function ensureVersionFilter(detail) {
    const options = getVersionOptions(detail);
    if (!options.length) {
      state.versionFilter = "全部";
      return;
    }
    if (state.versionFilter !== "全部" && !options.includes(state.versionFilter)) {
      state.versionFilter = options[0];
    }
  }

  function renderVersionFilter(detail) {
    const options = ["全部", ...getVersionOptions(detail)];
    const label = state.versionFilter || "全部";
    return `
      <div class="filter-btn-wrap fb-version-filter">
        <button type="button" class="filter-btn fb-version-filter-btn" data-action="toggle-version-filter">
          <span><b id="fb-version-filter-value">${escapeHtml(label)}</b></span>
          <img src="assets/icons/chevron-down.svg" alt="" class="filter-chevron" />
        </button>
        <div class="dropdown fb-version-filter-dropdown" id="fb-version-filter-dropdown" hidden>
          ${options
            .map(
              (v) =>
                `<button type="button" class="${v === label ? "selected" : ""}" data-action="pick-version-filter" data-value="${escapeHtml(v)}">${escapeHtml(v)}</button>`
            )
            .join("")}
        </div>
      </div>`;
  }

  function renderVersionCards(versions) {
    const filtered =
      state.versionFilter && state.versionFilter !== "全部"
        ? versions.filter((v) => v.version === state.versionFilter)
        : versions;
    if (!filtered.length) return `<div class="feedback-empty">暂无分版本监控数据</div>`;
    return `
      <div class="fb-version-list">
        ${filtered
          .map((v) => {
            const issues = v.issues || [];
            const countLabel = v.countText || `${v.count} 条负面/需求`;
            const issueCards = issues.length
              ? issues.map((iss) => renderIssueCard(iss, isIssueExpanded(iss.id))).join("")
              : `<div class="feedback-empty">该版本暂无问题聚类</div>`;
            return `
          <section class="fb-version-block">
            <header class="fb-version-head">
              <span class="fb-badge ${v.type === "全量" ? "fb-badge-full" : "fb-badge-gray"}">${escapeHtml(v.type === "全量" ? "全量版" : "灰度版")}</span>
              <h3 class="fb-version-title">版本 <b>${escapeHtml(v.version)}</b></h3>
              <span class="fb-version-count">${escapeHtml(countLabel)}</span>
            </header>
            <div class="fb-version-issues">${issueCards}</div>
          </section>`;
          })
          .join("")}
      </div>`;
  }

  function renderDetailTabs(row, detail, activeTab) {
    if (activeTab === "versions") ensureVersionFilter(detail);
    const issuesHtml =
      activeTab === "issues"
        ? detail.issues.map((iss) => renderIssueCard(iss, isIssueExpanded(iss.id))).join("")
        : "";
    const versionsHtml = activeTab === "versions" ? renderVersionCards(detail.versions || []) : "";
    const praisesHtml = activeTab === "praises" ? renderPraiseCards(detail.praises || []) : "";
    const filterHtml = activeTab === "versions" ? renderVersionFilter(detail) : "";

    return `
      <div class="fb-detail-tabs-row">
        <div class="fb-detail-tabs" role="tablist">
          <button type="button" class="fb-detail-tab ${activeTab === "issues" ? "active" : ""}" data-action="detail-tab" data-tab="issues" role="tab" aria-selected="${activeTab === "issues"}">问题反馈 (${row.valid}条)</button>
          <button type="button" class="fb-detail-tab ${activeTab === "versions" ? "active" : ""}" data-action="detail-tab" data-tab="versions" role="tab" aria-selected="${activeTab === "versions"}">分版本监控</button>
          <button type="button" class="fb-detail-tab ${activeTab === "praises" ? "active" : ""}" data-action="detail-tab" data-tab="praises" role="tab" aria-selected="${activeTab === "praises"}">用户好评 (${row.positive}条)</button>
        </div>
        ${filterHtml}
      </div>
      <div class="fb-detail-pane">
        ${issuesHtml}${versionsHtml}${praisesHtml}
      </div>`;
  }

  const state = {
    row: null,
    detail: null,
    tab: "issues",
    versionFilter: "全部",
    collapsedIssueIds: new Set(),
  };

  function renderBreadcrumb(row) {
    const periodShort = row.period.replace(/ /g, "");
    document.getElementById("fb-week-breadcrumb").innerHTML = `
      <a class="crumb crumb-link" href="index.html">项目管理</a>
      <img class="crumb-sep" src="assets/icons/chevron-right.svg" alt="" />
      <a class="crumb crumb-link" href="version.html">版本管理平台</a>
      <img class="crumb-sep" src="assets/icons/chevron-right.svg" alt="" />
      <a class="crumb crumb-link" href="feedback.html">用户反馈</a>
      <img class="crumb-sep" src="assets/icons/chevron-right.svg" alt="" />
      <span class="crumb current">${escapeHtml(periodShort)}</span>`;
  }

  function render() {
    const { row, detail } = state;
    if (!row || !detail) return;

    document.title = `用户反馈周报 · ${row.period}`;
    renderBreadcrumb(row);
    document.getElementById("fb-week-title").textContent = `用户反馈周报 · ${row.period}`;
    document.getElementById("fb-week-sub").textContent =
      `数据来源：Google Play + CMS 客服后台 · 同步时间：${detail.syncedAt}`;

    const validRate = pct(row.valid, row.total);

    document.getElementById("fb-week-body").innerHTML = `
      ${renderChannelOverview(row, detail)}
      <div class="fb-overview-row">
        <section class="fb-card fb-card-stats">
          <h2>数据概览</h2>
          <div class="fb-stats">
            <div class="fb-stat"><span class="fb-stat-label">反馈总量</span><div class="fb-stat-value"><b>${row.total}</b><em>条</em></div></div>
            <div class="fb-stat"><span class="fb-stat-label">有效量</span><div class="fb-stat-value"><b>${row.valid}</b><em>条</em></div></div>
            <div class="fb-stat"><span class="fb-stat-label">有效率</span><div class="fb-stat-value"><b>${validRate}</b><em>%</em></div></div>
          </div>
        </section>
        <section class="fb-card fb-card-sentiment">
          <h2>用户反馈态度</h2>
          ${renderPie(detail.sentiment)}
        </section>
      </div>
      <div class="fb-charts-row">
        <section class="fb-card">
          <h2>功能模块分布 TOP5</h2>
          <div class="fb-bars">${renderModules(detail.modules)}</div>
        </section>
        <section class="fb-card">
          <h2>地区来源 TOP5</h2>
          ${renderRegions(detail.regions)}
        </section>
      </div>
      ${renderDetailTabs(row, detail, state.tab)}
    `;
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

  function setupActions() {
    document.getElementById("fb-week-download").addEventListener("click", () => {
      showToast("原始 CSV 下载能力稍后提供");
    });

    const body = document.getElementById("fb-week-body");

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

    body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) {
        const dropdown = document.getElementById("fb-version-filter-dropdown");
        if (dropdown) dropdown.hidden = true;
        return;
      }
      const action = btn.dataset.action;

      if (action === "detail-tab") {
        state.tab = btn.dataset.tab;
        state.collapsedIssueIds = new Set();
        if (state.tab === "versions") ensureVersionFilter(state.detail);
        render();
        return;
      }

      if (action === "toggle-version-filter") {
        e.stopPropagation();
        const dropdown = document.getElementById("fb-version-filter-dropdown");
        if (!dropdown) return;
        document.querySelectorAll(".dropdown").forEach((d) => {
          if (d !== dropdown) d.hidden = true;
        });
        dropdown.hidden = !dropdown.hidden;
        return;
      }

      if (action === "pick-version-filter") {
        e.stopPropagation();
        state.versionFilter = btn.dataset.value || "全部";
        state.collapsedIssueIds = new Set();
        render();
        return;
      }

      if (action === "toggle-issue") {
        const card = btn.closest("[data-issue]");
        const id = card?.dataset.issue;
        if (!id) return;
        if (state.collapsedIssueIds.has(id)) state.collapsedIssueIds.delete(id);
        else state.collapsedIssueIds.add(id);
        render();
        return;
      }

      if (action === "convert-req") {
        const issue = findIssueById(btn.dataset.issue);
        if (!issue || issue.status === "已转为需求") return;
        openCreateReqModal(issue);
      }
    });
  }

  const CREATE_OWNERS = ["黄志阳", "李明", "王芳", "张伟"];
  const CREATE_OPTIONS = {
    product: ["Visha", "Notes", "Themes", "日活", "搜索", "百宝箱", "时刻", "Note"],
    status: ["未启动", "进行中", "待评审", "已取消"],
    priority: ["P0", "P1", "P2"],
    owner: CREATE_OWNERS,
  };

  let convertTargetIssue = null;
  let createUploadedFiles = [];
  let createVoiceEvidence = "";

  function todayStr() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function setCreateSelect(idPrefix, value, isPlaceholder) {
    const hidden = document.getElementById(idPrefix);
    const text = document.getElementById(`${idPrefix}-text`);
    if (!hidden || !text) return;
    hidden.value = value || "";
    text.textContent = value || text.dataset.placeholder || "";
    text.classList.toggle("placeholder", !!isPlaceholder || !value);
  }

  function buildVoiceEvidence(issue) {
    const voices = issue.voices || [];
    if (!voices.length) {
      return [`【用户原声证据】`, `问题点：${issue.problem || issue.title}`, issue.analysis || ""]
        .filter(Boolean)
        .join("\n");
    }
    const lines = ["【用户原声证据】"];
    voices.forEach((v, i) => {
      lines.push(`#${i + 1} [${v.channel}] ${v.lang} · ${v.version} · ${v.device} · ${v.stars}星`);
      lines.push(v.text || "");
      if (v.translation) lines.push(v.translation);
      lines.push("");
    });
    return lines.join("\n").trim();
  }

  function buildReqDetail(issue, keepVoice) {
    const base = [
      `问题模块：${issue.title}`,
      `问题点：${issue.problem}`,
      issue.analysis ? `问题分析：${issue.analysis}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    if (!keepVoice) return base;
    const voice = createVoiceEvidence || buildVoiceEvidence(issue);
    return `${base}\n\n${voice}`.trim();
  }

  function resetCreateForm() {
    const form = document.getElementById("fb-create-form");
    form.reset();
    document.getElementById("fb-f-title").value = "";
    document.getElementById("fb-f-detail").value = "";
    setCreateSelect("fb-f-product", "", true);
    document.getElementById("fb-f-product-text").dataset.placeholder = "请选择所属产品";
    document.getElementById("fb-f-product-text").textContent = "请选择所属产品";
    document.getElementById("fb-f-product-text").classList.add("placeholder");
    setCreateSelect("fb-f-status", "未启动", false);
    document.getElementById("fb-f-status-text").textContent = "未启动";
    document.getElementById("fb-f-status-text").classList.remove("placeholder");
    setCreateSelect("fb-f-priority", "", true);
    document.getElementById("fb-f-priority-text").textContent = "请选择优先级 (P0/P1/P2)";
    document.getElementById("fb-f-priority-text").classList.add("placeholder");
    setCreateSelect("fb-f-owner", "", true);
    document.getElementById("fb-f-owner-text").textContent = "请选择产品负责人";
    document.getElementById("fb-f-owner-text").classList.add("placeholder");
    document.getElementById("fb-f-request-date").value = todayStr();
    document.getElementById("fb-f-deliver-month").value = "";
    document.getElementById("fb-f-version").value = "";
    document.getElementById("fb-f-keep-voice").checked = true;
    document.querySelectorAll('input[name="fb-f-type"], input[name="fb-f-value"], input[name="fb-f-analytics"]').forEach((input) => {
      input.checked = false;
    });
    createUploadedFiles = [];
    renderCreateUploadList();
    document.querySelectorAll("#fb-create-modal .field-error").forEach((el) => el.classList.remove("field-error"));
  }

  function openCreateReqModal(issue) {
    convertTargetIssue = issue;
    createVoiceEvidence = buildVoiceEvidence(issue);
    resetCreateForm();

    document.getElementById("fb-f-title").value = issue.problem || issue.title || "";
    document.getElementById("fb-f-detail").value = buildReqDetail(issue, true);
    document.getElementById("fb-f-request-date").value = todayStr();

    const product = state.row?.product || "";
    if (product) {
      document.getElementById("fb-f-product").value = product;
      document.getElementById("fb-f-product-text").textContent = product;
      document.getElementById("fb-f-product-text").classList.remove("placeholder");
    }

    // Prefer related version if available in version tab context
    const ver = (state.detail?.versions || []).find((v) => (v.issues || []).some((i) => i.id === issue.id));
    if (ver?.version) document.getElementById("fb-f-version").value = ver.version;

    document.getElementById("fb-create-modal").hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeCreateReqModal() {
    document.getElementById("fb-create-modal").hidden = true;
    document.body.classList.remove("modal-open");
    document.querySelectorAll("#fb-create-modal .select-menu").forEach((m) => {
      m.hidden = true;
    });
    convertTargetIssue = null;
    createVoiceEvidence = "";
  }

  function renderCreateUploadList() {
    const list = document.getElementById("fb-upload-list");
    list.innerHTML = createUploadedFiles
      .map(
        (f, i) =>
          `<li><span>${escapeHtml(f.name)}</span><button type="button" data-index="${i}" aria-label="移除">×</button></li>`
      )
      .join("");
  }

  function syncDetailWithVoiceToggle() {
    if (!convertTargetIssue) return;
    const keep = document.getElementById("fb-f-keep-voice").checked;
    document.getElementById("fb-f-detail").value = buildReqDetail(convertTargetIssue, keep);
  }

  function setupCreateModal() {
    document.querySelectorAll("#fb-create-modal .select-wrap").forEach((wrap) => {
      const key = wrap.dataset.select;
      const btn = wrap.querySelector(".field-select");
      const menu = wrap.querySelector(".select-menu");
      const hidden = wrap.querySelector('input[type="hidden"]');
      const text = wrap.querySelector(".select-text");
      if (!btn || !menu || !hidden || !text) return;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll("#fb-create-modal .select-menu").forEach((m) => {
          if (m !== menu) m.hidden = true;
        });
        const options = CREATE_OPTIONS[key] || [];
        menu.innerHTML = options
          .map(
            (o) =>
              `<button type="button" class="${o === hidden.value ? "selected" : ""}" data-value="${escapeHtml(o)}">${escapeHtml(o)}</button>`
          )
          .join("");
        menu.hidden = !menu.hidden;
      });

      menu.addEventListener("click", (e) => {
        const item = e.target.closest("button[data-value]");
        if (!item) return;
        hidden.value = item.dataset.value;
        text.textContent = item.dataset.value;
        text.classList.remove("placeholder");
        menu.hidden = true;
        btn.classList.remove("field-error");
      });
    });

    document.addEventListener("click", () => {
      document.querySelectorAll("#fb-create-modal .select-menu").forEach((m) => {
        m.hidden = true;
      });
    });

    document.getElementById("fb-f-keep-voice").addEventListener("change", syncDetailWithVoiceToggle);

    const uploadBox = document.getElementById("fb-upload-box");
    const fileInput = document.getElementById("fb-f-file");
    uploadBox.addEventListener("click", () => fileInput.click());
    uploadBox.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadBox.classList.add("dragover");
    });
    uploadBox.addEventListener("dragleave", () => uploadBox.classList.remove("dragover"));
    uploadBox.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadBox.classList.remove("dragover");
      if (e.dataTransfer?.files?.length) {
        createUploadedFiles.push(...Array.from(e.dataTransfer.files));
        renderCreateUploadList();
      }
    });
    fileInput.addEventListener("change", () => {
      if (fileInput.files?.length) {
        createUploadedFiles.push(...Array.from(fileInput.files));
        renderCreateUploadList();
        fileInput.value = "";
      }
    });
    document.getElementById("fb-upload-list").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-index]");
      if (!btn) return;
      createUploadedFiles.splice(Number(btn.dataset.index), 1);
      renderCreateUploadList();
    });

    document.getElementById("fb-modal-close").addEventListener("click", closeCreateReqModal);
    document.getElementById("fb-modal-cancel").addEventListener("click", closeCreateReqModal);
    document.getElementById("fb-create-modal").addEventListener("click", (e) => {
      if (e.target.id === "fb-create-modal") closeCreateReqModal();
    });

    document.getElementById("fb-create-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("fb-f-title").value.trim();
      const detail = document.getElementById("fb-f-detail").value.trim();
      const product = document.getElementById("fb-f-product").value;
      const status = document.getElementById("fb-f-status").value;
      const priority = document.getElementById("fb-f-priority").value;
      const owner = document.getElementById("fb-f-owner").value;
      const requestDate = document.getElementById("fb-f-request-date").value;
      const deliverMonth = document.getElementById("fb-f-deliver-month").value;
      const version = document.getElementById("fb-f-version").value.trim();
      const typeInput = document.querySelector('input[name="fb-f-type"]:checked');
      const valueInput = document.querySelector('input[name="fb-f-value"]:checked');
      const analyticsInput = document.querySelector('input[name="fb-f-analytics"]:checked');
      const type = typeInput ? typeInput.value : "";
      const isValue = valueInput ? valueInput.value === "true" : null;
      const needAnalytics = analyticsInput ? analyticsInput.value === "true" : null;

      let valid = true;
      const mark = (id, ok) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (!ok) {
          el.classList.add("field-error");
          valid = false;
        } else el.classList.remove("field-error");
      };
      mark("fb-f-title", !!title);
      mark("fb-f-product-btn", !!product);
      mark("fb-f-status-btn", !!status);
      mark("fb-f-priority-btn", !!priority);
      mark("fb-f-owner-btn", !!owner);
      mark("fb-f-request-date", !!requestDate);
      mark("fb-f-deliver-month", !!deliverMonth);
      mark("fb-f-version", !!version);
      const typeGroup = document.getElementById("fb-f-type-group");
      const valueGroup = document.getElementById("fb-f-value-group");
      const analyticsGroup = document.getElementById("fb-f-analytics-group");
      if (!type) {
        typeGroup.classList.add("field-error");
        valid = false;
      } else typeGroup.classList.remove("field-error");
      if (isValue === null) {
        valueGroup.classList.add("field-error");
        valid = false;
      } else valueGroup.classList.remove("field-error");
      if (needAnalytics === null) {
        analyticsGroup.classList.add("field-error");
        valid = false;
      } else analyticsGroup.classList.remove("field-error");
      if (!valid) return;

      if (convertTargetIssue) {
        convertTargetIssue.status = "已转为需求";
        state.collapsedIssueIds.delete(convertTargetIssue.id);
      }

      const keepVoice = document.getElementById("fb-f-keep-voice").checked;
      closeCreateReqModal();
      showToast(
        keepVoice
          ? `已创建需求「${title}」，并保留用户原声证据`
          : `已创建需求「${title}」`
      );
      render();
    });
  }

  function init() {
    setupSidebar();
    setupActions();
    setupCreateModal();

    const id = getQueryId();
    const row = FEEDBACK_WEEKS.find((r) => r.id === id);
    if (!row) {
      document.getElementById("fb-week-body").innerHTML =
        `<div class="feedback-empty">未找到该周报，请<a href="feedback.html">返回列表</a></div>`;
      return;
    }

    state.row = row;
    state.detail = resolveDetail(row);
    state.collapsedIssueIds = new Set();
    render();
  }

  init();
})();
