/**
 * 版本发布看板数据：
 * - 来源：迭代（研测）已产出的 APK 版本号
 * - 默认发布状态：不涉及
 * - 产品改为「计划中」后的发布字段，单独存在本地 meta
 */
const RELEASE_STATUSES = ["全部", "不涉及", "计划中", "已发布"];
const RELEASE_CHANNELS = ["GP", "PS", "PA"];
const RELEASE_SHUTTLES = ["", "7月份班车", "8月份班车", "9月份班车"];
const CHANNEL_GRAY_MAX = { GP: 100, PS: 100, PA: 500000 };
const CHANNEL_GRAY_KIND = { GP: "percent", PS: "binary", PA: "volume" };

function listReleaseChannels(value) {
  if (Array.isArray(value)) return value.filter((s) => RELEASE_CHANNELS.includes(s));
  return String(value || "")
    .split(/[,/|，、\s]+/)
    .map((s) => s.trim())
    .filter((s) => RELEASE_CHANNELS.includes(s));
}

function channelGrayKind(channel) {
  return CHANNEL_GRAY_KIND[channel] || "percent";
}

function channelGrayMax(channel) {
  return CHANNEL_GRAY_MAX[channel] || 100;
}

function clampChannelGray(channel, value) {
  const kind = channelGrayKind(channel);
  const max = channelGrayMax(channel);
  let n = Number(value);
  if (!Number.isFinite(n)) n = 0;
  n = Math.max(0, Math.min(max, n));
  if (kind === "binary") n = n >= max ? max : 0;
  return n;
}

function channelGrayRatio(channel, value) {
  const max = channelGrayMax(channel);
  return Math.max(0, Math.min(100, ((Number(value) || 0) / max) * 100));
}

function formatChannelGray(channel, value) {
  const n = clampChannelGray(channel, value);
  if (channel === "PA") {
    if (n >= 500000) return "50w";
    if (n >= 10000) {
      const wan = Math.round((n / 10000) * 10) / 10;
      return `${String(wan).replace(/\.0$/, "")}w`;
    }
    return String(n);
  }
  return n >= 100 ? "全量" : `${n}%`;
}

function fallbackGrayForChannel(channel, grayPercent) {
  if (grayPercent == null || grayPercent === "") return 0;
  if (channel === "GP") return clampChannelGray("GP", grayPercent);
  if (channel === "PS") return Number(grayPercent) >= 100 ? 100 : 0;
  return 0;
}

function normalizeChannelGrays(row) {
  if (!row || row.status === "不涉及") return [];
  const channels = listReleaseChannels(row.channel);
  if (!channels.length) return [];
  const map = {};
  if (Array.isArray(row.channelGrays)) {
    row.channelGrays.forEach((g) => {
      if (g && RELEASE_CHANNELS.includes(g.channel)) {
        map[g.channel] = clampChannelGray(g.channel, g.value);
      }
    });
  }
  return channels.map((ch) => ({
    channel: ch,
    value: Object.prototype.hasOwnProperty.call(map, ch)
      ? map[ch]
      : fallbackGrayForChannel(ch, row.grayPercent),
  }));
}

function applyChannelSelection(row, channelValue) {
  const selected = listReleaseChannels(channelValue);
  const prev = normalizeChannelGrays({ ...row, channel: row.channel });
  const map = {};
  prev.forEach((g) => {
    map[g.channel] = g.value;
  });
  const channelGrays = selected.map((ch) => ({
    channel: ch,
    value: Object.prototype.hasOwnProperty.call(map, ch) ? map[ch] : 0,
  }));
  const next = { ...row, channel: selected.join(" / "), channelGrays };
  return attachGraySummary(next);
}

function attachGraySummary(row) {
  const grays = normalizeChannelGrays(row);
  const next = { ...row, channelGrays: grays };
  if (!grays.length) {
    next.grayPercent = next.status === "不涉及" ? null : 0;
    return next;
  }
  const gp = grays.find((g) => g.channel === "GP");
  next.grayPercent = gp ? gp.value : Math.round(channelGrayRatio(grays[0].channel, grays[0].value));
  return next;
}

function hasRollingChannelGray(row) {
  return normalizeChannelGrays(row).some((g) => g.value > 0);
}

