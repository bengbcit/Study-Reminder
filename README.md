# 🪐 Study Planet / 学習の惑星 

> **EN:** A web application to help children cultivate effective study habits.  
> **JP:** 子供たちの学習習慣の定着をサポートする、直感的なウェブアプリ。

---

## 🚀 Features / 主な機能

- 📋 **EN:** Subject settings & reminder schedules | **JP:** 学習科目の管理と通知設定
- 📝 **EN:** Daily study logs & mood tracking | **JP:** 学習内容と気分のデイリー記録
- 🏆 **EN:** Reward center & achievement badges | **JP:** ポイント制度とバッジ獲得システム
- 🌐 **EN:** Bilingual UI (English / Japanese) | **JP:** 英語・日本語のバイリンガル対応

---

## 🛠️ Deployment / デプロイ (Vercel)

### 1️⃣ Method A: Drag & Drop / ドラッグ＆ドロップ

1. **EN:** Visit [Vercel.com](https://vercel.com) -> **Add New** -> **Project**.  
   **JP:** [Vercel.com](https://vercel.com) にアクセスし、**Add New** -> **Project** を選択。

2. **EN:** Select the **Upload** tab and drag your folder.  
   **JP:** **Upload** タブを選び、プロジェクトフォルダをドラッグ。

3. **EN:** Click **Deploy**. Done!  
   **JP:** **Deploy** をクリックして公開完了！

### 2️⃣ Method B: GitHub Sync / GitHub 連携 (Recommended)

1. **EN:** Create a GitHub repo and push your local code.  
   **JP:** GitHub リポジトリを作成し、コードを push。

2. **EN:** Import the repository into Vercel.  
   **JP:** Vercel 上でそのリポジトリを **Import**。

3. **EN:** Sites update automatically on every push!  
   **JP:** 今後、GitHub に push するだけでサイトが自動更新されます。

---

## 📧 Email Configuration / メール設定 (EmailJS)

1. **EN:** Sign up at [EmailJS.com](https://emailjs.com).  
   **JP:** [EmailJS.com](https://emailjs.com) でサインアップ。

2. **EN:** Go to **Create Service** -> Select **Gmail** and authorize.  
   **JP:** **Create Service** -> **Gmail** を選択して認証。

3. **EN:** Create Template. Set `To Email` to `{{to_email}}`.  
   **JP:** **Create Template** で、`To Email` を `{{to_email}}` に設定。

4. **EN:** Copy your **Public Key**, **Service ID**, and **Template ID**.  
   **JP:** **Public Key**, **Service ID**, **Template ID** をコピー。

5. **EN:** Replace the placeholders in `index.html`:  
   **JP:** `index.html` 内の以下の箇所を書き換えます：
   ```javascript
   const PUBLIC_KEY = 'YOUR_PUBLIC_KEY';
   const SERVICE_ID = 'YOUR_SERVICE_ID';
   const TEMPLATE_ID = 'YOUR_TEMPLATE_ID';