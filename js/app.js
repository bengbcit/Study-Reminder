/* app.js — Main entry point: page routing, save settings, local-mode fallback.
   Classic (non-module) script so App/Auth/etc. are globals for onclick handlers.
   Firebase auth is handled by firebase-init.js (ES module, loaded after this). */

// ── Auth stub — firebase-init.js overwrites this with real Firebase Auth ────
// Used when Firebase is not configured; shows a simple name-entry screen.
const Auth = {
  user: null,
  showLogin()    { _localAuthUI('login'); },
  showRegister() { _localAuthUI('register'); },
  openProfile()  { _localProfile(); },
  closeProfile(e){
    if (e.target === document.getElementById('profileDrawer'))
      document.getElementById('profileDrawer').classList.remove('open');
  },
  async saveUserData() {}, // no-op in local mode
  _logout() {
    // In local mode, just reload to show the gate again
    localStorage.removeItem('ss_localEntered');
    location.reload();
  },
};
window.Auth = Auth;

function _localAuthUI(mode) {
  document.getElementById('authErr').textContent = '';
  const isRegister = mode === 'register';
  document.getElementById('tabLogin').classList.toggle('active', !isRegister);
  document.getElementById('tabRegister').classList.toggle('active', isRegister);
  document.getElementById('authForm').innerHTML = `
    <div style="background:#FFF8E1;border:1.5px solid #FFD54F;border-radius:12px;
                padding:12px 14px;margin-bottom:14px;font-size:13px;color:#F57F17;line-height:1.6">
      <b>⚠️ Firebase 尚未配置</b><br>
      当前以本地模式运行，数据仅保存在此设备浏览器中。
    </div>
    <input class="auth-input" id="aiName" type="text"
           placeholder="请输入昵称（可选）">
    <button class="auth-btn" onclick="App.startLocalMode()">
      进入应用（本地模式）
    </button>`;
}

function _localProfile() {
  document.getElementById('profileDrawer').classList.add('open');
  document.getElementById('profileContent').innerHTML = `
    <div class="profile-avatar">👤</div>
    <div class="profile-name">${S._localName || '本地用户'}</div>
    <div class="profile-email" style="margin-bottom:20px;color:var(--text2)">
      本地模式 — 未连接 Firebase
    </div>
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
    <div class="profile-badges">
      ${[...Rewards.getEarned()].map(id => {
          const b = Rewards.BADGES.find(x => x.id === id);
          return b ? `<div class="profile-badge" title="${b.name.zh}">${b.icon}</div>` : '';
        }).join('') || '<span style="font-size:13px;color:var(--text2)">—</span>'}
    </div>
    <button class="logout-btn" onclick="Auth._logout()">退出（清除本地会话）</button>`;
}

// ── App controller ────────────────────────────────────────────
const App = {
  currentPage: 'subjects',

  // Called after sign-in (Firebase or local)
  init() {
    loadLocal();
    Subjects.render();
    Remind.syncUI();
    I18n.updateSelects();
    document.getElementById('streakNum').textContent = S.streak;
    Remind.scheduleBanner();
  },

  // Enter in local mode (no Firebase)
  startLocalMode() {
    const nameEl = document.getElementById('aiName');
    if (nameEl) S._localName = nameEl.value.trim() || '本地用户';
    localStorage.setItem('ss_localEntered', '1');
    document.getElementById('authGate').style.display = 'none';
    document.getElementById('mainApp').style.display  = 'block';
    this.init();
  },

  showPage(name, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(b  => b.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    btn.classList.add('active');
    this.currentPage = name;
    switch (name) {
      case 'report':   Report.render();  break;
      case 'calendar': Cal.render();     break;
      case 'stats':    Stats.render();   break;
      case 'rewards':  Rewards.render(); break;
      case 'timer':    Timer.render();   break;
    }
  },

  async saveSettings() {
    Remind.readUI();
    saveLocal();
    Cal.syncToday();
    if (Auth.user) await Auth.saveUserData();
    showToast(t('save_ok'));
    Remind.scheduleBanner();
  },
};

// ── Page load: show the auth gate then wait for Firebase ─────
window.addEventListener('DOMContentLoaded', () => {
  // If user previously chose local mode in this session, skip gate
  if (localStorage.getItem('ss_localEntered')) {
    document.getElementById('authGate').style.display = 'none';
    document.getElementById('mainApp').style.display  = 'block';
    App.init();
    return;
  }
  // Show gate with local-mode UI as default (firebase-init.js will replace it
  // with real login form if Firebase is configured)
  _localAuthUI('login');
});

// ── Safety fallback: if Firebase takes > 4 s, activate local mode UI ────────
// (Does NOT auto-enter — user still has to click the button)
setTimeout(() => {
  const gate = document.getElementById('authGate');
  const app  = document.getElementById('mainApp');
  if (gate && gate.style.display !== 'none' && app && app.style.display === 'none') {
    console.info('Firebase not ready after 4 s. Local mode UI active.');
    _localAuthUI('login');
  }
}, 4000);
