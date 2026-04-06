# Study Stars / スタディスター

---

## v1 — Initial Release (Single File)

> Previous single-file version (`index.html` only). See git history for reference.

---

## v2 — Multi-File Refactor + New Features

### English

**What's new in v2:**
- Split into multiple files (`css/`, `js/` modules) for easier maintenance
- Subject settings: add / delete / toggle subjects with custom icon & color
- Save settings → auto-updates today's calendar as a todo-list (green checkmarks)
- Reminder: Email (.ics calendar export), Telegram Bot, Browser banner push
- Email config: one button to export `.ics` file (works with Gmail, Outlook, Apple Calendar)
- Browser reminder: in-page banner (no OS permission needed)
- Focus Timer: per-subject countdown, pause/resume/reset
- Study Stats: weekly bar chart + subject doughnut chart (Chart.js)
- AI Encouragement: Claude API generates personalized message after report submission
- Rewards: points → badges → redeem → generates a beautiful coupon card stored in Coupon Center
- Firebase Auth: Email/Password + Google login, cloud sync across devices
- Language switcher: Chinese / Japanese / English (top-left)
- Code comments: all in English

**File structure:**
```
study-reminder/
├── index.html              # Main HTML shell
├── css/
│   └── style.css           # All styles
├── js/
│   ├── firebase-config.js  # Firebase credentials (fill in yours)
│   ├── i18n.js             # zh/ja/en language pack
│   ├── state.js            # Runtime state + localStorage helpers
│   ├── auth.js             # Firebase auth (Email + Google)
│   ├── subjects.js         # Subject add/delete/toggle
│   ├── remind.js           # Email / Telegram / Browser push
│   ├── timer.js            # Focus countdown timer
│   ├── report.js           # Daily report + EmailJS + AI encouragement
│   ├── calendar.js         # Calendar view + daily todo-list
│   ├── stats.js            # Chart.js statistics
│   ├── rewards.js          # Points / badges / coupon generation
│   └── app.js              # Entry point, page routing, save settings
└── vercel.json
```

---

### 日本語

**v2 の新機能：**
- 複数ファイルに分割（`css/`、`js/` モジュール）でメンテナンスしやすく
- 科目設定：アイコン・カラー付きで科目を追加・削除・停止
- 保存ボタン → その日のカレンダーがTodoリスト（緑チェック）に自動更新
- リマインド：メール（.icsエクスポート）、Telegram Bot、ブラウザバナー
- メール設定：.icsファイルをダウンロード（Gmail・Outlook・Appleカレンダー対応）
- ブラウザ通知：ページ内バナー（OS許可不要）
- 集中タイマー：科目ごとのカウントダウン、一時停止・再開・リセット
- 学習統計：週間棒グラフ＋科目ドーナツチャート（Chart.js）
- AI応援：レポート提出後にClaudeがパーソナライズされたメッセージを生成
- 報酬：ポイント→バッジ→交換→クーポンカード生成（クーポンセンターに保存）
- Firebase認証：メール/パスワード＋Googleログイン、複数デバイス同期
- 言語切替：中国語・日本語・英語（左上）
- コードコメント：すべて英語

---

## Setup Guide / セットアップ手順

### 1. Deploy to Vercel / Vercelへデプロイ

**EN:** Upload the entire `study-reminder/` folder at [vercel.com](https://vercel.com) → Add New → Project → Upload.

**JA:** `study-reminder/` フォルダを [vercel.com](https://vercel.com) にドラッグ＆ドロップしてデプロイ。

---

### 2. Firebase Setup / Firebase設定

**EN:**
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a project → Add Web App → copy `firebaseConfig`
3. Enable **Authentication** → Email/Password + Google
4. Enable **Firestore** → Start in test mode
5. Paste your config into `js/firebase-config.js`

**JA:**
1. [console.firebase.google.com](https://console.firebase.google.com) でプロジェクト作成
2. ウェブアプリを追加 → `firebaseConfig` をコピー
3. **Authentication** → メール/パスワード＋Google を有効化
4. **Firestore** → テストモードで開始
5. `js/firebase-config.js` に貼り付け

---

### 3. EmailJS Setup / EmailJS設定

**EN:**
1. Sign up at [emailjs.com](https://emailjs.com) (free: 200 emails/month)
2. Create a Service (Gmail recommended) and a Template
3. Template variables: `{{to_email}}` `{{subject}}` `{{body}}`
4. Replace `YOUR_EMAILJS_PUBLIC_KEY`, `YOUR_SERVICE_ID`, `YOUR_TEMPLATE_ID` in `js/report.js`

**JA:**
1. [emailjs.com](https://emailjs.com) に登録（無料：月200通）
2. サービス（Gmail推奨）とテンプレートを作成
3. テンプレート変数：`{{to_email}}` `{{subject}}` `{{body}}`
4. `js/report.js` の `YOUR_*` を置き換える

---

### 4. Telegram Bot Setup / Telegramボット設定

**EN:**
1. Open Telegram → search `@BotFather` → send `/newbot`
2. Copy the **Token**
3. Start your bot → visit `api.telegram.org/bot{TOKEN}/getUpdates` → copy `chat_id`
4. Enter Token + Chat ID in the app's Reminder Settings

**JA:**
1. Telegram で `@BotFather` を検索 → `/newbot` を送信
2. **Token** をコピー
3. ボットをスタート → `api.telegram.org/bot{TOKEN}/getUpdates` で `chat_id` をコピー
4. アプリのリマインド設定にTokenとChat IDを入力

---

### 5. AI Encouragement (Claude API) / AI応援機能

**EN:** The AI encouragement in `js/report.js` calls the Anthropic API directly. Add your Anthropic API key as a Vercel environment variable `ANTHROPIC_API_KEY` and create a small serverless function, or call the API from your own backend. For a quick test, you can temporarily hardcode the key (not recommended for production).

**JA:** `js/report.js` のAI応援はAnthropic APIを呼び出します。Vercelの環境変数 `ANTHROPIC_API_KEY` を設定して、サーバーレス関数経由で呼び出すか、独自バックエンドを使用してください。
