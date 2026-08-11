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

function setDrawerOpenStored(open) {
  try {
    if (open) sessionStorage.setItem(DRAWER_STORAGE_KEY, "1");
    else sessionStorage.removeItem(DRAWER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function setupDrawerToggle(collapsed) {
  const page = document.querySelector(".rd-detail-page");
  const expandBtn = document.getElementById("drawer-expand-btn");
  if (!page) return;
  page.classList.toggle("is-drawer-collapsed", !!collapsed);
  if (expandBtn) expandBtn.hidden = !collapsed;
  setDrawerOpenStored(!collapsed);
  syncDrawerQuery(!collapsed);
  closeDrawerProductMenu();
  // 展开/收起后重绘链接，切换迭代时保留 drawer=open
  if (pageState.product) renderDrawer(pageState.product, pageState.name);
}

function statusBadgeClass(status) {
  if (status === "已完成") return "is-done";
  if (status === "超期完成") return "is-done-late";
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
  const safe = escapeHtml(val);
  return `<a class="${cls}" href="${safe}" title="${safe}" target="_blank" rel="noopener">${safe}</a>`;
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

function isReqSubmittedForTest(row) {
  if (!row) return false;
  return !!(
    (row.testBuildUrl && String(row.testBuildUrl).trim()) ||
    (row.testSubmitVersion && String(row.testSubmitVersion).trim())
  );
}

function renderReqRow(row, striped) {
  const design =
    typeof resolveUxUiForDisplay === "function"
      ? resolveUxUiForDisplay(row)
      : { needUx: row.needUx !== false, needUi: row.needUi !== false, uxUrl: row.uxUrl || "", uiUrl: row.uiUrl || "" };
  const uxUrl = design.needUx === false ? "" : design.uxUrl || "";
  const uiUrl = design.needUi === false ? "" : design.uiUrl || "";
  const submitted = isReqSubmittedForTest(row);
  const submitBtn = submitted
    ? `<button type="button" class="rd-req-submit-btn is-disabled" disabled title="已转测">已转测</button>`
    : `<button type="button" class="rd-req-submit-btn" data-action="submit-test" data-id="${row.id}">转测</button>`;

  return `
    <tr class="${striped ? "is-striped" : ""}">
      ${renderReqNameCell(row, "col-name")}
      <td class="col-value">${renderValueCell(!!row.isValue)}</td>
      <td class="col-priority">${row.priority ? `<span class="priority-badge priority-${escapeHtml(row.priority)}">${escapeHtml(row.priority)}</span>` : '<span class="iter-detail-cell-muted">-</span>'}</td>
      <td class="col-type"><span class="iter-detail-type-badge ${landingTypeClass(row.type)}">${escapeHtml(landingTypeLabel(row.type))}</span></td>
      <td class="col-version">${escapeHtml(row.version || "-")}</td>
      <td class="col-prd">${renderPrdCell(row)}</td>
      <td class="col-ai-prd">${renderAiPrdCell(row)}</td>
      <td class="col-ai-demo">${linkOrDash(row.aiDemoUrl, { underline: true })}</td>
      <td class="col-ai-track">${linkOrDash(row.aiTrackUrl, { underline: true })}</td>
      <td class="col-ux">${uxUrl ? linkOrDash(uxUrl) : '<span class="iter-detail-cell-muted">-</span>'}</td>
      <td class="col-ui">${uiUrl ? linkOrDash(uiUrl) : '<span class="iter-detail-cell-muted">-</span>'}</td>
      <td class="col-ops">${submitBtn}</td>
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

function getReqIterDeadline(r, endKey) {
  if (!r || !r.iteration || !r.product || typeof findIteration !== "function") return "";
  const it = findIteration(r.iteration, r.product);
  return (it && it.dates && it.dates[endKey]) || "";
}

function getReqDevStatus(r) {
  const deadline = getReqIterDeadline(r, "devEnd");
  const pastDeadline = !!(deadline && todayISO() > deadline);
  const done =
    !!(r && r.testBuildUrl && String(r.testBuildUrl).trim()) ||
    (r && r.devPhaseStatus === "已完成");
  if (done) return pastDeadline ? "超期完成" : "已完成"; // 展示文案仍为「已完成」，红底表示超期
  // 未完成且已过开发截止日 → 已超期（进行中也算超期）
  if (pastDeadline) return "已超期";
  if (r && r.devPhaseStatus) return normalizeRdWorkStatus(r.devPhaseStatus);
  if (r && (r.status === "开发中" || r.status === "测试中")) return "进行中";
  return "未开始";
}

function getReqTestStatus(r) {
  const hasConclusion = r && r.testConclusion && String(r.testConclusion).trim();
  const hasReport = r && r.testReportUrl && String(r.testReportUrl).trim();
  const deadline = getReqIterDeadline(r, "testEnd");
  const pastDeadline = !!(deadline && todayISO() > deadline);

  // 结论 + 报告齐全才算测试完成；过截止日内部记超期完成（展示仍为已完成+红底）
  if (hasConclusion && hasReport) {
    return pastDeadline ? "超期完成" : "已完成";
  }

  const hasTransfer = !!(
    r &&
    ((r.testBuildUrl && String(r.testBuildUrl).trim()) ||
      (r.testSubmitVersion && String(r.testSubmitVersion).trim()))
  );
  // 已转测但未出结论/报告 → 测试进行中（过截止日则已超期），不能算已完成
  if (hasTransfer || (r && r.status === "测试中")) {
    return pastDeadline ? "已超期" : "进行中";
  }

  if (r && r.testPhaseStatus) {
    const normalized = normalizeRdWorkStatus(r.testPhaseStatus);
    if (normalized === "已完成") return pastDeadline ? "已超期" : "进行中";
    if (normalized === "进行中") return pastDeadline ? "已超期" : "进行中";
    return normalized;
  }

  if (pastDeadline) return "已超期";
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

/** 同一次提测合并为一行：优先 batchId，否则按版本+链接+提测人+建议聚合 */
function getSubmitBatchKey(r) {
  if (r && r.testSubmitBatchId) return `batch:${r.testSubmitBatchId}`;
  const ver = String(r.testSubmitVersion || "").trim();
  const link = String(r.testBuildUrl || "").trim();
  const owner = String(r.testSubmitter || "").trim();
  const advice = String(r.testAdvice || "").trim();
  if (!ver && !link) return `solo:${r.id}`;
  return `auto:${ver}|${link}|${owner}|${advice}`;
}

function getWorkGroups(reqs) {
  const rows = getWorkRowData(reqs);
  const groups = new Map();
  const order = [];
  rows.forEach((r) => {
    const key = getSubmitBatchKey(r);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key).push(r);
  });
  return order.map((key) => ({ key, members: groups.get(key) }));
}

function testConclusionBadge(row) {
  const conclusion = (row.testConclusion && String(row.testConclusion).trim()) || "";
  if (conclusion) {
    const upper = conclusion.toUpperCase();
    const cls = upper.includes("FAIL") || upper.includes("不通过") ? "is-fail" : "is-pass";
    return `<span class="iter-detail-result-badge ${cls}">${escapeHtml(conclusion)}</span>`;
  }
  return `<span class="rd-work-fill-hint">点击填写</span>`;
}

function renderWorkEditCell(reqIds, focus, className, inner, title) {
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
  return `<td class="${className} rd-work-edit-cell" data-action="edit-work" data-req-id="${escapeHtml(reqIds)}" data-focus="${focus}"${titleAttr}>${inner}</td>`;
}

function renderWorkReqNamesCell(members) {
  const blocks = members
    .map((row) => {
      const code = getReqCode(row);
      return `
      <div class="rd-work-req-item">
        <div class="rd-req-name-title" title="${escapeHtml(row.title)}">${escapeHtml(row.title || "-")}</div>
        <div class="rd-req-name-code">${escapeHtml(code)}</div>
      </div>`;
    })
    .join("");
  return `<td class="col-work-req rd-req-name-cell"><div class="rd-work-req-stack">${blocks}</div></td>`;
}

function pickGroupField(members, getter) {
  for (const m of members) {
    const v = getter(m);
    if (v != null && String(v).trim()) return v;
  }
  return "";
}

function renderWorkRows(reqs, limit) {
  const groups = getWorkGroups(reqs);
  if (!groups.length) return `<tr><td class="empty-row" colspan="8">暂无研测记录</td></tr>`;
  const list = limit != null ? groups.slice(0, limit) : groups;
  return list
    .map(({ members }) => {
      const primary = members[0];
      const ids = members.map((m) => m.id).join(",");
      const report = pickGroupField(members, (r) => r.testReportUrl);
      const note = pickGroupField(members, (r) => r.testRemark);
      const advice = pickGroupField(members, (r) => r.testAdvice);
      const conclusionRow =
        members.find((m) => m.testConclusion && String(m.testConclusion).trim()) || primary;
      const reportInner = report
        ? `<span class="iter-detail-cell-link is-underline">${escapeHtml(report)}</span>`
        : '<span class="rd-work-fill-hint">点击填写</span>';
      return `
    <tr data-req-id="${escapeHtml(ids)}">
      ${renderWorkReqNamesCell(members)}
      <td class="col-work-ver">${escapeHtml(primary.testSubmitVersion || primary.version || "-")}</td>
      <td class="col-work-link">${linkOrDash(primary.testBuildUrl, { underline: true })}</td>
      <td class="col-work-owner">${escapeHtml(primary.testSubmitter || primary.owner || "-")}</td>
      <td class="col-work-advice" title="${escapeHtml(advice)}">${advice ? escapeHtml(advice) : '<span class="iter-detail-cell-muted">-</span>'}</td>
      ${renderWorkEditCell(ids, "conclusion", "col-work-result", testConclusionBadge(conclusionRow))}
      ${renderWorkEditCell(ids, "report", "col-work-report", reportInner, report)}
      ${renderWorkEditCell(ids, "note", "col-work-note", note ? escapeHtml(note) : '<span class="iter-detail-cell-muted">-</span>', note)}
    </tr>`;
    })
    .join("");
}

function updateInfoMoreButtons(reqs) {
  const btn = document.getElementById("detail-work-more-btn");
  if (btn) btn.hidden = getWorkGroups(reqs).length <= INFO_PREVIEW_LIMIT;
}

function syncIterationStatusFromReqs(iteration, reqs) {
  if (!iteration || !reqs.length) return;
  // 注意：整体“已完成”必须基于迭代内的全部需求，而不是仅基于已填过字段的子集。
  // 否则会出现：只转测了部分需求，却被误判为“已完成”。
  const devStatuses = reqs.map(getReqDevStatus);
  const testStatuses = reqs.map(getReqTestStatus);
  const isDone = (s) => s === "已完成" || s === "超期完成";
  const pick = (list) => {
    if (list.every(isDone)) {
      return list.some((s) => s === "超期完成") ? "超期完成" : "已完成";
    }
    if (list.some((s) => s === "已超期")) return "已超期";
    if (list.some((s) => s === "进行中" || isDone(s))) return "进行中";
    return "未开始";
  };
  iteration.rdDevStatus = pick(devStatuses);
  iteration.rdTestStatus = pick(testStatuses);
}

function renderIterStatusControl(kind, status) {
  const label = displayRdWorkStatus(status);
  return `
    <div class="rd-detail-status-item">
      <span class="rd-detail-status-label">${kind === "dev" ? "开发状态" : "测试状态"}</span>
      <div class="filter-btn-wrap rd-status-wrap">
        <button type="button" class="iter-detail-status-badge rd-status-btn ${statusBadgeClass(status)}" data-status-kind="${kind}" data-status="${escapeHtml(status)}" data-scope="iteration" aria-haspopup="listbox" aria-expanded="false">
          <span>${escapeHtml(label)}</span>
          <img src="assets/icons/chevron-down.svg" alt="" width="10" height="10" />
        </button>
      </div>
    </div>`;
}

function renderWorkStatusHeader(iteration) {
  const dev = getRdIterationDevStatus(iteration);
  const test = getRdIterationTestStatus(iteration);
  return `${renderIterStatusControl("dev", dev)}${renderIterStatusControl("test", test)}`;
}

function renderHeaderSchedule(iteration) {
  const dates = (iteration && iteration.dates) || {};
  const items = [
    { label: "开发时间", start: dates.devStart, end: dates.devEnd },
    { label: "测试时间", start: dates.testStart, end: dates.testEnd },
  ];
  const parts = items
    .map((item) => {
      const range =
        item.start && item.end ? `${item.start} ~ ${item.end}` : item.start || item.end || "未排期";
      return `<span class="rd-detail-header-schedule-item"><span class="rd-detail-header-schedule-label">${escapeHtml(item.label)}</span><span class="rd-detail-header-schedule-value">${escapeHtml(range)}</span></span>`;
    })
    .join("");
  return parts || `<span class="rd-detail-header-schedule-item">未排期</span>`;
}

function getApkFieldValue(iteration, key) {
  if (!iteration || !Object.prototype.hasOwnProperty.call(iteration, key)) return "";
  return String(iteration[key] ?? "").trim();
}

function renderApkReadonlyField(label) {
  return `
    <div class="iter-detail-apk-item">
      <span class="iter-detail-apk-label">${escapeHtml(label)}</span>
      <span class="iter-detail-cell-muted">-</span>
    </div>`;
}

function renderApkEditableField(kind, label, value, inputType) {
  const hasValue = !!value;
  const safe = escapeHtml(value);
  const input = `<input class="field-input rd-apk-input" data-apk-input="${kind}" type="${inputType}" value="${safe}" hidden placeholder="${kind === "apkUrl" ? "https://" : "如 17.0.0.001"}" />`;

  if (hasValue) {
    const display =
      kind === "apkUrl"
        ? `<a class="iter-detail-cell-link is-underline rd-apk-value" href="${safe}" target="_blank" rel="noopener" title="${safe}">${safe}</a>`
        : `<span class="rd-apk-value" title="${safe}">${safe}</span>`;
    return `
      <div class="iter-detail-apk-item rd-apk-field" data-apk-field="${kind}">
        <span class="iter-detail-apk-label">${escapeHtml(label)}</span>
        <div class="rd-apk-value-wrap">
          ${display}
          <button type="button" class="rd-apk-edit-btn" data-action="apk-edit" title="编辑" aria-label="编辑${escapeHtml(label)}">
            <img src="assets/icons/pencil.svg" alt="" />
          </button>
        </div>
        ${input}
      </div>`;
  }

  return `
    <div class="iter-detail-apk-item rd-apk-field is-empty" data-apk-field="${kind}">
      <span class="iter-detail-apk-label">${escapeHtml(label)}</span>
      <button type="button" class="rd-apk-placeholder" data-action="apk-edit">点击填写</button>
      ${input}
    </div>`;
}

function renderApkInfo(iteration) {
  const metrics = getRdWorkspaceMetrics(iteration);
  const apkUrl = getApkFieldValue(iteration, "apkUrl");
  const apkVersion = getApkFieldValue(iteration, "apkVersion");
  const diText =
    metrics.diRate != null && metrics.diRate !== ""
      ? `${escapeHtml(String(metrics.diRate))}%`
      : '<span class="iter-detail-cell-muted">-</span>';
  return `
    ${renderApkEditableField("apkUrl", "APK 链接", apkUrl, "url")}
    ${renderApkEditableField("apkVersion", "APK 版本号", apkVersion, "text")}
    <div class="iter-detail-apk-item">
      <span class="iter-detail-apk-label">DI 解决率</span>
      <span class="rd-detail-di-rate">${diText}</span>
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
  return `<span class="iter-drawer-status ${statusBadgeClass(status)}">${escapeHtml(displayRdWorkStatus(status))}</span>`;
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
      const status = getRdIterationOverallStatus(it);
      const drawerParam = isDrawerCurrentlyOpen() || isDrawerOpenFromQuery() ? "&drawer=open" : "";
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

function applyIterStatus(kind, value) {
  const iteration = findIteration(pageState.name, pageState.product);
  if (!iteration) return false;
  const allReqs = getIterationRequirements(pageState.name, pageState.product);
  const workReqs = getWorkRowData(allReqs);
  const targets = workReqs.length ? workReqs : allReqs;

  if (kind === "dev") {
    if (value === "已完成") {
      const missingBuild = targets.find((r) => !r.testBuildUrl || !String(r.testBuildUrl).trim());
      if (missingBuild) {
        alert("标记开发完成前，需先填写提测版本 / 提测链接（可使用一键转测）");
        return false;
      }
      const missingFeedback = targets.find((r) => getAiPrdLabel(r) && !getAiPrdFeedbackText(r));
      if (missingFeedback) {
        alert("存在含 AI PRD 的需求未填写反馈，请先填写后再标记开发完成");
        return false;
      }
    }
    const devDeadline = iteration.dates && iteration.dates.devEnd;
    iteration.rdDevStatus =
      value === "已完成" && devDeadline && todayISO() > devDeadline ? "超期完成" : value;
    targets.forEach((r) => {
      r.devPhaseStatus = value;
    });
  } else {
    if (value === "已完成") {
      const missing = targets.find((r) => {
        const hasConclusion = r.testConclusion && String(r.testConclusion).trim();
        const hasReport = r.testReportUrl && String(r.testReportUrl).trim();
        return !hasConclusion || !hasReport;
      });
      if (missing) {
        alert("标记测试完成前，需填写测试结论和测试报告");
        return false;
      }
    }
    const testDeadline = iteration.dates && iteration.dates.testEnd;
    iteration.rdTestStatus =
      value === "已完成" && testDeadline && todayISO() > testDeadline ? "超期完成" : value;
    targets.forEach((r) => {
      r.testPhaseStatus = value;
    });
  }
  return true;
}

function setupStatusDropdowns() {
  const host = document.getElementById("detail-work-status");
  if (!host || host.dataset.statusBound === "1") return;
  host.dataset.statusBound = "1";
  host.addEventListener("click", (e) => {
    const btn = e.target.closest(".rd-status-btn[data-status-kind]");
    if (!btn) return;
    e.stopPropagation();
    const kind = btn.dataset.statusKind;
    const wrap = btn.closest(".rd-status-wrap");
    if (!wrap) return;
    const willOpen = btn.getAttribute("aria-expanded") !== "true";
    closeAllStatusMenus();
    if (!willOpen) return;
    const current = btn.dataset.status || btn.querySelector("span")?.textContent || "";
    const menu = document.createElement("div");
    menu.className = "dropdown rd-status-dropdown rd-row-status-menu";
    menu.innerHTML = RD_WORK_STATUSES.map((s) => {
      const selected = s === current || (s === "已完成" && current === "超期完成");
      return `<button type="button" class="${selected ? "selected" : ""}" data-value="${escapeHtml(s)}">${escapeHtml(s)}</button>`;
    }).join("");
    wrap.appendChild(menu);
    btn.setAttribute("aria-expanded", "true");
    menu.addEventListener("click", (ev) => {
      const opt = ev.target.closest("button[data-value]");
      if (!opt) return;
      ev.stopPropagation();
      if (applyIterStatus(kind, opt.dataset.value)) {
        closeAllStatusMenus();
        refreshOverview();
      }
    });
  });
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

function openSubmitModal(preselectId) {
  const modal = document.getElementById("rd-submit-modal");
  const reqs = getIterationRequirements(pageState.name, pageState.product);
  const onlyId = preselectId != null && preselectId !== "" ? Number(preselectId) : null;
  const list = document.getElementById("rd-submit-req-list");
  const selectable = reqs.filter((r) => !isReqSubmittedForTest(r));
  list.innerHTML = selectable.length
    ? selectable
        .map((r) => {
          const hasAi = !!getAiPrdLabel(r);
          const checked = onlyId != null ? r.id === onlyId : true;
          return `
          <label class="rd-submit-req-item">
            <input type="checkbox" data-id="${r.id}" data-has-ai-prd="${hasAi ? "1" : "0"}" ${checked ? "checked" : ""} />
            <span class="rd-submit-req-title">${escapeHtml(r.title)}</span>
            ${hasAi ? '<span class="rd-submit-ai-tag">AI PRD</span>' : ""}
            <span class="rd-submit-req-code">${escapeHtml(getReqCode(r))}</span>
          </label>`;
        })
        .join("")
    : '<p class="iter-detail-empty-inline">暂无可转测需求（均已转测）</p>';

  document.getElementById("rd-submit-version").value = "";
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
  document.getElementById("btn-rd-submit-test").addEventListener("click", () => openSubmitModal());
  document.getElementById("detail-req-tbody").addEventListener("click", (e) => {
    const btn = e.target.closest('[data-action="submit-test"]');
    if (!btn) return;
    openSubmitModal(btn.dataset.id);
  });
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
    const batchId = `submit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let count = 0;
    reqs.forEach((r) => {
      if (!ids.has(r.id)) return;
      r.testSubmitBatchId = batchId;
      r.testSubmitVersion = version;
      r.testBuildUrl = link;
      r.testSubmitter = owner;
      r.testAdvice = note;
      if (feedback && getAiPrdLabel(r)) applyAiPrdFeedback(r, feedback, owner);
      r.devPhaseStatus = "已完成";
      count += 1;
    });

    const iteration = findIteration(pageState.name, pageState.product);
    if (iteration) {
      const allReqs = getIterationRequirements(pageState.name, pageState.product);
      syncIterationStatusFromReqs(iteration, allReqs);
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

const WORK_EDIT_FOCUS_MAP = {
  conclusion: "rd-work-edit-conclusion-btn",
  report: "rd-work-edit-report",
  note: "rd-work-edit-note",
};

const TEST_CONCLUSION_OPTIONS = ["PASS", "FAIL"];

function normalizeTestConclusionOption(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (upper.includes("FAIL") || raw.includes("不通过")) return "FAIL";
  if (upper.includes("PASS") || raw.includes("通过")) return "PASS";
  return "";
}

function setWorkEditConclusion(value) {
  const normalized = normalizeTestConclusionOption(value);
  const hidden = document.getElementById("rd-work-edit-conclusion");
  const text = document.getElementById("rd-work-edit-conclusion-text");
  if (!hidden || !text) return;
  hidden.value = normalized;
  text.classList.remove("is-pass", "is-fail");
  if (normalized) {
    text.textContent = normalized;
    text.classList.remove("placeholder");
    text.classList.add(normalized === "FAIL" ? "is-fail" : "is-pass");
  } else {
    text.textContent = text.dataset.placeholder || "请选择";
    text.classList.add("placeholder");
  }
}

function findWorkReqsByIds(idsText) {
  const ids = String(idsText || "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  const all = getIterationRequirements(pageState.name, pageState.product);
  return ids.map((id) => all.find((r) => r.id === id)).filter(Boolean);
}

function openWorkEditModal(reqIds, focus) {
  const rows = findWorkReqsByIds(reqIds);
  if (!rows.length) return;
  const primary = rows[0];
  document.getElementById("rd-work-edit-req-id").value = rows.map((r) => r.id).join(",");
  document.getElementById("rd-work-edit-req-name").textContent = rows
    .map((r) => `${r.title || "-"} · ${getReqCode(r)}`)
    .join("；");
  const rawConclusion =
    pickGroupField(rows, (r) => r.testConclusion) || primary.testConclusion || "";
  setWorkEditConclusion(rawConclusion);
  document.getElementById("rd-work-edit-conclusion-menu").hidden = true;
  document.getElementById("rd-work-edit-report").value =
    pickGroupField(rows, (r) => r.testReportUrl) || primary.testReportUrl || "";
  document.getElementById("rd-work-edit-note").value =
    pickGroupField(rows, (r) => r.testRemark) || primary.testRemark || "";
  document.getElementById("rd-work-edit-modal").hidden = false;
  const focusId = WORK_EDIT_FOCUS_MAP[focus] || "rd-work-edit-conclusion-btn";
  requestAnimationFrame(() => {
    const el = document.getElementById(focusId);
    if (el) {
      el.focus();
      if (typeof el.select === "function") el.select();
    }
  });
}

function closeWorkEditModal() {
  document.getElementById("rd-work-edit-modal").hidden = true;
  const menu = document.getElementById("rd-work-edit-conclusion-menu");
  if (menu) menu.hidden = true;
}

function saveWorkEditModal() {
  const rows = findWorkReqsByIds(document.getElementById("rd-work-edit-req-id").value);
  if (!rows.length) return;
  const conclusion = document.getElementById("rd-work-edit-conclusion").value.trim();
  const report = document.getElementById("rd-work-edit-report").value.trim();
  const note = document.getElementById("rd-work-edit-note").value.trim();
  if (!conclusion || !TEST_CONCLUSION_OPTIONS.includes(conclusion)) {
    alert("请选择测试结论（PASS 或 FAIL）");
    return;
  }
  if (!report) {
    alert("请填写测试报告");
    return;
  }
  rows.forEach((row) => {
    row.testConclusion = conclusion;
    row.testReportUrl = report;
    row.testRemark = note;
    row.testPhaseStatus = "已完成";
  });
  const iteration = findIteration(pageState.name, pageState.product);
  const allReqs = getIterationRequirements(pageState.name, pageState.product);
  syncIterationStatusFromReqs(iteration, allReqs);
  closeWorkEditModal();
  refreshOverview();
  const moreModal = document.getElementById("rd-info-more-modal");
  if (moreModal && !moreModal.hidden) {
    document.getElementById("rd-info-more-tbody").innerHTML = renderWorkRows(allReqs);
  }
}

function setupWorkEditModal() {
  const bindTable = (tbody) => {
    if (!tbody || tbody.dataset.workEditBound === "1") return;
    tbody.dataset.workEditBound = "1";
    tbody.addEventListener("click", (e) => {
      const cell = e.target.closest('[data-action="edit-work"]');
      if (!cell) return;
      e.preventDefault();
      openWorkEditModal(cell.dataset.reqId, cell.dataset.focus);
    });
  };

  bindTable(document.getElementById("detail-work-tbody"));
  bindTable(document.getElementById("rd-info-more-tbody"));
  document.getElementById("rd-work-edit-close").addEventListener("click", closeWorkEditModal);
  document.getElementById("rd-work-edit-cancel").addEventListener("click", closeWorkEditModal);
  document.getElementById("rd-work-edit-save").addEventListener("click", saveWorkEditModal);
  document.getElementById("rd-work-edit-modal").addEventListener("click", (e) => {
    if (e.target.id === "rd-work-edit-modal") closeWorkEditModal();
  });

  const conclusionBtn = document.getElementById("rd-work-edit-conclusion-btn");
  const conclusionMenu = document.getElementById("rd-work-edit-conclusion-menu");
  if (conclusionBtn && conclusionMenu) {
    conclusionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const current = document.getElementById("rd-work-edit-conclusion").value;
      conclusionMenu.innerHTML = TEST_CONCLUSION_OPTIONS.map(
        (o) =>
          `<button type="button" class="${o === current ? "selected " : ""}conclusion-option" data-value="${o}"><span class="select-text ${o === "FAIL" ? "is-fail" : "is-pass"}">${escapeHtml(o)}</span></button>`
      ).join("");
      conclusionMenu.hidden = !conclusionMenu.hidden;
    });
    conclusionMenu.addEventListener("click", (e) => {
      const opt = e.target.closest("button[data-value]");
      if (!opt) return;
      setWorkEditConclusion(opt.dataset.value);
      conclusionMenu.hidden = true;
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#rd-work-edit-conclusion-wrap")) conclusionMenu.hidden = true;
    });
  }
}

function beginApkFieldEdit(fieldEl) {
  if (!fieldEl || fieldEl.classList.contains("is-editing")) return;
  const input = fieldEl.querySelector(".rd-apk-input");
  if (!input) return;
  fieldEl.classList.add("is-editing");
  fieldEl.classList.remove("is-empty");
  const valueWrap = fieldEl.querySelector(".rd-apk-value-wrap");
  const placeholder = fieldEl.querySelector(".rd-apk-placeholder");
  if (valueWrap) {
    valueWrap.hidden = true;
    valueWrap.style.display = "none";
  }
  if (placeholder) {
    placeholder.hidden = true;
    placeholder.style.display = "none";
  }
  input.hidden = false;
  input.style.display = "";
  input.focus();
  input.select();
}

function commitApkFieldEdit(fieldEl) {
  if (!fieldEl || !fieldEl.classList.contains("is-editing")) return;
  const input = fieldEl.querySelector(".rd-apk-input");
  const kind = fieldEl.dataset.apkField;
  if (!input || !kind) return;
  const iteration = findIteration(pageState.name, pageState.product);
  if (!iteration) return;
  iteration[kind] = input.value.trim();
  if (!iteration.apkFilledAt && (iteration.apkUrl || iteration.apkVersion)) {
    iteration.apkFilledAt = typeof todayISO === "function" ? todayISO() : new Date().toISOString().slice(0, 10);
  }
  if (typeof persistIterationApk === "function") persistIterationApk(iteration);
  const grid = document.getElementById("detail-apk-grid");
  if (grid) grid.innerHTML = renderApkInfo(iteration);
}

function setupApkInlineEdit() {
  const grid = document.getElementById("detail-apk-grid");
  if (!grid || grid.dataset.apkEditBound === "1") return;
  grid.dataset.apkEditBound = "1";

  grid.addEventListener("click", (e) => {
    const editBtn = e.target.closest('[data-action="apk-edit"]');
    if (editBtn) {
      e.preventDefault();
      e.stopPropagation();
      beginApkFieldEdit(editBtn.closest(".rd-apk-field"));
      return;
    }
    const emptyField = e.target.closest(".rd-apk-field.is-empty");
    if (emptyField) {
      e.preventDefault();
      beginApkFieldEdit(emptyField);
    }
  });

  grid.addEventListener("keydown", (e) => {
    const input = e.target.closest(".rd-apk-input");
    if (!input) return;
    if (e.key === "Enter") {
      e.preventDefault();
      commitApkFieldEdit(input.closest(".rd-apk-field"));
    } else if (e.key === "Escape") {
      e.preventDefault();
      const iteration = findIteration(pageState.name, pageState.product);
      if (iteration) grid.innerHTML = renderApkInfo(iteration);
    }
  });

  grid.addEventListener("focusout", (e) => {
    const fieldEl = e.target.closest(".rd-apk-field");
    if (!fieldEl || !fieldEl.classList.contains("is-editing")) return;
    // 只在「输入框」失焦时提交，避免点击按钮/占位文字导致立刻回填空值
    const inputEl = e.target.closest(".rd-apk-input");
    if (!inputEl) return;
    // 焦点仍在同一字段内（如无）则不提交
    if (fieldEl.contains(e.relatedTarget)) return;
    commitApkFieldEdit(fieldEl);
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
    tbody.innerHTML = `<tr><td class="empty-row" colspan="12">暂无所属需求</td></tr>`;
  } else {
    tbody.innerHTML = filtered.map((r, i) => renderReqRow(r, i % 2 === 1)).join("");
  }

  document.getElementById("detail-header-schedule").innerHTML = renderHeaderSchedule(iteration);
  syncIterationStatusFromReqs(iteration, reqs);
  const workStatus = document.getElementById("detail-work-status");
  if (workStatus) workStatus.innerHTML = renderWorkStatusHeader(iteration);
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
  setupWorkEditModal();
  setupApkInlineEdit();
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
