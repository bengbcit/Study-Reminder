/* remind.js — Notification: Email (.ics), Discord Webhook, Browser banner push */

const Remind = {
  // Track scheduled banner timer IDs so we can cancel on re-save
  _bannerTimer: null,

  toggleN(type) {
    S.notify[type] = !S.notify[type];
    document.getElementById('nb-' + type).classList.toggle('on', S.notify[type]);
    document.getElementById('emailCfg').style.display    = S.notify.email    ? 'block' : 'none';
    document.getElementById('discordCfg').style.display  = S.notify.discord  ? 'block' : 'none';
    document.getElementById('pushCfg').style.display     = S.notify.push     ? 'block' : 'none';
  },

  // ── Export .ics calendar file ─────────────────────────────
  addToCalendar() {
    const addr = document.getElementById('emailAddr').value.trim();
    if (!addr) { showToast('请先填写邮箱地址'); return; }
    const [h, m] = S.startTime.split(':');
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//StudyStars//EN\n';
    S.subjects.filter(s => s.enabled).forEach(s => {
      const dt = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      ics += `BEGIN:VEVENT\nSUMMARY:${s.icon} ${s.name} (${s.duration}min)\nDTSTART:${dt}T${h}${m}00\nDURATION:PT${s.duration}M\nRRULE:FREQ=DAILY\nEND:VEVENT\n`;
    });
    ics += 'END:VCALENDAR';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'study-schedule.ics';
    a.click();
    showToast('📅 .ics 已下载 — 双击即可导入 Gmail / Outlook / Apple 日历！');
  },

  // ── Discord Webhook ───────────────────────────────────────
  // No bot account needed — just create a webhook URL in Discord server settings.
  async testDiscord() {
    const url = document.getElementById('discordWebhook').value.trim();
    if (!url) { showToast('请先填入 Discord Webhook URL'); return; }
    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: null,
          embeds: [{
            title:       '📚 学习小星星 — 测试通知',
            description: '✅ Discord 通知设置成功！今天的学习科目：\n' +
              S.subjects.filter(s => s.enabled).map(s => `${s.icon} ${s.name}`).join('\n'),
            color: 0xFF6B35,
            footer: { text: 'Study Stars' },
          }],
        }),
      });
      if (res.ok || res.status === 204) showToast('✅ Discord 发送成功！');
      else showToast('发送失败，请检查 Webhook URL');
    } catch (e) {
      showToast('发送失败：' + e.message);
    }
  },

  async sendDiscord(text) {
    const url = S.discordWebhook;
    if (!S.notify.discord || !url) return;
    try {
      await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: null,
          embeds: [{
            title:       '📚 学习简报已提交',
            description: text,
            color:       0xFF6B35,
            footer:      { text: `Study Stars • ${todayKey()}` },
          }],
        }),
      });
    } catch (e) { console.warn('Discord send failed', e); }
  },

  // ── Browser in-page banner ────────────────────────────────
  // Shows a visible banner inside the page at the scheduled time.
  // Also shows a "test" button so you can preview it immediately.
  scheduleBanner() {
    if (this._bannerTimer) clearTimeout(this._bannerTimer);
    if (!S.notify.push) return;

    const [h, m] = S.startTime.split(':').map(Number);
    const before = parseInt(S.remindBefore) || 0;
    const now    = new Date();
    const fire   = new Date();
    fire.setHours(h, m - before, 0, 0);
    if (fire <= now) fire.setDate(fire.getDate() + 1); // schedule for tomorrow if past

    const ms = fire - now;
    const hh = String(fire.getHours()).padStart(2,'0');
    const mm = String(fire.getMinutes()).padStart(2,'0');
    console.info(`Banner scheduled for ${hh}:${mm} (in ${Math.round(ms/60000)} min)`);

    this._bannerTimer = setTimeout(() => this._showBanner(), ms);
  },

  _showBanner() {
    const icons  = S.subjects.filter(s => s.enabled).map(s => s.icon).join(' ');
    const msgs   = {
      zh: `📚 该开始学习了！${icons} — 加油！`,
      ja: `📚 勉強の時間だよ！${icons} — 頑張って！`,
      en: `📚 Time to study! ${icons} — Let's go!`,
    };
    const banner = document.getElementById('remindBanner');
    const textEl = document.getElementById('remindBannerText');
    textEl.textContent = msgs[I18n.lang] || msgs.zh;
    banner.style.display = 'flex';
    // Auto-hide after 60 seconds
    setTimeout(() => { banner.style.display = 'none'; }, 60000);
    // Play gentle audio cue
    try {
      const ctx  = new AudioContext();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(); osc.stop(ctx.currentTime + 0.8);
    } catch (e) {}
  },

  // Called by the "Preview" button in the remind page
  previewBanner() {
    this._showBanner();
  },

  // ── Sync UI from state ────────────────────────────────────
  syncUI() {
    const fields = {
      startTime:      'startTime',
      emailAddr:      'emailAddr',
      discordWebhook: 'discordWebhook',
    };
    Object.entries(fields).forEach(([stateKey, elId]) => {
      const el = document.getElementById(elId);
      if (el) el.value = S[stateKey] || '';
    });
    const rb = document.getElementById('remindBefore');
    if (rb) rb.value = S.remindBefore || 15;

    ['email','discord','push'].forEach(k => {
      const btn = document.getElementById('nb-' + k);
      if (btn) btn.classList.toggle('on', !!S.notify[k]);
    });
    document.getElementById('emailCfg').style.display   = S.notify.email   ? 'block':'none';
    document.getElementById('discordCfg').style.display = S.notify.discord ? 'block':'none';
    document.getElementById('pushCfg').style.display    = S.notify.push    ? 'block':'none';
  },

  // ── Read UI into state ────────────────────────────────────
  readUI() {
    S.startTime      = document.getElementById('startTime').value;
    S.remindBefore   = parseInt(document.getElementById('remindBefore')?.value) || 0;
    S.emailAddr      = document.getElementById('emailAddr').value.trim();
    S.discordWebhook = (document.getElementById('discordWebhook')?.value || '').trim();
  },
};
