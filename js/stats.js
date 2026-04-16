/* stats.js — 📊 Study statistics with Chart.js charts */

const Stats = {
  _weekChart:    null,
  _subjectChart: null,

  render() {
    const el = document.getElementById('statsView');
    if (!el) return;

    const totalDays     = Object.keys(S.history).length;
    const activeSubjects = S.subjects.filter(s => s.enabled).length;

    el.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-num">${totalDays}</div>
          <div class="stat-lbl">${t('stats_total_days')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${S.points}</div>
          <div class="stat-lbl">${t('stats_total_pts')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${S.streak}</div>
          <div class="stat-lbl">${t('stats_streak')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${activeSubjects}</div>
          <div class="stat-lbl">${t('stats_subjects')}</div>
        </div>
      </div>

      <div class="chart-wrap">
        <div class="chart-title">${t('stats_weekly')} (${t('lbl_week')})</div>
        <canvas id="weekChart" height="160"></canvas>
      </div>

      <div class="chart-wrap">
        <div class="chart-title">${t('stats_subject_dist')}</div>
        <canvas id="subjectChart" height="200"></canvas>
      </div>`;

    // Allow DOM to paint before drawing charts
    requestAnimationFrame(() => {
      this._drawWeekChart();
      this._drawSubjectChart();
    });
  },

  _drawWeekChart() {
    const ctx = document.getElementById('weekChart');
    if (!ctx) return;

    // Destroy old chart instance to prevent canvas reuse error
    if (this._weekChart) { this._weekChart.destroy(); this._weekChart = null; }

    const days  = t('days');
    const today = new Date();
    const labels = [];
    const values = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = dateKey(d);
      const rec = S.history[key] || {};
      const done = Object.values(rec).filter(r => r.done).length;
      labels.push(days[d.getDay()]);
      values.push(done);
    }

    this._weekChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: values.map(v => v > 0 ? '#FF6B3599' : '#EDE8E0'),
          borderColor:     values.map(v => v > 0 ? '#FF6B35'   : '#EDE8E0'),
          borderWidth: 2,
          borderRadius: 8,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { family: 'Nunito', weight: '700' },
            },
            grid: { color: '#EDE8E0' },
          },
          x: {
            ticks: { font: { family: 'Nunito', weight: '700' } },
            grid: { display: false },
          },
        },
      },
    });
  },

  _drawSubjectChart() {
    const ctx = document.getElementById('subjectChart');
    if (!ctx) return;

    if (this._subjectChart) { this._subjectChart.destroy(); this._subjectChart = null; }

    // Count done sessions per subject across all history
    const counts = {};
    S.subjects.filter(s => s.enabled).forEach(s => { counts[s.id] = 0; });

    Object.values(S.history).forEach(day => {
      Object.entries(day).forEach(([sid, r]) => {
        if (r.done && counts[sid] !== undefined) counts[sid]++;
      });
    });

    const enabled = S.subjects.filter(s => s.enabled);
    const labels  = enabled.map(s => subjName(s));
    const values  = enabled.map(s => counts[s.id] || 0);
    const colors  = enabled.map(s => s.color);

    if (values.every(v => v === 0)) {
      const el = document.getElementById('subjectChart');
      if (el) el.parentElement.innerHTML +=
        `<p style="text-align:center;font-size:13px;color:var(--text2);margin-top:8px">
          Submit your daily report to see the chart here
        </p>`;
      return;
    }

    this._subjectChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data:            values,
          backgroundColor: colors.map(c => c + 'CC'),
          borderColor:     colors,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'Nunito', weight: '700' }, padding: 12 },
          },
        },
      },
    });
  },
};

window.Stats = Stats;
