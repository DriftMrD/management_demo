function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    product: params.get("product") || "",
    name: params.get("name") || "",
    drawer: params.get("drawer") || "",
  };
}

const DRAWER_STORAGE_KEY = "iter-detail-drawer-open";

function isDrawerOpenFromQuery() {
  const { drawer } = getQueryParams();
  return String(drawer).toLowerCase() === "open" || drawer === "1";
}

function setDrawerOpenStored(open) {
  try {
    if (open) sessionStorage.setItem(DRAWER_STORAGE_KEY, "1");
    else sessionStorage.removeItem(DRAWER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function syncDrawerQuery(open) {
  const url = new URL(window.location.href);
  if (open) url.searchParams.set("drawer", "open");
  else url.searchParams.delete("drawer");
  window.history.replaceState(null, "", url);
}

function isDrawerCurrentlyOpen() {
  const page = document.querySelector(".iteration-detail-page");
  return !!(page && !page.classList.contains("is-drawer-collapsed"));
}

function statusBadgeClass(status) {
  if (status === "已完成") return "is-done";
  if (status === "进行中") return "is-running";
  if (status === "已超期") return "is-overdue";
  if (status === "不涉及" || status === "未排期") return "is-na";
  return "is-pending";
}

function formatMd(iso) {
  if (!iso) return "--";
  const m = String(iso).match(/^\d{4}-(\d{2})-(\d{2})/);
  return m ? `${m[1]}/${m[2]}` : iso;
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

function getParentIr(row) {
  if (!row || !row.parentId) return null;
  if (typeof getParentReq === "function") {
    let cur = getParentReq(row);
    while (cur) {
      if (isIR(cur)) return cur;
      cur = getParentReq(cur);
    }
    return null;
  }
  return REQUIREMENTS.find((r) => r.id === row.parentId) || null;
}

function getPrdAttachment(row) {
  if (typeof resolvePrdDocsForDisplay === "function") {
    const docs = resolvePrdDocsForDisplay(row);
    if (docs.attachments && docs.attachments.length) return docs.attachments[0];
    if (docs.aiPrdFiles && docs.aiPrdFiles.length) return docs.aiPrdFiles[0];
    return null;
  }
  if (row.attachments && row.attachments.length) return row.attachments[0];
  const parent = getParentIr(row);
  if (parent && parent.attachments && parent.attachments.length) return parent.attachments[0];
  return null;
}

function linkOrDash(url, { underline = false, mutedEmpty = true } = {}) {
  const val = url && String(url).trim();
  if (!val) {
    return `<span class="iter-detail-cell-muted${mutedEmpty ? "" : ""}">-</span>`;
  }
  const cls = underline ? "iter-detail-cell-link is-underline" : "iter-detail-cell-link";
  return `<a class="${cls}" href="${escapeHtml(val)}" target="_blank" rel="noopener">${escapeHtml(val)}</a>`;
}

function renderValueCell(isValue) {
  return `<span class="${isValue ? "value-yes" : "value-no"}">${isValue ? "是" : "否"}</span>`;
}

function renderPrdCell(row) {
  if (row.needPrd === false) {
    return `<span class="iter-detail-cell-muted">不涉及</span>`;
  }
  const docs =
    typeof resolvePrdDocsForDisplay === "function"
      ? resolvePrdDocsForDisplay(row)
      : { source: row, prdUrl: row.prdUrl || "", aiPrdFiles: row.aiPrdFiles || [], attachments: row.attachments || [] };
  const file =
    (docs.attachments && docs.attachments[0]) ||
    (docs.aiPrdFiles && docs.aiPrdFiles[0]) ||
    null;
  const href = docs.prdUrl && String(docs.prdUrl).trim() ? docs.prdUrl : "#";
  if (file && file.name) {
    return `
      <a class="iter-detail-file-chip" href="${escapeHtml(href)}" ${href === "#" ? "" : 'target="_blank" rel="noopener"'}>
        <span class="iter-detail-file-name">${escapeHtml(file.name)}</span>
        <img src="assets/icons/download.svg" alt="" />
      </a>`;
  }
  if (docs.prdUrl && String(docs.prdUrl).trim()) {
    return linkOrDash(docs.prdUrl, { underline: true });
  }
  return `<span class="iter-detail-cell-muted">-</span>`;
}

function renderOpsCell(row) {
  return `
    <div class="iter-detail-ops">
      <button type="button" class="iter-detail-ops-btn" data-action="delete-req" data-id="${row.id}" aria-label="删除">
        <img src="assets/icons/trash.svg" alt="" />
      </button>
      <button type="button" class="iter-detail-ops-btn" data-action="transfer-req" data-id="${row.id}" aria-label="转移">
        <img src="assets/icons/transfer.svg" alt="" />
      </button>
      <button type="button" class="iter-detail-ops-btn" data-action="remind-req" data-id="${row.id}" aria-label="提醒">
        <img src="assets/icons/remind.svg" alt="" />
      </button>
    </div>`;
}

function renderReqRow(row, striped) {
  const code =
    row.reqCode ||
    (typeof isAR === "function" && isAR(row)
      ? makeArCode(row.id, row.requestDate)
      : typeof isSR === "function" && isSR(row)
        ? makeSrCode(row.id, row.requestDate)
        : makeReqCode(row.id, row.requestDate));
  const aiUrl = (row.aiTrackUrl && String(row.aiTrackUrl).trim()) || (row.aiDemoUrl && String(row.aiDemoUrl).trim()) || "";
  const design =
    typeof resolveUxUiForDisplay === "function"
      ? resolveUxUiForDisplay(row)
      : {
          needUx: row.needUx !== false,
          needUi: row.needUi !== false,
          uxUrl: row.uxUrl || "",
          uiUrl: row.uiUrl || "",
        };
  const uxUrl = design.needUx === false ? "" : design.uxUrl || "";
  const uiUrl = design.needUi === false ? "" : design.uiUrl || "";
  const uxEmpty = design.needUx === false || !uxUrl;
  const uiEmpty = design.needUi === false || !uiUrl;

  return `
    <tr class="${striped ? "is-striped" : ""}">
      <td class="col-name" title="${escapeHtml(row.title)}">${escapeHtml(row.title)}</td>
      <td class="col-code"><span class="iter-detail-cell-link">${escapeHtml(code)}</span></td>
      <td class="col-value">${renderValueCell(!!row.isValue)}</td>
      <td class="col-type"><span class="iter-detail-type-badge ${landingTypeClass(row.type)}">${escapeHtml(landingTypeLabel(row.type))}</span></td>
      <td class="col-shelf"><span class="iter-detail-cell-muted">-</span></td>
      <td class="col-prd">${renderPrdCell(row)}</td>
      <td class="col-ai">${aiUrl ? linkOrDash(aiUrl, { underline: true }) : '<span class="iter-detail-cell-muted">-</span>'}</td>
      <td class="col-ux">${uxEmpty ? '<span class="iter-detail-cell-muted">-</span>' : linkOrDash(uxUrl)}</td>
      <td class="col-ui">${uiEmpty ? '<span class="iter-detail-cell-muted">-</span>' : linkOrDash(uiUrl)}</td>
      <td class="col-ops">${renderOpsCell(row)}</td>
    </tr>`;
}

const PHASE_UI = [
  { key: "prd", title: "PRD 阶段", accent: "prd", start: "prdStart", end: "prdEnd" },
  { key: "ux", title: "UX 阶段", accent: "ux", start: "uxStart", end: "uxEnd" },
  { key: "ui", title: "UI 阶段", accent: "ui", start: "uiStart", end: "uiEnd" },
  { key: "dev", title: "开发阶段", accent: "dev", start: "devStart", end: "devEnd" },
  { key: "test", title: "测试验收", accent: "test", start: "testStart", end: "testEnd" },
];

function getTimelineRange(dates) {
  if (!dates) return null;
  const starts = PHASE_UI.map((p) => dates[p.start]).filter(Boolean);
  const ends = PHASE_UI.map((p) => dates[p.end]).filter(Boolean);
  if (!starts.length || !ends.length) return null;
  const min = starts.slice().sort()[0];
  const max = ends.slice().sort().reverse()[0];
  const dayCount = Math.max(1, daysBetween(min, max) + 1);
  return { min, max, dayCount };
}

function buildPhaseTimelineDays(range) {
  const days = [];
  for (let i = 0; i < range.dayCount; i++) {
    const iso = addDaysISO(range.min, i);
    const d = parseISODate(iso);
    days.push({
      iso,
      day: d.getDate(),
      month: d.getMonth() + 1,
      weekend: d.getDay() === 0 || d.getDay() === 6,
      isFirst: i === 0,
    });
  }
  return days;
}

function barStyle(dates, startKey, endKey, range) {
  if (!dates || !range || !dates[startKey] || !dates[endKey]) return "display:none";
  const left = (daysBetween(range.min, dates[startKey]) / range.dayCount) * 100;
  const width = (Math.max(1, daysBetween(dates[startKey], dates[endKey]) + 1) / range.dayCount) * 100;
  return `left:${Math.max(0, left)}%;width:${Math.min(100 - left, Math.max(width, 100 / range.dayCount))}%;`;
}

function actualDisplayFromInfo(info) {
  if (!info || info.status === "不涉及" || info.color === "muted") {
    return {
      text: "实际: --",
      cls: "is-muted",
      icon: "",
    };
  }
  if (info.done) {
    const late = !!info.overdue;
    return {
      text: `实际: ${formatMd(info.actualDate)}`,
      cls: late ? "is-late" : "is-ok",
      icon: late
        ? '<img class="iter-detail-actual-icon" src="assets/icons/check-warn.svg" alt="" />'
        : '<img class="iter-detail-actual-icon" src="assets/icons/check-ok.svg" alt="" />',
    };
  }
  // 未完成：黄=未超期未开始/进行中；红=已超期（进行或未开始）
  return {
    text: "实际: --",
    cls: info.overdue ? "is-late" : "is-pending",
    icon: '<span class="iter-detail-actual-dot" aria-hidden="true"></span>',
  };
}

function renderPhasesTimeline(iteration, dates) {
  const range = getTimelineRange(dates);
  if (!dates || !range) {
    return '<p class="iter-detail-empty-inline">暂无排期</p>';
  }

  const days = buildPhaseTimelineDays(range);
  const today = todayISO();
  const dayHeader = days
    .map((d) => {
      const label = d.isFirst || d.day === 1 ? `${d.month}/${d.day}` : String(d.day);
      const cls = [
        "iter-detail-phase-day-cell",
        d.weekend ? "is-weekend" : "",
        d.iso === today ? "is-today" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<span class="${cls}" title="${escapeHtml(d.iso)}">${escapeHtml(label)}</span>`;
    })
    .join("");
  const dayGrid = days
    .map((d) => {
      const cls = ["iter-detail-phase-day-col", d.weekend ? "is-weekend" : ""].filter(Boolean).join(" ");
      return `<span class="${cls}" title="${escapeHtml(d.iso)}"></span>`;
    })
    .join("");

  const labelRows = [];
  const trackRows = [];
  const metaRows = [];

  PHASE_UI.forEach((phase) => {
    const info = getIterationPhaseActualInfo(iteration, phase.key);
    const start = info.planStart;
    const end = info.planEnd;
    const showBar = info.showBar;
    const planText =
      showBar && start && end ? `计划 ${formatMd(start)} - ${formatMd(end)}` : "计划 --";
    const actual = actualDisplayFromInfo(info);
    const barCss = showBar ? barStyle(dates, phase.start, phase.end, range) : "display:none";
    const naCls = showBar ? "" : " is-na";

    labelRows.push(`
      <div class="iter-detail-phase-label-row${naCls}">
        <span class="iter-detail-phase-accent is-${phase.accent}"></span>
        <span class="iter-detail-phase-name">${escapeHtml(phase.title)}</span>
      </div>`);

    trackRows.push(`
      <div class="iter-detail-phase-track-row${naCls}">
        <span class="iter-detail-phase-bar is-${phase.accent}" style="${barCss}"></span>
      </div>`);

    metaRows.push(`
      <div class="iter-detail-phase-meta-row${naCls}">
        <div class="iter-detail-phase-dates">
          <span class="iter-detail-plan-text">${escapeHtml(planText)}</span>
          <span class="iter-detail-plan-sep">|</span>
          <span class="iter-detail-actual ${actual.cls}">
            <span>${escapeHtml(actual.text)}</span>
            ${actual.icon}
          </span>
        </div>
      </div>`);
  });

  return `
    <div class="iter-detail-phases-timeline">
      <div class="iter-detail-phases-labels-col">
        <div class="iter-detail-phases-axis-pad" aria-hidden="true"></div>
        ${labelRows.join("")}
      </div>
      <div class="iter-detail-phases-track-col">
        <div class="iter-detail-phases-track-scroll">
          <div class="iter-detail-phases-track-inner" style="--phase-day-count:${days.length}">
            <div class="iter-detail-phases-day-header" aria-hidden="true">${dayHeader}</div>
            <div class="iter-detail-phases-track-body">
              <div class="iter-detail-phases-day-grid" aria-hidden="true">${dayGrid}</div>
              ${trackRows.join("")}
            </div>
          </div>
        </div>
      </div>
      <div class="iter-detail-phases-meta-col">
        <div class="iter-detail-phases-axis-pad" aria-hidden="true"></div>
        ${metaRows.join("")}
      </div>
    </div>`;
}

function formatDevTime(row) {
  const d = (row.scheduleDates && row.scheduleDates.devEnd) || "";
  return d ? formatMd(d) : "-";
}

function formatDevTimeFull(row) {
  const d = (row.scheduleDates && row.scheduleDates.devEnd) || "";
  return d || "-";
}

function getDevRowData(reqs) {
  return reqs.filter((r) => r.testBuildUrl && String(r.testBuildUrl).trim());
}

function getTestRowData(reqs) {
  return reqs.filter(
    (r) =>
      (r.testReportUrl && String(r.testReportUrl).trim()) ||
      r.testPhaseStatus === "已完成" ||
      r.testPhaseStatus === "进行中" ||
      r.status === "测试中"
  );
}

const INFO_PREVIEW_LIMIT = 3;

function renderDevRows(reqs) {
  const rows = getDevRowData(reqs);
  if (!rows.length) {
    return `<tr><td class="empty-row" colspan="5">暂无提测记录</td></tr>`;
  }
  return rows
    .slice(0, INFO_PREVIEW_LIMIT)
    .map(
      (r) => `
    <tr>
      <td class="col-dev-ver">${escapeHtml(r.version || "-")}</td>
      <td class="col-dev-link">${linkOrDash(r.testBuildUrl, { underline: true })}</td>
      <td class="col-dev-note" title="${escapeHtml(r.title)}">${escapeHtml(r.title || "-")}</td>
      <td class="col-dev-time">${escapeHtml(formatDevTime(r))}</td>
      <td class="col-dev-owner">${escapeHtml(r.owner || "-")}</td>
    </tr>`
    )
    .join("");
}

function testConclusionBadge(row) {
  if (row.testPhaseStatus === "已完成" || (row.testReportUrl && String(row.testReportUrl).trim())) {
    return `<span class="iter-detail-result-badge is-pass">PASS</span>`;
  }
  if (row.testPhaseStatus === "进行中" || row.devPhaseStatus === "进行中" || row.status === "测试中") {
    return `<span class="iter-detail-result-badge is-running">进行中</span>`;
  }
  return `<span class="iter-detail-cell-muted">-</span>`;
}

function renderTestRows(reqs) {
  const rows = getTestRowData(reqs);
  if (!rows.length) {
    return `<tr><td class="empty-row" colspan="4">暂无测试记录</td></tr>`;
  }
  return rows
    .slice(0, INFO_PREVIEW_LIMIT)
    .map((r) => {
      const report = r.testReportUrl && String(r.testReportUrl).trim();
      const note = (r.testRemark && String(r.testRemark).trim()) || "";
      return `
    <tr>
      <td class="col-test-ver">${escapeHtml(r.version || "-")}</td>
      <td class="col-test-result">${testConclusionBadge(r)}</td>
      <td class="col-test-report">${report ? linkOrDash(report, { underline: true }) : '<span class="iter-detail-cell-muted">-</span>'}</td>
      <td class="col-test-note" title="${escapeHtml(note)}">${note ? escapeHtml(note) : '<span class="iter-detail-cell-muted">-</span>'}</td>
    </tr>`;
    })
    .join("");
}

function updateInfoMoreButtons(reqs) {
  const devBtn = document.getElementById("detail-dev-more-btn");
  const testBtn = document.getElementById("detail-test-more-btn");
  if (devBtn) devBtn.hidden = getDevRowData(reqs).length <= INFO_PREVIEW_LIMIT;
  if (testBtn) testBtn.hidden = getTestRowData(reqs).length <= INFO_PREVIEW_LIMIT;
}

function renderApkInfo() {
  // 现有假数据无 APK 字段，占位展示结构
  return `
    <div class="iter-detail-apk-item">
      <span class="iter-detail-apk-label">APK链接</span>
      <span class="iter-detail-cell-muted">-</span>
    </div>
    <div class="iter-detail-apk-item">
      <span class="iter-detail-apk-label">APK版本号</span>
      <span class="iter-detail-cell-muted">-</span>
    </div>
    <div class="iter-detail-apk-item">
      <span class="iter-detail-apk-label">DI解决率</span>
      <span class="iter-detail-cell-muted">-</span>
    </div>`;
}

function renderMetaTags(product, name) {
  const { hasAgile, hasTos } = getIterationTypeFlags(name, product);
  let html = `<span class="iter-detail-product-tag">${escapeHtml(product)}</span>`;
  if (hasAgile) html += '<span class="iter-type-tag is-agile">敏</span>';
  if (hasTos) html += '<span class="iter-type-tag is-tos">T</span>';
  return html;
}

function getProductIterations(product) {
  return ITERATIONS.filter((it) => it.product === product)
    .slice()
    .sort((a, b) => iterationNum(b.name) - iterationNum(a.name));
}

function drawerStatusBadge(status) {
  const cls =
    status === "已完成"
      ? "is-done"
      : status === "进行中"
        ? "is-running"
        : status === "已超期"
          ? "is-overdue"
          : status === "未排期"
            ? "is-na"
            : "is-pending";
  return `<span class="iter-drawer-status ${cls}">${escapeHtml(status)}</span>`;
}

/** 超期完成：【已完成】旁加小号「超期完成」小标题（与详情标题旁样式一致） */
function drawerStatusBadges(it) {
  const status =
    getIterationStatus(it) === "未排期" ? "未排期" : getIterationProgressStatus(it);
  let html = drawerStatusBadge(status);
  if (status === "已完成" && isIterationOverdueCompleted(it)) {
    html += '<span class="iter-overdue-tag">超期完成</span>';
  }
  return `<span class="iter-drawer-status-group">${html}</span>`;
}

function formatDrawerRange(dates) {
  if (!dates || !dates.prdStart || !dates.testEnd) return "未排期";
  return `${dates.prdStart} 至 ${dates.testEnd}`;
}

function getLatestIterationForProduct(product) {
  const list = getProductIterations(product);
  if (!list.length) return null;
  return list.slice().sort((a, b) => iterationNum(b.name) - iterationNum(a.name))[0];
}

function getDrawerProducts() {
  const fromBoard = [...new Set(ITERATIONS.map((it) => it.product).filter(Boolean))];
  const fromCatalog = Object.keys(PRODUCT_ITERATION_OFFSETS || {});
  return [...new Set([...fromBoard, ...fromCatalog])].sort((a, b) => a.localeCompare(b, "zh"));
}

function closeDrawerProductMenu() {
  const menu = document.getElementById("drawer-product-menu");
  const btn = document.getElementById("drawer-product-btn");
  if (menu) menu.hidden = true;
  if (btn) {
    btn.setAttribute("aria-expanded", "false");
    btn.classList.remove("is-open");
  }
}

function renderDrawerProductMenu(currentProduct) {
  const menu = document.getElementById("drawer-product-menu");
  if (!menu) return;
  const products = getDrawerProducts();
  menu.innerHTML = products
    .map((p) => {
      const active = p === currentProduct;
      return `<button type="button" class="iter-drawer-product-option${active ? " is-active" : ""}" data-product="${escapeHtml(p)}" role="option" ${active ? 'aria-selected="true"' : ""}>${escapeHtml(p)}</button>`;
    })
    .join("");
}

function switchDrawerProduct(product) {
  if (!product || product === modalState.productContext) {
    closeDrawerProductMenu();
    return;
  }
  const latest = getLatestIterationForProduct(product);
  const name = latest ? latest.name : "";
  const params = new URLSearchParams();
  params.set("product", product);
  if (name) params.set("name", name);
  params.set("drawer", "open");
  window.location.href = `iteration-detail.html?${params.toString()}`;
}

function renderDrawer(product, currentName) {
  const iconEl = document.getElementById("drawer-product-icon");
  const nameEl = document.getElementById("drawer-product-name");
  const listEl = document.getElementById("drawer-iter-list");
  if (!iconEl || !nameEl || !listEl) return;

  const label = product || "—";
  iconEl.textContent = String(label).charAt(0) || "—";
  nameEl.textContent = label;
  renderDrawerProductMenu(product);

  const list = getProductIterations(product);
  if (!list.length) {
    listEl.innerHTML = '<p class="iter-drawer-empty">暂无迭代</p>';
    return;
  }

  listEl.innerHTML = list
    .map((it) => {
      const active = it.name === currentName;
      const drawerParam = isDrawerCurrentlyOpen() ? "&drawer=open" : "";
      const href = `iteration-detail.html?product=${encodeURIComponent(product)}&name=${encodeURIComponent(it.name)}${drawerParam}`;
      const chevron = active
        ? "assets/icons/chevron-right-active.svg"
        : "assets/icons/chevron-right.svg";
      return `
        <a class="iter-drawer-item${active ? " is-active" : ""}" href="${href}" ${active ? 'aria-current="page"' : ""}>
          <div class="iter-drawer-item-main">
            <div class="iter-drawer-item-name-row">
              <span class="iter-drawer-item-name">${escapeHtml(it.name)} 迭代</span>
              ${drawerStatusBadges(it)}
            </div>
            <p class="iter-drawer-item-dates">${escapeHtml(formatDrawerRange(it.dates))}</p>
          </div>
          <img class="iter-drawer-item-chevron" src="${chevron}" alt="" />
        </a>`;
    })
    .join("");
}

function setupDrawerProductSwitch() {
  const btn = document.getElementById("drawer-product-btn");
  const menu = document.getElementById("drawer-product-menu");
  if (!btn || !menu) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = menu.hidden;
    if (open) {
      renderDrawerProductMenu(modalState.productContext);
      menu.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      btn.classList.add("is-open");
    } else {
      closeDrawerProductMenu();
    }
  });

  menu.addEventListener("click", (e) => {
    const option = e.target.closest("[data-product]");
    if (!option) return;
    e.stopPropagation();
    switchDrawerProduct(option.dataset.product);
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest("#drawer-product-wrap")) return;
    closeDrawerProductMenu();
  });
}

function setupDrawerToggle(defaultCollapsed = true) {
  const page = document.querySelector(".iteration-detail-page");
  const collapseBtn = document.getElementById("drawer-collapse-btn");
  const expandBtn = document.getElementById("drawer-expand-btn");
  if (!page || !collapseBtn || !expandBtn) return;

  const setCollapsed = (collapsed) => {
    page.classList.toggle("is-drawer-collapsed", collapsed);
    expandBtn.hidden = !collapsed;
    setDrawerOpenStored(!collapsed);
    syncDrawerQuery(!collapsed);
    closeDrawerProductMenu();
    renderDrawer(modalState.productContext, modalState.currentName);
  };

  setCollapsed(defaultCollapsed);

  collapseBtn.addEventListener("click", () => setCollapsed(true));
  expandBtn.addEventListener("click", () => setCollapsed(false));
  setupDrawerProductSwitch();
}

const DATE_KEYS = [
  ["prdStart", "iter-prd-start"],
  ["prdEnd", "iter-prd-end"],
  ["uxStart", "iter-ux-start"],
  ["uxEnd", "iter-ux-end"],
  ["uiStart", "iter-ui-start"],
  ["uiEnd", "iter-ui-end"],
  ["devStart", "iter-dev-start"],
  ["devEnd", "iter-dev-end"],
  ["testStart", "iter-test-start"],
  ["testEnd", "iter-test-end"],
];

const modalState = {
  productContext: "",
  currentName: "",
};

const INFO_MODAL_PAGE_SIZE = 5;

const infoMoreModalState = {
  type: "dev",
  page: 1,
  rows: [],
};

const INFO_MORE_CONFIG = {
  dev: {
    title: "开发信息",
    icon: "assets/icons/settings.svg",
    statusLabel: "已提测",
    emptyText: "暂无提测记录",
    columns: [
      { key: "version", label: "提测版本", width: "140px", medium: true },
      { key: "link", label: "提测链接", width: "220px", isLink: true },
      { key: "note", label: "提测建议", width: "200px", field: "title" },
      { key: "time", label: "提测时间", width: "130px", muted: true },
      { key: "owner", label: "提测人", width: "100px", muted: true },
    ],
  },
  test: {
    title: "测试信息",
    icon: "assets/icons/check-circle-title.svg",
    statusLabel: "测试中",
    emptyText: "暂无测试记录",
    columns: [
      { key: "version", label: "测试版本", width: "140px", medium: true },
      { key: "result", label: "测试结论", width: "120px", isBadge: true },
      { key: "report", label: "测试报告", width: "220px", isLink: true, flex: true },
      { key: "note", label: "测试备注", width: "160px", field: "testRemark", muted: true },
    ],
  },
};

function getInfoModalCellValue(type, row, col) {
  if (col.key === "version") return row.version || "-";
  if (col.key === "link") return row.testBuildUrl || "";
  if (col.key === "report") return row.testReportUrl || "";
  if (col.key === "note") return row[col.field || "title"] || "";
  if (col.key === "time") return formatDevTimeFull(row);
  if (col.key === "owner") return row.owner || "-";
  if (col.key === "result") return "";
  return row[col.field] || "-";
}

function renderInfoMoreTableHead(type) {
  const config = INFO_MORE_CONFIG[type];
  return config.columns
    .map(
      (col) =>
        `<span class="info-more-th${col.flex ? " is-flex" : ""}" style="width:${col.width}">${escapeHtml(col.label)}</span>`
    )
    .join("");
}

function renderInfoMoreTableRow(type, row, striped) {
  const config = INFO_MORE_CONFIG[type];
  const cells = config.columns
    .map((col) => {
      if (col.isBadge) {
        return `<span class="info-more-td is-center" style="width:${col.width}">${testConclusionBadge(row)}</span>`;
      }
      const val = getInfoModalCellValue(type, row, col);
      if (col.isLink) {
        return `<span class="info-more-td${col.flex ? " is-flex" : ""}" style="width:${col.width}">${linkOrDash(val, { underline: true })}</span>`;
      }
      const cls = [
        "info-more-td",
        col.flex ? "is-flex" : "",
        col.medium ? "is-medium" : "",
        col.muted ? "is-muted" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const text = val && String(val).trim() ? escapeHtml(val) : "-";
      return `<span class="${cls}" style="width:${col.width}" title="${escapeHtml(val)}">${text}</span>`;
    })
    .join("");
  return `<div class="info-more-row${striped ? " is-striped" : ""}">${cells}</div>`;
}

function renderInfoMorePagination(total) {
  const el = document.getElementById("info-more-pagination");
  const pages = Math.max(1, Math.ceil(total / INFO_MODAL_PAGE_SIZE));
  if (infoMoreModalState.page > pages) infoMoreModalState.page = pages;

  let html = `<button type="button" class="info-more-page-btn is-nav" data-page="prev" ${
    infoMoreModalState.page === 1 ? "disabled" : ""
  } aria-label="上一页"><img src="assets/icons/chevron-left.svg" alt="" /></button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button type="button" class="info-more-page-btn${i === infoMoreModalState.page ? " is-active" : ""}" data-page="${i}">${i}</button>`;
  }
  html += `<button type="button" class="info-more-page-btn is-nav" data-page="next" ${
    infoMoreModalState.page === pages ? "disabled" : ""
  } aria-label="下一页"><img src="assets/icons/chevron-right.svg" alt="" /></button>`;
  el.innerHTML = html;
}

function renderInfoMoreModalBody() {
  const { type, page, rows } = infoMoreModalState;
  const config = INFO_MORE_CONFIG[type];
  const head = document.getElementById("info-more-table-head");
  const body = document.getElementById("info-more-table-rows");
  const totalEl = document.getElementById("info-more-total");

  head.innerHTML = renderInfoMoreTableHead(type);
  totalEl.textContent = `共 ${rows.length} 条记录`;

  if (!rows.length) {
    body.innerHTML = `<div class="info-more-empty">${escapeHtml(config.emptyText)}</div>`;
    document.getElementById("info-more-pagination").innerHTML = "";
    return;
  }

  const pages = Math.max(1, Math.ceil(rows.length / INFO_MODAL_PAGE_SIZE));
  const safePage = Math.min(page, pages);
  infoMoreModalState.page = safePage;
  const start = (safePage - 1) * INFO_MODAL_PAGE_SIZE;
  const pageRows = rows.slice(start, start + INFO_MODAL_PAGE_SIZE);
  body.innerHTML = pageRows
    .map((row, i) => renderInfoMoreTableRow(type, row, i % 2 === 1))
    .join("");
  renderInfoMorePagination(rows.length);
}

function getInfoModalStatusLabel(type, rows, iteration) {
  if (type === "dev") {
    if (!rows.length) return "未提测";
    const devStatus = iteration && iteration.dates ? getIterationPhaseStatus(iteration, "dev") : null;
    if (devStatus === "已完成") return "已提测";
    if (devStatus === "进行中") return "提测中";
    return "已提测";
  }
  if (!rows.length) return "未测试";
  const hasRunning = rows.some(
    (r) => r.testPhaseStatus === "进行中" || r.status === "测试中" || (!r.testReportUrl && r.testPhaseStatus !== "已完成")
  );
  if (hasRunning) return "测试中";
  return "已完成";
}

function openInfoMoreModal(type) {
  const { product, name } = getQueryParams();
  const iteration = findIteration(name, product);
  const reqs = getIterationRequirements(name, product);
  const config = INFO_MORE_CONFIG[type];
  const rows = type === "dev" ? getDevRowData(reqs) : getTestRowData(reqs);

  infoMoreModalState.type = type;
  infoMoreModalState.page = 1;
  infoMoreModalState.rows = rows;

  document.getElementById("info-more-modal-title").textContent = config.title;
  document.getElementById("info-more-icon").src = config.icon;
  document.getElementById("info-more-status-badge").textContent = getInfoModalStatusLabel(
    type,
    rows,
    iteration
  );

  renderInfoMoreModalBody();
  document.getElementById("info-more-modal").hidden = false;
}

function closeInfoMoreModal() {
  document.getElementById("info-more-modal").hidden = true;
}

function setupInfoMoreModal() {
  document.getElementById("detail-dev-more-btn").addEventListener("click", () => openInfoMoreModal("dev"));
  document.getElementById("detail-test-more-btn").addEventListener("click", () => openInfoMoreModal("test"));
  document.getElementById("info-more-modal-close").addEventListener("click", closeInfoMoreModal);
  document.getElementById("info-more-modal").addEventListener("click", (e) => {
    if (e.target.id === "info-more-modal") closeInfoMoreModal();
  });
  document.getElementById("info-more-pagination").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;
    const total = infoMoreModalState.rows.length;
    const pages = Math.max(1, Math.ceil(total / INFO_MODAL_PAGE_SIZE));
    const raw = btn.dataset.page;
    if (raw === "prev") infoMoreModalState.page = Math.max(1, infoMoreModalState.page - 1);
    else if (raw === "next") infoMoreModalState.page = Math.min(pages, infoMoreModalState.page + 1);
    else infoMoreModalState.page = Number(raw);
    renderInfoMoreModalBody();
  });
}

function fillDates(dates) {
  DATE_KEYS.forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) el.value = (dates && dates[key]) || "";
  });
}

function readDates() {
  const dates = {};
  DATE_KEYS.forEach(([key, id]) => {
    dates[key] = document.getElementById(id).value || "";
  });
  return dates;
}

function setProductSelect(product, { locked }) {
  const hidden = document.getElementById("iter-product");
  const text = document.getElementById("iter-product-text");
  const btn = document.getElementById("iter-product-btn");
  hidden.value = product || "";
  if (product) {
    text.textContent = product;
    text.classList.remove("placeholder");
  } else {
    text.textContent = text.dataset.placeholder || "请选择所属产品";
    text.classList.add("placeholder");
  }
  btn.disabled = !!locked;
  btn.classList.toggle("is-disabled", !!locked);
}

function suggestIterName(product) {
  const maxN = getSelectableIterations(product).reduce((m, it) => Math.max(m, iterationNum(it.name)), 0);
  return `S${maxN + 1}`;
}

function openCreateModal(defaultProduct) {
  document.getElementById("iteration-modal-title").textContent = "新建迭代";
  const nameInput = document.getElementById("iter-name");
  const product = defaultProduct || "";
  setProductSelect(product, { locked: false });
  nameInput.value = product ? suggestIterName(product) : "";
  nameInput.readOnly = false;
  fillDates({});
  nameInput.classList.remove("field-error");
  document.getElementById("iter-product-btn").classList.remove("field-error");
  ["iter-dev-start", "iter-dev-end", "iter-test-start", "iter-test-end"].forEach((id) => {
    document.getElementById(id).classList.remove("field-error");
  });
  document.getElementById("iteration-modal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeCreateModal() {
  document.getElementById("iteration-modal").hidden = true;
  document.body.classList.remove("modal-open");
  document.getElementById("iter-product-menu").hidden = true;
}

function saveCreateModal() {
  const nameInput = document.getElementById("iter-name");
  const product = document.getElementById("iter-product").value.trim();
  const name = nameInput.value.trim();
  let valid = true;
  if (!product) {
    document.getElementById("iter-product-btn").classList.add("field-error");
    valid = false;
  } else {
    document.getElementById("iter-product-btn").classList.remove("field-error");
  }
  if (!name) {
    nameInput.classList.add("field-error");
    valid = false;
  } else {
    nameInput.classList.remove("field-error");
  }
  const requiredDateIds = ["iter-dev-start", "iter-dev-end", "iter-test-start", "iter-test-end"];
  requiredDateIds.forEach((id) => {
    const el = document.getElementById(id);
    if (!el.value) {
      el.classList.add("field-error");
      valid = false;
    } else {
      el.classList.remove("field-error");
    }
  });
  if (!valid) return;

  if (findBoardIteration(name, product)) {
    nameInput.classList.add("field-error");
    alert("该产品下迭代代号已存在");
    return;
  }

  const dates = readDates();
  const datePayload = dates;
  ITERATIONS.unshift({ product, name, dates: datePayload });
  if (typeof upsertIterationCatalog === "function") {
    upsertIterationCatalog({ product, name, dates: datePayload });
  }

  closeCreateModal();
  renderDrawer(modalState.productContext, modalState.currentName);
}

function setupCreateModal() {
  const btn = document.getElementById("iter-product-btn");
  const menu = document.getElementById("iter-product-menu");
  const products = Object.keys(PRODUCT_ITERATION_OFFSETS || {}).sort((a, b) => a.localeCompare(b, "zh"));

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (btn.disabled) return;
    menu.innerHTML = products
      .map((p) => {
        const cur = document.getElementById("iter-product").value;
        return `<button type="button" class="${p === cur ? "selected" : ""}" data-value="${escapeHtml(p)}">${escapeHtml(p)}</button>`;
      })
      .join("");
    menu.hidden = !menu.hidden;
  });

  menu.addEventListener("click", (e) => {
    const opt = e.target.closest("button[data-value]");
    if (!opt) return;
    setProductSelect(opt.dataset.value, { locked: false });
    btn.classList.remove("field-error");
    menu.hidden = true;
    document.getElementById("iter-name").value = suggestIterName(opt.dataset.value);
  });

  document.addEventListener("click", () => {
    menu.hidden = true;
  });

  document.getElementById("iteration-modal-close").addEventListener("click", closeCreateModal);
  document.getElementById("iteration-modal-cancel").addEventListener("click", closeCreateModal);
  document.getElementById("iteration-modal-save").addEventListener("click", saveCreateModal);
  document.getElementById("iteration-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeCreateModal();
  });

  document.getElementById("drawer-create-btn").addEventListener("click", () => {
    openCreateModal(modalState.productContext);
  });
}

const deleteModalState = {
  reqId: null,
};

function openDeleteReqModal(reqId) {
  deleteModalState.reqId = reqId;
  const reason = document.getElementById("delete-req-reason");
  reason.value = "";
  reason.classList.remove("field-error");
  document.getElementById("delete-req-modal").hidden = false;
  document.body.classList.add("modal-open");
  reason.focus();
}

function closeDeleteReqModal() {
  document.getElementById("delete-req-modal").hidden = true;
  document.body.classList.remove("modal-open");
  deleteModalState.reqId = null;
  const reason = document.getElementById("delete-req-reason");
  reason.value = "";
  reason.classList.remove("field-error");
}

function confirmDeleteReq() {
  const reason = document.getElementById("delete-req-reason");
  const text = reason.value.trim();
  if (!text) {
    reason.classList.add("field-error");
    reason.focus();
    return;
  }
  reason.classList.remove("field-error");

  const id = Number(deleteModalState.reqId);
  const idx = REQUIREMENTS.findIndex((r) => r.id === id);
  if (idx >= 0) {
    const row = REQUIREMENTS[idx];
    const { product, name } = getQueryParams();
    const iteration = findIteration(name, product);
    const code = row.reqCode || makeSrCode(row.id, row.requestDate);
    pushIterationReqChange(iteration, {
      type: "delete",
      title: `删除需求「${row.title}」${code}`,
      reason: text,
    });
    row.deleteReason = text;
    // 从当前迭代完全移除：清除排期归属
    row.iteration = "";
    row.scheduleDates = null;
  }

  closeDeleteReqModal();
  refreshOverview();
}

function setupDeleteReqModal() {
  const tbody = document.getElementById("detail-req-tbody");
  if (tbody) {
    tbody.addEventListener("click", (e) => {
      const deleteBtn = e.target.closest('[data-action="delete-req"]');
      if (deleteBtn) {
        openDeleteReqModal(deleteBtn.dataset.id);
        return;
      }
      const transferBtn = e.target.closest('[data-action="transfer-req"]');
      if (transferBtn) {
        openTransferReqModal(transferBtn.dataset.id);
        return;
      }
      const remindBtn = e.target.closest('[data-action="remind-req"]');
      if (remindBtn) {
        openRemindReqModal(remindBtn.dataset.id);
      }
    });
  }

  document.getElementById("delete-req-modal-close").addEventListener("click", closeDeleteReqModal);
  document.getElementById("delete-req-modal-cancel").addEventListener("click", closeDeleteReqModal);
  document.getElementById("delete-req-modal-confirm").addEventListener("click", confirmDeleteReq);
  document.getElementById("delete-req-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeDeleteReqModal();
  });
}

const transferModalState = {
  reqId: null,
  fromIteration: "",
  product: "",
};

function getTransferTargetIterations(product, currentName) {
  return ITERATIONS.filter((it) => it.product === product && it.name !== currentName)
    .slice()
    .sort((a, b) => iterationNum(b.name) - iterationNum(a.name));
}

function setTransferIterationSelect(value) {
  const hidden = document.getElementById("transfer-req-iteration");
  const text = document.getElementById("transfer-req-iteration-text");
  const btn = document.getElementById("transfer-req-iteration-btn");
  hidden.value = value || "";
  if (value) {
    text.textContent = value;
    text.classList.remove("placeholder");
  } else {
    text.textContent = text.dataset.placeholder || "请选择目标迭代";
    text.classList.add("placeholder");
  }
  btn.classList.remove("field-error");
}

function openTransferReqModal(reqId) {
  const row = REQUIREMENTS.find((r) => r.id === Number(reqId));
  if (!row) return;

  transferModalState.reqId = row.id;
  transferModalState.fromIteration = row.iteration || modalState.currentName || "";
  transferModalState.product = row.product || modalState.productContext || "";

  setTransferIterationSelect("");
  const reason = document.getElementById("transfer-req-reason");
  reason.value = "";
  reason.classList.remove("field-error");

  const menu = document.getElementById("transfer-req-iteration-menu");
  const options = getTransferTargetIterations(transferModalState.product, transferModalState.fromIteration);
  if (!options.length) {
    menu.innerHTML = '<div class="empty-row" style="padding:12px;font-size:12px">暂无可转移的目标迭代</div>';
  } else {
    menu.innerHTML = options
      .map(
        (it) =>
          `<button type="button" data-value="${escapeHtml(it.name)}">${escapeHtml(it.name)}</button>`
      )
      .join("");
  }
  menu.hidden = true;

  document.getElementById("transfer-req-modal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeTransferReqModal() {
  document.getElementById("transfer-req-modal").hidden = true;
  document.body.classList.remove("modal-open");
  document.getElementById("transfer-req-iteration-menu").hidden = true;
  transferModalState.reqId = null;
  transferModalState.fromIteration = "";
  transferModalState.product = "";
  setTransferIterationSelect("");
  const reason = document.getElementById("transfer-req-reason");
  reason.value = "";
  reason.classList.remove("field-error");
}

function confirmTransferReq() {
  const target = document.getElementById("transfer-req-iteration").value.trim();
  const reasonEl = document.getElementById("transfer-req-reason");
  const reason = reasonEl.value.trim();
  let valid = true;

  if (!target) {
    document.getElementById("transfer-req-iteration-btn").classList.add("field-error");
    valid = false;
  } else {
    document.getElementById("transfer-req-iteration-btn").classList.remove("field-error");
  }
  if (!reason) {
    reasonEl.classList.add("field-error");
    valid = false;
  } else {
    reasonEl.classList.remove("field-error");
  }
  if (!valid) {
    if (!target) document.getElementById("transfer-req-iteration-btn").focus();
    else reasonEl.focus();
    return;
  }

  const row = REQUIREMENTS.find((r) => r.id === Number(transferModalState.reqId));
  if (!row) {
    closeTransferReqModal();
    return;
  }

  const fromIteration = transferModalState.fromIteration || row.iteration || "";
  const it = findIteration(target, row.product);
  if (it && it.dates) {
    row.scheduleDates = { ...it.dates };
    if (it.dates.testEnd) row.deliverMonth = it.dates.testEnd.slice(0, 7);
  }
  row.iteration = target;
  pushScheduleChange(row, {
    type: "swap",
    fromIteration,
    toIteration: target,
    reason,
    operator: row.owner,
  });
  const { product, name } = getQueryParams();
  const fromIter = findIteration(fromIteration, product || row.product);
  const code = row.reqCode || makeSrCode(row.id, row.requestDate);
  pushIterationReqChange(fromIter, {
    type: "transfer",
    title: `需求「${row.title}」${code} 转移至 ${target} 迭代`,
    reason,
  });
  if (typeof rebuildIterationsFromGantt === "function") rebuildIterationsFromGantt();

  closeTransferReqModal();
  refreshOverview();
}

function setupTransferReqModal() {
  const btn = document.getElementById("transfer-req-iteration-btn");
  const menu = document.getElementById("transfer-req-iteration-menu");

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });

  menu.addEventListener("click", (e) => {
    const opt = e.target.closest("button[data-value]");
    if (!opt) return;
    setTransferIterationSelect(opt.dataset.value);
    menu.hidden = true;
  });

  document.addEventListener("click", () => {
    menu.hidden = true;
  });

  document.getElementById("transfer-req-modal-close").addEventListener("click", closeTransferReqModal);
  document.getElementById("transfer-req-modal-cancel").addEventListener("click", closeTransferReqModal);
  document.getElementById("transfer-req-modal-confirm").addEventListener("click", confirmTransferReq);
  document.getElementById("transfer-req-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeTransferReqModal();
  });
}

const remindModalState = {
  reqId: null,
};

const REMIND_ROLE_DEFAULTS = { ui: true, ux: true, product: true };

function syncRemindSelectAllState() {
  const selectAll = document.getElementById("remind-req-select-all");
  const roles = [...document.querySelectorAll(".remind-req-role")];
  const checkedCount = roles.filter((el) => el.checked).length;
  selectAll.checked = checkedCount === roles.length && roles.length > 0;
  selectAll.indeterminate = checkedCount > 0 && checkedCount < roles.length;
}

function resetRemindRoleChecks() {
  document.querySelectorAll(".remind-req-role").forEach((el) => {
    el.checked = !!REMIND_ROLE_DEFAULTS[el.value];
  });
  syncRemindSelectAllState();
}

function openRemindReqModal(reqId) {
  remindModalState.reqId = reqId;
  resetRemindRoleChecks();
  document.getElementById("remind-req-modal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeRemindReqModal() {
  document.getElementById("remind-req-modal").hidden = true;
  document.body.classList.remove("modal-open");
  remindModalState.reqId = null;
}

function confirmRemindReq() {
  closeRemindReqModal();
}

function setupRemindReqModal() {
  const selectAll = document.getElementById("remind-req-select-all");
  const roleList = document.querySelector(".remind-req-role-list");

  selectAll.addEventListener("change", () => {
    const checked = selectAll.checked;
    document.querySelectorAll(".remind-req-role").forEach((el) => {
      el.checked = checked;
    });
    syncRemindSelectAllState();
  });

  if (roleList) {
    roleList.addEventListener("change", (e) => {
      if (e.target.classList.contains("remind-req-role")) syncRemindSelectAllState();
    });
  }

  document.getElementById("remind-req-modal-close").addEventListener("click", closeRemindReqModal);
  document.getElementById("remind-req-modal-cancel").addEventListener("click", closeRemindReqModal);
  document.getElementById("remind-req-modal-confirm").addEventListener("click", confirmRemindReq);
  document.getElementById("remind-req-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeRemindReqModal();
  });
}

const EDIT_SCHED_DATE_KEYS = [
  ["prdStart", "edit-sched-prd-start"],
  ["prdEnd", "edit-sched-prd-end"],
  ["uxStart", "edit-sched-ux-start"],
  ["uxEnd", "edit-sched-ux-end"],
  ["uiStart", "edit-sched-ui-start"],
  ["uiEnd", "edit-sched-ui-end"],
  ["devStart", "edit-sched-dev-start"],
  ["devEnd", "edit-sched-dev-end"],
  ["testStart", "edit-sched-test-start"],
  ["testEnd", "edit-sched-test-end"],
];

const EDIT_SCHED_REQUIRED_IDS = [
  "edit-sched-dev-start",
  "edit-sched-dev-end",
  "edit-sched-test-start",
  "edit-sched-test-end",
];

function fillEditScheduleDates(dates) {
  EDIT_SCHED_DATE_KEYS.forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = (dates && dates[key]) || "";
      el.classList.remove("field-error");
    }
  });
}

function readEditScheduleDates() {
  const dates = {};
  EDIT_SCHED_DATE_KEYS.forEach(([key, id]) => {
    dates[key] = document.getElementById(id).value || "";
  });
  return dates;
}

function openEditScheduleModal() {
  const { product, name } = getQueryParams();
  const iteration = findIteration(name, product);
  if (!iteration) return;

  const status =
    getIterationStatus(iteration) === "未排期" ? "未排期" : getIterationProgressStatus(iteration);
  document.getElementById("edit-schedule-iter-badge").textContent =
    `当前迭代：${name} ${status}`;
  fillEditScheduleDates(iteration.dates || {});
  const reason = document.getElementById("edit-sched-reason");
  reason.value = "";
  reason.classList.remove("field-error");

  document.getElementById("edit-schedule-modal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeEditScheduleModal() {
  document.getElementById("edit-schedule-modal").hidden = true;
  document.body.classList.remove("modal-open");
}

function confirmEditSchedule() {
  const { product, name } = getQueryParams();
  const iteration = findIteration(name, product);
  if (!iteration) return;

  let valid = true;
  EDIT_SCHED_REQUIRED_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el.value) {
      el.classList.add("field-error");
      valid = false;
    } else {
      el.classList.remove("field-error");
    }
  });

  const reason = document.getElementById("edit-sched-reason");
  const reasonText = reason.value.trim();
  if (!reasonText) {
    reason.classList.add("field-error");
    valid = false;
  } else {
    reason.classList.remove("field-error");
  }
  if (!valid) return;

  const dates = readEditScheduleDates();
  const prevDates = iteration.dates ? { ...iteration.dates } : {};
  const summary =
    typeof buildScheduleChangeSummary === "function"
      ? buildScheduleChangeSummary(prevDates, dates)
      : "";
  upsertIterationCatalog({ product, name, dates });
  iteration.scheduleChangeReason = reasonText;
  if (summary && typeof pushIterationScheduleChange === "function") {
    pushIterationScheduleChange(iteration, {
      title: summary,
      reason: reasonText,
    });
  }

  getIterationRequirements(name, product).forEach((row) => {
    row.scheduleDates = { ...dates };
    if (dates.testEnd) row.deliverMonth = dates.testEnd.slice(0, 7);
  });

  const startDate = dates.prdStart || dates.devStart || "";
  const endDate = dates.testEnd || "";
  document.getElementById("detail-date-range").textContent =
    startDate && endDate ? `${startDate} 至 ${endDate}` : "未排期";

  closeEditScheduleModal();
  refreshOverview();
  if (!document.getElementById("panel-changelog")?.hidden) refreshChangelog();
}

function setupEditScheduleModal() {
  const btn = document.getElementById("btn-edit-schedule");
  if (btn) btn.addEventListener("click", openEditScheduleModal);
  document.getElementById("edit-schedule-modal-close").addEventListener("click", closeEditScheduleModal);
  document.getElementById("edit-schedule-modal-cancel").addEventListener("click", closeEditScheduleModal);
  document.getElementById("edit-schedule-modal-confirm").addEventListener("click", confirmEditSchedule);
  document.getElementById("edit-schedule-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeEditScheduleModal();
  });
}

const addReqModalState = {
  search: "",
  collapsedIr: new Set(),
  collapsedSr: new Set(),
  selected: new Set(),
  /** @type {Map<number, { prd: boolean, ux: boolean, ui: boolean }>} */
  involve: new Map(),
  /** leafId → 文档来源需求 id（带上父级文档） */
  docSource: new Map(),
  /**
   * leafId → { peerIds, peerCodes, ownerId }
   * AI PRD 挂 IR 且分支时的共享提示
   */
  shareTips: new Map(),
};

function getReqDisplayCode(row) {
  if (row.reqCode) return row.reqCode;
  if (typeof isAR === "function" && isAR(row)) return makeArCode(row.id, row.requestDate);
  if (typeof isSR === "function" && isSR(row)) return makeSrCode(row.id, row.requestDate);
  return makeReqCode(row.id, row.requestDate);
}

function getAddReqChildArs(srId, product) {
  return REQUIREMENTS.filter(
    (r) => isAR(r) && r.parentId === srId && r.product === product
  )
    .slice()
    .sort((a, b) => a.id - b.id);
}

function isReqInIteration(row, iterName) {
  return !!(row.iteration && String(row.iteration).trim() === iterName);
}

function isReqInOtherIteration(row, iterName) {
  const iter = row.iteration && String(row.iteration).trim();
  return !!(iter && iter !== iterName);
}

function buildInvolveDefaults(row, iterName) {
  const isTransfer = isReqInOtherIteration(row, iterName);
  if (isTransfer) {
    return {
      prd: row.needPrd !== false,
      ux: row.needUx === true || (row.needUx !== false && row.needUx !== undefined),
      ui: row.needUi === true || (row.needUi !== false && row.needUi !== undefined),
    };
  }
  // 新增：自身或父级已有 PRD/AI PRD 则勾 PRD；UX/UI 空着
  const hasDoc =
    (typeof findAiPrdOwner === "function" && !!findAiPrdOwner(row)) ||
    (typeof findTraditionalPrdOwner === "function" && !!findTraditionalPrdOwner(row)) ||
    (typeof reqHasPrdDoc === "function" && reqHasPrdDoc(row));
  return {
    prd: hasDoc,
    ux: false,
    ui: false,
  };
}

function ensureInvolveState(id, row, iterName) {
  if (!addReqModalState.involve.has(id)) {
    addReqModalState.involve.set(id, buildInvolveDefaults(row, iterName));
  }
  return addReqModalState.involve.get(id);
}

/** 静默勾选叶子（不递归触发关联规则） */
function selectAddReqLeafQuiet(id, iterName) {
  const row = REQUIREMENTS.find((r) => r.id === id);
  if (!row || isReqInIteration(row, iterName)) return;
  addReqModalState.selected.add(id);
  ensureInvolveState(id, row, iterName);
}

function collectSharePeers(row, docOwner, iterName) {
  let peers = [];
  if (isIR(docOwner) && typeof getIrSelectableLeaves === "function") {
    peers = getIrSelectableLeaves(docOwner);
  } else if (isSR(docOwner) && typeof getChildArsOf === "function") {
    peers = getChildArsOf(docOwner.id);
  }
  return peers.filter((p) => {
    if (p.id === row.id) return false;
    if (isReqInIteration(p, iterName)) return false;
    if (addReqModalState.selected.has(p.id)) return false;
    // 勾选 SR 时其子 AR 已同步勾上，不提示
    if (isSR(row) && isAR(p) && p.parentId === row.id) return false;
    return true;
  });
}

function setShareTipFromPeers(rowId, docOwnerId, peers) {
  if (peers.length) {
    addReqModalState.shareTips.set(rowId, {
      ownerId: docOwnerId,
      peerIds: peers.map((p) => p.id),
      peerCodes: peers.map((p) => getReqDisplayCode(p)),
    });
  } else {
    addReqModalState.shareTips.delete(rowId);
  }
}

/**
 * 文档挂载关联规则（勾选时触发）：
 * - AI PRD 挂 IR：唯一子路径 → 勾该叶子；多分支 → 提示共享 + 建议同步
 * - AI PRD 挂 SR/AR，或普通 PRD：父节点文档 → 带上文档（多兄弟时提示同步）；否则自动勾下属
 */
function applyDocAssociationRules(row, iterName) {
  const aiOwner = typeof findAiPrdOwner === "function" ? findAiPrdOwner(row) : null;
  const tradOwner =
    typeof findTraditionalPrdOwner === "function" ? findTraditionalPrdOwner(row) : null;

  // —— AI PRD 挂在 IR ——
  if (aiOwner && isIR(aiOwner)) {
    const unique =
      typeof getIrUniqueLeaf === "function" ? getIrUniqueLeaf(aiOwner) : null;
    if (unique) {
      selectAddReqLeafQuiet(unique.id, iterName);
      addReqModalState.docSource.set(unique.id, aiOwner.id);
      addReqModalState.shareTips.delete(row.id);
      if (row.id !== unique.id) {
        addReqModalState.selected.delete(row.id);
        addReqModalState.involve.delete(row.id);
        addReqModalState.shareTips.delete(row.id);
      }
      return;
    }
    if (typeof isIrDocBranched === "function" && isIrDocBranched(aiOwner)) {
      addReqModalState.docSource.set(row.id, aiOwner.id);
      setShareTipFromPeers(row.id, aiOwner.id, collectSharePeers(row, aiOwner, iterName));
      return;
    }
  }

  // —— AI PRD 挂 SR/AR，或普通 PRD ——
  const docOwner = aiOwner || tradOwner;
  if (docOwner) {
    if (docOwner.id !== row.id && isAncestorOf(docOwner.id, row)) {
      // 带上该需求的文档；若还有未勾选的共享兄弟，提示建议同步
      addReqModalState.docSource.set(row.id, docOwner.id);
      setShareTipFromPeers(row.id, docOwner.id, collectSharePeers(row, docOwner, iterName));
      return;
    }

    // 反之：自动勾选下属全部需求 ID（列表仍展示全部合集）
    addReqModalState.docSource.set(row.id, docOwner.id);
    addReqModalState.shareTips.delete(row.id);
    const descendants =
      typeof getDocOwnerDescendantLeaves === "function"
        ? getDocOwnerDescendantLeaves(docOwner)
        : [];
    descendants.forEach((d) => {
      selectAddReqLeafQuiet(d.id, iterName);
      addReqModalState.docSource.set(d.id, docOwner.id);
    });
    return;
  }

  // —— 反向：文档挂在子 AR，勾选了父 SR →
  // 只落地 AR（取消 SR 勾选）；涉及 PRD/UX/UI 仅在 AR 上勾；自动勾全部下属 AR ——
  if (isSR(row) && typeof getChildArsWithDocs === "function") {
    const childDocs = getChildArsWithDocs(row.id);
    if (childDocs.length) {
      const { product } = getQueryParams();
      addReqModalState.selected.delete(row.id);
      addReqModalState.involve.delete(row.id);
      addReqModalState.docSource.delete(row.id);
      addReqModalState.shareTips.delete(row.id);

      getAddReqChildArs(row.id, product).forEach((ar) => {
        if (isReqInIteration(ar, iterName)) return;
        selectAddReqLeafQuiet(ar.id, iterName);
        if (reqHasPrdDoc(ar)) {
          addReqModalState.docSource.set(ar.id, ar.id);
          const needs = ensureInvolveState(ar.id, ar, iterName);
          needs.prd = true;
          addReqModalState.involve.set(ar.id, needs);
        }
      });
      return;
    }
  }

  addReqModalState.shareTips.delete(row.id);
}

function syncShareTipPeers(forId, iterName) {
  const tip = addReqModalState.shareTips.get(forId);
  if (!tip) return;
  tip.peerIds.forEach((pid) => {
    selectAddReqLeafQuiet(pid, iterName);
    if (tip.ownerId) addReqModalState.docSource.set(pid, tip.ownerId);
  });
  addReqModalState.shareTips.delete(forId);
}

function getAddReqTreeGroups(product, iterName, search) {
  const q = String(search || "").trim().toLowerCase();
  const irs = REQUIREMENTS.filter((r) => isIR(r) && r.product === product)
    .slice()
    .sort((a, b) => a.id - b.id);

  return irs
    .map((ir) => {
      const srs = REQUIREMENTS.filter((r) => isSR(r) && r.parentId === ir.id && r.product === product)
        .slice()
        .sort((a, b) => a.id - b.id)
        .map((sr) => {
          const ars = getAddReqChildArs(sr.id, product).map((ar) => {
            const code = getReqDisplayCode(ar);
            const added = isReqInIteration(ar, iterName);
            const otherIter = isReqInOtherIteration(ar, iterName)
              ? String(ar.iteration).trim()
              : "";
            return {
              row: ar,
              code,
              title: ar.title || "",
              added,
              otherIter,
            };
          });
          const code = getReqDisplayCode(sr);
          const added = isSrEffectivelyAdded(sr, iterName, product);
          const otherIter =
            !added && isReqInOtherIteration(sr, iterName)
              ? String(sr.iteration).trim()
              : "";
          return {
            row: sr,
            code,
            title: sr.title || "",
            added,
            otherIter,
            ars,
          };
        });

      const irCode = getReqDisplayCode(ir);
      const irTitle = ir.title || "";
      const irMatch =
        !q ||
        irCode.toLowerCase().includes(q) ||
        irTitle.toLowerCase().includes(q);

      const matchedSrs = q
        ? srs
            .map((sr) => {
              const srMatch =
                sr.code.toLowerCase().includes(q) ||
                sr.title.toLowerCase().includes(q);
              const matchedArs = sr.ars.filter(
                (ar) =>
                  ar.code.toLowerCase().includes(q) ||
                  ar.title.toLowerCase().includes(q)
              );
              if (!irMatch && !srMatch && !matchedArs.length) return null;
              return {
                ...sr,
                ars: srMatch || irMatch ? sr.ars : matchedArs,
              };
            })
            .filter(Boolean)
        : srs;

      if (q && !irMatch && !matchedSrs.length) return null;
      return {
        ir,
        irCode,
        irTitle,
        srs: q && irMatch && !matchedSrs.length ? srs : matchedSrs,
      };
    })
    .filter(Boolean)
    .filter((g) => g.srs.length > 0);
}

function getAddReqNewSelectedIds() {
  const { product, name } = getQueryParams();
  const existingIds = new Set(getIterationRequirements(name, product).map((r) => r.id));
  REQUIREMENTS.forEach((r) => {
    if (isAR(r) && isReqInIteration(r, name) && r.product === product) {
      existingIds.add(r.id);
    }
    if (isSR(r) && r.product === product && isSrEffectivelyAdded(r, name, product)) {
      existingIds.add(r.id);
    }
  });
  return [...addReqModalState.selected].filter((id) => {
    if (existingIds.has(id)) return false;
    const row = REQUIREMENTS.find((r) => r.id === id);
    // 文档在子 AR：父 SR 不落地、不占已选个数
    if (row && isSR(row) && srHasChildArDocs(row.id)) return false;
    return true;
  });
}

/** 确认时：父 SR 已选则不再单独处理其子 AR；文档在 AR 时不落地父 SR */
function getAddReqConfirmTargets() {
  const ids = getAddReqNewSelectedIds();
  const rows = ids
    .map((id) => REQUIREMENTS.find((r) => r.id === id))
    .filter((r) => r && isIterationLeaf(r));
  const srIds = new Set(rows.filter(isSR).map((r) => r.id));
  return rows.filter((r) => {
    if (isAR(r) && srIds.has(r.parentId) && !srHasChildArDocs(r.parentId)) return false;
    if (isSR(r) && srHasChildArDocs(r.id)) return false;
    return true;
  });
}

function updateAddReqSelectedCount() {
  // 文档在 AR：父 SR 若误入 selected，清掉以免占个数 / 误展示
  [...addReqModalState.selected].forEach((id) => {
    const row = REQUIREMENTS.find((r) => r.id === id);
    if (row && isSR(row) && srHasChildArDocs(row.id)) {
      addReqModalState.selected.delete(id);
      addReqModalState.involve.delete(id);
      addReqModalState.docSource.delete(id);
      addReqModalState.shareTips.delete(id);
    }
  });
  const newIds = getAddReqNewSelectedIds();
  const el = document.getElementById("add-req-selected-count");
  if (el) el.textContent = String(newIds.length);
  const confirmBtn = document.getElementById("add-req-modal-confirm");
  if (confirmBtn) confirmBtn.disabled = newIds.length === 0;
}

function rowHasBoundDoc(row) {
  if (!row) return false;
  if (typeof reqHasPrdDoc === "function" && reqHasPrdDoc(row)) return true;
  if (addReqModalState.docSource.has(row.id)) return true;
  if (typeof findAiPrdOwner === "function" && findAiPrdOwner(row)) return true;
  if (typeof findTraditionalPrdOwner === "function" && findTraditionalPrdOwner(row)) return true;
  return false;
}

function renderAddReqInvolvePanel(id, needs, { lockPrd = false } = {}) {
  const mk = (key, label) => {
    const locked = lockPrd && key === "prd";
    const checked = locked || needs[key] ? "checked" : "";
    const disabled = locked ? "disabled" : "";
    const lockCls = locked ? "is-locked" : "";
    return `
      <label class="add-req-involve-option ${lockCls}" title="${locked ? "已有需求文档，涉及 PRD 不可取消" : ""}">
        <input type="checkbox" class="add-req-involve-check" data-id="${id}" data-need="${key}" ${checked} ${disabled} />
        <span class="schedule-involve-box" aria-hidden="true"></span>
        <span class="schedule-involve-option-text">涉及 ${label}</span>
      </label>`;
  };
  return `
    <div class="add-req-involve-panel" data-involve-for="${id}">
      ${mk("prd", "PRD")}
      ${mk("ux", "UX")}
      ${mk("ui", "UI")}
    </div>`;
}

function renderAddReqShareTip(id) {
  const tip = addReqModalState.shareTips.get(id);
  if (!tip || !tip.peerCodes || !tip.peerCodes.length) return "";
  const names = tip.peerCodes.map((c) => escapeHtml(c)).join("、");
  return `
    <div class="add-req-share-tip" data-share-for="${id}">
      <p class="add-req-share-tip-text">该 SR/AR 与 ${names} 共享需求文档，建议同步勾选</p>
      <button type="button" class="add-req-share-sync" data-sync-for="${id}" title="同步勾选" aria-label="同步勾选">+</button>
    </div>`;
}

function renderAddReqLeafRow(item, { indentClass, iterName, checkClass }) {
  const { product } = getQueryParams();
  const { row, code, title, added, otherIter } = item;
  const id = row.id;
  const disabled = added;
  const selected = !disabled && addReqModalState.selected.has(id);
  // 文档在 AR：父 SR 勾选态由子 AR 推导，自身不占 selected
  let checked = added || selected;
  if (!added && isSR(row) && srHasChildArDocs(row.id)) {
    const childArs = getAddReqChildArs(row.id, product).filter(
      (ar) => !isReqInIteration(ar, iterName)
    );
    checked =
      childArs.length > 0 &&
      childArs.every((ar) => addReqModalState.selected.has(ar.id));
  }
  const stateCls = [
    added ? "is-added" : "",
    otherIter && !added ? "is-other-iter" : "",
    checked ? "is-checked" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const docTag =
    typeof isDocMarkOwner === "function" && isDocMarkOwner(row)
      ? '<span class="add-req-doc-tag" title="产品文档标打在此节点">文档</span>'
      : typeof reqHasPrdDoc === "function" && reqHasPrdDoc(row)
      ? '<span class="add-req-doc-tag" title="产品文档标打在此节点">文档</span>'
      : "";
  const tag = added
    ? '<span class="add-req-added-tag">已添加</span>'
    : otherIter
      ? `<span class="add-req-added-tag">${escapeHtml(otherIter)}</span>`
      : "";

  // 父 SR 已勾选且以 SR 为落地单位时，子 AR 不单独展开共享提示；
  // 文档在 AR：SR 不占 selected；共享提示挂在各 AR 下
  const parentSrBlocksArInvolve =
    isAR(row) &&
    row.parentId &&
    addReqModalState.selected.has(row.parentId) &&
    !srHasChildArDocs(row.parentId);
  const blockSrInvolve = isSR(row) && srHasChildArDocs(row.id);
  // 涉及阶段统一由需求看板（产品）维护，迭代添加需求不再展示/改写
  let shareHtml = "";
  if (selected && !parentSrBlocksArInvolve && !blockSrInvolve) {
    ensureInvolveState(id, row, iterName);
    shareHtml = renderAddReqShareTip(id);
  }

  return `
    <div class="add-req-leaf ${indentClass}">
      <label class="add-req-sr-row ${stateCls}">
        <input type="checkbox" class="${checkClass}" data-id="${id}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} />
        <span class="add-req-checkbox" aria-hidden="true">
          <img src="assets/icons/add-req-check.svg" alt="" />
        </span>
        <span class="add-req-sr-content">
          <span class="add-req-sr-main">
            <span class="add-req-sr-code">${escapeHtml(code)}</span>
            <span class="add-req-sr-title" title="${escapeHtml(title)}">${escapeHtml(title)}</span>
            ${docTag}
          </span>
          ${tag}
        </span>
      </label>
      ${shareHtml}
    </div>`;
}

function renderAddReqTree() {
  const { product, name } = getQueryParams();
  const tree = document.getElementById("add-req-tree");
  if (!tree) return;

  const groups = getAddReqTreeGroups(product, name, addReqModalState.search);
  if (!groups.length) {
    tree.innerHTML = '<p class="add-req-tree-empty">暂无可添加需求</p>';
    updateAddReqSelectedCount();
    return;
  }

  tree.innerHTML = groups
    .map((g) => {
      const irCollapsed = addReqModalState.collapsedIr.has(g.ir.id);
      const chevron = irCollapsed
        ? "assets/icons/chevron-right.svg"
        : "assets/icons/chevron-down.svg";

      const srsHtml = irCollapsed
        ? ""
        : g.srs
            .map((sr) => {
              const srCollapsed = addReqModalState.collapsedSr.has(sr.row.id);
              const srChevron = srCollapsed
                ? "assets/icons/chevron-right.svg"
                : "assets/icons/chevron-down.svg";
              const hasArs = sr.ars.length > 0;
              const srRowHtml = renderAddReqLeafRow(sr, {
                indentClass: "is-sr",
                iterName: name,
                checkClass: "add-req-leaf-check",
              });
              const arsHtml =
                !hasArs || srCollapsed
                  ? ""
                  : sr.ars
                      .map((ar) =>
                        renderAddReqLeafRow(ar, {
                          indentClass: "is-ar",
                          iterName: name,
                          checkClass: "add-req-leaf-check",
                        })
                      )
                      .join("");

              return `
                <div class="add-req-sr-block" data-sr-id="${sr.row.id}">
                  ${
                    hasArs
                      ? `<button type="button" class="add-req-sr-toggle" data-toggle-sr="${sr.row.id}" aria-label="展开或收起">
                          <img class="add-req-chevron" src="${srChevron}" alt="" />
                        </button>`
                      : ""
                  }
                  ${srRowHtml}
                  ${arsHtml}
                </div>`;
            })
            .join("");

      return `
        <div class="add-req-group" data-ir-id="${g.ir.id}">
          <button type="button" class="add-req-ir-row" data-toggle-ir="${g.ir.id}">
            <img class="add-req-chevron" src="${chevron}" alt="" />
            <img class="add-req-folder" src="assets/icons/add-req-folder.svg" alt="" />
            <span class="add-req-ir-code">${escapeHtml(g.irCode)}</span>
            <span class="add-req-ir-title" title="${escapeHtml(g.irTitle)}">${escapeHtml(g.irTitle)}</span>
            ${
              typeof isDocMarkOwner === "function" && isDocMarkOwner(g.ir)
                ? '<span class="add-req-doc-tag" title="产品文档标打在此节点">文档</span>'
                : typeof reqHasPrdDoc === "function" && reqHasPrdDoc(g.ir)
                ? '<span class="add-req-doc-tag" title="产品文档标打在此节点">文档</span>'
                : ""
            }
          </button>
          ${srsHtml}
        </div>`;
    })
    .join("");

  updateAddReqSelectedCount();
}

function openAddReqModal() {
  const { product, name } = getQueryParams();
  addReqModalState.search = "";
  addReqModalState.collapsedIr = new Set();
  addReqModalState.collapsedSr = new Set();
  addReqModalState.involve = new Map();
  addReqModalState.docSource = new Map();
  addReqModalState.shareTips = new Map();

  const existing = new Set(getIterationRequirements(name, product).map((r) => r.id));
  REQUIREMENTS.forEach((r) => {
    if (r.product !== product) return;
    if (isAR(r) && isReqInIteration(r, name)) existing.add(r.id);
    if (isSR(r) && isSrEffectivelyAdded(r, name, product)) existing.add(r.id);
  });
  addReqModalState.selected = new Set(existing);

  const search = document.getElementById("add-req-search");
  if (search) search.value = "";
  renderAddReqTree();
  document.getElementById("add-req-modal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeAddReqModal() {
  document.getElementById("add-req-modal").hidden = true;
  document.body.classList.remove("modal-open");
}

function applyReqToIteration(row, product, name, iteration, involve, options = {}) {
  const fromIter = row.iteration && String(row.iteration).trim();
  const isTransfer = !!(fromIter && fromIter !== name);
  const silent = !!options.silent;

  if (involve) {
    // 仅显式传入时改写；默认保留需求看板上的 need*
    row.needPrd = !!involve.prd;
    row.needUx = !!involve.ux;
    row.needUi = !!involve.ui;
  }

  const docSrc = addReqModalState.docSource.get(row.id);
  if (docSrc) row.inheritedDocFrom = docSrc;
  else if (row.inheritedDocFrom === undefined) row.inheritedDocFrom = null;

  row.product = product;
  row.iteration = name;
  if (!SCHEDULED_STATUSES.includes(row.status)) row.status = "已排期";
  if (iteration.dates) {
    row.scheduleDates = { ...iteration.dates };
    if (iteration.dates.testEnd) row.deliverMonth = iteration.dates.testEnd.slice(0, 7);
  }
  if (!row.reqCode) {
    row.reqCode = isAR(row)
      ? makeArCode(row.id, row.requestDate)
      : makeSrCode(row.id, row.requestDate);
  }

  if (silent) return;

  const code = row.reqCode;
  if (isTransfer) {
    const fromIterObj = findIteration(fromIter, product);
    pushIterationReqChange(fromIterObj, {
      type: "transfer",
      title: `需求「${row.title}」${code} 转移至 ${name} 迭代`,
      reason: "通过添加需求转入当前迭代",
    });
    pushIterationReqChange(iteration, {
      type: "add",
      title: `转入需求「${row.title}」${code}（来自 ${fromIter}）`,
      reason: "通过添加需求转入",
    });
  } else {
    pushIterationReqChange(iteration, {
      type: "add",
      title: `新增需求「${row.title}」${code}`,
      reason: "迭代排期纳入",
    });
  }
}

function confirmAddReq() {
  const { product, name } = getQueryParams();
  const iteration = findIteration(name, product);
  if (!iteration) return;

  const targets = getAddReqConfirmTargets();
  if (!targets.length) return;

  targets.forEach((row) => {
    // 涉及阶段由需求看板维护，此处不改写 needPrd/Ux/Ui
    applyReqToIteration(row, product, name, iteration, null);

    // 勾选 SR：其下 AR 一并转入；文档来源一并继承
    if (isSR(row)) {
      const parentDoc = addReqModalState.docSource.get(row.id);
      getAddReqChildArs(row.id, product).forEach((ar) => {
        if (parentDoc && !addReqModalState.docSource.has(ar.id)) {
          addReqModalState.docSource.set(ar.id, parentDoc);
        }
        applyReqToIteration(ar, product, name, iteration, null, { silent: true });
      });
    }
  });

  if (typeof syncIrIterationFromSrs === "function") syncIrIterationFromSrs();
  if (typeof rebuildIterationsFromGantt === "function") rebuildIterationsFromGantt();

  closeAddReqModal();
  refreshOverview();
}

function srHasChildArDocs(srId) {
  return typeof getChildArsWithDocs === "function" && getChildArsWithDocs(srId).length > 0;
}

/** 文档在 AR 时：子 AR 已在当前迭代，则父 SR 在添加树中视为已添加（列表仍只展示 AR） */
function isSrEffectivelyAdded(sr, iterName, product) {
  if (isReqInIteration(sr, iterName)) return true;
  if (!srHasChildArDocs(sr.id)) return false;
  const ars = getAddReqChildArs(sr.id, product);
  if (!ars.length) return false;
  return ars.every((ar) => isReqInIteration(ar, iterName));
}

function setAddReqLeafSelected(id, checked, iterName) {
  const row = REQUIREMENTS.find((r) => r.id === id);
  if (!row || isReqInIteration(row, iterName)) return;
  const { product } = getQueryParams();

  // 文档在子 AR：父 SR 只作批量开关，永不进入 selected / 不计个数
  if (isSR(row) && srHasChildArDocs(row.id)) {
    if (isSrEffectivelyAdded(row, iterName, product)) return;
    addReqModalState.selected.delete(row.id);
    addReqModalState.involve.delete(row.id);
    addReqModalState.docSource.delete(row.id);
    addReqModalState.shareTips.delete(row.id);
    getAddReqChildArs(row.id, product).forEach((ar) => {
      if (isReqInIteration(ar, iterName)) return;
      if (checked) {
        selectAddReqLeafQuiet(ar.id, iterName);
        if (reqHasPrdDoc(ar)) {
          addReqModalState.docSource.set(ar.id, ar.id);
          const needs = ensureInvolveState(ar.id, ar, iterName);
          needs.prd = true;
          addReqModalState.involve.set(ar.id, needs);
        }
      } else {
        addReqModalState.selected.delete(ar.id);
        addReqModalState.involve.delete(ar.id);
        addReqModalState.docSource.delete(ar.id);
        addReqModalState.shareTips.delete(ar.id);
      }
    });
    return;
  }

  if (checked) {
    addReqModalState.selected.add(id);
    ensureInvolveState(id, row, iterName);
  } else {
    addReqModalState.selected.delete(id);
    addReqModalState.involve.delete(id);
    addReqModalState.docSource.delete(id);
    addReqModalState.shareTips.delete(id);
  }

  // 勾选 / 取消 SR：同步其下全部 AR
  if (isSR(row)) {
    getAddReqChildArs(row.id, product).forEach((ar) => {
      if (isReqInIteration(ar, iterName)) return;
      if (checked) {
        addReqModalState.selected.add(ar.id);
        ensureInvolveState(ar.id, ar, iterName);
      } else {
        addReqModalState.selected.delete(ar.id);
        addReqModalState.involve.delete(ar.id);
        addReqModalState.docSource.delete(ar.id);
        addReqModalState.shareTips.delete(ar.id);
      }
    });
  }

  // 勾选 AR：同 SR 下全选时，仅当 SR 不是「文档在 AR」场景才勾回父 SR
  if (isAR(row) && row.parentId) {
    const siblings = getAddReqChildArs(row.parentId, product).filter(
      (ar) => !isReqInIteration(ar, iterName)
    );
    const allOn =
      siblings.length > 0 && siblings.every((ar) => addReqModalState.selected.has(ar.id));
    const parent = REQUIREMENTS.find((r) => r.id === row.parentId);
    if (parent && isSR(parent) && !isReqInIteration(parent, iterName)) {
      if (allOn && !srHasChildArDocs(parent.id)) {
        addReqModalState.selected.add(parent.id);
        ensureInvolveState(parent.id, parent, iterName);
      } else {
        addReqModalState.selected.delete(parent.id);
        addReqModalState.involve.delete(parent.id);
        addReqModalState.shareTips.delete(parent.id);
      }
    }
  }

  if (checked) applyDocAssociationRules(row, iterName);
}

function setupAddReqModal() {
  const btn = document.getElementById("btn-add-req");
  if (btn) btn.addEventListener("click", openAddReqModal);

  document.getElementById("add-req-modal-close").addEventListener("click", closeAddReqModal);
  document.getElementById("add-req-modal-cancel").addEventListener("click", closeAddReqModal);
  document.getElementById("add-req-modal-confirm").addEventListener("click", confirmAddReq);
  document.getElementById("add-req-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeAddReqModal();
  });

  document.getElementById("add-req-search").addEventListener("input", (e) => {
    addReqModalState.search = e.target.value || "";
    renderAddReqTree();
  });

  document.getElementById("add-req-tree").addEventListener("click", (e) => {
    const syncBtn = e.target.closest("[data-sync-for]");
    if (syncBtn) {
      e.preventDefault();
      e.stopPropagation();
      const { name } = getQueryParams();
      syncShareTipPeers(Number(syncBtn.dataset.syncFor), name);
      renderAddReqTree();
      return;
    }
    const toggleIr = e.target.closest("[data-toggle-ir]");
    if (toggleIr) {
      const id = Number(toggleIr.dataset.toggleIr);
      if (addReqModalState.collapsedIr.has(id)) addReqModalState.collapsedIr.delete(id);
      else addReqModalState.collapsedIr.add(id);
      renderAddReqTree();
      return;
    }
    const toggleSr = e.target.closest("[data-toggle-sr]");
    if (toggleSr) {
      e.preventDefault();
      const id = Number(toggleSr.dataset.toggleSr);
      if (addReqModalState.collapsedSr.has(id)) addReqModalState.collapsedSr.delete(id);
      else addReqModalState.collapsedSr.add(id);
      renderAddReqTree();
    }
  });

  document.getElementById("add-req-tree").addEventListener("change", (e) => {
    const check = e.target.closest(".add-req-leaf-check");
    if (!check || check.disabled) return;
    const { name } = getQueryParams();
    setAddReqLeafSelected(Number(check.dataset.id), check.checked, name);
    renderAddReqTree();
  });
}

function refreshOverview() {
  const { product, name } = getQueryParams();
  const iteration = findIteration(name, product);
  if (!iteration || !product || !name) return;

  renderDrawer(product, name);

  const dates = iteration.dates;
  const reqs = getIterationRequirements(name, product);
  const status =
    getIterationStatus(iteration) === "未排期" ? "未排期" : getIterationProgressStatus(iteration);

  const badge = document.getElementById("detail-status-badge");
  badge.textContent = status;
  badge.className = `iter-detail-status-badge ${statusBadgeClass(status)}`;
  document.getElementById("detail-meta-tags").innerHTML = renderMetaTags(product, name);

  const tbody = document.getElementById("detail-req-tbody");
  if (!reqs.length) {
    tbody.innerHTML = `<tr><td class="empty-row" colspan="10">暂无所属需求</td></tr>`;
  } else {
    tbody.innerHTML = reqs.map((r, i) => renderReqRow(r, i % 2 === 1)).join("");
  }

  document.getElementById("detail-phases-timeline").innerHTML = renderPhasesTimeline(iteration, dates);
  document.getElementById("detail-dev-tbody").innerHTML = renderDevRows(reqs);
  document.getElementById("detail-test-tbody").innerHTML = renderTestRows(reqs);
  updateInfoMoreButtons(reqs);
  document.getElementById("detail-apk-grid").innerHTML = renderApkInfo();
  refreshChangelog();
}

const CHANGELOG_TYPE_META = {
  add: { label: "新增", cls: "is-add" },
  transfer: { label: "转移", cls: "is-transfer" },
  delete: { label: "删除", cls: "is-delete" },
};

function renderChangelogTimeline(entries) {
  if (!entries.length) {
    return '<p class="iter-detail-empty-inline">暂无需求变更记录</p>';
  }
  return entries
    .map((entry, index) => {
      const meta = CHANGELOG_TYPE_META[entry.type] || { label: entry.type || "变更", cls: "is-add" };
      const isLast = index === entries.length - 1;
      return `
        <div class="iter-changelog-entry">
          <div class="iter-changelog-time">${escapeHtml(entry.time || "")}</div>
          <div class="iter-changelog-rail">
            <span class="iter-changelog-dot ${meta.cls}" aria-hidden="true"></span>
            ${isLast ? "" : '<span class="iter-changelog-line" aria-hidden="true"></span>'}
          </div>
          <div class="iter-changelog-body">
            <div class="iter-changelog-head">
              <span class="iter-changelog-type ${meta.cls}">${escapeHtml(meta.label)}</span>
              <p class="iter-changelog-title">${escapeHtml(entry.title || "")}</p>
            </div>
            <div class="iter-changelog-reason">变更原因：${escapeHtml(entry.reason || "—")}</div>
          </div>
        </div>`;
    })
    .join("");
}

function renderScheduleChangelogTimeline(entries) {
  if (!entries.length) {
    return '<p class="iter-detail-empty-inline">暂无排期变更记录</p>';
  }
  return entries
    .map((entry, index) => {
      const isLast = index === entries.length - 1;
      return `
        <div class="iter-changelog-entry">
          <div class="iter-changelog-time">${escapeHtml(entry.time || "")}</div>
          <div class="iter-changelog-rail">
            <span class="iter-changelog-dot is-add" aria-hidden="true"></span>
            ${isLast ? "" : '<span class="iter-changelog-line" aria-hidden="true"></span>'}
          </div>
          <div class="iter-changelog-body${isLast ? " is-last" : ""}">
            <div class="iter-changelog-head">
              <span class="iter-changelog-type is-add">变更</span>
              <p class="iter-changelog-title is-schedule">${escapeHtml(entry.title || "")}</p>
            </div>
            <div class="iter-changelog-reason is-schedule-reason">
              <span class="iter-changelog-reason-label">变更原因：</span>${escapeHtml(entry.reason || "—")}
            </div>
          </div>
        </div>`;
    })
    .join("");
}

function renderOverdueRows(rows) {
  if (!rows.length) {
    return `<tr><td class="empty-row" colspan="4">暂无超期记录</td></tr>`;
  }
  return rows
    .map((row) => {
      const actualCls =
        row.actualKind === "running"
          ? "is-running"
          : row.actualKind === "done-late" || row.actualKind === "late"
            ? "is-late"
            : "";
      const actualExtra =
        row.actualKind === "running"
          ? '<span class="iter-overdue-actual-dot" aria-hidden="true"></span>'
          : "";
      return `
        <tr class="iter-overdue-row">
          <td class="col-ov-item">${escapeHtml(row.phase || "—")}</td>
          <td class="col-ov-plan">${escapeHtml(row.plan || "—")}</td>
          <td class="col-ov-actual">
            <span class="iter-overdue-actual ${actualCls}">${escapeHtml(row.actual || "—")}${actualExtra}</span>
          </td>
          <td class="col-ov-days">
            <span class="iter-overdue-days-badge">${escapeHtml(row.daysLabel || "—")}</span>
          </td>
        </tr>`;
    })
    .join("");
}

function refreshChangelog() {
  const { product, name } = getQueryParams();
  const iteration = findIteration(name, product);
  const timeline = document.getElementById("detail-changelog-timeline");
  const scheduleTimeline = document.getElementById("detail-schedule-changelog-timeline");
  const overdueBody = document.getElementById("detail-overdue-tbody");
  const countBadge = document.getElementById("detail-overdue-count");
  if (!timeline || !overdueBody) return;

  if (!iteration) {
    timeline.innerHTML = '<p class="iter-detail-empty-inline">暂无需求变更记录</p>';
    if (scheduleTimeline) scheduleTimeline.innerHTML = '<p class="iter-detail-empty-inline">暂无排期变更记录</p>';
    overdueBody.innerHTML = `<tr><td class="empty-row" colspan="4">暂无超期记录</td></tr>`;
    if (countBadge) countBadge.hidden = true;
    return;
  }

  const filter = document.getElementById("changelog-type-filter")?.value || "all";
  let entries = getIterationReqChangeLog(iteration);
  if (filter !== "all") entries = entries.filter((e) => e.type === filter);
  timeline.innerHTML = renderChangelogTimeline(entries);

  if (scheduleTimeline) {
    const scheduleEntries =
      typeof getIterationScheduleChangeLog === "function"
        ? getIterationScheduleChangeLog(iteration)
        : [];
    scheduleTimeline.innerHTML = renderScheduleChangelogTimeline(scheduleEntries);
  }

  const overdue = getIterationOverdueRecords(iteration);
  overdueBody.innerHTML = renderOverdueRows(overdue);
  if (countBadge) {
    if (overdue.length) {
      countBadge.hidden = false;
      countBadge.textContent = `共 ${overdue.length} 项超期`;
    } else {
      countBadge.hidden = true;
    }
  }
}

function setDetailTab(tab) {
  const next = tab === "changelog" ? "changelog" : "overview";
  document.querySelectorAll(".iter-detail-tab").forEach((btn) => {
    const on = btn.dataset.tab === next;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  const overview = document.getElementById("panel-overview");
  const changelog = document.getElementById("panel-changelog");
  if (overview) overview.hidden = next !== "overview";
  if (changelog) changelog.hidden = next !== "changelog";
  if (next === "changelog") refreshChangelog();
}

function setupDetailTabs() {
  document.querySelectorAll(".iter-detail-tab").forEach((btn) => {
    btn.addEventListener("click", () => setDetailTab(btn.dataset.tab));
  });

  const filterBtn = document.getElementById("changelog-type-filter-btn");
  const filterMenu = document.getElementById("changelog-type-filter-menu");
  const filterHidden = document.getElementById("changelog-type-filter");
  const filterText = document.getElementById("changelog-type-filter-text");
  if (!filterBtn || !filterMenu || !filterHidden) return;

  filterBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = filterMenu.hidden;
    filterMenu.hidden = !open;
    filterBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  filterMenu.addEventListener("click", (e) => {
    const option = e.target.closest("button[data-value]");
    if (!option) return;
    filterHidden.value = option.dataset.value;
    filterText.textContent = option.textContent.trim();
    filterMenu.querySelectorAll("button").forEach((b) => b.classList.toggle("selected", b === option));
    filterMenu.hidden = true;
    filterBtn.setAttribute("aria-expanded", "false");
    refreshChangelog();
  });

  document.addEventListener("click", (e) => {
    if (!filterMenu.hidden && !e.target.closest("#changelog-type-filter-wrap")) {
      filterMenu.hidden = true;
      filterBtn.setAttribute("aria-expanded", "false");
    }
  });
}

function renderPage() {
  const { product, name } = getQueryParams();
  const iteration = findIteration(name, product);
  const main = document.getElementById("detail-main");

  modalState.productContext = product;
  modalState.currentName = name;

  const drawerOpen = isDrawerOpenFromQuery();
  if (!drawerOpen) setDrawerOpenStored(false);
  setupDrawerToggle(!drawerOpen);
  setupCreateModal();
  setupDeleteReqModal();
  setupTransferReqModal();
  setupRemindReqModal();
  setupEditScheduleModal();
  setupAddReqModal();
  setupInfoMoreModal();
  setupDetailTabs();

  if (!iteration || !product || !name) {
    renderDrawer(product, name);
    main.innerHTML =
      '<div class="iter-detail-empty">未找到该迭代，<a href="iterations.html">返回迭代管理</a></div>';
    return;
  }

  document.title = `${name} - 迭代详情`;
  document.getElementById("detail-breadcrumb-name").textContent = name;
  document.getElementById("detail-iter-name").innerHTML = isIterationOverdueCompleted(iteration)
    ? `${escapeHtml(name)}<span class="iter-overdue-tag">超期完成</span>`
    : escapeHtml(name);

  const dates = iteration.dates;
  const startDate = (dates && dates.prdStart) || "";
  const endDate = (dates && dates.testEnd) || "";
  document.getElementById("detail-date-range").textContent =
    startDate && endDate ? `${startDate} 至 ${endDate}` : "未排期";

  refreshOverview();
}

renderPage();
