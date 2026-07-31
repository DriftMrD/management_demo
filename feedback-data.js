/* 用户反馈看板假数据（周报详情主要来自 index (2).html 历史报告） */

const FEEDBACK_PRODUCTS = ["全部", "Visha", "Notes", "Themes"];

const FEEDBACK_WEEKS = [
  {
    id: "w-visha-0720",
    period: "2026-07-20 ~ 2026-07-26",
    periodStart: "2026-07-20",
    product: "Visha",
    total: 874,
    valid: 649,
    negative: 387,
    demand: 107,
    positive: 124,
    gp: 247,
    cms: 627,
    topIssue: "下载功能异常/无法使用"
  },
  {
    id: "w-notes-0720",
    period: "2026-07-20 ~ 2026-07-26",
    periodStart: "2026-07-20",
    product: "Notes",
    total: 893,
    valid: 527,
    negative: 288,
    demand: 84,
    positive: 155,
    gp: 201,
    cms: 692,
    topIssue: "笔记丢失/删除/消失"
  },
  {
    id: "w-themes-0720",
    period: "2026-07-20 ~ 2026-07-26",
    periodStart: "2026-07-20",
    product: "Themes",
    total: 88,
    valid: 47,
    negative: 21,
    demand: 26,
    positive: 0,
    gp: 88,
    cms: null,
    topIssue: "字体样式缺失或无法应用"
  },
  {
    id: "w-visha-0713",
    period: "2026-07-13 ~ 2026-07-19",
    periodStart: "2026-07-13",
    product: "Visha",
    total: 801,
    valid: 621,
    negative: 343,
    demand: 119,
    positive: 133,
    gp: 262,
    cms: 539,
    topIssue: "无法下载"
  },
  {
    id: "w-notes-0713",
    period: "2026-07-13 ~ 2026-07-19",
    periodStart: "2026-07-13",
    product: "Notes",
    total: 916,
    valid: 543,
    negative: 297,
    demand: 84,
    positive: 162,
    gp: 242,
    cms: 674,
    topIssue: "笔记内容丢失/删除"
  },
  {
    id: "w-themes-0713",
    period: "2026-07-13 ~ 2026-07-19",
    periodStart: "2026-07-13",
    product: "Themes",
    total: 171,
    valid: 113,
    negative: 84,
    demand: 22,
    positive: 7,
    gp: 171,
    cms: null,
    topIssue: "网络连接问题"
  },
  {
    id: "w-visha-0706",
    period: "2026-07-06 ~ 2026-07-12",
    periodStart: "2026-07-06",
    product: "Visha",
    total: 820,
    valid: 598,
    negative: 360,
    demand: 88,
    positive: 110,
    gp: 210,
    cms: 610,
    topIssue: "登录态异常失效"
  },
  {
    id: "w-notes-0706",
    period: "2026-07-06 ~ 2026-07-12",
    periodStart: "2026-07-06",
    product: "Notes",
    total: 845,
    valid: 512,
    negative: 276,
    demand: 91,
    positive: 145,
    gp: 188,
    cms: 657,
    topIssue: "文本编辑功能异常"
  },
  {
    id: "w-themes-0706",
    period: "2026-07-06 ~ 2026-07-12",
    periodStart: "2026-07-06",
    product: "Themes",
    total: 102,
    valid: 68,
    negative: 35,
    demand: 18,
    positive: 15,
    gp: 102,
    cms: null,
    topIssue: "壁纸下载缓慢"
  },
  {
    id: "w-visha-0629",
    period: "2026-06-29 ~ 2026-07-05",
    periodStart: "2026-06-29",
    product: "Visha",
    total: 956,
    valid: 710,
    negative: 432,
    demand: 133,
    positive: 145,
    gp: 305,
    cms: 651,
    topIssue: "搜索无结果/建议缺失"
  },
  {
    id: "w-notes-0629",
    period: "2026-06-29 ~ 2026-07-05",
    periodStart: "2026-06-29",
    product: "Notes",
    total: 780,
    valid: 490,
    negative: 251,
    demand: 76,
    positive: 163,
    gp: 220,
    cms: 560,
    topIssue: "云同步冲突"
  },
  {
    id: "w-visha-0622",
    period: "2026-06-22 ~ 2026-06-28",
    periodStart: "2026-06-22",
    product: "Visha",
    total: 790,
    valid: 580,
    negative: 354,
    demand: 128,
    positive: 96,
    gp: 198,
    cms: 592,
    topIssue: "本地音频导入失败"
  },
  {
    id: "w-notes-0622",
    period: "2026-06-22 ~ 2026-06-28",
    periodStart: "2026-06-22",
    product: "Notes",
    total: 702,
    valid: 455,
    negative: 230,
    demand: 70,
    positive: 155,
    gp: 175,
    cms: 527,
    topIssue: "文件夹批量管理异常"
  }
];

const FEEDBACK_VERSIONS = [
  {
    id: "v-notes-2630004",
    version: "2.6.3.0004",
    product: "Notes",
    type: "全量",
    window: "07-14~07-28",
    feedbackCount: 443,
    negativeRate: 61.2,
    topIssue: "笔记丢失/删除/消失",
    vsPrev: 4.6
  },
  {
    id: "v-notes-2630011",
    version: "2.6.3.0011",
    product: "Notes",
    type: "灰度",
    window: "07-18~07-28",
    feedbackCount: 10,
    negativeRate: 70,
    topIssue: "应用无法打开崩溃",
    vsPrev: 6.1
  },
  {
    id: "v-visha-82029",
    version: "8.2.0.29",
    product: "Visha",
    type: "全量",
    window: "07-01~07-19",
    feedbackCount: 384,
    negativeRate: 58.4,
    topIssue: "无法下载",
    vsPrev: -2.4
  },
  {
    id: "v-visha-83026g",
    version: "8.3.0.26",
    product: "Visha",
    type: "灰度",
    window: "07-13~07-19",
    feedbackCount: 16,
    negativeRate: 68.8,
    topIssue: "更新后性能问题",
    vsPrev: 8.2
  },
  {
    id: "v-visha-83026",
    version: "8.3.0.26",
    product: "Visha",
    type: "全量",
    window: "07-15~07-29",
    feedbackCount: 326,
    negativeRate: 62.3,
    topIssue: "下载功能完全不可用",
    vsPrev: 8.2
  },
  {
    id: "v-themes-31012",
    version: "3.1.0.12",
    product: "Themes",
    type: "全量",
    window: "07-12~07-26",
    feedbackCount: 96,
    negativeRate: 49,
    topIssue: "主题应用失败",
    vsPrev: -1.2
  },
  {
    id: "v-visha-83025",
    version: "8.3.0.25",
    product: "Visha",
    type: "灰度",
    window: "07-08~07-22",
    feedbackCount: 189,
    negativeRate: 54.1,
    topIssue: "视频加载超时",
    vsPrev: -3.1
  },
  {
    id: "v-visha-82130",
    version: "8.2.1.30",
    product: "Visha",
    type: "全量",
    window: "06-28~07-12",
    feedbackCount: 412,
    negativeRate: 48.7,
    topIssue: "搜索结果不准确",
    vsPrev: -5.4
  },
  {
    id: "v-themes-31010",
    version: "3.1.0.10",
    product: "Themes",
    type: "灰度",
    window: "06-25~07-09",
    feedbackCount: 74,
    negativeRate: 55.4,
    topIssue: "预览页崩溃闪退",
    vsPrev: 6.1
  },
  {
    id: "v-notes-51122",
    version: "5.1.1.22",
    product: "Notes",
    type: "全量",
    window: "06-20~07-04",
    feedbackCount: 268,
    negativeRate: 46.3,
    topIssue: "文本编辑功能异常",
    vsPrev: -0.8
  },
  {
    id: "v-visha-82128",
    version: "8.2.1.28",
    product: "Visha",
    type: "灰度",
    window: "06-20~07-04",
    feedbackCount: 156,
    negativeRate: 51.2,
    topIssue: "音频播放中断",
    vsPrev: 2.1
  },
  {
    id: "v-visha-82022",
    version: "8.2.0.22",
    product: "Visha",
    type: "全量",
    window: "06-10~06-24",
    feedbackCount: 378,
    negativeRate: 45.3,
    topIssue: "登录态频繁失效",
    vsPrev: null
  },
  {
    id: "v-notes-51120",
    version: "5.1.1.20",
    product: "Notes",
    type: "灰度",
    window: "06-08~06-22",
    feedbackCount: 118,
    negativeRate: 44.9,
    topIssue: "云同步冲突",
    vsPrev: null
  },
  {
    id: "v-themes-3008",
    version: "3.0.0.8",
    product: "Themes",
    type: "全量",
    window: "06-05~06-19",
    feedbackCount: 141,
    negativeRate: 42.6,
    topIssue: "壁纸下载缓慢",
    vsPrev: null
  }
];

