/* timer.js — 🎵 Focus countdown timer with subject selection */

const Timer = {
  selectedId: null,
  totalSecs:  0,
  remainSecs: 0,
  interval:   null,
  state:      'idle', // idle | running | paused | done

  render() {
    const el = document.getElementById('timerView');
    if (!el) return;

    const enabled = S.subjects.filter(s => s.enabled);
    if (!enabled.length) {
      el.innerHTML = `<p style="text-align:center;color:var(--text2);padding:40px 0">${t('lbl_sub')}…</p>`;
      return;
    }

    // If no subject selected or selection no longer exists, pick first
    if (!this.selectedId || !enabled.find(s => s.id === this.selectedId)) {
      this.selectedId = enabled[0].id;
    }
    const subj = enabled.find(s => s.id === this.selectedId);

    // Compute display values
    if (this.state === 'idle') {
      this.totalSecs  = subj.duration * 60;
      this.remainSecs = this.totalSecs;
    }
    const pct = this.totalSecs > 0
      ? Math.round(((this.totalSecs - this.remainSecs) / this.totalSecs) * 100)
      : 0;
    const mins = Math.floor(this.remainSecs / 60);
    const secs = this.remainSecs % 60;
    const display = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    const stateClass = this.state === 'running' ? 'running' : this.state === 'done' ? 'done' : '';

    el.innerHTML = `
      <div class="timer-wrap">
        <p class="sec-label">${t('timer_pick')}</p>
        <div class="timer-subject-sel">
          ${enabled.map(s => `
            <button class="timer-subj-btn ${s.id === this.selectedId ? 'active' : ''}"
                    onclick="Timer._pick('${s.id}')" style="${s.id===this.selectedId?'border-color:'+s.color+';background:'+s.bg:''}">
              <span style="font-size:20px">${s.icon}</span>
              <span>${subjName(s)}</span>
              <span style="margin-left:auto;font-size:12px;color:var(--text2)">${s.duration} min</span>
            </button>`).join('')}
        </div>

        <div class="timer-display ${stateClass}">${display}</div>

        <div class="timer-progress">
          <div class="timer-progress-fill" style="width:${pct}%"></div>
        </div>

        <div class="timer-controls">
          ${this.state === 'idle' || this.state === 'done' ? `
            <button class="timer-btn primary" onclick="Timer.start()">${t('timer_start')}</button>
          ` : this.state === 'running' ? `
            <button class="timer-btn primary" onclick="Timer.pause()">${t('timer_pause')}</button>
            <button class="timer-btn secondary" onclick="Timer.reset()">${t('timer_reset')}</button>
          ` : `
            <button class="timer-btn primary" onclick="Timer.resume()">${t('timer_resume')}</button>
            <button class="timer-btn secondary" onclick="Timer.reset()">${t('timer_reset')}</button>
          `}
        </div>

        ${this.state === 'done' ? `
          <div class="timer-done-msg">${t('timer_done')}</div>
        ` : this.state === 'running' ? `
          <div style="text-align:center;font-size:14px;color:var(--text2);font-weight:700">${t('timer_running')}</div>
        ` : ''}
      </div>`;
  },

  _pick(id) {
    if (this.state !== 'idle') return; // don't switch mid-session
    this.selectedId = id;
    const subj = S.subjects.find(s => s.id === id);
    if (subj) {
      this.totalSecs  = subj.duration * 60;
      this.remainSecs = this.totalSecs;
    }
    this.render();
  },

  start() {
    if (this.state === 'done') this.reset();
    this.state = 'running';
    this.render();
    this.interval = setInterval(() => {
      this.remainSecs--;
      this._updateDisplay();
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
    this.interval = setInterval(() => {
      this.remainSecs--;
      this._updateDisplay();
      if (this.remainSecs <= 0) {
        clearInterval(this.interval);
        this.state = 'done';
        this.render();
        this._onComplete();
      }
    }, 1000);
  },

  reset() {
    clearInterval(this.interval);
    this.state = 'idle';
    const subj = S.subjects.find(s => s.id === this.selectedId);
    if (subj) {
      this.totalSecs  = subj.duration * 60;
      this.remainSecs = this.totalSecs;
    }
    this.render();
  },

  // Directly update the timer display without full re-render (performance)
  _updateDisplay() {
    const el = document.querySelector('.timer-display');
    if (!el) return;
    const mins = Math.floor(this.remainSecs / 60);
    const secs = this.remainSecs % 60;
    el.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    // Update progress bar
    const pct = Math.round(((this.totalSecs - this.remainSecs) / this.totalSecs) * 100);
    const bar = document.querySelector('.timer-progress-fill');
    if (bar) bar.style.width = pct + '%';
  },

  _onComplete() {
    confetti();
    showToast(t('timer_done'));
    // Mark the subject as done in today's report
    if (this.selectedId) {
      if (!S.todayReport[this.selectedId]) S.todayReport[this.selectedId] = {};
      S.todayReport[this.selectedId].timerDone = true;
      saveLocal();
    }
  },
};
