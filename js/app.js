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
  openProfile()  {
    const menu = document.getElementById('userMenu');
    if (!menu) return;
    if (menu.classList.contains('open')) { menu.classList.remove('open'); return; }
    const l = window.I18n?.lang || 'zh';
    const name     = S._localName || { zh:'本地用户', ja:'ローカルユーザー', en:'Local User' }[l];
    const subLabel = { zh:'本地模式', ja:'ローカルモード', en:'Local Mode' }[l];
    const emailLabel   = { zh:'登录邮箱账号', ja:'メールアカウントへ', en:'Sign in with Email' }[l];
    const logoutLabel  = { zh:'退出本地模式', ja:'ローカル終了', en:'Exit Local Mode' }[l];
    const profileLabel = { zh:'头像 / 徽章 / 奖券', ja:'アバター / バッジ', en:'Avatar & Badges' }[l];
    menu.innerHTML = `
      <div class="um-info">
        <div class="um-name">${name}</div>
        <div class="um-sub">${subLabel}</div>
      </div>
      <div class="um-divider"></div>
      <button class="um-item" onclick="window._openProfileDrawer()">
        🖼 ${profileLabel}
      </button>
      <button class="um-item" onclick="App.switchToEmailAccount();document.getElementById('userMenu').classList.remove('open')">
        📧 ${emailLabel}
      </button>
      <button class="um-item um-danger" onclick="App.exitLocalMode()">
        🚪 ${logoutLabel}
      </button>`;
    menu.classList.add('open');
  },
  closeProfile() {},  // kept for backward compat
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

// ── FirebaseSync / State compatibility stubs ──────────────────
// Some AI-generated or older modules may call these globals.
// Proxy them safely to Auth.saveUserData() so they never throw.
window.FirebaseSync = {
  push:  () => window.Auth?.saveUserData?.(),
  sync:  () => window.Auth?.saveUserData?.(),
  save:  () => window.Auth?.saveUserData?.(),
};
window.State = {
  toCloud: () => window.Auth?.saveUserData?.(),
  save:    () => { saveLocal(); window.Auth?.saveUserData?.(); },
  get:     () => S,
};