/** 周报详情（按周报 id）；未配置的条目由页面按列表数据生成占位详情 */
const FEEDBACK_WEEK_DETAILS = {
  "w-visha-0720": {
    syncedAt: "2026-07-27 08:00",
    channelOverview: {
      gp: {
        total: 247,
        positive: 122,
        negative: 72,
        demand: 7
      },
      cms: {
        total: 627,
        positive: 2,
        negative: 315,
        demand: 100
      }
    },
    sentiment: {
      positive: 19.1,
      negative: 59.6,
      demand: 16.5,
      neutral: 4.8
    },
    modules: [
      {
        name: "下载功能",
        count: 176,
        pct: 27.1,
        tone: "neg"
      },
      {
        name: "其他",
        count: 169,
        pct: 26,
        tone: "demand"
      },
      {
        name: "本地音频",
        count: 101,
        pct: 15.6,
        tone: "pos"
      },
      {
        name: "本地视频",
        count: 79,
        pct: 12.2,
        tone: "muted"
      },
      {
        name: "整体稳定性",
        count: 61,
        pct: 9.4,
        tone: "other"
      }
    ],
    regions: [
      {
        name: "印度尼西亚",
        count: 79,
        pct: 32.6
      },
      {
        name: "英语",
        count: 55,
        pct: 22.7
      },
      {
        name: "菲律宾",
        count: 49,
        pct: 20.2
      },
      {
        name: "法语",
        count: 31,
        pct: 12.8
      },
      {
        name: "印度",
        count: 28,
        pct: 11.6
      }
    ],
    issues: [
      {
        id: "w-visha-0720-iss-1",
        title: "下载功能",
        count: 176,
        pct: 27.1,
        severity: "体验问题",
        sentiment: "负面",
        problem: "下载功能异常/无法使用",
        analysis: "用户反馈下载失败、按钮不显示、无法下载特定内容或下载后无法使用。",
        status: "未转需求",
        voices: [
          {
            channel: "GP",
            lang: "印度尼西亚语",
            version: "8.3.0.26",
            device: "Infinix-X6525",
            stars: 1,
            text: "\"现在有很多广告，很多功能丢失了，比如下载sw，剪切音频，滚动视频的时候经常回到顶部，而且经常出错打不开，现在有时候打开所有音频视频都没有了，现在音频也卡顿，文字消失，只剩下数字，图片也没有了，所以找歌很困难。\"",
            translation: "翻译：广告多，功能丢失，视频滚动异常，音频视频丢失卡顿"
          },
          {
            channel: "CMS",
            lang: "印度",
            version: "8.2.0.29",
            device: "TECNOBF7",
            stars: 1,
            text: "\"我们想下载音频视频中的下载视频，歌曲如何下载？告诉我，我需要立即下载，上传到YouTube频道，如何下载音频？告诉我下载音频和视频。\"",
            translation: "翻译：下载音频视频"
          }
        ]
      },
      {
        id: "w-visha-0720-iss-2",
        title: "本地音频",
        count: 94,
        pct: 14.5,
        severity: "体验问题",
        sentiment: "负面",
        problem: "音频播放异常",
        analysis: "用户反馈音频无法播放、声音质量差、播放中断、音量问题及列表管理混乱。",
        status: "未转需求",
        voices: [
          {
            channel: "GP",
            lang: "阿拉伯语",
            version: "8.2.0.29",
            device: "HNPTPX",
            stars: 1,
            text: "\"请发布一个子更新来解决阿拉伯语编码问题，因为在最后一个更新之后，它不再用阿拉伯语书写音频标题，尽管音频标题本身就是阿拉伯语，它只给我数字和符号……。而且它不写音频标题，就像它最初是阿拉伯语一样……。同时，之前的更新是完美的，没有这个问题。\"",
            translation: "翻译：更新后音频标题显示为数字和符号"
          },
          {
            channel: "CMS",
            lang: "菲律宾",
            version: "8.3.0.26",
            device: "InfinixX669",
            stars: 1,
            text: "\"如何批量选择我下载的音乐来编辑艺术家姓名，而不是一个一个地做？\"",
            translation: "翻译：批量编辑音乐艺术家"
          }
        ]
      },
      {
        id: "w-visha-0720-iss-3",
        title: "本地视频",
        count: 78,
        pct: 12,
        severity: "体验问题",
        sentiment: "负面",
        problem: "视频播放异常",
        analysis: "用户反馈视频无法播放、卡顿、音画不同步、字幕问题及功能异常。",
        status: "未转需求",
        voices: [
          {
            channel: "GP",
            lang: "英语",
            version: "8.3.0.26",
            device: "TECNO-KL4",
            stars: 1,
            text: "\"自从这次应用更新后，电影就无法播放了，我一次都没看过电影，它只从Pinterest下载视频并删除声音，没有字幕，我用的是Wi-Fi。每次精彩的体验即将开始时，它都从未显示过任何电影。这个应用只适合播放音乐。\"",
            translation: "翻译：更新后视频无法播放，下载视频有问题"
          },
          {
            channel: "GP",
            lang: "英语",
            version: "-",
            device: "Infinix-X6885",
            stars: 2,
            text: "\"我的主要担忧在于字幕功能，目前无法为任何视频选择字幕，无论是下载的还是未下载的，这至少是令人非常恼火的。虽然使用另一个播放器可以解决问题，但这是我设备的默认播放器，我希望它能有所改变。下载的视频也没有组织好，这非常令人失望。在之前的更新之前，字幕还可以，应用程序也更令人愉快一些，这很伤心。\"",
            translation: "翻译：字幕功能无法选择，下载视频未组织好"
          }
        ]
      },
      {
        id: "w-visha-0720-iss-4",
        title: "整体稳定性",
        count: 59,
        pct: 9.1,
        severity: "阻断性问题",
        sentiment: "负面",
        problem: "更新后性能问题",
        analysis: "用户反馈更新后应用卡顿、响应慢、频繁闪退或出现错误。",
        status: "未转需求",
        voices: [
          {
            channel: "GP",
            lang: "俄语",
            version: "8.3.0.26",
            device: "-",
            stars: 2,
            text: "\"糟糕的应用。它虽然相当方便并且有很多优点，但它不能稳定运行。切换视频时，整个播放器会卡死。当你想要退出并重新启动时，所有设置、所有收藏的视频和音乐都会被重置。而且这种情况不是第一次也不是最近才发生。我为此苦恼了一两年，开发者显然不想修复。而且，视频有时会卡顿。而且在最近的更新中添加了广告。但描述中写着“无广告”。\"",
            translation: "翻译：应用不稳定，卡顿，重置设置，有广告"
          },
          {
            channel: "GP",
            lang: "印地语",
            version: "4.3.0.2001",
            device: "Infinix-X6885",
            stars: 1,
            text: "\"最糟糕的应用程序，打开后歌曲根本不加载，卡顿得太厉害了，以前的版本好多了，现在太糟糕了，如果没有0星的选项，我会给。\"",
            translation: "翻译：应用卡顿，歌曲不加载"
          }
        ]
      },
      {
        id: "w-visha-0720-iss-5",
        title: "广告",
        count: 33,
        pct: 5.1,
        severity: "体验问题",
        sentiment: "负面",
        problem: "广告过多影响体验",
        analysis: "用户普遍反映广告数量多，影响正常使用和听歌体验。",
        status: "未转需求",
        voices: [
          {
            channel: "GP",
            lang: "英语",
            version: "8.3.0.26",
            device: "TECNO-KL7",
            stars: 1,
            text: "\"真希望我没有更新这个应用，刚开始用的时候是无广告的，更新后怎么变成这样了，简直是疯了，即使打开也有自动播放的视频卷轴……真烦人。\"",
            translation: "翻译：更新后出现大量广告"
          },
          {
            channel: "GP",
            lang: "法语",
            version: "-",
            device: "TECNO-KM5",
            stars: 1,
            text: "\"更新后，说实话，我再也无法使用这个应用了，现在有广告了，为什么你们滥用了我们的信任？🤧\"",
            translation: "翻译：更新后出现广告且无法使用"
          }
        ]
      }
    ],
    praises: [
      {
        id: "w-visha-0720-praise-1",
        channel: "GP",
        lang: "英语",
        version: "8.3.0.26",
        device: "Pixel 7",
        stars: 5,
        text: "\"Really useful player, download works fine on my side and UI is clean.\"",
        translation: "翻译：很好用的播放器，我这边下载正常，界面也很干净。"
      },
      {
        id: "w-visha-0720-praise-2",
        channel: "GP",
        lang: "印度尼西亚语",
        version: "8.3.0.26",
        device: "Infinix-X6525",
        stars: 5,
        text: "\"Aplikasinya membantu banget buat putar video lokal, suka fitur barunya.\"",
        translation: "翻译：这个应用对播放本地视频很有帮助，喜欢新功能。"
      }
    ],
    versions: [
      {
        version: "8.3.0.26",
        type: "全量",
        count: 191,
        countText: "191 条负面/需求（含 GP+CMS）",
        topIssue: "无法下载内容",
        issues: [
          {
            id: "w-visha-0720-ver1-iss-1",
            title: "下载功能",
            count: 70,
            pct: 37.6,
            severity: "体验问题",
            sentiment: "负面",
            problem: "无法下载内容",
            analysis: "用户普遍反馈无法下载视频、音频或歌曲，功能存在严重问题。",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "印度尼西亚语",
                version: "8.3.0.26",
                device: "Infinix-X6525",
                stars: 1,
                text: "\"现在有很多广告，很多功能丢失了，比如下载sw，剪切音频，滚动视频的时候经常回到顶部，而且经常出错打不开，现在有时候打开所有音频视频都没有了，现在音频也卡顿，文字消失，只剩下数字，图片也没有了，所以找歌很困难。\"",
                translation: "翻译：广告多，功能丢失，视频滚动异常，音频视频丢失卡顿"
              },
              {
                channel: "CMS",
                lang: "美国",
                version: "8.3.0.26",
                device: "InfinixX6525",
                stars: 1,
                text: "\"无法下载，尽管已经观看过了\"",
                translation: "翻译：观看后无法下载"
              }
            ]
          },
          {
            id: "w-visha-0720-ver1-iss-2",
            title: "本地音频",
            count: 42,
            pct: 22.6,
            severity: "体验问题",
            sentiment: "负面",
            problem: "音频播放异常",
            analysis: "用户反馈音频播放中断、音量问题、音质差及锁屏停止等问题。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "菲律宾",
                version: "8.3.0.26",
                device: "InfinixX669",
                stars: 1,
                text: "\"如何批量选择我下载的音乐来编辑艺术家姓名，而不是一个一个地做？\"",
                translation: "翻译：批量编辑音乐艺术家"
              },
              {
                channel: "CMS",
                lang: "俄罗斯联邦",
                version: "8.3.0.26",
                device: "InfinixX6716",
                stars: 1,
                text: "\"当我进去听音乐时，主屏幕出来了，但音乐本身没有出现，要等一分钟多才能出现，该怎么办？\"",
                translation: "翻译：听音乐主屏幕出现"
              }
            ]
          },
          {
            id: "w-visha-0720-ver1-iss-3",
            title: "本地视频",
            count: 30,
            pct: 16.1,
            severity: "体验问题",
            sentiment: "负面",
            problem: "视频播放异常",
            analysis: "用户报告视频无法播放、音画不同步、卡顿、黑屏等问题。",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "英语",
                version: "8.3.0.26",
                device: "TECNO-KL4",
                stars: 1,
                text: "\"自从这次应用更新后，电影就无法播放了，我一次都没看过电影，它只从Pinterest下载视频并删除声音，没有字幕，我用的是Wi-Fi。每次精彩的体验即将开始时，它都从未显示过任何电影。这个应用只适合播放音乐。\"",
                translation: "翻译：更新后视频无法播放，下载视频有问题"
              },
              {
                channel: "CMS",
                lang: "孟加拉国",
                version: "8.3.0.26",
                device: "TECNOKF6p",
                stars: 1,
                text: "\"我丢失了我所有的录音视频，我该如何找回？\"",
                translation: "翻译：录音视频丢失"
              }
            ]
          },
          {
            id: "w-visha-0720-ver1-iss-4",
            title: "整体稳定性",
            count: 24,
            pct: 12.9,
            severity: "阻断性问题",
            sentiment: "负面",
            problem: "更新后性能问题",
            analysis: "用户反映更新后应用变慢、卡顿，影响正常使用。",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "俄语",
                version: "8.3.0.26",
                device: "-",
                stars: 2,
                text: "\"糟糕的应用。它虽然相当方便并且有很多优点，但它不能稳定运行。切换视频时，整个播放器会卡死。当你想要退出并重新启动时，所有设置、所有收藏的视频和音乐都会被重置。而且这种情况不是第一次也不是最近才发生。我为此苦恼了一两年，开发者显然不想修复。而且，视频有时会卡顿。而且在最近的更新中添加了广告。但描述中写着“无广告”。\"",
                translation: "翻译：应用不稳定，卡顿，重置设置，有广告"
              },
              {
                channel: "GP",
                lang: "俄语",
                version: "8.3.0.26",
                device: "TECNO-LG6n",
                stars: 2,
                text: "\"完全扣星-应用程序停止工作，显示播放错误，无法重新加载。在此之前，出现了无法关闭的广告，音频以不明原因混淆。可惜，应用程序曾经很好，现在死了，愿它安息。\"",
                translation: "翻译：播放错误，无法重新加载，广告无法关闭，音频混淆"
              }
            ]
          },
          {
            id: "w-visha-0720-ver1-iss-5",
            title: "广告",
            count: 16,
            pct: 8.6,
            severity: "体验问题",
            sentiment: "负面",
            problem: "广告过多且影响使用",
            analysis: "用户对广告数量和干扰表示强烈不满，要求移除或屏蔽。",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "英语",
                version: "8.3.0.26",
                device: "TECNO-KL7",
                stars: 1,
                text: "\"真希望我没有更新这个应用，刚开始用的时候是无广告的，更新后怎么变成这样了，简直是疯了，即使打开也有自动播放的视频卷轴……真烦人。\"",
                translation: "翻译：更新后出现大量广告"
              },
              {
                channel: "GP",
                lang: "英语",
                version: "8.3.0.26",
                device: "TECNO-CK7n",
                stars: 3,
                text: "\"广告非常令人沮丧，如果你在线的话，我的意思是没关系，但当你离线时，广告太多了，我的意思是它们无法加载，因为你离线了，所以你必须关闭并重新打开应用程序才能打开应用程序，如果事情继续这样，我将不得不寻找另一个应用程序。\"",
                translation: "翻译：离线时广告过多且无法加载"
              }
            ]
          }
        ]
      }
    ]
  },
  "w-notes-0720": {
    syncedAt: "2026-07-27 08:00",
    channelOverview: {
      gp: {
        total: 201,
        positive: 135,
        negative: 38,
        demand: 6
      },
      cms: {
        total: 692,
        positive: 20,
        negative: 250,
        demand: 78
      }
    },
    sentiment: {
      positive: 29.4,
      negative: 54.6,
      demand: 15.9,
      neutral: 0
    },
    modules: [
      {
        name: "整体稳定性",
        count: 175,
        pct: 33.2,
        tone: "neg"
      },
      {
        name: "其他",
        count: 168,
        pct: 31.9,
        tone: "demand"
      },
      {
        name: "加密笔记",
        count: 62,
        pct: 11.8,
        tone: "pos"
      },
      {
        name: "文本编辑",
        count: 59,
        pct: 11.2,
        tone: "muted"
      },
      {
        name: "云服务",
        count: 25,
        pct: 4.7,
        tone: "other"
      }
    ],
    regions: [
      {
        name: "美国",
        count: 200,
        pct: 53.2
      },
      {
        name: "英语",
        count: 76,
        pct: 20.2
      },
      {
        name: "印度尼西亚",
        count: 39,
        pct: 10.4
      },
      {
        name: "俄罗斯联邦",
        count: 32,
        pct: 8.5
      },
      {
        name: "西班牙语",
        count: 29,
        pct: 7.7
      }
    ],
    issues: [
      {
        id: "w-notes-0720-iss-1",
        title: "整体稳定性",
        count: 179,
        pct: 34,
        severity: "阻断性问题",
        sentiment: "负面",
        problem: "笔记丢失/删除/消失",
        analysis: "用户反馈大量笔记丢失、删除或消失，急需恢复。",
        status: "未转需求",
        voices: [
          {
            channel: "GP",
            lang: "英语",
            version: "Android 11",
            device: "TECNO-LE7",
            stars: 1,
            text: "\"应用程序甚至无法打开，总是崩溃。非常令人失望。损失了数小时的工作。\"",
            translation: "翻译：应用无法打开且崩溃，数据丢失"
          },
          {
            channel: "GP",
            lang: "印度尼西亚语",
            version: "Android 13",
            device: "itel-A665L",
            stars: 5,
            text: "\"为什么突然打不开，我把我的研究内容都存在这里了，管理员请修复应用程序吧，我的毕业论文怎么办😭😭😭😭😭😭😭😭😭 我给五星但请修复\"",
            translation: "翻译：应用无法打开，数据丢失，影响毕业论文"
          }
        ]
      },
      {
        id: "w-notes-0720-iss-2",
        title: "加密笔记",
        count: 62,
        pct: 11.8,
        severity: "体验问题",
        sentiment: "负面",
        problem: "忘记密码/解锁问题",
        analysis: "大量用户忘记密码，导致无法访问加密笔记。",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "埃及",
            version: "2.6.3.0004",
            device: "OS 11",
            stars: 1,
            text: "\"我很久以前就锁定了我的笔记，但当我试图打开它们时，我忘记了安全密码和锁定密码，现在我无法以任何方式打开它们。我希望您能将密码发送到我的电子邮件地址，或者至少确认是我试图打开它。我的电子邮件地址是 Ruqayyaha567@gmali.com。\"",
            translation: "翻译：忘记安全和锁定密码"
          },
          {
            channel: "CMS",
            lang: "阿尔及利亚",
            version: "2.6.3.0004",
            device: "OS 13",
            stars: 1,
            text: "\"我以前给一些笔记设置了锁，但我忘记了密码，也忘记了忘记密码时需要回答的问题。\"",
            translation: "翻译：忘记笔记密码和安全问题"
          }
        ]
      },
      {
        id: "w-notes-0720-iss-3",
        title: "文本编辑",
        count: 47,
        pct: 8.9,
        severity: "体验问题",
        sentiment: "需求",
        problem: "文本编辑功能异常/缺失",
        analysis: "用户反馈文本编辑功能异常、缺失或需要改进。",
        status: "未转需求",
        voices: [
          {
            channel: "GP",
            lang: "印度尼西亚语",
            version: "Android 11",
            device: "Infinix-X663B",
            stars: 5,
            text: "\"越来越好 👍。如果能用 markdown 格式书写，并且有云存储就更好了。我每天每时每刻都用这个应用程序来工作。继续做得更好！\"",
            translation: "翻译：支持 markdown 和云存储"
          },
          {
            channel: "CMS",
            lang: "美国",
            version: "2.6.3.0009",
            device: "OS 12",
            stars: 1,
            text: "\"你好！我希望 Notes 应用允许在单个笔记中包含无限数量的图片。此功能对于使用该应用保存学习材料、参考资料、文档、图片和其他重要内容的用来说将非常有帮助。希望您能考虑此功能。感谢您的辛勤工作！\"",
            translation: "翻译：建议允许无限数量的图片"
          }
        ]
      },
      {
        id: "w-notes-0720-iss-4",
        title: "云服务",
        count: 24,
        pct: 4.6,
        severity: "体验问题",
        sentiment: "负面",
        problem: "数据同步/备份/恢复问题",
        analysis: "用户在数据同步、备份和恢复方面遇到问题。",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "美国",
            version: "2.6.3.0004",
            device: "OS 12",
            stars: 1,
            text: "\"重新安装后，记事本未恢复数据。\"",
            translation: "翻译：重装后数据未恢复"
          },
          {
            channel: "CMS",
            lang: "埃及",
            version: "2.6.3.0004",
            device: "OS 13",
            stars: 1,
            text: "\"请恢复我的账户。里面有很多照片和笔记。\"",
            translation: "翻译：账户恢复，数据丢失"
          }
        ]
      },
      {
        id: "w-notes-0720-iss-5",
        title: "视觉交互",
        count: 14,
        pct: 2.7,
        severity: "体验问题",
        sentiment: "需求",
        problem: "界面/显示/设计问题",
        analysis: "用户反馈界面显示异常、设计不合理或需要改进。",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "美国",
            version: "2.9.2.077",
            device: "OS 16",
            stars: 1,
            text: "\"请增加更多背景图片样式（例如，让我们使用自己的图片作为背景，或选择自己喜欢的背景颜色）。\"",
            translation: "翻译：自定义背景图片/颜色"
          },
          {
            channel: "CMS",
            lang: "美国",
            version: "2.5.1.0041",
            device: "OS 12",
            stars: 1,
            text: "\"一开始没有显示。\"",
            translation: "翻译：初始界面未显示"
          }
        ]
      }
    ],
    praises: [
      {
        channel: "GP",
        lang: "印度尼西亚语",
        version: "Android 13",
        device: "itel-A665L",
        stars: 5,
        text: "\"为什么突然打不开，我把我的研究内容都存在这里了，管理员请修复应用程序吧，我的毕业论文怎么办😭😭😭😭😭😭😭😭😭 我给五星但请修复\"",
        translation: "翻译：应用无法打开，数据丢失，影响毕业论文",
        id: "w-notes-0720-praise-1"
      },
      {
        channel: "GP",
        lang: "英语",
        version: "Android 13",
        device: "Infinix-X6525",
        stars: 5,
        text: "\"它在拖后腿\"",
        translation: "翻译：应用运行缓慢",
        id: "w-notes-0720-praise-2"
      },
      {
        channel: "GP",
        lang: "印度尼西亚语",
        version: "Android 11",
        device: "Infinix-X663B",
        stars: 5,
        text: "\"越来越好 👍。如果能用 markdown 格式书写，并且有云存储就更好了。我每天每时每刻都用这个应用程序来工作。继续做得更好！\"",
        translation: "翻译：支持 markdown 和云存储",
        id: "w-notes-0720-praise-3"
      },
      {
        channel: "GP",
        lang: "英语",
        version: "Android 12",
        device: "OP4F97",
        stars: 5,
        text: "\"很棒的应用，它帮助我们方便地保存事物，并且拥有漂亮的UI。我建议进行一些小的改动，应该与WhatsApp集成，这样使用起来会更方便，并保持事物与笔记的连接。\"",
        translation: "翻译：建议集成WhatsApp",
        id: "w-notes-0720-praise-4"
      }
    ],
    versions: [
      {
        version: "2.6.3.0011",
        type: "灰度",
        count: 2,
        countText: "2 条负面/需求（仅 GP）",
        topIssue: "其他问题",
        issues: [
          {
            id: "w-notes-0720-ver1-iss-1",
            title: "整体稳定性",
            count: 1,
            pct: 50,
            severity: "阻断性问题",
            sentiment: "负面",
            problem: "其他问题",
            analysis: "",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "英语",
                version: "Android 11",
                device: "Infinix-X695",
                stars: 1,
                text: "\"这次更新纯属垃圾\"",
                translation: "翻译：用户对更新不满"
              }
            ]
          },
          {
            id: "w-notes-0720-ver1-iss-2",
            title: "文本编辑",
            count: 1,
            pct: 50,
            severity: "体验问题",
            sentiment: "需求",
            problem: "其他问题",
            analysis: "",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "印度尼西亚语",
                version: "Android 11",
                device: "Infinix-X663B",
                stars: 5,
                text: "\"越来越好 👍。如果能用 markdown 格式书写，并且有云存储就更好了。我每天每时每刻都用这个应用程序来工作。继续做得更好！\"",
                translation: "翻译：支持 markdown 和云存储"
              }
            ]
          }
        ]
      },
      {
        version: "2.6.3.0004",
        type: "全量",
        count: 119,
        countText: "119 条负面/需求（含 GP+CMS）",
        topIssue: "笔记丢失",
        issues: [
          {
            id: "w-notes-0720-ver2-iss-1",
            title: "整体稳定性",
            count: 41,
            pct: 40.2,
            severity: "阻断性问题",
            sentiment: "负面",
            problem: "笔记丢失",
            analysis: "用户反馈笔记在更新、卸载或意外操作后丢失。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "美国",
                version: "2.6.3.0004",
                device: "OS 12",
                stars: 1,
                text: "\"显示字数但内容丢失。为什么显示空白？我的内容在哪里，而字数显示为 1895？\"",
                translation: "翻译：显示字数但内容丢失"
              },
              {
                channel: "CMS",
                lang: "乌兹别克斯坦",
                version: "2.6.3.0004",
                device: "OS 12",
                stars: 1,
                text: "\"我的一篇故事打开后不见了，我写了6000多字，对我非常重要，请恢复。我没有删除它，它自己打开了。\"",
                translation: "翻译：丢失大量文字的故事笔记"
              }
            ]
          },
          {
            id: "w-notes-0720-ver2-iss-2",
            title: "加密笔记",
            count: 29,
            pct: 28.4,
            severity: "体验问题",
            sentiment: "负面",
            problem: "忘记密码",
            analysis: "用户忘记密码，导致无法访问加密笔记。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "埃及",
                version: "2.6.3.0004",
                device: "OS 11",
                stars: 1,
                text: "\"我很久以前就锁定了我的笔记，但当我试图打开它们时，我忘记了安全密码和锁定密码，现在我无法以任何方式打开它们。我希望您能将密码发送到我的电子邮件地址，或者至少确认是我试图打开它。我的电子邮件地址是 Ruqayyaha567@gmali.com。\"",
                translation: "翻译：忘记安全和锁定密码"
              },
              {
                channel: "CMS",
                lang: "阿尔及利亚",
                version: "2.6.3.0004",
                device: "OS 13",
                stars: 1,
                text: "\"我以前给一些笔记设置了锁，但我忘记了密码，也忘记了忘记密码时需要回答的问题。\"",
                translation: "翻译：忘记笔记密码和安全问题"
              }
            ]
          },
          {
            id: "w-notes-0720-ver2-iss-3",
            title: "文本编辑",
            count: 18,
            pct: 17.6,
            severity: "体验问题",
            sentiment: "需求",
            problem: "文本编辑体验不佳",
            analysis: "用户对文本编辑的细节功能提出改进建议。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "美国",
                version: "2.6.3.0004",
                device: "OS 12",
                stars: 1,
                text: "\"添加一个选项来自动排列数字或不排列数字，当输入带有点的数字时。\"",
                translation: "翻译：建议自动排列带点的数字"
              },
              {
                channel: "CMS",
                lang: "美国",
                version: "2.6.3.0004",
                device: "OS 13",
                stars: 1,
                text: "\"我想把诗写在图片上面。\"",
                translation: "翻译：支持图片上写字"
              }
            ]
          },
          {
            id: "w-notes-0720-ver2-iss-4",
            title: "云服务",
            count: 7,
            pct: 6.9,
            severity: "体验问题",
            sentiment: "负面",
            problem: "备份与恢复问题",
            analysis: "备份数据无法恢复，或重装后数据未恢复。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "美国",
                version: "2.6.3.0004",
                device: "OS 12",
                stars: 1,
                text: "\"重新安装后，记事本未恢复数据。\"",
                translation: "翻译：重装后数据未恢复"
              },
              {
                channel: "CMS",
                lang: "埃及",
                version: "2.6.3.0004",
                device: "OS 13",
                stars: 1,
                text: "\"请恢复我的账户。里面有很多照片和笔记。\"",
                translation: "翻译：账户恢复，数据丢失"
              }
            ]
          },
          {
            id: "w-notes-0720-ver2-iss-5",
            title: "视觉交互",
            count: 5,
            pct: 4.9,
            severity: "体验问题",
            sentiment: "需求",
            problem: "界面与功能建议",
            analysis: "用户对界面美观度、主题和功能提出改进建议。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "美国",
                version: "2.6.3.0004",
                device: "OS 12",
                stars: 1,
                text: "\"制作一个主题，纯白色。\"",
                translation: "翻译：支持纯白主题"
              },
              {
                channel: "CMS",
                lang: "美国",
                version: "2.6.3.0004",
                device: "OS 14",
                stars: 1,
                text: "\"它很有用，但我希望有更多漂亮有趣的东西。\"",
                translation: "翻译：希望增加更多美观有趣的功能"
              }
            ]
          }
        ]
      }
    ]
  },
  "w-themes-0720": {
    syncedAt: "2026-07-27 08:00",
    channelOverview: {
      gp: {
        total: 88,
        positive: 0,
        negative: 21,
        demand: 26
      },
      cms: null
    },
    sentiment: {
      positive: 0,
      negative: 44.7,
      demand: 55.3,
      neutral: 0
    },
    modules: [
      {
        name: "字体资源",
        count: 27,
        pct: 57.4,
        tone: "neg"
      },
      {
        name: "其他资源",
        count: 6,
        pct: 12.8,
        tone: "demand"
      },
      {
        name: "主题资源",
        count: 5,
        pct: 10.6,
        tone: "pos"
      },
      {
        name: "整体稳定性",
        count: 4,
        pct: 8.5,
        tone: "muted"
      },
      {
        name: "其他",
        count: 3,
        pct: 6.4,
        tone: "other"
      }
    ],
    regions: [
      {
        name: "Philippines",
        count: 8,
        pct: 38.1
      },
      {
        name: "Nigeria",
        count: 5,
        pct: 23.8
      },
      {
        name: "Pakistan",
        count: 3,
        pct: 14.3
      },
      {
        name: "Indonesia",
        count: 3,
        pct: 14.3
      },
      {
        name: "Kenya",
        count: 2,
        pct: 9.5
      }
    ],
    issues: [
      {
        id: "w-themes-0720-iss-1",
        title: "字体资源",
        count: 26,
        pct: 55.3,
        severity: "体验问题",
        sentiment: "需求",
        problem: "字体样式缺失或无法应用",
        analysis: "用户反馈字体样式缺失、无法应用或更改。",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "Pakistan",
            version: "-",
            device: "Infinix smart 12",
            stars: 1,
            text: "\"如何应用字体???? 我想更换字体\"",
            translation: "翻译：询问如何应用字体"
          },
          {
            channel: "CMS",
            lang: "Palawan",
            version: "-",
            device: "Tecno spark go 2",
            stars: 1,
            text: "\"如何查找字体？ 我看不到字体\"",
            translation: "翻译：找不到字体"
          }
        ]
      },
      {
        id: "w-themes-0720-iss-2",
        title: "其他资源",
        count: 5,
        pct: 10.6,
        severity: "体验问题",
        sentiment: "需求",
        problem: "增加小组件/动态壁纸/图标功能",
        analysis: "用户希望增加小组件制作、动态壁纸和第三方图标支持。",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "México/Guanajuato",
            version: "mi versión es la 16.2.0",
            device: "-",
            stars: 3,
            text: "\"虽然可以制作自己的壁纸，但希望增加制作自己小组件的选项，例如时钟或在主屏幕上放置照片。\"",
            translation: "翻译：希望增加小组件制作功能"
          },
          {
            channel: "CMS",
            lang: "India",
            version: "-",
            device: "Infinix note 50x 5g",
            stars: 1,
            text: "\"添加第三方图标包支持\"",
            translation: "翻译：请求支持第三方图标包"
          }
        ]
      },
      {
        id: "w-themes-0720-iss-3",
        title: "主题资源",
        count: 5,
        pct: 10.6,
        severity: "体验问题",
        sentiment: "负面",
        problem: "主题资源不满意/缺失",
        analysis: "用户对主题资源不满意，希望增加特定风格或内容。",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "Philippines",
            version: "-",
            device: "camom 40 pro 5g",
            stars: 5,
            text: "\"我希望有一个像霓虹色一样的全局主题，只有黑色和霓虹色，谢谢。\"",
            translation: "翻译：请求全局霓虹色主题"
          },
          {
            channel: "CMS",
            lang: "Indonesia",
            version: "Infinix Hot 50 Pro+ 4G , Ver",
            device: "-",
            stars: 2,
            text: "\"每次打开主题，所有主题壁纸和字体都无法显示示例图片。 打开下载的壁纸时，总是无法打开并出现“主题已停止或无响应。请退出应用程序”。 总是这样，直到现在都无法打开。\"",
            translation: "翻译：主题壁纸和字体无法显示，下载壁纸失败"
          }
        ]
      },
      {
        id: "w-themes-0720-iss-4",
        title: "整体稳定性",
        count: 4,
        pct: 8.5,
        severity: "阻断性问题",
        sentiment: "负面",
        problem: "应用不稳定/更新失败",
        analysis: "用户反馈应用更新失败或存在稳定性问题。",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "Bangladesh",
            version: "Tecno SPARK 40C, HiOS 15.1.2",
            device: "-",
            stars: 5,
            text: "\"我收到了“Hi Theme”的更新通知，但在更新后安装出现问题，并收到通知说安装失败。\"",
            translation: "翻译：更新后安装失败"
          },
          {
            channel: "CMS",
            lang: "San Francisco Agusan Del",
            version: "-",
            device: "Theme",
            stars: 1,
            text: "\"没有通知\"",
            translation: "翻译：无通知"
          }
        ]
      },
      {
        id: "w-themes-0720-iss-5",
        title: "付费问题",
        count: 2,
        pct: 4.3,
        severity: "体验问题",
        sentiment: "负面",
        problem: "其他问题",
        analysis: "",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "Punjab \nPakistan",
            version: "-",
            device: "Infinix hot 60 pro Android 1",
            stars: 5,
            text: "\"为什么主题收费？\"",
            translation: "翻译：询问主题收费问题"
          },
          {
            channel: "CMS",
            lang: "indonesia",
            version: "-",
            device: "Xos 15",
            stars: 4,
            text: "\"请免费提供主题，\"",
            translation: "翻译：请求免费主题"
          }
        ]
      }
    ],
    praises: [
      {
        channel: "CMS",
        lang: "Bangladesh",
        version: "Tecno SPARK 40C, HiOS 15.1.2",
        device: "-",
        stars: 5,
        text: "\"我收到了“Hi Theme”的更新通知，但在更新后安装出现问题，并收到通知说安装失败。\"",
        translation: "翻译：更新后安装失败",
        id: "w-themes-0720-praise-1"
      },
      {
        channel: "CMS",
        lang: "Philippines",
        version: "-",
        device: "camom 40 pro 5g",
        stars: 5,
        text: "\"我希望有一个像霓虹色一样的全局主题，只有黑色和霓虹色，谢谢。\"",
        translation: "翻译：请求全局霓虹色主题",
        id: "w-themes-0720-praise-2"
      },
      {
        channel: "CMS",
        lang: "Punjab \nPakistan",
        version: "-",
        device: "Infinix hot 60 pro Android 1",
        stars: 5,
        text: "\"为什么主题收费？\"",
        translation: "翻译：询问主题收费问题",
        id: "w-themes-0720-praise-3"
      },
      {
        channel: "CMS",
        lang: "can't change the device ",
        version: "-",
        device: "can't change the device name",
        stars: 5,
        text: "\"无法更改手机上的设备名称。该选项不起作用。请帮助修复此问题。\"",
        translation: "翻译：设备名称更改功能故障",
        id: "w-themes-0720-praise-4"
      }
    ],
    versions: [
      {
        version: "3.1.0.12",
        type: "全量",
        count: 42,
        countText: "42 条负面/需求（含 GP）",
        topIssue: "字体样式缺失或无法应用",
        issues: [
          {
            id: "w-themes-0720-ver1-iss-1",
            title: "字体资源",
            count: 26,
            pct: 55.3,
            severity: "体验问题",
            sentiment: "需求",
            problem: "字体样式缺失或无法应用",
            analysis: "用户反馈字体样式缺失、无法应用或更改。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "Pakistan",
                version: "-",
                device: "Infinix smart 12",
                stars: 1,
                text: "\"如何应用字体???? 我想更换字体\"",
                translation: "翻译：询问如何应用字体"
              },
              {
                channel: "CMS",
                lang: "Palawan",
                version: "-",
                device: "Tecno spark go 2",
                stars: 1,
                text: "\"如何查找字体？ 我看不到字体\"",
                translation: "翻译：找不到字体"
              }
            ]
          },
          {
            id: "w-themes-0720-ver1-iss-2",
            title: "其他资源",
            count: 5,
            pct: 10.6,
            severity: "体验问题",
            sentiment: "需求",
            problem: "增加小组件/动态壁纸/图标功能",
            analysis: "用户希望增加小组件制作、动态壁纸和第三方图标支持。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "México/Guanajuato",
                version: "mi versión es la 16.2.0",
                device: "-",
                stars: 3,
                text: "\"虽然可以制作自己的壁纸，但希望增加制作自己小组件的选项，例如时钟或在主屏幕上放置照片。\"",
                translation: "翻译：希望增加小组件制作功能"
              },
              {
                channel: "CMS",
                lang: "India",
                version: "-",
                device: "Infinix note 50x 5g",
                stars: 1,
                text: "\"添加第三方图标包支持\"",
                translation: "翻译：请求支持第三方图标包"
              }
            ]
          },
          {
            id: "w-themes-0720-ver1-iss-3",
            title: "主题资源",
            count: 5,
            pct: 10.6,
            severity: "体验问题",
            sentiment: "负面",
            problem: "主题资源不满意/缺失",
            analysis: "用户对主题资源不满意，希望增加特定风格或内容。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "Philippines",
                version: "-",
                device: "camom 40 pro 5g",
                stars: 5,
                text: "\"我希望有一个像霓虹色一样的全局主题，只有黑色和霓虹色，谢谢。\"",
                translation: "翻译：请求全局霓虹色主题"
              },
              {
                channel: "CMS",
                lang: "Indonesia",
                version: "Infinix Hot 50 Pro+ 4G , Ver",
                device: "-",
                stars: 2,
                text: "\"每次打开主题，所有主题壁纸和字体都无法显示示例图片。 打开下载的壁纸时，总是无法打开并出现“主题已停止或无响应。请退出应用程序”。 总是这样，直到现在都无法打开。\"",
                translation: "翻译：主题壁纸和字体无法显示，下载壁纸失败"
              }
            ]
          },
          {
            id: "w-themes-0720-ver1-iss-4",
            title: "整体稳定性",
            count: 4,
            pct: 8.5,
            severity: "阻断性问题",
            sentiment: "负面",
            problem: "应用不稳定/更新失败",
            analysis: "用户反馈应用更新失败或存在稳定性问题。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "Bangladesh",
                version: "Tecno SPARK 40C, HiOS 15.1.2",
                device: "-",
                stars: 5,
                text: "\"我收到了“Hi Theme”的更新通知，但在更新后安装出现问题，并收到通知说安装失败。\"",
                translation: "翻译：更新后安装失败"
              },
              {
                channel: "CMS",
                lang: "San Francisco Agusan Del",
                version: "-",
                device: "Theme",
                stars: 1,
                text: "\"没有通知\"",
                translation: "翻译：无通知"
              }
            ]
          },
          {
            id: "w-themes-0720-ver1-iss-5",
            title: "付费问题",
            count: 2,
            pct: 4.3,
            severity: "体验问题",
            sentiment: "负面",
            problem: "其他问题",
            analysis: "",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "Punjab \nPakistan",
                version: "-",
                device: "Infinix hot 60 pro Android 1",
                stars: 5,
                text: "\"为什么主题收费？\"",
                translation: "翻译：询问主题收费问题"
              },
              {
                channel: "CMS",
                lang: "indonesia",
                version: "-",
                device: "Xos 15",
                stars: 4,
                text: "\"请免费提供主题，\"",
                translation: "翻译：请求免费主题"
              }
            ]
          }
        ]
      }
    ]
  },
  "w-visha-0713": {
    syncedAt: "2026-07-20 08:00",
    channelOverview: {
      gp: {
        total: 262,
        positive: 130,
        negative: 82,
        demand: 8
      },
      cms: {
        total: 539,
        positive: 3,
        negative: 261,
        demand: 111
      }
    },
    sentiment: {
      positive: 21.4,
      negative: 55.2,
      demand: 19.2,
      neutral: 4.2
    },
    modules: [
      {
        name: "其他",
        count: 189,
        pct: 30.4,
        tone: "neg"
      },
      {
        name: "下载功能",
        count: 155,
        pct: 25,
        tone: "demand"
      },
      {
        name: "本地音频",
        count: 113,
        pct: 18.2,
        tone: "pos"
      },
      {
        name: "本地视频",
        count: 84,
        pct: 13.5,
        tone: "muted"
      },
      {
        name: "广告",
        count: 35,
        pct: 5.6,
        tone: "other"
      }
    ],
    regions: [
      {
        name: "英语",
        count: 82,
        pct: 33.6
      },
      {
        name: "印度尼西亚",
        count: 67,
        pct: 27.5
      },
      {
        name: "菲律宾",
        count: 39,
        pct: 16
      },
      {
        name: "法语",
        count: 28,
        pct: 11.5
      },
      {
        name: "尼日利亚",
        count: 28,
        pct: 11.5
      }
    ],
    issues: [
      {
        id: "w-visha-0713-iss-1",
        title: "下载功能",
        count: 220,
        pct: 35.4,
        severity: "体验问题",
        sentiment: "负面",
        problem: "无法下载 / 无法下载/下载失败",
        analysis: "用户反馈大量无法下载音视频、音乐、视频等内容。 用户普遍反映下载功能无法使用，或下载过程失败。",
        status: "未转需求",
        voices: [
          {
            channel: "GP",
            lang: "西班牙语",
            version: "8.2.0.29",
            device: "TECNO-LH7n",
            stars: 3,
            text: "\"我曾经很喜欢它，但现在它不让我下载视频了……帮帮我，我会给你们5星\"",
            translation: "翻译：无法下载视频"
          },
          {
            channel: "GP",
            lang: "印度尼西亚语",
            version: "8.3.0.26",
            device: "Infinix-X669C",
            stars: 1,
            text: "\"有很多bug，而且下载的歌曲突然不能播放了，封面也消失了，登录时经常卡在加载屏幕。\"",
            translation: "翻译：下载歌曲无法播放，封面消失"
          }
        ]
      },
      {
        id: "w-visha-0713-iss-2",
        title: "本地音频",
        count: 168,
        pct: 27.1,
        severity: "体验问题",
        sentiment: "负面",
        problem: "播放异常与功能失效 / 音乐播放异常",
        analysis: "用户反馈音乐播放中断、无声、卡顿、混乱及功能失效。 用户反馈音乐播放中断、停止、无声等问题，影响正常收听。",
        status: "未转需求",
        voices: [
          {
            channel: "GP",
            lang: "俄语",
            version: "8.3.0.26",
            device: "-",
            stars: 1,
            text: "\"昨天（7月18日）更新后，所有音乐文件夹都打不开了，完全打不开！你们更新的什么东西？笨蛋。\"",
            translation: "翻译：更新后音乐文件夹打不开"
          },
          {
            channel: "GP",
            lang: "俄语",
            version: "8.3.0.26",
            device: "HNLGN-QL",
            stars: 1,
            text: "\"这是什么鬼？！我的歌曲混淆了，名称不一样，图片也不一样！！！怎么办？！更新是垃圾！！！！变化是倒退！！前面是符号，英文，然后是俄语，不方便！！！补充：你们为什么要删除我创建的歌曲？！你们到底怎么了？！？！\"",
            translation: "翻译：更新后歌曲混乱，名称图片错乱"
          }
        ]
      },
      {
        id: "w-visha-0713-iss-3",
        title: "本地视频",
        count: 85,
        pct: 13.7,
        severity: "体验问题",
        sentiment: "负面",
        problem: "字幕与播放异常",
        analysis: "用户反馈字幕功能失效、显示问题、视频无声、无法播放等。",
        status: "未转需求",
        voices: [
          {
            channel: "GP",
            lang: "西班牙语",
            version: "8.2.0.29",
            device: "Infinix-X6873",
            stars: 2,
            text: "\"我用了很多，但在最近的更新中我不再喜欢它了，因为我拥有的其他格式的音乐和视频文件无法播放或不被识别，即使它们在其他应用程序中播放正常。我希望他们能修复这个问题，以便可以播放其他格式的音乐。\"",
            translation: "翻译：无法播放其他格式的音视频"
          },
          {
            channel: "GP",
            lang: "英语",
            version: "8.2.0.29",
            device: "rubypro",
            stars: 4,
            text: "\"最近视频播放中的快捷方式（+10秒，-10秒，暂停等）工作不正常，如果能修复我会很感激\"",
            translation: "翻译：视频播放快捷方式失灵"
          }
        ]
      }
    ],
    praises: [
      {
        channel: "GP",
        lang: "英语",
        version: "-",
        device: "Infinix-X6532C",
        stars: 5,
        text: "\"我真的很喜欢这个应用，它很特别，我一直喜欢用它来播放歌曲。\"",
        translation: "翻译：我真的很喜欢这个应用，它很特别，我一直喜欢用它来播放歌曲。",
        id: "w-visha-0713-praise-1"
      },
      {
        channel: "GP",
        lang: "葡萄牙语",
        version: "4.3.1.1006",
        device: "a55x",
        stars: 5,
        text: "\"到目前为止，它可能是我用过最完整、最简单的。真的很好。\"",
        translation: "翻译：到目前为止，它可能是我用过最完整、最简单的。真的很好。",
        id: "w-visha-0713-praise-2"
      },
      {
        channel: "GP",
        lang: "英语",
        version: "8.2.0.29",
        device: "Infinix-X6726",
        stars: 5,
        text: "\"最近我卸载/停用了Palm store和hola浏览器，在我的Infinix Hot 60设备上使用Sizuku和Canta。令人惊讶的是，Visha播放器没有广告，一切都运行良好。\"",
        translation: "翻译：最近我卸载/停用了Palm store和hola浏览器，在我的Infinix Hot 60设备上使用Sizuku和Canta。令人惊讶的是，Visha播放器没有",
        id: "w-visha-0713-praise-3"
      },
      {
        channel: "GP",
        lang: "法语",
        version: "8.1.9.01",
        device: "TECNO-BG6m",
        stars: 5,
        text: "\"我喜欢这个应用，它让我很方便。\"",
        translation: "翻译：我喜欢这个应用，它让我很方便。",
        id: "w-visha-0713-praise-4"
      }
    ],
    versions: [
      {
        version: "8.3.0.26",
        type: "灰度",
        count: 16,
        countText: "16 条负面/需求（仅 GP）",
        topIssue: "更新后歌曲信息错乱",
        issues: [
          {
            id: "w-visha-0713-ver1-iss-1",
            title: "本地音频",
            count: 6,
            pct: 37.5,
            severity: "体验问题",
            sentiment: "负面",
            problem: "更新后歌曲信息错乱",
            analysis: "更新后歌曲列表混乱，名称、图片、封面丢失或错乱。",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "俄语",
                version: "8.3.0.26",
                device: "HNLGN-QL",
                stars: 1,
                text: "\"这是什么鬼？！我的歌曲混淆了，名称不一样，图片也不一样！！！怎么办？！更新是垃圾！！！！变化是倒退！！前面是符号，英文，然后是俄语，不方便！！！补充：你们为什么要删除我创建的歌曲？！你们到底怎么了？！？！\"",
                translation: "翻译：更新后歌曲混乱，名称图片错乱"
              },
              {
                channel: "GP",
                lang: "俄语",
                version: "8.3.0.26",
                device: "TECNO-CK7n",
                stars: 2,
                text: "\"上次更新后，一些播放列表中的歌曲丢失了，歌曲本身还在，但从播放列表中消失了，这太糟糕了。以前应用很好，现在只能给两星。\"",
                translation: "翻译：更新后播放列表歌曲丢失"
              }
            ]
          },
          {
            id: "w-visha-0713-ver1-iss-2",
            title: "整体稳定性",
            count: 4,
            pct: 25,
            severity: "阻断性问题",
            sentiment: "负面",
            problem: "更新后应用不稳定",
            analysis: "更新后应用频繁出错，用户不满意。",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "西班牙语",
                version: "8.3.0.26",
                device: "TECNO-KI5k",
                stars: 3,
                text: "\"我测试了好几个月。一开始运行正常，但今天7月19日更新后就开始出错了，我认为这次更新是不必要的。\"",
                translation: "翻译：更新后开始出错"
              },
              {
                channel: "GP",
                lang: "西班牙语",
                version: "8.3.0.26",
                device: "Infinix-X6886",
                stars: 1,
                text: "\"我不喜欢刚才的更新，7月17日更新的，之前的版本很完美。\"",
                translation: "翻译：不喜欢最近的更新"
              }
            ]
          },
          {
            id: "w-visha-0713-ver1-iss-3",
            title: "下载功能",
            count: 4,
            pct: 25,
            severity: "体验问题",
            sentiment: "负面",
            problem: "其他问题",
            analysis: "",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "印度尼西亚语",
                version: "8.3.0.26",
                device: "Infinix-X669C",
                stars: 1,
                text: "\"有很多bug，而且下载的歌曲突然不能播放了，封面也消失了，登录时经常卡在加载屏幕。\"",
                translation: "翻译：下载歌曲无法播放，封面消失"
              },
              {
                channel: "GP",
                lang: "印度尼西亚语",
                version: "8.3.0.26",
                device: "Infinix-X669C",
                stars: 1,
                text: "\"有很多bug，而且下载的歌曲突然不能播放了，封面也消失了，登录时经常卡在加载屏幕。\"",
                translation: "翻译：下载歌曲无法播放，封面消失"
              }
            ]
          },
          {
            id: "w-visha-0713-ver1-iss-4",
            title: "广告",
            count: 1,
            pct: 6.2,
            severity: "体验问题",
            sentiment: "负面",
            problem: "其他问题",
            analysis: "",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "英语",
                version: "8.3.0.26",
                device: "Infinix-X6878",
                stars: 1,
                text: "\"这是官方的音乐和视频播放器应用吗？抱歉，我对这个最糟糕的Infinix XOS感到不满意……三流应用，请让它无广告，并提供独立的音乐播放器。\"",
                translation: "翻译：应用差，广告多"
              }
            ]
          },
          {
            id: "w-visha-0713-ver1-iss-5",
            title: "本地视频",
            count: 1,
            pct: 6.2,
            severity: "体验问题",
            sentiment: "负面",
            problem: "其他问题",
            analysis: "",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "印度尼西亚语",
                version: "8.3.0.26",
                device: "TECNO-CM5",
                stars: 1,
                text: "\"字幕部分仍然有问题，比如激活后没有立即出现，字幕位置的设置也无法调整到中间，仍然在旁边。\"",
                translation: "翻译：字幕显示和位置问题"
              }
            ]
          }
        ]
      },
      {
        version: "8.2.0.29",
        type: "全量",
        count: 240,
        countText: "240 条负面/需求（含 GP+CMS）",
        topIssue: "无法下载/下载失败",
        issues: [
          {
            id: "w-visha-0713-ver2-iss-1",
            title: "下载功能",
            count: 76,
            pct: 34.9,
            severity: "体验问题",
            sentiment: "负面",
            problem: "无法下载/下载失败",
            analysis: "用户普遍反映下载功能无法使用，或下载过程失败。",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "西班牙语",
                version: "8.2.0.29",
                device: "TECNO-LH7n",
                stars: 3,
                text: "\"我曾经很喜欢它，但现在它不让我下载视频了……帮帮我，我会给你们5星\"",
                translation: "翻译：无法下载视频"
              },
              {
                channel: "CMS",
                lang: "马来西亚",
                version: "8.2.0.29",
                device: "InfinixX6720B",
                stars: 1,
                text: "\"无法下载\"",
                translation: "翻译：无法下载"
              }
            ]
          },
          {
            id: "w-visha-0713-ver2-iss-2",
            title: "本地音频",
            count: 61,
            pct: 28,
            severity: "体验问题",
            sentiment: "负面",
            problem: "音乐播放异常",
            analysis: "用户反馈音乐播放中断、停止、无声等问题，影响正常收听。",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "俄语",
                version: "8.2.0.29",
                device: "TECNO-KI7",
                stars: 2,
                text: "\"有时歌曲的名称和封面会被重置，当你试图更改名称时，歌曲会被删除。广告也很多，我无法更改歌曲的顺序。希望尽快修复。\"",
                translation: "翻译：歌曲信息重置，广告多，无法排序"
              },
              {
                channel: "GP",
                lang: "英语",
                version: "8.2.0.29",
                device: "Infinix-X6525",
                stars: 3,
                text: "\"我喜欢这个应用程序，但这个应用程序有一个小问题，当我播放视频或音乐音频时。播放音频时有轻微的音高偏移，几秒钟后会恢复正常，但如果你不那么敏感，这是可以容忍的，但对我来说，开发者应该修复它，而不是让我像看老电影一样观看，音高调整不稳定，而且均衡器用户界面顽固地不稳定，当我禁用它并重新打开应用程序时，均衡器会自动打开。\"",
                translation: "翻译：音频音高偏移和均衡器不稳定"
              }
            ]
          },
          {
            id: "w-visha-0713-ver2-iss-3",
            title: "本地视频",
            count: 44,
            pct: 20.2,
            severity: "体验问题",
            sentiment: "负面",
            problem: "视频播放与字幕异常",
            analysis: "用户反馈视频无法播放、字幕功能失效或显示异常。",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "西班牙语",
                version: "8.2.0.29",
                device: "Infinix-X6873",
                stars: 2,
                text: "\"我用了很多，但在最近的更新中我不再喜欢它了，因为我拥有的其他格式的音乐和视频文件无法播放或不被识别，即使它们在其他应用程序中播放正常。我希望他们能修复这个问题，以便可以播放其他格式的音乐。\"",
                translation: "翻译：无法播放其他格式的音视频"
              },
              {
                channel: "GP",
                lang: "英语",
                version: "8.2.0.29",
                device: "rubypro",
                stars: 4,
                text: "\"最近视频播放中的快捷方式（+10秒，-10秒，暂停等）工作不正常，如果能修复我会很感激\"",
                translation: "翻译：视频播放快捷方式失灵"
              }
            ]
          },
          {
            id: "w-visha-0713-ver2-iss-4",
            title: "广告",
            count: 21,
            pct: 9.6,
            severity: "体验问题",
            sentiment: "负面",
            problem: "广告过多且频繁",
            analysis: "用户对广告数量和频率表示强烈不满，影响使用体验。",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "阿拉伯语",
                version: "8.2.0.29",
                device: "TECNO-BF7",
                stars: 1,
                text: "\"更新非常糟糕，打开应用就有广告。\"",
                translation: "翻译：更新后打开应用有广告"
              },
              {
                channel: "GP",
                lang: "俄语",
                version: "8.2.0.29",
                device: "TECNO-LI7",
                stars: 1,
                text: "\"更新后广告无处不在+应用内搜索歌曲也不起作用，无法识别英语和俄语。\"",
                translation: "翻译：广告多且搜索失效"
              }
            ]
          },
          {
            id: "w-visha-0713-ver2-iss-5",
            title: "整体稳定性",
            count: 11,
            pct: 5,
            severity: "阻断性问题",
            sentiment: "负面",
            problem: "应用性能与稳定性问题",
            analysis: "用户反映应用卡顿、响应慢、冻结、加载失败等影响使用。",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "英语",
                version: "8.2.0.29",
                device: "OP5EF7L1",
                stars: 1,
                text: "\"歌曲结束后关闭应用程序的按钮不起作用\"",
                translation: "翻译：关闭应用按钮失效"
              },
              {
                channel: "CMS",
                lang: "乌兹别克斯坦",
                version: "8.2.0.29",
                device: "TECNOLG6n",
                stars: 1,
                text: "\"更新后无法加载视频\"",
                translation: "翻译：更新后视频无法加载"
              }
            ]
          }
        ]
      }
    ]
  },
  "w-notes-0713": {
    syncedAt: "2026-07-20 08:00",
    channelOverview: {
      gp: {
        total: 242,
        positive: 147,
        negative: 61,
        demand: 9
      },
      cms: {
        total: 674,
        positive: 15,
        negative: 236,
        demand: 75
      }
    },
    sentiment: {
      positive: 29.8,
      negative: 54.7,
      demand: 15.5,
      neutral: 0
    },
    modules: [
      {
        name: "整体稳定性",
        count: 154,
        pct: 28.4,
        tone: "neg"
      },
      {
        name: "其他",
        count: 135,
        pct: 24.9,
        tone: "demand"
      },
      {
        name: "加密笔记",
        count: 74,
        pct: 13.6,
        tone: "pos"
      },
      {
        name: "视觉交互",
        count: 61,
        pct: 11.2,
        tone: "muted"
      },
      {
        name: "文本编辑",
        count: 54,
        pct: 9.9,
        tone: "other"
      }
    ],
    regions: [
      {
        name: "美国",
        count: 183,
        pct: 46.9
      },
      {
        name: "英语",
        count: 126,
        pct: 32.3
      },
      {
        name: "俄罗斯联邦",
        count: 34,
        pct: 8.7
      },
      {
        name: "印度尼西亚",
        count: 29,
        pct: 7.4
      },
      {
        name: "西班牙语",
        count: 18,
        pct: 4.6
      }
    ],
    issues: [
      {
        id: "w-notes-0713-iss-1",
        title: "整体稳定性",
        count: 154,
        pct: 28.4,
        severity: "阻断性问题",
        sentiment: "负面",
        problem: "笔记内容丢失/删除",
        analysis: "大量用户反馈笔记内容丢失、被删除或消失，急需恢复功能。",
        status: "未转需求",
        voices: [
          {
            channel: "GP",
            lang: "英语",
            version: "Android 15",
            device: "fogos",
            stars: 1,
            text: "\"在过去的3天里，这个应用程序一直在崩溃。我丢失了我保存的笔记。它不再可靠了。\"",
            translation: "翻译：应用崩溃丢失笔记"
          },
          {
            channel: "GP",
            lang: "英语",
            version: "Android 11",
            device: "TECNO-CE7j",
            stars: 1,
            text: "\"我的笔记经常消失，我以为只是因为我没有保存它，但事实并非如此，它真的消失了。\"",
            translation: "翻译：笔记经常消失"
          }
        ]
      },
      {
        id: "w-notes-0713-iss-2",
        title: "加密笔记",
        count: 65,
        pct: 12,
        severity: "体验问题",
        sentiment: "负面",
        problem: "忘记密码/解锁问题",
        analysis: "用户频繁忘记加密笔记密码、安全问题或PIN码，导致无法访问。",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "印度尼西亚",
            version: "2.9.2.083",
            device: "OS 16",
            stars: 1,
            text: "\"我忘记了锁定的笔记的密码。\"",
            translation: "翻译：忘记锁定的笔记密码"
          },
          {
            channel: "CMS",
            lang: "印度尼西亚",
            version: "2.9.2.083",
            device: "OS 16",
            stars: 1,
            text: "\"我忘记了锁定的笔记的密码。\"",
            translation: "翻译：忘记锁定的笔记密码"
          }
        ]
      },
      {
        id: "w-notes-0713-iss-3",
        title: "文本编辑",
        count: 42,
        pct: 7.7,
        severity: "体验问题",
        sentiment: "负面",
        problem: "编辑功能异常/建议",
        analysis: "用户反馈文本编辑功能异常，如卡顿、内容消失、格式问题，并提出改进建议。",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "印度尼西亚",
            version: "2.6.3.0009",
            device: "OS 12",
            stars: 1,
            text: "\"为什么我更改标题时，我写的所有内容都消失了，真烦人。\"",
            translation: "翻译：更改标题导致内容消失"
          },
          {
            channel: "CMS",
            lang: "印度尼西亚",
            version: "2.6.3.0009",
            device: "OS 12",
            stars: 1,
            text: "\"我有一条重要的笔记，当我按下图片按钮时，整个笔记的内容突然消失了。我尝试了多次打开和关闭应用，重启我的手机，但它仍然没有出现。\"",
            translation: "翻译：按下图片按钮导致笔记内容消失"
          }
        ]
      },
      {
        id: "w-notes-0713-iss-4",
        title: "云服务",
        count: 39,
        pct: 7.2,
        severity: "体验问题",
        sentiment: "负面",
        problem: "云同步/备份/传输问题",
        analysis: "用户对云同步功能不满意，包括无法同步、传输失败、备份命名不便等。",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "美国",
            version: "2.6.3.0009",
            device: "OS 12",
            stars: 1,
            text: "\"_提议：可选的云账户_ 您的应用程序在新的更新后很棒。它只需要账户登录。请在保留本地存储为默认值的同时，添加可选的电子邮件登录。这样用户就可以跨设备同步笔记并自动备份，同时仍然为仅限本地用户提供完全的隐私。\"",
            translation: "翻译：建议添加可选云账户"
          },
          {
            channel: "CMS",
            lang: "印度",
            version: "2.6.3.0004",
            device: "OS 14",
            stars: 1,
            text: "\"很棒的应用，UI也很棒。请添加自动本地备份、云同步（Google Drive/OneDrive/WebDAV）、笔记更改后的后台自动备份以及跨设备同步。这些功能将使该应用变得完美。谢谢！\"",
            translation: "翻译：建议添加多项云同步和备份"
          }
        ]
      },
      {
        id: "w-notes-0713-iss-5",
        title: "其他",
        count: 37,
        pct: 6.8,
        severity: "其他问题",
        sentiment: "负面",
        problem: "其他问题",
        analysis: "用户反馈大量笔记丢失，急需恢复功能。",
        status: "未转需求",
        voices: [
          {
            channel: "GP",
            lang: "西班牙语",
            version: "Android 11",
            device: "TECNO-KG5j",
            stars: 1,
            text: "\"我无法使用该应用程序，因为它要求我在 Google Play 中输入标题。\"",
            translation: "翻译：应用要求输入标题"
          },
          {
            channel: "CMS",
            lang: "俄罗斯联邦",
            version: "2.6.3.0011",
            device: "OS 13",
            stars: 1,
            text: "\"您好，在创建语音笔记时，会弹出录音时长已达上限的通知，尽管我只录了几秒钟。可能是什么问题？\"",
            translation: "翻译：语音笔记录音时长限制问题"
          }
        ]
      }
    ],
    praises: [
      {
        channel: "GP",
        lang: "英语",
        version: "Android 11",
        device: "Infinix-X693",
        stars: 5,
        text: "\"很棒的应用程序，但不知道为什么它会一直注销。\"",
        translation: "翻译：应用频繁注销",
        id: "w-notes-0713-praise-1"
      },
      {
        channel: "GP",
        lang: "西班牙语",
        version: "Android 11",
        device: "TECNO-KG5j",
        stars: 5,
        text: "\"非常好，但应该像以前一样重新包含 AI。\"",
        translation: "翻译：希望恢复 AI 功能",
        id: "w-notes-0713-praise-2"
      },
      {
        channel: "GP",
        lang: "英语",
        version: "Android 12",
        device: "TECNO-BF7",
        stars: 5,
        text: "\"绝对出色的应用程序！它非常轻巧、快速且整洁。它能做到记事本应做的一切，而无需通过复杂的菜单。强烈推荐！\"",
        translation: "翻译：绝对出色的应用程序！它非常轻巧、快速且整洁。它能做到记事本应做的一切，而无需通过复杂的菜单。强烈推荐！",
        id: "w-notes-0713-praise-3"
      },
      {
        channel: "GP",
        lang: "乌孜别克语",
        version: "Android 11",
        device: "a20s",
        stars: 5,
        text: "\"这是我见过的最好的应用程序\"",
        translation: "翻译：这是我见过的最好的应用程序",
        id: "w-notes-0713-praise-4"
      }
    ],
    versions: [
      {
        version: "2.6.3.0011",
        type: "灰度",
        count: 1,
        countText: "1 条负面/需求（仅 GP）",
        topIssue: "其他问题",
        issues: [
          {
            id: "w-notes-0713-ver1-iss-1",
            title: "AI能力",
            count: 1,
            pct: 100,
            severity: "体验问题",
            sentiment: "负面",
            problem: "其他问题",
            analysis: "",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "印度尼西亚语",
                version: "Android 11",
                device: "Infinix-X6812B",
                stars: 2,
                text: "\"每次更新都有 bug，不是增加功能，而是功能消失了，比如 AI 摘要。\"",
                translation: "翻译：更新后功能消失，有 bug"
              }
            ]
          }
        ]
      },
      {
        version: "2.6.3.0004",
        type: "全量",
        count: 172,
        countText: "172 条负面/需求（含 GP+CMS）",
        topIssue: "笔记丢失/无法恢复",
        issues: [
          {
            id: "w-notes-0713-ver2-iss-1",
            title: "整体稳定性",
            count: 56,
            pct: 35.9,
            severity: "阻断性问题",
            sentiment: "负面",
            problem: "笔记丢失/无法恢复",
            analysis: "用户反馈大量笔记丢失，急需恢复功能。",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "葡萄牙语",
                version: "Android 13",
                device: "Infinix-X6525B",
                stars: 1,
                text: "\"应用程序有错误，打不开了，运行不正常，即使已安装也一直要求安装。它曾经很棒，现在无法运行了。我因为这个烦人的错误丢失了所有文件。\"",
                translation: "翻译：应用错误无法打开"
              },
              {
                channel: "GP",
                lang: "英语",
                version: "Android 13",
                device: "Infinix-X670",
                stars: 1,
                text: "\"我讨厌新的更新，因为我再也打不开我的笔记了。\"",
                translation: "翻译：新更新导致无法打开笔记"
              }
            ]
          },
          {
            id: "w-notes-0713-ver2-iss-2",
            title: "加密笔记",
            count: 33,
            pct: 21.2,
            severity: "体验问题",
            sentiment: "负面",
            problem: "忘记密码/解锁问题",
            analysis: "用户频繁忘记密码，无法访问加密笔记。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "美国",
                version: "2.6.3.0004",
                device: "OS 13",
                stars: 1,
                text: "\"我无法打开我的锁定文件夹，因为我忘记了图案。问题是恢复它的方式只有安全问题并没有帮助。我也记不起来了。至少添加一个电子邮件系统，在忘记图案时发送一个OTP代码，并且还可以添加PIN选项。\"",
                translation: "翻译：忘记锁定文件夹密码，建议增加邮箱/PIN恢复"
              },
              {
                channel: "CMS",
                lang: "巴林",
                version: "2.6.3.0004",
                device: "OS 12",
                stars: 1,
                text: "\"我忘记了密码和安全问题，我不记得我回答了什么，笔记里有我非常喜欢的照片，我不想丢失它们，有什么办法可以解锁吗？😔🥺\"",
                translation: "翻译：忘记密码和安全问题，请求解锁"
              }
            ]
          },
          {
            id: "w-notes-0713-ver2-iss-3",
            title: "云服务",
            count: 30,
            pct: 19.2,
            severity: "体验问题",
            sentiment: "负面",
            problem: "笔记/文件丢失/删除",
            analysis: "用户反馈笔记或文件在云端被删除或丢失。",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "英语",
                version: "Android 11",
                device: "TECNO-CG8",
                stars: 3,
                text: "\"我更改了电子邮件，但无法访问我写的笔记\"",
                translation: "翻译：更改邮箱后无法访问笔记"
              },
              {
                channel: "GP",
                lang: "英语",
                version: "Android 14",
                device: "LXX508",
                stars: 1,
                text: "\"它不支持云同步，这是一个主要问题。请更新。\"",
                translation: "翻译：不支持云同步"
              }
            ]
          },
          {
            id: "w-notes-0713-ver2-iss-4",
            title: "文本编辑",
            count: 16,
            pct: 10.3,
            severity: "体验问题",
            sentiment: "需求",
            problem: "格式/样式调整需求",
            analysis: "用户希望增加更多文本格式和样式选项。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "美国",
                version: "2.6.3.0004",
                device: "OS 11",
                stars: 1,
                text: "\"您好。请支持多页或多工作表的笔记/记录，以便在每个主笔记内进行分类或分隔相似的想法。只需在每个打开的笔记内添加“新工作表/页面”之类的功能。这样就无需在主列表上打开一个主要笔记来记录子笔记了。\n\n谢谢。\"",
                translation: "翻译：支持多页/工作表笔记"
              },
              {
                channel: "GP",
                lang: "英语",
                version: "Android 12",
                device: "TECNO-KI5k",
                stars: 3,
                text: "\"请修复错误，新行不以大写字母开头。另外添加一个导出为 TXT、MD 或 DO 格式的功能，以及备份。\"",
                translation: "翻译：修复新行大写问题并支持导出"
              }
            ]
          },
          {
            id: "w-notes-0713-ver2-iss-5",
            title: "视觉交互",
            count: 14,
            pct: 9,
            severity: "体验问题",
            sentiment: "需求",
            problem: "UI/界面设计不满意",
            analysis: "用户对界面设计、布局和操作方式不满意。",
            status: "未转需求",
            voices: [
              {
                channel: "GP",
                lang: "俄语",
                version: "2.6.3.0004",
                device: "37",
                stars: 4,
                text: "\"完美的应用程序，如果不是设计上的一个缺点：列表中的笔记和任务即使为空或元素很少也会滚动，因此类别名称和前几条笔记会因为被 UI 按钮隐藏而变得不可见。\"",
                translation: "翻译：UI设计影响可见性"
              },
              {
                channel: "CMS",
                lang: "乌克兰",
                version: "2.6.3.0004",
                device: "OS 17",
                stars: 1,
                text: "\"如果不是设计上的一个缺点，这个应用就是完美的：笔记和任务列表即使是空的或只有少量项目也会滚动，导致类别名称变得不可见。我附上了截图。除此之外，这个应用简直太棒了！\"",
                translation: "翻译：改进列表滚动设计，避免类别名称不可见"
              }
            ]
          }
        ]
      }
    ]
  },
  "w-themes-0713": {
    syncedAt: "2026-07-20 08:00",
    channelOverview: {
      gp: {
        total: 171,
        positive: 7,
        negative: 84,
        demand: 22
      },
      cms: null
    },
    sentiment: {
      positive: 6.2,
      negative: 74.3,
      demand: 19.5,
      neutral: 0
    },
    modules: [
      {
        name: "整体稳定性",
        count: 46,
        pct: 40.7,
        tone: "neg"
      },
      {
        name: "字体资源",
        count: 37,
        pct: 32.7,
        tone: "demand"
      },
      {
        name: "主题资源",
        count: 12,
        pct: 10.6,
        tone: "pos"
      },
      {
        name: "其他",
        count: 11,
        pct: 9.7,
        tone: "muted"
      },
      {
        name: "界面入口",
        count: 4,
        pct: 3.5,
        tone: "other"
      }
    ],
    regions: [
      {
        name: "Philippines",
        count: 18,
        pct: 33.3
      },
      {
        name: "Nigeria",
        count: 13,
        pct: 24.1
      },
      {
        name: "Indonesia",
        count: 8,
        pct: 14.8
      },
      {
        name: "Pakistan",
        count: 8,
        pct: 14.8
      },
      {
        name: "Kenya",
        count: 7,
        pct: 13
      }
    ],
    issues: [
      {
        id: "w-themes-0713-iss-1",
        title: "整体稳定性",
        count: 46,
        pct: 40.7,
        severity: "阻断性问题",
        sentiment: "负面",
        problem: "网络连接问题",
        analysis: "大量用户反馈应用存在网络连接失败、超时或显示无网络等问题。",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "Mimaropa",
            version: "-",
            device: "INFINIX SMART 10 THEMES",
            stars: 4,
            text: "\"网络请求失败。\"",
            translation: "翻译：网络请求失败"
          },
          {
            channel: "CMS",
            lang: "Indonesia",
            version: "Infinix smart 10 plus,  XOS ",
            device: "-",
            stars: 1,
            text: "\"每次打开主题应用时，总是显示没有互联网连接，而且印度尼西亚地区没有字体可用。\"",
            translation: "翻译：无网络连接，无印尼字体"
          }
        ]
      },
      {
        id: "w-themes-0713-iss-2",
        title: "字体资源",
        count: 38,
        pct: 33.6,
        severity: "体验问题",
        sentiment: "负面",
        problem: "字体功能缺陷",
        analysis: "用户反馈字体下载、获取、样式、管理及支持方面存在诸多问题。",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "Indonesia",
            version: "INFINIX SMART20 4G Androd Xo",
            device: "-",
            stars: 2,
            text: "\"我有一个关于字体购买的技术问题。在2026年7月8日，我购买了一个名为“Sugarpun”的字体，价格为6,000印尼盾，并使用DANA电子钱包成功支付。我应用并使用了该字体几周，然后暂时切换到另一个字体。今天，我想切换回“Sugarpun”字体。但是，应用不允许我应用它，并要求我再次支付6,000印尼盾。由于我已经为\"",
            translation: "翻译：已购字体重复收费"
          },
          {
            channel: "CMS",
            lang: "kurdistan",
            version: "-",
            device: "tecno pova 7 5g",
            stars: 1,
            text: "\"应用名称：Hi Theme。我的问题：库尔德语和字体在Hi Theme应用中支持不佳。1.重现步骤：打开Hi Theme应用 > 转到字体/主题 > 尝试使用库尔德语文本。2.错误：库尔德字母是分开的，一些字母显示为方框□□□。3.频率：每次使用库尔德语文本时都会发生这种情况。请求：请在Hi Theme应用中添加完整的\"",
            translation: "翻译：库尔德语和字体支持不佳"
          }
        ]
      },
      {
        id: "w-themes-0713-iss-3",
        title: "主题资源",
        count: 11,
        pct: 9.7,
        severity: "体验问题",
        sentiment: "负面",
        problem: "主题功能异常",
        analysis: "用户反馈主题下载、更换、加载及显示等方面存在异常和无法使用的问题。",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "Nigeria",
            version: "-",
            device: "TECHNO SPARK 40",
            stars: 4,
            text: "\"更新后，主题不再加载，甚至 AI 编辑，什么都不再加载了。\"",
            translation: "翻译：更新后主题和 AI 编辑不加载"
          },
          {
            channel: "CMS",
            lang: "Bangladesh",
            version: "-",
            device: "Tecno spark 40 pro",
            stars: 1,
            text: "\"更新主题后，我无法看到在线壁纸。它显示网络问题，尽管我的网络已满。更新主题后，我无法看到在线壁纸。它显示网络问题，尽管我的网络已满。\"",
            translation: "翻译：更新后无法查看在线壁纸"
          }
        ]
      },
      {
        id: "w-themes-0713-iss-4",
        title: "界面入口",
        count: 4,
        pct: 3.5,
        severity: "体验问题",
        sentiment: "负面",
        problem: "界面交互问题",
        analysis: "用户反馈发现页无法访问、字体菜单位置及锁屏被更改等问题。",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "Philippines",
            version: "Phone model: Tecno KN3  Syst",
            device: "-",
            stars: 2,
            text: "\"所以我想知道为什么我无法访问其他 Tecno Spark Go 3 上的发现页面。底部有一个发现按钮。然后我无法添加字体，唯一缺少的是建议的主题。而且我无法上传一些截图作为证据，因为我相信你们可以解决这个问题，谢谢。\"",
            translation: "翻译：发现页无法访问，无法添加字体"
          },
          {
            channel: "CMS",
            lang: "Philippines",
            version: "Themes App Version 17.0.0.03",
            device: "-",
            stars: 4,
            text: "\"特色标签中的部分内容在纯白色或对比度低的背景图片下难以阅读。文本应自动调整字体大小并换行，而不是拥挤显示。\"",
            translation: "翻译：文本在白背景下难读"
          }
        ]
      },
      {
        id: "w-themes-0713-iss-5",
        title: "其他资源",
        count: 2,
        pct: 1.8,
        severity: "体验问题",
        sentiment: "需求",
        problem: "其他问题",
        analysis: "",
        status: "未转需求",
        voices: [
          {
            channel: "CMS",
            lang: "Nigeria/Lagos",
            version: "-",
            device: "Tecno Pova 6 Neo",
            stars: 2,
            text: "\"我遇到了手机动态壁纸的问题。动态壁纸以前在锁屏上正常显示和动画，但突然停止工作了。虽然壁纸仍然被选中，但它不再显示为动态壁纸。我尝试检查我的设置，但问题仍然存在。请协助我找出原因并提供解决步骤。\"",
            translation: "翻译：动态壁纸停止工作"
          },
          {
            channel: "CMS",
            lang: "indonesia",
            version: "-",
            device: "infinix smart 20",
            stars: 1,
            text: "\"我们需要壁纸深度效果。\"",
            translation: "翻译：需要壁纸深度效果"
          }
        ]
      }
    ],
    praises: [
      {
        channel: "CMS",
        lang: "ما يقبل يدخل",
        version: "-",
        device: "يكلي غير متصل في الشبكه",
        stars: 5,
        text: "\"谢谢你的理解。\"",
        translation: "翻译：谢谢你的理解。",
        id: "w-themes-0713-praise-1"
      },
      {
        channel: "CMS",
        lang: "Goods",
        version: "-",
        device: "Goods",
        stars: 5,
        text: "\"好\"",
        translation: "翻译：好",
        id: "w-themes-0713-praise-2"
      }
    ],
    versions: [
      {
        version: "3.1.0.10",
        type: "全量",
        count: 101,
        countText: "101 条负面/需求（含 GP）",
        topIssue: "网络连接问题",
        issues: [
          {
            id: "w-themes-0713-ver1-iss-1",
            title: "整体稳定性",
            count: 46,
            pct: 40.7,
            severity: "阻断性问题",
            sentiment: "负面",
            problem: "网络连接问题",
            analysis: "大量用户反馈应用存在网络连接失败、超时或显示无网络等问题。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "Mimaropa",
                version: "-",
                device: "INFINIX SMART 10 THEMES",
                stars: 4,
                text: "\"网络请求失败。\"",
                translation: "翻译：网络请求失败"
              },
              {
                channel: "CMS",
                lang: "Indonesia",
                version: "Infinix smart 10 plus,  XOS ",
                device: "-",
                stars: 1,
                text: "\"每次打开主题应用时，总是显示没有互联网连接，而且印度尼西亚地区没有字体可用。\"",
                translation: "翻译：无网络连接，无印尼字体"
              }
            ]
          },
          {
            id: "w-themes-0713-ver1-iss-2",
            title: "字体资源",
            count: 38,
            pct: 33.6,
            severity: "体验问题",
            sentiment: "负面",
            problem: "字体功能缺陷",
            analysis: "用户反馈字体下载、获取、样式、管理及支持方面存在诸多问题。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "Indonesia",
                version: "INFINIX SMART20 4G Androd Xo",
                device: "-",
                stars: 2,
                text: "\"我有一个关于字体购买的技术问题。在2026年7月8日，我购买了一个名为“Sugarpun”的字体，价格为6,000印尼盾，并使用DANA电子钱包成功支付。我应用并使用了该字体几周，然后暂时切换到另一个字体。今天，我想切换回“Sugarpun”字体。但是，应用不允许我应用它，并要求我再次支付6,000印尼盾。由于我已经为\"",
                translation: "翻译：已购字体重复收费"
              },
              {
                channel: "CMS",
                lang: "kurdistan",
                version: "-",
                device: "tecno pova 7 5g",
                stars: 1,
                text: "\"应用名称：Hi Theme。我的问题：库尔德语和字体在Hi Theme应用中支持不佳。1.重现步骤：打开Hi Theme应用 > 转到字体/主题 > 尝试使用库尔德语文本。2.错误：库尔德字母是分开的，一些字母显示为方框□□□。3.频率：每次使用库尔德语文本时都会发生这种情况。请求：请在Hi Theme应用中添加完整的\"",
                translation: "翻译：库尔德语和字体支持不佳"
              }
            ]
          },
          {
            id: "w-themes-0713-ver1-iss-3",
            title: "主题资源",
            count: 11,
            pct: 9.7,
            severity: "体验问题",
            sentiment: "负面",
            problem: "主题功能异常",
            analysis: "用户反馈主题下载、更换、加载及显示等方面存在异常和无法使用的问题。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "Nigeria",
                version: "-",
                device: "TECHNO SPARK 40",
                stars: 4,
                text: "\"更新后，主题不再加载，甚至 AI 编辑，什么都不再加载了。\"",
                translation: "翻译：更新后主题和 AI 编辑不加载"
              },
              {
                channel: "CMS",
                lang: "Bangladesh",
                version: "-",
                device: "Tecno spark 40 pro",
                stars: 1,
                text: "\"更新主题后，我无法看到在线壁纸。它显示网络问题，尽管我的网络已满。更新主题后，我无法看到在线壁纸。它显示网络问题，尽管我的网络已满。\"",
                translation: "翻译：更新后无法查看在线壁纸"
              }
            ]
          },
          {
            id: "w-themes-0713-ver1-iss-4",
            title: "界面入口",
            count: 4,
            pct: 3.5,
            severity: "体验问题",
            sentiment: "负面",
            problem: "界面交互问题",
            analysis: "用户反馈发现页无法访问、字体菜单位置及锁屏被更改等问题。",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "Philippines",
                version: "Phone model: Tecno KN3  Syst",
                device: "-",
                stars: 2,
                text: "\"所以我想知道为什么我无法访问其他 Tecno Spark Go 3 上的发现页面。底部有一个发现按钮。然后我无法添加字体，唯一缺少的是建议的主题。而且我无法上传一些截图作为证据，因为我相信你们可以解决这个问题，谢谢。\"",
                translation: "翻译：发现页无法访问，无法添加字体"
              },
              {
                channel: "CMS",
                lang: "Philippines",
                version: "Themes App Version 17.0.0.03",
                device: "-",
                stars: 4,
                text: "\"特色标签中的部分内容在纯白色或对比度低的背景图片下难以阅读。文本应自动调整字体大小并换行，而不是拥挤显示。\"",
                translation: "翻译：文本在白背景下难读"
              }
            ]
          },
          {
            id: "w-themes-0713-ver1-iss-5",
            title: "其他资源",
            count: 2,
            pct: 1.8,
            severity: "体验问题",
            sentiment: "需求",
            problem: "其他问题",
            analysis: "",
            status: "未转需求",
            voices: [
              {
                channel: "CMS",
                lang: "Nigeria/Lagos",
                version: "-",
                device: "Tecno Pova 6 Neo",
                stars: 2,
                text: "\"我遇到了手机动态壁纸的问题。动态壁纸以前在锁屏上正常显示和动画，但突然停止工作了。虽然壁纸仍然被选中，但它不再显示为动态壁纸。我尝试检查我的设置，但问题仍然存在。请协助我找出原因并提供解决步骤。\"",
                translation: "翻译：动态壁纸停止工作"
              },
              {
                channel: "CMS",
                lang: "indonesia",
                version: "-",
                device: "infinix smart 20",
                stars: 1,
                text: "\"我们需要壁纸深度效果。\"",
                translation: "翻译：需要壁纸深度效果"
              }
            ]
          }
        ]
      }
    ]
  }
};
