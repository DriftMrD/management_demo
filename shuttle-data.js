/** 班车看板阶段：仅这 7 项起止日期；各阶段首尾相接、互不重叠 */
const SHUTTLE_ROW_DEFS = [
  {
    key: "spec",
    label: "班车规矩",
    bars: [{ field: "spec", cls: "shuttle-c-spec" }],
  },
  {
    key: "plan",
    label: "计划输出",
    bars: [{ field: "plan", cls: "shuttle-c-plan" }],
  },
  {
    key: "material",
    label: "物料输出",
    bars: [{ field: "material", cls: "shuttle-c-material" }],
  },
  {
    key: "gray",
    label: "灰度版本",
    bars: [{ field: "gray", cls: "shuttle-c-gray" }],
  },
  {
    key: "full",
    label: "全量版本",
    bars: [{ field: "full", cls: "shuttle-c-full" }],
  },
  {
    key: "feedback",
    label: "数据反馈",
    bars: [{ field: "feedback", cls: "shuttle-c-feedback" }],
  },
  {
    key: "retro",
    label: "回顾会议",
    bars: [{ field: "retro", cls: "shuttle-c-retro" }],
  },
];

const SHUTTLE_FORM_FIELDS = [
  { key: "spec", label: "班车规矩" },
  { key: "plan", label: "计划输出" },
  { key: "material", label: "物料输出" },
  { key: "gray", label: "灰度版本" },
  { key: "full", label: "全量版本" },
  { key: "feedback", label: "数据反馈" },
  { key: "retro", label: "回顾会议" },
];

const SHUTTLE_STORAGE_KEY = "shuttle_board_v10";

/** 下一工作日（跳过周末） */
function nextWorkdayISO(iso) {
  let cur = addDaysISO(iso, 1);
  while (parseISODate(cur).getDay() === 0 || parseISODate(cur).getDay() === 6) {
    cur = addDaysISO(cur, 1);
  }
  return cur;
}

function workdayOffsetFrom(iso, n) {
  let cur = iso;
  let left = n;
  while (left > 0) {
    cur = nextWorkdayISO(cur);
    left -= 1;
  }
  return cur;
}

/** 按工作日长度生成连续、无交集的阶段排期 */
function buildDefaultStages(startISO) {
  // 各阶段占用的工作日天数（含起止当天）
  const lengths = [4, 2, 5, 6, 5, 2, 1];
  const stages = {};
  let cursor = startISO;
  // 若起点是周末，挪到下一工作日
  const w = parseISODate(cursor).getDay();
  if (w === 0 || w === 6) cursor = nextWorkdayISO(cursor);

  SHUTTLE_FORM_FIELDS.forEach((f, i) => {
    const len = lengths[i] || 1;
    const start = cursor;
    const end = len <= 1 ? start : workdayOffsetFrom(start, len - 1);
    stages[f.key] = { start, end };
    cursor = nextWorkdayISO(end);
  });
  return stages;
}

const DEFAULT_SHUTTLES = [
  {
    id: 1,
    name: "2025年11月班车",
    stages: buildDefaultStages("2025-10-27"),
  },
  {
    id: 2,
    name: "2025年12月班车",
    stages: buildDefaultStages("2025-11-24"),
  },
  {
    id: 3,
    name: "6月份班车",
    stages: buildDefaultStages("2026-05-25"),
  },
  {
    id: 4,
    name: "7月份班车",
    stages: buildDefaultStages("2026-06-29"),
  },
  {
    id: 5,
    name: "8月份班车",
    stages: buildDefaultStages("2026-07-23"),
  },
  {
    id: 6,
    name: "9月份班车",
    stages: buildDefaultStages("2026-08-24"),
  },
  {
    id: 7,
    name: "2027年1月班车",
    stages: buildDefaultStages("2026-12-21"),
  },
];

function cloneShuttle(s) {
  return JSON.parse(JSON.stringify(s));
}

function loadStoredShuttles() {
  try {
    const raw = localStorage.getItem(SHUTTLE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveShuttles(list) {
  localStorage.setItem(SHUTTLE_STORAGE_KEY, JSON.stringify(list));
}

function getShuttles() {
  const stored = loadStoredShuttles();
  if (stored) return stored;
  const seed = DEFAULT_SHUTTLES.map(cloneShuttle);
  saveShuttles(seed);
  return seed;
}

function nextShuttleId(list) {
  return list.reduce((max, s) => Math.max(max, Number(s.id) || 0), 0) + 1;
}
