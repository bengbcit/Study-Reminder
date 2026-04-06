/* remind.js — Notification settings: Email, Telegram, Browser push */

const Remind = {
  toggleN(type) {
    S.notify[type] = !S.notify[type];
    document.getElementById('nb-' + type).classList.toggle('on', S.notify[type]);
    document.getElementById('emailCfg').style.display    = S.notify.email    ? 'block' : 'none';
    document.getElementById('telegramCfg').style.display = S.notify.telegram ? 'block' : 'none';
    document.getElementById('pushCfg').style.display     = S.notify.push     ? 'block' : 'none';
  },

  // ── Add today's subjects to Google / Outlook calendar via ICS email ──
  addToCalendar() {
    const addr = document.getElementById('emailAddr').value.trim();
    if (!addr) { showToast('请先填写邮箱地址'); return; }

    const [h, m] = S.startTime.split(':');
    const enabled = S.subjects.filter(s => s.enabled);

    // Build .ics content
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//StudyStars//EN\n';
    enabled.forEach(s => {
      const dt = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      ics += [
        'BEGIN:VEVENT',
        `SUMMARY:${s.icon} ${s.name} (${s.duration}分)`,
        `DTSTART:${dt}T${h}${m}00`,
        `DURATION:PT${s.duration}M`,
        'RRULE:FREQ=DAILY',
        'END:VEVENT',
      ].join('\n') + '\n';
    });
    ics += 'END:VCALENDAR';

    // Download .ics file — works with Gmail, Outlook, Apple Calendar
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'study-schedule.ics';
    a.click();
    showToast('📅 .ics 文件已下载，用邮件客户端打开即可添加到日历！');
  },

  // ── Telegram ─────────────────────────────────────────────
  async testTelegram() {
    const token  = document.getElementById('tgToken').value.trim();
    const chatId = document.getElementById('tgChatId').value.trim();
    if (!token || !chatId) { showToast('请填写 Token 和 Chat ID'); return; }

    const msg = encodeURIComponent('📚 学习小星星测试消息！今天记得完成学习哦 🌟');
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${msg}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) showToast(t('tg_ok'));
      else showToast('发送失败：' + data.description);
    } catch (e) {
      showToast('发送失败，请检查 Token / Chat ID');
    }
  },

  // ── Browser in-page banner reminder ──────────────────────
  scheduleBanner() {
    if (!S.notify.push) return;
    const [h, m] = S.startTime.split(':').map(Number);
    const before = S.remindBefore;
    const now  = new Date();
    const fire = new Date();
    fire.setHours(h, m - before, 0, 0);
    if (fire < now) fire.setDate(fire.getDate() + 1);

    const ms = fire - now;
    setTimeout(() => {
      const banner = document.getElementById('remindBanner');
      const text   = document.getElementById('remindBannerText');
      text.textContent = `📚 ${t('timer_running')} ` +
        S.subjects.filter(s => s.enabled).map(s => s.icon).join(' ');
      banner.style.display = 'flex';
      // Auto-hide after 30 seconds
      setTimeout(() => { banner.style.display = 'none'; }, 30000);
    }, ms);
  },

  // ── Sync UI from state ────────────────────────────────────
  syncUI() {
    const ta = document.getElementById('startTime');
    const ea = document.getElementById('emailAddr');
    const tk = document.getElementById('tgToken');
    const ci = document.getElementById('tgChatId');
    const rb = document.getElementById('remindBefore');
    if (ta) ta.value = S.startTime;
    if (ea) ea.value = S.emailAddr;
    if (tk) tk.value = S.tgToken;
    if (ci) ci.value = S.tgChatId;
    if (rb) rb.value = S.remindBefore;

    ['email','telegram','push'].forEach(k => {
      const btn = document.getElementById('nb-' + k);
      if (btn) btn.classList.toggle('on', !!S.notify[k]);
    });
    document.getElementById('emailCfg').style.display    = S.notify.email    ? 'block' : 'none';
    document.getElementById('telegramCfg').style.display = S.notify.telegram ? 'block' : 'none';
    document.getElementById('pushCfg').style.display     = S.notify.push     ? 'block' : 'none';
  },

  // ── Read UI into state ────────────────────────────────────
  readUI() {
    S.startTime    = document.getElementById('startTime').value;
    S.remindBefore = parseInt(document.getElementById('remindBefore').value) || 0;
    S.emailAddr    = document.getElementById('emailAddr').value.trim();
    S.tgToken      = document.getElementById('tgToken').value.trim();
    S.tgChatId     = document.getElementById('tgChatId').value.trim();
  },
};
