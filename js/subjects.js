/* subjects.js — Subject management: add, delete, toggle, inline duration edit, edit */

const EMOJIS = ['📚','✏️','🔢','🐍','🎨','🎵','⚽','🌍','🔬','💻','📖','🗣️',
                 '🇬🇧','🇯🇵','🇨🇳','🧮','🎸','🏊','🧠','🌱','🎯','🔭'];
const COLORS  = ['#52C97A','#4A90D9','#9B6DFF','#FF6B35','#FFB300',
                  '#FF5252','#00BCD4','#E91E8C','#8BC34A','#FF7043'];
const BG_COLORS = ['#FFF3E0','#E8F5E9','#E3F2FD','#F3E5F5','#FBE9E7',
                   '#E0F7FA','#FFFDE7','#FCE4EC','#F1F8E9','#EDE7F6',
                   '#FFFFFF','#F5F5F5','#FFF9C4','#B2DFDB','#BBDEFB'];

let _addState  = { emoji: EMOJIS[0], color: COLORS[0] };
let _editState = { id: null, emoji: EMOJIS[0], color: COLORS[0], bg: BG_COLORS[0] };

const Subjects = {
  render() {
    const el = document.getElementById('subjectList');
    if (!el) return;
    el.innerHTML = '';
    S.subjects.forEach(s => {
      const nm = subjName(s);
      const div = document.createElement('div');
      div.className = 'subject-item';
      if (s.enabled) {
        div.style.background  = s.bg;
        div.style.borderColor = s.color;
      }
      div.innerHTML = `
        <div class="s-left">
          <div class="s-icon" style="background:${s.bg}">${s.icon}</div>
          <div>
            <div class="s-name">${nm}</div>
            <div class="s-dur-row">
              <button class="dur-adj" onclick="Subjects.adjDur('${s.id}',-5)">−</button>
              <span class="dur-val" id="durVal_${s.id}">${s.duration}</span>
              <span class="dur-unit">${t('dur_min')}</span>
              <button class="dur-adj" onclick="Subjects.adjDur('${s.id}',+5)">＋</button>
            </div>
          </div>
        </div>
        <div class="s-right">
          <button class="edit-btn" onclick="Subjects.openEdit('${s.id}')">✏️</button>
          <button class="del-btn" onclick="Subjects.del('${s.id}')">🗑</button>
          <button class="tog" style="background:${s.enabled ? s.color : '#ddd'}"
                  onclick="Subjects.toggle('${s.id}')">
            <div class="tok" style="left:${s.enabled ? '22px' : '3px'}"></div>
          </button>
        </div>`;
      el.appendChild(div);
    });
  },

  // Adjust duration by delta, clamp 5–300, auto-save
  adjDur(id, delta) {
    const s = S.subjects.find(x => x.id === id);
    if (!s) return;
    s.duration = Math.min(300, Math.max(5, (s.duration || 30) + delta));
    const el = document.getElementById('durVal_' + id);
    if (el) el.textContent = s.duration;
    saveLocal();
  },

  toggle(id) {
    const s = S.subjects.find(x => x.id === id);
    if (s) s.enabled = !s.enabled;
    saveLocal();
    if (window.Auth?.user) Auth.saveUserData();
    this.render();
  },

  del(id) {
    if (!confirm('确定删除这个科目？')) return;
    S.subjects = S.subjects.filter(x => x.id !== id);
    saveLocal();
    if (window.Auth?.user) Auth.saveUserData();
    this.render();
  },

  // ── Add modal ──────────────────────────────────────────────
  openAdd() {
    _addState = { emoji: EMOJIS[0], color: COLORS[0] };
    document.getElementById('newName').value = '';
    document.getElementById('newDur').value  = 30;
    this._renderEmojiGrid();
    this._renderColorGrid();
    document.getElementById('addModal').classList.add('open');
  },

  closeAdd() { document.getElementById('addModal').classList.remove('open'); },

  bgClose(e) {
    if (e.target === document.getElementById('addModal')) this.closeAdd();
  },

  _renderEmojiGrid() {
    document.getElementById('emojiGrid').innerHTML = EMOJIS.map(em =>
      `<div class="eo ${em === _addState.emoji ? 'sel' : ''}"
            onclick="Subjects._pickEmoji('${em}')">${em}</div>`
    ).join('');
  },

  _renderColorGrid() {
    document.getElementById('colorGrid').innerHTML = COLORS.map(c =>
      `<div class="co ${c === _addState.color ? 'sel' : ''}" style="background:${c}"
            onclick="Subjects._pickColor('${c}')"></div>`
    ).join('');
  },

  _pickEmoji(em) { _addState.emoji = em; this._renderEmojiGrid(); },
  _pickColor(c)  { _addState.color = c;  this._renderColorGrid(); },

  confirmAdd() {
    const nm  = document.getElementById('newName').value.trim();
    if (!nm) { showToast('请输入科目名称'); return; }
    const dur = parseInt(document.getElementById('newDur').value) || 30;
    const bg  = _addState.color + '22';
    S.subjects.push({
      id: 's' + Date.now(),
      name: nm, nameJa: nm, nameEn: nm,
      icon: _addState.emoji, color: _addState.color, bg,
      enabled: true, duration: dur,
    });
    saveLocal();
    if (window.Auth?.user) Auth.saveUserData();
    this.closeAdd();
    this.render();
    showToast('✅ 已添加：' + nm);
  },

  // ── Edit modal ─────────────────────────────────────────────
  openEdit(id) {
    const s = S.subjects.find(x => x.id === id);
    if (!s) return;
    _editState = { id, emoji: s.icon, color: s.color, bg: s.bg || BG_COLORS[0] };
    document.getElementById('editName').value = s.name;
    this._renderEditEmojiGrid();
    this._renderEditColorGrid();
    this._renderEditBgColorGrid();
    document.getElementById('editModal').classList.add('open');
  },

  closeEdit() { document.getElementById('editModal').classList.remove('open'); },

  bgCloseEdit(e) {
    if (e.target === document.getElementById('editModal')) this.closeEdit();
  },

  _renderEditEmojiGrid() {
    document.getElementById('editEmojiGrid').innerHTML = EMOJIS.map(em =>
      `<div class="eo ${em === _editState.emoji ? 'sel' : ''}"
            onclick="Subjects._pickEditEmoji('${em}')">${em}</div>`
    ).join('');
  },

  _renderEditColorGrid() {
    document.getElementById('editColorGrid').innerHTML = COLORS.map(c =>
      `<div class="co ${c === _editState.color ? 'sel' : ''}" style="background:${c}"
            onclick="Subjects._pickEditColor('${c}')"></div>`
    ).join('');
  },

  _renderEditBgColorGrid() {
    document.getElementById('editBgGrid').innerHTML = BG_COLORS.map(c =>
      `<div class="bgco ${c === _editState.bg ? 'sel' : ''}" style="background:${c}"
            onclick="Subjects._pickEditBg('${c}')"></div>`
    ).join('');
  },

  _pickEditEmoji(em) { _editState.emoji = em; this._renderEditEmojiGrid(); },
  _pickEditColor(c)  { _editState.color = c;  this._renderEditColorGrid(); },
  _pickEditBg(c)     { _editState.bg    = c;  this._renderEditBgColorGrid(); },

  confirmEdit() {
    const s = S.subjects.find(x => x.id === _editState.id);
    if (!s) return;
    const nm = document.getElementById('editName').value.trim();
    if (!nm) { showToast('请输入科目名称'); return; }
    s.name  = nm;
    s.nameJa = nm;
    s.nameEn = nm;
    s.icon  = _editState.emoji;
    s.color = _editState.color;
    s.bg    = _editState.bg;
    saveLocal();
    if (window.Auth?.user) Auth.saveUserData();
    this.closeEdit();
    this.render();
    showToast('✅ 已更新');
  },
};

window.Subjects = Subjects;
