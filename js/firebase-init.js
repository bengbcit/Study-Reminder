/* firebase-init.js
   ES module: initializes Firebase then loads auth.js logic.
   Loaded LAST so all classic-script globals (App, Auth stub, etc.) exist first.
*/

import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, signInWithPopup,
         GoogleAuthProvider, signOut, updateProfile }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import FIREBASE_CONFIG from './firebase-config.js';

// ── Firebase setup ───────────────────────────────────────────
let _auth, _db;
let _firebaseOk = false;

try {
  const app = initializeApp(FIREBASE_CONFIG);
  _auth = getAuth(app);
  _db   = getFirestore(app);
  _firebaseOk = true;
} catch (e) {
  console.warn('Firebase init failed — running in local mode.', e.message);
  // Skip to local-only mode (App.localMode() handles this)
  App.startLocalMode();
}

if (_firebaseOk) {

// ── Auth object (overwrites the stub in app.js) ──────────────
const Auth = {
  user: null,

  // Called by onAuthStateChanged
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
    document.getElementById('mainApp').style.display  = 'none';
    document.getElementById('authGate').style.display = 'flex';
    this.showLogin();
  },

  // ── Gate UI ─────────────────────────────────────────────
  showLogin() {
    document.getElementById('tabLogin').classList.add('active');
    document.getElementById('tabRegister').classList.remove('active');
    document.getElementById('authErr').textContent = '';
    document.getElementById('authForm').innerHTML = `
      <input class="auth-input" id="aiEmail" type="email"
             placeholder="${t('email_field')}">
      <input class="auth-input" id="aiPass"  type="password"
             placeholder="${t('password_field')}">
      <button class="auth-btn" onclick="Auth._login()">${t('login')}</button>
      <div class="auth-divider">or</div>
      <button class="auth-google" onclick="Auth._googleLogin()">
        ${_googleIcon()} ${t('google_login')}
      </button>`;
  },

  showRegister() {
    document.getElementById('tabRegister').classList.add('active');
    document.getElementById('tabLogin').classList.remove('active');
    document.getElementById('authErr').textContent = '';
    document.getElementById('authForm').innerHTML = `
      <input class="auth-input" id="aiName"  type="text"
             placeholder="${t('name_field')}">
      <input class="auth-input" id="aiEmail" type="email"
             placeholder="${t('email_field')}">
      <input class="auth-input" id="aiPass"  type="password"
             placeholder="${t('password_field')}">
      <button class="auth-btn" onclick="Auth._register()">${t('register')}</button>
      <div class="auth-divider">or</div>
      <button class="auth-google" onclick="Auth._googleLogin()">
        ${_googleIcon()} ${t('google_login')}
      </button>`;
  },

  // ── Auth actions ─────────────────────────────────────────
  async _login() {
    const email = document.getElementById('aiEmail').value.trim();
    const pass  = document.getElementById('aiPass').value;
    try {
      await signInWithEmailAndPassword(_auth, email, pass);
    } catch (e) {
      document.getElementById('authErr').textContent = _friendlyError(e.code);
    }
  },

  async _register() {
    const name  = (document.getElementById('aiName')?.value || '').trim();
    const email = document.getElementById('aiEmail').value.trim();
    const pass  = document.getElementById('aiPass').value;
    try {
      const cred = await createUserWithEmailAndPassword(_auth, email, pass);
      if (name) await updateProfile(cred.user, { displayName: name });
      await this._createUserDoc(cred.user, name || email);
    } catch (e) {
      document.getElementById('authErr').textContent = _friendlyError(e.code);
    }
  },

  async _googleLogin() {
    const provider = new GoogleAuthProvider();
    try {
      const cred = await signInWithPopup(_auth, provider);
      const ref  = doc(_db, 'users', cred.user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await this._createUserDoc(cred.user, cred.user.displayName || cred.user.email);
      }
    } catch (e) {
      document.getElementById('authErr').textContent = _friendlyError(e.code);
    }
  },

  async _createUserDoc(user, displayName) {
    await setDoc(doc(_db, 'users', user.uid), {
      displayName,
      email:    user.email,
      points:   0,
      streak:   0,
      coupons:  [],
      subjects: JSON.parse(JSON.stringify(DEFAULT_SUBJECTS)),
      history:  {},
      settings: {},
      createdAt: new Date().toISOString(),
    });
  },

  // ── Firestore sync ───────────────────────────────────────
  async _loadUserData(uid) {
    try {
      const snap = await getDoc(doc(_db, 'users', uid));
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.subjects?.length) S.subjects = d.subjects;
      if (d.points   != null) S.points   = d.points;
      if (d.streak   != null) S.streak   = d.streak;
      if (d.history)          S.history  = d.history;
      if (d.coupons)          S.coupons  = d.coupons;
      if (d.settings)         Object.assign(S, d.settings);
      saveLocal();
    } catch (e) {
      console.warn('Firestore load failed, using local data.', e.message);
    }
  },

  async saveUserData() {
    if (!this.user) return;
    try {
      await updateDoc(doc(_db, 'users', this.user.uid), {
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
    } catch (e) {
      console.warn('Firestore save failed.', e.message);
    }
  },

  // ── Avatar ───────────────────────────────────────────────
  _updateAvatar() {
    const btn  = document.getElementById('userAvatar');
    if (!btn || !this.user) return;
    const name = this.user.displayName || this.user.email || '?';
    btn.textContent = name.charAt(0).toUpperCase();
  },

  // ── Profile drawer ───────────────────────────────────────
  openProfile() {
    if (!this.user) return;
    document.getElementById('profileDrawer').classList.add('open');
    this._renderProfile();
  },

  closeProfile(e) {
    if (e.target === document.getElementById('profileDrawer')) {
      document.getElementById('profileDrawer').classList.remove('open');
    }
  },

  _renderProfile() {
    const u       = this.user;
    const name    = u.displayName || u.email || 'User';
    const earned  = Rewards.getEarned();
    const badges  = Rewards.BADGES.filter(b => earned.has(b.id));
    const badgeHtml = badges.length
      ? badges.map(b =>
          `<div class="profile-badge" title="${b.name[I18n.lang]||b.name.zh}">${b.icon}</div>`
        ).join('')
      : `<span style="font-size:13px;color:var(--text2)">—</span>`;

    document.getElementById('profileContent').innerHTML = `
      <div class="profile-avatar">${name.charAt(0).toUpperCase()}</div>
      <div class="profile-name">${name}</div>
      <div class="profile-email">${u.email}</div>
      <div class="profile-stat-row">
        <div class="ps-card">
          <div class="ps-num">${S.points}</div>
          <div class="ps-lbl">${t('pts_lbl')}</div>
        </div>
        <div class="ps-card">
          <div class="ps-num">${S.streak}</div>
          <div class="ps-lbl">${t('stats_streak')}</div>
        </div>
        <div class="ps-card">
          <div class="ps-num">${Object.keys(S.history).length}</div>
          <div class="ps-lbl">${t('stats_total_days')}</div>
        </div>
      </div>
      <p class="sec-label">${t('profile_badges')}</p>
      <div class="profile-badges">${badgeHtml}</div>
      <button class="logout-btn" onclick="Auth._logout()">${t('profile_logout')}</button>`;
  },

  async _logout() {
    await signOut(_auth);
    document.getElementById('profileDrawer').classList.remove('open');
  },
};

// Expose globally so inline onclick handlers work
window.Auth = Auth;

// Start listening to auth state
onAuthStateChanged(_auth, user => {
  if (user) Auth._onSignIn(user);
  else      Auth._onSignOut();
});

} // end if (_firebaseOk)

// ── Helpers ──────────────────────────────────────────────────
function _googleIcon() {
  return `<svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.3 0 24 0 14.7 0 6.7 5.4 2.8 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.6 37.4 46.5 31.4 46.5 24.5z"/>
    <path fill="#FBBC05" d="M10.6 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.1-6.1z"/>
    <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.8 2.2-6.2 0-11.5-3.5-13.4-8.8l-8.1 6.1C6.7 42.6 14.7 48 24 48z"/>
  </svg>`;
}

function _friendlyError(code) {
  const map = {
    'auth/invalid-email':          '邮箱格式不正确',
    'auth/user-not-found':         '账号不存在',
    'auth/wrong-password':         '密码错误',
    'auth/email-already-in-use':   '该邮箱已注册',
    'auth/weak-password':          '密码至少需要6位',
    'auth/popup-closed-by-user':   '登录窗口被关闭，请重试',
    'auth/network-request-failed': '网络错误，请检查连接',
  };
  return map[code] || '登录失败，请重试';
}
