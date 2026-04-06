/* auth.js — Firebase Authentication (Email/Password + Google)
   This file uses ES modules; loaded as type="module" in index.html */

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
          this.updateAvatar();
          App.init();
        } else {
          this.user = null;
          this.showGate();
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
        </button>`;
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
        </button>`;
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
      if (!btn || !this.user) return;
      const name = this.user.displayName || this.user.email || '?';
      btn.textContent = name.charAt(0).toUpperCase();
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
      await signOut(auth);
      document.getElementById('profileDrawer').classList.remove('open');
    },
  };

  // Expose globally
  window.Auth = Auth;
  Auth.init();
});
