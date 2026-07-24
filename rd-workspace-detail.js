const RD_WORK_STATUSES = ["未开始", "进行中", "已完成", "已超期"];
const INFO_PREVIEW_LIMIT = 3;
const DRAWER_STORAGE_KEY = "rd-detail-drawer-open";

const pageState = {
  product: "",
  name: "",
  reqSearch: "",
};

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

function isDrawerOpenFromQuery() {
  const { drawer } = getQueryParams();
  return String(drawer).toLowerCase() === "open" || drawer === "1";
}

function syncDrawerQuery(open) {
  const url = new URL(window.location.href);
  if (open) url.searchParams.set("drawer", "open");
  else url.searchParams.delete("drawer");
  window.history.replaceState(null, "", url);
}

function isDrawerCurrentlyOpen() {
  const page = document.querySelector(".rd-detail-page");
  return !!(page && !page.classList.contains("is-drawer-collapsed"));
}

function setupDrawerToggle(collapsed) {
  const page = document.querySelector(".rd-detail-page");
  if (!page) return;
  page.classList.toggle("is-drawer-collapsed", !!collapsed);
  syncDrawerQuery(!collapsed);
  try {
    if (collapsed) sessionStorage.removeItem(DRAWER_STORAGE_KEY);
    else sessionStorage.setItem(DRAWER_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

function statusBadgeClass(status) {
  if (status === "已完成") return "is-done";
  if (status === "进行中") return "is-running";
  if (status === "已超期") return "is-overdue";
  if (status === "部分完成") return "is-partial";
  return "is-pending";
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

function linkOrDash(url, { underline = false } = {}) {
  const val = url && String(url).trim();
  if (!val) return `<span class="iter-detail-cell-muted">-</span>`;
  const cls = underline ? "iter-detail-cell-link is-underline" : "iter-detail-cell-link";
  return `<a class="${cls}" href="${escapeHtml(val)}" target="_blank" rel="noopener">${escapeHtml(val)}</a>`;
}

function renderValueCell(isValue) {
  return `<span class="${isValue ? "value-yes" : "value-no"}">${isValue ? "是" : "否"}</span>`;
}

function getReqCode(row) {
  if (row.reqCode) return row.reqCode;
  if (typeof isAR === "function" && isAR(row)) return makeArCode(row.id, row.requestDate);
  if (typeof isSR === "function" && isSR(row)) return makeSrCode(row.id, row.requestDate);
  return makeReqCode(row.id, row.requestDate);
}

function renderReqNameCell(row, cellClass) {
  const code = getReqCode(row);
  return `
    <td class="${cellClass} rd-req-name-cell">
      <div class="rd-req-name-title" title="${escapeHtml(row.title)}">${escapeHtml(row.title || "-")}</div>
      <div class="rd-req-name-code">${escapeHtml(code)}</div>
    </td>`;
}

function getAiPrdLabel(row) {
  const docs =
    typeof resolvePrdDocsForDisplay === "function"
      ? resolvePrdDocsForDisplay(row)
      : { aiPrdFiles: row.aiPrdFiles || [], attachments: row.attachments || [] };
  const file = (docs.aiPrdFiles && docs.aiPrdFiles[0]) || (docs.attachments && docs.attachments[0]);
  return file && file.name ? file.name : "";
}

function renderAiPrdCell(row) {
  const label = getAiPrdLabel(row);
  if (!label) return `<span class="iter-detail-cell-muted">-</span>`;
  return `<span class="iter-detail-file-chip"><span class="iter-detail-file-name">${escapeHtml(label)}</span></span>`;
}

function renderPrdCell(row) {
  if (row.needPrd === false) return `<span class="iter-detail-cell-muted">不涉及</span>`;
  const docs =
    typeof resolvePrdDocsForDisplay === "function"
      ? resolvePrdDocsForDisplay(row)
      : { prdUrl: row.prdUrl || "" };
  if (docs.prdUrl && String(docs.prdUrl).trim()) return linkOrDash(docs.prdUrl, { underline: true });
  return `<span class="iter-detail-cell-muted">-</span>`;
}

function getAiPrdFeedbackText(row) {
  if (row.aiPrdFeedback && String(row.aiPrdFeedback).trim()) return String(row.aiPrdFeedback).trim();
  if (typeof getAiPrdFeedbacks === "function") {
    const list = getAiPrdFeedbacks(row) || [];
    if (list.length && list[0].content) return String(list[0].content).split("\n")[0].trim();
  }
  return "";
}

function renderReqRow(row, striped) {
  const design =
    typeof resolveUxUiForDisplay === "function"
      ? resolveUxUiForDisplay(row)
      : { needUx: row.needUx !== false, needUi: row.needUi !== false, uxUrl: row.uxUrl || "", uiUrl: row.uiUrl || "" };
  const uxUrl = design.needUx === false ? "" : design.uxUrl || "";
  const uiUrl = design.needUi === false ? "" : design.uiUrl || "";

  return `
    <tr class="${striped ? "is-striped" : ""}">
      ${renderReqNameCell(row, "col-name")}
      <td class="col-value">${renderValueCell(!!row.isValue)}</td>
      <td class="col-priority">${escapeHtml(row.priority || "-")}</td>
      <td class="col-type"><span class="iter-detail-type-badge ${landingTypeClass(row.type)}">${escapeHtml(landingTypeLabel(row.type))}</span></td>
      <td class="col-version">${escapeHtml(row.version || "-")}</td>
      <td class="col-prd">${renderPrdCell(row)}</td>
      <td class="col-ai-prd">${renderAiPrdCell(row)}</td>
      <td class="col-ai-demo">${linkOrDash(row.aiDemoUrl, { underline: true })}</td>
      <td class="col-ai-track">${linkOrDash(row.aiTrackUrl, { underline: true })}</td>
      <td class="col-ux">${uxUrl ? linkOrDash(uxUrl) : '<span class="iter-detail-cell-muted">-</span>'}</td>
      <td class="col-ui">${uiUrl ? linkOrDash(uiUrl) : '<span class="iter-detail-cell-muted">-</span>'}</td>
    </tr>`;
}

function filterReqs(reqs) {
  const q = pageState.reqSearch.trim().toLowerCase();
  if (!q) return reqs;
  return reqs.filter((r) => {
    const code = getReqCode(r).toLowerCase();
    const title = String(r.title || "").toLowerCase();
    return title.includes(q) || code.includes(q);
  });
}

function getDevRowData(reqs) {
  return reqs.filter(
    (r) =>
      (r.testBuildUrl && String(r.testBuildUrl).trim()) ||
      (r.testSubmitVersion && String(r.testSubmitVersion).trim()) ||
      (r.testAdvice && String(r.testAdvice).trim())
  );
}

function getTestRowData(reqs) {
  return reqs.filter(
    (r) =>
      (r.testReportUrl && String(r.testReportUrl).trim()) ||
      (r.testConclusion && String(r.testConclusion).trim()) ||
      r.testPhaseStatus === "已完成" ||
      r.testPhaseStatus === "进行中" ||
      r.status === "测试中"
  );
}

function getReqDevStatus(r) {
  if (r && r.devPhaseStatus) return normalizeRdWorkStatus(r.devPhaseStatus);
  if (r && r.testBuildUrl && String(r.testBuildUrl).trim()) return "已完成";
  if (r && (r.status === "开发中" || r.status === "测试中")) return "进行中";
  return "未开始";
}

function getReqTestStatus(r) {
  if (r && r.testPhaseStatus) return normalizeRdWorkStatus(r.testPhaseStatus);
  if (r && ((r.testReportUrl && String(r.testReportUrl).trim()) || (r.testConclusion && String(r.testConclusion).trim()))) {
    return "已完成";
  }
  if (r && r.status === "测试中") return "进行中";
  return "未开始";
}

function getWorkRowData(reqs) {
  const map = new Map();
  getDevRowData(reqs).forEach((r) => map.set(r.id, r));
  getTestRowData(reqs).forEach((r) => map.set(r.id, r));
  // 一对一：优先按迭代需求顺序展示
  const ordered = [];
  const seen = new Set();
  reqs.forEach((r) => {
    if (map.has(r.id) && !seen.has(r.id)) {
      ordered.push(r);
      seen.add(r.id);
    }
  });
  map.forEach((r, id) => {
    if (!seen.has(id)) ordered.push(r);
  });
  return ordered;
}

function renderStatusCell(kind, status, reqId) {
  return `
    <td class="col-work-${kind}-st">
      <div class="filter-btn-wrap rd-status-wrap rd-row-status-wrap">
        <button type="button" class="iter-detail-status-badge rd-status-btn ${statusBadgeClass(status)}" data-status-kind="${kind}" data-req-id="${reqId}" aria-haspopup="listbox" aria-expanded="false">
          <span>${escapeHtml(status)}</span>
          <img src="assets/icons/chevron-down.svg" alt="" width="10" height="10" />
        </button>
      </div>
    </td>`;
}

function testConclusionBadge(row) {
  const conclusion = (row.testConclusion && String(row.testConclusion).trim()) || "";
  if (conclusion) {
    const upper = conclusion.toUpperCase();
    const cls = upper.includes("FAIL") || upper.includes("不通过") ? "is-fail" : "is-pass";
    return `<span class="iter-detail-result-badge ${cls}">${escapeHtml(conclusion)}</span>`;
  }
  if (row.testPhaseStatus === "已完成" || (row.testReportUrl && String(row.testReportUrl).trim())) {
    return `<span class="iter-detail-result-badge is-pass">PASS</span>`;
  }
  if (row.testPhaseStatus === "进行中" || row.status === "测试中") {
    return `<span class="iter-detail-result-badge is-running">进行中</span>`;
  }
  return `<span class="iter-detail-cell-muted">-</span>`;
}

function renderWorkRows(reqs, limit) {
  const rows = getWorkRowData(reqs);
  if (!rows.length) return `<tr><td class="empty-row" colspan="10">暂无研测记录</td></tr>`;
  const list = limit != null ? rows.slice(0, limit) : rows;
  return list
    .map((r) => {
      const report = r.testReportUrl && String(r.testReportUrl).trim();
      const note = (r.testRemark && String(r.testRemark).trim()) || "";
      const advice = (r.testAdvice && String(r.testAdvice).trim()) || "";
      return `
    <tr data-req-id="${r.id}">
      ${renderReqNameCell(r, "col-work-req")}
      ${renderStatusCell("dev", getReqDevStatus(r), r.id)}
      <td class="col-work-ver">${escapeHtml(r.testSubmitVersion || r.version || "-")}</td>
      <td class="col-work-link">${linkOrDash(r.testBuildUrl, { underline: true })}</td>
      <td class="col-work-owner">${escapeHtml(r.testSubmitter || r.owner || "-")}</td>
      <td class="col-work-advice" title="${escapeHtml(advice)}">${advice ? escapeHtml(advice) : '<span class="iter-detail-cell-muted">-</span>'}</td>
      ${renderStatusCell("test", getReqTestStatus(r), r.id)}
      <td class="col-work-result">${testConclusionBadge(r)}</td>
      <td class="col-work-report">${report ? linkOrDash(report, { underline: true }) : '<span class="iter-detail-cell-muted">-</span>'}</td>
      <td class="col-work-note" title="${escapeHtml(note)}">${note ? escapeHtml(note) : '<span class="iter-detail-cell-muted">-</span>'}</td>
    </tr>`;
    })
    .join("");
}

function updateInfoMoreButtons(reqs) {
  const btn = document.getElementById("detail-work-more-btn");
  if (btn) btn.hidden = getWorkRowData(reqs).length <= INFO_PREVIEW_LIMIT;
}

function syncIterationStatusFromReqs(iteration, reqs) {
  if (!iteration || !reqs.length) return;
  const workReqs = getWorkRowData(reqs);
  const source = workReqs.length ? workReqs : reqs;
  const devStatuses = source.map(getReqDevStatus);
  const testStatuses = source.map(getReqTestStatus);
  const pick = (list) => {
    if (list.every((s) => s === "已完成")) return "已完成";
    if (list.some((s) => s === "已超期")) return "已超期";
    if (list.some((s) => s === "进行中" || s === "已完成")) return "进行中";
    return "未开始";
  };
  iteration.rdDevStatus = pick(devStatuses);
  iteration.rdTestStatus = pick(testStatuses);
}

function renderHeaderSchedule(iteration) {
  const dates = (iteration && iteration.dates) || {};
  const items = [
    { label: "开发", start: dates.devStart, end: dates.devEnd },
    { label: "测试", start: dates.testStart, end: dates.testEnd },
  ];
  const parts = items
    .map((item) => {
      const range =
        item.start && item.end ? `${item.start} ~ ${item.end}` : item.start || item.end || "未排期";
      return `<span class="rd-detail-header-schedule-item"><span class="rd-detail-header-schedule-label">${escapeHtml(item.label)}</span>${escapeHtml(range)}</span>`;
    })
    .join('<span class="rd-detail-header-schedule-sep">·</span>');
  return parts || `<span class="rd-detail-header-schedule-item">未排期</span>`;
}

function renderApkInfo(iteration) {
  const metrics = getRdWorkspaceMetrics(iteration);
  return `
    <div class="iter-detail-apk-item">
      <span class="iter-detail-apk-label">APK 链接</span>
      ${linkOrDash(metrics.apkUrl, { underline: true })}
    </div>
    <div class="iter-detail-apk-item">
      <span class="iter-detail-apk-label">APK 版本号</span>
      <span>${escapeHtml(metrics.apkVersion)}</span>
    </div>
    <div class="iter-detail-apk-item">
      <span class="iter-detail-apk-label">DI 解决率</span>
      <span class="rd-detail-di-rate">${escapeHtml(String(metrics.diRate))}%</span>
    </div>`;
}

function renderMetaTags(product) {
  return `<span class="iter-detail-product-tag">${escapeHtml(product)}</span>`;
}

function getProductIterations(product) {
  return ITERATIONS.filter((it) => it.product === product)
    .slice()
    .sort((a, b) => iterationNum(b.name) - iterationNum(a.name));
}

function getLatestIterationForProduct(product) {
  const list = getProductIterations(product);
  return list[0] || null;
}

function getDrawerProducts() {
  const fromBoard = [...new Set(ITERATIONS.map((it) => it.product).filter(Boolean))];
  const fromCatalog = Object.keys(PRODUCT_ITERATION_OFFSETS || {});
  return [...new Set([...fromBoard, ...fromCatalog])].sort((a, b) => a.localeCompare(b, "zh"));
}

function drawerStatusBadge(status) {
  return `<span class="iter-drawer-status ${statusBadgeClass(status)}">${escapeHtml(status)}</span>`;
}

function formatDrawerRange(dates) {
  if (!dates || !dates.devStart || !dates.testEnd) {
    if (!dates || !dates.prdStart || !dates.testEnd) return "未排期";
    return `${dates.prdStart} 至 ${dates.testEnd}`;
  }
  return `${dates.devStart} 至 ${dates.testEnd}`;
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
  menu.innerHTML = getDrawerProducts()
    .map((p) => {
      const active = p === currentProduct;
      return `<button type="button" class="iter-drawer-product-option${active ? " is-active" : ""}" data-product="${escapeHtml(p)}" role="option">${escapeHtml(p)}</button>`;
    })
    .join("");
}

function switchDrawerProduct(product) {
  if (!product || product === pageState.product) {
    closeDrawerProductMenu();
    return;
  }
  const latest = getLatestIterationForProduct(product);
  const params = new URLSearchParams();
  params.set("product", product);
  if (latest) params.set("name", latest.name);
  params.set("drawer", "open");
  window.location.href = `rd-workspace-detail.html?${params.toString()}`;
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
      const status = getRdIterationDevStatus(it);
      const drawerParam = isDrawerCurrentlyOpen() ? "&drawer=open" : "";
      const href = `rd-workspace-detail.html?product=${encodeURIComponent(product)}&name=${encodeURIComponent(it.name)}${drawerParam}`;
      const chevron = active
        ? "assets/icons/chevron-right-active.svg"
        : "assets/icons/chevron-right.svg";
      return `
        <a class="iter-drawer-item${active ? " is-active" : ""}" href="${href}" ${active ? 'aria-current="page"' : ""}>
          <div class="iter-drawer-item-main">
            <div class="iter-drawer-item-name-row">
              <span class="iter-drawer-item-name">${escapeHtml(it.name)} 迭代</span>
              ${drawerStatusBadge(status)}
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
      renderDrawerProductMenu(pageState.product);
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
    if (!e.target.closest("#drawer-product-wrap")) closeDrawerProductMenu();
  });
}

function setupDrawerChrome() {
  document.getElementById("drawer-collapse-btn").addEventListener("click", () => {
    setupDrawerToggle(true);
  });
  document.getElementById("drawer-expand-btn").addEventListener("click", () => {
    setupDrawerToggle(false);
  });
  setupDrawerProductSwitch();
}

function closeAllStatusMenus() {
  document.querySelectorAll(".rd-row-status-menu").forEach((el) => el.remove());
  document.querySelectorAll(".rd-status-btn[aria-expanded='true']").forEach((btn) => {
    btn.setAttribute("aria-expanded", "false");
  });
}

function findReqById(id) {
  return getIterationRequirements(pageState.name, pageState.product).find((r) => r.id === Number(id));
}

function applyReqStatus(kind, reqId, value) {
  const row = findReqById(reqId);
  if (!row) return false;
  if (kind === "dev") {
    if (value === "已完成") {
      if (!row.testBuildUrl || !String(row.testBuildUrl).trim()) {
        alert("标记开发完成前，需先填写提测版本 / 提测链接（可使用一键转测）");
        return false;
      }
      if (getAiPrdLabel(row) && !getAiPrdFeedbackText(row)) {
        alert("该需求有 AI PRD，请先填写反馈后再标记开发完成");
        return false;
      }
    }
    row.devPhaseStatus = value;
  } else {
    if (value === "已完成") {
      const hasConclusion = row.testConclusion && String(row.testConclusion).trim();
      const hasReport = row.testReportUrl && String(row.testReportUrl).trim();
      if (!hasConclusion && !hasReport) {
        alert("标记测试完成前，需填写测试结论或测试报告");
        return false;
      }
    }
    row.testPhaseStatus = value;
  }
  const iteration = findIteration(pageState.name, pageState.product);
  const reqs = getIterationRequirements(pageState.name, pageState.product);
  syncIterationStatusFromReqs(iteration, reqs);
  return true;
}

function setupStatusDropdowns() {
  const bindHost = (host) => {
    if (!host || host.dataset.statusBound === "1") return;
    host.dataset.statusBound = "1";
    host.addEventListener("click", (e) => {
      const btn = e.target.closest(".rd-status-btn[data-status-kind]");
      if (!btn) return;
      e.stopPropagation();
      const kind = btn.dataset.statusKind;
      const reqId = btn.dataset.reqId;
      const wrap = btn.closest(".rd-status-wrap");
      if (!wrap) return;
      const willOpen = btn.getAttribute("aria-expanded") !== "true";
      closeAllStatusMenus();
      if (!willOpen) return;
      const current = btn.querySelector("span")?.textContent || "";
      const menu = document.createElement("div");
      menu.className = "dropdown rd-status-dropdown rd-row-status-menu";
      menu.innerHTML = RD_WORK_STATUSES.map(
        (s) =>
          `<button type="button" class="${s === current ? "selected" : ""}" data-value="${escapeHtml(s)}">${escapeHtml(s)}</button>`
      ).join("");
      wrap.appendChild(menu);
      btn.setAttribute("aria-expanded", "true");
      menu.addEventListener("click", (ev) => {
        const opt = ev.target.closest("button[data-value]");
        if (!opt) return;
        ev.stopPropagation();
        if (applyReqStatus(kind, reqId, opt.dataset.value)) {
          closeAllStatusMenus();
          refreshOverview();
        }
      });
    });
  };

  bindHost(document.getElementById("detail-work-tbody"));
  bindHost(document.getElementById("rd-info-more-tbody"));
  document.addEventListener("click", () => closeAllStatusMenus());
}

function getOwnerOptions() {
  const names = new Set();
  REQUIREMENTS.forEach((r) => {
    if (r.owner) names.add(r.owner);
  });
  ["张伟", "李明", "王芳", "黄志阳"].forEach((n) => names.add(n));
  return [...names];
}

function getCheckedSubmitReqs() {
  const checked = [...document.querySelectorAll("#rd-submit-req-list input[type=checkbox]:checked")];
  const ids = new Set(checked.map((c) => Number(c.dataset.id)));
  return getIterationRequirements(pageState.name, pageState.product).filter((r) => ids.has(r.id));
}

function checkedSubmitHasAiPrd() {
  return getCheckedSubmitReqs().some((r) => !!getAiPrdLabel(r));
}

function updateSubmitFeedbackRequired() {
  const need = checkedSubmitHasAiPrd();
  const reqMark = document.getElementById("rd-submit-feedback-req");
  const field = document.getElementById("rd-submit-feedback-field");
  const input = document.getElementById("rd-submit-feedback");
  if (reqMark) reqMark.hidden = !need;
  if (field) field.classList.toggle("is-required", need);
  if (input) {
    input.placeholder = need ? "含 AI PRD 的需求必填反馈" : "勾选需求含 AI PRD 时必填";
    input.classList.toggle("field-error", false);
  }
}

function applyAiPrdFeedback(row, content, owner) {
  const text = String(content || "").trim();
  if (!text || !getAiPrdLabel(row)) return;
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const time = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  if (!Array.isArray(row.aiPrdFeedbacks)) row.aiPrdFeedbacks = [];
  row.aiPrdFeedbacks.unshift({
    name: owner || "研发",
    role: "研发",
    time,
    content: text,
  });
  if (typeof syncAiPrdFeedbackSummary === "function") syncAiPrdFeedbackSummary(row);
  else row.aiPrdFeedback = text.split("\n")[0].trim();
}

function openSubmitModal() {
  const modal = document.getElementById("rd-submit-modal");
  const reqs = getIterationRequirements(pageState.name, pageState.product);
  const list = document.getElementById("rd-submit-req-list");
  list.innerHTML = reqs.length
    ? reqs
        .map((r) => {
          const done = r.testBuildUrl && String(r.testBuildUrl).trim();
          const hasAi = !!getAiPrdLabel(r);
          return `
          <label class="rd-submit-req-item">
            <input type="checkbox" data-id="${r.id}" data-has-ai-prd="${hasAi ? "1" : "0"}" ${done ? "" : "checked"} />
            <span class="rd-submit-req-title">${escapeHtml(r.title)}</span>
            ${hasAi ? '<span class="rd-submit-ai-tag">AI PRD</span>' : ""}
            <span class="rd-submit-req-code">${escapeHtml(getReqCode(r))}</span>
          </label>`;
        })
        .join("")
    : '<p class="iter-detail-empty-inline">当前迭代暂无需求</p>';

  const metrics = getRdWorkspaceMetrics(findIteration(pageState.name, pageState.product));
  document.getElementById("rd-submit-version").value = metrics.apkVersion || "";
  document.getElementById("rd-submit-link").value = "";
  document.getElementById("rd-submit-note").value = "";
  document.getElementById("rd-submit-feedback").value = "";
  document.getElementById("rd-submit-owner").value = "";
  const text = document.getElementById("rd-submit-owner-text");
  text.textContent = text.dataset.placeholder;
  text.classList.add("placeholder");
  updateSubmitFeedbackRequired();
  modal.hidden = false;
}

function closeSubmitModal() {
  document.getElementById("rd-submit-modal").hidden = true;
  document.getElementById("rd-submit-owner-menu").hidden = true;
}

function setupSubmitModal() {
  document.getElementById("btn-rd-submit-test").addEventListener("click", openSubmitModal);
  document.getElementById("rd-submit-modal-close").addEventListener("click", closeSubmitModal);
  document.getElementById("rd-submit-modal-cancel").addEventListener("click", closeSubmitModal);
  document.getElementById("rd-submit-modal").addEventListener("click", (e) => {
    if (e.target.id === "rd-submit-modal") closeSubmitModal();
  });

  document.getElementById("rd-submit-req-list").addEventListener("change", (e) => {
    if (!e.target.matches('input[type="checkbox"]')) return;
    updateSubmitFeedbackRequired();
  });

  const ownerBtn = document.getElementById("rd-submit-owner-btn");
  const ownerMenu = document.getElementById("rd-submit-owner-menu");
  ownerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const current = document.getElementById("rd-submit-owner").value;
    ownerMenu.innerHTML = getOwnerOptions()
      .map(
        (o) =>
          `<button type="button" class="${o === current ? "selected" : ""}" data-value="${escapeHtml(o)}">${escapeHtml(o)}</button>`
      )
      .join("");
    ownerMenu.hidden = !ownerMenu.hidden;
  });
  ownerMenu.addEventListener("click", (e) => {
    const opt = e.target.closest("button[data-value]");
    if (!opt) return;
    document.getElementById("rd-submit-owner").value = opt.dataset.value;
    const text = document.getElementById("rd-submit-owner-text");
    text.textContent = opt.dataset.value;
    text.classList.remove("placeholder");
    ownerMenu.hidden = true;
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#rd-submit-owner-wrap")) ownerMenu.hidden = true;
  });

  document.getElementById("rd-submit-modal-save").addEventListener("click", () => {
    const checked = [...document.querySelectorAll("#rd-submit-req-list input[type=checkbox]:checked")];
    const version = document.getElementById("rd-submit-version").value.trim();
    const link = document.getElementById("rd-submit-link").value.trim();
    const owner = document.getElementById("rd-submit-owner").value.trim();
    const note = document.getElementById("rd-submit-note").value.trim();
    const feedback = document.getElementById("rd-submit-feedback").value.trim();
    const feedbackInput = document.getElementById("rd-submit-feedback");

    if (!checked.length) {
      alert("请至少勾选一条需求");
      return;
    }
    if (!version) {
      alert("请填写提测版本");
      return;
    }
    if (!link) {
      alert("请填写提测链接");
      return;
    }
    if (!owner) {
      alert("请选择提测人");
      return;
    }

    const selected = getCheckedSubmitReqs();
    const aiPrdReqs = selected.filter((r) => !!getAiPrdLabel(r));
    if (aiPrdReqs.length && !feedback) {
      feedbackInput.classList.add("field-error");
      alert("勾选需求包含 AI PRD，请填写「对 AI PRD 的反馈」");
      feedbackInput.focus();
      return;
    }
    feedbackInput.classList.remove("field-error");

    const ids = new Set(checked.map((c) => Number(c.dataset.id)));
    const reqs = getIterationRequirements(pageState.name, pageState.product);
    let count = 0;
    reqs.forEach((r) => {
      if (!ids.has(r.id)) return;
      r.testSubmitVersion = version;
      r.testBuildUrl = link;
      r.testSubmitter = owner;
      r.testAdvice = note;
      if (feedback && getAiPrdLabel(r)) applyAiPrdFeedback(r, feedback, owner);
      r.devPhaseStatus = "已完成";
      if (!r.testPhaseStatus || r.testPhaseStatus === "未开始") r.testPhaseStatus = "进行中";
      if (r.status === "开发中" || r.status === "已排期") r.status = "测试中";
      count += 1;
    });

    const iteration = findIteration(pageState.name, pageState.product);
    if (iteration) {
      iteration.rdDevStatus = "已完成";
      if (!iteration.rdTestStatus || iteration.rdTestStatus === "未开始") {
        iteration.rdTestStatus = "进行中";
      }
    }

    closeSubmitModal();
    refreshOverview();
  });
}

function openInfoMore() {
  const reqs = getIterationRequirements(pageState.name, pageState.product);
  document.getElementById("rd-info-more-tbody").innerHTML = renderWorkRows(reqs);
  document.getElementById("rd-info-more-modal").hidden = false;
}

function setupInfoMore() {
  document.getElementById("detail-work-more-btn").addEventListener("click", openInfoMore);
  const close = () => {
    document.getElementById("rd-info-more-modal").hidden = true;
  };
  document.getElementById("rd-info-more-close").addEventListener("click", close);
  document.getElementById("rd-info-more-ok").addEventListener("click", close);
  document.getElementById("rd-info-more-modal").addEventListener("click", (e) => {
    if (e.target.id === "rd-info-more-modal") close();
  });
}

function refreshOverview() {
  const { product, name } = pageState;
  const iteration = findIteration(name, product);
  if (!iteration || !product || !name) return;

  renderDrawer(product, name);
  document.getElementById("detail-meta-tags").innerHTML = renderMetaTags(product);

  const reqs = getIterationRequirements(name, product);
  const filtered = filterReqs(reqs);
  const tbody = document.getElementById("detail-req-tbody");
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td class="empty-row" colspan="11">暂无所属需求</td></tr>`;
  } else {
    tbody.innerHTML = filtered.map((r, i) => renderReqRow(r, i % 2 === 1)).join("");
  }

  document.getElementById("detail-header-schedule").innerHTML = renderHeaderSchedule(iteration);
  document.getElementById("detail-work-tbody").innerHTML = renderWorkRows(reqs, INFO_PREVIEW_LIMIT);
  updateInfoMoreButtons(reqs);
  document.getElementById("detail-apk-grid").innerHTML = renderApkInfo(iteration);
}

function renderPage() {
  const { product, name } = getQueryParams();
  pageState.product = product;
  pageState.name = name;

  const main = document.getElementById("detail-main");
  const drawerOpen = isDrawerOpenFromQuery();
  setupDrawerToggle(!drawerOpen);
  setupDrawerChrome();
  setupSubmitModal();
  setupInfoMore();
  setupStatusDropdowns();

  let timer;
  document.getElementById("rd-req-search").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      pageState.reqSearch = e.target.value;
      refreshOverview();
    }, 160);
  });

  const iteration = findIteration(name, product);
  if (!iteration || !product || !name) {
    renderDrawer(product, name);
    main.innerHTML =
      '<div class="iter-detail-empty">未找到该迭代，<a href="rd-workspace.html">返回研测工作专区</a></div>';
    return;
  }

  document.title = `${name} - 研测工作详情`;
  document.getElementById("detail-breadcrumb-name").textContent = name;
  document.getElementById("detail-iter-name").textContent = name;

  const dates = iteration.dates || {};
  const startDate = dates.devStart || dates.prdStart || "";
  const endDate = dates.testEnd || "";
  document.getElementById("detail-date-range").textContent =
    startDate && endDate ? `${startDate} 至 ${endDate}` : "未排期";

  refreshOverview();
}

renderPage();
