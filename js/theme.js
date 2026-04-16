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
    topbar:{ bg:'rgba(10,18,58,0.90)', border:'rgba(60,120,240,0.40)', accent:'#5B9BFF', glow:'rgba(60,120,240,0.50)' },
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
    // Restore custom uploaded/AI bg if active
    const customBg = localStorage.getItem('ss_custom_bg');
    if (id === 'custom_upload' && customBg) this._setCustomBgCSS(customBg, false);
    const aiBg = localStorage.getItem('ss_ai_bg');
    if (id === 'ai_bg' && aiBg) this._setCustomBgCSS(aiBg, true);
    // Restore AI avatar
    const aiAvatar = localStorage.getItem('ss_ai_avatar');
    if (aiAvatar) this._setAvatarImg(aiAvatar);
  },

  // ── Set CSS for any custom background (upload or AI) ──
  _setCustomBgCSS(dataUrl, dark) {
    document.getElementById('themeStyleEl')?.remove();
    const appEl = document.getElementById('mainApp');
    if (appEl) appEl.classList.toggle('theme-dark', dark);
    const style = document.createElement('style');
    style.id = 'themeStyleEl';
    const extra = dark
      ? `#mainApp .card,#mainApp .subject-item,#mainApp .rep-card,#mainApp .day-panel,
         #mainApp .stat-card,#mainApp .chart-wrap,#mainApp .rew-item,#mainApp .time-card
           {background:rgba(255,255,255,.08)!important;border-color:rgba(255,255,255,.12)!important}
         #mainApp .tab{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.15);color:#ccc}
         #mainApp .tab.active{background:var(--accent);color:#fff}`
      : `#mainApp .card,#mainApp .subject-item,#mainApp .rep-card,#mainApp .day-panel,
         #mainApp .stat-card,#mainApp .chart-wrap,#mainApp .rew-item,#mainApp .time-card
           {background:rgba(255,255,255,.88)!important;backdrop-filter:blur(8px)}`;
    style.textContent = `#mainApp{background-image:url('${dataUrl}');background-size:cover;background-attachment:fixed;background-position:center;} ${extra}`;
    document.head.appendChild(style);
    // Topbar tint: use the current active theme's topbar (keep topbar color unchanged)
    const curTheme = THEMES.find(t => t.id === (S.themeBg || 'engine1')) || THEMES[0];
    this._applyTopbarTint(curTheme.id);
  },

  // ── PHOTO UPLOAD ──────────────────────────────────────────
  _handleUpload(input) {
    const file = input.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Center-crop to 16:9 (background ratio), then resize to max 1920px
        const TARGET_RATIO = 16 / 9;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        const srcRatio = img.width / img.height;
        if (srcRatio > TARGET_RATIO) {
          sw = Math.round(img.height * TARGET_RATIO);
          sx = Math.round((img.width - sw) / 2);
        } else if (srcRatio < TARGET_RATIO) {
          sh = Math.round(img.width / TARGET_RATIO);
          sy = Math.round((img.height - sh) / 2);
        }
        const MAX = 1920;
        let cw = sw, ch = sh;
        if (cw > MAX) { ch = Math.round(ch * MAX / cw); cw = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        this._previewUpload(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  _previewUpload(dataUrl) {
    this._pendingUploadDataUrl = dataUrl;
    const prev = document.getElementById('themeUploadPreview');
    if (prev) prev.innerHTML = `<img src="${dataUrl}" onclick="document.getElementById('themeBgUpload').click()" title="Click to change">`;
    const actions = document.getElementById('themeUploadActions');
    if (actions) actions.style.display = 'flex';
  },

  _applyUpload() {
    if (!this._pendingUploadDataUrl) return;
    localStorage.setItem('ss_custom_bg', this._pendingUploadDataUrl);
    S.themeBg = 'custom_upload';
    saveLocal();
    if (window.Auth?.user) Auth.saveUserData();
    // Detect if image is dark by sampling average brightness
    const isDark = this._isImageDark(this._pendingUploadDataUrl);
    // Custom upload topbar tint: purple/dark variant
    const root = document.documentElement;
    root.style.setProperty('--topbar-bg',     isDark ? 'rgba(8,4,30,0.85)' : 'rgba(255,249,242,0.90)');
    root.style.setProperty('--topbar-border', isDark ? 'rgba(120,88,248,0.40)' : 'rgba(200,150,255,0.30)');
    root.style.setProperty('--topbar-accent', isDark ? '#A78BFA' : '#7C3AED');
    root.style.setProperty('--topbar-glow',   isDark ? 'rgba(120,88,248,0.50)' : 'transparent');
    this._setCustomBgCSS(this._pendingUploadDataUrl, isDark);
    showToast('✅ 已应用自定义背景！');
    this.closeModal();
  },

  _isImageDark(dataUrl) {
    // Quick brightness check via small canvas sample
    try {
      const img = new Image(); img.src = dataUrl;
      const c = document.createElement('canvas'); c.width = 10; c.height = 10;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, 10, 10);
      const d = ctx.getImageData(0, 0, 10, 10).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
      return (sum / (d.length / 4)) < 128;
    } catch { return true; }
  },

  // ── AI BACKGROUND GENERATION ──────────────────────────────
  async _generateBg() {
    const promptInput = document.getElementById('bgPromptInput');
    const btn = document.getElementById('bgGenBtn');
    const btnText = document.getElementById('bgGenBtnText');
    const preview = document.getElementById('bgGenPreview');
    const prompt = promptInput?.value.trim() || 'cosmic library with floating books and neon galaxies, cinematic, 4K';

    btn.disabled = true;
    btnText.textContent = '⏳ 生成中…';

    try {
      const res = await fetch('/api/generate-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error('status ' + res.status);
      const { url, dataUrl } = await res.json();
      const imgSrc = dataUrl || url;
      if (!imgSrc) throw new Error('No image returned');

      // Store and show preview with apply button
      this._pendingAiBgUrl = imgSrc;
      preview.style.display = 'block';
      preview.innerHTML = `
        <img src="${imgSrc}" alt="AI Background">
        <button class="theme-ai-apply-btn" onclick="ThemeManager._applyAiBg()">✓ 应用此背景</button>`;
    } catch (err) {
      console.warn('BG gen error:', err);
      showToast('⚠️ 生成失败，请检查 API 配置');
    } finally {
      btn.disabled = false;
      btnText.textContent = '✨ 生成背景';
    }
  },

  _applyAiBg() {
    if (!this._pendingAiBgUrl) return;
    localStorage.setItem('ss_ai_bg', this._pendingAiBgUrl);
    S.themeBg = 'ai_bg';
    saveLocal();
    if (window.Auth?.user) Auth.saveUserData();
    const root = document.documentElement;
    root.style.setProperty('--topbar-bg',     'rgba(8,4,30,0.85)');
    root.style.setProperty('--topbar-border', 'rgba(120,88,248,0.40)');
    root.style.setProperty('--topbar-accent', '#A78BFA');
    root.style.setProperty('--topbar-glow',   'rgba(120,88,248,0.50)');
    this._setCustomBgCSS(this._pendingAiBgUrl, true);
    showToast('🤖 AI 背景已应用！');
    this.closeModal();
  },

  // ── AI AVATAR GENERATION ──────────────────────────────────
  async _generateAvatar() {
    const promptInput = document.getElementById('avatarPromptInput');
    const btn = document.getElementById('avatarGenBtn');
    const btnText = document.getElementById('avatarGenBtnText');
    const preview = document.getElementById('avatarGenPreview');
    const prompt = promptInput?.value.trim() || 'pixel art astronaut student avatar, chibi style, cute, space theme';

    btn.disabled = true;
    btnText.textContent = '⏳ 生成中…';

    try {
      const res = await fetch('/api/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error('status ' + res.status);
      const { url, dataUrl } = await res.json();
      const imgSrc = dataUrl || url;
      if (!imgSrc) throw new Error('No image returned');

      this._pendingAvatarUrl = imgSrc;
      preview.style.display = 'block';
      preview.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 12px">
          <img src="${imgSrc}" style="width:64px;height:64px;border-radius:8px;object-fit:cover;border:2px solid var(--accent)">
          <button class="theme-ai-apply-btn" style="position:static;margin-top:0" onclick="ThemeManager._applyAvatar()">✓ 使用此头像</button>
        </div>`;
    } catch (err) {
      console.warn('Avatar gen error:', err);
      showToast('⚠️ 生成失败，请检查 API 配置');
    } finally {
      btn.disabled = false;
      btnText.textContent = '🎭 生成头像';
    }
  },

  _applyAvatar() {
    if (!this._pendingAvatarUrl) return;
    localStorage.setItem('ss_ai_avatar', this._pendingAvatarUrl);
    this._setAvatarImg(this._pendingAvatarUrl);
    showToast('🎭 头像已更新！');
    this.closeModal();
  },

  _setAvatarImg(src) {
    const btn = document.getElementById('userAvatar');
    if (btn) {
      btn.textContent = '';
      // Remove old img if any
      btn.querySelectorAll('img').forEach(i => i.remove());
      const img = document.createElement('img');
      img.src = src; img.alt = 'avatar';
      btn.appendChild(img);
    }
  },
};

window.ThemeManager = ThemeManager;
