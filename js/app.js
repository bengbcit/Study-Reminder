/* app.js — Main entry point, local-mode Auth stub, page routing */

// ── Auth stub (overwritten by firebase-init.js if Firebase is configured) ───
const PRESET_AVATARS = ['🐱','🐶','🐼','🦊','🐸','🐯','🦁','🐨','🐻','🐰',
                        '🦄','🐙','🦋','🐬','🌟','🚀'];

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
        ctx.drawImage(img, (img.width-size)/2, (img.height-size)/2,
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
    // base64 image
    btn.innerHTML = `<img src="${S.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
  } else if (S.avatar) {
    // emoji
    btn.textContent = S.avatar;
    btn.style.fontSize = '20px';
  } else {
    btn.textContent = '👤';
    btn.style.fontSize = '16px';
  }
}

function _localAuthUI(mode) {
  document.getElementById('authErr').textContent = '';
  const isReg = mode === 'register';
  ['tabLogin','tabRegister'].forEach(id => {
    document.getElementById(id)?.classList.toggle('active',
      id === (isReg ? 'tabRegister' : 'tabLogin'));
  });
  document.getElementById('authForm').innerHTML = `
    <div class="auth-local-notice">
      ⚠️ Firebase 尚未配置，当前以<b>本地模式</b>运行
    </div>
    <input class="auth-input" id="aiName" type="text" placeholder="请输入昵称（可选）">
    <button class="auth-btn" onclick="App.startLocalMode()">进入学习星球</button>`;
}

function _localProfile() {
  const drawer = document.getElementById('profileDrawer');
  drawer.classList.add('open');
  const name = S._localName || '本地用户';
  const avatarHtml = S.avatar
    ? (S.avatar.length > 2
        ? `<img src="${S.avatar}" class="profile-avatar-img">`
        : `<div class="profile-avatar" style="font-size:40px">${S.avatar}</div>`)
    : `<div class="profile-avatar">${name.charAt(0).toUpperCase()}</div>`;

  document.getElementById('profileContent').innerHTML = `
    ${avatarHtml}
    <div class="profile-name">${name}</div>
    <div class="profile-email" style="margin-bottom:16px;color:var(--text2)">本地模式</div>
    <div class="avatar-section">
      <p class="sec-label">更换头像</p>
      <div class="avatar-preset-grid">
        ${PRESET_AVATARS.map(a =>
          `<div class="avatar-opt ${S.avatar===a?'sel':''}"
                onclick="Auth._setAvatar('${a}')">${a}</div>`
        ).join('')}
      </div>
      <label class="avatar-upload-btn">
        📷 上传图片
        <input type="file" accept="image/*" style="display:none"
               onchange="Auth._uploadAvatar(this)">
      </label>
    </div>
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
    </div>
    <button class="logout-btn" onclick="Auth._logout()">退出本地模式</button>`;
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
    if (window.ThemeManager) ThemeManager.restore();
  },

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
    if (window.ThemeManager) ThemeManager.restore();
  },
};

// ── Startup ───────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('ss_localEntered')) {
    document.getElementById('authGate').style.display = 'none';
    document.getElementById('mainApp').style.display  = 'block';
    App.init();
    return;
  }
  _localAuthUI('login');
});

// Safety fallback: if Firebase hasn't signed anyone in after 5s, keep local UI
// but do NOT auto-enter the app — user must click the button
setTimeout(() => {
  const gate = document.getElementById('authGate');
  const app  = document.getElementById('mainApp');
  if (gate?.style.display !== 'none' && app?.style.display === 'none') {
    _localAuthUI('login');
  }
}, 5000);
