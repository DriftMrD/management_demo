/**
 * 版本发布看板数据：
 * - 来源：迭代（研测）已产出的 APK 版本号
 * - 默认发布状态：不涉及
 * - 产品改为「计划中」后的发布字段，单独存在本地 meta
 */
const RELEASE_STATUSES = ["全部", "不涉及", "计划中", "已发布"];
const RELEASE_CHANNELS = ["GP", "PS", "PA"];
const RELEASE_SHUTTLES = ["", "7月份班车", "8月份班车", "9月份班车"];

const RELEASE_META_STORAGE_KEY = "release_board_meta_v2";
const RELEASE_LEGACY_STORAGE_KEY = "release_board_v1";

function releaseRowId(product, iterationName, version) {
  return `rv-${encodeURIComponent(product || "")}-${encodeURIComponent(iterationName || "")}-${encodeURIComponent(version || "")}`;
}

function loadReleaseMetaMap() {
  try {
    // 清掉旧的独立假数据，避免和迭代源混用
    localStorage.removeItem(RELEASE_LEGACY_STORAGE_KEY);
    const raw = localStorage.getItem(RELEASE_META_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
}

function saveReleaseMetaMap(map) {
  localStorage.setItem(RELEASE_META_STORAGE_KEY, JSON.stringify(map || {}));
}

function getReleaseMeta(id) {
  const map = loadReleaseMetaMap();
  return map[id] ? { ...map[id] } : null;
}

function setReleaseMeta(id, patch) {
  const map = loadReleaseMetaMap();
  map[id] = { ...(map[id] || {}), ...patch, updatedAt: new Date().toISOString() };
  saveReleaseMetaMap(map);
  return map[id];
}

function resolveIterationApk(it) {
  if (!it) return { apkUrl: "", apkVersion: "", releaseTime: "" };
  const metrics =
    typeof getRdWorkspaceMetrics === "function"
      ? getRdWorkspaceMetrics(it)
      : { apkUrl: "", apkVersion: "" };
  const apkVersion =
    (it.apkVersion != null && String(it.apkVersion).trim()) ||
    (metrics.apkVersion != null && String(metrics.apkVersion).trim()) ||
    "";
  const apkUrl =
    (it.apkUrl != null && String(it.apkUrl).trim()) ||
    (metrics.apkUrl != null && String(metrics.apkUrl).trim()) ||
    "";
  const releaseTime =
    it.apkFilledAt ||
    (it.dates && (it.dates.testEnd || it.dates.devEnd || it.dates.testStart)) ||
    (typeof todayISO === "function" ? todayISO() : "");
  return { apkUrl, apkVersion, releaseTime };
}

function buildReleaseBaseFromIteration(it) {
  const { apkUrl, apkVersion, releaseTime } = resolveIterationApk(it);
  if (!apkVersion) return null;
  const id = releaseRowId(it.product, it.name, apkVersion);
  return {
    id,
    source: "iteration",
    product: it.product,
    iteration: it.name,
    version: apkVersion,
    apkUrl,
    releaseTime,
    // 默认：研测产出后进入看板，但不默认对外发
    status: "不涉及",
    grayPercent: null,
    rolloutTime: "",
    channel: "",
    shuttle: "",
    releaseNote: "",
    timeline: [],
    extraReqIds: [],
    excludedReqIds: [],
    includeGapReqs: false,
  };
}

function mergeReleaseMeta(base, meta) {
  if (!meta) return base;
  const next = { ...base };
  const editable = [
    "status",
    "grayPercent",
    "rolloutTime",
    "channel",
    "shuttle",
    "releaseNote",
    "timeline",
    "extraReqIds",
    "excludedReqIds",
    "includeGapReqs",
  ];
  editable.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(meta, key)) next[key] = meta[key];
  });
  next.extraReqIds = Array.isArray(next.extraReqIds)
    ? next.extraReqIds.map((id) => Number(id)).filter(Boolean)
    : [];
  next.excludedReqIds = Array.isArray(next.excludedReqIds)
    ? next.excludedReqIds.map((id) => Number(id)).filter(Boolean)
    : [];
  next.includeGapReqs = !!next.includeGapReqs;
  // 状态机兜底：灰度 > 0 视为已发布
  if (next.status !== "不涉及" && next.grayPercent != null && Number(next.grayPercent) > 0) {
    next.status = "已发布";
  }
  if (next.status === "计划中" && (next.grayPercent == null || next.grayPercent === "")) {
    next.grayPercent = 0;
  }
  if (next.status === "不涉及") {
    next.grayPercent = null;
    next.rolloutTime = "";
    next.timeline = [];
  }
  return next;
}

function listIterationReleaseBases() {
  if (typeof ITERATIONS === "undefined" || !Array.isArray(ITERATIONS)) return [];
  if (typeof applyPersistedApkToIterations === "function") {
    applyPersistedApkToIterations();
  }
  return ITERATIONS.map(buildReleaseBaseFromIteration).filter(Boolean);
}

function compareReleaseByReleaseTimeDesc(a, b) {
  const ta = a && a.releaseTime ? String(a.releaseTime) : "";
  const tb = b && b.releaseTime ? String(b.releaseTime) : "";
  // 无释放时间沉底
  if (ta && !tb) return -1;
  if (!ta && tb) return 1;
  if (ta !== tb) return ta < tb ? 1 : -1; // 首次释放时间倒序
  if (a.product !== b.product) return String(a.product || "").localeCompare(String(b.product || ""), "zh");
  return String(b.version || "").localeCompare(String(a.version || "")); // 同日则版本号倒序
}

