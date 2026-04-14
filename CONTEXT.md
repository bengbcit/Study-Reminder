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
- 代码注释：**英文 + 日文**（方便面试，绝不出现韩文）
- 界面语言：**只支持中文 / 英文 / 日文**，不添加韩文或其他语言
- 修改时：只改需要改的部分，不要重写整个文件
- API 密钥：不要把真实密钥写进回复或提交到 git
- **CONTEXT.md 触发词**：每当我说「总结到context.md」或「context.md summary so far」，Claude 就把本次对话的提问与解答要点追加到下方「学习笔记 / Q&A 归档」章节

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
2. 结束前说：「总结到context.md」或「context.md summary so far」
3. 换电脑后先 git pull，再开 Claude

---

## 学习笔记 / Q&A 归档
> 说「总结到context.md」时，Claude 会把当次对话要点追加到这里。

---

### 2026-04-14 — Firebase 登录失败 & 个人资料 UI 重设计

#### ❓ 问题 1：登录不上，Google / Email 都失败，自动跳回本地模式

**根本原因（两层叠加）：**

**层 1 — Google Cloud API Key 来源限制（需手动配置）**
- 错误表现：控制台出现 `API_KEY_HTTP_REFERRER_BLOCKED` / 403
- 原因：Firebase API Key 在 Google Cloud Console 里设置了 HTTP 来源白名单，但缺少必要域名
- 修复：Google Cloud Console → APIs & Services → Credentials → 找 Firebase 的 Browser Key → Website restrictions 里加入：
  ```
  https://study-reminder-8910.firebaseapp.com/*
  https://study-reminder-dusky.vercel.app/*
  http://localhost/*
  http://localhost:5000/*
  ```
- 注意：这个 Key 和 OAuth Client 的 "Authorized JavaScript origins" 是**两个不同的地方**

**层 2 — `ss_localEntered` localStorage 标记残留（代码 bug）**
- 错误表现：登录页能正常显示，但登录后马上回到「本地用户」
- 原因：曾经点过「进入学习星球」（本地模式入口），`app.js` 写入 `localStorage.ss_localEntered = '1'`，之后每次刷新直接跳过 Firebase
- 临时修复（浏览器控制台执行）：
  ```javascript
  localStorage.removeItem('ss_localEntered'); location.reload();
  ```
- 代码修复（`firebase-init.js` `_onSignIn` 里加一行）：
  ```javascript
  localStorage.removeItem('ss_localEntered'); // Clear local-mode flag on Firebase sign-in
  ```

**层 3 — `_onSignIn` 阻塞问题（代码 bug）**
- 原因：原代码先 `await _loadUserData()`（请求 Firestore），再显示主界面；Firestore 超时时界面永远不出现
- 修复：先显示主界面，再异步加载 Firestore 数据（不阻塞 UI）

---

#### ❓ 问题 2：个人资料页头像和徽章太占地方，想折叠

**需求：** 把头像选择（emoji + 上传）和徽章合并进两个按钮「头像」「徽章」，点击才展开

**修改文件：**
- `css/style.css`：新增 `.profile-panel-row` / `.profile-panel-btn` / `.profile-expand-panel` / `.avatar-preset-grid` / `.avatar-opt` / `.avatar-upload-btn`
- `js/app.js`：重写 `_localProfile()`，新增全局函数 `_toggleProfilePanel(id)`
- `js/firebase-init.js`：重写 `_renderProfile()`，新增 `_setAvatar()` / `_uploadAvatar()` / 改进 `_updateAvatar()`（支持 emoji 和图片头像）

**交互逻辑：** 两个面板互斥，点击已打开的面板会收起，点另一个会关闭当前、打开另一个

---

#### 📌 关键经验

| 经验 | 说明 |
|------|------|
| Firebase API Key ≠ OAuth Client | 两者在 Google Cloud Console 里是分开配置的，都要加域名 |
| `ss_localEntered` 陷阱 | 只要点过本地模式，以后都会跳过 Firebase，清 localStorage 就能恢复 |
| Firestore 不能阻塞登录 | 先显示 UI，再异步加载数据，避免离线时卡住 |
| `window.Auth` 覆盖顺序 | `app.js` 先设 local stub → `firebase-init.js` 模块加载后覆盖为 FirebaseAuth |

---

### 2026-04-14 — Firebase 登录卡顿 & 头像覆盖 bug 修复（commit `5611bc9`）

#### ❓ 问题：Google / Email 登录后"卡几秒，变回本地用户"

**根本原因（三个叠加）：**

**1 — 登录成功后无反馈，看起来卡住**
- 表现：Gmail 弹窗关闭后，按钮变灰但没任何提示，用户以为没成功
- 修复：`_login` / `_register` / `_googleLogin` 成功后立即把 `authForm` 替换为 `⏳ 正在登录…` 提示，等 `onAuthStateChanged` 触发 `_onSignIn` 后 authGate 自动隐藏

