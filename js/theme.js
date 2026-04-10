/* theme.js — Background theme manager */

const THEMES = [
  { id:'default', label:{zh:'默认',ja:'デフォルト',en:'Default'},
    previewStyle:'background:linear-gradient(135deg,#FFF9F2 0%,#FFE8D6 100%)', css:'' },
  { id:'paw1', label:{zh:'宇宙猫爪 I',ja:'宇宙の肉球 I',en:'Cosmic Paw I'},
    preview:'images/bg-paw1.png', previewStyle:'', 
    css:`background-image:url('images/bg-paw1.png');background-size:cover;background-attachment:fixed;background-position:center;` },
  { id:'paw2', label:{zh:'宇宙猫爪 II',ja:'宇宙の肉球 II',en:'Cosmic Paw II'},
    preview:'images/bg-paw2.png', previewStyle:'',
    css:`background-image:url('images/bg-paw2.png');background-size:cover;background-attachment:fixed;background-position:center;` },
  { id:'dusk', label:{zh:'暮色深蓝',ja:'たそがれ',en:'Dusk'},
    previewStyle:'background:linear-gradient(160deg,#1a1a2e 0%,#16213e 40%,#0f3460 80%,#533483 100%)',
    css:`background:linear-gradient(160deg,#1a1a2e 0%,#16213e 40%,#0f3460 80%,#533483 100%);background-attachment:fixed;` },
  { id:'mint', label:{zh:'薄荷绿',ja:'ミント',en:'Mint'},
    previewStyle:'background:linear-gradient(135deg,#e0f7e9 0%,#b2dfdb 100%)',
    css:`background:linear-gradient(135deg,#e0f7e9 0%,#b2dfdb 100%);background-attachment:fixed;` },
  { id:'sakura', label:{zh:'樱花粉',ja:'さくら',en:'Sakura'},
    previewStyle:'background:linear-gradient(135deg,#fce4ec 0%,#f8bbd0 50%,#f48fb1 100%)',
    css:`background:linear-gradient(135deg,#fce4ec 0%,#f8bbd0 50%,#f48fb1 100%);background-attachment:fixed;` },
];

const ThemeManager = {
  open() {
    this._renderGrid();
    document.getElementById('themeModal')?.classList.add('open');
  },
  closeModal(e) {
    const modal = document.getElementById('themeModal');
    if (!e || e.target === modal) modal?.classList.remove('open');
  },
  _renderGrid() {
    const grid = document.getElementById('themeGrid');
    if (!grid) return;
    const cur = S.themeBg || 'default';
    grid.innerHTML = THEMES.map(th => {
      const label   = th.label[I18n.lang] || th.label.zh;
      const preview = th.preview
        ? `<img src="${th.preview}" style="width:100%;height:100%;object-fit:cover;border-radius:12px 12px 0 0">`
        : `<div style="width:100%;height:100%;${th.previewStyle};border-radius:12px 12px 0 0"></div>`;
      return `<div class="theme-item ${cur===th.id?'selected':''}" onclick="ThemeManager.apply('${th.id}')">
        <div class="theme-preview">${preview}</div>
        <div class="theme-label">${label}</div>
        ${cur===th.id?'<div class="theme-check">✓</div>':''}
      </div>`;
    }).join('');
  },
  apply(id) {
    S.themeBg = id;
    saveLocal();
    if (window.Auth?.user) Auth.saveUserData();
    this._applyToBody(id);
    showToast(t('theme_saved'));
    this._renderGrid();
    setTimeout(() => this.closeModal(), 500);
  },
  _applyToBody(id) {
    const theme = THEMES.find(t => t.id === id) || THEMES[0];
    document.getElementById('themeStyleEl')?.remove();
    if (!theme.css) {
      document.body.style.cssText = '';
      document.body.classList.remove('theme-dark');
      return;
    }
    const style = document.createElement('style');
    style.id = 'themeStyleEl';
    if (id === 'dusk') {
      document.body.classList.add('theme-dark');
      style.textContent = `body{${theme.css}}
        .topbar,.tabs,.save-bar{background:rgba(10,10,30,.8)!important;backdrop-filter:blur(10px)}
        .card,.subject-item,.rep-card,.day-panel,.stat-card,.chart-wrap,.rew-item,.time-card{background:rgba(255,255,255,.09)!important;border-color:rgba(255,255,255,.12)!important}
        .tab{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.15);color:#ccc}
        .tab.active{background:var(--accent);color:#fff}`;
    } else if (id==='paw1'||id==='paw2') {
      document.body.classList.remove('theme-dark');
      style.textContent = `body{${theme.css}}
        .card,.subject-item,.rep-card,.day-panel,.stat-card,.chart-wrap,.rew-item,.time-card{background:rgba(255,255,255,.88)!important;backdrop-filter:blur(8px)}
        .topbar,.tabs,.save-bar{background:rgba(255,249,242,.9)!important;backdrop-filter:blur(12px)}`;
    } else {
      document.body.classList.remove('theme-dark');
      style.textContent = `body{${theme.css}}`;
    }
    document.head.appendChild(style);
  },
  restore() {
    if (S.themeBg && S.themeBg !== 'default') this._applyToBody(S.themeBg);
  },
};
window.ThemeManager = ThemeManager;
