/* calendar.js — Study calendar with daily todo-list view */

const Cal = {
  render() {
    this._renderGrid();
    this._renderDayPanel(S.selectedDay);
  },

  _renderGrid() {
    const yr  = S.calYear;
    const mo  = S.calMonth;
    const lbl = document.getElementById('calLabel');
    if (lbl) lbl.textContent = `${yr} ${t('months')[mo]}`;

    const grid = document.getElementById('calGrid');
    if (!grid) return;
    grid.innerHTML = '';

    // Day-of-week headers
    t('days').forEach(d => {
      const el = document.createElement('div');
      el.className = 'cdl';
      el.textContent = d;
      grid.appendChild(el);
    });

    const firstDay = new Date(yr, mo, 1).getDay();
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const todayStr = todayKey();

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      const e = document.createElement('div');
      e.className = 'cd empty';
      grid.appendChild(e);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${yr}-${pad(mo+1)}-${pad(d)}`;
      const rec = S.history[key];
      const el  = document.createElement('div');
      el.className = 'cd';
      el.textContent = d;

      if (key === todayStr) {
        el.classList.add('today');
      } else if (rec) {
        const enabledCount = S.subjects.filter(s => s.enabled).length;
        const doneCount    = Object.values(rec).filter(r => r.done).length;
        el.classList.add(doneCount >= enabledCount && enabledCount > 0 ? 'perfect' : 'has-data');
        const dot = document.createElement('div');
        dot.className = 'cdot';
        el.appendChild(dot);
      }

      if (S.selectedDay === key) el.classList.add('selected');

      el.onclick = () => {
        S.selectedDay = key;
        this.render();
      };
      grid.appendChild(el);
    }
  },

  // ── Day panel — todo list style ───────────────────────────
  _renderDayPanel(key) {
    const panel = document.getElementById('dayPanel');
    if (!panel) return;

    if (!key) {
      panel.innerHTML = '';
      return;
    }

    panel.style.display = 'block';
    const isToday = key === todayKey();
    const rec     = S.history[key] || {};

    // For today: show enabled subjects as interactive todo-list
    // For past days: show read-only history
    const subjects = isToday
      ? S.subjects.filter(s => s.enabled)
      : Object.values(rec).map(r => ({
          id: r.id || Object.keys(rec).find(k => rec[k] === r),
          name: r.subj, nameJa: r.subj, nameEn: r.subj,
          icon: r.icon, color: '#888', bg: '#f5f5f5',
          duration: 0, enabled: true,
        }));

    if (!subjects.length && !isToday) {
      panel.innerHTML = `
        <div class="day-panel">
          <div class="day-panel-title">📅 ${key}</div>
          <p style="font-size:13px;color:var(--text2)">${t('no_rec')}</p>
        </div>`;
      return;
    }

    const items = isToday
      ? subjects.map(s => {
          // Merge history + todayReport for today
          const h = S.history[key]?.[s.id] || {};
          const r = S.todayReport[s.id] || {};
          const done = r.done || h.done || false;
          const summary = r.summary || h.summary || '';
          return { s, done, summary, r };
        })
      : Object.entries(rec).map(([sid, r]) => ({
          s: { id: sid, name: r.subj, nameJa: r.subj, nameEn: r.subj,
               icon: r.icon, color: '#4A90D9', bg: '#EEF5FF', duration: 0 },
          done: r.done,
          summary: r.summary || '',
          r,
        }));

    const todoHtml = items.map(({ s, done, summary }) => `
      <div class="todo-item ${done ? 'done-item' : ''}">
        <div class="todo-icon">${s.icon}</div>
        <div class="todo-info">
          <div class="todo-name">${subjName(s)}</div>
          ${s.duration ? `<div class="todo-meta">${s.duration} ${t('dur_min')}</div>` : ''}
          ${summary ? `<div class="todo-summary">💬 ${summary}</div>` : ''}
        </div>
        ${isToday
          ? `<div class="todo-check ${done ? 'done' : ''}"
                  onclick="Cal._toggleTodo('${s.id}', this)">
               ${done ? '✓' : ''}
             </div>`
          : `<div style="font-size:20px">${done ? '✅' : '❌'}</div>`
        }
      </div>`).join('');

    panel.innerHTML = `
      <div class="day-panel">
        <div class="day-panel-title">
          📅 ${key}
          ${isToday ? `<span style="font-size:12px;color:var(--accent);margin-left:8px">${t('done_lbl')}</span>` : ''}
        </div>
        ${todoHtml || `<p style="font-size:13px;color:var(--text2)">${t('no_rec')}</p>`}
      </div>
      <div class="info-card" style="margin-top:0">
        ${t('cal_tip')}
      </div>`;
  },

  // Toggle todo-check for today's items directly from calendar
  _toggleTodo(id, el) {
    if (!S.todayReport[id]) S.todayReport[id] = {};
    S.todayReport[id].done = !S.todayReport[id].done;
    const item = el.closest('.todo-item');
    item.classList.toggle('done-item', S.todayReport[id].done);
    el.classList.toggle('done', S.todayReport[id].done);
    el.textContent = S.todayReport[id].done ? '✓' : '';

    // Save to history immediately
    const today = todayKey();
    if (!S.history[today]) S.history[today] = {};
    const subj = S.subjects.find(s => s.id === id);
    if (subj) {
      S.history[today][id] = {
        ...S.todayReport[id],
        subj: subj.name,
        icon: subj.icon,
      };
    }
    saveLocal();
    this._renderGrid(); // Refresh calendar dots
  },

  move(delta) {
    S.calMonth += delta;
    if (S.calMonth < 0)  { S.calMonth = 11; S.calYear--; }
    if (S.calMonth > 11) { S.calMonth = 0;  S.calYear++; }
    S.selectedDay = null;
    saveLocal();
    this.render();
    document.getElementById('dayPanel').innerHTML = '';
  },

  // Called by App.saveSettings to push current subjects to today's calendar
  syncToday() {
    const today = todayKey();
    if (!S.history[today]) S.history[today] = {};
    // Add any enabled subjects not yet in history
    S.subjects.filter(s => s.enabled).forEach(s => {
      if (!S.history[today][s.id]) {
        S.history[today][s.id] = {
          subj: s.name, icon: s.icon, done: false, summary: '', hard: '', diff: 0,
        };
      }
    });
    saveLocal();
    this.render();
  },
};
