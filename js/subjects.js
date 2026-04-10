/* subjects.js — Subject management: add, delete, toggle, inline duration edit */

const EMOJIS = ['📚','✏️','🔢','🐍','🎨','🎵','⚽','🌍','🔬','💻','📖','🗣️',
                 '🇬🇧','🇯🇵','🇨🇳','🧮','🎸','🏊','🧠','🌱','🎯','🔭'];
const COLORS  = ['#52C97A','#4A90D9','#9B6DFF','#FF6B35','#FFB300',
                  '#FF5252','#00BCD4','#E91E8C','#8BC34A','#FF7043'];

let _addState = { emoji: EMOJIS[0], color: COLORS[0] };

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
    this.render();
  },

  del(id) {
    if (!confirm('确定删除这个科目？')) return;
    S.subjects = S.subjects.filter(x => x.id !== id);
    saveLocal();
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
    this.closeAdd();
    this.render();
    showToast('✅ 已添加：' + nm);
  },
};
