# Efficient Learning Engine / 学習プラネット

> 🚀 A pixel-art styled all-in-one study platform — study tracker, vocabulary app, meal planner, and more.  
> 🚀 ピクセルアートスタイルのオールインワン学習プラットフォーム — 学習トラッカー・語彙アプリ・食事プランナーなど。  
> Deploy: Vercel · Auth: Firebase · Sync: Firestore · i18n: zh / ja / en

---

## Project Structure / プロジェクト構造


## 📁 Project Structure / プロジェクト構造

```bash
study-reminder/                          # Efficient Learning Engine / 学習リマインダー
├── CLAUDE.md                            # Core Guidelines / 核心規則
├── .claude/context.md                   # Project Context / 詳細コンテキスト
├── index.html                           # Main App
├── landing.html                         # Multi-Project Hub
├── css/style.css
├── js/
│   ├── app.js                           # Main + Routing
│   ├── firebase-init.js                 # Firebase Auth
│   ├── report.js                        # Daily Report + AI
│   └── ... (subjects, timer, rewards...)
├── api/                                 # Serverless API
└── images_vid/                          # Assets
```
---

## Changelog / 変更履歴

### V1.3 — Pixel Runner Game + New API Endpoints (2026-05-04)

**English:**

- **Pixel Runner mini-game** — new `pixel_runner.html` standalone game page; also embedded as a widget in `app.html`, `landing.html`, and `vocab_ultimate_bilingual.html`
- **Canvas-based character rendering** — character sprite switched to `<canvas>` for smoother frame-by-frame animation and layered visual effects
- **Enhanced dust particle effects** — improved dust trail animation with per-frame rendering and better timing
- **Map scale adjustments** — gameplay map scale tuned across all HTML embeds for a more balanced in-browser feel
- **New sprite assets** — added `images_vid/Pixel_RPG.png` (idle) and `images_vid/Running_RPG.png` (running) character sprites
- **New API endpoints** — `api/seedance.js` (Seedance video generation), `api/word-fill.js` (word fill game), `api/generate-bg.js` & `api/generate-avatar.js` (Stability AI image generation)
- **QA agents** — added `hm_qa_agent.py` and `thesaurus_trove_qa.py` for automated QA testing

**日本語：**

- **Pixel Runner ミニゲーム** — 新規スタンドアロンページ `pixel_runner.html` を追加；`app.html`・`landing.html`・`vocab_ultimate_bilingual.html` にもウィジェットとして埋め込み
- **キャンバスベースのキャラクター描画** — `<canvas>` を使ったフレームアニメーションに切り替え、エフェクトの重ね描きが可能に
- **ダスト（ほこり）エフェクト強化** — フレームごとの描画タイミングを改善し、より滑らかなダストトレイルを実現
- **マップスケール調整** — 全HTMLファイルのゲーム内マップスケールをブラウザ表示に最適化
- **新スプライト素材** — `images_vid/Pixel_RPG.png`（待機）および `images_vid/Running_RPG.png`（走行）を追加
- **新APIエンドポイント** — `api/seedance.js`（Seedance動画生成）、`api/word-fill.js`（穴埋めゲーム）、`api/generate-bg.js` & `api/generate-avatar.js`（Stability AI 画像生成）
- **QAエージェント** — `hm_qa_agent.py` および `thesaurus_trove_qa.py` による自動テストスクリプトを追加

---

### V1.2 — Multi-Project Platform + AI PDF Vocab Extraction (2026-04-23)

**English:**

- **Multi-project landing page** — `landing.html` now hosts three standalone project cards: ELE, Thesaurus Trove (TT), and Happy Meal (HM)
- **Thesaurus Trove is now a standalone project** — removed from ELE sidebar; TT card on landing page with its own deep-purple gradient + glow blobs + dot-grid texture
- **Happy Meal added** — links to `https://happy-meal-two.vercel.app/` with an amber/orange card; status: Active
- **TT pixel-art header** — Press Start 2P font, scrollable tab bar (Words / Quiz / Stats / More), language toggle, 🏠 home button; matches ELE's topbar style
- **TT default dark theme (purple)** — fixed FOUC with inline `<script>` in `<head>` that applies CSS vars before page renders
- **AI PDF vocabulary extraction** — upload any PDF (including scanned) to TT's More tab → Gemini 2.0 Flash extracts up to 100 words → preview with checkboxes → import to word list; requires `GEMINI_API_KEY` in Vercel env vars
- **Avatar dropdown UX cleanup** — name row is now clickable (opens profile drawer); removed redundant "Sign in with Email" button from local mode menu; Firebase menu: "Switch to Local" → "Switch Account"
- **Planet menu** (landing page, logged-in) — now has separate ELE and TT entry points, plus Switch Account

**日本語：**

