/* theme.js — Background theme manager
   Allows switching between default and uploaded cosmic background images.
   Images are served from the /images/ directory next to the app.
*/

const THEMES = [
  {
    id: 'default',
    label: { zh: '默认', ja: 'デフォルト', en: 'Default' },
    preview: null, // CSS gradient preview
    previewStyle: 'background: linear-gradient(135deg, #FFF9F2 0%, #FFE8D6 100%)',
    css: '',
  },
  {
    id: 'paw1',
    label: { zh: '宇宙猫爪 I', ja: '宇宙の肉球 I', en: 'Cosmic Paw I' },
    preview: 'images/bg-paw1.png',
    previewStyle: '',
    css: `background-image: url('images/bg-paw1.png'); background-size: cover; background-attachment: fixed; background-position: center;`,
  },
  {
    id: 'paw2',
    label: { zh: '宇宙猫爪 II', ja: '宇宙の肉球 II', en: 'Cosmic Paw II' },
    preview: 'images/bg-paw2.png',
    previewStyle: '',
    css: `background-image: url('images/bg-paw2.png'); background-size: cover; background-attachment: fixed; background-position: center;`,
  },
  {
    id: 'dusk',
    label: { zh: '暮色渐变', ja: 'たそがれ', en: 'Dusk' },
    preview: null,
    previewStyle: 'background: linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 80%, #533483 100%)',
    css: `background: linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 80%, #533483 100%); background-attachment: fixed;`,
  },
  {
    id: 'mint',
    label: { zh: '薄荷绿', ja: 'ミント', en: 'Mint' },
    preview: null,
    previewStyle: 'background: linear-gradient(135deg, #e0f7e9 0%, #b2dfdb 100%)',
    css: `background: linear-gradient(135deg, #e0f7e9 0%, #b2dfdb 100%); background-attachment: fixed;`,
  },
  {
    id: 'sakura',
    label: { zh: '樱花粉', ja: 'さくら', en: 'Sakura' },
    preview: null,
    previewStyle: 'background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #f48fb1 100%)',
    css: `background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #f48fb1 100%); background-attachment: fixed;`,
  },
];

const ThemeManager = {
  open() {
    const modal = document.getElementById('themeModal');
    if (modal) {
      this._renderGrid();
      modal.classList.add('open');
    }
  },

  closeModal(e) {
    const modal = document.getElementById('themeModal');
    if (!e || e.target === modal || !e.target)
      modal?.classList.remove('open');
  },

  _renderGrid() {
    const grid = document.getElementById('themeGrid');
    if (!grid) return;
    const cur = S.themeBg || 'default';
    grid.innerHTML = THEMES.map(th => {
      const label = th.label[I18n.lang] || th.label.zh;
      const previewContent = th.preview
        ? `<img src="${th.preview}" style="width:100%;height:100%;object-fit:cover;border-radius:10px">`
        : `<div style="width:100%;height:100%;border-radius:10px;${th.previewStyle}"></div>`;
      return `
        <div class="theme-item ${cur === th.id ? 'selected' : ''}"
             onclick="ThemeManager.apply('${th.id}')">
          <div class="theme-preview">${previewContent}</div>
          <div class="theme-label">${label}</div>
          ${cur === th.id ? '<div class="theme-check">✓</div>' : ''}
        </div>`;
    }).join('');
  },

  apply(id) {
    S.themeBg = id;
    saveLocal();
    if (window.Auth?.user) Auth.saveUserData();
    this._applyToBody(id);
    showToast(t('theme_saved'));
    this._renderGrid(); // refresh checkmark
    setTimeout(() => this.closeModal(), 600);
  },

  _applyToBody(id) {
    const theme = THEMES.find(t => t.id === id) || THEMES[0];
    // Remove existing theme styles
    const existing = document.getElementById('themeStyleEl');
    if (existing) existing.remove();

    if (!theme.css) {
      // Default — remove any applied background
      document.body.style.removeProperty('background-image');
      document.body.style.removeProperty('background');
      document.body.style.background = 'var(--bg)';

      // For dark themes, add text adjustments
      document.body.classList.remove('theme-dark');
      return;
    }

    // Inject as a style element for proper cascade
    const style = document.createElement('style');
    style.id = 'themeStyleEl';

    if (id === 'dusk') {
      // Dark theme — adjust card transparency
      style.textContent = `
        body { ${theme.css} color: #f0f0f0; }
        body.theme-dark .card, body.theme-dark .subject-item,
        body.theme-dark .rep-card, body.theme-dark .day-panel,
        body.theme-dark .stat-card, body.theme-dark .chart-wrap,
        body.theme-dark .rew-item, body.theme-dark .time-card {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.12) !important;
          color: #f0f0f0;
        }
        body.theme-dark .topbar, body.theme-dark .tabs, body.theme-dark .save-bar {
          background: rgba(10,10,30,0.7) !important;
          backdrop-filter: blur(10px);
        }
        body.theme-dark .tab { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.15); color: #ccc; }
        body.theme-dark .tab.active { background: var(--accent); color: #fff; }
        body.theme-dark .s-name, body.theme-dark .todo-name, body.theme-dark .ri-name { color: #f0f0f0; }
      `;
      document.body.classList.add('theme-dark');
    } else if (id === 'paw1' || id === 'paw2') {
      // Image background — semi-transparent cards
      style.textContent = `
        body { ${theme.css} }
        .card, .subject-item, .rep-card, .day-panel, .stat-card, .chart-wrap,
        .rew-item, .time-card, .pts-hero-wrap, .badge-item {
          background: rgba(255,255,255,0.85) !important;
          backdrop-filter: blur(8px);
        }
        .topbar, .tabs, .save-bar {
          background: rgba(255,249,242,0.88) !important;
          backdrop-filter: blur(12px);
        }
        .page { background: transparent !important; }
      `;
      document.body.classList.remove('theme-dark');
    } else {
      style.textContent = `body { ${theme.css} }`;
      document.body.classList.remove('theme-dark');
    }

    document.head.appendChild(style);
  },

  // Called on app init to restore saved theme
  restore() {
    if (S.themeBg && S.themeBg !== 'default') {
      this._applyToBody(S.themeBg);
    }
  },
};

window.ThemeManager = ThemeManager;
