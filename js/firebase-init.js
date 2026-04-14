/* firebase-init.js — Firebase Auth + Firestore
   Fixes:
   1. Sets window.Auth._firebased = true so app.js knows Firebase is active
   2. showLogin/showRegister use t() — re-renders correctly when lang changes
   3. Google login: popup first, redirect fallback if blocked
   4. All error messages are language-aware via _friendlyError()
   5. _refreshAuthGate() is called from i18n.js on lang switch
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect,
  getRedirectResult, GoogleAuthProvider, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import FIREBASE_CONFIG from './firebase-config.js';

if (FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
  console.info('Firebase not configured — local mode active.');
} else {
  let _auth, _db;
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    _auth = getAuth(app);
    _db   = getFirestore(app);
  } catch (e) {
    console.warn('Firebase init error:', e.message);
  }

  if (_auth && _db) {

    const FirebaseAuth = {
      user: null,
      _firebased: true, // ← marker so app.js knows Firebase is active

      async _onSignIn(user) {
        this.user = user;
        await this._loadUserData(user.uid);
        document.getElementById('authGate').style.display = 'none';
        document.getElementById('mainApp').style.display  = 'block';
        this._updateAvatar();
        App.init();
      },

      _onSignOut() {
        this.user = null;
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('authGate').style.display = 'flex';
        this.showLogin();
      },

      // ── Auth gate UI — uses t() so language switching works ──
      showLogin() {
        const el = document.getElementById('tabLogin');
        const er = document.getElementById('tabRegister');
        if (el) { el.classList.add('active');    el.textContent = t('login'); }
        if (er) { er.classList.remove('active'); er.textContent = t('register'); }
        _setErr('');
        document.getElementById('authForm').innerHTML = `
          <input class="auth-input" id="aiEmail" type="email"
                 placeholder="${t('email_field')}" autocomplete="email"
                 onkeydown="if(event.key==='Enter')window.Auth._login()">
          <input class="auth-input" id="aiPass" type="password"
                 placeholder="${t('password_field')}" autocomplete="current-password"
                 onkeydown="if(event.key==='Enter')window.Auth._login()">
          <button class="auth-btn" id="loginBtn"
                  onclick="window.Auth._login()">${t('login')}</button>
          <div class="auth-divider">or</div>
          <button class="auth-google" id="googleBtn"
                  onclick="window.Auth._googleLogin()">
            ${_gIcon()} ${t('google_login')}
          </button>`;
      },

      showRegister() {
        const el = document.getElementById('tabLogin');
        const er = document.getElementById('tabRegister');
        if (el) { el.classList.remove('active'); el.textContent = t('login'); }
        if (er) { er.classList.add('active');    er.textContent = t('register'); }
        _setErr('');
        document.getElementById('authForm').innerHTML = `
          <input class="auth-input" id="aiName" type="text"
                 placeholder="${t('name_field')}" autocomplete="nickname"
                 onkeydown="if(event.key==='Enter')window.Auth._register()">
          <input class="auth-input" id="aiEmail" type="email"
                 placeholder="${t('email_field')}" autocomplete="email"
                 onkeydown="if(event.key==='Enter')window.Auth._register()">
          <input class="auth-input" id="aiPass" type="password"
                 placeholder="${t('password_field')}" autocomplete="new-password"
                 onkeydown="if(event.key==='Enter')window.Auth._register()">
          <button class="auth-btn" id="registerBtn"
                  onclick="window.Auth._register()">${t('register')}</button>
          <div class="auth-divider">or</div>
          <button class="auth-google" id="googleBtn"
                  onclick="window.Auth._googleLogin()">
            ${_gIcon()} ${t('google_login')}
          </button>`;
      },

      // ── Sign-in actions ──────────────────────────────────
      async _login() {
        const email = document.getElementById('aiEmail')?.value.trim();
        const pass  = document.getElementById('aiPass')?.value;
        if (!email || !pass) { _setErr(t('auth_fill_both')); return; }
        _setErr('');
        _setBusy('loginBtn', true);
        try {
          await signInWithEmailAndPassword(_auth, email, pass);
        } catch (e) {
          _setErr(_friendlyError(e.code));
          _setBusy('loginBtn', false);
        }
      },

      async _register() {
        const name  = document.getElementById('aiName')?.value.trim() || '';
        const email = document.getElementById('aiEmail')?.value.trim();
        const pass  = document.getElementById('aiPass')?.value;
        if (!email || !pass) { _setErr(t('auth_fill_both')); return; }
        if (pass.length < 6) { _setErr(t('auth_pw_short')); return; }
        _setErr('');
        _setBusy('registerBtn', true);
        try {
          const cred = await createUserWithEmailAndPassword(_auth, email, pass);
          if (name) await updateProfile(cred.user, { displayName: name });
          await this._createUserDoc(cred.user, name || email);
          // onAuthStateChanged → _onSignIn
        } catch (e) {
          _setErr(_friendlyError(e.code));
          _setBusy('registerBtn', false);
        }
      },

      async _googleLogin() {
        _setErr('');
        _setBusy('googleBtn', true);
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        try {
          const cred = await signInWithPopup(_auth, provider);
          await this._handleGoogleCred(cred);
        } catch (e) {
          _setErr(_friendlyError(e.code));
          _setBusy('googleBtn', false);
        }
      },

      async _handleGoogleCred(cred) {
        const ref  = doc(_db, 'users', cred.user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await this._createUserDoc(cred.user, cred.user.displayName || cred.user.email);
        }
        // onAuthStateChanged will call _onSignIn
      },

      async _createUserDoc(user, displayName) {
        await setDoc(doc(_db, 'users', user.uid), {
          displayName: displayName || user.email,
          email:    user.email,
          points:   0,
          streak:   0,
          coupons:  [],
          subjects: JSON.parse(JSON.stringify(DEFAULT_SUBJECTS)),
          history:  {},
          settings: {},
          notionToken: '',
          notionDbId:  '',
          createdAt: new Date().toISOString(),
        });
      },

      // ── Firestore ──────────────────────────────────────────
      async _loadUserData(uid) {
        try {
          const snap = await getDoc(doc(_db, 'users', uid));
          if (!snap.exists()) return;
          const d = snap.data();
          if (d.subjects?.length) S.subjects    = d.subjects;
          if (d.points   != null) S.points      = d.points;
          if (d.streak   != null) S.streak      = d.streak;
          if (d.history)          S.history     = d.history;
          if (d.coupons)          S.coupons     = d.coupons;
          if (d.settings)         Object.assign(S, d.settings);
          if (d.notionToken)      S.notionToken = d.notionToken;
          if (d.notionDbId)       S.notionDbId  = d.notionDbId;
          saveLocal();
        } catch (e) { console.warn('Firestore load:', e.message); }
      },

      async saveUserData() {
        if (!this.user) return;
        try {
          await updateDoc(doc(_db, 'users', this.user.uid), {
            subjects:    S.subjects,
            points:      S.points,
            streak:      S.streak,
            history:     S.history,
            coupons:     S.coupons,
            notionToken: S.notionToken || '',
            notionDbId:  S.notionDbId  || '',
            settings: {
              notify:         S.notify,
              startTime:      S.startTime,
              remindBefore:   S.remindBefore,
              emailAddr:      S.emailAddr,
              discordWebhook: S.discordWebhook,
              themeBg:        S.themeBg || '',
            },
          });
        } catch (e) { console.warn('Firestore save:', e.message); }
      },

      // ── Avatar + Profile ────────────────────────────────────
      _updateAvatar() {
        const btn  = document.getElementById('userAvatar');
        const name = this.user?.displayName || this.user?.email || '?';
        if (btn) btn.textContent = name.charAt(0).toUpperCase();
      },

      openProfile() {
        document.getElementById('profileDrawer').classList.add('open');
        this._renderProfile();
      },

      closeProfile(e) {
        if (e.target === document.getElementById('profileDrawer'))
          document.getElementById('profileDrawer').classList.remove('open');
      },

      _renderProfile() {
        const u    = this.user;
        const name = u?.displayName || u?.email || 'User';
        const earned = Rewards.getEarned();
        const badges = Rewards.BADGES.filter(b => earned.has(b.id));
        document.getElementById('profileContent').innerHTML = `
          <div class="profile-avatar">${name.charAt(0).toUpperCase()}</div>
          <div class="profile-name">${name}</div>
          <div class="profile-email">${u?.email || ''}</div>
          <div class="profile-stat-row">
            <div class="ps-card"><div class="ps-num">${S.points}</div><div class="ps-lbl">${t('pts_lbl')}</div></div>
            <div class="ps-card"><div class="ps-num">${S.streak}</div><div class="ps-lbl">${t('stats_streak')}</div></div>
            <div class="ps-card"><div class="ps-num">${Object.keys(S.history).length}</div><div class="ps-lbl">${t('stats_total_days')}</div></div>
          </div>
          <p class="sec-label">${t('profile_badges')}</p>
          <div class="profile-badges">
            ${badges.map(b => `<div class="profile-badge" title="${b.name[I18n.lang]||b.name.zh}">${b.icon}</div>`).join('')
              || `<span style="font-size:13px;color:var(--text2)">—</span>`}
          </div>
          <button class="logout-btn" onclick="window.Auth._logout()">${t('profile_logout')}</button>`;
      },

      async _logout() {
        await signOut(_auth);
        document.getElementById('profileDrawer').classList.remove('open');
      },
    };

    window.Auth = FirebaseAuth;

    // Register _refreshAuthGate for i18n.js to call on lang switch
    window._refreshAuthGate = function() {
      if (document.getElementById('authGate')?.style.display !== 'none') {
        const isReg = document.getElementById('tabRegister')?.classList.contains('active');
        isReg ? FirebaseAuth.showRegister() : FirebaseAuth.showLogin();
      }
    };

    // Handle Google redirect result (for mobile / popup-blocked fallback)
    getRedirectResult(_auth)
      .then(result => { if (result?.user) FirebaseAuth._handleGoogleCred(result); })
      .catch(() => {});

    // Auth state observer
    onAuthStateChanged(_auth, user => {
      if (user) FirebaseAuth._onSignIn(user);
      else      FirebaseAuth._onSignOut();
    });

    // Show login immediately (don't wait for auth state)
    FirebaseAuth.showLogin();

  } // end if (_auth && _db)
} // end if config is real

// ── Helpers ───────────────────────────────────────────────────
function _setErr(msg) {
  const el = document.getElementById('authErr');
  if (el) el.textContent = msg;
}

function _setBusy(id, busy) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled    = busy;
  btn.style.opacity = busy ? '0.6' : '';
}

function _gIcon() {
  return `<svg width="18" height="18" viewBox="0 0 48 48" style="vertical-align:middle;margin-right:4px">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.3 0 24 0 14.7 0 6.7 5.4 2.8 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.6 37.4 46.5 31.4 46.5 24.5z"/>
    <path fill="#FBBC05" d="M10.6 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.1-6.1z"/>
    <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.8 2.2-6.2 0-11.5-3.5-13.4-8.8l-8.1 6.1C6.7 42.6 14.7 48 24 48z"/>
  </svg>`;
}

function _friendlyError(code) {
  const l = window.I18n?.lang || 'zh';
  const msgs = {
    'auth/invalid-email':         { zh:'邮箱格式不正确',                        ja:'メール形式エラー',                    en:'Invalid email format' },
    'auth/user-not-found':        { zh:'账号不存在，请先注册',                  ja:'アカウントが見つかりません',          en:'Account not found, register first' },
    'auth/wrong-password':        { zh:'密码错误，请重试',                       ja:'パスワードが違います',                en:'Incorrect password' },
    'auth/invalid-credential':    { zh:'邮箱或密码错误',                         ja:'メールまたはパスワードが違います',    en:'Invalid email or password' },
    'auth/email-already-in-use':  { zh:'该邮箱已注册，请直接登录',              ja:'すでに登録済みのメールです',          en:'Email already registered, please log in' },
    'auth/weak-password':         { zh:'密码至少需要6位',                        ja:'パスワードは6文字以上',               en:'Password must be 6+ characters' },
    'auth/popup-closed-by-user':  { zh:'登录窗口已关闭，请重试',                ja:'ウィンドウが閉じられました',          en:'Popup closed, please try again' },
    'auth/popup-blocked':         { zh:'弹窗被浏览器拦截，请允许弹窗后重试',    ja:'ポップアップをブロック中。許可してください', en:'Popup blocked — please allow popups and try again' },
    'auth/cancelled-popup-request':{ zh:'登录已取消，请重试',                   ja:'ログインがキャンセルされました',      en:'Login cancelled, please try again' },
    'auth/network-request-failed':{ zh:'网络错误，请检查连接',                  ja:'ネットワークエラー',                  en:'Network error, check connection' },
    'auth/too-many-requests':     { zh:'尝试次数过多，请稍后再试',              ja:'試行回数超過。後でお試しください',    en:'Too many attempts, try later' },
    'auth/operation-not-allowed': { zh:'Google 登录未启用，请联系管理员',       ja:'Google ログインが無効です',           en:'Google login not enabled' },
    'auth/invalid-action-code':   { zh:'操作无效，请刷新页面重试',              ja:'無効な操作です。リロードしてください', en:'Invalid action — please refresh and try again' },
    'auth/internal-error':        { zh:'内部错误，请刷新页面重试',              ja:'内部エラー。リロードしてください',    en:'Internal error — please refresh and try again' },
  };
  const entry = msgs[code];
  return entry ? (entry[l] || entry.en) : code;
}
