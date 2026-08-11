// ---------- 假数据 ----------
// reviewResult: null | "通过" | "不通过"
const REQUIREMENTS = [
  { id: 1, title: "日活长期人口服务端触达需求", product: "日活", status: "进行中", priority: "P0", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "黄志阳", avatar: "assets/avatars/avatar-1.png", requestDate: "2026-06-05", deliverMonth: "2026-07", version: "16.4", reviewResult: null, detail: "通过服务端触达能力，提升日活用户的长期留存率。需要对接push、短信、站内信等多通道，实现用户分层精准触达策略。", attachments: [{ name: "需求PRD文档_v2.1.pdf", size: "2.4 MB" }] },
  { id: 2, title: "节气大波需求", product: "日活", status: "已评审", priority: "P0", type: "TOS版本", isValue: false, needAnalytics: false, owner: "黄志阳", avatar: "assets/avatars/avatar-2.png", requestDate: "2026-04-07", deliverMonth: "2026-06", version: "16.3", reviewResult: "通过" },
  { id: 3, title: "大字版首页", product: "日活", status: "未启动", priority: "P1", type: "敏捷迭代", isValue: true, needAnalytics: false, owner: "黄志阳", avatar: "assets/avatars/avatar-3.png", requestDate: "2026-05-15", deliverMonth: "2026-08", version: "17.0", reviewResult: null },
  { id: 4, title: "搜索自需求", product: "搜索", status: "待评审", priority: "P1", type: "敏捷迭代", isValue: false, needAnalytics: true, owner: "黄志阳", avatar: "assets/avatars/avatar-4.png", requestDate: "2026-05-10", deliverMonth: "2026-06", version: "16.3", reviewResult: null },
  { id: 5, title: "百宝箱相关需求", product: "百宝箱", status: "进行中", priority: "P2", type: "TOS版本", isValue: false, needAnalytics: false, owner: "黄志阳", avatar: "assets/avatars/avatar-5.png", requestDate: "2026-04-20", deliverMonth: "2026-04", version: "17.0", reviewResult: "不通过" },
  { id: 6, title: "时刻感相关大需求", product: "时刻", status: "已排期", priority: "P0", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "黄志阳", avatar: "assets/avatars/avatar-6.png", requestDate: "2026-05-01", deliverMonth: "2026-08", version: "16.3", reviewResult: "通过" },
  { id: 7, title: "AI创新展示营业员", product: "Note", status: "未启动", priority: "P1", type: "敏捷迭代", isValue: true, needAnalytics: false, owner: "黄志阳", avatar: "assets/avatars/avatar-7.png", requestDate: "2026-05-25", deliverMonth: "2026-08", version: "17.0", reviewResult: null },
  { id: 8, title: "桌面小组件性能优化", product: "日活", status: "开发中", priority: "P0", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "李明", avatar: "assets/avatars/avatar-2.png", requestDate: "2026-04-12", deliverMonth: "2026-07", version: "16.4", reviewResult: "通过" },
  { id: 9, title: "搜索联想词排序策略升级", product: "搜索", status: "测试中", priority: "P1", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "王芳", avatar: "assets/avatars/avatar-3.png", requestDate: "2026-03-28", deliverMonth: "2026-06", version: "16.3", reviewResult: "通过" },
  { id: 10, title: "Note 云同步冲突处理", product: "Note", status: "已完成", priority: "P0", type: "敏捷迭代", isValue: false, needAnalytics: false, owner: "张伟", avatar: "assets/avatars/avatar-4.png", requestDate: "2026-02-18", deliverMonth: "2026-04", version: "16.2", reviewResult: "通过" },
  { id: 11, title: "百宝箱入口改版", product: "百宝箱", status: "开发中", priority: "P1", type: "TOS版本", isValue: true, needAnalytics: false, owner: "李明", avatar: "assets/avatars/avatar-5.png", requestDate: "2026-05-08", deliverMonth: "2026-08", version: "17.0", reviewResult: "通过" },
  { id: 12, title: "时刻卡片动效统一", product: "时刻", status: "已排期", priority: "P2", type: "敏捷迭代", isValue: false, needAnalytics: false, owner: "王芳", avatar: "assets/avatars/avatar-6.png", requestDate: "2026-06-01", deliverMonth: "2026-09", version: "17.0", reviewResult: "通过" },
  { id: 13, title: "日活 Push 频控策略", product: "日活", status: "待评审", priority: "P0", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "黄志阳", avatar: "assets/avatars/avatar-1.png", requestDate: "2026-06-10", deliverMonth: "2026-08", version: "17.0", reviewResult: null },
  { id: 14, title: "搜索空结果页引导优化", product: "搜索", status: "测试中", priority: "P2", type: "TOS版本", isValue: false, needAnalytics: true, owner: "张伟", avatar: "assets/avatars/avatar-7.png", requestDate: "2026-04-02", deliverMonth: "2026-05", version: "16.3", reviewResult: "通过" },
  { id: 15, title: "Note AI 摘要能力接入", product: "Note", status: "进行中", priority: "P0", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "李明", avatar: "assets/avatars/avatar-2.png", requestDate: "2026-05-30", deliverMonth: "2026-08", version: "17.0", reviewResult: null },
  { id: 16, title: "老年版桌面布局适配", product: "日活", status: "已取消", priority: "P2", type: "TOS版本", isValue: false, needAnalytics: false, owner: "王芳", avatar: "assets/avatars/avatar-3.png", requestDate: "2026-01-15", deliverMonth: "2026-03", version: "16.1", reviewResult: null },
  { id: 17, title: "百宝箱小工具商店", product: "百宝箱", status: "已完成", priority: "P1", type: "TOS版本", isValue: true, needAnalytics: false, owner: "黄志阳", avatar: "assets/avatars/avatar-1.png", requestDate: "2026-01-20", deliverMonth: "2026-03", version: "16.1", reviewResult: "通过" },
  { id: 18, title: "搜索语音输入体验优化", product: "搜索", status: "开发中", priority: "P1", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "张伟", avatar: "assets/avatars/avatar-4.png", requestDate: "2026-05-18", deliverMonth: "2026-07", version: "16.4", reviewResult: "通过" },
  { id: 19, title: "时刻天气信息卡片", product: "时刻", status: "未启动", priority: "P2", type: "敏捷迭代", isValue: false, needAnalytics: false, owner: "王芳", avatar: "assets/avatars/avatar-5.png", requestDate: "2026-06-12", deliverMonth: "2026-09", version: "17.0", reviewResult: null },
  { id: 20, title: "Note 文件夹批量管理", product: "Note", status: "已评审", priority: "P1", type: "敏捷迭代", isValue: false, needAnalytics: false, owner: "李明", avatar: "assets/avatars/avatar-6.png", requestDate: "2026-04-28", deliverMonth: "2026-07", version: "16.4", reviewResult: "通过" },
  { id: 21, title: "日活负一屏内容分发", product: "日活", status: "测试中", priority: "P0", type: "TOS版本", isValue: true, needAnalytics: true, owner: "黄志阳", avatar: "assets/avatars/avatar-7.png", requestDate: "2026-03-10", deliverMonth: "2026-06", version: "16.3", reviewResult: "通过" },
  { id: 22, title: "搜索热榜本地缓存", product: "搜索", status: "已完成", priority: "P2", type: "敏捷迭代", isValue: false, needAnalytics: false, owner: "张伟", avatar: "assets/avatars/avatar-2.png", requestDate: "2026-02-05", deliverMonth: "2026-03", version: "16.1", reviewResult: "通过" },
  { id: 23, title: "百宝箱权限弹窗改造", product: "百宝箱", status: "已取消", priority: "P1", type: "敏捷迭代", isValue: false, needAnalytics: false, owner: "王芳", avatar: "assets/avatars/avatar-3.png", requestDate: "2026-03-22", deliverMonth: "2026-05", version: "16.3", reviewResult: "不通过" },
  { id: 24, title: "时刻纪念日提醒", product: "时刻", status: "已排期", priority: "P1", type: "敏捷迭代", isValue: true, needAnalytics: false, owner: "李明", avatar: "assets/avatars/avatar-4.png", requestDate: "2026-06-08", deliverMonth: "2026-09", version: "17.0", reviewResult: "通过" },
  { id: 25, title: "Note 跨端剪贴板同步", product: "Note", status: "进行中", priority: "P0", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "黄志阳", avatar: "assets/avatars/avatar-1.png", requestDate: "2026-05-22", deliverMonth: "2026-08", version: "17.0", reviewResult: null },
];

// 需求池展示 IR；迭代/甘特/设计看板/「文档」挂载在 SR（拆分时可为 AR）。
// 一个 IR 拆成 1+ 个 SR，且同一 IR 的 SR 不跨迭代。
REQUIREMENTS.forEach((row) => {
  row.reqLevel = "IR";
  row.parentId = null;
});

/**
 * SR 种子：parentId 指向 IR；同 parentId 的 iteration 必须相同。
 * 标题可与 IR 相同（1:1），或拆成子能力（1:N，如 id 6）。
 */
const SR_SEEDS = [
  { id: 101, parentId: 8, title: "桌面小组件性能优化", product: "日活", status: "开发中", priority: "P0", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "李明", avatar: "assets/avatars/avatar-2.png", requestDate: "2026-04-12", deliverMonth: "2026-07", version: "16.4", reviewResult: "通过", iteration: "S22" },
  { id: 102, parentId: 21, title: "日活负一屏内容分发", product: "日活", status: "测试中", priority: "P0", type: "TOS版本", isValue: true, needAnalytics: true, owner: "黄志阳", avatar: "assets/avatars/avatar-7.png", requestDate: "2026-03-10", deliverMonth: "2026-06", version: "16.3", reviewResult: "通过", iteration: "S24" },
  { id: 103, parentId: 9, title: "搜索联想词排序策略升级", product: "搜索", status: "已完成", priority: "P1", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "王芳", avatar: "assets/avatars/avatar-3.png", requestDate: "2026-03-28", deliverMonth: "2026-06", version: "16.3", reviewResult: "通过", iteration: "S23" },
  { id: 104, parentId: 14, title: "搜索空结果页引导优化", product: "搜索", status: "已完成", priority: "P2", type: "TOS版本", isValue: false, needAnalytics: true, owner: "张伟", avatar: "assets/avatars/avatar-7.png", requestDate: "2026-04-02", deliverMonth: "2026-05", version: "16.3", reviewResult: "通过", iteration: "S23" },
  { id: 105, parentId: 18, title: "搜索语音输入体验优化", product: "搜索", status: "开发中", priority: "P1", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "张伟", avatar: "assets/avatars/avatar-4.png", requestDate: "2026-05-18", deliverMonth: "2026-07", version: "16.4", reviewResult: "通过", iteration: "S24" },
  { id: 106, parentId: 22, title: "搜索热榜本地缓存", product: "搜索", status: "已完成", priority: "P2", type: "敏捷迭代", isValue: false, needAnalytics: false, owner: "张伟", avatar: "assets/avatars/avatar-2.png", requestDate: "2026-02-05", deliverMonth: "2026-03", version: "16.1", reviewResult: "通过", iteration: "S24" },
  { id: 107, parentId: 11, title: "百宝箱入口改版", product: "百宝箱", status: "开发中", priority: "P1", type: "TOS版本", isValue: true, needAnalytics: false, owner: "李明", avatar: "assets/avatars/avatar-5.png", requestDate: "2026-05-08", deliverMonth: "2026-08", version: "17.0", reviewResult: "通过", iteration: "S22" },
  { id: 108, parentId: 17, title: "百宝箱小工具商店", product: "百宝箱", status: "已完成", priority: "P1", type: "TOS版本", isValue: true, needAnalytics: false, owner: "黄志阳", avatar: "assets/avatars/avatar-1.png", requestDate: "2026-01-20", deliverMonth: "2026-03", version: "16.1", reviewResult: "通过", iteration: "S23" },
  // IR「时刻感相关大需求」拆成 2 个 SR，同属时刻 S25
  { id: 109, parentId: 6, title: "时刻感-首页氛围动效", product: "时刻", status: "已排期", priority: "P0", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "黄志阳", avatar: "assets/avatars/avatar-6.png", requestDate: "2026-05-01", deliverMonth: "2026-08", version: "16.3", reviewResult: "通过", iteration: "S25" },
  { id: 110, parentId: 6, title: "时刻感-内容推荐策略", product: "时刻", status: "已排期", priority: "P0", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "黄志阳", avatar: "assets/avatars/avatar-6.png", requestDate: "2026-05-01", deliverMonth: "2026-08", version: "16.3", reviewResult: "通过", iteration: "S25" },
  { id: 111, parentId: 12, title: "时刻卡片动效统一", product: "时刻", status: "已排期", priority: "P2", type: "敏捷迭代", isValue: false, needAnalytics: false, owner: "王芳", avatar: "assets/avatars/avatar-6.png", requestDate: "2026-06-01", deliverMonth: "2026-09", version: "17.0", reviewResult: "通过", iteration: "S25" },
  { id: 112, parentId: 24, title: "时刻纪念日提醒", product: "时刻", status: "已排期", priority: "P1", type: "敏捷迭代", isValue: true, needAnalytics: false, owner: "李明", avatar: "assets/avatars/avatar-4.png", requestDate: "2026-06-08", deliverMonth: "2026-09", version: "17.0", reviewResult: "通过", iteration: "S25" },
  { id: 113, parentId: 10, title: "Note 云同步冲突处理", product: "Note", status: "已完成", priority: "P0", type: "敏捷迭代", isValue: false, needAnalytics: false, owner: "张伟", avatar: "assets/avatars/avatar-4.png", requestDate: "2026-02-18", deliverMonth: "2026-04", version: "16.2", reviewResult: "通过", iteration: "S23" },
];

