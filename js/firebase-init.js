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
        // Clear local-mode flag so Firebase auth takes priority on next reload
        localStorage.removeItem('ss_localEntered');
        // Show main UI immediately — don't block on Firestore load
        document.getElementById('authGate').style.display = 'none';
        document.getElementById('mainApp').style.display  = 'block';
        App.init();
        // AFTER App.init() — override the local '👤' with the Firebase avatar
        this._updateAvatar();
        // Load Firestore data in background (won't block UI)
        this._loadUserData(user.uid);
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
        const l = window.I18n?.lang || 'zh';
        const localLabel = { zh:'以本地模式进入（无需账号）', ja:'ローカルモードで入る', en:'Continue without account' }[l];
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
          </button>
          <button class="auth-local-btn" onclick="App.enterLocalMode()">👤 ${localLabel}</button>`;
      },

      showRegister() {
        const el = document.getElementById('tabLogin');
        const er = document.getElementById('tabRegister');
        if (el) { el.classList.remove('active'); el.textContent = t('login'); }
        if (er) { er.classList.add('active');    er.textContent = t('register'); }
        _setErr('');
        const l = window.I18n?.lang || 'zh';
        const localLabel = { zh:'以本地模式进入（无需账号）', ja:'ローカルモードで入る', en:'Continue without account' }[l];
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
          </button>
          <button class="auth-local-btn" onclick="App.enterLocalMode()">👤 ${localLabel}</button>`;
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
          // Auth succeeded — show loading while onAuthStateChanged fires
          const l = window.I18n?.lang || 'zh';
          document.getElementById('authForm').innerHTML =
            '<div style="text-align:center;padding:28px 0;color:var(--text2);font-size:15px">⏳ ' +
            ({zh:'正在登录…', ja:'ログイン中…', en:'Signing in…'}[l]) + '</div>';
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
          // Show loading while finishing account setup
          const l = window.I18n?.lang || 'zh';
          document.getElementById('authForm').innerHTML =
            '<div style="text-align:center;padding:28px 0;color:var(--text2);font-size:15px">⏳ ' +
            ({zh:'正在创建账号…', ja:'アカウント作成中…', en:'Creating account…'}[l]) + '</div>';
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
          // Popup completed — show loading while Firebase finalises auth
          const l = window.I18n?.lang || 'zh';
          document.getElementById('authForm').innerHTML =
            '<div style="text-align:center;padding:28px 0;color:var(--text2);font-size:15px">⏳ ' +
            ({zh:'正在登录…', ja:'ログイン中…', en:'Signing in…'}[l]) + '</div>';
          await this._handleGoogleCred(cred);
        } catch (e) {
          // Re-render form so user can try again
          this.showLogin();
          _setErr(_friendlyError(e.code));
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
          // Refresh UI so Firebase data (subjects, streak) replaces local data
          Subjects.render();
          document.getElementById('streakNum').textContent = S.streak;
          this._updateAvatar(); // keep Firebase avatar after UI refresh
          if (window.ThemeManager) ThemeManager.restore();
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

      // ── Avatar selection (shared with local mode) ──────────
      _setAvatar(val) {
        S.avatar = val;
        saveLocal();
        this._updateAvatar();
        this._renderProfile(); // re-render to update selected state
      },

      _uploadAvatar(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
          const img = new Image();
          img.onload = () => {
            const size = Math.min(img.width, img.height);
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 200;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2,
                          size, size, 0, 0, 200, 200);
            this._setAvatar(canvas.toDataURL('image/jpeg', 0.8));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      },

      // ── Avatar + Profile ────────────────────────────────────
      _updateAvatar() {
        const btn  = document.getElementById('userAvatar');
        if (!btn) return;
        if (S.avatar && S.avatar.length > 2) {
          btn.innerHTML = `<img src="${S.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
        } else if (S.avatar) {
          btn.textContent = S.avatar;
          btn.style.fontSize = '20px';
        } else {
          const name = this.user?.displayName || this.user?.email || '?';
          btn.textContent = name.charAt(0).toUpperCase();
          btn.style.fontSize = '';
        }
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
        const l    = window.I18n?.lang || 'zh';
        const earned = Rewards.getEarned();
        const badges = Rewards.BADGES.filter(b => earned.has(b.id));
        const avatarLabel = { zh:'头像', ja:'アバター', en:'Avatar' }[l] || '头像';
        const badgeLabel  = { zh:'徽章', ja:'バッジ',   en:'Badges' }[l] || '徽章';
        const uploadLabel = { zh:'📷 上传图片', ja:'📷 画像をアップロード', en:'📷 Upload Image' }[l];

        const badgesHtml = badges.map(b =>
          `<div class="profile-badge" title="${b.name[l]||b.name.zh}">${b.icon}</div>`
        ).join('') || `<span style="font-size:13px;color:var(--text2)">—</span>`;

        document.getElementById('profileContent').innerHTML = `
          <div class="profile-avatar">${name.charAt(0).toUpperCase()}</div>
          <div class="profile-name">${name}</div>
          <div class="profile-email">${u?.email || ''}</div>
          <div class="profile-panel-row">
            <button class="profile-panel-btn" onclick="_toggleProfilePanel('avatarPanel')">
              🖼 ${avatarLabel}
            </button>
            <button class="profile-panel-btn" onclick="_toggleProfilePanel('badgePanel')">
              🏅 ${badgeLabel}
            </button>
          </div>
          <div id="avatarPanel" class="profile-expand-panel">
            <div class="avatar-preset-grid">
              ${PRESET_AVATARS.map(a =>
                `<div class="avatar-opt ${S.avatar === a ? 'sel' : ''}"
                      onclick="Auth._setAvatar('${a}')">${a}</div>`
              ).join('')}
            </div>
            <label class="avatar-upload-btn">
              ${uploadLabel}
              <input type="file" accept="image/*" style="display:none"
                     onchange="Auth._uploadAvatar(this)">
            </label>
          </div>
          <div id="badgePanel" class="profile-expand-panel">
            <div class="profile-badges">${badgesHtml}</div>
          </div>
          <div class="profile-stat-row">
            <div class="ps-card"><div class="ps-num">${S.points}</div><div class="ps-lbl">${t('pts_lbl')}</div></div>
            <div class="ps-card"><div class="ps-num">${S.streak}</div><div class="ps-lbl">${t('stats_streak')}</div></div>
            <div class="ps-card"><div class="ps-num">${Object.keys(S.history).length}</div><div class="ps-lbl">${t('stats_total_days')}</div></div>
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
