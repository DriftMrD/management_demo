(() => {
  function getViewFromUrl() {
    const v = new URLSearchParams(window.location.search).get("view");
    return v === "journey" ? "journey" : "list";
  }

  const state = {
    product: "全部",
    status: "全部",
    search: "",
    page: 1,
    pageSize: 10,
    sortKey: null,
    sortAsc: true,
    view: getViewFromUrl(),
    journeyExpandedId: null,
    journeyAddReqSearch: "",
    journeyReqPickerOpen: false,
    month: "全部",
    rows: [],
    detailId: null,
    detailExtraReqIds: [],
    detailExcludedReqIds: [],
    detailAddReqSearch: "",
    editId: null,
    editExtraReqIds: [],
    editExcludedReqIds: [],
    editIncludeGap: false,
    addReqSearch: "",
    addReqPicked: new Set(),
    grayId: null,
    detailCloseTimer: null,
  };

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showToast(msg) {
    const el = document.getElementById("release-toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      el.hidden = true;
    }, 2200);
  }

  function todayISO() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function reloadRows() {
    state.rows = getReleases();
  }

  function statusClass(status) {
    if (status === "已发布") return "rv-status-published";
    if (status === "计划中") return "rv-status-planning";
    return "rv-status-na";
  }

  function grayTone(percent) {
    if (percent == null) return "";
    if (percent >= 100) return "is-full";
    if (percent >= 50) return "is-mid";
    if (percent > 0) return "is-low";
    return "is-zero";
  }

  function isFullGray(row, channel) {
    if (!row) return false;
    if (channel) return typeof isChannelGrayFull === "function" && isChannelGrayFull(row, channel);
    const grays = typeof normalizeChannelGrays === "function" ? normalizeChannelGrays(row) : [];
    if (!grays.length) return row.grayPercent != null && Number(row.grayPercent) >= 100;
    return grays.every((g) => g.value >= channelGrayMax(g.channel));
  }

  function renderGrayCell(row) {
    const grays = typeof normalizeChannelGrays === "function" ? normalizeChannelGrays(row) : [];
    if (row.status === "不涉及" || !grays.length) {
      return `<span class="rv-empty">—</span>`;
    }
    return `<div class="rv-gray-stack">${grays
      .map((g) => {
        const ratio = channelGrayRatio(g.channel, g.value);
        const label = formatChannelGray(g.channel, g.value);
        const full = g.value >= channelGrayMax(g.channel);
        const ch = escapeHtml(g.channel);
        const editBtn = full
          ? ""
          : `<button type="button" class="rv-gray-edit-btn" data-action="gray-edit" data-id="${escapeHtml(row.id)}" data-channel="${ch}" title="调整 ${ch} 灰度" aria-label="调整 ${ch} 灰度">
          <img src="assets/icons/pencil.svg" alt="" />
        </button>`;
        return `<div class="rv-gray-cell${full ? " is-full-locked" : ""}" data-gray-id="${escapeHtml(row.id)}" data-channel="${ch}">
        <div class="rv-progress is-${g.channel.toLowerCase()} ${grayTone(ratio)}">
          <div class="rv-progress-track">
            <div class="rv-progress-fill" style="width:${ratio}%"></div>
          </div>
          <span class="rv-progress-label">${escapeHtml(label)}</span>
        </div>
        ${editBtn}
      </div>`;
      })
      .join("")}</div>`;
  }

  function shuttleSortValue(name) {
    if (!name) return null;
    const m = String(name).match(/(?:(\d{4})年)?(\d{1,2})月份?班车/);
    if (!m) return null;
    const year = m[1] ? Number(m[1]) : new Date().getFullYear();
    return year * 100 + Number(m[2]);
  }

  function getSortValue(row, key) {
    if (key === "shuttle") return shuttleSortValue(row.shuttle);
    if (key === "grayPercent") {
      const grays = typeof normalizeChannelGrays === "function" ? normalizeChannelGrays(row) : [];
      if (!grays.length) return row.grayPercent == null ? null : Number(row.grayPercent);
      return Math.max(...grays.map((g) => channelGrayRatio(g.channel, g.value)));
    }
    if (key === "releaseTime") return row.releaseTime || null;
    return null;
  }

  function compareSortValues(va, vb, asc) {
    const aEmpty = va == null || va === "";
    const bEmpty = vb == null || vb === "";
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;
    const dir = asc ? 1 : -1;
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  }

  function defaultReleaseSort(a, b) {
    if (typeof compareReleaseByReleaseTimeDesc === "function") {
      return compareReleaseByReleaseTimeDesc(a, b);
    }
    const ta = a.releaseTime || "";
    const tb = b.releaseTime || "";
    if (ta && !tb) return -1;
    if (!ta && tb) return 1;
    if (ta !== tb) return ta < tb ? 1 : -1;
    return String(b.version || "").localeCompare(String(a.version || ""));
  }

  function getFilteredRows() {
    let rows = state.rows.slice();
    if (state.product !== "全部") rows = rows.filter((r) => r.product === state.product);
    if (state.status !== "全部") rows = rows.filter((r) => r.status === state.status);
    if (state.view === "journey" && state.month !== "全部") {
      rows = rows.filter((r) => monthKeyFromDate(r.releaseTime) === state.month);
    }
    const q = state.search.trim().toLowerCase();
    if (q) rows = rows.filter((r) => String(r.version).toLowerCase().includes(q));

    if (!state.sortKey) {
      rows.sort(defaultReleaseSort);
      return rows;
    }

    const key = state.sortKey;
    const asc = state.sortAsc;
    rows.sort((a, b) => {
      const cmp = compareSortValues(getSortValue(a, key), getSortValue(b, key), asc);
      if (cmp !== 0) return cmp;
      return defaultReleaseSort(a, b);
    });
    return rows;
  }

  function getReleaseMonthOptions() {
    const set = new Set();
    (state.rows.length ? state.rows : typeof getReleases === "function" ? getReleases() : []).forEach((r) => {
      const key = monthKeyFromDate(r.releaseTime);
      if (key && key !== "unknown") set.add(key);
    });
    return ["全部", ...[...set].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))];
  }

  function updateSortHeaders() {
    document.querySelectorAll(".release-table-header .fb-th.sortable").forEach((th) => {
      const active = th.dataset.key === state.sortKey;
      th.classList.toggle("sorted", active);
      th.classList.toggle("sorted-desc", active && !state.sortAsc);
      th.classList.toggle("sorted-asc", active && state.sortAsc);
    });
  }

  function renderPagination(total) {
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    document.getElementById("release-total-count").textContent = `共 ${total} 条版本`;

    const el = document.getElementById("release-pagination");
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

  function renderRows(rows) {
    const body = document.getElementById("release-table-body");
    if (!rows.length) {
      body.innerHTML = `<div class="feedback-empty">暂无版本</div>`;
      return;
    }

    body.innerHTML = rows
      .map(
        (r, i) => `
      <div class="feedback-row release-row ${i % 2 ? "is-alt" : ""}" data-id="${escapeHtml(r.id)}">
        <div class="fb-td rv-w-product">${escapeHtml(r.product)}</div>
        <div class="fb-td rv-w-version fb-strong">${escapeHtml(r.version)}</div>
        <div class="fb-td rv-w-status">
          ${
            r.status === "不涉及"
              ? `<div class="rv-status-publish">
            <span class="rv-status-badge ${statusClass(r.status)}">${escapeHtml(r.status)}</span>
            <button type="button" class="rv-status-plane" data-action="status-publish" data-id="${escapeHtml(r.id)}" title="发布" aria-label="发布">
              <img src="assets/icons/send-muted.svg" alt="" />
            </button>
          </div>`
              : `<span class="rv-status-badge ${statusClass(r.status)}">${escapeHtml(r.status)}</span>`
          }
        </div>
        <div class="fb-td rv-w-shuttle">${r.shuttle ? escapeHtml(r.shuttle) : `<span class="rv-empty">—</span>`}</div>
        <div class="fb-td rv-w-gray">${renderGrayCell(r)}</div>
        <div class="fb-td rv-w-rollout">${r.rolloutTime ? escapeHtml(r.rolloutTime) : `<span class="rv-empty">—</span>`}</div>
        <div class="fb-td rv-w-release">${escapeHtml(r.releaseTime || "—")}</div>
        <div class="fb-td rv-w-channel">${renderChannelCell(r.channel)}</div>
        <div class="fb-td rv-w-apk">
          <a class="rv-apk-btn" href="${escapeHtml(r.apkUrl || "#")}" target="_blank" rel="noopener" data-action="apk" title="${escapeHtml(r.apkUrl || "")}">
            <img src="assets/icons/download.svg" alt="下载" />
          </a>
        </div>
        <div class="fb-td rv-w-action">
          <button type="button" class="rv-action-icon" data-action="view" data-id="${escapeHtml(r.id)}" title="查看" aria-label="查看">
            <img src="assets/icons/eye.svg" alt="" />
          </button>
          <button type="button" class="rv-action-icon" data-action="remind" data-id="${escapeHtml(r.id)}" title="提醒" aria-label="提醒">
            <img src="assets/icons/remind.svg" alt="" />
          </button>
        </div>
      </div>`
      )
      .join("");
  }

  function syncViewUrl(view, { replace = false } = {}) {
    const url = new URL(window.location.href);
    if (view === "journey") url.searchParams.set("view", "journey");
    else url.searchParams.delete("view");
    const method = replace ? "replaceState" : "pushState";
    history[method]({ ...(history.state || {}), view }, "", url);
  }

  function syncViewToggle() {
    document.querySelectorAll("#release-view-toggle .toggle-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === state.view);
    });
  }

  function formatApkSizeLabel(row) {
    if (row && row.apkSize) return String(row.apkSize);
    const seed = String((row && row.version) || (row && row.id) || "apk");
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const mb = (28 + (h % 280) / 10).toFixed(1);
    return `${mb}MB`;
  }

  function formatShortDate(iso) {
    const m = String(iso || "").match(/^\d{4}-(\d{2})-(\d{2})/);
    return m ? `${m[1]}-${m[2]}` : iso || "—";
  }

  function monthKeyFromDate(iso) {
    const m = String(iso || "").match(/^(\d{4})-(\d{2})/);
    return m ? `${m[1]}-${m[2]}` : "unknown";
  }

  function monthLabelFromKey(key) {
    if (!key || key === "unknown") return "未定日期";
    const [y, m] = key.split("-");
    return `${y}年${Number(m)}月`;
  }

  function getJourneySortDate(row) {
    return row.releaseTime || "";
  }

  function compareJourneyByReleaseTime(a, b) {
    const ta = a && a.releaseTime ? String(a.releaseTime) : "";
    const tb = b && b.releaseTime ? String(b.releaseTime) : "";
    if (ta && !tb) return -1;
    if (!ta && tb) return 1;
    if (ta !== tb) return ta < tb ? 1 : -1;
    return String(b.version || "").localeCompare(String(a.version || ""));
  }

  function getCurrentOnlineIdSet(rows) {
    const byProduct = new Map();
    rows.forEach((r) => {
      if (!r || r.status !== "已发布") return;
      if (!isFullGray(r)) return;
      const prev = byProduct.get(r.product);
      if (!prev || compareReleaseByReleaseTimeDesc(r, prev) < 0) {
        byProduct.set(r.product, r);
      }
    });
    return new Set([...byProduct.values()].map((r) => r.id));
  }

  function getJourneyReqs(row) {
    return collectReleaseReqs(
      row,
      Array.isArray(row.extraReqIds) ? row.extraReqIds : [],
      !!row.includeGapReqs,
      Array.isArray(row.excludedReqIds) ? row.excludedReqIds : []
    );
  }

  function formatContentBullets(text) {
    const raw = String(text || "").trim();
    if (!raw) return "";
    return raw
      .split(/\n+|；|;/)
      .map((line) => line.replace(/^\d+\.\s*/, "").replace(/^•\s*/, "").trim())
      .filter(Boolean)
      .map((line) => `• ${escapeHtml(line)}`)
      .join("<br />");
  }

  function journeyPlannedChannels(row) {
    if (typeof listReleaseChannels === "function") return listReleaseChannels(row && row.channel);
    return parseChannels(row && row.channel);
  }

  function buildJourneyGrayRatio(row) {
    const channels = journeyPlannedChannels(row);
    if (!channels.length) {
      return `<div class="rj-gray-ratio-empty rv-empty">暂无放量比例</div>`;
    }
    const grays = typeof normalizeChannelGrays === "function" ? normalizeChannelGrays(row) : [];
    const valueMap = {};
    grays.forEach((g) => {
      if (g && g.channel) valueMap[g.channel] = g.value;
    });
    // 只展示计划渠道；没有值时为 0；进度条可拖拽调整（全量锁定）
    return `<div class="rj-gray-ratio-stack">${channels
      .map((ch) => {
        const value = valueMap[ch] != null ? valueMap[ch] : 0;
        const kind = typeof channelGrayKind === "function" ? channelGrayKind(ch) : "percent";
        const ratio = Math.round(channelGrayRatio(ch, value));
        const valueText = formatChannelGray(ch, value);
        const full = ratio >= 100 || value >= channelGrayMax(ch);
        const title = kind === "volume" ? `${ch} 放量` : `${ch} 灰度`;
        return `<div class="rj-gray-ratio-card is-${escapeHtml(ch.toLowerCase())}${
          full ? " is-full-locked" : ""
        }" data-gray-id="${escapeHtml(row.id)}" data-channel="${escapeHtml(ch)}">
          <span class="rj-gray-ratio-label">${escapeHtml(title)}</span>
          <div
            class="rj-gray-ratio-track"
            role="slider"
            tabindex="${full ? -1 : 0}"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="${ratio}"
            aria-label="${escapeHtml(title)}"
            aria-disabled="${full ? "true" : "false"}"
            data-rj-gray-drag="1"
            data-id="${escapeHtml(row.id)}"
            data-channel="${escapeHtml(ch)}"
            data-kind="${escapeHtml(kind)}"
            data-ratio="${ratio}"
            style="--rj-gray-pct: ${ratio}%"
          >
            <span class="rj-gray-ratio-fill" aria-hidden="true"></span>
            <span class="rj-gray-ratio-thumb" aria-hidden="true"${full ? " hidden" : ""}></span>
          </div>
          <span class="rj-gray-ratio-value" data-rj-gray-value>${escapeHtml(valueText)}</span>
        </div>`;
      })
      .join("")}</div>`;
  }

  const journeyGrayDragState = {
    active: false,
    track: null,
    pointerId: null,
  };

  function journeyGrayValueFromRatio(channel, ratioPct) {
    const ch = String(channel || "").toUpperCase();
    const pct = Math.round(Math.max(0, Math.min(100, Number(ratioPct) || 0)));
    const kind = typeof channelGrayKind === "function" ? channelGrayKind(ch) : "percent";
    if (kind === "binary") return pct >= 50 ? channelGrayMax(ch) : 0;
    if (kind === "percent") return clampChannelGray(ch, pct);
    return clampChannelGray(ch, Math.round((pct / 100) * channelGrayMax(ch)));
  }

  function ratioFromJourneyGrayPointer(track, clientX) {
    const rect = track.getBoundingClientRect();
    if (!rect.width) return 0;
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    const kind = track.dataset.kind || channelGrayKind(track.dataset.channel || "GP");
    if (kind === "binary") return pct >= 50 ? 100 : 0;
    return Math.round(pct);
  }

  function syncJourneyGrayDragPreview(track, ratioPct) {
    if (!track) return;
    const ch = track.dataset.channel || "GP";
    const ratio = Math.round(Math.max(0, Math.min(100, Number(ratioPct) || 0)));
    const value = journeyGrayValueFromRatio(ch, ratio);
    const nextRatio = Math.round(channelGrayRatio(ch, value));
    const full = nextRatio >= 100 || value >= channelGrayMax(ch);
    track.dataset.ratio = String(nextRatio);
    track.style.setProperty("--rj-gray-pct", `${nextRatio}%`);
    track.setAttribute("aria-valuenow", String(nextRatio));
    const thumb = track.querySelector(".rj-gray-ratio-thumb");
    if (thumb) thumb.hidden = full;
    const card = track.closest(".rj-gray-ratio-card");
    const valueEl = card && card.querySelector("[data-rj-gray-value]");
    if (valueEl) valueEl.textContent = formatChannelGray(ch, value);
    const tone = grayTone(nextRatio);
    if (card) {
      card.classList.toggle("is-full-preview", full);
      card.classList.remove("is-zero", "is-low", "is-mid", "is-full");
      if (tone) card.classList.add(tone);
    }
    return { value, ratio: nextRatio, full };
  }

  function commitJourneyGrayDrag(track) {
    if (!track) return;
    const id = track.dataset.id;
    const ch = track.dataset.channel || "";
    if (!id || !ch) return;
    const row = getReleaseById(id);
    // 仅拒绝「拖拽前已全量」；拖到全量本身仍需提交
    if (row && isFullGray(row, ch)) return;
    const preview = syncJourneyGrayDragPreview(track, track.dataset.ratio);
    if (!preview) return;
    applyGrayPercent(id, preview.value, { date: todayISO(), channel: ch });
  }

  function endJourneyGrayDrag(e) {
    if (!journeyGrayDragState.active) return;
    const track = journeyGrayDragState.track;
    const pointerId = journeyGrayDragState.pointerId;
    if (track && pointerId != null) {
      try {
        track.releasePointerCapture(pointerId);
      } catch (_) {
        /* ignore */
      }
    }
    if (track) track.classList.remove("is-dragging");
    journeyGrayDragState.active = false;
    journeyGrayDragState.track = null;
    journeyGrayDragState.pointerId = null;
    if (track) commitJourneyGrayDrag(track);
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function buildJourneyRolloutTimeline(row) {
    const { nodes, grays } = prepareTimelineNodes(row);
    if (!nodes.length) {
      return `<span class="rv-empty">暂无放量记录</span>`;
    }
    const groups = groupTimelineByDate(nodes, grays);
    if (!groups.length) {
      return `<span class="rv-empty">暂无放量记录</span>`;
    }
    return `<div class="rj-rollout-timeline">${groups
      .map((group, i) => {
        const channelList = [...group.channels.entries()].map(([channel, value]) => ({ channel, value }));
        const isPending = !!group.pending;
        const isCurrent = !!group.current && !isPending;
        const isShared = !isPending && (group.plan || channelList.length !== 1);
        const onlyCh = !isShared && channelList[0] ? String(channelList[0].channel).toLowerCase() : "";
        const cls = ["rj-rollout-node"];
        if (i === 0) cls.push("is-first");
        if (i === groups.length - 1) cls.push("is-last");
        if (isCurrent) cls.push("is-current");
        if (isPending) cls.push("is-pending");
        if (group.plan) cls.push("is-plan");
        if (isShared) cls.push("is-shared");
        if (onlyCh === "gp" || onlyCh === "ps" || onlyCh === "pa") cls.push(`is-${onlyCh}`);
        const dateText = isPending ? "—" : group.date || "—";
        const parts = [];
        if (group.plan) {
          parts.push(`<span class="release-timeline-shared-label">进入计划中</span>`);
        }
        if (channelList.length) {
          parts.push(
            `<span class="release-timeline-pills">${channelList
              .map((g) => channelGrayPill(g.channel, g.value))
              .join("")}</span>`
          );
        } else if (isPending) {
          parts.push(`<span class="release-timeline-shared-label">全量</span>`);
        }
        return `
        <div class="${cls.join(" ")}">
          <div class="rj-rollout-date">${escapeHtml(dateText)}</div>
          <div class="rj-rollout-mid" aria-hidden="true">
            <span class="rj-rollout-line is-left"></span>
            <span class="rj-rollout-indicator"></span>
            <span class="rj-rollout-line is-right"></span>
          </div>
          <div class="rj-rollout-detail">${parts.join("")}</div>
        </div>`;
      })
      .join("")}</div>`;
  }

  function buildJourneyReqTable(row) {
    const reqs = getJourneyReqs(row);
    if (!reqs.length) {
      return `<div class="rj-req-empty">当前版本暂无需求</div>`;
    }
    const baseIds = new Set(getBaseReleaseReqs(row).map((r) => r.id));
    return `
      <div class="rj-req-table-wrap">
        <table class="rj-req-table">
          <thead>
            <tr>
              <th>所属需求</th>
              <th>价值点</th>
              <th>优先级</th>
              <th>落地类型</th>
              <th>落地版本</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${reqs
              .map((req) => {
                const code = getReleaseReqCode(req);
                const typeLabel = landingTypeLabel(req.type);
                const typeCls = landingTypeClass(req.type);
                const extra = !baseIds.has(req.id);
                return `<tr class="${extra ? "is-extra" : ""}">
                  <td>
                    <div class="rj-req-title">${escapeHtml(req.title || "-")}</div>
                    <div class="rj-req-code">${escapeHtml(code || "—")}</div>
                  </td>
                  <td>${req.isValue ? "是" : "—"}</td>
                  <td>${escapeHtml(req.priority || "—")}</td>
                  <td><span class="release-plan-pill ${typeCls}">${escapeHtml(typeLabel)}</span></td>
                  <td>${escapeHtml(req.version || "—")}</td>
                  <td class="rj-req-ops">
                    <button type="button" class="release-plan-req-del" data-action="rj-req-del" data-id="${escapeHtml(
                      row.id
                    )}" data-req-id="${req.id}" title="删除" aria-label="删除">
                      <img src="assets/icons/trash.svg" alt="" />
                    </button>
                  </td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>`;
  }

  function buildJourneyReqSelect(row) {
    return `
      <div class="release-req-select rj-req-select" data-id="${escapeHtml(row.id)}">
        <button type="button" class="release-req-select-btn" data-action="rj-req-add" data-id="${escapeHtml(
          row.id
        )}">
          <span>添加需求</span>
          <img src="assets/icons/chevron-down.svg" alt="" />
        </button>
        <div class="release-req-select-menu" data-rj-req-menu hidden>
          <div class="release-req-select-search">
            <img src="assets/icons/search.svg" alt="" />
            <input type="search" data-rj-req-search placeholder="搜索需求编号或名称" autocomplete="off" />
          </div>
          <div class="release-req-select-list" data-rj-req-list></div>
        </div>
      </div>`;
  }

  function renderJourneyAddReqPicker(releaseId) {
    const card = document.querySelector(`.rj-card[data-journey-id="${CSS.escape(releaseId)}"]`);
    if (!card) return;
    const list = card.querySelector("[data-rj-req-list]");
    const row = getReleaseById(releaseId);
    if (!list || !row) return;
    const picked = new Set(getJourneyReqs(row).map((r) => r.id));
    const q = String(state.journeyAddReqSearch || "").trim().toLowerCase();
    const items = getPickerReqs(row).filter((req) => {
      if (!q) return true;
      const code = getReleaseReqCode(req).toLowerCase();
      const title = String(req.title || "").toLowerCase();
      return title.includes(q) || code.includes(q);
    });
    if (!items.length) {
      list.innerHTML = `<p class="release-req-select-empty">暂无可添加需求</p>`;
      return;
    }
    list.innerHTML = items
      .map((req) => {
        const on = picked.has(req.id);
        return `<button type="button" class="release-req-select-item${on ? " is-on" : ""}" data-action="rj-req-toggle" data-id="${escapeHtml(
          releaseId
        )}" data-req-id="${req.id}">
          <span class="plan-check ${on ? "is-on" : ""}" aria-hidden="true"></span>
          <span class="release-req-select-code">${escapeHtml(getReleaseReqCode(req))}</span>
          <span class="release-req-select-title">${escapeHtml(req.title || "-")}</span>
        </button>`;
      })
      .join("");
  }

  function closeJourneyAddReqPicker() {
    state.journeyReqPickerOpen = false;
    state.journeyAddReqSearch = "";
    document.querySelectorAll("[data-rj-req-menu]").forEach((menu) => {
      menu.hidden = true;
    });
  }

  function openJourneyAddReqPicker(releaseId) {
    const card = document.querySelector(`.rj-card[data-journey-id="${CSS.escape(releaseId)}"]`);
    if (!card) return;
    const menu = card.querySelector("[data-rj-req-menu]");
    const search = card.querySelector("[data-rj-req-search]");
    if (!menu) return;
    closeJourneyAddReqPicker();
    state.journeyReqPickerOpen = true;
    state.journeyAddReqSearch = "";
    if (search) search.value = "";
    renderJourneyAddReqPicker(releaseId);
    menu.hidden = false;
    if (search) search.focus();
  }

  function toggleJourneyAddReqPicker(releaseId) {
    const card = document.querySelector(`.rj-card[data-journey-id="${CSS.escape(releaseId)}"]`);
    const menu = card && card.querySelector("[data-rj-req-menu]");
    if (!menu) return;
    if (!menu.hidden && state.journeyReqPickerOpen) {
      closeJourneyAddReqPicker();
      return;
    }
    openJourneyAddReqPicker(releaseId);
  }

  function toggleJourneyReq(releaseId, reqId) {
    const row = getReleaseById(releaseId);
    if (!row) return;
    const num = Number(reqId);
    if (!num) return;
    const extra = Array.isArray(row.extraReqIds) ? row.extraReqIds.map(Number).filter(Boolean) : [];
    const excluded = Array.isArray(row.excludedReqIds)
      ? row.excludedReqIds.map(Number).filter(Boolean)
      : [];
    const pinned = new Set([
      ...getBaseReleaseReqs(row).map((r) => r.id),
      ...(row.includeGapReqs ? getGapReleaseReqs(row).map((r) => r.id) : []),
    ]);
    let nextExtra = extra;
    let nextExcluded = excluded;
    if (pinned.has(num)) {
      nextExcluded = excluded.includes(num)
        ? excluded.filter((x) => x !== num)
        : [...excluded, num];
    } else {
      nextExtra = extra.includes(num) ? extra.filter((x) => x !== num) : [...extra, num];
    }
    upsertRelease({ ...row, extraReqIds: nextExtra, excludedReqIds: nextExcluded });
    const keepPicker = state.journeyReqPickerOpen;
    const keepSearch = state.journeyAddReqSearch;
    reloadRows();
    renderJourney();
    if (state.detailId === releaseId) {
      const next = getReleaseById(releaseId);
      if (next) {
        state.detailExtraReqIds = Array.isArray(next.extraReqIds)
          ? next.extraReqIds.map(Number).filter(Boolean)
          : [];
        state.detailExcludedReqIds = Array.isArray(next.excludedReqIds)
          ? next.excludedReqIds.map(Number).filter(Boolean)
          : [];
        fillDetail(next);
      }
    }
    if (keepPicker) {
      state.journeyReqPickerOpen = true;
      state.journeyAddReqSearch = keepSearch;
      const card = document.querySelector(`.rj-card[data-journey-id="${CSS.escape(releaseId)}"]`);
      const menu = card && card.querySelector("[data-rj-req-menu]");
      const search = card && card.querySelector("[data-rj-req-search]");
      if (menu) {
        if (search) search.value = keepSearch;
        renderJourneyAddReqPicker(releaseId);
        menu.hidden = false;
      }
    }
  }

  function groupRowsByMonth(rows) {
    const map = new Map();
    rows.forEach((row) => {
      const key = monthKeyFromDate(getJourneySortDate(row));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });
    const keys = [...map.keys()].sort((a, b) => {
      if (a === "unknown") return 1;
      if (b === "unknown") return -1;
      return a < b ? 1 : a > b ? -1 : 0;
    });
    return keys.map((key) => ({
      key,
      label: monthLabelFromKey(key),
      rows: map.get(key).slice().sort(compareJourneyByReleaseTime),
    }));
  }

  function renderJourneyStatusCluster(row) {
    if (row.status === "不涉及") {
      return `<div class="rv-status-publish">
        <button type="button" class="rv-status-plane" data-action="status-publish" data-id="${escapeHtml(
          row.id
        )}" title="发布" aria-label="发布">
          <img src="assets/icons/send-muted.svg" alt="" />
        </button>
        <span class="rv-status-badge ${statusClass(row.status)}">${escapeHtml(row.status)}</span>
      </div>`;
    }
    const channels = journeyPlannedChannels(row);
    const grays = typeof normalizeChannelGrays === "function" ? normalizeChannelGrays(row) : [];
    const valueMap = {};
    grays.forEach((g) => {
      if (g && g.channel) valueMap[g.channel] = g.value;
    });
    // 右侧只写计划渠道；没有值时为 0
    const parts = channels.map((ch) => channelGrayPill(ch, valueMap[ch] != null ? valueMap[ch] : 0));
    parts.push(`<span class="rv-status-badge ${statusClass(row.status)}">${escapeHtml(row.status)}</span>`);
    return parts.join("");
  }

  function renderJourneyCardHeader(row) {
    return `
      <div class="rj-card-main">
        <div class="rj-card-left">
          <span class="rj-product-pill">${escapeHtml(row.product || "—")}</span>
          <strong class="rj-version">${escapeHtml(row.version || "—")}</strong>
        </div>
        <div class="rj-card-right">
          ${renderJourneyStatusCluster(row)}
        </div>
      </div>`;
  }

  function renderJourneyFieldActions(row, field, { remind = false } = {}) {
    // 不涉及 / 新增未发布：不展示编辑与提醒
    if (!row || row.status === "不涉及") return "";
    return `
      <div class="rj-detail-actions">
        ${
          remind
            ? `<button type="button" class="rj-inline-action" data-action="rj-remind" data-id="${escapeHtml(
                row.id
              )}" title="提醒填写数据" aria-label="提醒">
            <img src="assets/icons/remind.svg" alt="" />
          </button>`
            : ""
        }
        <button type="button" class="rj-inline-action" data-action="rj-edit-${escapeHtml(
          field
        )}" data-id="${escapeHtml(row.id)}" title="编辑" aria-label="编辑">
          <img src="assets/icons/pencil.svg" alt="" />
        </button>
      </div>`;
  }

  function renderJourneyCardDetails(row) {
    const content = formatContentBullets(row.releaseNote);
    const reqs = getJourneyReqs(row);
    const apkLabel = formatApkSizeLabel(row);
    const apkHref = row.apkUrl || "#";
    const goalText = String(row.versionGoal || "").trim();
    const dataText = String(row.dataInfo || "").trim();
    const showDetailGrid = row.status !== "不涉及";
    const detailGrid = showDetailGrid
      ? `
        <div class="rj-detail-quad">
          <div class="rj-detail-cell">
            <div class="rj-detail-cell-head">
              <span class="rj-detail-label">版本目标</span>
              ${renderJourneyFieldActions(row, "goal")}
            </div>
            <div class="rj-detail-value" data-rj-field="goal">${
              goalText ? escapeHtml(goalText) : `<span class="rv-empty">暂无版本目标</span>`
            }</div>
          </div>
          <div class="rj-detail-cell">
            <div class="rj-detail-cell-head">
              <span class="rj-detail-label">版本内容</span>
              ${renderJourneyFieldActions(row, "note")}
            </div>
            <div class="rj-detail-value" data-rj-field="note">${
              content || `<span class="rv-empty">暂无 Release Note</span>`
            }</div>
          </div>
          <div class="rj-detail-cell">
            <div class="rj-detail-cell-head">
              <span class="rj-detail-label">数据</span>
              ${renderJourneyFieldActions(row, "data", { remind: true })}
            </div>
            <div class="rj-detail-value" data-rj-field="data">${
              dataText ? escapeHtml(dataText) : `<span class="rv-empty">暂无数据信息</span>`
            }</div>
          </div>
          <div class="rj-detail-cell rj-detail-cell-ratio">
            <div class="rj-detail-cell-head">
              <span class="rj-detail-label">放量比例</span>
            </div>
            <div class="rj-detail-value">${buildJourneyGrayRatio(row)}</div>
          </div>
        </div>
        <div class="rj-rollout-section">
          <div class="rj-rollout-head">
            <span class="rj-req-title-label">放量时间线</span>
          </div>
          <div class="rj-rollout-body">${buildJourneyRolloutTimeline(row)}</div>
        </div>
        <div class="rj-section-gap"></div>`
      : "";
    return `
      <div class="rj-card-detail">
        <div class="rj-divider"></div>
        ${detailGrid}
        <div class="rj-req-section">
          <div class="rj-req-head">
            <div class="rj-req-head-left">
              <span class="rj-req-title-label">版本需求</span>
              <span class="rj-req-count">${reqs.length}项</span>
            </div>
            ${buildJourneyReqSelect(row)}
          </div>
          ${buildJourneyReqTable(row)}
        </div>
        <div class="rj-divider"></div>
        <div class="rj-card-footer">
          <a class="rj-footer-btn" href="${escapeHtml(apkHref)}" target="_blank" rel="noopener" data-action="apk" data-id="${escapeHtml(
            row.id
          )}" ${row.apkUrl ? "" : 'aria-disabled="true"'}>
            <img src="assets/icons/download.svg" alt="" width="13" height="13" />
            <span>APK: ${escapeHtml(apkLabel)}</span>
          </a>
        </div>
      </div>`;
  }

  function journeyFieldMeta(field) {
    if (field === "goal") {
      return {
        key: "versionGoal",
        placeholder: "请填写版本目标",
        requiredWhenPlanning: true,
        requiredToast: "计划中必须填写版本目标",
        savedToast: "版本目标已保存",
      };
    }
    if (field === "note") {
      return {
        key: "releaseNote",
        placeholder: "请填写版本内容",
        requiredWhenPlanning: true,
        requiredToast: "计划中必须填写 Release Note",
        savedToast: "版本内容已保存",
      };
    }
    return {
      key: "dataInfo",
      placeholder: "请填写数据信息",
      requiredWhenPlanning: false,
      requiredToast: "",
      savedToast: "数据信息已保存",
    };
  }

  function saveJourneyFieldInline(ta) {
    if (!ta) return;
    const field = ta.dataset.rjEditor;
    const id = ta.dataset.id;
    if (!field || !id) return;
    const meta = journeyFieldMeta(field);
    const row = getReleaseById(id);
    if (!row) return;
    const next = String(ta.value || "").trim();
    if (meta.requiredWhenPlanning && row.status === "计划中" && !next) {
      showToast(meta.requiredToast);
      ta.focus();
      return;
    }
    if (next === String(row[meta.key] || "").trim()) {
      renderJourney();
      return;
    }
    upsertRelease({ ...row, [meta.key]: next });
    showToast(meta.savedToast);
    reloadRows();
    renderJourney();
    if (state.detailId === id) fillDetail(getReleaseById(id));
  }

  function beginJourneyFieldEdit(id, field) {
    const row = getReleaseById(id);
    if (!row) return;
    const card = document.querySelector(`.rj-card[data-journey-id="${CSS.escape(id)}"]`);
    if (!card) return;
    const valueEl = card.querySelector(`[data-rj-field="${field}"]`);
    if (!valueEl) return;
    if (valueEl.classList.contains("is-editing")) {
      valueEl.querySelector(".rj-inline-editor")?.focus();
      return;
    }
    const meta = journeyFieldMeta(field);
    // 展示态与编辑态同盒模型，锁定高度避免切换时文字跳动
    const lockedHeight = Math.max(Math.ceil(valueEl.getBoundingClientRect().height), 24);
    valueEl.classList.add("is-editing");
    valueEl.style.height = `${lockedHeight}px`;
    valueEl.style.minHeight = `${lockedHeight}px`;
    valueEl.innerHTML = `<textarea class="release-note-editor rj-inline-editor" data-rj-editor="${escapeHtml(
      field
    )}" data-id="${escapeHtml(id)}" placeholder="${escapeHtml(meta.placeholder)}">${escapeHtml(
      row[meta.key] || ""
    )}</textarea>`;
    const ta = valueEl.querySelector(".rj-inline-editor");
    if (!ta) return;
    ta.style.height = "100%";
    ta.style.minHeight = "100%";
    ta.focus();
    const len = ta.value.length;
    ta.setSelectionRange(len, len);
    ta.addEventListener("blur", () => {
      setTimeout(() => {
        if (state.noteSaving) return;
        saveJourneyFieldInline(ta);
      }, 120);
    });
    ta.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        ta.blur();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        renderJourney();
      }
    });
    ta.addEventListener("click", (e) => e.stopPropagation());
  }

  function renderJourneyCard(row, { expanded }) {
    const releaseTime = row.releaseTime || "—";
    return `
      <article class="rj-card${expanded ? " is-expanded" : " is-collapsed"}" data-journey-id="${escapeHtml(
        row.id
      )}" ${expanded ? "" : 'role="button" tabindex="0"'}>
        <div class="rj-marker${expanded ? " is-active" : ""}" data-tip="${escapeHtml(releaseTime)}" aria-label="首次释放时间 ${escapeHtml(
          releaseTime
        )}"></div>
        ${renderJourneyCardHeader(row)}
        ${expanded ? renderJourneyCardDetails(row) : ""}
      </article>`;
  }

  function renderJourney() {
    const body = document.getElementById("release-journey-body");
    if (!body) return;
    const rows = getFilteredRows().slice().sort(compareJourneyByReleaseTime);
    if (!rows.length) {
      body.innerHTML = `<div class="feedback-empty">暂无版本历程</div>`;
      return;
    }

    const onlineIds = getCurrentOnlineIdSet(rows);
    const months = groupRowsByMonth(rows);
    if (!state.journeyExpandedId || !rows.some((r) => r.id === state.journeyExpandedId)) {
      const preferred =
        rows.find((r) => onlineIds.has(r.id)) ||
        rows.find((r) => r.status === "已发布") ||
        rows[0];
      state.journeyExpandedId = preferred ? preferred.id : null;
    }

    body.innerHTML = `
      <div class="release-journey-timeline">
        ${months
          .map(
            (month) => `
          <section class="rj-month">
            <header class="rj-month-header">
              <h3 class="rj-month-title">${escapeHtml(month.label)}</h3>
              <span class="rj-month-count">${month.rows.length}个版本</span>
              <span class="rj-month-line" aria-hidden="true"></span>
            </header>
            <div class="rj-month-items">
              ${month.rows
                .map((row) =>
                  renderJourneyCard(row, {
                    expanded: row.id === state.journeyExpandedId,
                  })
                )
                .join("")}
            </div>
          </section>`
          )
          .join("")}
      </div>`;
  }

  function render() {
    reloadRows();
    syncViewToggle();
    const listView = document.getElementById("release-list-view");
    const journeyView = document.getElementById("release-journey-view");
    const monthFilter = document.getElementById("release-month-filter-wrap");
    const pagination = document.getElementById("release-pagination-bar");
    const isJourney = state.view === "journey";
    if (listView) listView.hidden = isJourney;
    if (journeyView) journeyView.hidden = !isJourney;
    if (monthFilter) monthFilter.hidden = !isJourney;
    if (pagination) pagination.hidden = isJourney;

    const monthLabel = document.getElementById("release-month-value");
    if (monthLabel) monthLabel.textContent = state.month || "全部";
    const monthTitle = document.querySelector(".release-month-label");
    if (monthTitle) monthTitle.hidden = state.month !== "全部";

    const rows = getFilteredRows();
    if (isJourney) {
      renderJourney();
      return;
    }
    renderPagination(rows.length);
    const start = (state.page - 1) * state.pageSize;
    renderRows(rows.slice(start, start + state.pageSize));
    updateSortHeaders();
  }

  function setupSort() {
    document.querySelectorAll(".release-table-header .fb-th.sortable").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.dataset.key;
        if (!key) return;
        if (state.sortKey === key) {
          state.sortAsc = !state.sortAsc;
        } else {
          state.sortKey = key;
          // 首次释放时间默认倒序（与列表默认一致）；其余列首次点击升序
          state.sortAsc = key !== "releaseTime";
        }
        state.page = 1;
        render();
      });
    });
  }

  function channelOptions() {
    return typeof RELEASE_CHANNELS !== "undefined" ? RELEASE_CHANNELS : ["GP", "PS", "PA"];
  }

  const CHANNEL_LABELS = {
    GP: "GP (Google Play)",
    PS: "PS (Palmstore)",
    PA: "PA (Appupdate)",
  };

  function channelLabel(value) {
    const one = parseChannels(value)[0] || String(value || "").trim();
    return CHANNEL_LABELS[one] || one;
  }

  function parseChannels(value) {
    if (typeof listReleaseChannels === "function") return listReleaseChannels(value);
    if (Array.isArray(value)) return value.filter(Boolean);
    return String(value || "")
      .split(/[,/|，、\s]+/)
      .map((s) => s.trim())
      .filter((s) => channelOptions().includes(s));
  }

  function formatChannels(value) {
    return parseChannels(value).join(" / ");
  }

  function renderChannelCell(value) {
    const list = parseChannels(value);
    if (!list.length) return `<span class="rv-empty">—</span>`;
    return `<span class="rv-channel-pills">${list
      .map((ch) => `<span class="rv-channel-pill is-${escapeHtml(ch.toLowerCase())}">${escapeHtml(ch)}</span>`)
      .join("")}</span>`;
  }

  function setDetailChannels(value) {
    const selected = new Set(parseChannels(value));
    document.querySelectorAll("#rd-channel-checks input[type='checkbox']").forEach((el) => {
      el.checked = selected.has(el.value);
    });
  }

  function getDetailChannels() {
    return formatChannels(
      [...document.querySelectorAll("#rd-channel-checks input[type='checkbox']:checked")].map((el) => el.value)
    );
  }

  const PLAN_SELECTS = {
    channel: {
      multiple: true,
      placeholder: "请选择渠道",
      options: () => channelOptions(),
      label: (v) => formatChannels(v) || "请选择渠道",
    },
    shuttle: {
      placeholder: "选择班车月份",
      options: () => (typeof RELEASE_SHUTTLES !== "undefined" ? RELEASE_SHUTTLES : ["", "7月份班车", "8月份班车", "9月份班车"]),
      label: (v) => v || "选择班车月份",
    },
    status: {
      placeholder: "不涉及",
      options: () => ["不涉及", "计划中", "已发布"],
      label: (v) => v || "不涉及",
    },
    product: {
      placeholder: "请选择产品",
      options: () => (typeof getReleaseProductOptions === "function" ? getReleaseProductOptions() : []),
      label: (v) => v || "请选择产品",
    },
  };

  function planSelectRoot(root) {
    return root || document.getElementById("release-edit-modal");
  }

  function setPlanSelect(key, value, placeholder, root) {
    const wrap = planSelectRoot(root).querySelector(`[data-plan-select="${key}"]`);
    if (!wrap) return;
    const hidden = wrap.querySelector('input[type="hidden"]');
    const text = wrap.querySelector(".select-text");
    const meta = PLAN_SELECTS[key];
    const next = meta.multiple ? parseChannels(value).join(",") : value || "";
    hidden.value = next;
    text.textContent = meta.label(next);
    text.classList.toggle("placeholder", !next && Boolean(placeholder || meta.placeholder));
  }

  function renderPlanSelectMenu(wrap) {
    const key = wrap.dataset.planSelect;
    const meta = PLAN_SELECTS[key];
    const menu = wrap.querySelector(".select-menu");
    const hidden = wrap.querySelector('input[type="hidden"]');
    if (!meta || !menu || !hidden) return;
    const selected = meta.multiple ? parseChannels(hidden.value) : [hidden.value];
    menu.classList.toggle("is-channel", key === "channel");
    menu.innerHTML = meta
      .options()
      .map((v) => {
        const label = key === "channel" ? channelLabel(v) : meta.multiple ? v : meta.label(v);
        const on = selected.includes(v);
        const mark = meta.multiple
          ? `<span class="plan-check ${on ? "is-on" : ""}" aria-hidden="true"></span>`
          : "";
        return `<button type="button" class="${on ? "selected" : ""}" data-value="${escapeHtml(v)}">${mark}${escapeHtml(label)}</button>`;
      })
      .join("");
  }

  function setupPlanSelects(root) {
    const scope = planSelectRoot(root);
    scope.querySelectorAll("[data-plan-select]").forEach((wrap) => {
      const key = wrap.dataset.planSelect;
      const meta = PLAN_SELECTS[key];
      const btn = wrap.querySelector(".field-select");
      const menu = wrap.querySelector(".select-menu");
      const hidden = wrap.querySelector('input[type="hidden"]');
      if (!meta || !btn || !menu || !hidden) return;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (scope.id === "release-edit-modal") closeAddReqPicker();
        scope.querySelectorAll(".select-menu").forEach((m) => {
          if (m !== menu) m.hidden = true;
        });
        renderPlanSelectMenu(wrap);
        menu.hidden = !menu.hidden;
      });

      menu.addEventListener("click", (e) => {
        e.stopPropagation();
        const item = e.target.closest("button[data-value]");
        if (!item) return;
        if (meta.multiple) {
          const current = parseChannels(hidden.value);
          const val = item.dataset.value;
          const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
          setPlanSelect(key, next, meta.placeholder);
          renderPlanSelectMenu(wrap);
          return;
        }
        setPlanSelect(key, item.dataset.value, meta.placeholder, scope);
        if (key === "status") syncPlanningRequired(item.dataset.value);
        menu.hidden = true;
      });
    });
  }

  function setupDropdown(btnId, dropdownId, labelId, options, key) {
    const btn = document.getElementById(btnId);
    const dropdown = document.getElementById(dropdownId);
    const label = document.getElementById(labelId);

    function fillOptions(list) {
      dropdown.innerHTML = list
        .map(
          (p) =>
            `<button type="button" class="${p === state[key] ? "selected" : ""}" data-value="${escapeHtml(p)}">${escapeHtml(p)}</button>`
        )
        .join("");
    }

    fillOptions(options);

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (key === "product" && typeof getReleaseProducts === "function") {
        fillOptions(getReleaseProducts());
      }
      if (key === "month") {
        fillOptions(getReleaseMonthOptions());
      }
      document.querySelectorAll(".dropdown").forEach((d) => {
        if (d !== dropdown) d.hidden = true;
      });
      dropdown.hidden = !dropdown.hidden;
    });

    dropdown.addEventListener("click", (e) => {
      const item = e.target.closest("button[data-value]");
      if (!item) return;
      state[key] = item.dataset.value;
      state.page = 1;
      label.textContent = state[key];
      dropdown.querySelectorAll("button[data-value]").forEach((el) => {
        el.classList.toggle("selected", el.dataset.value === state[key]);
      });
      dropdown.hidden = true;
      render();
    });
  }

  function anyModalOpen() {
    return ["release-detail-modal", "release-edit-modal", "release-gray-modal", "release-create-modal"].some(
      (id) => !document.getElementById(id).hidden
    );
  }

  function showDetailDrawer() {
    const overlay = document.getElementById("release-detail-modal");
    if (state.detailCloseTimer) {
      clearTimeout(state.detailCloseTimer);
      state.detailCloseTimer = null;
    }
    overlay.hidden = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add("is-open"));
    });
  }

  function hideDetailDrawer() {
    const overlay = document.getElementById("release-detail-modal");
    overlay.classList.remove("is-open");
    const finish = () => {
      overlay.hidden = true;
      state.detailCloseTimer = null;
      state.detailId = null;
      if (!anyModalOpen()) document.body.classList.remove("modal-open");
    };
    if (state.detailCloseTimer) clearTimeout(state.detailCloseTimer);
    state.detailCloseTimer = setTimeout(finish, 320);
  }

  function openModal(id) {
    document.getElementById(id).hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeModal(id) {
    document.getElementById(id).hidden = true;
    if (!anyModalOpen()) document.body.classList.remove("modal-open");
  }

  function channelGrayPill(channel, value) {
    const ch = String(channel || "").toUpperCase();
    return `<span class="rv-channel-pill is-${escapeHtml(ch.toLowerCase())}">${escapeHtml(ch)} ${escapeHtml(formatChannelGray(ch, value))}</span>`;
  }

  function isPlanTimelineNode(n) {
    if (!n || n.pending || n.channel) return false;
    if (n.note === "进入计划中") return true;
    return Number(n.percent) === 0 && (n.value == null || Number(n.value) === 0);
  }

  function shiftTimelineDate(iso, days) {
    if (!iso) return "";
    if (typeof addDaysISO === "function") return addDaysISO(iso, days);
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    d.setDate(d.getDate() + days);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function staggerPackedTimeline(nodes) {
    const active = nodes.filter((n) => !n.pending && n.date);
    if (active.length < 2) return;
    const dates = new Set(active.map((n) => n.date));
    if (dates.size > 1) return;
    const base = active[0].date;
    const last = active.length - 1;
    active.forEach((n, i) => {
      n.date = shiftTimelineDate(base, -4 * (last - i));
    });
  }

  function insertMissingGraySteps(nodes) {
    const extras = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const cur = nodes[i];
      const next = nodes[i + 1];
      if (!next || cur.pending || next.pending || next.channel !== "GP") continue;
      const nextVal = Number(next.value);
      if (cur.plan && nextVal >= 70) {
        extras.push({
          at: i + 1,
          nodes: [
            { date: shiftTimelineDate(next.date, -8), channel: "GP", value: 10, percent: 10 },
            { date: shiftTimelineDate(next.date, -4), channel: "GP", value: 35, percent: 35 },
          ],
        });
      } else if (cur.channel === "GP" && Number(cur.value) <= 15 && nextVal >= 90) {
        extras.push({
          at: i + 1,
          nodes: [
            { date: shiftTimelineDate(next.date, -4), channel: "GP", value: 35, percent: 35 },
            { date: shiftTimelineDate(next.date, -2), channel: "GP", value: 70, percent: 70 },
          ],
        });
      }
    }
    extras.reverse().forEach((item) => {
      nodes.splice(item.at, 0, ...item.nodes);
    });
  }

  function inferOrphanTimelineChannel(n, grays) {
    if (!grays.length) return "";
    const pct = Number(n.percent);
    const percentChannels = grays.filter((g) => channelGrayKind(g.channel) === "percent");
    const exact = percentChannels.find((g) => g.value === pct);
    if (exact) return exact.channel;
    const covering = percentChannels.find((g) => g.value >= pct);
    if (covering) return covering.channel;
    if (percentChannels[0]) return percentChannels[0].channel;
    return grays[0].channel;
  }

  function prepareTimelineNodes(row) {
    const grays = typeof normalizeChannelGrays === "function" ? normalizeChannelGrays(row) : [];
    const nodes = [];
    (row.timeline || []).forEach((item) => {
      const n = { ...item };
      if (n.pending) return;
      if (isPlanTimelineNode(n)) {
        nodes.push({ ...n, plan: true, channel: "", percent: 0, note: n.note || "进入计划中" });
        return;
      }
      if (n.channel) {
        nodes.push({
          ...n,
          value: n.value != null ? n.value : n.percent,
        });
        return;
      }
      const ch = inferOrphanTimelineChannel(n, grays);
      if (!ch) {
        nodes.push({ ...n, plan: Number(n.percent) === 0 });
        return;
      }
      const value = n.value != null ? n.value : Number(n.percent);
      nodes.push({
        ...n,
        channel: ch,
        value,
        percent: channelGrayRatio(ch, value),
      });
    });

    const lastDate = [...nodes].reverse().find((n) => n.date)?.date || row.rolloutTime || row.releaseTime || "";
    grays.forEach((g) => {
      if (g.value <= 0) return;
      const exists = nodes.some((n) => n.channel === g.channel && Number(n.value) === Number(g.value));
      if (exists) return;
      nodes.push({
        date: lastDate,
        channel: g.channel,
        value: g.value,
        percent: channelGrayRatio(g.channel, g.value),
        note: g.value >= channelGrayMax(g.channel) ? `${g.channel} 全量` : `${g.channel} 当前灰度`,
      });
    });

    staggerPackedTimeline(nodes);
    insertMissingGraySteps(nodes);

    const allFull = grays.length
      ? grays.every((g) => g.value >= channelGrayMax(g.channel))
      : nodes.some((n) => !n.plan && Number(n.percent) >= 100);
    if (!allFull && row.status !== "不涉及") {
      nodes.push({ date: "", percent: 100, note: "全量", pending: true });
    }

    let currentIdx = nodes.findIndex((n) => n.current && !n.pending);
    if (currentIdx < 0) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        if (!nodes[i].pending) {
          currentIdx = i;
          break;
        }
      }
    }
    nodes.forEach((n, i) => {
      n.current = i === currentIdx && !n.pending;
    });
    return { nodes, grays };
  }

  function groupTimelineByDate(nodes, grays) {
    const groups = [];
    const index = new Map();
    nodes.forEach((n) => {
      const key = n.pending ? "__pending__" : n.date || "—";
      if (!index.has(key)) {
        const group = {
          date: n.pending ? "" : n.date || "",
          pending: false,
          plan: false,
          current: false,
          channels: new Map(),
        };
        index.set(key, group);
        groups.push(group);
      }
      const group = index.get(key);
      if (n.pending) group.pending = true;
      if (n.plan) group.plan = true;
      if (n.current) group.current = true;
      if (n.channel) group.channels.set(n.channel, n.value != null ? n.value : n.percent);
    });

    if (!groups.some((g) => g.current && !g.pending)) {
      for (let i = groups.length - 1; i >= 0; i--) {
        if (!groups[i].pending) {
          groups[i].current = true;
          break;
        }
      }
    }

    groups.forEach((group) => {
      if (group.current && !group.pending && grays.length) {
        group.channels = new Map(grays.map((g) => [g.channel, g.value]));
      }
    });
    return groups;
  }

  function buildTimelineNodes(row) {
    const { nodes, grays } = prepareTimelineNodes(row);
    if (!nodes.length) {
      return `<div class="release-timeline-empty">暂无放量记录。可将状态改为「计划中」后开始跟踪。</div>`;
    }

    const groups = groupTimelineByDate(nodes, grays);
    return `
      <div class="release-timeline-list">
        ${groups
          .map((group) => {
            const channelList = [...group.channels.entries()].map(([channel, value]) => ({ channel, value }));
            const isPending = !!group.pending;
            const isCurrent = !!group.current && !isPending;
            const isShared = !isPending && (group.plan || channelList.length !== 1);
            const onlyCh = !isShared && channelList[0] ? String(channelList[0].channel).toLowerCase() : "";
            const cls = ["release-timeline-node"];
            if (isCurrent) cls.push("is-current");
            if (isPending) cls.push("is-pending");
            if (group.plan) cls.push("is-plan");
            if (isShared) cls.push("is-shared");
            if (onlyCh === "gp" || onlyCh === "ps" || onlyCh === "pa") cls.push(`is-${onlyCh}`);
            const dateText = group.date || "—";
            const parts = [];
            if (group.plan) {
              parts.push(`<span class="release-timeline-shared-label">进入计划中</span>`);
            }
            if (channelList.length) {
              parts.push(
                `<span class="release-timeline-pills">${channelList
                  .map((g) => channelGrayPill(g.channel, g.value))
                  .join("")}</span>`
              );
            } else if (isPending) {
              parts.push(`<span class="release-timeline-shared-label">全量</span>`);
            }
            return `
            <div class="${cls.join(" ")}">
              <div class="release-timeline-date">${escapeHtml(dateText)}</div>
              <div class="release-timeline-indicator" aria-hidden="true"></div>
              <div class="release-timeline-detail">
                ${parts.join("")}
              </div>
            </div>`;
          })
          .join("")}
      </div>`;
  }

  function fillDetail(row) {
    state.detailId = row.id;
    document.getElementById("rd-version").textContent = row.version;
    document.getElementById("rd-product").textContent = row.product || "—";
    document.getElementById("rd-iteration").textContent = row.iteration || "—";
    document.getElementById("rd-shuttle").textContent = row.shuttle || "—";
    document.getElementById("rd-release-time").textContent = row.releaseTime || "—";

    state.detailExtraReqIds = Array.isArray(row.extraReqIds) ? row.extraReqIds.map(Number).filter(Boolean) : [];
    state.detailExcludedReqIds = Array.isArray(row.excludedReqIds) ? row.excludedReqIds.map(Number).filter(Boolean) : [];
    closeDetailAddReqPicker();
    renderDetailReqList(row);

    const apkEl = document.getElementById("rd-apk");
    if (row.apkUrl) {
      apkEl.innerHTML = `<a class="release-info-apk" href="${escapeHtml(row.apkUrl)}" target="_blank" rel="noopener">${escapeHtml(row.apkUrl)}</a>`;
    } else {
      apkEl.innerHTML = `<span class="rv-empty">—</span>`;
    }

    const tags = [`<span class="rv-status-badge ${statusClass(row.status)}">${escapeHtml(row.status)}</span>`];
    const detailGrays = typeof normalizeChannelGrays === "function" ? normalizeChannelGrays(row) : [];
    detailGrays.forEach((g) => {
      tags.push(
        `<span class="rv-channel-pill is-${escapeHtml(g.channel.toLowerCase())}">${escapeHtml(g.channel)} ${escapeHtml(formatChannelGray(g.channel, g.value))}</span>`
      );
    });
    document.getElementById("rd-tags").innerHTML = tags.join("");
    setDetailChannels(row.channel);

    const goalEl = document.getElementById("rd-goal");
    goalEl.classList.remove("is-editing");
    if (row.versionGoal) {
      goalEl.innerHTML = escapeHtml(row.versionGoal)
        .split(/\n+/)
        .filter(Boolean)
        .map((line) => `<p>${line}</p>`)
        .join("");
    } else {
      goalEl.innerHTML = `<p class="rv-empty">暂无版本目标</p>`;
    }

    const noteEl = document.getElementById("rd-note");
    noteEl.classList.remove("is-editing");
    if (row.releaseNote) {
      noteEl.innerHTML = escapeHtml(row.releaseNote)
        .split(/\n+/)
        .filter(Boolean)
        .map((line) => `<p>${line}</p>`)
        .join("");
    } else {
      noteEl.innerHTML = `<p class="rv-empty">暂无 Release Note</p>`;
    }

    const dataSection = document.getElementById("rd-data-section");
    const dataEl = document.getElementById("rd-data");
    if (dataSection) dataSection.hidden = row.status !== "已发布";
    if (dataEl) {
      dataEl.classList.remove("is-editing");
      if (row.dataInfo) {
        dataEl.innerHTML = escapeHtml(row.dataInfo)
          .split(/\n+/)
          .filter(Boolean)
          .map((line) => `<p>${line}</p>`)
          .join("");
      } else {
        dataEl.innerHTML = `<p class="rv-empty">暂无数据信息</p>`;
      }
    }

    document.getElementById("rd-timeline").innerHTML = buildTimelineNodes(row);
  }

  function saveGoalInline() {
    const ta = document.getElementById("rd-goal-editor");
    if (!ta || !state.detailId) return;
    const row = getReleaseById(state.detailId);
    if (!row) return;
    const goal = ta.value.trim();
    if (row.status === "计划中" && !goal) {
      showToast("计划中必须填写版本目标");
      ta.focus();
      return;
    }
    if (goal === (row.versionGoal || "").trim()) {
      fillDetail(row);
      return;
    }
    upsertRelease({ ...row, versionGoal: goal });
    showToast("版本目标已保存");
    fillDetail(getReleaseById(state.detailId));
    render();
  }

  function beginGoalEdit() {
    if (!state.detailId) return;
    const row = getReleaseById(state.detailId);
    if (!row) return;
    const goalEl = document.getElementById("rd-goal");
    if (goalEl.classList.contains("is-editing")) {
      document.getElementById("rd-goal-editor")?.focus();
      return;
    }
    const lockedHeight = Math.max(goalEl.offsetHeight, 48);
    goalEl.classList.add("is-editing");
    goalEl.innerHTML = `<textarea class="release-note-editor" id="rd-goal-editor" placeholder="请填写版本目标">${escapeHtml(row.versionGoal || "")}</textarea>`;
    const ta = document.getElementById("rd-goal-editor");
    ta.style.height = `${lockedHeight}px`;
    ta.style.minHeight = `${lockedHeight}px`;
    ta.focus();
    const len = ta.value.length;
    ta.setSelectionRange(len, len);
    ta.addEventListener("blur", () => {
      setTimeout(() => {
        if (state.noteSaving) return;
        saveGoalInline();
      }, 120);
    });
    ta.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        ta.blur();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        fillDetail(row);
      }
    });
  }

  function saveNoteInline() {
    const ta = document.getElementById("rd-note-editor");
    if (!ta || !state.detailId) return;
    const row = getReleaseById(state.detailId);
    if (!row) return;
    const note = ta.value.trim();
    if (row.status === "计划中" && !note) {
      showToast("计划中必须填写 Release Note");
      ta.focus();
      return;
    }
    if (note === (row.releaseNote || "").trim()) {
      fillDetail(row);
      return;
    }
    upsertRelease({ ...row, releaseNote: note });
    showToast("Release Note 已保存");
    fillDetail(getReleaseById(state.detailId));
    render();
  }

  function beginNoteEdit() {
    if (!state.detailId) return;
    const row = getReleaseById(state.detailId);
    if (!row) return;
    const noteEl = document.getElementById("rd-note");
    if (noteEl.classList.contains("is-editing")) {
      document.getElementById("rd-note-editor")?.focus();
      return;
    }
    const lockedHeight = Math.max(noteEl.offsetHeight, 48);
    noteEl.classList.add("is-editing");
    noteEl.innerHTML = `<textarea class="release-note-editor" id="rd-note-editor" placeholder="请填写 Release Note">${escapeHtml(row.releaseNote || "")}</textarea>`;
    const ta = document.getElementById("rd-note-editor");
    ta.style.height = `${lockedHeight}px`;
    ta.style.minHeight = `${lockedHeight}px`;
    ta.focus();
    const len = ta.value.length;
    ta.setSelectionRange(len, len);
    ta.addEventListener("blur", () => {
      // 延迟，避免点铅笔时立刻 blur 冲突
      setTimeout(() => {
        if (state.noteSaving) return;
        saveNoteInline();
      }, 120);
    });
    ta.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        ta.blur();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        fillDetail(row);
      }
    });
  }

  function saveDataInline() {
    const ta = document.getElementById("rd-data-editor");
    if (!ta || !state.detailId) return;
    const row = getReleaseById(state.detailId);
    if (!row) return;
    const dataInfo = ta.value.trim();
    if (dataInfo === (row.dataInfo || "").trim()) {
      fillDetail(row);
      return;
    }
    upsertRelease({ ...row, dataInfo });
    showToast("数据信息已保存");
    fillDetail(getReleaseById(state.detailId));
    render();
  }

  function beginDataEdit() {
    if (!state.detailId) return;
    const row = getReleaseById(state.detailId);
    if (!row || row.status !== "已发布") return;
    const dataEl = document.getElementById("rd-data");
    if (dataEl.classList.contains("is-editing")) {
      document.getElementById("rd-data-editor")?.focus();
      return;
    }
    const lockedHeight = Math.max(dataEl.offsetHeight, 48);
    dataEl.classList.add("is-editing");
    dataEl.innerHTML = `<textarea class="release-note-editor" id="rd-data-editor" placeholder="请填写数据信息">${escapeHtml(row.dataInfo || "")}</textarea>`;
    const ta = document.getElementById("rd-data-editor");
    ta.style.height = `${lockedHeight}px`;
    ta.style.minHeight = `${lockedHeight}px`;
    ta.focus();
    const len = ta.value.length;
    ta.setSelectionRange(len, len);
    ta.addEventListener("blur", () => {
      setTimeout(() => {
        if (state.noteSaving) return;
        saveDataInline();
      }, 120);
    });
    ta.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        ta.blur();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        fillDetail(row);
      }
    });
  }

  function saveDetail() {
    if (!state.detailId) return;
    const row = getReleaseById(state.detailId);
    if (!row) return;
    const channel = getDetailChannels();
    if (row.status === "计划中" && !channel) {
      showToast("计划中必须选择渠道");
      return;
    }
    state.noteSaving = true;
    const noteEl = document.getElementById("rd-note");
    const goalEl = document.getElementById("rd-goal");
    if (goalEl && goalEl.classList.contains("is-editing")) {
      saveGoalInline();
    }
    if (noteEl && noteEl.classList.contains("is-editing")) {
      saveNoteInline();
    }
    const dataEl = document.getElementById("rd-data");
    if (dataEl && dataEl.classList.contains("is-editing")) {
      saveDataInline();
    }
    const latest = getReleaseById(state.detailId) || row;
    const next = typeof applyChannelSelection === "function" ? applyChannelSelection(latest, channel) : { ...latest, channel };
    upsertRelease({
      ...next,
      extraReqIds: state.detailExtraReqIds.slice(),
      excludedReqIds: state.detailExcludedReqIds.slice(),
    });
    showToast("已保存");
    state.noteSaving = false;
    hideDetailDrawer();
    render();
  }

  function openDetail(id) {
    const row = getReleaseById(id);
    if (!row) return;
    fillDetail(row);
    showDetailDrawer();
  }

  function syncPlanningRequired(status) {
    const need = status === "计划中";
    document.getElementById("re-goal-req").hidden = !need;
    document.getElementById("re-note-req").hidden = !need;
    document.getElementById("re-channel-req").hidden = !need;
  }

  function landingTypeLabel(type) {
    if (type === "TOS版本") return "TOS版本";
    if (type === "敏捷迭代") return "敏捷版本";
    return type || "-";
  }

  function landingTypeClass(type) {
    if (type === "TOS版本") return "is-tos";
    if (type === "敏捷迭代") return "is-agile";
    return "";
  }

  function getReleaseReqCode(req) {
    if (!req) return "";
    if (req.reqCode) return req.reqCode;
    if (typeof isAR === "function" && isAR(req)) return makeArCode(req.id, req.requestDate);
    if (typeof isSR === "function" && isSR(req)) return makeSrCode(req.id, req.requestDate);
    return typeof makeReqCode === "function" ? makeReqCode(req.id, req.requestDate) : "";
  }

  function iterationSortKey(name) {
    const m = String(name || "").match(/(\d+)/);
    return m ? Number(m[1]) : 0;
  }

  function findReqById(id) {
    if (typeof REQUIREMENTS === "undefined" || !Array.isArray(REQUIREMENTS)) return null;
    return REQUIREMENTS.find((r) => r.id === Number(id)) || null;
  }

  function getBaseReleaseReqs(row) {
    if (!row || typeof getIterationRequirements !== "function") return [];
    return getIterationRequirements(row.iteration, row.product) || [];
  }

  function getPreviousPublishedRelease(row) {
    if (!row) return null;
    const curN = iterationSortKey(row.iteration);
    const published = getReleases().filter(
      (r) => r.product === row.product && r.id !== row.id && r.status === "已发布"
    );
    const before = published.filter((r) => {
      if (row.releaseTime && r.releaseTime && r.releaseTime !== row.releaseTime) {
        return r.releaseTime < row.releaseTime;
      }
      const n = iterationSortKey(r.iteration);
      return n > 0 && curN > 0 ? n < curN : String(r.version || "") < String(row.version || "");
    });
    const pool = before.length ? before : row.status === "已发布" ? [] : published;
    return (
      pool.sort((a, b) => {
        const ta = String(a.releaseTime || "");
        const tb = String(b.releaseTime || "");
        if (ta !== tb) return ta.localeCompare(tb);
        return iterationSortKey(a.iteration) - iterationSortKey(b.iteration);
      }).pop() || null
    );
  }

  function getDemoGapReqs(row) {
    const product = row && row.product ? row.product : "";
    return [
      {
        id: -9101,
        title: "用户中心改版",
        product,
        isValue: true,
        priority: "P1",
        type: "TOS版本",
        version: "17.0",
        reqCode: "SR-202605-000106",
      },
      {
        id: -9102,
        title: "消息推送优化",
        product,
        isValue: true,
        priority: "P2",
        type: "TOS版本",
        version: "17.0",
        reqCode: "SR-202605-000107",
      },
    ];
  }

  function getGapReleaseReqs(row) {
    const prev = getPreviousPublishedRelease(row);
    const seen = new Set(getBaseReleaseReqs(row).map((r) => r.id));
    const out = [];
    const push = (req) => {
      if (!req || seen.has(req.id)) return;
      seen.add(req.id);
      out.push(req);
    };
    if (prev) {
      const prevN = iterationSortKey(prev.iteration);
      const curN = iterationSortKey(row.iteration);
      if (typeof ITERATIONS !== "undefined" && Array.isArray(ITERATIONS)) {
        ITERATIONS.filter(
          (it) =>
            it.product === row.product &&
            iterationSortKey(it.name) > prevN &&
            iterationSortKey(it.name) < curN
        ).forEach((it) => {
          (getIterationRequirements(it.name, it.product) || []).forEach(push);
        });
      }
      const start = prev.releaseTime || "";
      const end = row.releaseTime || "";
      if (typeof REQUIREMENTS !== "undefined") {
        REQUIREMENTS.forEach((r) => {
          if (r.product !== row.product) return;
          if (typeof isIR === "function" && isIR(r)) return;
          const d = r.requestDate || "";
          if (start && d && d > start && (!end || d <= end)) push(r);
        });
      }
    }
    if (!out.length) getDemoGapReqs(row).forEach(push);
    return out;
  }

  function collectReleaseReqs(row, extraIds, includeGap, excludedIds) {
    const seen = new Set();
    const out = [];
    const pushAll = (list) => {
      (list || []).forEach((req) => {
        if (!req || seen.has(req.id)) return;
        seen.add(req.id);
        out.push(req);
      });
    };
    pushAll(getBaseReleaseReqs(row));
    if (includeGap) pushAll(getGapReleaseReqs(row));
    pushAll((extraIds || []).map(findReqById).filter(Boolean));
    const excluded = new Set(excludedIds || []);
    return out.filter((req) => !excluded.has(req.id));
  }

  function getReleaseReqs(row) {
    return collectReleaseReqs(row, state.editExtraReqIds, state.editIncludeGap, state.editExcludedReqIds);
  }

  function getPickerReqs(row) {
    if (!row || typeof REQUIREMENTS === "undefined") return [];
    const seen = new Set();
    const out = [];
    const push = (req) => {
      if (!req || seen.has(req.id)) return;
      seen.add(req.id);
      out.push(req);
    };
    getBaseReleaseReqs(row).forEach(push);
    const hasChild = new Set(
      REQUIREMENTS.filter((r) => r.parentId).map((r) => r.parentId)
    );
    REQUIREMENTS.forEach((r) => {
      if (r.product !== row.product) return;
      if (typeof isIR === "function" && isIR(r) && hasChild.has(r.id)) return;
      push(r);
    });
    return out;
  }

  function buildReqTableRow(req, { extra = false, withOps = false } = {}) {
    const code = getReleaseReqCode(req);
    const priority = req.priority
      ? `<span class="release-plan-pill">${escapeHtml(req.priority)}</span>`
      : `<span class="iter-detail-cell-muted">-</span>`;
    const typeLabel = landingTypeLabel(req.type);
    const typeCls = landingTypeClass(req.type);
    const ops = withOps
      ? `<td class="col-ops">
            <button type="button" class="release-plan-req-del" data-req-id="${req.id}" title="删除" aria-label="删除">
              <img src="assets/icons/trash.svg" alt="" />
            </button>
          </td>`
      : "";
    return `<tr class="${extra ? "is-extra" : ""}">
          <td class="col-name">
            <div class="release-plan-req-title" title="${escapeHtml(req.title || "")}">${escapeHtml(req.title || "-")}</div>
            <div class="release-plan-req-code">${escapeHtml(code)}</div>
          </td>
          <td class="col-value">${req.isValue ? "是" : "否"}</td>
          <td class="col-priority">${priority}</td>
          <td class="col-type"><span class="release-plan-pill ${typeCls}">${escapeHtml(typeLabel)}</span></td>
          <td class="col-version">${escapeHtml(req.version || "-")}</td>
          ${ops}
        </tr>`;
  }

  function renderEditReqList(row) {
    const list = document.getElementById("re-req-list");
    const reqs = getReleaseReqs(row);
    if (!reqs.length) {
      list.innerHTML = `<tr><td class="release-plan-req-empty" colspan="6">当前迭代暂无需求</td></tr>`;
      return;
    }
    const baseIds = new Set(getBaseReleaseReqs(row).map((r) => r.id));
    list.innerHTML = reqs
      .map((req) => buildReqTableRow(req, { extra: !baseIds.has(req.id), withOps: true }))
      .join("");
  }

  function getDetailReleaseReqs(row) {
    return collectReleaseReqs(
      row,
      state.detailExtraReqIds,
      !!row.includeGapReqs,
      state.detailExcludedReqIds
    );
  }

  function renderDetailReqList(row) {
    const list = document.getElementById("rd-reqs");
    if (!list || !row) return;
    const reqs = getDetailReleaseReqs(row);
    if (!reqs.length) {
      list.innerHTML = `<tr><td class="release-plan-req-empty" colspan="6">当前迭代暂无需求</td></tr>`;
      return;
    }
    const baseIds = new Set(getBaseReleaseReqs(row).map((r) => r.id));
    list.innerHTML = reqs
      .map((req) => buildReqTableRow(req, { extra: !baseIds.has(req.id), withOps: true }))
      .join("");
  }

  function renderDetailAddReqPicker() {
    const list = document.getElementById("rd-add-req-list");
    const row = getReleaseById(state.detailId);
    if (!list || !row) return;
    const picked = new Set(getDetailReleaseReqs(row).map((r) => r.id));
    const q = String(state.detailAddReqSearch || "").trim().toLowerCase();
    const items = getPickerReqs(row).filter((req) => {
      if (!q) return true;
      const code = getReleaseReqCode(req).toLowerCase();
      const title = String(req.title || "").toLowerCase();
      return title.includes(q) || code.includes(q);
    });
    if (!items.length) {
      list.innerHTML = `<p class="release-req-select-empty">暂无可添加需求</p>`;
      return;
    }
    list.innerHTML = items
      .map((req) => {
        const on = picked.has(req.id);
        return `<button type="button" class="release-req-select-item${on ? " is-on" : ""}" data-req-id="${req.id}">
          <span class="plan-check ${on ? "is-on" : ""}" aria-hidden="true"></span>
          <span class="release-req-select-code">${escapeHtml(getReleaseReqCode(req))}</span>
          <span class="release-req-select-title">${escapeHtml(req.title || "-")}</span>
        </button>`;
      })
      .join("");
  }

  function closeDetailAddReqPicker() {
    const menu = document.getElementById("rd-req-select-menu");
    if (menu) menu.hidden = true;
    state.detailAddReqSearch = "";
  }

  function toggleDetailAddReqPicker() {
    const menu = document.getElementById("rd-req-select-menu");
    if (!menu) return;
    const nextOpen = menu.hidden;
    document.querySelectorAll("#release-detail-modal .select-menu").forEach((m) => {
      m.hidden = true;
    });
    if (!nextOpen) {
      closeDetailAddReqPicker();
      return;
    }
    state.detailAddReqSearch = "";
    const search = document.getElementById("rd-add-req-search");
    if (search) search.value = "";
    renderDetailAddReqPicker();
    menu.hidden = false;
    if (search) search.focus();
  }

  function toggleDetailExtraReq(id) {
    const num = Number(id);
    const row = getReleaseById(state.detailId);
    if (!row) return;
    const pinned = new Set([
      ...getBaseReleaseReqs(row).map((r) => r.id),
      ...(row.includeGapReqs ? getGapReleaseReqs(row).map((r) => r.id) : []),
    ]);
    if (pinned.has(num)) {
      state.detailExcludedReqIds = state.detailExcludedReqIds.includes(num)
        ? state.detailExcludedReqIds.filter((x) => x !== num)
        : [...state.detailExcludedReqIds, num];
    } else {
      state.detailExtraReqIds = state.detailExtraReqIds.includes(num)
        ? state.detailExtraReqIds.filter((x) => x !== num)
        : [...state.detailExtraReqIds, num];
    }
    renderDetailReqList(row);
    renderDetailAddReqPicker();
  }

  function renderAddReqPicker() {
    const list = document.getElementById("release-add-req-list");
    const row = getReleaseById(state.editId);
    if (!list || !row) return;
    const picked = new Set(getReleaseReqs(row).map((r) => r.id));
    const q = String(state.addReqSearch || "").trim().toLowerCase();
    const items = getPickerReqs(row).filter((req) => {
      if (!q) return true;
      const code = getReleaseReqCode(req).toLowerCase();
      const title = String(req.title || "").toLowerCase();
      return title.includes(q) || code.includes(q);
    });
    if (!items.length) {
      list.innerHTML = `<p class="release-req-select-empty">暂无可添加需求</p>`;
      return;
    }
    list.innerHTML = items
      .map((req) => {
        const on = picked.has(req.id);
        return `<button type="button" class="release-req-select-item${on ? " is-on" : ""}" data-req-id="${req.id}">
          <span class="plan-check ${on ? "is-on" : ""}" aria-hidden="true"></span>
          <span class="release-req-select-code">${escapeHtml(getReleaseReqCode(req))}</span>
          <span class="release-req-select-title">${escapeHtml(req.title || "-")}</span>
        </button>`;
      })
      .join("");
  }

  function closeAddReqPicker() {
    const menu = document.getElementById("re-req-select-menu");
    if (menu) menu.hidden = true;
    state.addReqSearch = "";
  }

  function toggleAddReqPicker() {
    const menu = document.getElementById("re-req-select-menu");
    if (!menu) return;
    const nextOpen = menu.hidden;
    document.querySelectorAll("#release-edit-modal .select-menu").forEach((m) => {
      m.hidden = true;
    });
    if (!nextOpen) {
      closeAddReqPicker();
      return;
    }
    state.addReqSearch = "";
    const search = document.getElementById("release-add-req-search");
    if (search) search.value = "";
    renderAddReqPicker();
    menu.hidden = false;
    if (search) search.focus();
  }

  function toggleExtraReq(id) {
    const num = Number(id);
    const row = getReleaseById(state.editId);
    if (!row) return;
    const pinned = new Set([
      ...getBaseReleaseReqs(row).map((r) => r.id),
      ...(state.editIncludeGap ? getGapReleaseReqs(row).map((r) => r.id) : []),
    ]);
    if (pinned.has(num)) {
      state.editExcludedReqIds = state.editExcludedReqIds.includes(num)
        ? state.editExcludedReqIds.filter((x) => x !== num)
        : [...state.editExcludedReqIds, num];
    } else {
      state.editExtraReqIds = state.editExtraReqIds.includes(num)
        ? state.editExtraReqIds.filter((x) => x !== num)
        : [...state.editExtraReqIds, num];
    }
    renderEditReqList(row);
    renderAddReqPicker();
  }

  function openEdit(id, options = {}) {
    const row = getReleaseById(id);
    if (!row) return;
    state.editId = id;
    state.editExtraReqIds = Array.isArray(row.extraReqIds) ? row.extraReqIds.map(Number).filter(Boolean) : [];
    state.editExcludedReqIds = Array.isArray(row.excludedReqIds) ? row.excludedReqIds.map(Number).filter(Boolean) : [];
    state.editIncludeGap = !!row.includeGapReqs;
    const gapCheck = document.getElementById("re-req-gap");
    if (gapCheck) gapCheck.checked = state.editIncludeGap;
    const pendingStatus = options.pendingStatus || null;
    const isPlanning = pendingStatus === "计划中" && row.status === "不涉及";
    const status = pendingStatus || row.status || "不涉及";

    const modal = document.getElementById("release-edit-modal");
    modal.classList.toggle("is-planning", isPlanning);

    document.getElementById("release-edit-title").textContent = isPlanning ? "发布计划设置" : "编辑发布信息";
    const sub = document.getElementById("release-edit-sub");
    const shift = document.getElementById("release-edit-shift");
    sub.textContent = `${row.product || "—"} · ${row.version || "—"}`;
    sub.hidden = false;
    shift.hidden = !isPlanning;
    document.getElementById("release-edit-save").textContent = isPlanning ? "确认" : "保存";

    document.getElementById("re-product").value = row.product || "";
    document.getElementById("re-product-text").textContent = row.product || "—";
    document.getElementById("re-iteration").value = row.iteration || "";
    document.getElementById("re-iteration-text").textContent = row.iteration || "—";
    document.getElementById("re-version").value = row.version || "";
    document.getElementById("re-version-text").textContent = row.version || "—";
    document.getElementById("re-release-time").value = row.releaseTime || "";
    document.getElementById("re-release-time-text").textContent = row.releaseTime || "—";
    document.getElementById("re-apk").value = row.apkUrl || "";
    document.getElementById("re-goal").value = row.versionGoal || "";
    document.getElementById("re-note").value = row.releaseNote || "";
    setPlanSelect("channel", row.channel || "", "请选择渠道");
    setPlanSelect("shuttle", row.shuttle || "", "选择班车月份");
    setPlanSelect("status", isPlanning ? "计划中" : status, "不涉及");
    renderEditReqList(row);
    syncPlanningRequired(isPlanning ? "计划中" : status);
    openModal("release-edit-modal");
  }

  function saveEdit() {
    const row = getReleaseById(state.editId);
    if (!row) return;

    const status = document.getElementById("re-status").value;
    const versionGoal = document.getElementById("re-goal").value.trim();
    const note = document.getElementById("re-note").value.trim();
    const channel = formatChannels(document.getElementById("re-channel").value);
    const shuttle = document.getElementById("re-shuttle").value;

    if (status === "计划中") {
      if (!versionGoal) {
        showToast("计划中必须填写版本目标");
        document.getElementById("re-goal").focus();
        return;
      }
      if (!note) {
        showToast("计划中必须填写 Release Note");
        return;
      }
      if (!channel) {
        showToast("计划中必须选择渠道");
        return;
      }
    }

    let next = {
      ...row,
      status,
      versionGoal,
      releaseNote: note,
      shuttle,
      extraReqIds: state.editExtraReqIds.slice(),
      excludedReqIds: state.editExcludedReqIds.slice(),
      includeGapReqs: !!state.editIncludeGap,
      timeline: (row.timeline || []).map((t) => ({ ...t })),
    };
    next = typeof applyChannelSelection === "function" ? applyChannelSelection(next, channel) : { ...next, channel };

    if (status === "计划中" && (row.status === "不涉及" || !next.channelGrays || !next.channelGrays.length)) {
      next.grayPercent = 0;
      if (!next.timeline.length) {
        next.timeline = [{ date: todayISO(), percent: 0, note: "进入计划中", current: true }];
      }
    }

    if (status === "不涉及") {
      next.grayPercent = null;
      next.channelGrays = [];
      next.rolloutTime = "";
      next.channel = channel || "";
      next.timeline = [];
    }

    const rolling = typeof hasRollingChannelGray === "function" ? hasRollingChannelGray(next) : next.grayPercent > 0;
    if (status === "计划中" && !rolling) {
      next.status = "计划中";
    }

    if (rolling && status !== "不涉及") {
      next.status = "已发布";
    } else if (status === "已发布" && !rolling) {
      next.status = "计划中";
      next.grayPercent = next.grayPercent == null ? 0 : next.grayPercent;
      if (!next.timeline.length) {
        next.timeline = [{ date: todayISO(), percent: 0, note: "进入计划中", current: true }];
      }
    }

    upsertRelease(next);
    closeModal("release-edit-modal");
    state.editId = null;
    if (row.status === "不涉及" && next.status === "计划中") {
      showToast("发布状态已改为「计划中」");
    } else {
      showToast("发布信息已保存");
    }
    render();
    if (state.detailId === next.id) fillDetail(next);
  }

  function applyGrayPercent(id, percent, { date = todayISO(), note = "", silent = false, channel = "" } = {}) {
    const row = getReleaseById(id);
    if (!row || row.status === "不涉及") return null;
    const grays = typeof normalizeChannelGrays === "function" ? normalizeChannelGrays(row) : [];
    const ch = channel || (grays[0] && grays[0].channel) || parseChannels(row.channel)[0] || "GP";
    if (isFullGray(row, ch)) {
      if (!silent) showToast(`${ch} 已全量，不可再调整`);
      return null;
    }

    const value = clampChannelGray(ch, percent);
    const prev = grays.find((g) => g.channel === ch);
    if (prev && prev.value === value && row.rolloutTime === date) {
      return row;
    }

    const ratio = channelGrayRatio(ch, value);
    const timeline = (row.timeline || []).map((t) => ({ ...t, current: false }));
    let noteText = note;
    if (!noteText) {
      if (value <= 0) noteText = `${ch} 进入计划中`;
      else if (value >= channelGrayMax(ch)) noteText = `${ch} 全量`;
      else if (!timeline.some((t) => t.channel === ch && (t.value > 0 || t.percent > 0))) noteText = `${ch} 开始放量`;
      else noteText = `${ch} 当前灰度`;
    }
    timeline.push({ date, percent: ratio, value, channel: ch, note: noteText, current: true });

    const channelGrays = grays.map((g) => (g.channel === ch ? { ...g, value } : g));
    if (!channelGrays.some((g) => g.channel === ch)) channelGrays.push({ channel: ch, value });
    let next = attachGraySummary({
      ...row,
      channelGrays,
      rolloutTime: date,
      timeline,
    });
    next.status = hasRollingChannelGray(next) ? "已发布" : "计划中";

    upsertRelease(next);
    if (!silent) showToast(`${ch} 已更新为 ${formatChannelGray(ch, value)}`);
    render();
    if (state.detailId === next.id) fillDetail(getReleaseById(next.id));
    return next;
  }

  function openGray(id) {
    const row = getReleaseById(id);
    if (!row) return;
    if (row.status === "不涉及") {
      showToast("不涉及状态无需更新灰度");
      return;
    }
    if (isFullGray(row)) {
      showToast("已全量，不可再调整灰度");
      return;
    }
    state.grayId = id;
    document.getElementById("rg-percent").value = row.grayPercent != null ? row.grayPercent : 0;
    document.getElementById("rg-date").value = todayISO();
    document.getElementById("rg-note").value = "";
    openModal("release-gray-modal");
  }

  function saveGray() {
    const percent = Number(document.getElementById("rg-percent").value);
    const date = document.getElementById("rg-date").value;
    const note = document.getElementById("rg-note").value.trim();

    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      showToast("灰度百分比需在 0-100 之间");
      return;
    }
    if (!date) {
      showToast("请选择生效日期");
      return;
    }

    const id = state.grayId;
    applyGrayPercent(id, percent, { date, note });
    closeModal("release-gray-modal");
    state.grayId = null;
  }

  const grayPopoverState = {
    id: null,
    channel: "",
    hideTimer: null,
    commitTimer: null,
    open: false,
    binaryValue: 0,
  };

  function popoverInputValue() {
    const ch = grayPopoverState.channel || "GP";
    const kind = channelGrayKind(ch);
    if (kind === "binary") return grayPopoverState.binaryValue;
    const raw = Number(document.getElementById("rv-gray-number").value);
    if (kind === "volume") return clampChannelGray(ch, raw * 10000);
    return clampChannelGray(ch, raw);
  }

  function syncGrayPopoverInputs(value) {
    const ch = grayPopoverState.channel || "GP";
    const kind = channelGrayKind(ch);
    const slider = document.getElementById("rv-gray-slider");
    const number = document.getElementById("rv-gray-number");
    const display = document.getElementById("rv-gray-display");
    const unit = document.getElementById("rv-gray-unit");
    const label = document.getElementById("rv-gray-label");
    const binary = document.getElementById("rv-gray-binary");
    const valueWrap = document.querySelector("#rv-gray-popover .rv-gray-value-wrap");
    const pop = document.getElementById("rv-gray-popover");
    if (pop) {
      pop.classList.remove("is-gp", "is-ps", "is-pa");
      const key = String(ch || "").toLowerCase();
      if (key === "gp" || key === "ps" || key === "pa") pop.classList.add(`is-${key}`);
    }
    if (label) label.textContent = kind === "volume" ? `${ch} 放量` : `${ch} 灰度`;
    if (unit) unit.textContent = kind === "volume" ? "万" : "%";
    if (slider) slider.hidden = kind === "binary";
    if (binary) binary.hidden = kind !== "binary";
    if (valueWrap) valueWrap.hidden = kind === "binary";
    if (kind === "volume") {
      const wan = Math.round(clampChannelGray(ch, value) / 10000);
      if (slider) {
        slider.min = "0";
        slider.max = "50";
        slider.value = String(wan);
      }
      if (number) {
        number.min = "0";
        number.max = "50";
        number.value = String(wan);
      }
      if (display) display.textContent = formatChannelGray(ch, wan * 10000);
      return;
    }
    if (kind === "binary") {
      const on = clampChannelGray(ch, value) >= 100 ? 100 : 0;
      grayPopoverState.binaryValue = on;
      if (display) display.textContent = on >= 100 ? "100%" : "0%";
      if (binary) {
        binary.querySelectorAll("[data-binary]").forEach((btn) => {
          btn.classList.toggle("is-on", Number(btn.dataset.binary) === on);
        });
      }
      return;
    }
    const pct = clampChannelGray(ch, value);
    if (slider) {
      slider.min = "0";
      slider.max = "100";
      slider.value = String(pct);
    }
    if (number) {
      number.min = "0";
      number.max = "100";
      number.value = String(pct);
    }
    if (display) display.textContent = formatChannelGray(ch, pct);
  }

  function setGrayCellEditing(id, channel) {
    document.querySelectorAll(".rv-gray-cell.is-editing").forEach((el) => {
      el.classList.remove("is-editing");
    });
    if (!id) return;
    const cell = [...document.querySelectorAll(".rv-gray-cell")].find(
      (el) => el.dataset.grayId === id && (!channel || el.dataset.channel === channel)
    );
    if (cell) cell.classList.add("is-editing");
  }

  function positionGrayPopover(anchorEl) {
    const pop = document.getElementById("rv-gray-popover");
    const rect = anchorEl.getBoundingClientRect();
    const popW = 260;
    const margin = 8;
    let left = rect.left + rect.width / 2 - popW / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - popW - margin));
    let top = rect.bottom + 8;
    pop.hidden = false;
    pop.style.width = `${popW}px`;
    // measure after show
    const h = pop.offsetHeight || 140;
    if (top + h > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - h - 8);
      pop.classList.add("is-above");
    } else {
      pop.classList.remove("is-above");
    }
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }

  function showGrayPopover(id, anchorEl, channel) {
    const row = getReleaseById(id);
    const grays = typeof normalizeChannelGrays === "function" ? normalizeChannelGrays(row) : [];
    if (!row || row.status === "不涉及" || !grays.length) return;
    const ch = channel || grays[0].channel;
    if (isFullGray(row, ch)) {
      showToast(`${ch} 已全量，不可再调整`);
      return;
    }
    const current = grays.find((g) => g.channel === ch);
    clearTimeout(grayPopoverState.hideTimer);
    grayPopoverState.id = id;
    grayPopoverState.channel = ch;
    grayPopoverState.open = true;
    syncGrayPopoverInputs(current ? current.value : 0);
    setGrayCellEditing(id, ch);
    positionGrayPopover(anchorEl);
  }

  function hideGrayPopover(delay = 160) {
    clearTimeout(grayPopoverState.hideTimer);
    grayPopoverState.hideTimer = setTimeout(() => {
      const pop = document.getElementById("rv-gray-popover");
      pop.hidden = true;
      pop.classList.remove("is-gp", "is-ps", "is-pa");
      grayPopoverState.open = false;
      grayPopoverState.id = null;
      grayPopoverState.channel = "";
      setGrayCellEditing(null);
    }, delay);
  }

  function commitGrayFromPopover() {
    if (!grayPopoverState.id) return;
    const ch = grayPopoverState.channel || "GP";
    const value = popoverInputValue();
    if (!Number.isFinite(value)) {
      showToast("请输入有效灰度");
      return;
    }
    const id = grayPopoverState.id;
    applyGrayPercent(id, value, { date: todayISO(), channel: ch });
    hideGrayPopover(0);
  }

  function setupGrayPopover() {
    const body = document.getElementById("release-table-body");
    const pop = document.getElementById("rv-gray-popover");
    const slider = document.getElementById("rv-gray-slider");
    const number = document.getElementById("rv-gray-number");

    body.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-action="gray-edit"]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.id;
      const channel = btn.dataset.channel || "";
      const cell = btn.closest(".rv-gray-cell");
      if (!cell) return;
      if (grayPopoverState.open && grayPopoverState.id === id && grayPopoverState.channel === channel) {
        hideGrayPopover(0);
        return;
      }
      showGrayPopover(id, cell, channel);
    });

    document.addEventListener("click", (e) => {
      if (!grayPopoverState.open) return;
      if (e.target.closest("#rv-gray-popover")) return;
      if (e.target.closest('[data-action="gray-edit"]')) return;
      hideGrayPopover(0);
    });

    slider.addEventListener("input", () => {
      const ch = grayPopoverState.channel || "GP";
      const raw = channelGrayKind(ch) === "volume" ? Number(slider.value) * 10000 : Number(slider.value);
      syncGrayPopoverInputs(raw);
    });
    number.addEventListener("input", () => {
      const ch = grayPopoverState.channel || "GP";
      const raw = channelGrayKind(ch) === "volume" ? Number(number.value) * 10000 : Number(number.value);
      syncGrayPopoverInputs(raw);
    });
    document.getElementById("rv-gray-binary").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-binary]");
      if (!btn) return;
      syncGrayPopoverInputs(Number(btn.dataset.binary));
    });

    document.getElementById("rv-gray-confirm").addEventListener("click", (e) => {
      e.stopPropagation();
      commitGrayFromPopover();
    });

    window.addEventListener(
      "scroll",
      () => {
        if (!grayPopoverState.open || !grayPopoverState.id) return;
        const cell = [...document.querySelectorAll(".rv-gray-cell")].find(
          (el) =>
            el.dataset.grayId === grayPopoverState.id &&
            (!grayPopoverState.channel || el.dataset.channel === grayPopoverState.channel)
        );
        if (cell) positionGrayPopover(cell);
        else hideGrayPopover(0);
      },
      true
    );
  }

  function closeAllStatusDropdowns() {
    document.querySelectorAll(".rv-status-dropdown").forEach((d) => {
      d.hidden = true;
    });
    document.querySelectorAll(".rv-status-trigger").forEach((b) => {
      b.setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll(".rv-status-select.is-open").forEach((el) => {
      el.classList.remove("is-open");
    });
  }

  function applyStatusChange(id, status) {
    const row = getReleaseById(id);
    if (!row) {
      closeAllStatusDropdowns();
      return;
    }
    // 仅允许：不涉及 → 计划中
    if (row.status !== "不涉及" || status !== "计划中") {
      closeAllStatusDropdowns();
      showToast("仅支持将「不涉及」改为「计划中」");
      return;
    }

    closeAllStatusDropdowns();

    const hasGoal = Boolean((row.versionGoal || "").trim());
    const hasNote = Boolean((row.releaseNote || "").trim());
    const hasChannel = Boolean(row.channel);
    // 必填信息齐全才真正改状态；否则打开编辑，取消则保持「不涉及」
    if (hasGoal && hasNote && hasChannel) {
      const next = attachGraySummary({
        ...row,
        status: "计划中",
        grayPercent: 0,
        timeline: [{ date: todayISO(), percent: 0, note: "进入计划中", current: true }],
      });
      upsertRelease(next);
      render();
      if (state.detailId === next.id) fillDetail(getReleaseById(next.id));
      showToast("发布状态已改为「计划中」");
      return;
    }

    openEdit(id, { pendingStatus: "计划中" });
  }

  function setupActions() {
    document.getElementById("release-table-body").addEventListener("click", (e) => {
      const statusPublish = e.target.closest('[data-action="status-publish"]');
      if (statusPublish) {
        e.preventDefault();
        e.stopPropagation();
        openEdit(statusPublish.dataset.id, { pendingStatus: "计划中" });
        return;
      }

      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === "view") openDetail(id);
      if (btn.dataset.action === "edit") openEdit(id);
      if (btn.dataset.action === "remind") {
        const row = getReleaseById(id);
        showToast("已发送填写数据信息提醒");
      }
    });

    const journeyBody = document.getElementById("release-journey-body");
    if (journeyBody) {
      journeyBody.addEventListener("click", (e) => {
        if (
          e.target.closest(".rj-inline-editor") ||
          e.target.closest("[data-rj-req-search]") ||
          e.target.closest("[data-rj-gray-drag]")
        ) {
          e.stopPropagation();
          return;
        }
        if (e.target.closest(".rj-req-select")) {
          e.stopPropagation();
        }
        const actionBtn = e.target.closest("[data-action]");
        if (actionBtn) {
          const id = actionBtn.dataset.id;
          const action = actionBtn.dataset.action;
          if (action === "status-publish") {
            e.preventDefault();
            e.stopPropagation();
            openEdit(id, { pendingStatus: "计划中" });
            return;
          }
          if (action === "edit") {
            e.preventDefault();
            e.stopPropagation();
            openEdit(id);
            return;
          }
          if (action === "apk") {
            e.stopPropagation();
            return;
          }
          if (action === "rj-remind") {
            e.preventDefault();
            e.stopPropagation();
            showToast("已发送填写数据信息提醒");
            return;
          }
          if (action === "gray-edit") {
            e.preventDefault();
            e.stopPropagation();
            const channel = actionBtn.dataset.channel || "";
            const cell = actionBtn.closest(".rv-gray-cell");
            if (!cell) return;
            if (grayPopoverState.open && grayPopoverState.id === id && grayPopoverState.channel === channel) {
              hideGrayPopover(0);
              return;
            }
            showGrayPopover(id, cell, channel);
            return;
          }
          if (action === "rj-req-add") {
            e.preventDefault();
            e.stopPropagation();
            toggleJourneyAddReqPicker(id);
            return;
          }
          if (action === "rj-req-toggle" || action === "rj-req-del") {
            e.preventDefault();
            e.stopPropagation();
            const reqId = actionBtn.dataset.reqId;
            if (action === "rj-req-del") closeJourneyAddReqPicker();
            toggleJourneyReq(id, reqId);
            if (action === "rj-req-del") showToast("已移除需求");
            return;
          }
          if (action === "rj-edit-goal" || action === "rj-edit-note" || action === "rj-edit-data") {
            e.preventDefault();
            e.stopPropagation();
            const field = action.replace("rj-edit-", "");
            beginJourneyFieldEdit(id, field);
            return;
          }
        }

        if (!e.target.closest(".rj-req-select")) {
          closeJourneyAddReqPicker();
        }

        const card = e.target.closest("[data-journey-id]");
        if (!card) return;
        const id = card.dataset.journeyId;
        if (!id) return;
        if (state.journeyExpandedId === id) return;
        closeJourneyAddReqPicker();
        state.journeyExpandedId = id;
        renderJourney();
      });

      journeyBody.addEventListener("input", (e) => {
        const search = e.target.closest("[data-rj-req-search]");
        if (!search) return;
        const wrap = search.closest(".rj-req-select");
        const releaseId = wrap && wrap.dataset.id;
        if (!releaseId) return;
        state.journeyAddReqSearch = search.value || "";
        renderJourneyAddReqPicker(releaseId);
      });

      journeyBody.addEventListener("pointerdown", (e) => {
        const track = e.target.closest("[data-rj-gray-drag]");
        if (!track) return;
        e.preventDefault();
        e.stopPropagation();
        if (track.getAttribute("aria-disabled") === "true") return;
        if (e.button != null && e.button !== 0) return;
        journeyGrayDragState.active = true;
        journeyGrayDragState.track = track;
        journeyGrayDragState.pointerId = e.pointerId;
        track.classList.add("is-dragging");
        try {
          track.setPointerCapture(e.pointerId);
        } catch (_) {
          /* ignore */
        }
        syncJourneyGrayDragPreview(track, ratioFromJourneyGrayPointer(track, e.clientX));
      });

      journeyBody.addEventListener("pointermove", (e) => {
        if (!journeyGrayDragState.active || !journeyGrayDragState.track) return;
        if (journeyGrayDragState.pointerId !== e.pointerId) return;
        e.preventDefault();
        e.stopPropagation();
        syncJourneyGrayDragPreview(
          journeyGrayDragState.track,
          ratioFromJourneyGrayPointer(journeyGrayDragState.track, e.clientX)
        );
      });

      journeyBody.addEventListener("pointerup", (e) => {
        if (!journeyGrayDragState.active) return;
        if (journeyGrayDragState.pointerId !== e.pointerId) return;
        endJourneyGrayDrag(e);
      });

      journeyBody.addEventListener("pointercancel", (e) => {
        if (!journeyGrayDragState.active) return;
        if (journeyGrayDragState.pointerId !== e.pointerId) return;
        endJourneyGrayDrag(e);
      });

      journeyBody.addEventListener("keydown", (e) => {
        const track = e.target.closest("[data-rj-gray-drag]");
        if (track && track.getAttribute("aria-disabled") !== "true") {
          const step = track.dataset.kind === "binary" ? 100 : e.shiftKey ? 10 : 1;
          let ratio = Number(track.dataset.ratio) || 0;
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            e.stopPropagation();
            syncJourneyGrayDragPreview(track, Math.max(0, ratio - step));
            commitJourneyGrayDrag(track);
            return;
          }
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            e.stopPropagation();
            syncJourneyGrayDragPreview(track, Math.min(100, ratio + step));
            commitJourneyGrayDrag(track);
            return;
          }
          if (e.key === "Home") {
            e.preventDefault();
            e.stopPropagation();
            syncJourneyGrayDragPreview(track, 0);
            commitJourneyGrayDrag(track);
            return;
          }
          if (e.key === "End") {
            e.preventDefault();
            e.stopPropagation();
            syncJourneyGrayDragPreview(track, 100);
            commitJourneyGrayDrag(track);
            return;
          }
        }
        if (e.target.closest(".rj-inline-editor") || e.target.closest("[data-rj-req-search]")) {
          e.stopPropagation();
          return;
        }
        if (e.key !== "Enter" && e.key !== " ") return;
        const card = e.target.closest(".rj-card.is-collapsed[data-journey-id]");
        if (!card) return;
        e.preventDefault();
        closeJourneyAddReqPicker();
        state.journeyExpandedId = card.dataset.journeyId;
        renderJourney();
      });
    }

    document.addEventListener("click", (e) => {
      if (!e.target.closest("[data-status-wrap]")) closeAllStatusDropdowns();
    });

    document.getElementById("release-detail-close").addEventListener("click", hideDetailDrawer);
    document.getElementById("release-detail-modal").addEventListener("click", (e) => {
      if (e.target.id === "release-detail-modal") hideDetailDrawer();
    });

    document.getElementById("rd-save-btn").addEventListener("click", () => {
      saveDetail();
    });
    document.getElementById("rd-edit-goal-btn").addEventListener("click", (e) => {
      e.preventDefault();
      beginGoalEdit();
    });
    document.getElementById("rd-edit-note-btn").addEventListener("click", (e) => {
      e.preventDefault();
      beginNoteEdit();
    });
    document.getElementById("rd-edit-data-btn").addEventListener("click", (e) => {
      e.preventDefault();
      beginDataEdit();
    });

    const detailReqSelect = document.getElementById("rd-req-select");
    detailReqSelect.addEventListener("click", (e) => e.stopPropagation());
    document.getElementById("rd-req-add").addEventListener("click", toggleDetailAddReqPicker);
    document.getElementById("rd-add-req-search").addEventListener("input", (e) => {
      state.detailAddReqSearch = e.target.value || "";
      renderDetailAddReqPicker();
    });
    document.getElementById("rd-add-req-list").addEventListener("click", (e) => {
      const item = e.target.closest("[data-req-id]");
      if (!item) return;
      toggleDetailExtraReq(item.dataset.reqId);
    });
    document.getElementById("rd-reqs").addEventListener("click", (e) => {
      const btn = e.target.closest(".release-plan-req-del");
      if (!btn) return;
      e.preventDefault();
      toggleDetailExtraReq(btn.dataset.reqId);
    });

    document.getElementById("re-status").addEventListener("change", (e) => {
      syncPlanningRequired(e.target.value);
    });

    document.getElementById("release-edit-close").addEventListener("click", () => {
      closeAddReqPicker();
      closeModal("release-edit-modal");
      state.editId = null;
    });
    document.getElementById("release-edit-cancel").addEventListener("click", () => {
      closeAddReqPicker();
      closeModal("release-edit-modal");
      state.editId = null;
    });
    document.getElementById("release-edit-save").addEventListener("click", saveEdit);
    document.getElementById("release-edit-modal").addEventListener("click", (e) => {
      if (e.target.id === "release-edit-modal") {
        closeAddReqPicker();
        closeModal("release-edit-modal");
        state.editId = null;
      }
    });

    document.getElementById("re-req-gap").addEventListener("change", (e) => {
      const row = getReleaseById(state.editId);
      if (!row) return;
      state.editIncludeGap = e.target.checked;
      renderEditReqList(row);
    });

    const reqSelect = document.getElementById("re-req-select");
    reqSelect.addEventListener("click", (e) => e.stopPropagation());
    document.getElementById("re-req-add").addEventListener("click", toggleAddReqPicker);
    document.getElementById("release-add-req-search").addEventListener("input", (e) => {
      state.addReqSearch = e.target.value || "";
      renderAddReqPicker();
    });
    document.getElementById("release-add-req-list").addEventListener("click", (e) => {
      const item = e.target.closest("[data-req-id]");
      if (!item) return;
      toggleExtraReq(item.dataset.reqId);
    });
    document.getElementById("re-req-list").addEventListener("click", (e) => {
      const btn = e.target.closest(".release-plan-req-del");
      if (!btn) return;
      e.preventDefault();
      toggleExtraReq(btn.dataset.reqId);
    });

    document.getElementById("release-gray-close").addEventListener("click", () => closeModal("release-gray-modal"));
    document.getElementById("release-gray-cancel").addEventListener("click", () => closeModal("release-gray-modal"));
    document.getElementById("release-gray-save").addEventListener("click", saveGray);
    document.getElementById("release-gray-modal").addEventListener("click", (e) => {
      if (e.target.id === "release-gray-modal") closeModal("release-gray-modal");
    });
  }

  function setupSearch() {
    const input = document.getElementById("release-search-input");
    let timer = null;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.search = input.value;
        state.page = 1;
        render();
      }, 180);
    });
  }

  function setupPagination() {
    document.getElementById("release-pagination").addEventListener("click", (e) => {
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

  function openCreateModal() {
    const modal = document.getElementById("release-create-modal");
    document.getElementById("release-create-form").reset();
    setPlanSelect("product", "", "请选择产品", modal);
    openModal("release-create-modal");
    document.getElementById("rv-new-product-btn").focus();
  }

  function saveCreate() {
    const product = document.getElementById("rv-new-product").value;
    const version = document.getElementById("rv-new-version").value.trim();
    const apkUrl = document.getElementById("rv-new-apk").value.trim();
    if (!product) {
      showToast("请选择所属产品");
      document.getElementById("rv-new-product-btn").focus();
      return;
    }
    if (!version) {
      showToast("请填写版本号");
      document.getElementById("rv-new-version").focus();
      return;
    }
    if (!apkUrl) {
      showToast("请填写 APK 链接");
      document.getElementById("rv-new-apk").focus();
      return;
    }
    if (typeof addManualRelease !== "function") return;
    const result = addManualRelease({ product, version, apkUrl });
    if (!result.ok) {
      showToast(result.error || "新增失败");
      return;
    }
    closeModal("release-create-modal");
    showToast("已新增版本");
    state.page = 1;
    if (result.row && result.row.id) {
      state.journeyExpandedId = result.row.id;
    }
    render();
  }

  function setupCreateModal() {
    document.getElementById("release-add-btn").addEventListener("click", openCreateModal);
    document.getElementById("release-create-close").addEventListener("click", () => closeModal("release-create-modal"));
    document.getElementById("release-create-cancel").addEventListener("click", () => closeModal("release-create-modal"));
    document.getElementById("release-create-save").addEventListener("click", saveCreate);
    document.getElementById("release-create-modal").addEventListener("click", (e) => {
      if (e.target.id === "release-create-modal") closeModal("release-create-modal");
    });
    document.getElementById("release-create-form").addEventListener("submit", (e) => {
      e.preventDefault();
      saveCreate();
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

  function setupViewToggle() {
    const toggle = document.getElementById("release-view-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-view]");
      if (!btn) return;
      const next = btn.dataset.view === "journey" ? "journey" : "list";
      if (state.view === next) return;
      state.view = next;
      if (next === "journey") {
        state.journeyExpandedId = null;
        closeJourneyAddReqPicker();
      } else {
        state.page = 1;
        closeJourneyAddReqPicker();
      }
      syncViewUrl(next);
      render();
    });
    window.addEventListener("popstate", () => {
      const next = getViewFromUrl();
      if (next === state.view) return;
      state.view = next;
      if (next === "journey") {
        state.journeyExpandedId = null;
      }
      render();
    });
  }

  function init() {
    setupSidebar();
    setupViewToggle();
    setupDropdown(
      "release-product-btn",
      "release-product-dropdown",
      "release-product-value",
      typeof getReleaseProducts === "function" ? getReleaseProducts() : ["全部"],
      "product"
    );
    setupDropdown("release-status-btn", "release-status-dropdown", "release-status-value", RELEASE_STATUSES, "status");
    setupDropdown("release-month-btn", "release-month-dropdown", "release-month-value", getReleaseMonthOptions(), "month");
    setupSearch();
    setupPagination();
    setupSort();
    setupActions();
    setupGrayPopover();
    setupPlanSelects();
    setupPlanSelects(document.getElementById("release-create-modal"));
    setupCreateModal();
    document.addEventListener("click", () => {
      document.querySelectorAll(".dropdown").forEach((d) => {
        d.hidden = true;
      });
      document.querySelectorAll("#release-edit-modal .select-menu, #release-detail-modal .select-menu, #release-create-modal .select-menu").forEach((m) => {
        m.hidden = true;
      });
      closeAddReqPicker();
      closeDetailAddReqPicker();
    });
    syncViewUrl(state.view, { replace: true });
    render();
  }

  init();
})();
