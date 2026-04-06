# 学习小星星 / Study Stars

## 部署到 Vercel（免费，5分钟）

### 方法 A：拖拽上传（最简单）
1. 打开 https://vercel.com 注册免费账号
2. 点 Add New → Project → 选 "Upload"
3. 把整个 study-reminder 文件夹拖进去
4. 点 Deploy，等30秒拿到链接

### 方法 B：GitHub + Vercel（推荐，自动更新）
1. 上传文件夹到 GitHub 仓库
2. Vercel 连接该仓库，之后改代码 push 自动更新

---

## 配置邮件（EmailJS 免费，每月200封）

1. 注册 https://emailjs.com
2. Create Service → 选 Gmail 授权
3. Create Template，To Email 设为 {{to_email}}
   模板变量：{{subject_name}} {{date}} {{done}} {{duration}} {{difficulty}} {{summary}} {{hard_points}} {{points_earned}}
4. 复制 Public Key / Service ID / Template ID
5. 在 index.html 中找到并替换：
   const PUBLIC_KEY='YOUR_PUBLIC_KEY';
   const SERVICE_ID='YOUR_SERVICE_ID';
   const TEMPLATE_ID='YOUR_TEMPLATE_ID';

---

## LINE Notify 设置
1. 打开 notify-bot.line.me 用LINE账号登录
2. Generate token → 选聊天室 → 复制Token
3. 在应用的「提醒设置」页面开启LINE，贴入Token，点测试
