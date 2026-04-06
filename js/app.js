/* app.js — Main entry point: page routing, save settings, local-mode fallback.
   Classic (non-module) script so App is a global accessible from onclick handlers.
   Firebase auth is handled in firebase-init.js (ES module, loaded after this). */

// ── Minimal Auth stub — replaced by firebase-init.js when Firebase is ready ──
// Allows the app to run in local/demo mode without Firebase credentials.
const Auth = {
  user: null,
  showLogin()    { _localAuthUI(); },
  showRegister() { _localAuthUI(); },
  openProfile()  { _localProfile(); },
  closeProfile(e){ if(e.target===document.getElementById('profileDrawer')) document.getElementById('profileDrawer').classList.remove('open'); },
  async saveUserData() {}, // no-op in local mode
};
window.Auth = Auth; // firebase-init.js will overwrite this

function _localAuthUI() {
  // Simple local PIN/name login shown when Firebase is not configured
  document.getElementById('authErr').textContent = '';
  document.getElementById('authForm').innerHTML = `
    <p style="font-size:13px;color:var(--text2);margin-bottom:12px;line-height:1.6">
      Firebase 尚未配置，当前以<b>本地模式</b>运行。<br>
      数据仅保存在此设备浏览器中。
    </p>
    <input class="auth-input" id="aiName" type="text" placeholder="请输入昵称（可选）">
    <button class="auth-btn" onclick="App.startLocalMode()">进入应用</button>`;
}

function _localProfile() {
  document.getElementById('profileDrawer').classList.add('open');
  document.getElementById('profileContent').innerHTML = `
    <div class="profile-avatar">👤</div>
    <div class="profile-name">${S._localName || '本地用户'}</div>
    <div class="profile-email" style="margin-bottom:20px">本地模式（未登录）</div>
    <div class="profile-stat-row">
      <div class="ps-card"><div class="ps-num">${S.points}</div><div class="ps-lbl">${t('pts_lbl')}</div></div>
      <div class="ps-card"><div class="ps-num">${S.streak}</div><div class="ps-lbl">${t('stats_streak')}</div></div>
      <div class="ps-card"><div class="ps-num">${Object.keys(S.history).length}</div><div class="ps-lbl">${t('stats_total_days')}</div></div>
    </div>
    <p class="sec-label">${t('profile_badges')}</p>
    <div class="profile-badges">
      ${[...Rewards.getEarned()].map(id => {
        const b = Rewards.BADGES.find(x => x.id === id);
        return b ? `<div class="profile-badge">${b.icon}</div>` : '';
      }).join('') || '<span style="font-size:13px;color:var(--text2)">—</span>'}
    </div>`;
}

// ── App controller ────────────────────────────────────────────
const App = {
  currentPage: 'subjects',
  _localMode: false,

  // Called by firebase-init.js after successful sign-in,
  // OR by startLocalMode() when Firebase is not configured.
  init() {
    loadLocal();
    Subjects.render();
    Remind.syncUI();
    I18n.updateSelects();
    document.getElementById('streakNum').textContent = S.streak;
    Remind.scheduleBanner();
  },

  // Enter app without Firebase (fallback)
  startLocalMode() {
    this._localMode = true;
    const nameEl = document.getElementById('aiName');
    if (nameEl) S._localName = nameEl.value.trim() || '本地用户';
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
    Cal.syncToday();           // Push subject list to today's calendar todo-items
    if (Auth.user) await Auth.saveUserData();
    showToast(t('save_ok'));
    Remind.scheduleBanner();
  },
};

// ── Fallback timer: if Firebase init doesn't call App.init within 3 s, go local ──
window.addEventListener('load', () => {
  setTimeout(() => {
    if (document.getElementById('mainApp').style.display === 'none') {
      console.warn('Firebase not ready after 3 s — switching to local mode.');
      App.startLocalMode();
    }
  }, 3000);
});