- **マルチプロジェクト型ランディングページ** — `landing.html` に3つの独立プロジェクトカードを表示：ELE・Thesaurus Trove (TT)・Happy Meal (HM)
- **Thesaurus Trove の独立化** — ELEサイドバーから分離、ランディングページの独自カードへ（深紫グラデーション＋グロー＋ドットグリッド）
- **Happy Meal 追加** — `https://happy-meal-two.vercel.app/` へのリンクカード（琥珀/オレンジ配色、ステータス: Active）
- **TT ピクセルアートヘッダー** — Press Start 2P フォント、スクロール可能なタブバー（Words / Quiz / Stats / More）、言語切替、🏠 ホームボタン
- **TT デフォルトダークテーマ（purple）** — `<head>` 内のインライン `<script>` で FOUC（スタイル未適用フラッシュ）を防止
- **AI PDF 語彙抽出** — PDFをアップロード（スキャン版もOK）→ Gemini 2.0 Flash が最大100語を抽出 → チェックボックスで選択 → 単語帳にインポート（`GEMINI_API_KEY` が必要）
- **アバタードロップダウン UX 改善** — 名前行クリックでプロフィールドロワーを開くように変更；ローカルモードの「メールでログイン」ボタンを削除；Firebase メニュー：「ローカルに切替」→「アカウント切替」
- **惑星メニュー**（ランディングページ、ログイン済み）— ELE・TT への個別リンク＋アカウント切替

---

### V1.1 — Pixel Topbar + Vocab App + Account UX (2026-04-23)

**English:**

- **Pixel-art topbar** with Press Start 2P font; language switcher is now a dropdown (globe icon + flag emoji)
- **🔥 Streak** moved from topbar to Rewards page hero section
- **Past check-in history** in Rewards — last 8 weeks, colour-coded dots (grey / orange / green)
- **Notion token persistence** — stored in Firestore, no need to re-enter after login
- **AI background & avatar generation** — Stability AI Ultra (bg) + Core (avatar) via `/api/generate-bg` and `/api/generate-avatar`; requires `STABILITY_API_KEY` in Vercel env vars
- **Account menu cleanup** — Firebase users: "Switch Account" logs out to auth gate; Local mode: removed redundant "Sign in with Email" button
- **📖 Vocab app** (`vocab_ultimate_bilingual.html`) integrated — click 📖 in sidebar to open in new tab; supports Japanese (JLPT N1–N5) + English (CEFR A1–C2), SRS quiz, daily goals, streak

**日本語：**

- **ピクセルアートトップバー** — Press Start 2P フォント使用；言語切替がドロップダウン（地球アイコン＋国旗絵文字）に変更
- **🔥 ストリーク** — トップバーから報酬ページのヒーローセクションに移動
- **過去のチェックイン履歴** — 報酬ページに直近8週間のカラーコードドット（グレー / オレンジ / グリーン）表示
- **Notion トークンの永続化** — Firestoreに保存、ログイン後の再入力不要
- **AI による背景＆アバター生成** — Stability AI Ultra（背景）＋ Core（アバター）、`/api/generate-bg` と `/api/generate-avatar` 経由；Vercel 環境変数に `STABILITY_API_KEY` が必要
- **アカウントメニューの整理** — Firebaseユーザー：「アカウント切替」で認証ゲートにログアウト；ローカルモード：「メールでログイン」ボタンを削除
- **📖 語彙アプリ** (`vocab_ultimate_bilingual.html`) 統合 — サイドバーの📖をクリックして新タブで開く；日本語（JLPT N1〜N5）＋英語（CEFR A1〜C2）対応、SRSクイズ、日次目標、ストリーク

---

### V2.1 — Multi-File Refactor + New Features

**English:**

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

**日本語：**

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

### 1. Deploy to Vercel / Vercel へデプロイ

**EN:** Upload the entire `study-reminder/` folder at [vercel.com](https://vercel.com) → Add New → Project → Upload.

**JA:** `study-reminder/` フォルダを [vercel.com](https://vercel.com) にドラッグ＆ドロップしてデプロイ。

---

### 2. Firebase Setup / Firebase 設定

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

### 3. EmailJS Setup / EmailJS 設定

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

### 4. Telegram Bot Setup / Telegram ボット設定

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

### 5. AI Encouragement (Claude API) / AI 応援機能

**EN:** The AI encouragement in `js/report.js` calls the Anthropic API directly. Add your Anthropic API key as a Vercel environment variable `ANTHROPIC_API_KEY` and create a small serverless function, or call the API from your own backend. For a quick test, you can temporarily hardcode the key (not recommended for production).

**JA:** `js/report.js` のAI応援はAnthropic APIを呼び出します。Vercelの環境変数 `ANTHROPIC_API_KEY` を設定して、サーバーレス関数経由で呼び出すか、独自バックエンドを使用してください。