SR_SEEDS.forEach((sr) => {
  REQUIREMENTS.push({
    ...sr,
    reqLevel: "SR",
  });
});

/**
 * 未排期 SR：可供迭代「添加需求」演示新增（非转移）。
 */
const UNSCHEDULED_SR_SEEDS = [
  {
    id: 114,
    parentId: 1,
    title: "日活长期人口-触达通道对接",
    product: "日活",
    status: "已评审",
    priority: "P0",
    type: "敏捷迭代",
    isValue: true,
    needAnalytics: true,
    owner: "黄志阳",
    avatar: "assets/avatars/avatar-1.png",
    requestDate: "2026-06-05",
    deliverMonth: "2026-07",
    version: "16.4",
    reviewResult: "通过",
  },
  {
    id: 115,
    parentId: 3,
    title: "大字版首页-字号自适应",
    product: "日活",
    status: "进行中",
    priority: "P1",
    type: "敏捷迭代",
    isValue: true,
    needAnalytics: false,
    owner: "黄志阳",
    avatar: "assets/avatars/avatar-3.png",
    requestDate: "2026-05-15",
    deliverMonth: "2026-08",
    version: "17.0",
    reviewResult: null,
  },
  {
    id: 116,
    parentId: 4,
    title: "搜索自需求-结果卡信息架构",
    product: "搜索",
    status: "已评审",
    priority: "P1",
    type: "敏捷迭代",
    isValue: false,
    needAnalytics: true,
    owner: "黄志阳",
    avatar: "assets/avatars/avatar-4.png",
    requestDate: "2026-05-10",
    deliverMonth: "2026-06",
    version: "16.3",
    reviewResult: "通过",
  },
];

UNSCHEDULED_SR_SEEDS.forEach((sr) => {
  REQUIREMENTS.push({
    ...sr,
    reqLevel: "SR",
    iteration: "",
  });
});

/**
 * AR 种子：parentId 指向 SR。IR → SR → AR 逐级变小。
 * 有 iteration 的随父 SR；无 iteration 的用于「新增进迭代」。
 */
const AR_SEEDS = [
  // 搜索语音 S24 下拆 AR
  { id: 1001, parentId: 105, title: "语音输入-唤醒词优化", product: "搜索", status: "开发中", priority: "P1", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "张伟", avatar: "assets/avatars/avatar-4.png", requestDate: "2026-05-18", deliverMonth: "2026-07", version: "16.4", reviewResult: "通过", iteration: "S24" },
  { id: 1002, parentId: 105, title: "语音输入-识别结果纠错", product: "搜索", status: "开发中", priority: "P1", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "张伟", avatar: "assets/avatars/avatar-4.png", requestDate: "2026-05-18", deliverMonth: "2026-07", version: "16.4", reviewResult: "通过", iteration: "S24" },
  // 热榜 S24
  { id: 1003, parentId: 106, title: "热榜缓存-读写策略", product: "搜索", status: "已完成", priority: "P2", type: "敏捷迭代", isValue: false, needAnalytics: false, owner: "张伟", avatar: "assets/avatars/avatar-2.png", requestDate: "2026-02-05", deliverMonth: "2026-03", version: "16.1", reviewResult: "通过", iteration: "S24" },
  { id: 1004, parentId: 106, title: "热榜缓存-失效兜底", product: "搜索", status: "已完成", priority: "P2", type: "敏捷迭代", isValue: false, needAnalytics: false, owner: "张伟", avatar: "assets/avatars/avatar-2.png", requestDate: "2026-02-05", deliverMonth: "2026-03", version: "16.1", reviewResult: "通过", iteration: "S24" },
  // 日活负一屏 S24
  { id: 1005, parentId: 102, title: "负一屏-内容卡片模板", product: "日活", status: "测试中", priority: "P0", type: "TOS版本", isValue: true, needAnalytics: true, owner: "黄志阳", avatar: "assets/avatars/avatar-7.png", requestDate: "2026-03-10", deliverMonth: "2026-06", version: "16.3", reviewResult: "通过", iteration: "S24" },
  { id: 1006, parentId: 102, title: "负一屏-分发策略配置", product: "日活", status: "测试中", priority: "P0", type: "TOS版本", isValue: true, needAnalytics: true, owner: "黄志阳", avatar: "assets/avatars/avatar-7.png", requestDate: "2026-03-10", deliverMonth: "2026-06", version: "16.3", reviewResult: "通过", iteration: "S24" },
  // 桌面小组件 S22
  { id: 1007, parentId: 101, title: "小组件-渲染性能", product: "日活", status: "开发中", priority: "P0", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "李明", avatar: "assets/avatars/avatar-2.png", requestDate: "2026-04-12", deliverMonth: "2026-07", version: "16.4", reviewResult: "通过", iteration: "S22" },
  { id: 1008, parentId: 101, title: "小组件-刷新节流", product: "日活", status: "开发中", priority: "P0", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "李明", avatar: "assets/avatars/avatar-2.png", requestDate: "2026-04-12", deliverMonth: "2026-07", version: "16.4", reviewResult: "通过", iteration: "S22" },
  // 未排期 SR 下的 AR（新增进迭代）
  { id: 1009, parentId: 114, title: "触达通道-Push 对接", product: "日活", status: "已评审", priority: "P0", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "黄志阳", avatar: "assets/avatars/avatar-1.png", requestDate: "2026-06-05", deliverMonth: "2026-07", version: "16.4", reviewResult: "通过", iteration: "" },
  { id: 1010, parentId: 114, title: "触达通道-短信兜底", product: "日活", status: "已评审", priority: "P0", type: "敏捷迭代", isValue: true, needAnalytics: true, owner: "黄志阳", avatar: "assets/avatars/avatar-1.png", requestDate: "2026-06-05", deliverMonth: "2026-07", version: "16.4", reviewResult: "通过", iteration: "" },
  { id: 1011, parentId: 115, title: "字号自适应-桌面布局", product: "日活", status: "进行中", priority: "P1", type: "敏捷迭代", isValue: true, needAnalytics: false, owner: "黄志阳", avatar: "assets/avatars/avatar-3.png", requestDate: "2026-05-15", deliverMonth: "2026-08", version: "17.0", reviewResult: null, iteration: "" },
  { id: 1012, parentId: 116, title: "结果卡-字段映射", product: "搜索", status: "已评审", priority: "P1", type: "敏捷迭代", isValue: false, needAnalytics: true, owner: "黄志阳", avatar: "assets/avatars/avatar-4.png", requestDate: "2026-05-10", deliverMonth: "2026-06", version: "16.3", reviewResult: "通过", iteration: "" },
  { id: 1013, parentId: 116, title: "结果卡-空态引导", product: "搜索", status: "已评审", priority: "P1", type: "敏捷迭代", isValue: false, needAnalytics: true, owner: "黄志阳", avatar: "assets/avatars/avatar-4.png", requestDate: "2026-05-10", deliverMonth: "2026-06", version: "16.3", reviewResult: "通过", iteration: "" },
];

AR_SEEDS.forEach((ar) => {
  REQUIREMENTS.push({
    ...ar,
    reqLevel: "AR",
  });
});

/** 已进入排期及之后的状态，一定有需求编号等排期信息 */
const SCHEDULED_STATUSES = ["已排期", "开发中", "测试中", "已完成"];

function isIR(row) {
  return !!(row && row.reqLevel === "IR");
}

function isSR(row) {
  return !!(row && row.reqLevel === "SR");
}

function isAR(row) {
  return !!(row && row.reqLevel === "AR");
}

/** 可进入迭代/甘特的叶子需求：SR 或 AR */
function isIterationLeaf(row) {
  return isSR(row) || isAR(row);
}

/** 需求池 / 周报等：只展示 IR */
function getPoolRows() {
  return REQUIREMENTS.filter(isIR);
}

function makeReqCode(id, requestDate) {
  const ym = String(requestDate || "2026-01-01").replace(/-/g, "").slice(0, 6);
  return `IR-${ym}-${String(id).padStart(6, "0")}`;
}

function makeSrCode(id, requestDate) {
  const ym = String(requestDate || "2026-01-01").replace(/-/g, "").slice(0, 6);
  return `SR-${ym}-${String(id).padStart(6, "0")}`;
}

function makeArCode(id, requestDate) {
  const ym = String(requestDate || "2026-01-01").replace(/-/g, "").slice(0, 6);
  return `AR-${ym}-${String(id).padStart(6, "0")}`;
}

/** 是否已有传统 PRD（链接或附件） */
function reqHasTraditionalPrd(row) {
  if (!row) return false;
  if (row.prdUrl && String(row.prdUrl).trim()) return true;
  if (Array.isArray(row.attachments) && row.attachments.length) return true;
  return false;
}

/** 是否已有 AI PRD */
function reqHasAiPrd(row) {
  return !!(row && Array.isArray(row.aiPrdFiles) && row.aiPrdFiles.length);
}

/** 是否已有传统 PRD 或 AI PRD（仅看自身） */
function reqHasPrdDoc(row) {
  return reqHasTraditionalPrd(row) || reqHasAiPrd(row);
}

/** 产品打标点：文档标落在此 ID（≠「已有文件」；UX/UI 与之同层） */
function isDocMarkOwner(row) {
  return !!(row && (row.docMark === true || row.inheritedDocFrom === row.id));
}

/**
 * 沿自身→父链找产品打标点；SR 可回退到子 AR；IR 可落到子 SR/AR
 */
function findDocMarkOwner(row) {
  if (!row) return null;
  let cur = row;
  while (cur) {
    if (isDocMarkOwner(cur) || reqHasPrdDoc(cur)) return cur;
    cur = getParentReq(cur);
  }
  if (isSR(row)) {
    const ar = getChildArsOf(row.id).find((a) => isDocMarkOwner(a) || reqHasPrdDoc(a));
    if (ar) return ar;
  }
  if (isIR(row)) {
    for (const sr of getChildSrsOf(row.id)) {
      if (isDocMarkOwner(sr) || reqHasPrdDoc(sr)) return sr;
      const ar = getChildArsOf(sr.id).find((a) => isDocMarkOwner(a) || reqHasPrdDoc(a));
      if (ar) return ar;
    }
  }
  return null;
}

