# CLAUDE.md - Study Stars 项目核心指南

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions.

**Tradeoff:** Bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**
- State assumptions explicitly. If uncertain, ask.
- Present multiple interpretations if exist.
- Prefer simpler solutions. Push back when overcomplicating.
- If unclear, stop and ask.

## 2. Simplicity First
**Minimum code that solves the problem.**
- No extra features, abstractions, or flexibility unless requested.
- No error handling for impossible cases.
- Match existing style. Don't refactor unrelated code.
- Ask: "Would a senior engineer say this is overcomplicated?"

## 3. Surgical Changes
**Touch only what you must.**
- Only edit what's necessary for the current request.
- Clean up only code your changes affected.
- Mention (don't delete) unrelated dead code.

## 项目核心信息

**项目名称**：Study Stars / スタディスター  
**目标**：学习提醒 Web App（计划记录、提醒、统计、报告）

### 技术栈
- 前端：HTML + CSS + Vanilla JS（无框架）
- 认证：Firebase Auth（Email/Password + Google）
- 数据库：Firebase Firestore
- 图表：Chart.js
- 邮件：EmailJS
- 通知：Discord Bot / Browser Banner
- AI：Claude API（生成鼓励语）
- 其他：Notion API

### 重要规则（必须严格遵守）
- **回复语言**：中文
- **代码注释**：英文 + 日文（绝不出现韩文）
- **界面语言**：仅支持 中文 / 英文 / 日文
- 修改原则：**只改需要改的部分**，保留原有功能和风格
- API 密钥：永远不要写在代码或回复中
- 输出格式：**先说明修改点 → 再给出完整修改后的代码**

### 文件结构重点
主要文件位于 `js/` 目录：
- `app.js` - 主入口 + 页面路由
- `firebase-init.js` - Firebase 登录核心逻辑
- `state.js` - 全局状态管理
- `report.js` - 每日报告 + AI 鼓励
- `subjects.js` / `remind.js` / `timer.js` 等各功能模块

**当前开发模式**：Vercel 部署 + GitHub 双端同步

---

**每次新任务前请先确认**：
1. 当前登录模式（Firebase / 本地）
2. 是否需要考虑多语言（zh/ja/en）
3. 修改范围要最小化

需要完整历史记录或详细上下文时，请参考 `.claude/context.md`