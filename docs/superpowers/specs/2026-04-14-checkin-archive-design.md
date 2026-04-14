# 打卡双写归档设计文档
**日期**: 2026-04-14
**方案**: C — App 本地存储 + Notion 异步归档

---

## 背景

用户在"打卡"tab 完成每日任务后，希望：
1. 数据保存在 App 本地（localStorage + Firebase）—— 主存储
2. 同时在 Notion 任务数据库里创建一条每日归档页 —— 历史存档 / 可视化

---

## 触发方式

**手动按钮**：打卡 tab 备注区下方，用户主动点击"📤 完成今日打卡 → 存档 Notion"。

不与简报 tab 联动，两个功能独立。

---

## 数据流

```
用户点击归档按钮
      │
      ├─► 写入 App 本地（已有机制，不变）
      │     S.history[todayKey()] 记录打卡状态
      │     saveLocal() → localStorage
      │     Auth.saveUserData() → Firebase
      │
      └─► POST /api/notion  { action: "archive", ... }
            ↓ Vercel 服务端
            Notion API：在任务数据库创建新页
            ↓ 返回 { url }
            存入 S.notionSyncedPages[0]
```

Notion 归档**异步执行**，失败不影响本地数据保存。

---

## Notion 归档页结构

**创建位置**：与任务相同的数据库（`S.notionDbId`），无需额外配置。

**页面标题**：`YYYY-MM-DD 打卡记录`（如 `2026-04-14 打卡记录`）

**页面正文（Notion blocks）**：
```
## 📅 YYYY-MM-DD 打卡记录

完成率：X%（done/total）  ⭐ 积分：N  🔥 连续：N 天

---
✅ 已完成任务
  ☑ 任务A
  ☑ 任务B

⬜ 未完成任务
  ☐ 任务C

---
📝 备注
（用户在 summary textarea 里写的内容，若为空则不渲染此节）
```

---

## UI 变化

### 归档按钮状态机

| 状态 | 按钮显示 | 可点击 |
|------|---------|--------|
| 初始（未归档） | `📤 完成今日打卡 → 存档 Notion` | ✅ |
| 归档中 | `⏳ 正在归档…` | ❌ disabled |
| 已归档（成功） | `✅ 今日已归档 ↗`（链接到 Notion 页） | ✅（跳转） |
| 失败后 | 恢复初始状态 | ✅ |

**防重复**：通过 `S.notionSyncedPages` 检查今天是否已有归档记录，若有则直接显示"已归档"状态。

**位置**：`notion-summary-row` textarea 下方，config 折叠区上方。

---

## 代码改动

### `api/notion.js`
新增 `archive` action：
- 接收 `{ token, dbId, date, tasks, summary, points, streak }`
- 调用 `POST /v1/pages` 创建页面
- 用 Notion blocks 构建正文（heading、paragraph、to_do、divider）
- 返回 `{ url }`

### `js/notion.js`
- `_render()` 内：在 summary 下方插入归档按钮 HTML（根据今日归档状态显示不同样式）
- 新增 `_archiveToday()` 异步方法：
  1. 检查 `S.notionToken`、`S.notionDbId` 是否配置
  2. 收集当前任务状态、summary、points、streak
  3. POST `/api/notion` archive action
  4. 成功：`S.notionSyncedPages.unshift({ date, url })`，saveLocal，showToast，re-render
  5. 失败：showToast 错误，re-render（恢复按钮）

### `css/style.css`
新增：
- `.notion-archive-btn` — 主归档按钮样式（橙色渐变，全宽）
- `.notion-archive-btn.done` — 已归档状态（绿色，含外链图标）
- `.notion-archive-btn:disabled` — 归档中状态（半透明）

### 不需要改动
- `js/state.js` — `notionSyncedPages` 已存在
- `firebase-init.js` — 无新字段
- `index.html` — 无结构变化

---

## 边界情况

| 情况 | 处理 |
|------|------|
| Notion 未配置（无 token/dbId） | 不显示归档按钮 |
| 今天已归档 | 按钮显示"已归档 ↗"，不可重复提交 |
| Notion API 失败 | Toast 显示错误，按钮恢复，本地数据不受影响 |
| 无任务数据 | 仍可归档，只记录备注和统计 |
| 离线 | fetch 失败走失败分支，本地数据正常保存 |
