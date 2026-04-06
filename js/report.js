/* report.js — Daily study report: fill, submit, email, AI encouragement */

const Report = {
  render() {
    const el = document.getElementById('reportList');
    if (!el) return;
    el.innerHTML = '';

    const enabled = S.subjects.filter(s => s.enabled);
    if (!enabled.length) {
      el.innerHTML = `<div class="info-card">请先在「课程设置」中启用科目</div>`;
      return;
    }

    enabled.forEach(s => {
      const r = S.todayReport[s.id] || {};
      const nm = subjName(s);
      const pts = s.duration >= 30 ? 20 : 10;
      const div = document.createElement('div');
      div.className = 'rep-card';
      div.innerHTML = `
        <div class="rc-head">
          <div class="rc-subj">
            <span>${s.icon}</span>
            <span>${nm}</span>
            ${r.timerDone ? '<span style="font-size:12px;color:var(--green)">⏱ 计时完成</span>' : ''}
          </div>
          <div class="rc-pts">⭐ +${pts}</div>
        </div>

        <label class="done-check ${r.done ? 'checked' : ''}" id="doneLabel_${s.id}">
          <input type="checkbox" ${r.done ? 'checked' : ''}
                 onchange="Report._togDone('${s.id}', this)">
          ${t('done_lbl')}
        </label>

        <textarea class="rta" id="sum_${s.id}"
          placeholder="${t('sum_ph')}">${r.summary || ''}</textarea>
        <textarea class="rta" id="hard_${s.id}"
          placeholder="${t('hard_ph')}" style="min-height:52px">${r.hard || ''}</textarea>

        <div class="diff-row">
          <span class="diff-lbl">${t('diff_lbl')}</span>
          ${[1, 2, 3, 4, 5].map(i =>
        `<button class="sb ${(r.diff || 0) >= i ? 'lit' : ''}"
                     onclick="Report._setDiff('${s.id}', ${i})">⭐</button>`
      ).join('')}
        </div>`;
      el.appendChild(div);
    });

    // Email field
    const repEmail = document.getElementById('reportEmail');
    if (repEmail && !repEmail.value) repEmail.value = S.emailAddr;
  },

  _togDone(id, input) {
    if (!S.todayReport[id]) S.todayReport[id] = {};
    S.todayReport[id].done = input.checked;
    const lbl = document.getElementById('doneLabel_' + id);
    if (lbl) lbl.classList.toggle('checked', input.checked);
    saveLocal();
  },

  _setDiff(id, val) {
    if (!S.todayReport[id]) S.todayReport[id] = {};
    S.todayReport[id].diff = val;
    saveLocal();
    this.render();
  },

  // ── Submit ALL enabled subjects in one email ──────────────
  async submitAll() {
    const enabled = S.subjects.filter(s => s.enabled);
    const toEmail = document.getElementById('reportEmail').value.trim() || S.emailAddr;

    // Collect current textarea values
    enabled.forEach(s => {
      if (!S.todayReport[s.id]) S.todayReport[s.id] = {};
      const r = S.todayReport[s.id];
      const sumEl = document.getElementById('sum_' + s.id);
      const hardEl = document.getElementById('hard_' + s.id);
      if (sumEl) r.summary = sumEl.value;
      if (hardEl) r.hard = hardEl.value;
    });

    const doneSubjects = enabled.filter(s => S.todayReport[s.id]?.done);
    if (!doneSubjects.length) { showToast(t('no_done')); return; }

    // Award points for each done subject
    const today = todayKey();
    if (!S.history[today]) S.history[today] = {};
    let totalPts = 0;
    doneSubjects.forEach(s => {
      const r = S.todayReport[s.id];
      const pts = s.duration >= 30 ? 20 : 10;
      totalPts += pts;
      S.history[today][s.id] = { ...r, subj: s.name, icon: s.icon };
    });
    S.points += totalPts;
    recalcStreak();
    saveLocal();

    // Update streak display
    document.getElementById('streakNum').textContent = S.streak;

    // Build email body
    const rows = doneSubjects.map(s => {
      const r = S.todayReport[s.id] || {};
      return `
${s.icon} ${subjName(s)}
✅ 完成 | ⏱ ${s.duration} 分钟 | ${'⭐'.repeat(r.diff || 0) || '未评级'}
📝 ${r.summary || '（未填写）'}
🤔 难点：${r.hard || '（未填写）'}`;
    }).join('\n\n────────────────────\n');

    const bodyText = `📚 学习简报 — ${today}\n\n${rows}\n\n🏆 本次获得积分：+${totalPts}\n🔥 连续学习：${S.streak} 天`;

    this._sendEmail(toEmail, `📚 学习简报 ${today}`, bodyText);
    this._sendTelegram(bodyText);

    confetti();
    showToast(t('send_ok'));

    // AI encouragement
    this._fetchAI(doneSubjects);

    // Sync to Firestore
    if (window.Auth?.user) await Auth.saveUserData();

    // Update calendar and rewards
    if (window.Cal) Cal.render();
    if (window.Rewards) Rewards.render();
  },

  // ── EmailJS send ─────────────────────────────────────────
  _sendEmail(to, subject, body) {
    // Replace these 3 IDs with your EmailJS credentials (emailjs.com, free plan)
    // Template needs: {{to_email}}, {{subject}}, {{body}}
    const PUBLIC_KEY = '1o0k8Wov1W7HtYneq';
    const SERVICE_ID = 'service_mvd09ib';
    const TEMPLATE_ID = 'template_bp2bmun';

    emailjs.init(PUBLIC_KEY);
    emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      to_email: to,
      subject,
      body,
    }).catch(() => { }); // Fail silently if not configured
  },

  // ── Telegram send ────────────────────────────────────────
  async _sendTelegram(text) {
    if (!S.notify.telegram || !S.tgToken || !S.tgChatId) return;
    const url = `https://api.telegram.org/bot${S.tgToken}/sendMessage`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: S.tgChatId, text }),
      });
    } catch (e) { }
  },

  // ── AI encouragement via Claude API ──────────────────────
  // Calls /api/encourage (a Vercel serverless function in api/encourage.js).
  // If the endpoint is not deployed, falls back to a friendly local message.
  async _fetchAI(doneSubjects) {
    const aiEl = document.getElementById('aiEncouragement');
    if (!aiEl) return;

    aiEl.style.display = 'block';
    aiEl.innerHTML = `
      <div class="ai-card">
        <div class="ai-label">${t('ai_label')}</div>
        <div class="ai-loading">
          <div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div>
        </div>
      </div>`;

    const subjectList = doneSubjects.map(s =>
      `${s.icon} ${subjName(s)} (${s.duration} min, difficulty ${s.diff || '—'})`
    ).join(', ');

    const lang = I18n.lang;

    try {
      // POST to our own Vercel serverless function (api/encourage.js)
      // which securely calls the Anthropic API using a server-side env var.
      const res = await fetch('/api/encourage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectList, lang }),
      });

      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      const text = data.text || '';

      aiEl.innerHTML = `
        <div class="ai-card">
          <div class="ai-label">${t('ai_label')}</div>
          <div class="ai-text">${text}</div>
        </div>`;
    } catch (e) {
      // Friendly fallback messages when the API is not configured
      const fallbacks = {
        zh: `🌟 太棒了！今天完成了 ${doneSubjects.map(s => s.icon).join('')} 的学习，你真的很努力！明天继续加油，每一天的坚持都在让你变得更强大！`,
        ja: `🌟 すごい！今日も${doneSubjects.map(s => s.icon).join('')}を頑張りました！毎日の積み重ねが大きな力になります。明日も一緒に頑張ろう！`,
        en: `🌟 Amazing work today! You completed ${doneSubjects.map(s => s.icon).join(' ')} — every day you study you're getting stronger. Keep it up, you're doing great!`,
      };
      aiEl.innerHTML = `
        <div class="ai-card">
          <div class="ai-label">${t('ai_label')}</div>
          <div class="ai-text">${fallbacks[lang] || fallbacks.en}</div>
        </div>`;
    }
  },
};
