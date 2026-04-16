/* theme.js — Background theme manager
   KEY RULES:
   - Themes apply only to #mainApp wrapper, NEVER to body — so landing.html is unaffected
   - bg_engine_1 is the built-in default (cosmic study scene)
   - Pixel-art topbar tint is updated by _applyTopbarTint() whenever theme changes
*/

const THEMES = [
  { id:'engine1',
    label:{zh:'宇宙学习室',ja:'コズミックスタジオ',en:'Cosmic Studio'},
    preview:'screenshots/bg_engine_1.jpg',
    previewStyle:'',
    dark: true,
    topbar:{ bg:'rgba(8,4,30,0.82)', border:'rgba(120,88,248,0.35)', accent:'#A78BFA', glow:'rgba(120,88,248,0.45)' },
    css:`#mainApp{background-image:url('screenshots/bg_engine_1.jpg');background-size:cover;background-attachment:fixed;background-position:center top;}` },

  { id:'default',
    label:{zh:'暖白默认',ja:'デフォルト',en:'Default'},
    previewStyle:'background:linear-gradient(135deg,#FFF9F2 0%,#FFE8D6 100%)',
    dark: false,
    topbar:{ bg:'rgba(255,249,242,0.92)', border:'rgba(255,107,53,0.2)', accent:'#FF6B35', glow:'transparent' },
    css:'' },

  { id:'dusk',
    label:{zh:'暮色深蓝',ja:'たそがれ',en:'Dusk'},
    previewStyle:'background:linear-gradient(160deg,#1a1a2e 0%,#16213e 40%,#0f3460 80%,#533483 100%)',
    dark: true,
    topbar:{ bg:'rgba(10,10,30,0.88)', border:'rgba(83,52,131,0.5)', accent:'#9B6DFF', glow:'rgba(83,52,131,0.4)' },
    css:`#mainApp{background:linear-gradient(160deg,#1a1a2e 0%,#16213e 40%,#0f3460 80%,#533483 100%);background-attachment:fixed;}` },

  { id:'mint',
    label:{zh:'薄荷绿',ja:'ミント',en:'Mint'},
    previewStyle:'background:linear-gradient(135deg,#e0f7e9 0%,#b2dfdb 100%)',
    dark: false,
    topbar:{ bg:'rgba(224,247,233,0.92)', border:'rgba(82,201,122,0.3)', accent:'#52C97A', glow:'transparent' },
    css:`#mainApp{background:linear-gradient(135deg,#e0f7e9 0%,#b2dfdb 100%);background-attachment:fixed;}` },

  { id:'sakura',
    label:{zh:'樱花粉',ja:'さくら',en:'Sakura'},
    previewStyle:'background:linear-gradient(135deg,#fce4ec 0%,#f8bbd0 50%,#f48fb1 100%)',
    dark: false,
    topbar:{ bg:'rgba(252,228,236,0.92)', border:'rgba(244,143,177,0.35)', accent:'#E91E8C', glow:'transparent' },
    css:`#mainApp{background:linear-gradient(135deg,#fce4ec 0%,#f8bbd0 50%,#f48fb1 100%);background-attachment:fixed;}` },

  { id:'paw1',
    label:{zh:'宇宙猫爪 I',ja:'宇宙の肉球 I',en:'Cosmic Paw I'},
    preview:'images/bg-paw1.png', previewStyle:'',
    dark: false,
    topbar:{ bg:'rgba(255,249,242,0.90)', border:'rgba(255,107,53,0.25)', accent:'#FF6B35', glow:'transparent' },
    css:`#mainApp{background-image:url('images/bg-paw1.png');background-size:cover;background-attachment:fixed;background-position:center;}` },

  { id:'paw2',
    label:{zh:'宇宙猫爪 II',ja:'宇宙の肉球 II',en:'Cosmic Paw II'},
    preview:'images/bg-paw2.png', previewStyle:'',
    dark: false,
    topbar:{ bg:'rgba(255,249,242,0.90)', border:'rgba(255,107,53,0.25)', accent:'#FF6B35', glow:'transparent' },
    css:`#mainApp{background-image:url('images/bg-paw2.png');background-size:cover;background-attachment:fixed;background-position:center;}` },
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
    const cur = S.themeBg || 'engine1';
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
    this._applyCSS(id);
    this._applyTopbarTint(id);
    showToast(t('theme_saved'));
    this._renderGrid();
    this.closeModal(); // close immediately — delay was intercepting home-button clicks
  },

  // Apply theme CSS to #mainApp only (body is untouched → landing.html is safe)
  _applyCSS(id) {
    const theme = THEMES.find(t => t.id === id) || THEMES[0];
    document.getElementById('themeStyleEl')?.remove();

    // Toggle dark-mode class on #mainApp (not body) for text contrast
    const appEl = document.getElementById('mainApp');
    if (appEl) appEl.classList.toggle('theme-dark', !!theme.dark);

    if (!theme.css) return; // 'default' → no extra CSS needed

    const style = document.createElement('style');
    style.id = 'themeStyleEl';

    let extra = '';
    if (theme.dark) {
      extra = `
        #mainApp .card,#mainApp .subject-item,#mainApp .rep-card,#mainApp .day-panel,
        #mainApp .stat-card,#mainApp .chart-wrap,#mainApp .rew-item,#mainApp .time-card
          {background:rgba(255,255,255,.08)!important;border-color:rgba(255,255,255,.12)!important}
        #mainApp .tab{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.15);color:#ccc}
        #mainApp .tab.active{background:var(--accent);color:#fff}`;
    } else {
      extra = `
        #mainApp .card,#mainApp .subject-item,#mainApp .rep-card,#mainApp .day-panel,
        #mainApp .stat-card,#mainApp .chart-wrap,#mainApp .rew-item,#mainApp .time-card
          {background:rgba(255,255,255,.88)!important;backdrop-filter:blur(8px)}`;
    }

    style.textContent = theme.css + extra;
    document.head.appendChild(style);
  },

  // Update pixel topbar colours to match the active theme
  _applyTopbarTint(id) {
    const theme = THEMES.find(t => t.id === id) || THEMES[0];
    const tb = theme.topbar || THEMES[0].topbar;
    const root = document.documentElement;
    root.style.setProperty('--topbar-bg',     tb.bg);
    root.style.setProperty('--topbar-border', tb.border);
    root.style.setProperty('--topbar-accent', tb.accent);
    root.style.setProperty('--topbar-glow',   tb.glow);
  },

  restore() {
    const id = S.themeBg || 'engine1';
    this._applyCSS(id);
    this._applyTopbarTint(id);
  },
};

window.ThemeManager = ThemeManager;