**2 — Firebase 头像被 `App.init()` 覆盖**
- 表现：登录后头像按钮显示 '👤'（本地模式样式），感觉没真正登录
- 原因：`_onSignIn` 先调 `_updateAvatar()`（设为首字母），再调 `App.init()` → `_updateLocalAvatar()`（覆盖回 '👤'）
- 修复：把 `_updateAvatar()` 移到 `App.init()` **之后**，确保 Firebase 头像最后写入

**3 — Firestore 数据加载后 UI 不刷新**
- 表现：登录后显示的是旧本地数据（科目、连续天数等），不是 Firebase 数据
- 原因：`_loadUserData` 只写入 `S` 并 `saveLocal()`，没有触发重新渲染
- 修复：`saveLocal()` 后加 `Subjects.render()` + 更新连续天数 + `_updateAvatar()` + `ThemeManager.restore()`

**4 — `_googleLogin` 出错后无法重试**
- 原因：catch 只调 `_setBusy('googleBtn', false)`，但 form 已被 loading 替换，按钮不存在
- 修复：catch 改为调 `this.showLogin()` 重新渲染登录表单，再显示错误信息

#### 📌 关键经验
| 经验 | 说明 |
|------|------|
| `_updateAvatar` 调用顺序 | 必须在 `App.init()` 之后调，否则会被 `_updateLocalAvatar()` 覆盖 |
| 异步加载后要刷新 UI | `_loadUserData` 加载完要主动 render，不然用户看到的是本地缓存数据 |
| 登录反馈要即时 | 弹窗关闭到 `onAuthStateChanged` 有 1-3 秒延迟，这段时间必须有 loading 提示 |

---

### 2026-04-15 — 登录页 + AI语言 + 每日励志语（commit `1ad7678`）

#### 问题 1：秒进本地模式
- **原因**：`DOMContentLoaded` 发现 `ss_localEntered` 就跳过登录页
- **修复**：删掉自动跳过；登录/注册表单底部加「👤 以本地模式进入」虚线按钮；offline fallback 从 10s 缩到 6s

#### 问题 2：AI鼓励语言不对
- **原因**：`api/encourage.js` fallback 写死英文，忽略 `lang` 参数
- **修复**：改为 `fallback[lang] || fallback.en`，中/日/英各一句

#### 新功能：每日励志语
- 简报页顶部加每天自动换一句的励志卡片（14 句 × 3 语言，日期取模）

#### 邮件未收到（⚠️ 待用户确认）
- `emailjs.init()` 已移出 forEach
- **需要去 EmailJS 后台核对 Template ID**：Email Templates → 模板 → Settings → Template # 那行，代码里是 `template_bp2bmun`，确认是否匹配

#### 📌 关键经验
| 经验 | 说明 |
|------|------|
| 登录页勿自动跳过 | `ss_localEntered` 自动跳是差体验，改为按钮让用户主动选择 |
| API fallback 要带语言 | 服务器端 fallback 也要读 `lang`，否则语言切换无效 |
| EmailJS Template ID 易混淆 | 'b' 和 '5' 视觉近似，一定要去后台对照 |

---

### 2026-04-15 — 科目编辑 + 奖券抽屉 + 积分调整 + 自动保存（commit `fbfa033`）

#### 问题 3：科目不能编辑
- **方案**：每个科目卡右侧加 ✏️ 按钮，点击打开编辑弹窗
- **编辑弹窗内容**：科目名 / 图标（emoji 选色格）/ 颜色（accent 色）/ 背景色（15 个预设浅色）
- **新增**：`BG_COLORS` 数组 + `_editState` 变量 + `openEdit/closeEdit/confirmEdit/_renderEdit*` 方法
- **HTML**：`index.html` 新增 `#editModal` 弹窗；`i18n.js` 新增 `modal_edit / pick_bg / btn_save2`

#### 问题 4：表单自动记住
- `#emailAddr` → `onblur="Remind.autoSave()"`
- `#discordWebhook` → `onblur="Remind.autoSave()"`
- `#startTime` → `onchange="Remind.autoSave()"`
- `#reportEmail` → `onblur="Report._saveEmail(this)"`（双向同步到 `S.emailAddr`）
- `Remind.autoSave()` 新方法：读 UI → saveLocal → 同步 reportEmail

#### 问题 5：积分调整 + 奖券抽屉
- 奖励页积分显示改为 `pts-adj-row`：`−10 [积分数] ＋10` 排列
- 个人资料抽屉加第三个面板按钮「🎫 奖券」，展开后显示 mini 奖券列表（可点击打开奖券弹窗）
- `_toggleProfilePanel()` 改为支持三面板互斥（avatarPanel / badgePanel / couponPanel）
- `profile-panel-row` 改为 3 列网格

#### 📌 关键经验
| 经验 | 说明 |
|------|------|
| `onblur` vs `onchange` | 文本框用 blur（离开才保存），select/time 用 change（即时保存） |
| 背景色与 accent 色分开 | 原来 bg = color + '22'，现在用户可独立选背景色，更灵活 |
| 面板互斥逻辑 | 收集所有 panel → 全部 remove('open') → 再选择性 add('open') |

