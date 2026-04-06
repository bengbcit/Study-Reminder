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
      const r   = S.todayReport[s.id] || {};
      const nm  = subjName(s);
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
          ${[1,2,3,4,5].map(i =>
            `<button class="sb ${(r.diff||0) >= i ? 'lit' : ''}"
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
      const sumEl  = document.getElementById('sum_'  + s.id);
      const hardEl = document.getElementById('hard_' + s.id);
      if (sumEl)  r.summary = sumEl.value;
      if (hardEl) r.hard    = hardEl.value;
    });

    const doneSubjects = enabled.filter(s => S.todayReport[s.id]?.done);
    if (!doneSubjects.length) { showToast(t('no_done')); return; }

    // Award points for each done subject
    const today = todayKey();
    if (!S.history[today]) S.history[today] = {};
    let totalPts = 0;
    doneSubjects.forEach(s => {
      const r   = S.todayReport[s.id];
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
✅ 完成 | ⏱ ${s.duration} 分钟 | ${'⭐'.repeat(r.diff||0)||'未评级'}
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
    if (window.Cal)     Cal.render();
    if (window.Rewards) Rewards.render();
  },

  // ── EmailJS send ─────────────────────────────────────────
  _sendEmail(to, subject, body) {
    // Replace these 3 IDs with your EmailJS credentials (emailjs.com, free plan)
    // Template needs: {{to_email}}, {{subject}}, {{body}}
    const PUBLIC_KEY  = 'YOUR_EMAILJS_PUBLIC_KEY';
    const SERVICE_ID  = 'YOUR_SERVICE_ID';
    const TEMPLATE_ID = 'YOUR_TEMPLATE_ID';

    emailjs.init(PUBLIC_KEY);
    emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      to_email: to,
      subject,
      body,
    }).catch(() => {}); // Fail silently if not configured
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
    } catch (e) {}
  },

  // ── AI encouragement via Claude API ──────────────────────
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
      `${s.icon} ${subjName(s)} (${s.duration}分钟, 难度${s.diff||'—'})`
    ).join('、');

    const prompt = I18n.lang === 'en'
      ? `A child just completed their study session: ${subjectList}. Write a warm, enthusiastic 2-3 sentence encouragement in English. Be specific and mention the subjects. Use a friendly, motivating tone.`
      : I18n.lang === 'ja'
      ? `子どもが今日の学習を終えました：${subjectList}。日本語で温かく励ます2〜3文を書いてください。具体的な科目に触れ、フレンドリーな口調で。`
      : `一个孩子刚完成了今天的学习：${subjectList}。请用温暖鼓励的语气写2-3句中文鼓励话语，要具体提到学习的科目，让孩子感到被肯定和有动力继续。`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      aiEl.innerHTML = `
        <div class="ai-card">
          <div class="ai-label">${t('ai_label')}</div>
          <div class="ai-text">${text}</div>
        </div>`;
    } catch (e) {
      aiEl.style.display = 'none';
    }
  },
};