function isChannelGrayFull(row, channel) {
  const item = normalizeChannelGrays(row).find((g) => g.channel === channel);
  return !!(item && item.value >= channelGrayMax(channel));
}

const RELEASE_META_STORAGE_KEY = "release_board_meta_v2";
const RELEASE_LEGACY_STORAGE_KEY = "release_board_v1";
const RELEASE_CUSTOM_STORAGE_KEY = "release_board_custom_v1";

function releaseTodayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function loadCustomReleases() {
  try {
    const raw = localStorage.getItem(RELEASE_CUSTOM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function saveCustomReleases(list) {
  localStorage.setItem(RELEASE_CUSTOM_STORAGE_KEY, JSON.stringify(list || []));
}

function buildManualReleaseBase({ product, version, apkUrl, releaseTime }) {
  const prod = String(product || "").trim();
  const ver = String(version || "").trim();
  return {
    id: releaseRowId(prod, "manual", ver),
    source: "manual",
    product: prod,
    iteration: "",
    version: ver,
    apkUrl: String(apkUrl || "").trim(),
    releaseTime: releaseTime || releaseTodayISO(),
    status: "不涉及",
    grayPercent: null,
    rolloutTime: "",
    channel: "",
    shuttle: "",
    releaseNote: "",
    versionGoal: "",
    dataInfo: "",
    timeline: [],
    extraReqIds: [],
    excludedReqIds: [],
    includeGapReqs: false,
    channelGrays: [],
  };
}

function addManualRelease({ product, version, apkUrl }) {
  const prod = String(product || "").trim();
  const ver = String(version || "").trim();
  const url = String(apkUrl || "").trim();
  if (!prod || !ver || !url) return { ok: false, error: "请填写产品、版本号和 APK 链接" };
  const exists = getReleases().some((r) => r.product === prod && String(r.version) === ver);
  if (exists) return { ok: false, error: "该产品下已存在相同版本号" };
  const row = buildManualReleaseBase({ product: prod, version: ver, apkUrl: url });
  saveCustomReleases([...loadCustomReleases(), row]);
  return { ok: true, row: getReleaseById(row.id) };
}

function getReleaseProductOptions() {
  const set = new Set();
  if (typeof REQUIREMENTS !== "undefined" && Array.isArray(REQUIREMENTS)) {
    REQUIREMENTS.forEach((r) => {
      if (r.product) set.add(r.product);
    });
  }
  if (typeof ITERATIONS !== "undefined" && Array.isArray(ITERATIONS)) {
    ITERATIONS.forEach((it) => {
      if (it.product) set.add(it.product);
    });
  }
  loadCustomReleases().forEach((r) => {
    if (r.product) set.add(r.product);
  });
  return [...set].sort((a, b) => String(a).localeCompare(String(b), "zh"));
}

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
    versionGoal: "",
    dataInfo: "",
    timeline: [],
    extraReqIds: [],
    excludedReqIds: [],
    includeGapReqs: false,
    channelGrays: [],
  };
}

function mergeReleaseMeta(base, meta) {
  if (!meta) return base;
  const next = { ...base };
  const editable = [
    "status",
    "grayPercent",
    "channelGrays",
    "rolloutTime",
    "channel",
    "shuttle",
    "releaseNote",
    "versionGoal",
    "dataInfo",
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
  if (next.status === "不涉及") {
    next.grayPercent = null;
    next.channelGrays = [];
    next.rolloutTime = "";
    next.timeline = [];
    return next;
  }
  Object.assign(next, attachGraySummary(next));
  if (hasRollingChannelGray(next)) next.status = "已发布";
  if (next.status === "计划中" && (next.grayPercent == null || next.grayPercent === "")) {
    next.grayPercent = 0;
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

const RELEASE_DEMO_SEED_KEY = "release_board_demo_seed_v6";

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
      versionGoal: "完成搜索稳定性与全量放量，保障核心体验无回归。",
      dataInfo: "GP 全量后核心指标平稳，暂无异常崩溃与负反馈集中。",
      releaseNote: "1. 稳定性与性能优化；\n2. 修复已知崩溃问题；\n3. 完成全量放量。",
      timelineBuilder: (releaseTime) => {
        const end = releaseTime || "2026-08-13";
        const day = typeof addDaysISO === "function" ? addDaysISO : (iso) => iso;
        return [
          { date: day(end, -14), percent: 0, note: "进入计划中" },
          { date: day(end, -10), channel: "GP", value: 10, percent: 10 },
          { date: day(end, -6), channel: "GP", value: 35, percent: 35 },
          { date: day(end, -3), channel: "GP", value: 70, percent: 70 },
          { date: end, channel: "GP", value: 100, percent: 100, current: true },
        ];
      },
      rolloutFrom: (releaseTime) => releaseTime || "",
    },
    {
      status: "已发布",
      grayPercent: 35,
      channel: "GP / PS / PA",
      channelGrays: [
        { channel: "GP", value: 35 },
        { channel: "PS", value: 0 },
        { channel: "PA", value: 120000 },
      ],
      shuttle: "8月份班车",
      versionGoal: "优化搜索体验，完成多渠道灰度放量验证。",
      dataInfo: "GP：灰度 35%，搜索相关指标正常。\nPS：尚未放量。\nPA：已放量 12 万，暂无异常。",
      releaseNote: "1. 修复了视频播放卡顿问题；\n2. 优化了搜索结果排序算法；\n3. 新增夜间模式支持。",
      timelineBuilder: (releaseTime) => {
        const end = releaseTime || "2026-08-13";
        const day = typeof addDaysISO === "function" ? addDaysISO : (iso) => iso;
        return [
          { date: day(end, -14), percent: 0, note: "进入计划中" },
          { date: day(end, -10), channel: "GP", value: 10, percent: 10 },
          { date: day(end, -7), channel: "PA", value: 50000, percent: 10 },
          { date: day(end, -4), channel: "GP", value: 35, percent: 35 },
          { date: end, channel: "PA", value: 120000, percent: 24, current: true },
        ];
      },
      rolloutFrom: (releaseTime) => releaseTime || "",
    },
    {
      status: "计划中",
      grayPercent: 0,
      channel: "PS",
      shuttle: "9月份班车",
      versionGoal: "完成本月体验优化，准备进入放量。",
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
        channelGrays: Array.isArray(demo.channelGrays) ? demo.channelGrays.map((g) => ({ ...g })) : undefined,
        rolloutTime: demo.rolloutFrom(base.releaseTime),
        channel: demo.channel,
        shuttle: demo.shuttle,
        versionGoal: demo.versionGoal || "",
        dataInfo: demo.dataInfo || "",
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
        versionGoal: "",
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
    localStorage.removeItem("release_board_demo_seed_v3");
    localStorage.removeItem("release_board_demo_seed_v4");
    localStorage.removeItem("release_board_demo_seed_v5");
  } catch (_) {
    /* ignore */
  }
}

function getReleases() {
  seedDemoReleaseStatuses();
  const metaMap = loadReleaseMetaMap();
  const fromIter = listIterationReleaseBases().map((base) => mergeReleaseMeta(base, metaMap[base.id]));
  const fromCustom = loadCustomReleases().map((base) => mergeReleaseMeta({ ...base }, metaMap[base.id]));
  return [...fromIter, ...fromCustom].sort(compareReleaseByReleaseTimeDesc);
}

function getReleaseById(id) {
  return getReleases().find((r) => r.id === id) || null;
}

function upsertRelease(row) {
  if (!row || !row.id) return null;
  setReleaseMeta(row.id, {
    status: row.status,
    grayPercent: row.grayPercent,
    channelGrays: Array.isArray(row.channelGrays) ? row.channelGrays.map((g) => ({ ...g })) : [],
    rolloutTime: row.rolloutTime || "",
    channel: row.channel || "",
    shuttle: row.shuttle || "",
    releaseNote: row.releaseNote || "",
    versionGoal: row.versionGoal || "",
    dataInfo: row.dataInfo || "",
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
  const rolling = rows.filter(
    (r) =>
      r.status === "已发布" &&
      normalizeChannelGrays(r).some((g) => g.value > 0 && g.value < channelGrayMax(g.channel))
  ).length;
  return { planning, rolling, total: rows.length };
}
