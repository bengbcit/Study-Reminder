/* timer.js — Focus countdown timer with subject selection + free duration edit */

const Timer = {
  selectedId: null,
  totalSecs:  0,
  remainSecs: 0,
  interval:   null,
  state:      'idle', // idle | running | paused | done
  customMins: null,   // user-overridden duration (null = use subject default)

  render() {
    const el = document.getElementById('timerView');
    if (!el) return;

    const enabled = S.subjects.filter(s => s.enabled);
    if (!enabled.length) {
      el.innerHTML = `<p style="text-align:center;color:var(--text2);padding:40px 0">
        ${t('lbl_sub')}…</p>`;
      return;
    }

    if (!this.selectedId || !enabled.find(s => s.id === this.selectedId)) {
      this.selectedId = enabled[0].id;
      this.customMins = null;
    }

    const subj    = enabled.find(s => s.id === this.selectedId);
    const effMins = this.customMins !== null ? this.customMins : subj.duration;

    if (this.state === 'idle') {
      this.totalSecs  = effMins * 60;
      this.remainSecs = this.totalSecs;
    }

    const pct  = this.totalSecs > 0
      ? Math.round(((this.totalSecs - this.remainSecs) / this.totalSecs) * 100) : 0;
    const mins = String(Math.floor(this.remainSecs / 60)).padStart(2, '0');
    const secs = String(this.remainSecs % 60).padStart(2, '0');
    const stateClass = this.state === 'running' ? 'running'
                     : this.state === 'done'    ? 'done' : '';

    el.innerHTML = `
      <div class="timer-wrap">
        <p class="sec-label">${t('timer_pick')}</p>

        <!-- Subject selector -->
        <div class="timer-subject-sel">
          ${enabled.map(s => `
            <button class="timer-subj-btn ${s.id === this.selectedId ? 'active' : ''}"
                    onclick="Timer._pick('${s.id}')"
                    style="${s.id === this.selectedId
                      ? `border-color:${s.color};background:${s.bg}` : ''}">
              <span style="font-size:20px">${s.icon}</span>
              <span>${subjName(s)}</span>
              <span style="margin-left:auto;font-size:12px;color:var(--text2)">${s.duration} min</span>
            </button>`).join('')}
        </div>

        <!-- Custom duration adjuster (only shown when idle) -->
        ${this.state === 'idle' ? `
        <div class="timer-dur-row">
          <span class="timer-dur-label">⏱ ${t('dur_lbl')}</span>
          <button class="dur-adj" onclick="Timer._adjMins(-5)">−</button>
          <span class="timer-dur-val" id="timerMinsDisplay">${effMins}</span>
          <span style="font-size:13px;color:var(--text2)">${t('dur_min')}</span>
          <button class="dur-adj" onclick="Timer._adjMins(+5)">＋</button>
        </div>` : ''}

        <!-- Clock -->
        <div class="timer-display ${stateClass}" id="timerDisplay">${mins}:${secs}</div>

        <!-- Progress bar -->
        <div class="timer-progress">
          <div class="timer-progress-fill" id="timerBar" style="width:${pct}%"></div>
        </div>

        <!-- Controls -->
        <div class="timer-controls">
          ${this.state === 'idle' || this.state === 'done' ? `
            <button class="timer-btn primary" onclick="Timer.start()">${t('timer_start')}</button>
          ` : this.state === 'running' ? `
            <button class="timer-btn primary"    onclick="Timer.pause()">${t('timer_pause')}</button>
            <button class="timer-btn secondary"  onclick="Timer.reset()">${t('timer_reset')}</button>
          ` : `
            <button class="timer-btn primary"   onclick="Timer.resume()">${t('timer_resume')}</button>
            <button class="timer-btn secondary" onclick="Timer.reset()">${t('timer_reset')}</button>
          `}
        </div>

        ${this.state === 'done'    ? `<div class="timer-done-msg">${t('timer_done')}</div>` : ''}
        ${this.state === 'running' ? `<div style="text-align:center;font-size:14px;
          color:var(--text2);font-weight:700">${t('timer_running')}</div>` : ''}
      </div>`;
  },

  _pick(id) {
    if (this.state !== 'idle') return;
    this.selectedId = id;
    this.customMins = null;
    const subj = S.subjects.find(s => s.id === id);
    if (subj) {
      this.totalSecs  = subj.duration * 60;
      this.remainSecs = this.totalSecs;
    }
    this.render();
  },

  _adjMins(delta) {
    if (this.state !== 'idle') return;
    const subj = S.subjects.find(s => s.id === this.selectedId);
    const base = this.customMins !== null ? this.customMins : (subj?.duration || 30);
    this.customMins = Math.min(300, Math.max(1, base + delta));
    this.totalSecs  = this.customMins * 60;
    this.remainSecs = this.totalSecs;
    const el = document.getElementById('timerMinsDisplay');
    if (el) el.textContent = this.customMins;
    const disp = document.getElementById('timerDisplay');
    if (disp) {
      const m = String(Math.floor(this.remainSecs / 60)).padStart(2,'0');
      const s = String(this.remainSecs % 60).padStart(2,'0');
      disp.textContent = `${m}:${s}`;
    }
  },

  start() {
    if (this.state === 'done') this.reset();
    if (this.customMins !== null) {
      this.totalSecs  = this.customMins * 60;
      this.remainSecs = this.totalSecs;
    }
    this.state = 'running';
    this.render();
    this._tick();
  },

  _tick() {
    this.interval = setInterval(() => {
      this.remainSecs--;
      this._updateLive();
      if (this.remainSecs <= 0) {
        clearInterval(this.interval);
        this.state = 'done';
        this.render();
        this._onComplete();
      }
    }, 1000);
  },

  pause() {
    clearInterval(this.interval);
    this.state = 'paused';
    this.render();
  },

  resume() {
    this.state = 'running';
    this.render();
    this._tick();
  },

  reset() {
    clearInterval(this.interval);
    this.state = 'idle';
    const subj = S.subjects.find(s => s.id === this.selectedId);
    const mins = this.customMins !== null ? this.customMins : (subj?.duration || 30);
    this.totalSecs  = mins * 60;
    this.remainSecs = this.totalSecs;
    this.render();
  },

  // Fast DOM update during countdown (avoids full re-render every second)
  _updateLive() {
    const disp = document.getElementById('timerDisplay');
    const bar  = document.getElementById('timerBar');
    if (disp) {
      const m = String(Math.floor(this.remainSecs / 60)).padStart(2,'0');
      const s = String(this.remainSecs % 60).padStart(2,'0');
      disp.textContent = `${m}:${s}`;
    }
    if (bar && this.totalSecs > 0) {
      bar.style.width = Math.round(
        ((this.totalSecs - this.remainSecs) / this.totalSecs) * 100
      ) + '%';
    }
  },

  _onComplete() {
    confetti();
    showToast(t('timer_done'));
    if (this.selectedId) {
      if (!S.todayReport[this.selectedId]) S.todayReport[this.selectedId] = {};
      S.todayReport[this.selectedId].timerDone = true;
      saveLocal();
    }
  },
};
