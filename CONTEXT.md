# 项目上下文 (Context File)
> 每次换电脑或开新对话时，把这个文件内容发给 Claude，它就能快速了解你的情况。

---

## 我是谁 / 项目目标
- 用户：DanL
- 项目名称：**Study Stars / スタディスター**
- 目标：一个学习提醒 Web App，帮助记录学习计划、发送提醒、追踪统计
- 部署平台：Vercel
- 同步方式：GitHub + git push/pull（台机 & 笔记本双端同步）

---

## 技术栈
- 前端：HTML / CSS / Vanilla JavaScript（无框架）
- 认证：Firebase Auth（Email/Password + Google 登录）
- 数据库：Firebase Firestore
- 图表：Chart.js
- 邮件：EmailJS
- 通知：Telegram Bot / Browser Banner
- AI 功能：Anthropic Claude API（学习报告后生成鼓励语）
- 笔记同步：Notion API（每日打卡归档）

---

## 文件结构
```
Study-Reminder/
├── CONTEXT.md              ← 你现在看的这个文件
├── README.md               ← 详细设置说明（Firebase / EmailJS / Telegram）
├── index.html              ← 主 HTML 入口
├── vercel.json             ← Vercel 部署配置
├── css/
│   └── style.css           ← 所有样式
├── js/
│   ├── app.js              ← 主入口，页面路由，本地 Auth stub
│   ├── auth.js             ← Firebase 登录/注册
│   ├── firebase-config.js  ← Firebase 配置（敏感，勿提交明文密钥）
│   ├── firebase-init.js    ← Firebase 初始化
│   ├── i18n.js             ← 多语言包（中文 / 日文 / 英文）
│   ├── state.js            ← 全局状态 + localStorage
│   ├── subjects.js         ← 科目增删改
│   ├── remind.js           ← Email / Telegram / Browser 提醒
│   ├── timer.js            ← 专注倒计时
│   ├── report.js           ← 每日报告 + EmailJS + AI 鼓励
│   ├── calendar.js         ← 日历视图 + Todo 列表
│   ├── stats.js            ← 图表统计（Chart.js）
│   ├── rewards.js          ← 积分 / 徽章 / 优惠券
│   ├── keys.js             ← API 密钥管理
│   ├── notion.js           ← Notion 同步
│   └── theme.js            ← 主题切换
└── api/
    ├── encourage.js        ← Claude API 鼓励语（Vercel Serverless）
    └── notion.js           ← Notion API 代理
```

---

## 当前进度（最近 git 记录）
- [x] Firebase 登录 / Google 登录
- [x] 多语言切换（中 / 日 / 英）
- [x] 专注计时器、学习统计图表
- [x] 积分奖励 / 优惠券系统
- [x] Notion 每日打卡归档（含重复检测 + 更新逻辑）
- [x] 登录输入框支持 Enter 键提交

---

## 重要规则 / 偏好
- 回复语言：**中文**
- 代码注释：**英文**
- 修改时：只改需要改的部分，不要重写整个文件
- API 密钥：不要把真实密钥写进回复或提交到 git

---

## 上次未完成的任务
- 日期：2026-04-14
- 任务：设置双电脑同步工作流（台机 + 笔记本）
- 完成：GitHub 同步方案 + CONTEXT.md 模板已建立
- 下次从这里开始：填写具体的下一个功能需求

---

## 常用命令
```powershell
# 开始工作前（拉取最新）
cd C:\...\Study-Reminder
git pull

# 改完后同步
git add .
git commit -m "描述这次改动"
git push
```

---

## 如何使用这个文件省 Token
1. 开新对话第一句：「请先读 CONTEXT.md，然后帮我 [任务]」
2. 结束前说：「帮我更新 CONTEXT.md 的'上次未完成的任务'」
3. 换电脑后先 git pull，再开 Claude
