/* firebase-init.js — ES module loaded last.
   Fixes:
   - Google popup login (signInWithRedirect fallback for mobile/popup-blocked)
   - i18n error messages (language-aware)
   - All UI strings use t() helper
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

// If config still has placeholder values, do nothing (local fallback takes over)
if (FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
  console.info('Firebase not configured — local mode will activate.');
} else {
  let _auth, _db;
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    _auth = getAuth(app);
    _db = getFirestore(app);
  } catch (e) {
    console.warn('Firebase init error:', e.message);
  }

  if (_auth && _db) {

    const FirebaseAuth = {
      user: null,

      async _onSignIn(user) {
        this.user = user;
        await this._loadUserData(user.uid);
        document.getElementById('authGate').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        this._updateAvatar();
        App.init();
      },

      _onSignOut() {
        this.user = null;
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('authGate').style.display = 'flex';
        this.showLogin();
      },

      // ── Auth Gate UI ─────────────────────────────────────────
      showLogin() {
        document.getElementById('tabLogin').classList.add('active');
        document.getElementById('tabRegister').classList.remove('active');
        document.getElementById('authErr').textContent = '';
        document.getElementById('tabLogin').textContent = t('login');
        document.getElementById('tabRegister').textContent = t('register');
        document.getElementById('authForm').innerHTML = `
          <input class="auth-input" id="aiEmail" type="email"
                 placeholder="${t('email_field')}" autocomplete="email">
          <input class="auth-input" id="aiPass" type="password"
                 placeholder="${t('password_field')}" autocomplete="current-password">
          <button class="auth-btn" id="loginBtn" onclick="window.Auth._login()">${t('login')}</button>
          <div class="auth-divider">or</div>
          <button class="auth-google" id="googleBtn" onclick="window.Auth._googleLogin()">
            ${_gIcon()} ${t('google_login')}
          </button>`;
      },

      showRegister() {
        document.getElementById('tabRegister').classList.add('active');
        document.getElementById('tabLogin').classList.remove('active');
        document.getElementById('authErr').textContent = '';
        document.getElementById('tabLogin').textContent = t('login');
        document.getElementById('tabRegister').textContent = t('register');
        document.getElementById('authForm').innerHTML = `
          <input class="auth-input" id="aiName" type="text"
                 placeholder="${t('name_field')}" autocomplete="nickname">
          <input class="auth-input" id="aiEmail" type="email"
                 placeholder="${t('email_field')}" autocomplete="email">
          <input class="auth-input" id="aiPass" type="password"
                 placeholder="${t('password_field')}" autocomplete="new-password">
          <button class="auth-btn" id="registerBtn" onclick="window.Auth._register()">${t('register')}</button>
          <div class="auth-divider">or</div>
          <button class="auth-google" id="googleBtn" onclick="window.Auth._googleLogin()">
            ${_gIcon()} ${t('google_login')}
          </button>`;
      },

      // ── Sign-in actions ───────────────────────────────────────
      async _login() {
        const email = document.getElementById('aiEmail')?.value.trim();
        const pass  = document.getElementById('aiPass')?.value;
        if (!email || !pass) {
          _setErr(t('auth_fill_both'));
          return;
        }
        _setErr('');
        _setLoading('loginBtn', true);
        try {
          await signInWithEmailAndPassword(_auth, email, pass);
        } catch (e) {
          _setErr(_friendlyError(e.code));
          _setLoading('loginBtn', false);
        }
      },

      async _register() {
        const name  = document.getElementById('aiName')?.value.trim() || '';
        const email = document.getElementById('aiEmail')?.value.trim();
        const pass  = document.getElementById('aiPass')?.value;
        if (!email || !pass) {
          _setErr(t('auth_fill_both'));
          return;
        }
        if (pass.length < 6) {
          _setErr(t('auth_pw_short'));
          return;
        }
        _setErr('');
        _setLoading('registerBtn', true);
        try {
          const cred = await createUserWithEmailAndPassword(_auth, email, pass);
          if (name) await updateProfile(cred.user, { displayName: name });
          await this._createUserDoc(cred.user, name || email);
        } catch (e) {
          _setErr(_friendlyError(e.code));
          _setLoading('registerBtn', false);
        }
      },

      async _googleLogin() {
        _setErr('');
        _setLoading('googleBtn', true);
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        try {
          // Try popup first; fall back to redirect on mobile / popup-blocked
          const cred = await signInWithPopup(_auth, provider);
          await this._afterGoogle(cred);
        } catch (e) {
          if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user') {
            // Redirect fallback
            try {
              await signInWithRedirect(_auth, provider);
              // Result handled in onAuthStateChanged after redirect
            } catch (e2) {
              _setErr(_friendlyError(e2.code));
              _setLoading('googleBtn', false);
            }
          } else {
            _setErr(_friendlyError(e.code));
            _setLoading('googleBtn', false);
          }
        }
      },

      async _afterGoogle(cred) {
        try {
          const ref  = doc(_db, 'users', cred.user.uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await this._createUserDoc(cred.user, cred.user.displayName || cred.user.email);
          }
          // onAuthStateChanged will call _onSignIn
        } catch (e) {
          console.warn('afterGoogle error:', e.message);
        }
      },

      async _createUserDoc(user, displayName) {
        await setDoc(doc(_db, 'users', user.uid), {
          displayName: displayName || user.email,
          email: user.email,
          points: 0,
          streak: 0,
          coupons: [],
          subjects: JSON.parse(JSON.stringify(DEFAULT_SUBJECTS)),
          history: {},
          settings: {},
          notionToken: '',
          notionDbId: '',
          createdAt: new Date().toISOString(),
        });
      },

      // ── Firestore ─────────────────────────────────────────────
      async _loadUserData(uid) {
        try {
          const snap = await getDoc(doc(_db, 'users', uid));
          if (!snap.exists()) return;
          const d = snap.data();
          if (d.subjects?.length) S.subjects = d.subjects;
          if (d.points != null)   S.points   = d.points;
          if (d.streak != null)   S.streak   = d.streak;
          if (d.history)          S.history  = d.history;
          if (d.coupons)          S.coupons  = d.coupons;
          if (d.settings)         Object.assign(S, d.settings);
          // Notion settings
          if (d.notionToken)  S.notionToken  = d.notionToken;
          if (d.notionDbId)   S.notionDbId   = d.notionDbId;
          saveLocal();
        } catch (e) { console.warn('Firestore load:', e.message); }
      },

      async saveUserData() {
        if (!this.user) return;
        try {
          await updateDoc(doc(_db, 'users', this.user.uid), {
            subjects:     S.subjects,
            points:       S.points,
            streak:       S.streak,
            history:      S.history,
            coupons:      S.coupons,
            notionToken:  S.notionToken || '',
            notionDbId:   S.notionDbId  || '',
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

      // ── Avatar ────────────────────────────────────────────────
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

    // Expose globally
    window.Auth = FirebaseAuth;

    // Handle redirect result (Google login redirect fallback)
    getRedirectResult(_auth).then(result => {
      if (result?.user) FirebaseAuth._afterGoogle(result);
    }).catch(() => {});

    // Auth state listener
    onAuthStateChanged(_auth, user => {
      if (user) FirebaseAuth._onSignIn(user);
      else      FirebaseAuth._onSignOut();
    });

    // Show login form immediately
    FirebaseAuth.showLogin();

  } // end if (_auth && _db)
} // end if config is real

// ── Private helpers ───────────────────────────────────────────
function _setErr(msg) {
  const el = document.getElementById('authErr');
  if (el) el.textContent = msg;
}

function _setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) btn.style.opacity = '0.6';
  else         btn.style.opacity = '';
}

function _gIcon() {
  return `<svg width="18" height="18" viewBox="0 0 48 48" style="vertical-align:middle;margin-right:4px">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.3 0 24 0 14.7 0 6.7 5.4 2.8 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.6 37.4 46.5 31.4 46.5 24.5z"/>
    <path fill="#FBBC05" d="M10.6 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.1-6.1z"/>
    <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.8 2.2-6.2 0-11.5-3.5-13.4-8.8l-8.1 6.1C6.7 42.6 14.7 48 24 48z"/>
  </svg>`;
}

// Language-aware error messages
function _friendlyError(code) {
  const lang = (window.I18n?.lang) || 'zh';
  const msgs = {
    'auth/invalid-email': {
      zh: '邮箱格式不正确', ja: 'メール形式が正しくありません', en: 'Invalid email format'
    },
    'auth/user-not-found': {
      zh: '账号不存在，请先注册', ja: 'アカウントが見つかりません。先に登録してください', en: 'Account not found, please register first'
    },
    'auth/wrong-password': {
      zh: '密码错误，请重试', ja: 'パスワードが間違っています', en: 'Incorrect password, please try again'
    },
    'auth/invalid-credential': {
      zh: '邮箱或密码错误', ja: 'メールまたはパスワードが違います', en: 'Invalid email or password'
    },
    'auth/email-already-in-use': {
      zh: '该邮箱已注册，请直接登录', ja: 'このメールはすでに登録されています', en: 'Email already registered, please log in'
    },
    'auth/weak-password': {
      zh: '密码至少需要6位', ja: 'パスワードは6文字以上にしてください', en: 'Password must be at least 6 characters'
    },
    'auth/popup-closed-by-user': {
      zh: '登录窗口已关闭，请重试', ja: 'ログインウィンドウが閉じられました', en: 'Login window closed, please try again'
    },
    'auth/popup-blocked': {
      zh: '弹窗被拦截，正在尝试跳转登录…', ja: 'ポップアップがブロックされました。リダイレクト中…', en: 'Popup blocked, trying redirect login…'
    },
    'auth/network-request-failed': {
      zh: '网络错误，请检查连接', ja: 'ネットワークエラー。接続を確認してください', en: 'Network error, check your connection'
    },
    'auth/too-many-requests': {
      zh: '尝试次数过多，请稍后再试', ja: 'ログイン試行回数超過。後でもう一度お試しください', en: 'Too many attempts, please try again later'
    },
  };
  const entry = msgs[code];
  if (entry) return entry[lang] || entry.en;
  return `${code}`;
}