/** UX/UI 展示：与产品打标 ID 对齐 */
function resolveUxUiForDisplay(row) {
  const owner = findDocMarkOwner(row) || row;
  return {
    owner,
    needUx: owner.needUx !== false,
    needUi: owner.needUi !== false,
    uxUrl: owner.needUx === false ? "" : String(owner.uxUrl || "").trim(),
    uiUrl: owner.needUi === false ? "" : String(owner.uiUrl || "").trim(),
  };
}

function getParentReq(row) {
  if (!row || !row.parentId) return null;
  return REQUIREMENTS.find((r) => r.id === row.parentId) || null;
}

function isAncestorOf(ancestorId, row) {
  let cur = getParentReq(row);
  while (cur) {
    if (cur.id === ancestorId) return true;
    cur = getParentReq(cur);
  }
  return false;
}

/** 沿自身→父链查找 AI PRD 挂载点 */
function findAiPrdOwner(row) {
  let cur = row;
  while (cur) {
    if (reqHasAiPrd(cur)) return cur;
    cur = getParentReq(cur);
  }
  return null;
}

/** 沿自身→父链查找传统 PRD 挂载点 */
function findTraditionalPrdOwner(row) {
  let cur = row;
  while (cur) {
    if (reqHasTraditionalPrd(cur)) return cur;
    cur = getParentReq(cur);
  }
  return null;
}

/**
 * 所属需求展示用：优先自身文档，否则带上父级文档；
 * 若有 inheritedDocFrom 则定点取该源；
 * SR 自身/父级皆无时，回退到子 AR 上的文档（反向挂载）。
 */
function resolvePrdDocsForDisplay(row) {
  if (!row) return { source: null, prdUrl: "", aiPrdFiles: [], attachments: [] };
  if (row.inheritedDocFrom) {
    const src = REQUIREMENTS.find((r) => r.id === row.inheritedDocFrom);
    if (src) {
      return {
        source: src,
        prdUrl: src.prdUrl || "",
        aiPrdFiles: src.aiPrdFiles || [],
        attachments: src.attachments || [],
      };
    }
  }
  let cur = row;
  while (cur) {
    if (reqHasPrdDoc(cur)) {
      return {
        source: cur,
        prdUrl: cur.prdUrl || "",
        aiPrdFiles: cur.aiPrdFiles || [],
        attachments: cur.attachments || [],
      };
    }
    cur = getParentReq(cur);
  }
  if (isSR(row)) {
    const childWithDoc = getChildArsOf(row.id).find((ar) => reqHasPrdDoc(ar));
    if (childWithDoc) {
      return {
        source: childWithDoc,
        prdUrl: childWithDoc.prdUrl || "",
        aiPrdFiles: childWithDoc.aiPrdFiles || [],
        attachments: childWithDoc.attachments || [],
      };
    }
  }
  return { source: row, prdUrl: "", aiPrdFiles: [], attachments: [] };
}

function getChildSrsOf(irId) {
  return REQUIREMENTS.filter((r) => isSR(r) && r.parentId === irId).slice().sort((a, b) => a.id - b.id);
}

function getChildArsOf(srId) {
  return REQUIREMENTS.filter((r) => isAR(r) && r.parentId === srId).slice().sort((a, b) => a.id - b.id);
}

/** IR 下唯一可选叶子：仅 1 个 SR，且该 SR 下 0/1 个 AR */
function getIrUniqueLeaf(ir) {
  if (!ir) return null;
  const srs = getChildSrsOf(ir.id);
  if (srs.length !== 1) return null;
  const ars = getChildArsOf(srs[0].id);
  if (ars.length > 1) return null;
  return ars.length === 1 ? ars[0] : srs[0];
}

function isIrDocBranched(ir) {
  if (!ir) return false;
  const srs = getChildSrsOf(ir.id);
  if (srs.length > 1) return true;
  if (srs.length === 1 && getChildArsOf(srs[0].id).length > 1) return true;
  return false;
}

/** IR 下全部可选叶子（有 AR 则列 AR，否则列 SR） */
function getIrSelectableLeaves(ir) {
  if (!ir) return [];
  const leaves = [];
  getChildSrsOf(ir.id).forEach((sr) => {
    const ars = getChildArsOf(sr.id);
    if (ars.length) ars.forEach((ar) => leaves.push(ar));
    else leaves.push(sr);
  });
  return leaves;
}

/** 文档挂载点下的全部子叶子（用于「自动勾选下属」） */
function getDocOwnerDescendantLeaves(owner) {
  if (!owner) return [];
  if (isIR(owner)) return getIrSelectableLeaves(owner);
  if (isSR(owner)) return getChildArsOf(owner.id);
  return [];
}

/** SR 下挂了文档的子 AR（反向：文档在 AR） */
function getChildArsWithDocs(srId) {
  return getChildArsOf(srId).filter((ar) => reqHasPrdDoc(ar));
}

function isTosType(row) {
  return row.type === "TOS版本";
}

/** SR 的类型；若父 IR 类型不同也一并计入（兼容需求池改 IR 未同步 SR） */
function getReqTypeSet(row) {
  const types = new Set();
  if (row.type) types.add(row.type);
  if (isSR(row) && row.parentId) {
    const parent = REQUIREMENTS.find((r) => r.id === row.parentId);
    if (parent && parent.type) types.add(parent.type);
  }
  return types;
}

/** IR 类型变更时同步到其下所有 SR */
function syncIrTypeToChildSrs(irId, type) {
  REQUIREMENTS.forEach((r) => {
    if (isSR(r) && r.parentId === irId) {
      r.type = type;
    }
  });
}

/** 按天整体平移一组排期日期 */
function shiftScheduleDates(dates, days) {
  if (!dates) return null;
  const out = {};
  Object.keys(dates).forEach((k) => {
    out[k] = addDaysISO(dates[k], days);
  });
  return out;
}

/** 全局迭代模板（相对 2026-07 设计，保证阶段状态有差异）；按产品偏移后日期独立 */
const ITERATION_TEMPLATES = [
  {
    // 已结束
    name: "S22",
    dates: {
      prdStart: "2026-05-06",
      prdEnd: "2026-05-15",
      uxStart: "2026-05-16",
      uxEnd: "2026-05-21",
      uiStart: "2026-05-22",
      uiEnd: "2026-05-23",
      devStart: "2026-05-26",
      devEnd: "2026-06-03",
      testStart: "2026-06-04",
      testEnd: "2026-06-12",
    },
  },
  {
    // 刚收尾（相对今天偏完成）
    name: "S23",
    dates: {
      prdStart: "2026-06-03",
      prdEnd: "2026-06-12",
      uxStart: "2026-06-13",
      uxEnd: "2026-06-18",
      uiStart: "2026-06-19",
      uiEnd: "2026-06-20",
      devStart: "2026-06-23",
      devEnd: "2026-07-01",
      testStart: "2026-07-02",
      testEnd: "2026-07-10",
    },
  },
  {
    // 进行中：今天约落在开发段
    name: "S24",
    dates: {
      prdStart: "2026-07-01",
      prdEnd: "2026-07-08",
      uxStart: "2026-07-09",
      uxEnd: "2026-07-14",
      uiStart: "2026-07-15",
      uiEnd: "2026-07-16",
      devStart: "2026-07-17",
      devEnd: "2026-07-28",
      testStart: "2026-07-29",
      testEnd: "2026-08-05",
    },
  },
  {
    // 未开始 / 靠后
    name: "S25",
    dates: {
      prdStart: "2026-08-04",
      prdEnd: "2026-08-14",
      uxStart: "2026-08-15",
      uxEnd: "2026-08-20",
      uiStart: "2026-08-21",
      uiEnd: "2026-08-22",
      devStart: "2026-08-25",
      devEnd: "2026-09-02",
      testStart: "2026-09-03",
      testEnd: "2026-09-11",
    },
  },
];

/**
 * 各产品迭代整体偏移（天）：同名迭代日期独立，且阶段状态不完全相同
 * 例：日活 S24 ≠ 搜索 S24
 */
const PRODUCT_ITERATION_OFFSETS = {
  日活: 0,
  搜索: 8,
  百宝箱: -6,
  时刻: 12,
  Note: -10,
};