const RELEASE_DEMO_SEED_KEY = "release_board_demo_seed_v3";

/** 演示：若干已发布 / 计划中，并至少保留 1 条「不涉及」 */
function seedDemoReleaseStatuses() {
  try {
    if (localStorage.getItem(RELEASE_DEMO_SEED_KEY) === "1") return;
  } catch (_) {
    return;
  }

  const bases = listIterationReleaseBases().slice().sort(compareReleaseByReleaseTimeDesc);
  if (!bases.length) return;

  const demos = [
    {
      status: "已发布",
      grayPercent: 100,
      channel: "GP",
      shuttle: "8月份班车",
      releaseNote: "1. 稳定性与性能优化；\n2. 修复已知崩溃问题；\n3. 完成全量放量。",
      timelineBuilder: (releaseTime) => {
        const start = releaseTime || "2026-07-01";
        return [
          { date: start, percent: 0, note: "进入计划中" },
          { date: start, percent: 10, note: "开始放量" },
          { date: start, percent: 100, note: "全量", current: true },
        ];
      },
      rolloutFrom: (releaseTime) => releaseTime || "",
    },
    {
      status: "已发布",
      grayPercent: 35,
      channel: "GP",
      shuttle: "8月份班车",
      releaseNote: "1. 修复了视频播放卡顿问题；\n2. 优化了搜索结果排序算法；\n3. 新增夜间模式支持。",
      timelineBuilder: (releaseTime) => {
        const start = releaseTime || "2026-07-08";
        return [
          { date: start, percent: 0, note: "进入计划中" },
          { date: start, percent: 10, note: "开始放量" },
          { date: start, percent: 35, note: "当前灰度", current: true },
        ];
      },
      rolloutFrom: (releaseTime) => releaseTime || "",
    },
    {
      status: "计划中",
      grayPercent: 0,
      channel: "PS",
      shuttle: "9月份班车",
      releaseNote: "1. 体验优化与问题修复；\n2. 待放量验证。",
      timelineBuilder: (releaseTime) => [
        { date: releaseTime || "", percent: 0, note: "进入计划中", current: true },
      ],
      rolloutFrom: () => "",
    },
  ];

  // 至少留 1 条「不涉及」
  const demoCount = Math.min(demos.length, Math.max(0, bases.length - 1));
  const map = {};

  bases.forEach((base, i) => {
    if (i < demoCount) {
      const demo = demos[i];
      map[base.id] = {
        status: demo.status,
        grayPercent: demo.grayPercent,
        rolloutTime: demo.rolloutFrom(base.releaseTime),
        channel: demo.channel,
        shuttle: demo.shuttle,
        releaseNote: demo.releaseNote,
        timeline: demo.timelineBuilder(base.releaseTime),
        updatedAt: new Date().toISOString(),
      };
    } else {
      map[base.id] = {
        status: "不涉及",
        grayPercent: null,
        rolloutTime: "",
        channel: "",
        shuttle: "",
        releaseNote: "",
        timeline: [],
        updatedAt: new Date().toISOString(),
      };
    }
  });

  saveReleaseMetaMap(map);
  try {
    localStorage.setItem(RELEASE_DEMO_SEED_KEY, "1");
    // 清掉旧 seed 标记，避免混淆
    localStorage.removeItem("release_board_demo_seed_v2");
  } catch (_) {
    /* ignore */
  }
}

function getReleases() {
  seedDemoReleaseStatuses();
  const metaMap = loadReleaseMetaMap();
  return listIterationReleaseBases()
    .map((base) => mergeReleaseMeta(base, metaMap[base.id]))
    .sort(compareReleaseByReleaseTimeDesc);
}

function getReleaseById(id) {
  return getReleases().find((r) => r.id === id) || null;
}

function upsertRelease(row) {
  if (!row || !row.id) return null;
  setReleaseMeta(row.id, {
    status: row.status,
    grayPercent: row.grayPercent,
    rolloutTime: row.rolloutTime || "",
    channel: row.channel || "",
    shuttle: row.shuttle || "",
    releaseNote: row.releaseNote || "",
    timeline: Array.isArray(row.timeline) ? row.timeline.map((t) => ({ ...t })) : [],
    extraReqIds: Array.isArray(row.extraReqIds) ? row.extraReqIds.map((id) => Number(id)).filter(Boolean) : [],
    excludedReqIds: Array.isArray(row.excludedReqIds) ? row.excludedReqIds.map((id) => Number(id)).filter(Boolean) : [],
    includeGapReqs: !!row.includeGapReqs,
  });
  return getReleaseById(row.id);
}

function getReleaseProducts() {
  const set = new Set(getReleases().map((r) => r.product).filter(Boolean));
  return ["全部", ...[...set].sort((a, b) => String(a).localeCompare(String(b), "zh"))];
}

function getReleaseBadgeCounts(rows = getReleases()) {
  const planning = rows.filter((r) => r.status === "计划中").length;
  const rolling = rows.filter((r) => r.status === "已发布" && r.grayPercent != null && r.grayPercent < 100).length;
  return { planning, rolling, total: rows.length };
}