function _updateLocalAvatar() {
  const btn = document.getElementById('userAvatar');
  if (!btn) return;
  // Local-mode only — firebase-init.js calls _updateAvatar() to override this for Firebase users
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
  // Local-mode only — Firebase users use Auth._renderProfile() from firebase-init.js
  const drawer = document.getElementById('profileDrawer');
  drawer.classList.add('open');
  const l    = (window.I18n?.lang) || 'zh';
  const name = S._localName || { zh:'本地用户', ja:'ローカルユーザー', en:'Local User' }[l];

  const localModeLabel = { zh:'本地模式',    ja:'ローカルモード',       en:'Local Mode' }[l];
  const avatarBtnLabel = { zh:'头像',         ja:'アバター',             en:'Avatar'     }[l];
  const badgeBtnLabel  = { zh:'徽章',         ja:'バッジ',               en:'Badges'     }[l];
  const couponBtnLabel = { zh:'奖券',         ja:'クーポン',             en:'Coupons'    }[l];
  const uploadLabel    = { zh:'📷 上传图片',   ja:'📷 画像をアップロード', en:'📷 Upload'  }[l];
  const logoutLabel    = { zh:'退出本地模式',  ja:'ローカルモードを終了',   en:'Exit Local' }[l];
  const switchLabel    = { zh:'切换账号',      ja:'アカウント切替',         en:'Switch Account' }[l];
  const emailLoginLabel = { zh:'📧 登录邮箱账号', ja:'📧 メールアカウントへ', en:'📧 Sign in with Email' }[l];

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
      <button class="profile-panel-btn" onclick="_toggleProfilePanel('couponPanel')">
        🎫 ${couponBtnLabel}
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
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
        <div style="font-size:12px;color:var(--text2);margin-bottom:8px">${switchLabel}</div>
        <button class="psa-btn" onclick="App.switchToEmailAccount()">${emailLoginLabel}</button>
      </div>
    </div>
    <div id="badgePanel" class="profile-expand-panel">
      <div class="profile-badges">${badgesHtml}</div>
    </div>
    <div id="couponPanel" class="profile-expand-panel">
      ${S.coupons.length === 0
        ? `<span style="font-size:13px;color:var(--text2)">—</span>`
        : S.coupons.map((c, idx) => `
          <div class="profile-coupon-mini" onclick="Rewards.openCoupon(${idx})"
               style="background:${c.gradient};color:${c.text}">
            <span class="pcm-icon">${c.icon}</span>
            <span class="pcm-name">${c.name}</span>
            ${c.used ? '<span class="pcm-used">✓ used</span>' : ''}
          </div>`).join('')
      }
    </div>
    <div class="profile-stat-row">
      <div class="ps-card"><div class="ps-num">${S.points}</div><div class="ps-lbl">${t('pts_lbl')}</div></div>
      <div class="ps-card"><div class="ps-num">${S.streak}</div><div class="ps-lbl">${t('stats_streak')}</div></div>
      <div class="ps-card"><div class="ps-num">${Object.keys(S.history).length}</div><div class="ps-lbl">${t('stats_total_days')}</div></div>
    </div>
    <button class="logout-btn" onclick="App.exitLocalMode()">${logoutLabel}</button>`;
}

// Open the full profile drawer (avatar / badge / coupon detail)
window._openProfileDrawer = function() {
  document.getElementById('userMenu')?.classList.remove('open');
  if (window.Auth?._firebased && window.Auth.user) {
    document.getElementById('profileDrawer').classList.add('open');
    window.Auth._renderProfile();
  } else {
    _localProfile(); // handles drawer open + render for local mode
  }
};

// Toggle avatar / badge / coupon panels in profile drawer
function _toggleProfilePanel(id) {
  const panels = ['avatarPanel', 'badgePanel', 'couponPanel']
    .map(pid => document.getElementById(pid)).filter(Boolean);
  const target  = document.getElementById(id);
  if (!target) return;
  const wasOpen = target.classList.contains('open');
  panels.forEach(p => p.classList.remove('open'));
  if (!wasOpen) target.classList.add('open');
}

// ── App controller ────────────────────────────────────────────
const App = {
  currentPage: 'subjects',

  init() {
    loadLocal();
    // Apply saved language before first render so all text is in the right language
    I18n.set(I18n.lang);
    Remind.syncUI();
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

  // ── Account switching ────────────────────────────────────
  switchToLocalAccount() {
    document.getElementById('profileDrawer').classList.remove('open');
    if (window.Auth?._firebased && window.Auth.user) {
      window.Auth._logout(); // signs out Firebase → onAuthStateChanged → shows gate
    }
    // Already in local mode — nothing to do
  },

  switchToEmailAccount() {
    document.getElementById('profileDrawer').classList.remove('open');
    localStorage.removeItem('ss_localEntered');
    document.getElementById('mainApp').style.display  = 'none';
    document.getElementById('authGate').style.display = 'flex';
    window.Auth.showLogin();
  },

  addNewAccount() {
    document.getElementById('profileDrawer').classList.remove('open');
    localStorage.removeItem('ss_localEntered');
    document.getElementById('mainApp').style.display  = 'none';
    document.getElementById('authGate').style.display = 'flex';
    window.Auth.showRegister();
  },

  // ── Exit local mode (handles all cases) ──────────────────
  exitLocalMode() {
    document.getElementById('profileDrawer').classList.remove('open');
    localStorage.removeItem('ss_localEntered');
    // If Firebase is active with a real session, sign out properly
    // signOut → onAuthStateChanged → _onSignOut hides mainApp automatically
    if (window.Auth?._firebased && window.Auth.user) {
      window.Auth._logout();
      return;
    }
    // No Firebase session (local mode bypass) — manually show auth gate
    document.getElementById('mainApp').style.display  = 'none';
    document.getElementById('authGate').style.display = 'flex';
    if (window.Auth?._firebased) {
      window.Auth.showLogin();
    } else {
      _localAuthUI('login');
    }
  },
};

// ── Startup ───────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Apply saved language immediately so auth-gate buttons + connecting message
  // are already in the user's preferred language.
  const savedLang = localStorage.getItem('ss_lang');
  if (savedLang && ['zh','ja','en'].includes(savedLang)) {
    // Update language toggle button active states without triggering a full render
    document.querySelectorAll('.lb').forEach(b => {
      const map = { zh:'中', ja:'日', en:'EN' };
      b.classList.toggle('active', b.textContent.trim() === map[savedLang]);
    });
    document.documentElement.lang = savedLang;
  }
  // Always show auth gate — never auto-skip.
  // firebase-init.js will overwrite authForm with the real login UI once ready.
  const l = I18n.lang;
  const connectMsg = { zh:'正在连接…', ja:'接続中…', en:'Connecting…' }[l] || '正在连接…';
  document.getElementById('authForm').innerHTML =
    `<div style="text-align:center;padding:28px 0;color:var(--text2);font-size:15px">⏳ ${connectMsg}</div>`;
});

// Fallback: if Firebase SDK hasn't loaded after 12s, show network error + local mode
setTimeout(() => {
  const gate = document.getElementById('authGate');
  const app  = document.getElementById('mainApp');
  if (gate?.style.display !== 'none' && app?.style.display === 'none') {
    if (!window.Auth?._firebased) {
      // Firebase never loaded — show error with retry and local mode option
      const l = (window.I18n?.lang) || 'zh';
      const notice = {
        zh: '⚠️ 连接服务器失败，请检查网络后刷新页面，或以本地模式继续。',
        ja: '⚠️ サーバーに接続できません。ネットワークを確認してリロードするか、ローカルモードで続行してください。',
        en: '⚠️ Could not connect to server. Check your network and refresh, or continue in local mode.',
      }[l];
      const reloadBtn = { zh:'🔄 刷新重试', ja:'🔄 再読み込み', en:'🔄 Refresh' }[l];
      const localBtn  = { zh:'👤 本地模式', ja:'👤 ローカルモード', en:'👤 Local Mode' }[l];
      document.getElementById('authForm').innerHTML = `
        <div class="auth-local-notice">${notice}</div>
        <button class="auth-btn" onclick="location.reload()">${reloadBtn}</button>
        <div class="auth-divider">or</div>
        <button class="auth-local-btn" onclick="App.startLocalMode()">${localBtn}</button>`;
    }
  }
}, 12000);

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
