/* app.js — Main entry point, local-mode Auth stub, page routing
   Key fix: _localAuthUI() now uses t() for all strings — fully language-aware.
   Language switching on the auth gate instantly re-renders the form in new lang.
*/

const PRESET_AVATARS = ['🐱','🐶','🐼','🦊','🐸','🐯','🦁','🐨','🐻','🐰',
                        '🦄','🐙','🦋','🐬','🌟','🚀'];

// ── Local-mode Auth stub ──────────────────────────────────────
// (overwritten by firebase-init.js when Firebase is configured)
const Auth = {
  user: null,
  showLogin()    { _localAuthUI('login'); },
  showRegister() { _localAuthUI('register'); },
  openProfile()  { _localProfile(); },
  closeProfile(e) {
    if (e.target === document.getElementById('profileDrawer'))
      document.getElementById('profileDrawer').classList.remove('open');
  },
  async saveUserData() {},
  _logout() {
    localStorage.removeItem('ss_localEntered');
    S.avatar = null;
    saveLocal();
    location.reload();
  },
  _setAvatar(val) {
    S.avatar = val;
    saveLocal();
    _updateLocalAvatar();
    _localProfile();
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
        Auth._setAvatar(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },
};
window.Auth = Auth;

function _updateLocalAvatar() {
  const btn = document.getElementById('userAvatar');
  if (!btn) return;
  if (S.avatar && S.avatar.length > 2) {
    btn.innerHTML = `<img src="${S.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
  } else if (S.avatar) {
    btn.textContent = S.avatar;
    btn.style.fontSize = '20px';
  } else {
    btn.textContent = '👤';
    btn.style.fontSize = '16px';
  }
}

// ── Local auth UI — FULLY i18n: all strings use t() ──────────
function _localAuthUI(mode) {
  document.getElementById('authErr').textContent = '';
  const isReg = mode === 'register';

  // Update tab active state
  document.getElementById('tabLogin')?.classList.toggle('active', !isReg);
  document.getElementById('tabRegister')?.classList.toggle('active', isReg);

  // Update tab text in current language
  const tabLogin    = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  if (tabLogin)    tabLogin.textContent    = t('login');
  if (tabRegister) tabRegister.textContent = t('register');

  // Auth title
  const authTitle = document.getElementById('authTitle');
  if (authTitle) authTitle.textContent = t('appTitle');

  // Build form in current language
  const localModeNotice = {
    zh: '⚠️ Firebase 尚未配置，当前以<b>本地模式</b>运行',
    ja: '⚠️ Firebase 未設定。<b>ローカルモード</b>で実行中',
    en: '⚠️ Firebase not configured — running in <b>local mode</b>',
  };
  const enterBtnText = {
    zh: '进入学习星球',
    ja: 'スタディプラネットへ',
    en: 'Enter Study Planet',
  };
  const logoutLocalText = {
    zh: '退出本地模式',
    ja: 'ローカルモードを終了',
    en: 'Exit Local Mode',
  };

  const l = (window.I18n?.lang) || 'zh';

  document.getElementById('authForm').innerHTML = `
    <div class="auth-local-notice">
      ${localModeNotice[l] || localModeNotice.zh}
    </div>
    <input class="auth-input" id="aiName" type="text"
           placeholder="${t('name_field')}">
    <button class="auth-btn" onclick="App.startLocalMode()">
      ${enterBtnText[l] || enterBtnText.zh}
    </button>`;
}

// Called when language changes on auth gate
window._refreshAuthGate = function() {
  const gate = document.getElementById('authGate');
  const app  = document.getElementById('mainApp');
  // Only refresh if auth gate is visible (not logged in yet)
  if (gate && gate.style.display !== 'none') {
    // Check which tab is active
    const isReg = document.getElementById('tabRegister')?.classList.contains('active');
    // If firebase auth is loaded, use its showLogin/showRegister
    if (window.Auth && window.Auth._firebased) {
      isReg ? window.Auth.showRegister() : window.Auth.showLogin();
    } else {
      _localAuthUI(isReg ? 'register' : 'login');
    }
  }
};

function _localProfile() {
  const drawer = document.getElementById('profileDrawer');
  drawer.classList.add('open');
  const l    = (window.I18n?.lang) || 'zh';
  const name = S._localName || { zh:'本地用户', ja:'ローカルユーザー', en:'Local User' }[l];

  const localModeLabel = { zh:'本地模式',          ja:'ローカルモード',         en:'Local Mode' }[l];
  const avatarBtnLabel = { zh:'头像',               ja:'アバター',               en:'Avatar'     }[l];
  const badgeBtnLabel  = { zh:'徽章',               ja:'バッジ',                 en:'Badges'     }[l];
  const uploadLabel    = { zh:'📷 上传图片',         ja:'📷 画像をアップロード',   en:'📷 Upload'  }[l];
  const logoutLabel    = { zh:'退出本地模式',        ja:'ローカルモードを終了',     en:'Exit Local' }[l];

  const avatarHtml = S.avatar
    ? (S.avatar.length > 2
        ? `<img src="${S.avatar}" class="profile-avatar-img">`
        : `<div class="profile-avatar" style="font-size:40px">${S.avatar}</div>`)
    : `<div class="profile-avatar">${name.charAt(0).toUpperCase()}</div>`;

  const badgesHtml = [...Rewards.getEarned()].map(id => {
    const b = Rewards.BADGES.find(x => x.id === id);
    return b ? `<div class="profile-badge" title="${b.name[l]||b.name.zh}">${b.icon}</div>` : '';
  }).join('') || `<span style="font-size:13px;color:var(--text2)">—</span>`;

  document.getElementById('profileContent').innerHTML = `
    ${avatarHtml}
    <div class="profile-name">${name}</div>
    <div class="profile-email" style="margin-bottom:16px;color:var(--text2)">${localModeLabel}</div>
    <div class="profile-panel-row">
      <button class="profile-panel-btn" onclick="_toggleProfilePanel('avatarPanel')">
        🖼 ${avatarBtnLabel}
      </button>
      <button class="profile-panel-btn" onclick="_toggleProfilePanel('badgePanel')">
        🏅 ${badgeBtnLabel}
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
    <button class="logout-btn" onclick="Auth._logout()">${logoutLabel}</button>`;
}

// Toggle avatar / badge panels in profile drawer (used by both local & Firebase profile)
function _toggleProfilePanel(id) {
  const avatarPanel = document.getElementById('avatarPanel');
  const badgePanel  = document.getElementById('badgePanel');
  if (!avatarPanel || !badgePanel) return;
  if (id === 'avatarPanel') {
    const opening = !avatarPanel.classList.contains('open');
    avatarPanel.classList.toggle('open', opening);
    badgePanel.classList.remove('open');
  } else {
    const opening = !badgePanel.classList.contains('open');
    badgePanel.classList.toggle('open', opening);
    avatarPanel.classList.remove('open');
  }
}

// ── App controller ────────────────────────────────────────────
const App = {
  currentPage: 'subjects',

  init() {
    loadLocal();
    Subjects.render();
    Remind.syncUI();
    I18n.updateSelects();
    document.getElementById('streakNum').textContent = S.streak;
    _updateLocalAvatar();
    Remind.scheduleBanner();
    // Restore background theme
    if (window.ThemeManager) ThemeManager.restore();
  },

  startLocalMode() {
    const nameEl = document.getElementById('aiName');
    const l = (window.I18n?.lang) || 'zh';
    const defaultName = { zh:'本地用户', ja:'ローカルユーザー', en:'Local User' }[l];
    if (nameEl) S._localName = nameEl.value.trim() || defaultName;
    localStorage.setItem('ss_localEntered', '1');
    document.getElementById('authGate').style.display = 'none';
    document.getElementById('mainApp').style.display  = 'block';
    this.init();
  },

  showPage(name, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
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

// ── Startup ───────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Always show auth gate — never auto-skip.
  // firebase-init.js will overwrite authForm with the real login UI once ready.
  document.getElementById('authForm').innerHTML =
    '<div style="text-align:center;padding:28px 0;color:var(--text2);font-size:15px">⏳ 正在连接…</div>';
});

// Fallback: if Firebase SDK hasn't loaded after 6s, show the local-mode button
setTimeout(() => {
  const gate = document.getElementById('authGate');
  const app  = document.getElementById('mainApp');
  if (gate?.style.display !== 'none' && app?.style.display === 'none') {
    if (!window.Auth?._firebased) {
      // Firebase never loaded (offline / misconfigured) — show local mode entry
      _localAuthUI('login');
    }
  }
}, 6000);

// Quick-enter local mode (called from the button in Firebase login form)
App.enterLocalMode = function() {
  const l = (window.I18n?.lang) || 'zh';
  if (!S._localName) {
    loadLocal();
    if (!S._localName) S._localName = { zh:'本地用户', ja:'ローカルユーザー', en:'Local User' }[l];
  }
  localStorage.setItem('ss_localEntered', '1');
  document.getElementById('authGate').style.display = 'none';
  document.getElementById('mainApp').style.display  = 'block';
  App.init();
};
