(() => {
  const state = {
    product: "全部",
    status: "全部",
    search: "",
    page: 1,
    pageSize: 10,
    sortKey: null,
    sortAsc: true,
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

  function isFullGray(row) {
    return row && row.grayPercent != null && Number(row.grayPercent) >= 100;
  }

  function renderGrayCell(row) {
    if (row.status === "不涉及" || row.grayPercent == null) {
      return `<span class="rv-empty">—</span>`;
    }
    const pct = Math.max(0, Math.min(100, Number(row.grayPercent) || 0));
    const label = pct >= 100 ? "全量" : `${pct}%`;
    const editBtn =
      pct >= 100
        ? ""
        : `<button type="button" class="rv-gray-edit-btn" data-action="gray-edit" data-id="${escapeHtml(row.id)}" title="调整灰度" aria-label="调整灰度">
          <img src="assets/icons/pencil.svg" alt="" />
        </button>`;
    return `
      <div class="rv-gray-cell${pct >= 100 ? " is-full-locked" : ""}" data-gray-id="${escapeHtml(row.id)}">
        <div class="rv-progress ${grayTone(pct)}">
          <div class="rv-progress-track">
            <div class="rv-progress-fill" style="width:${pct}%"></div>
          </div>
          <span class="rv-progress-label">${escapeHtml(label)}</span>
        </div>
        ${editBtn}
      </div>`;
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
    if (key === "grayPercent") return row.grayPercent == null ? null : Number(row.grayPercent);
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
          <button type="button" class="fb-link-btn" data-action="view" data-id="${escapeHtml(r.id)}">查看</button>
        </div>
      </div>`
      )
      .join("");
  }

  function render() {
    reloadRows();
    const rows = getFilteredRows();
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
        setPlanSelect(key, item.dataset.value, meta.placeholder);
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
    return ["release-detail-modal", "release-edit-modal", "release-gray-modal"].some(
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

  function buildTimelineNodes(row) {
    const nodes = (row.timeline || []).map((t) => ({ ...t }));
    const hasFull = nodes.some((n) => Number(n.percent) >= 100);
    if (!hasFull && row.status !== "不涉及") {
      nodes.push({ date: "", percent: 100, note: "全量", pending: true });
    }
    if (!nodes.length) {
      return `<div class="release-timeline-empty">暂无放量记录。可将状态改为「计划中」后开始跟踪。</div>`;
    }

    function nPending(n) {
      return !!n.pending;
    }

    const currentIdx = (() => {
      let idx = nodes.findIndex((n) => n.current);
      if (idx < 0) {
        for (let i = nodes.length - 1; i >= 0; i--) {
          if (!nPending(nodes[i])) {
            idx = i;
            break;
          }
        }
      }
      return idx;
    })();

    return `
      <div class="release-timeline-list">
        ${nodes
          .map((n, i) => {
            const isCurrent = i === currentIdx && !n.pending;
            const isPending = !!n.pending;
            const cls = ["release-timeline-node"];
            if (isCurrent) cls.push("is-current");
            if (isPending) cls.push("is-pending");
            const dateText = n.date || "—";
            const pctText = `${n.percent}%`;
            return `
            <div class="${cls.join(" ")}">
              <div class="release-timeline-date">${escapeHtml(dateText)}</div>
              <div class="release-timeline-indicator" aria-hidden="true"></div>
              <div class="release-timeline-detail">
                <strong>${escapeHtml(pctText)}</strong>
                <span>${escapeHtml(n.note || "")}</span>
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
    if (row.status !== "不涉及" && row.grayPercent != null) {
      const label = row.grayPercent >= 100 ? "全量" : `灰度 ${row.grayPercent}%`;
      tags.push(`<span class="rv-status-badge rv-status-planning">${escapeHtml(label)}</span>`);
    }
    document.getElementById("rd-tags").innerHTML = tags.join("");
    setDetailChannels(row.channel);

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

    document.getElementById("rd-timeline").innerHTML = buildTimelineNodes(row);
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
    if (noteEl && noteEl.classList.contains("is-editing")) {
      saveNoteInline();
    }
    const latest = getReleaseById(state.detailId) || row;
    upsertRelease({
      ...latest,
      channel,
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
    const note = document.getElementById("re-note").value.trim();
    const channel = formatChannels(document.getElementById("re-channel").value);
    const shuttle = document.getElementById("re-shuttle").value;

    if (status === "计划中") {
      if (!note) {
        showToast("计划中必须填写 Release Note");
        return;
      }
      if (!channel) {
        showToast("计划中必须选择渠道");
        return;
      }
    }

    const next = {
      ...row,
      status,
      releaseNote: note,
      channel,
      shuttle,
      extraReqIds: state.editExtraReqIds.slice(),
      excludedReqIds: state.editExcludedReqIds.slice(),
      includeGapReqs: !!state.editIncludeGap,
      timeline: (row.timeline || []).map((t) => ({ ...t })),
    };

    if (status === "计划中" && (next.grayPercent == null || row.status === "不涉及")) {
      next.grayPercent = 0;
      if (!next.timeline.length) {
        next.timeline = [{ date: todayISO(), percent: 0, note: "进入计划中", current: true }];
      }
    }

    if (status === "不涉及") {
      next.grayPercent = null;
      next.rolloutTime = "";
      next.channel = channel || "";
      next.timeline = [];
    }

    // 仅当产品明确改为计划中/已发布，或灰度推进时才视为要发布
    if (status === "计划中" && (!next.grayPercent || next.grayPercent <= 0)) {
      next.status = "计划中";
      next.grayPercent = 0;
    }

    if (next.grayPercent != null && next.grayPercent > 0 && status !== "不涉及") {
      next.status = "已发布";
    } else if (status === "已发布" && (next.grayPercent == null || next.grayPercent <= 0)) {
      // 不允许无灰度直接标已发布，退回计划中
      next.status = "计划中";
      next.grayPercent = 0;
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

  function applyGrayPercent(id, percent, { date = todayISO(), note = "", silent = false } = {}) {
    const row = getReleaseById(id);
    if (!row || row.status === "不涉及") return null;
    if (isFullGray(row)) {
      if (!silent) showToast("已全量，不可再调整灰度");
      return null;
    }

    const pct = Math.max(0, Math.min(100, Number(percent)));
    if (!Number.isFinite(pct)) return null;

    const prev = row.grayPercent != null ? Number(row.grayPercent) : null;
    if (prev === pct && row.rolloutTime === date) {
      return row;
    }

    const timeline = (row.timeline || []).map((t) => ({ ...t, current: false }));
    let noteText = note;
    if (!noteText) {
      if (pct <= 0) noteText = "进入计划中";
      else if (pct >= 100) noteText = "全量";
      else if (!timeline.some((t) => t.percent > 0)) noteText = "开始放量";
      else noteText = "当前灰度";
    }
    timeline.push({ date, percent: pct, note: noteText, current: true });

    const next = {
      ...row,
      grayPercent: pct,
      rolloutTime: date,
      timeline,
      status: pct > 0 ? "已发布" : "计划中",
    };

    upsertRelease(next);
    if (!silent) showToast(`灰度已更新为 ${pct >= 100 ? "全量" : pct + "%"}`);
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
    hideTimer: null,
    commitTimer: null,
    open: false,
  };

  function syncGrayPopoverInputs(percent) {
    const pct = Math.max(0, Math.min(100, Number(percent) || 0));
    document.getElementById("rv-gray-slider").value = String(pct);
    document.getElementById("rv-gray-number").value = String(pct);
    const display = document.getElementById("rv-gray-display");
    if (display) display.textContent = `${pct}%`;
  }

  function setGrayCellEditing(id) {
    document.querySelectorAll(".rv-gray-cell.is-editing").forEach((el) => {
      el.classList.remove("is-editing");
    });
    if (!id) return;
    const cell = document.querySelector(`.rv-gray-cell[data-gray-id="${CSS.escape(id)}"]`);
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

  function showGrayPopover(id, anchorEl) {
    const row = getReleaseById(id);
    if (!row || row.status === "不涉及" || row.grayPercent == null) return;
    if (isFullGray(row)) {
      showToast("已全量，不可再调整灰度");
      return;
    }
    clearTimeout(grayPopoverState.hideTimer);
    grayPopoverState.id = id;
    grayPopoverState.open = true;
    syncGrayPopoverInputs(row.grayPercent);
    setGrayCellEditing(id);
    positionGrayPopover(anchorEl);
  }

  function hideGrayPopover(delay = 160) {
    clearTimeout(grayPopoverState.hideTimer);
    grayPopoverState.hideTimer = setTimeout(() => {
      const pop = document.getElementById("rv-gray-popover");
      pop.hidden = true;
      grayPopoverState.open = false;
      grayPopoverState.id = null;
      setGrayCellEditing(null);
    }, delay);
  }

  function commitGrayFromPopover() {
    if (!grayPopoverState.id) return;
    const percent = Number(document.getElementById("rv-gray-number").value);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      showToast("灰度百分比需在 0-100 之间");
      return;
    }
    const id = grayPopoverState.id;
    applyGrayPercent(id, percent, { date: todayISO() });
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
      const cell = btn.closest(".rv-gray-cell");
      if (!cell) return;
      if (grayPopoverState.open && grayPopoverState.id === id) {
        hideGrayPopover(0);
        return;
      }
      showGrayPopover(id, cell);
    });

    document.addEventListener("click", (e) => {
      if (!grayPopoverState.open) return;
      if (e.target.closest("#rv-gray-popover")) return;
      if (e.target.closest('[data-action="gray-edit"]')) return;
      hideGrayPopover(0);
    });

    slider.addEventListener("input", () => {
      syncGrayPopoverInputs(slider.value);
    });
    number.addEventListener("input", () => {
      syncGrayPopoverInputs(number.value);
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
          (el) => el.dataset.grayId === grayPopoverState.id
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

    const hasNote = Boolean((row.releaseNote || "").trim());
    const hasChannel = Boolean(row.channel);
    // 必填信息齐全才真正改状态；否则打开编辑，取消则保持「不涉及」
    if (hasNote && hasChannel) {
      const next = {
        ...row,
        status: "计划中",
        grayPercent: 0,
        timeline: [{ date: todayISO(), percent: 0, note: "进入计划中", current: true }],
      };
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
    });

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
    document.getElementById("rd-edit-note-btn").addEventListener("click", (e) => {
      e.preventDefault();
      beginNoteEdit();
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
    setupDropdown(
      "release-product-btn",
      "release-product-dropdown",
      "release-product-value",
      typeof getReleaseProducts === "function" ? getReleaseProducts() : ["全部"],
      "product"
    );
    setupDropdown("release-status-btn", "release-status-dropdown", "release-status-value", RELEASE_STATUSES, "status");
    setupSearch();
    setupPagination();
    setupSort();
    setupActions();
    setupGrayPopover();
    setupPlanSelects();
    document.addEventListener("click", () => {
      document.querySelectorAll(".dropdown").forEach((d) => {
        d.hidden = true;
      });
      document.querySelectorAll("#release-edit-modal .select-menu, #release-detail-modal .select-menu").forEach((m) => {
        m.hidden = true;
      });
      closeAddReqPicker();
      closeDetailAddReqPicker();
    });
    render();
  }

  init();
})();