function addDaysISO(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 完整迭代目录（排期/置换用）；看板列表见 ITERATIONS */
const ITERATION_CATALOG = [];
Object.keys(PRODUCT_ITERATION_OFFSETS).forEach((product) => {
  const offset = PRODUCT_ITERATION_OFFSETS[product];
  ITERATION_TEMPLATES.forEach((tpl) => {
    ITERATION_CATALOG.push({
      product,
      name: tpl.name,
      dates: shiftScheduleDates(tpl.dates, offset),
    });
  });
});

/** 迭代管理看板列表：由甘特排期需求推导 */
const ITERATIONS = [];

function iterationNum(name) {
  const m = String(name).match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

/** 可选择的迭代：与该产品已有迭代对齐（含仅有名称、尚未排期的新增项），按编号倒序 */
function getSelectableIterations(product) {
  return ITERATIONS.filter((it) => !product || it.product === product)
    .slice()
    .sort((a, b) => {
      if (a.product !== b.product) return String(a.product).localeCompare(String(b.product), "zh");
      return iterationNum(b.name) - iterationNum(a.name);
    });
}

function findIteration(name, product) {
  const match = (list) =>
    product
      ? list.find((it) => it.name === name && it.product === product)
      : list.find((it) => it.name === name);
  return match(ITERATIONS) || match(ITERATION_CATALOG) || null;
}

/** 看板是否已有该产品×迭代（不含仅模板目录项） */
function findBoardIteration(name, product) {
  if (!name) return null;
  return product
    ? ITERATIONS.find((it) => it.name === name && it.product === product) || null
    : ITERATIONS.find((it) => it.name === name) || null;
}

/** 写入目录，并同步到产品迭代列表（供排期/置换下拉）
 *  dates: null 表示「仅名称、无排期」——新建看板项时不继承目录模板日期
 */
function upsertIterationCatalog(it) {
  if (!it || !it.name || !it.product) return null;
  const hasDatesKey = Object.prototype.hasOwnProperty.call(it, "dates");
  const setDates = !!(it.dates && typeof it.dates === "object");
  const clearDates = hasDatesKey && !setDates;

  let catalog = ITERATION_CATALOG.find((x) => x.name === it.name && x.product === it.product);
  if (catalog) {
    if (setDates) catalog.dates = { ...it.dates };
  } else {
    catalog = {
      product: it.product,
      name: it.name,
      dates: setDates ? { ...it.dates } : null,
    };
    ITERATION_CATALOG.unshift(catalog);
  }

  let board = ITERATIONS.find((x) => x.name === it.name && x.product === it.product);
  if (board) {
    if (setDates) board.dates = { ...it.dates };
    else if (clearDates) board.dates = null;
  } else {
    board = {
      product: catalog.product,
      name: catalog.name,
      dates: clearDates ? null : setDates ? { ...it.dates } : catalog.dates ? { ...catalog.dates } : null,
    };
    ITERATIONS.unshift(board);
  }
  return board;
}

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** 迭代状态：未开始 / 进行中 / 已完成 / 已超期 / 未排期 */
function getIterationStatus(it, today = todayISO()) {
  if (!it || !it.dates) return "未排期";
  const { devStart, devEnd, testStart, testEnd } = it.dates;
  if (!devStart || !devEnd || !testStart || !testEnd) return "未排期";
  return getIterationProgressStatus(it, today);
}

/** 各阶段定义（产品迭代看板） */
const ITERATION_PHASE_DEFS = [
  { key: "prd", label: "PRD", type: "doc", needKey: "needPrd", urlKey: "prdUrl", start: "prdStart", end: "prdEnd" },
  { key: "ux", label: "交互设计", type: "doc", needKey: "needUx", urlKey: "uxUrl", start: "uxStart", end: "uxEnd" },
  { key: "ui", label: "视觉设计", type: "doc", needKey: "needUi", urlKey: "uiUrl", start: "uiStart", end: "uiEnd" },
  {
    key: "dev",
    label: "开发阶段",
    type: "work",
    statusKey: "devPhaseStatus",
    urlKey: "testBuildUrl",
    start: "devStart",
    end: "devEnd",
  },
  {
    key: "test",
    label: "测试验收",
    type: "work",
    statusKey: "testPhaseStatus",
    urlKey: "testReportUrl",
    start: "testStart",
    end: "testEnd",
  },
];

function getIterationRequirements(name, product) {
  const rows = getGanttRows().filter((r) => r.iteration === name && r.product === product);
  const arsInIter = rows.filter(isAR);
  const srsToHide = new Set();
  const arsToHide = new Set();

  rows.filter(isSR).forEach((sr) => {
    const childArs = arsInIter.filter((ar) => ar.parentId === sr.id);
    if (!childArs.length) return;
    // 子 AR 自带文档标（或明确以自身为文档源）→ 列表出 AR，不出 SR
    const arsAreUnits = childArs.some(
      (ar) =>
        (typeof isDocMarkOwner === "function" && isDocMarkOwner(ar)) ||
        reqHasPrdDoc(ar) ||
        ar.inheritedDocFrom === ar.id ||
        (ar.needPrd === true && !reqHasPrdDoc(sr) && !(typeof isDocMarkOwner === "function" && isDocMarkOwner(sr)))
    );
    if (arsAreUnits) {
      srsToHide.add(sr.id);
    } else {
      // 以 SR 为落地单位时，不重复展示子 AR
      childArs.forEach((ar) => arsToHide.add(ar.id));
    }
  });

  return rows.filter((r) => {
    if (isSR(r) && srsToHide.has(r.id)) return false;
    if (isAR(r) && arsToHide.has(r.id)) return false;
    return true;
  });
}

/**
 * 文档类阶段（PRD/UX/UI）——状态按「需求」汇总到迭代：
 * - 不涉及：迭代未排该阶段，或该阶段下没有「涉及」的需求（need* === false 不计入）
 * - 有一个 AR/SR 涉及该阶段 → 整阶段为涉及（再细分未开始/进行中/已完成/已超期）
 * - 已完成：每一个「涉及」的需求都已提交文档
 * 单条需求是否完成：看该需求是否已交文档（含继承自父级的文档），不是迭代整体字段。
 */
function getDocPhaseStatus(reqs, dates, def, today = todayISO()) {
  const start = dates && dates[def.start];
  const end = dates && dates[def.end];
  if (!start || !end) return "不涉及";

  // 明确不涉及的不计入；有一个涉及 → 阶段涉及；全部不涉及 → 阶段不涉及
  const involved = reqs.filter((r) => r[def.needKey] !== false);
  if (!involved.length) return "不涉及";

  const isReqDocDone = (r) => {
    if (def.key === "prd" && typeof resolvePrdDocsForDisplay === "function") {
      const docs = resolvePrdDocsForDisplay(r);
      if (docs.prdUrl && String(docs.prdUrl).trim()) return true;
      if (Array.isArray(docs.aiPrdFiles) && docs.aiPrdFiles.length) return true;
      if (Array.isArray(docs.attachments) && docs.attachments.length) return true;
      return false;
    }
    if ((def.key === "ux" || def.key === "ui") && typeof resolveUxUiForDisplay === "function") {
      const design = resolveUxUiForDisplay(r);
      const url = def.key === "ux" ? design.uxUrl : design.uiUrl;
      return !!(url && String(url).trim());
    }
    if (r[def.urlKey] && String(r[def.urlKey]).trim()) return true;
    // PRD：传统 PRD 或 AI PRD 任一有值，该需求即视为本阶段已完成
    if (def.key === "prd" && Array.isArray(r.aiPrdFiles) && r.aiPrdFiles.length) return true;
    return false;
  };

  const submitted = involved.filter(isReqDocDone);
  const allDone = submitted.length === involved.length;
  if (allDone) return "已完成";
  if (today > end) return "已超期";
  if (submitted.length > 0) return "进行中";
  return "未开始";
}

/** 开发/测试阶段：未开始 / 进行中 / 已完成 / 已超期 */
function getWorkPhaseStatus(reqs, dates, def, today = todayISO()) {
  if (!reqs.length) return "未开始";
  const deadline = dates && dates[def.end];
  const submitted = reqs.filter((r) => r[def.urlKey] && String(r[def.urlKey]).trim());
  const manual = reqs.map((r) => r[def.statusKey]).find((s) => s === "进行中" || s === "已完成");
  const allDone = submitted.length === reqs.length;

  if (allDone || manual === "已完成") return "已完成";
  if (manual === "进行中" || submitted.length > 0) {
    return deadline && today > deadline ? "已超期" : "进行中";
  }
  return deadline && today > deadline ? "已超期" : "未开始";
}

function getIterationPhaseStatus(it, phaseKey, today = todayISO()) {
  const def = ITERATION_PHASE_DEFS.find((p) => p.key === phaseKey);
  if (!def || !it) return "未开始";
  const reqs = getIterationRequirements(it.name, it.product);
  const dates = it.dates;
  if (def.type === "doc") return getDocPhaseStatus(reqs, dates, def, today);
  return getWorkPhaseStatus(reqs, dates, def, today);
}

/**
 * 阶段「实际」展示元数据（迭代详情排期用）
 * - 颜色：按时完成绿；超期一律红（含超期完成/超期进行/超期未开始）；未超期的未开始/进行中黄；不涉及灰
 * - 不涉及：无色条，计划/实际均为 --
 */
function getIterationPhaseActualInfo(it, phaseKey, today = todayISO()) {
  const def = ITERATION_PHASE_DEFS.find((p) => p.key === phaseKey);
  const status = getIterationPhaseStatus(it, phaseKey, today);
  const dates = it && it.dates;
  const start = dates && def ? dates[def.start] : "";
  const end = dates && def ? dates[def.end] : "";
  const actualEnd =
    (it && it.actualDates && def && it.actualDates[def.end]) ||
    (it && it.actualDates && it.actualDates[`${phaseKey}End`]) ||
    "";

  if (status === "不涉及") {
    return {
      status,
      showBar: false,
      planStart: "",
      planEnd: "",
      actualDate: "",
      color: "muted",
      done: false,
      overdue: false,
    };
  }

  if (status === "已完成") {
    const doneDate = actualEnd || end || "";
    const overdue = !!(end && doneDate && doneDate > end);
    return {
      status,
      showBar: !!(start && end),
      planStart: start || "",
      planEnd: end || "",
      actualDate: doneDate,
      color: overdue ? "late" : "ok",
      done: true,
      overdue,
    };
  }

  // 未开始 / 进行中 / 已超期（未完成）
  const overdue = status === "已超期";
  return {
    status,
    showBar: !!(start && end),
    planStart: start || "",
    planEnd: end || "",
    actualDate: "",
    color: overdue ? "late" : "pending",
    done: false,
    overdue,
  };
}

function getIterationPhaseStatuses(it, today = todayISO()) {
  const out = {};
  ITERATION_PHASE_DEFS.forEach((p) => {
    out[p.key] = getIterationPhaseStatus(it, p.key, today);
  });
  return out;
}

/**
 * 进展状态：未开始 / 进行中 / 已完成 / 已超期
 * - 已超期：仅当「测试验收」已超期（最终超期）
 * - 中途阶段（PRD/UX/UI/开发）超期：只算步骤超期，整体仍为「进行中」
 * - 已完成：各阶段均为「已完成」或「不涉及」
 * - 未开始：各阶段均为「未开始」或「不涉及」
 * - 进行中：其余
 */
function getIterationProgressStatus(it, today = todayISO()) {
  const statuses = getIterationPhaseStatuses(it, today);
  if (statuses.test === "已超期") return "已超期";
  const active = Object.values(statuses).filter((s) => s !== "不涉及");
  if (!active.length) return "未开始";
  if (active.every((s) => s === "未开始")) return "未开始";
  if (active.every((s) => s === "已完成")) return "已完成";
  return "进行中";
}

function isIterationOverdueCompleted(it, today = todayISO()) {
  if (it && it.overdueCompleted) return true;
  return getIterationProgressStatus(it, today) === "已完成" && !!(it && it.wasOverdue);
}

function getIterationReqCount(name, product) {
  return getGanttRows().filter(
    (r) => r.iteration === name && (!product || r.product === product)
  ).length;
}

/** 迭代内 SR 是否含敏捷 / TOS 类型 */
function getIterationTypeFlags(name, product) {
  const reqs = getIterationRequirements(name, product);
  const types = new Set();
  reqs.forEach((r) => getReqTypeSet(r).forEach((t) => types.add(t)));
  return {
    hasAgile: types.has("敏捷迭代"),
    hasTos: types.has("TOS版本"),
  };
}

function getGanttRows() {
  return REQUIREMENTS.filter(
    (r) =>
      isIterationLeaf(r) &&
      r.scheduleDates &&
      r.scheduleDates.devStart &&
      r.scheduleDates.devEnd &&
      r.scheduleDates.testStart &&
      r.scheduleDates.testEnd
  );
}

function parseISODate(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a, b) {
  const ms = parseISODate(b) - parseISODate(a);
  return Math.round(ms / 86400000);
}

function monthIndex(iso) {
  const [y, m] = String(iso).slice(0, 7).split("-").map(Number);
  return y * 12 + m;
}

/** 按产品 + 目标交付月匹配该产品下的迭代排期（查完整目录） */
function pickIterationForDeliverMonth(deliverMonth, product) {
  const list = ITERATION_CATALOG.filter((it) => it.dates && (!product || it.product === product))
    .slice()
    .sort((a, b) => iterationNum(b.name) - iterationNum(a.name));
  const ym = deliverMonth && deliverMonth !== "-" ? deliverMonth : null;
  if (ym && list.length) {
    const exact = list.find((it) => it.dates.testEnd.slice(0, 7) === ym);
    if (exact) return exact;
    const ranked = list
      .map((it) => ({ it, diff: Math.abs(monthIndex(it.dates.testEnd) - monthIndex(`${ym}-01`)) }))
      .sort((a, b) => a.diff - b.diff);
    if (ranked.length) return ranked[0].it;
  }
  return list[0] || null;
}

/** 参考表节奏：PRD → UX → UI → 开发 → 测试 */
function buildScheduleDatesForMonth(deliverMonth) {
  const ym = deliverMonth && deliverMonth !== "-" ? deliverMonth : "2026-07";
  const testEnd = `${ym}-25`;
  const testStart = addDaysISO(testEnd, -5);
  const devEnd = addDaysISO(testStart, -3);
  const devStart = addDaysISO(devEnd, -5);
  const uiEnd = addDaysISO(devStart, -3);
  const uiStart = addDaysISO(uiEnd, -1);
  const uxEnd = addDaysISO(uiStart, -2);
  const uxStart = addDaysISO(uxEnd, -10);
  const prdEnd = addDaysISO(uxStart, -1);
  const prdStart = addDaysISO(prdEnd, -18);
  return { prdStart, prdEnd, uxStart, uxEnd, uiStart, uiEnd, devStart, devEnd, testStart, testEnd };
}

// IR：需求编号 +（若已进入排期态）AI 提效字段；文档标可能在 IR 或 SR，见 seedPrdOwnershipDemo
REQUIREMENTS.forEach((row) => {
  if (isIR(row)) {
    if (!row.reqCode) row.reqCode = makeReqCode(row.id, row.requestDate);
    if (!SCHEDULED_STATUSES.includes(row.status)) return;
    if (!row.aiDemoUrl) row.aiDemoUrl = `https://demo.example.com/req/${row.id}`;
    if (!row.aiDemoDuration) row.aiDemoDuration = ["1h30min", "2h40min", "45min", "3h"][row.id % 4];
    if (row.prdUrl === undefined) row.prdUrl = "";
    if (row.aiPrdFiles === undefined) row.aiPrdFiles = [];
    if (row.aiTrackUrl === undefined) {
      row.aiTrackUrl = row.id % 3 === 0 ? "" : `https://track.example.com/req/${row.id}`;
    }
    if (row.aiPrdFeedback === undefined) {
      const feedbacks = ["", "缺少边界case描述", "", "建议补充性能指标", "", "接口文档待补充", ""];
      row.aiPrdFeedback = feedbacks[row.id % feedbacks.length];
    }
    if (row.followUpNote === undefined) {
      const notes = [
        "",
        "已采纳边界 case 补充，PRD 本周改完",
        "",
        "Demo 时长偏长，拆成两轮演示",
        "",
        "埋点方案待与数据同学对齐",
        "暂不跟进，优先级下调",
      ];
      row.followUpNote = notes[row.id % notes.length];
    }
    seedAiPrdFeedbacks(row);
    return;
  }

  // 未排期 SR/AR：仅补编号，文档由 seedPrdOwnershipDemo / seedIterationDeliverables 统一挂
  if (isIterationLeaf(row) && !SCHEDULED_STATUSES.includes(row.status)) {
    if (!row.reqCode) {
      row.reqCode = isAR(row)
        ? makeArCode(row.id, row.requestDate)
        : makeSrCode(row.id, row.requestDate);
    }
    if (row.prdUrl === undefined) row.prdUrl = "";
    if (row.aiPrdFiles === undefined) row.aiPrdFiles = [];
    return;
  }

  if (!isIterationLeaf(row) || !SCHEDULED_STATUSES.includes(row.status)) return;

  if (!row.reqCode) {
    row.reqCode = isAR(row)
      ? makeArCode(row.id, row.requestDate)
      : makeSrCode(row.id, row.requestDate);
  }
  if (!row.aiDemoUrl) row.aiDemoUrl = `https://demo.example.com/req/${row.id}`;
  if (!row.aiDemoDuration) row.aiDemoDuration = ["1h30min", "2h40min", "45min", "3h"][row.id % 4];
  if (row.prdUrl === undefined) row.prdUrl = "";
  if (row.aiPrdFiles === undefined) row.aiPrdFiles = [];
  if (row.aiTrackUrl === undefined) {
    row.aiTrackUrl = row.id % 3 === 0 ? "" : `https://track.example.com/req/${row.id}`;
  }
  if (row.aiPrdFeedback === undefined) {
    const feedbacks = ["", "缺少边界case描述", "", "建议补充性能指标", "", "接口文档待补充", ""];
    row.aiPrdFeedback = feedbacks[row.id % feedbacks.length];
  }
  if (row.followUpNote === undefined) {
    const notes = [
      "",
      "已采纳边界 case 补充，PRD 本周改完",
      "",
      "Demo 时长偏长，拆成两轮演示",
      "",
      "埋点方案待与数据同学对齐",
      "暂不跟进，优先级下调",
    ];
    row.followUpNote = notes[row.id % notes.length];
  }
  seedAiPrdFeedbacks(row);

  const catalogList = ITERATION_CATALOG.filter((it) => it.product === row.product && it.dates).sort(
    (a, b) => iterationNum(b.name) - iterationNum(a.name)
  );
  const picked = catalogList.length
    ? catalogList[row.id % catalogList.length]
    : pickIterationForDeliverMonth(row.deliverMonth, row.product);
  if (!row.iteration) {
    row.iteration = picked ? picked.name : "S24";
  }

  const it = findIteration(row.iteration, row.product) || picked;
  if (it && it.dates) {
    row.scheduleDates = { ...it.dates };
  } else if (!row.scheduleDates) {
    row.scheduleDates = buildScheduleDatesForMonth(row.deliverMonth);
  }

  if (row.scheduleDates.testEnd) {
    row.deliverMonth = row.scheduleDates.testEnd.slice(0, 7);
  }
});

/** 将 IR 的 iteration 与其子 SR 对齐（同一 IR 不跨迭代） */
function syncIrIterationFromSrs() {
  getPoolRows().forEach((ir) => {
    const srs = REQUIREMENTS.filter((r) => isSR(r) && r.parentId === ir.id && r.iteration);
    if (!srs.length) return;
    ir.iteration = srs[0].iteration;
    if (srs[0].deliverMonth) ir.deliverMonth = srs[0].deliverMonth;
  });
}

/**
 * 迭代列表与甘特对齐：只保留「已排期需求」覆盖到的 产品×迭代
 * 后续「迭代下需求」看板可直接复用同一数据源
 */
function rebuildIterationsFromGantt() {
  const prevByKey = new Map();
  ITERATIONS.forEach((it) => {
    prevByKey.set(`${it.product}||${it.name}`, it);
  });
  const map = new Map();
  getGanttRows().forEach((r) => {
    const name = r.iteration || "未归属";
    const key = `${r.product}||${name}`;
    if (map.has(key)) return;
    const catalog = findIteration(name, r.product);
    const prev = prevByKey.get(key) || catalog;
    map.set(key, {
      product: r.product,
      name,
      dates: catalog && catalog.dates
        ? { ...catalog.dates }
        : r.scheduleDates
          ? { ...r.scheduleDates }
          : null,
      reqChangeLog: prev && Array.isArray(prev.reqChangeLog) ? prev.reqChangeLog.slice() : undefined,
      scheduleChangeLog:
        prev && Array.isArray(prev.scheduleChangeLog) ? prev.scheduleChangeLog.slice() : undefined,
      overdueRecords: prev && Array.isArray(prev.overdueRecords) ? prev.overdueRecords.slice() : undefined,
      actualDates: prev && prev.actualDates ? { ...prev.actualDates } : undefined,
      overdueCompleted: !!(prev && prev.overdueCompleted),
      wasOverdue: !!(prev && prev.wasOverdue),
      // 研测填写的 APK 需跨重建保留，供版本发布看板同步
      apkUrl: prev && prev.apkUrl != null ? prev.apkUrl : undefined,
      apkVersion: prev && prev.apkVersion != null ? prev.apkVersion : undefined,
      apkFilledAt: prev && prev.apkFilledAt ? prev.apkFilledAt : undefined,
    });
  });
  ITERATIONS.length = 0;
  [...map.values()]
    .sort((a, b) => {
      const pc = String(a.product || "").localeCompare(String(b.product || ""), "zh");
      if (pc !== 0) return pc;
      return iterationNum(a.name) - iterationNum(b.name);
    })
    .forEach((it) => ITERATIONS.push(it));
  if (typeof applyPersistedApkToIterations === "function") {
    applyPersistedApkToIterations();
  }
}

rebuildIterationsFromGantt();

/**
 * 调整已排期需求的产品×迭代归属，覆盖规格中的演示场景：
 * 未开始 / 进行中 / 已完成 / 已超期 / 超期完成 / 不涉及
 */
function seedIterationAssignmentsForDemo() {
  const picks = [
    // 日活 S22：已完成
    [101, "日活", "S22"],
    // 日活 S24：进行中（PRD 完成，开发进行中）
    [102, "日活", "S24"],
    // 搜索 S23：已完成 + 超期完成
    [103, "搜索", "S23"],
    [104, "搜索", "S23"],
    // 搜索 S24：PRD 进行中 + UX/UI 不涉及
    [105, "搜索", "S24"],
    [106, "搜索", "S24"],
    // 百宝箱 S22：测试验收已超期（截止日期已过且未提交报告）
    [107, "百宝箱", "S22"],
    // 百宝箱 S23：已完成
    [108, "百宝箱", "S23"],
    // 时刻 S25：未开始（含 IR6 拆出的 2 个 SR）
    [109, "时刻", "S25"],
    [110, "时刻", "S25"],
    [111, "时刻", "S25"],
    [112, "时刻", "S25"],
    // Note S23：已完成
    [113, "Note", "S23"],
  ];

  picks.forEach(([id, product, iteration]) => {
    const row = REQUIREMENTS.find((r) => r.id === id);
    if (!row || !isSR(row)) return;
    row.product = product;
    row.iteration = iteration;
    if (!SCHEDULED_STATUSES.includes(row.status)) {
      row.status = "已排期";
    }
    const it = findIteration(iteration, product);
    if (it && it.dates) {
      row.scheduleDates = { ...it.dates };
      row.deliverMonth = it.dates.testEnd.slice(0, 7);
    }
    if (!row.reqCode) row.reqCode = makeSrCode(row.id, row.requestDate);
  });

  syncIrIterationFromSrs();
  rebuildIterationsFromGantt();
}

/** 按产品迭代看板规格，为各迭代种子阶段交付物与状态演示数据 */
function seedIterationDeliverables() {
  const markDoc = (row, { needPrd, needUx, needUi, prdUrl, uxUrl, uiUrl }) => {
    if (needPrd !== undefined) row.needPrd = needPrd;
    if (needUx !== undefined) row.needUx = needUx;
    if (needUi !== undefined) row.needUi = needUi;
    if (prdUrl !== undefined) row.prdUrl = prdUrl;
    if (uxUrl !== undefined) row.uxUrl = uxUrl;
    if (uiUrl !== undefined) row.uiUrl = uiUrl;
  };

  const markWork = (row, { devPhaseStatus, testPhaseStatus, testBuildUrl, testReportUrl }) => {
    if (devPhaseStatus !== undefined) row.devPhaseStatus = devPhaseStatus;
    if (testPhaseStatus !== undefined) row.testPhaseStatus = testPhaseStatus;
    if (testBuildUrl !== undefined) row.testBuildUrl = testBuildUrl;
    if (testReportUrl !== undefined) row.testReportUrl = testReportUrl;
    if (testBuildUrl) {
      row.testSubmitVersion = row.testSubmitVersion || row.version || `17.0.0.${String(row.id).padStart(3, "0")}`;
      row.testSubmitter = row.testSubmitter || row.owner || "张伟";
      if (row.testAdvice === undefined) row.testAdvice = row.id % 2 === 0 ? "关注兼容性回归" : "";
    }
    if (testReportUrl) {
      row.testConclusion = row.testConclusion || "PASS";
      if (row.testRemark === undefined) row.testRemark = row.id % 3 === 0 ? "已覆盖核心路径" : "";
    }
  };

  const byIter = (product, name) =>
    REQUIREMENTS.filter(
      (r) =>
        isIterationLeaf(r) &&
        r.product === product &&
        r.iteration === name &&
        r.scheduleDates &&
        r.scheduleDates.devStart &&
        r.scheduleDates.devEnd &&
        r.scheduleDates.testStart &&
        r.scheduleDates.testEnd
    );

  const url = (type, id) => `https://${type}.example.com/req/${id}`;

  // 默认字段：敏捷默认需要 PRD/UX/UI；TOS 可跳过 UX/UI
  getGanttRows().forEach((row) => {
    row.needPrd = row.needPrd !== false;
    if (row.needUx === undefined) row.needUx = !isTosType(row);
    if (row.needUi === undefined) row.needUi = !isTosType(row);
    if (row.prdUrl === undefined) row.prdUrl = "";
    if (row.uxUrl === undefined) row.uxUrl = "";
    if (row.uiUrl === undefined) row.uiUrl = "";
    if (row.testBuildUrl === undefined) row.testBuildUrl = "";
    if (row.testReportUrl === undefined) row.testReportUrl = "";
    if (row.devPhaseStatus === undefined) row.devPhaseStatus = null;
    if (row.testPhaseStatus === undefined) row.testPhaseStatus = null;
  });

  const markAllDone = (r) => {
    markDoc(r, {
      prdUrl: url("prd", r.id),
      uxUrl: r.needUx ? url("ux", r.id) : "",
      uiUrl: r.needUi ? url("ui", r.id) : "",
    });
    markWork(r, {
      devPhaseStatus: "已完成",
      testPhaseStatus: "已完成",
      testBuildUrl: url("build", r.id),
      testReportUrl: url("report", r.id),
    });
  };

  // 日活 S22：部分已完成，部分仍在开发
  byIter("日活", "S22").forEach((r) => {
    if (r.status === "已完成" || r.status === "测试中") {
      markAllDone(r);
      if (r.status === "测试中") {
        r.testReportUrl = "";
      }
    } else {
      markDoc(r, {
        prdUrl: url("prd", r.id),
        uxUrl: r.needUx ? url("ux", r.id) : "",
        uiUrl: r.needUi ? url("ui", r.id) : "",
      });
      markWork(r, {
        devPhaseStatus: "进行中",
        testBuildUrl: "",
        testReportUrl: "",
      });
    }
  });

  // 日活 S24：混合状态 — 部分需求已转测/测试中，部分仍在开发
  byIter("日活", "S24").forEach((r) => {
    markDoc(r, {
      prdUrl: url("prd", r.id),
      uxUrl: r.needUx ? url("ux", r.id) : "",
      uiUrl: "",
    });
    if (r.status === "测试中" || r.status === "已完成") {
      markWork(r, {
        devPhaseStatus: "已完成",
        testBuildUrl: url("build", r.id),
        testReportUrl: r.status === "已完成" ? url("report", r.id) : "",
      });
    } else {
      markWork(r, { devPhaseStatus: "进行中", testBuildUrl: "", testReportUrl: "" });
    }
  });

  // 搜索 S23：补齐测试报告后测试验收为已完成；实际晚于计划 → 迭代旁「超期完成」
  byIter("搜索", "S23").forEach((r) => {
    if (isTosType(r)) {
      markDoc(r, { needUx: false, needUi: false });
    }
    markDoc(r, {
      prdUrl: url("prd", r.id),
      uxUrl: r.needUx ? url("ux", r.id) : "",
      uiUrl: r.needUi ? url("ui", r.id) : "",
    });
    markWork(r, {
      devPhaseStatus: "已完成",
      testPhaseStatus: "已完成",
      testBuildUrl: url("build", r.id),
      testReportUrl: url("report", r.id),
    });
  });
  const searchS23 = findIteration("S23", "搜索");
  if (searchS23 && searchS23.dates) {
    searchS23.overdueCompleted = true;
    searchS23.wasOverdue = true;
    searchS23.actualDates = {
      prdEnd: searchS23.dates.prdEnd,
      uxEnd: addDaysISO(searchS23.dates.uxEnd, 1),
      uiEnd: searchS23.dates.uiEnd,
      devEnd: searchS23.dates.devEnd,
      testEnd: addDaysISO(searchS23.dates.testEnd, 2),
    };
  }

  // 搜索 S24：UX/UI 不涉及；部分已完成，部分仍在开发
  byIter("搜索", "S24").forEach((r, i) => {
    markDoc(r, {
      needUx: false,
      needUi: false,
      prdUrl: i === 0 || r.status === "已完成" ? url("prd", r.id) : "",
    });
    if (r.status === "已完成") {
      markWork(r, {
        devPhaseStatus: "已完成",
        testBuildUrl: url("build", r.id),
        testReportUrl: url("report", r.id),
      });
    } else if (r.status === "测试中") {
      markWork(r, {
        devPhaseStatus: "已完成",
        testBuildUrl: url("build", r.id),
        testReportUrl: "",
      });
    } else {
      markWork(r, {
        devPhaseStatus: "进行中",
        testBuildUrl: "",
        testReportUrl: "",
      });
    }
  });

  // 百宝箱 S22：测试验收已超期 → 进展状态「已超期」
  byIter("百宝箱", "S22").forEach((r) => {
    markDoc(r, {
      prdUrl: url("prd", r.id),
      uxUrl: "",
      uiUrl: "",
      needUx: false,
      needUi: false,
    });
    if (r.status === "开发中") {
      markWork(r, {
        devPhaseStatus: "进行中",
        testBuildUrl: "",
        testReportUrl: "",
        testPhaseStatus: null,
      });
    } else {
      markWork(r, {
        devPhaseStatus: "已完成",
        testBuildUrl: url("build", r.id),
        testReportUrl: r.status === "已完成" ? url("report", r.id) : "",
        testPhaseStatus: null,
      });
    }
  });

  // 百宝箱 S23：已完成
  byIter("百宝箱", "S23").forEach(markAllDone);

  // 时刻 S25：未开始
  byIter("时刻", "S25").forEach((r) => {
    markDoc(r, { prdUrl: "", uxUrl: "", uiUrl: "" });
    markWork(r, {
      devPhaseStatus: null,
      testPhaseStatus: null,
      testBuildUrl: "",
      testReportUrl: "",
    });
  });

  // Note S23：已完成
  byIter("Note", "S23").forEach(markAllDone);

  // 子 AR 默认不重复挂文档（热榜 AR 标在 seedPrdOwnershipDemo）
  REQUIREMENTS.filter(isSR).forEach((sr) => {
    const ars = getChildArsOf(sr.id);
    if (!ars.length) return;
    if (sr.id === 106) return;
    ars.forEach((ar) => {
      ar.prdUrl = "";
      ar.aiPrdFiles = [];
      if (Array.isArray(ar.attachments)) ar.attachments = [];
      ar.uxUrl = "";
      ar.uiUrl = "";
      ar.docMark = false;
      ar.inheritedDocFrom = undefined;
    });
  });

  seedIterationChangeLogs();
}

/** 迭代详情「变更记录」演示数据 */
function seedIterationChangeLogs() {
  const attach = (product, name, changeLog, overdueRecords, scheduleChangeLog) => {
    const it = findIteration(name, product);
    if (!it) return;
    it.reqChangeLog = changeLog;
    it.overdueRecords = overdueRecords || [];
    if (scheduleChangeLog) it.scheduleChangeLog = scheduleChangeLog;
  };

  // 搜索 S23：完整变更时间线 + 超期记录 + 排期变更（对齐 Figma 254:4）
  attach(
    "搜索",
    "S23",
    [
      {
        time: "2026-05-18 14:30",
        type: "add",
        title: "新增需求「消息推送渠道扩展」SR-202603-003382",
        reason: "产品规划调整，需要在本迭代完成推送能力建设",
      },
      {
        time: "2026-05-15 10:20",
        type: "transfer",
        title: "需求「搜索结果优化」SR-202603-003389 转移至 S22 迭代",
        reason: "开发资源不足，优先级调整延期至下一迭代",
      },
      {
        time: "2026-05-10 09:15",
        type: "delete",
        title: "删除需求「旧版兼容适配」SR-202603-003391",
        reason: "经评审该需求已不再适用，旧版本已下线",
      },
      {
        time: "2026-04-20 16:45",
        type: "add",
        title: "新增需求「首页推荐算法升级」SR-202603-003381",
        reason: "用户反馈首页推荐不精准，需紧急优化",
      },
      {
        time: "2026-04-07 11:00",
        type: "add",
        title: "新增需求「用户登录功能优化」SR-202603-003380",
        reason: "迭代初始需求规划",
      },
    ],
    [
      {
        phase: "UX 阶段",
        plan: "计划 04/26 - 05/06",
        actual: "实际: 05/07",
        actualKind: "done-late",
        daysLabel: "超期 1天",
        daysKind: "overdue",
        reason: "设计方案评审返工",
        note: "建议后续预留评审缓冲时间",
      },
      {
        phase: "开发阶段",
        plan: "计划 05/12 - 05/17",
        actual: "实际: 05/20",
        actualKind: "done-late",
        daysLabel: "超期 3天",
        daysKind: "overdue",
        reason: "推送渠道需求新增导致工作量增加",
        note: "已协调增加1名开发支援，最终05/20完成",
      },
      {
        phase: "测试验收",
        plan: "计划 05/18 - 05/24",
        actual: "实际: 05/26",
        actualKind: "done-late",
        daysLabel: "超期 2天",
        daysKind: "overdue",
        reason: "开发延期连带测试收口推迟",
        note: "已补齐测试报告，结论 PASS",
      },
    ],
    [
      {
        time: "2026-05-08 14:30",
        title: "UX开始时间 04/26 → 05/03，UX结束时间 05/06 → 05/12",
        reason: "设计方案需补充用户调研，整体后移",
      },
      {
        time: "2026-05-05 10:20",
        title: "UI开始时间 05/08 → 05/14，UI结束时间 05/09 → 05/16",
        reason: "UX交付延后，UI跟随调整",
      },
      {
        time: "2026-04-22 09:15",
        title: "开发开始时间 05/10 → 05/15，开发结束时间 05/17 → 05/22",
        reason: "前端资源临时支援其他项目",
      },
    ]
  );

  // 日活 S24：少量变更
  attach(
    "日活",
    "S24",
    [
      {
        time: "2026-07-18 11:20",
        type: "add",
        title: "新增需求「桌面小组件性能优化」SR-202604-000101",
        reason: "迭代排期纳入",
      },
      {
        time: "2026-07-10 09:00",
        type: "transfer",
        title: "需求「负一屏内容分发」SR-202603-000102 转移至 S25 迭代",
        reason: "本迭代容量不足",
      },
    ],
    []
  );

  // 百宝箱 S22：有超期
  attach(
    "百宝箱",
    "S22",
    [
      {
        time: "2026-05-20 16:00",
        type: "add",
        title: "新增需求「百宝箱入口改版」SR-202605-000107",
        reason: "迭代初始需求规划",
      },
    ],
    [
      {
        phase: "测试验收",
        plan: "计划 06/04 - 06/12",
        actual: "实际: --",
        actualKind: "late",
        daysLabel: "超期 41天",
        daysKind: "overdue",
        reason: "提测阻塞，用例未齐",
        note: "待补齐回归用例后再提测",
      },
    ]
  );
}

function getIterationReqChangeLog(it) {
  return Array.isArray(it && it.reqChangeLog) ? it.reqChangeLog.slice() : [];
}

function pushIterationReqChange(it, entry) {
  if (!it) return;
  if (!Array.isArray(it.reqChangeLog)) it.reqChangeLog = [];
  it.reqChangeLog.unshift({
    time: entry.time || formatDateTimeNow(),
    type: entry.type || "add",
    title: entry.title || "",
    reason: entry.reason || "",
  });
}

function getIterationScheduleChangeLog(it) {
  return Array.isArray(it && it.scheduleChangeLog) ? it.scheduleChangeLog.slice() : [];
}

function pushIterationScheduleChange(it, entry) {
  if (!it) return;
  if (!Array.isArray(it.scheduleChangeLog)) it.scheduleChangeLog = [];
  it.scheduleChangeLog.unshift({
    time: entry.time || formatDateTimeNow(),
    title: entry.title || "",
    reason: entry.reason || "",
  });
}

/** 对比新旧排期，生成「UX开始时间 04/26 → 05/03」类摘要 */
function buildScheduleChangeSummary(oldDates, newDates) {
  const labels = [
    ["prdStart", "PRD开始时间"],
    ["prdEnd", "PRD结束时间"],
    ["uxStart", "UX开始时间"],
    ["uxEnd", "UX结束时间"],
    ["uiStart", "UI开始时间"],
    ["uiEnd", "UI结束时间"],
    ["devStart", "开发开始时间"],
    ["devEnd", "开发结束时间"],
    ["testStart", "测试开始时间"],
    ["testEnd", "测试结束时间"],
  ];
  const fmt = (iso) => {
    if (!iso) return "--";
    const m = String(iso).match(/^\d{4}-(\d{2})-(\d{2})/);
    return m ? `${m[1]}/${m[2]}` : iso;
  };
  const parts = [];
  labels.forEach(([key, label]) => {
    const a = (oldDates && oldDates[key]) || "";
    const b = (newDates && newDates[key]) || "";
    if (a === b) return;
    parts.push(`${label} ${fmt(a)} → ${fmt(b)}`);
  });
  return parts.join("，");
}

function getIterationOverdueRecords(it) {
  if (Array.isArray(it && it.overdueRecords) && it.overdueRecords.length) {
    return it.overdueRecords.slice();
  }
  return [];
}

seedIterationAssignmentsForDemo();
seedIterationDeliverables();

/**
 * 文档挂载（产品打标点）：
 * - 需求池标在 IR → PRD / UX / UI 都落在该 IR
 * - 标在 SR → 都落在该 SR
 * - 「文档」标 = 打标位置（docMark），不是「已经有文件」
 * - 例外：热榜拆到 AR1003/1004
 */
function seedPrdOwnershipDemo() {
  const url = (type, id) => `https://${type}.example.com/req/${id}`;

  const clearDocs = (row) => {
    if (!row) return;
    row.aiPrdFiles = [];
    row.prdUrl = "";
    if (Array.isArray(row.attachments)) row.attachments = [];
  };

  const clearDesignUrls = (row) => {
    if (!row) return;
    row.uxUrl = "";
    row.uiUrl = "";
  };

  const clearMark = (row) => {
    if (!row) return;
    row.docMark = false;
    row.inheritedDocFrom = undefined;
    clearDocs(row);
  };

  // 先清空所有打标与文档字段（交付物 need*/工作状态保留在叶子上）
  REQUIREMENTS.forEach((r) => {
    clearMark(r);
  });

  const placeMark = (id, { aiName, prdUrl, fileName, needUx, needUi }) => {
    const row = REQUIREMENTS.find((r) => r.id === id);
    if (!row) return null;
    row.docMark = true;
    row.needPrd = true;
    const ux = needUx !== undefined ? !!needUx : row.needUx !== false && !isTosType(row);
    const ui = needUi !== undefined ? !!needUi : row.needUi !== false && !isTosType(row);
    row.needUx = ux;
    row.needUi = ui;
    if (aiName) {
      row.aiPrdFiles = [{ name: aiName, size: "2.0 MB" }];
      row.prdUrl = "";
    } else if (prdUrl || fileName) {
      row.prdUrl = prdUrl || "";
      row.attachments = fileName ? [{ name: fileName, size: "1.2 MB" }] : [];
      row.aiPrdFiles = [];
    }
    row.uxUrl = ux ? url("ux", id) : "";
    row.uiUrl = ui ? url("ui", id) : "";
    return row;
  };

  /** 标在 IR：子 SR/AR 去掉文档与设计链接，涉及阶段跟 IR 对齐 */
  const markOnIr = (irId, opts) => {
    const ir = placeMark(irId, opts);
    if (!ir) return;
    getChildSrsOf(irId).forEach((sr) => {
      clearMark(sr);
      clearDesignUrls(sr);
      sr.needPrd = true;
      sr.needUx = ir.needUx;
      sr.needUi = ir.needUi;
      getChildArsOf(sr.id).forEach((ar) => {
        clearMark(ar);
        clearDesignUrls(ar);
        ar.needPrd = true;
        ar.needUx = ir.needUx;
        ar.needUi = ir.needUi;
      });
    });
  };

  /** 标在 SR：父 IR 不占文档标；子 AR 清空 */
  const markOnSr = (srId, opts) => {
    const sr = placeMark(srId, opts);
    if (!sr) return;
    const ir = getParentReq(sr);
    if (ir && isIR(ir) && !ir.docMark) {
      clearDocs(ir);
      clearDesignUrls(ir);
    }
    getChildArsOf(srId).forEach((ar) => {
      clearMark(ar);
      clearDesignUrls(ar);
      ar.needPrd = true;
      ar.needUx = sr.needUx;
      ar.needUi = sr.needUi;
    });
  };

  // —— 需求池产品标在 IR（1:1 常见）——
  markOnIr(8, { aiName: "桌面小组件性能优化_AI_PRD.pdf" });
  markOnIr(9, { aiName: "搜索联想词排序策略升级_AI_PRD.pdf" });
  markOnIr(14, { aiName: "搜索空结果页引导优化_AI_PRD.pdf", needUx: false, needUi: false });
  markOnIr(10, { aiName: "Note云同步_AI_PRD.pdf" });
  markOnIr(11, { aiName: "百宝箱入口改版_AI_PRD.pdf", needUx: false, needUi: false });
  markOnIr(12, { aiName: "时刻卡片动效统一_AI_PRD.pdf" });
  markOnIr(17, { aiName: "百宝箱小工具商店_AI_PRD.pdf", needUx: false, needUi: false });
  markOnIr(24, { aiName: "时刻纪念日提醒_AI_PRD.pdf" });

  // —— 标在 SR（拆分 / 落地在 SR）——
  markOnSr(102, { aiName: "日活负一屏内容分发_AI_PRD.pdf", needUx: false, needUi: false });
  markOnSr(105, { aiName: "搜索语音输入体验优化_AI_PRD.pdf", needUx: false, needUi: false });
  markOnSr(109, { aiName: "时刻感-首页氛围动效_AI_PRD.pdf" });
  markOnSr(110, { aiName: "时刻感-内容推荐策略_AI_PRD.pdf" });

  // 未排期：SR114/115 无标；SR116 传统 PRD 标在 SR
  clearMark(REQUIREMENTS.find((r) => r.id === 114));
  clearMark(REQUIREMENTS.find((r) => r.id === 115));
  markOnSr(116, {
    prdUrl: "https://prd.example.com/req/116",
    fileName: "搜索结果卡信息架构_PRD.pdf",
    needUx: true,
    needUi: true,
  });
  [1012, 1013].forEach((id) => clearMark(REQUIREMENTS.find((r) => r.id === id)));

  // —— 反向例外：热榜文档标在 AR ——
  clearMark(REQUIREMENTS.find((r) => r.id === 106));
  const sr106 = REQUIREMENTS.find((r) => r.id === 106);
  if (sr106) {
    sr106.needPrd = false;
    sr106.needUx = false;
    sr106.needUi = false;
    clearDesignUrls(sr106);
  }
  [
    [1003, "热榜缓存-读写策略_AI_PRD.pdf"],
    [1004, "热榜缓存-失效兜底_AI_PRD.pdf"],
  ].forEach(([id, name]) => {
    const ar = placeMark(id, { aiName: name, needUx: false, needUi: false });
    if (!ar) return;
    ar.inheritedDocFrom = ar.id;
  });
}

seedPrdOwnershipDemo();

/** 演示用：一条 TOS 提醒项管、一条敏捷迭代置换（挂在 IR 上，供需求池展示） */
function seedScheduleChangeHistory() {
  const tosRow = REQUIREMENTS.find((r) => r.id === 11);
  if (tosRow) {
    const iter = tosRow.iteration || "S22";
    tosRow.scheduleChangeHistory = [
      {
        time: "2026-07-18 10:20",
        operator: tosRow.owner,
        fromIteration: iter,
        toIteration: "",
        reason: "开发排期需后移一周，请项管协助确认迭代安排",
        type: "tos_remind",
      },
      {
        time: "2026-07-21 14:30",
        operator: tosRow.owner,
        fromIteration: iter,
        toIteration: "",
        reason: "百宝箱入口改版依赖设计终稿，仍未收到确认",
        type: "tos_remind",
      },
    ];
  }

  const agileRow = REQUIREMENTS.find((r) => r.id === 6);
  if (agileRow) {
    const toIter = agileRow.iteration || "S25";
    const fromIter = "S24";
    agileRow.scheduleChangeHistory = [
      {
        time: "2026-07-16 11:05",
        operator: agileRow.owner,
        fromIteration: fromIter,
        toIteration: toIter,
        reason: "与主版本节奏对齐，整体后移一个迭代",
        type: "swap",
      },
    ];
  }
}

seedScheduleChangeHistory();

function formatDateTimeNow() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function getScheduleChangeHistory(row) {
  return Array.isArray(row && row.scheduleChangeHistory) ? row.scheduleChangeHistory : [];
}

function getLatestScheduleChange(row) {
  const list = getScheduleChangeHistory(row);
  return list.length ? list[list.length - 1] : null;
}

function pushScheduleChange(row, entry) {
  if (!row) return;
  if (!Array.isArray(row.scheduleChangeHistory)) row.scheduleChangeHistory = [];
  row.scheduleChangeHistory.push({
    time: formatDateTimeNow(),
    operator: entry.operator || row.owner || "产品",
    fromIteration: entry.fromIteration || "",
    toIteration: entry.toIteration || "",
    reason: entry.reason || "",
    type: entry.type || "swap",
  });
}

function hasAiEfficiencyAssets(row) {
  const hasPrd = !!(row.aiPrdFiles && row.aiPrdFiles.length);
  const hasDemo = !!(row.aiDemoUrl && String(row.aiDemoUrl).trim());
  const hasTrack = !!(row.aiTrackUrl && String(row.aiTrackUrl).trim());
  return hasPrd || hasDemo || hasTrack;
}

/** AI 提效看板仍按 IR 聚合；AI PRD 可来自子 SR */
function resolveAiPrdFiles(row) {
  if (!row) return [];
  if (row.aiPrdFiles && row.aiPrdFiles.length) return row.aiPrdFiles;
  if (isIR(row)) {
    for (const sr of getChildSrsOf(row.id)) {
      if (sr.aiPrdFiles && sr.aiPrdFiles.length) return sr.aiPrdFiles;
    }
  }
  return [];
}

function getAiEfficiencyRows() {
  return getPoolRows().filter((ir) => {
    if (hasAiEfficiencyAssets(ir)) return true;
    return getChildSrsOf(ir.id).some((sr) => reqHasAiPrd(sr));
  });
}

/** 将字符串摘要升级为多条反馈；部分需求补设计稿级样本 */
function seedAiPrdFeedbacks(row) {
  if (Array.isArray(row.aiPrdFeedbacks)) {
    syncAiPrdFeedbackSummary(row);
    return;
  }

  const samples = [
    [
      {
        name: "张伟",
        role: "后端研发",
        time: "2026-07-15 14:30",
        content: "缺少边界case的描述，建议补充以下场景：\n1. 用户未登录时的触达逻辑\n2. 推送频率超限的降级策略\n3. 多端同时在线时的去重规则",
      },
      {
        name: "李明",
        role: "前端研发",
        time: "2026-07-16 09:15",
        content: "接口响应时间要求需要明确，建议增加性能指标要求：P99延迟<200ms。",
      },
      {
        name: "王芳",
        role: "测试开发",
        time: "2026-07-18 16:45",
        content: "埋点方案中缺少AB实验分组标识，需要补充实验ID字段。",
      },
    ],
    [
      {
        name: "李明",
        role: "前端研发",
        time: "2026-07-10 11:20",
        content: "建议补充性能指标，尤其是首屏渲染与弱网下的兜底表现。",
      },
    ],
    [
      {
        name: "张伟",
        role: "后端研发",
        time: "2026-07-12 16:05",
        content: "接口文档待补充，请明确错误码与重试策略。",
      },
      {
        name: "王芳",
        role: "测试开发",
        time: "2026-07-13 10:40",
        content: "验收用例偏少，建议补充异常路径与回归范围。",
      },
    ],
  ];

  if (row.aiPrdFeedback && String(row.aiPrdFeedback).trim()) {
    const text = String(row.aiPrdFeedback);
    if (text.includes("缺少边界") || row.id % 5 === 1) {
      row.aiPrdFeedbacks = samples[0].map((f) => ({ ...f }));
    } else if (text.includes("性能")) {
      row.aiPrdFeedbacks = samples[1].map((f) => ({ ...f }));
    } else if (text.includes("接口")) {
      row.aiPrdFeedbacks = samples[2].map((f) => ({ ...f }));
    } else {
      row.aiPrdFeedbacks = [
        {
          name: "张伟",
          role: "后端研发",
          time: "2026-07-15 14:30",
          content: text,
        },
      ];
    }
  } else {
    row.aiPrdFeedbacks = [];
  }
  syncAiPrdFeedbackSummary(row);
}

function syncAiPrdFeedbackSummary(row) {
  const list = Array.isArray(row.aiPrdFeedbacks) ? row.aiPrdFeedbacks : [];
  if (!list.length) {
    row.aiPrdFeedback = "";
    return;
  }
  const firstLine = String(list[0].content || "").split("\n")[0].trim();
  row.aiPrdFeedback = firstLine;
}

function getAiPrdFeedbacks(row) {
  if (!row) return [];
  if (!Array.isArray(row.aiPrdFeedbacks)) seedAiPrdFeedbacks(row);
  return row.aiPrdFeedbacks || [];
}

/** SR / IR / 拆分 AR 的设计排期（打标点自身或子叶子） */
function getDesignSchedule(row) {
  if (!row) return null;
  if (row.scheduleDates && row.scheduleDates.uxStart) return row.scheduleDates;
  if (isIR(row)) {
    const leaf =
      getChildSrsOf(row.id).find((sr) => sr.scheduleDates && sr.scheduleDates.uxStart) ||
      getChildSrsOf(row.id)[0];
    if (leaf && leaf.scheduleDates && leaf.scheduleDates.uxStart) return leaf.scheduleDates;
  }
  return buildScheduleDatesForMonth(row.deliverMonth);
}

function formatDesignDateRange(start, end) {
  if (!start || !end) return "-";
  const parts = (iso) => {
    const p = String(iso).split("-");
    if (p.length < 3) return null;
    return { y: p[0], m: p[1], d: p[2] };
  };
  const a = parts(start);
  const b = parts(end);
  if (!a || !b) return `${start}-${end}`;
  if (a.y === b.y) return `${a.y}/${a.m}/${a.d}-${b.m}/${b.d}`;
  return `${a.y}/${a.m}/${a.d}-${b.y}/${b.m}/${b.d}`;
}

/**
 * 需求设计看板：与产品文档打标同层（IR / SR / AR）
 */
function getDesignBoardRows() {
  const rows = REQUIREMENTS.filter((r) => isDocMarkOwner(r));
  rows.forEach((row) => {
    if (row.uxUrl === undefined) row.uxUrl = "";
    if (row.uiUrl === undefined) row.uiUrl = "";
    if (row.needUx === undefined) row.needUx = !isTosType(row);
    if (row.needUi === undefined) row.needUi = !isTosType(row);
  });
  return rows.slice().sort((a, b) => a.id - b.id);
}


/** 研测工作专区：稳定伪随机（演示用系统拉取指标） */
function rdHashSeed(str) {
  let h = 2166136261;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rdPseudoInt(seed, min, max) {
  const x = Math.sin(seed) * 10000;
  const frac = x - Math.floor(x);
  return min + Math.floor(frac * (max - min + 1));
}

/**
 * 单条需求在前置（PRD/UX/UI）是否「已齐套」
 * - 只统计 need* !== false 的阶段
 * - 全部不涉及 → 返回 null（不计入前置汇总）
 */
function isReqPreDone(r) {
  const checks = [];
  if (r.needPrd !== false) {
    let done = false;
    if (typeof resolvePrdDocsForDisplay === "function") {
      const docs = resolvePrdDocsForDisplay(r);
      done = !!(
        (docs.prdUrl && String(docs.prdUrl).trim()) ||
        (Array.isArray(docs.aiPrdFiles) && docs.aiPrdFiles.length) ||
        (Array.isArray(docs.attachments) && docs.attachments.length)
      );
    } else {
      done = !!(r.prdUrl && String(r.prdUrl).trim()) || (Array.isArray(r.aiPrdFiles) && r.aiPrdFiles.length);
    }
    checks.push(done);
  }
  if (r.needUx !== false) {
    let done = false;
    if (typeof resolveUxUiForDisplay === "function") {
      const design = resolveUxUiForDisplay(r);
      done = !!(design.uxUrl && String(design.uxUrl).trim());
    } else {
      done = !!(r.uxUrl && String(r.uxUrl).trim());
    }
    checks.push(done);
  }
  if (r.needUi !== false) {
    let done = false;
    if (typeof resolveUxUiForDisplay === "function") {
      const design = resolveUxUiForDisplay(r);
      done = !!(design.uiUrl && String(design.uiUrl).trim());
    } else {
      done = !!(r.uiUrl && String(r.uiUrl).trim());
    }
    checks.push(done);
  }
  if (!checks.length) return null;
  return checks.every(Boolean);
}

/**
 * 前置状态（产品/UI/UX 汇总）：未开始 / 进行中 / 部分完成 / 已完成
 * - 只统计涉及 PRD/UX/UI 的需求
 * - 已完成：相关需求均已齐套
 * - 部分完成：迭代内部分需求已齐套、部分未齐套
 * - 进行中：尚无齐套需求，但已有部分文档交付
 * - 未开始：相关需求均未开始交付
 */
function getIterationPreStatus(it) {
  if (!it) return "未开始";
  const reqs = getIterationRequirements(it.name, it.product);
  const states = reqs.map(isReqPreDone).filter((s) => s !== null);
  if (!states.length) return "未开始";
  const doneCount = states.filter(Boolean).length;
  if (doneCount === states.length) return "已完成";
  if (doneCount > 0) return "部分完成";

  // 无齐套：判断是否有「进行中」（任一文档已交）
  const anyPartial = reqs.some((r) => {
    if (r.needPrd === false && r.needUx === false && r.needUi === false) return false;
    const done = isReqPreDone(r);
    if (done === true || done === null) return false;
    // 未齐套但有局部交付
    const hasPrd =
      r.needPrd !== false &&
      ((r.prdUrl && String(r.prdUrl).trim()) ||
        (Array.isArray(r.aiPrdFiles) && r.aiPrdFiles.length) ||
        (Array.isArray(r.attachments) && r.attachments.length));
    let hasUx = false;
    let hasUi = false;
    if (typeof resolveUxUiForDisplay === "function") {
      const d = resolveUxUiForDisplay(r);
      hasUx = r.needUx !== false && !!(d.uxUrl && String(d.uxUrl).trim());
      hasUi = r.needUi !== false && !!(d.uiUrl && String(d.uiUrl).trim());
    } else {
      hasUx = r.needUx !== false && !!(r.uxUrl && String(r.uxUrl).trim());
      hasUi = r.needUi !== false && !!(r.uiUrl && String(r.uiUrl).trim());
    }
    return !!(hasPrd || hasUx || hasUi);
  });
  return anyPartial ? "进行中" : "未开始";
}

/** 需求是否已开发完成：提测时勾选（有提测包/提测版本）即视为开发完成 */
function isReqDeveloped(r) {
  if (!r) return false;
  if (r.testBuildUrl && String(r.testBuildUrl).trim()) return true;
  if (r.testSubmitVersion && String(r.testSubmitVersion).trim()) return true;
  if (r.devPhaseStatus === "已完成") return true;
  const st = String(r.status || "");
  return st === "测试中" || st === "已完成" || st === "验收中";
}

function getIterationDevelopedReqCount(name, product) {
  const reqs = getIterationRequirements(name, product);
  return reqs.filter(isReqDeveloped).length;
}

/** 剩余需求个数 = 总需求个数 - 已完成需求个数 */
function getIterationRemainingReqCount(name, product) {
  const total = getIterationRequirements(name, product).length;
  return Math.max(0, total - getIterationDevelopedReqCount(name, product));
}

function normalizeRdWorkStatus(status) {
  if (status === "已完成" || status === "超期完成" || status === "进行中" || status === "已超期" || status === "未开始") return status;
  return "未开始";
}

/** 规范：超期完成后文案仍为「已完成」，仅用红色样式区分 */
function displayRdWorkStatus(status) {
  return status === "超期完成" ? "已完成" : status;
}

/** 筛选「已完成」时包含超期完成（文案同为已完成） */
function matchRdWorkStatusFilter(status, filter) {
  if (!filter || filter === "全部") return true;
  if (filter === "已完成") return status === "已完成" || status === "超期完成";
  return status === filter;
}

/** 研测工作专区拉取指标（BUG / Gerrit / DI / APK），演示环境伪随机稳定值；未转测时无 APK / DI */
function getRdWorkspaceMetrics(it) {
  const key = `${it && it.product}||${it && it.name}`;
  const seed = rdHashSeed(key);
  const bugCount = rdPseudoInt(seed, 0, 18);
  const gerritAdd = rdPseudoInt(seed + 11, 120, 4200);
  const gerritDel = rdPseudoInt(seed + 29, 40, 2800);
  const hasSubmit =
    !!it &&
    getIterationRequirements(it.name, it.product).some(
      (r) =>
        (r.testBuildUrl && String(r.testBuildUrl).trim()) ||
        (r.testSubmitVersion && String(r.testSubmitVersion).trim())
    );
  const diRate =
    it && it.diRate != null
      ? Number(it.diRate)
      : hasSubmit
        ? rdPseudoInt(seed + 47, 55, 100)
        : null;
  const verPatch = String(rdPseudoInt(seed + 61, 1, 99)).padStart(3, "0");
  const apkVersion =
    (it && it.apkVersion && String(it.apkVersion).trim()) ||
    (hasSubmit ? `17.0.0.${verPatch}` : "");
  const apkUrl =
    (it && it.apkUrl && String(it.apkUrl).trim()) ||
    (hasSubmit && apkVersion
      ? `https://apk.example.com/${encodeURIComponent((it && it.product) || "app")}/${encodeURIComponent((it && it.name) || "S")}/${apkVersion}.apk`
      : "");
  return { bugCount, gerritAdd, gerritDel, diRate, apkUrl, apkVersion };
}

/** 研测详情：开发/测试进展状态（支持看板手动覆盖） */
function getRdIterationDevStatus(it) {
  if (it && it.rdDevStatus) return normalizeRdWorkStatus(it.rdDevStatus);
  return normalizeRdWorkStatus(getIterationPhaseStatus(it, "dev"));
}

function getRdIterationTestStatus(it) {
  if (it && it.rdTestStatus) return normalizeRdWorkStatus(it.rdTestStatus);
  return normalizeRdWorkStatus(getIterationPhaseStatus(it, "test"));
}

/** 研测侧栏汇总：开发+测试都完成才算已完成，任一超期优先展示超期 */
function getRdIterationOverallStatus(it) {
  const dev = getRdIterationDevStatus(it);
  const test = getRdIterationTestStatus(it);
  const devDone = dev === "已完成" || dev === "超期完成";
  const testDone = test === "已完成" || test === "超期完成";
  if (devDone && testDone) {
    // 内部仍用「超期完成」标记红样式；展示时文案统一为「已完成」
    return (dev === "超期完成" || test === "超期完成") ? "超期完成" : "已完成";
  }
  if (dev === "已超期" || test === "已超期") return "已超期";
  if (dev === "进行中" || test === "进行中" || devDone || testDone) {
    return "进行中";
  }
  return "未开始";
}

/** 研测工作专区行数据 */
function getRdWorkspaceRow(it) {
  const total = getIterationRequirements(it.name, it.product).length;
  const developed = getIterationDevelopedReqCount(it.name, it.product);
  const remaining = Math.max(0, total - developed);
  const metrics = getRdWorkspaceMetrics(it);
  return {
    product: it.product,
    name: it.name,
    developed,
    remaining,
    total,
    preStatus: getIterationPreStatus(it),
    devStatus: getRdIterationDevStatus(it),
    testStatus: getRdIterationTestStatus(it),
    bugCount: metrics.bugCount,
    gerritAdd: metrics.gerritAdd,
    gerritDel: metrics.gerritDel,
    diRate: metrics.diRate,
    apkUrl: metrics.apkUrl,
    apkVersion: metrics.apkVersion,
  };
}

/** 研测 APK 填写持久化（跨刷新，供版本发布看板同步） */
const RD_APK_STORAGE_KEY = "rd_iteration_apk_v1";

function iterationKey(product, name) {
  return `${product || ""}||${name || ""}`;
}

function loadRdApkMap() {
  try {
    const raw = localStorage.getItem(RD_APK_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
}

function saveRdApkMap(map) {
  localStorage.setItem(RD_APK_STORAGE_KEY, JSON.stringify(map || {}));
}

function persistIterationApk(it) {
  if (!it || !it.product || !it.name) return;
  const map = loadRdApkMap();
  const key = iterationKey(it.product, it.name);
  const apkUrl = it.apkUrl != null ? String(it.apkUrl).trim() : "";
  const apkVersion = it.apkVersion != null ? String(it.apkVersion).trim() : "";
  if (!apkUrl && !apkVersion) {
    delete map[key];
  } else {
    map[key] = {
      apkUrl,
      apkVersion,
      apkFilledAt: it.apkFilledAt || todayISO(),
    };
  }
  saveRdApkMap(map);
}

function applyPersistedApkToIterations() {
  const map = loadRdApkMap();
  ITERATIONS.forEach((it) => {
    const saved = map[iterationKey(it.product, it.name)];
    if (!saved) return;
    if (saved.apkUrl != null) it.apkUrl = saved.apkUrl;
    if (saved.apkVersion != null) it.apkVersion = saved.apkVersion;
    if (saved.apkFilledAt) it.apkFilledAt = saved.apkFilledAt;
  });
}

applyPersistedApkToIterations();
