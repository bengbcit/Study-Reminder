/* auth.js — NOT LOADED (index.html uses firebase-init.js instead)
   This file is kept as a reference but is not included in the app.
   All Firebase auth logic lives in firebase-init.js. */

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc, getDoc, setDoc, updateDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Wait for Firebase to be ready (initialized in index.html)
window.addEventListener('firebase-ready', () => {
  const auth = window._fbAuth;
  const db   = window._fbDb;

  const Auth = {
    user: null,

    // ── Auth state listener ─────────────────────────────────
    init() {
      onAuthStateChanged(auth, async user => {
        if (user) {
          this.user = user;
          await this.loadUserData(user.uid);
          this.hideGate();
          this.updateAvatar(); // 这个函数在 auth.js 中需要调整，见下面说明
          App.init();

          // --- 新增逻辑开始 ---
          // 显示 Firebase 用户信息和退出按钮
          const firebaseUserInfoDiv = document.getElementById('firebase-user-info');
          const firebaseUsernameSpan = document.getElementById('firebase-username');
          if (firebaseUserInfoDiv && firebaseUsernameSpan) {
            firebaseUsernameSpan.textContent = user.displayName || user.email || 'User';
            firebaseUserInfoDiv.style.display = 'flex'; // 显示这个区域
          }
          // 隐藏本地模式的登录/注册表单
          document.getElementById('authForm').style.display = 'none';
          // --- 新增逻辑结束 ---

        } else {
          this.user = null;
          this.showGate();
          // 当用户退出或未登录时，显示本地模式的登录/注册表单
          const authForm = document.getElementById('authForm');
          if (authForm) authForm.style.display = 'block';
          // 隐藏 Firebase 用户信息区域
          const firebaseUserInfoDiv = document.getElementById('firebase-user-info');
          if (firebaseUserInfoDiv) firebaseUserInfoDiv.style.display = 'none';
          }
        });
    },

    // ── Gate UI ─────────────────────────────────────────────
    showGate() {
      document.getElementById('authGate').style.display = 'flex';
      document.getElementById('mainApp').style.display = 'none';
      this.showLogin();
    },

    hideGate() {
      document.getElementById('authGate').style.display = 'none';
      document.getElementById('mainApp').style.display = 'block';
    },

    showLogin() {
      document.getElementById('tabLogin').classList.add('active');
      document.getElementById('tabRegister').classList.remove('active');
      document.getElementById('authTitle').textContent = t('appTitle');
      document.getElementById('authErr').textContent = '';
      document.getElementById('authForm').innerHTML = `
        <input class="auth-input" id="aiEmail" type="email" placeholder="${t('email_field')}">
        <input class="auth-input" id="aiPass" type="password" placeholder="${t('password_field')}">
        <button class="auth-btn" onclick="Auth._login()">${t('login')}</button>
        <div class="auth-divider">or</div>
        <button class="auth-google" onclick="Auth._googleLogin()">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.3 0 24 0 14.7 0 6.7 5.4 2.8 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.6 37.4 46.5 31.4 46.5 24.5z"/><path fill="#FBBC05" d="M10.6 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.1-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.8 2.2-6.2 0-11.5-3.5-13.4-8.8l-8.1 6.1C6.7 42.6 14.7 48 24 48z"/></svg>
          ${t('google_login')}
        </button>
        
        <!-- 新增：显示用户名和退出按钮 -->
        <div id="firebase-user-info" style="display: none;"> 
          <span id="firebase-username"></span>
          <button class="auth-btn" onclick="Auth._logout()">${t('profile_logout')}</button> 
        </div>
        `;
    },

    showRegister() {
      document.getElementById('tabRegister').classList.add('active');
      document.getElementById('tabLogin').classList.remove('active');
      document.getElementById('authErr').textContent = '';
      document.getElementById('authForm').innerHTML = `
        <input class="auth-input" id="aiName" type="text" placeholder="${t('name_field')}">
        <input class="auth-input" id="aiEmail" type="email" placeholder="${t('email_field')}">
        <input class="auth-input" id="aiPass" type="password" placeholder="${t('password_field')}">
        <button class="auth-btn" onclick="Auth._register()">${t('register')}</button>
        <div class="auth-divider">or</div>
        <button class="auth-google" onclick="Auth._googleLogin()">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.3 0 24 0 14.7 0 6.7 5.4 2.8 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.6 37.4 46.5 31.4 46.5 24.5z"/><path fill="#FBBC05" d="M10.6 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.1-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.8 2.2-6.2 0-11.5-3.5-13.4-8.8l-8.1 6.1C6.7 42.6 14.7 48 24 48z"/></svg>
          ${t('google_login')}
        </button>
        
        <!-- 新增：显示用户名和退出按钮 -->
        <div id="firebase-user-info" style="display: none;">
          <span id="firebase-username"></span>
          <button class="auth-btn" onclick="Auth._logout()">${t('profile_logout')}</button>
        </div>
        `;
    },

    // ── Auth actions ────────────────────────────────────────
    async _login() {
      const email = document.getElementById('aiEmail').value.trim();
      const pass  = document.getElementById('aiPass').value;
      try {
        await signInWithEmailAndPassword(auth, email, pass);
      } catch (e) {
        document.getElementById('authErr').textContent = e.message;
      }
    },

    async _register() {
      const name  = document.getElementById('aiName').value.trim();
      const email = document.getElementById('aiEmail').value.trim();
      const pass  = document.getElementById('aiPass').value;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(cred.user, { displayName: name });
        await this._createUserDoc(cred.user, name);
      } catch (e) {
        document.getElementById('authErr').textContent = e.message;
      }
    },

    async _googleLogin() {
      const provider = new GoogleAuthProvider();
      try {
        const cred = await signInWithPopup(auth, provider);
        // Create doc only if new user
        const ref = doc(db, 'users', cred.user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) await this._createUserDoc(cred.user, cred.user.displayName);
      } catch (e) {
        document.getElementById('authErr').textContent = e.message;
      }
    },

    async _createUserDoc(user, displayName) {
      await setDoc(doc(db, 'users', user.uid), {
        displayName: displayName || user.email,
        email: user.email,
        points: 0,
        streak: 0,
        coupons: [],
        subjects: JSON.parse(JSON.stringify(DEFAULT_SUBJECTS)),
        history: {},
        createdAt: new Date().toISOString(),
      });
    },

    // ── Load / Save user data from Firestore ─────────────────
    async loadUserData(uid) {
      const ref  = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        // Merge Firestore data into local S
        if (data.subjects && data.subjects.length) S.subjects = data.subjects;
        if (data.points  !== undefined) S.points  = data.points;
        if (data.streak  !== undefined) S.streak  = data.streak;
        if (data.history)  S.history  = data.history;
        if (data.coupons)  S.coupons  = data.coupons;
        if (data.settings) Object.assign(S, data.settings);
      }
      saveLocal();
    },

    async saveUserData() {
      if (!this.user) return;
      const ref = doc(db, 'users', this.user.uid);
      await updateDoc(ref, {
        subjects: S.subjects,
        points:   S.points,
        streak:   S.streak,
        history:  S.history,
        coupons:  S.coupons,
        settings: {
          notify:       S.notify,
          startTime:    S.startTime,
          remindBefore: S.remindBefore,
          emailAddr:    S.emailAddr,
          tgToken:      S.tgToken,
          tgChatId:     S.tgChatId,
        },
      });
    },

    // ── Avatar ───────────────────────────────────────────────
    updateAvatar() {
      const btn = document.getElementById('userAvatar');
      if (!btn) return;

      let userName = '';
      let avatarContent = '';

      if (this.user) {
        // Firebase 用户模式
        userName = this.user.displayName || this.user.email || 'User';
        const initial = userName.charAt(0).toUpperCase();
        avatarContent = `<div class="profile-avatar">${initial}</div>`; // 显示首字母
        btn.innerHTML = avatarContent; // 更新头像按钮内容
        btn.style.fontSize = '20px'; // 调整字体大小
        btn.style.borderRadius = '50%'; // 确保圆形
        btn.style.objectFit = 'cover'; // 图像覆盖
      } else {
        // 本地模式 - 复用 app.js 中的逻辑
        // 这里需要确保 S.avatar 在本地模式下是可用的
        const name = S._localName || { zh:'本地用户', ja:'ローカルユーザー', en:'Local User' }[window.I18n?.lang || 'zh'];
        userName = name;
        if (S.avatar && S.avatar.length > 2) {
          avatarContent = `<img src="${S.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
        } else if (S.avatar) {
          avatarContent = `<div class="profile-avatar" style="font-size:40px">${S.avatar}</div>`;
        } else {
          avatarContent = `<div class="profile-avatar">${name.charAt(0).toUpperCase()}</div>`;
        }
        btn.innerHTML = avatarContent;
      }
      // 设置头像按钮的 title 属性，显示完整用户名
      btn.title = userName;
    },

    // ── Profile drawer ───────────────────────────────────────
    openProfile() {
      if (!this.user) return;
      const drawer = document.getElementById('profileDrawer');
      drawer.classList.add('open');
      this._renderProfile();
    },

    closeProfile(e) {
      if (e.target === document.getElementById('profileDrawer')) {
        document.getElementById('profileDrawer').classList.remove('open');
      }
    },

    _renderProfile() {
      const u = this.user;
      const name = u.displayName || u.email || 'User';
      const initial = name.charAt(0).toUpperCase();
      const earned = Rewards ? Rewards.getEarned() : new Set();
      const badgeData = Rewards ? Rewards.BADGES : [];

      const badgeHtml = badgeData
        .filter(b => earned.has(b.id))
        .map(b => `<div class="profile-badge" title="${b.name[I18n.lang]||b.name.zh}">${b.icon}</div>`)
        .join('') || '<span style="font-size:13px;color:var(--text2)">—</span>';

      document.getElementById('profileContent').innerHTML = `
        <div class="profile-avatar">${initial}</div>
        <div class="profile-name">${name}</div>
        <div class="profile-email">${u.email}</div>
        <div class="profile-stat-row">
          <div class="ps-card"><div class="ps-num">${S.points}</div><div class="ps-lbl">${t('pts_lbl')}</div></div>
          <div class="ps-card"><div class="ps-num">${S.streak}</div><div class="ps-lbl">${t('stats_streak')}</div></div>
          <div class="ps-card"><div class="ps-num">${Object.keys(S.history).length}</div><div class="ps-lbl">${t('stats_total_days')}</div></div>
        </div>
        <p class="sec-label">${t('profile_badges')}</p>
        <div class="profile-badges">${badgeHtml}</div>
        <button class="logout-btn" onclick="Auth._logout()">${t('profile_logout')}</button>
      `;
    },

    async _logout() {
      // 如果是 Firebase 用户，执行 Firebase 退出
      if (this.user) {
        await signOut(auth); // Firebase 退出
      }
      // 无论 Firebase 还是本地模式，都执行本地退出逻辑
      localStorage.removeItem('ss_localEntered'); // 清除本地模式标记
      S.avatar = null; // 清空头像
      saveLocal(); // 保存本地设置
      location.reload(); // 刷新页面
      document.getElementById('profileDrawer').classList.remove('open'); // 关闭资料抽屉
    },
  };

  // Expose globally
  window.Auth = Auth;
  Auth.init();
});
