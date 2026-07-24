# 需求池看板 Demo

根据 Figma 设计稿还原的需求管理前端 demo,纯静态 HTML / CSS / JavaScript,无任何依赖,数据为写死的假数据。

## 运行

直接用浏览器打开 `index.html`（需求管理系统首页）,或启动一个本地服务:

```bash
python3 -m http.server 8000
# 访问 http://localhost:8000
```

## 功能

- 需求管理系统首页（模块入口卡片）
- 需求池看板：列表 / 卡片、筛选、排期及管理跨产品线需求
- AI 提效看板：展示有 AI PRD / Demo / 埋点的需求

## 目录

```
index.html        需求管理系统首页
pool.html         需求池看板
efficiency.html   AI 提效看板
data.js           共享假数据
app.js            需求池交互
efficiency.js     提效看板交互
styles.css        样式
assets/           图标与头像
```
