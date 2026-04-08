/* report.js — Daily study report: fill, submit, EmailJS send, AI encouragement */

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
            <span>${s.icon}</span><span>${nm}</span>
            ${r.timerDone ? '<span style="font-size:11px;color:var(--green);margin-left:4px">⏱ 计时完成</span>' : ''}
          </div>
          <div class="rc-pts">⭐ +${pts}</div>
        </div>
        <label class="done-check ${r.done ? 'checked' : ''}" id="doneLabel_${s.id}">
          <input type="checkbox" ${r.done ? 'checked' : ''} onchange="Report._togDone('${s.id}',this)">
          ${t('done_lbl')}
        </label>
        <textarea class="rta" id="sum_${s.id}"  placeholder="${t('sum_ph')}">${r.summary || ''}</textarea>
        <textarea class="rta" id="hard_${s.id}" placeholder="${t('hard_ph')}" style="min-height:52px">${r.hard || ''}</textarea>
        <div class="diff-row">
          <span class="diff-lbl">${t('diff_lbl')}</span>
          ${[1, 2, 3, 4, 5].map(i =>
        `<button class="sb ${(r.diff || 0) >= i ? 'lit' : ''}" onclick="Report._setDiff('${s.id}',${i})">⭐</button>`
      ).join('')}
        </div>`;
      el.appendChild(div);
    });

    // Sync report email field
    const repEmail = document.getElementById('reportEmail');
    if (repEmail && !repEmail._userEdited) repEmail.value = S.emailAddr || 'takeiteasylyaoi@gmail.com';
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

  // ── Submit ALL enabled subjects ───────────────────────────
  async submitAll() {
    const enabled = S.subjects.filter(s => s.enabled);
    const toEmail = document.getElementById('reportEmail').value.trim()
      || S.emailAddr || 'takeiteasylyaoi@gmail.com';

    // Collect current textarea values into state
    enabled.forEach(s => {
      if (!S.todayReport[s.id]) S.todayReport[s.id] = {};
      const r = S.todayReport[s.id];
      r.summary = document.getElementById('sum_' + s.id)?.value || '';
      r.hard = document.getElementById('hard_' + s.id)?.value || '';
    });

    const doneSubjects = enabled.filter(s => S.todayReport[s.id]?.done);
    if (!doneSubjects.length) { showToast(t('no_done')); return; }

    // Award points and save history
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
    document.getElementById('streakNum').textContent = S.streak;

    // Send email via EmailJS
    this._sendEmail(toEmail, doneSubjects, totalPts, today);

    // Send Discord notification
    Remind.sendDiscord(this._buildTextBody(doneSubjects, totalPts, today));

    confetti();
    showToast(t('send_ok'));

    // AI encouragement — pass current UI language explicitly
    this._fetchAI(doneSubjects, I18n.lang);

    // Sync cloud + re-render
    if (window.Auth?.user) await Auth.saveUserData();
    if (window.Cal) Cal.render();
    if (window.Rewards) Rewards.render();
  },

  // ── Build plain-text body (for Discord / fallback) ────────
  _buildTextBody(doneSubjects, totalPts, today) {
    const rows = doneSubjects.map(s => {
      const r = S.todayReport[s.id] || {};
      return `${s.icon} ${subjName(s)} — ${s.duration}min — ${'⭐'.repeat(r.diff || 0) || '—'}\n` +
        `📝 ${r.summary || '—'}\n🤔 ${r.hard || '—'}`;
    }).join('\n\n');
    return `📚 Study Report ${today}\n\n${rows}\n\n🏆 +${totalPts} pts  🔥 ${S.streak} day streak`;
  },

  // ── EmailJS send — matches your template variables from the screenshot ───
  //
  // YOUR TEMPLATE (from screenshot) uses these variables:
  //   Subject field:  "Study Planet Report: {{subject_name}}"
  //   To Email:        takeiteasylyaoi@gmail.com  (hardcoded in template)
  //   Body variables: {{name}}, {{date}}, {{subject_name}}, {{done}},
  //                   {{duration}}, {{difficulty}}, {{summary}}, {{time}}
  //
  // SETUP STEPS (one time):
  //   1. emailjs.com → Account → API Keys → copy "Public Key"
  //   2. Email Templates → your template → copy the Template ID (e.g. "template_xxxxxx")
  //   3. Replace the two YOUR_* values below and save
  //
  _sendEmail(toEmail, doneSubjects, totalPts, today) {
    const PUBLIC_KEY = '1o0k8Wov1W7HtYneq';  // ← Account → API Keys
    const SERVICE_ID = 'service_mvd09ib';           // ← already correct from your screenshot
    const TEMPLATE_ID = 'template_bp2bmun';          // ← Email Templates → ID column

    if (PUBLIC_KEY === '1o0k8Wov1W7HtYneq' || TEMPLATE_ID === 'template_bp2bmun') {
      console.warn(
        '⚠️ EmailJS not fully configured.\n' +
        'Open js/report.js and fill in PUBLIC_KEY and TEMPLATE_ID.\n' +
        'Service ID (service_mvd09ib) is already set correctly.'
      );
      showToast('⚠️ EmailJS 未配置 — 请在 report.js 填入 PUBLIC_KEY 和 TEMPLATE_ID');
      return;
    }

    emailjs.init(PUBLIC_KEY);

    // Send one email per completed subject (one template call each)
    doneSubjects.forEach(s => {
      const r = S.todayReport[s.id] || {};
      const name = S._localName || window.Auth?.user?.displayName || 'Student';

      emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        // ── Core fields (match your template exactly) ──
        name: name,
        subject_name: subjName(s),           // {{subject_name}}
        date: today,                 // {{date}}
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        done: r.done ? '✅ Completed / 完了 / 完成' : '❌ Incomplete',
        duration: s.duration + ' min',   // {{duration}}
        difficulty: '⭐'.repeat(r.diff || 0) || 'N/A',  // {{difficulty}}
        summary: r.summary || '—',      // {{summary}}
        // Extra fields (add to template if you want them)
        hard_points: r.hard || '—',
        points: '+' + (s.duration >= 30 ? 20 : 10) + ' pts',
        total_points: String(S.points),
        streak: S.streak + ' days 🔥',
        to_email: toEmail,               // only used if your template has {{to_email}}
      }).then(() => {
        console.info('EmailJS sent for', s.name);
      }).catch(err => {
        console.warn('EmailJS error:', err);
        showToast('📧 邮件发送失败：' + (err.text || err.message || '请检查配置'));
      });
    });
  },

  // ── AI encouragement (language-aware) ────────────────────
  async _fetchAI(doneSubjects, lang) {
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

    // Build subject list in the correct language
    const subjectList = doneSubjects.map(s => {
      const nm = lang === 'ja' && s.nameJa ? s.nameJa
        : lang === 'en' && s.nameEn ? s.nameEn : s.name;
      return `${s.icon} ${nm}`;
    }).join(lang === 'en' ? ', ' : '、');

    try {
      const res = await fetch('/api/encourage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectList, lang }),
      });
      if (!res.ok) throw new Error('status ' + res.status);
      const data = await res.json();
      aiEl.innerHTML = `
        <div class="ai-card">
          <div class="ai-label">${t('ai_label')}</div>
          <div class="ai-text">${data.text}</div>
        </div>`;
    } catch (e) {
      // Friendly fallback in the correct language — no API needed
      const fallback = {
        zh: `🌟 太棒了！今天完成了 ${subjectList} 的学习，你真的很努力！每一天的坚持都让你变得更强，明天继续加油！💪`,
        ja: `🌟 すごい！今日も ${subjectList} を頑張りました！毎日の積み重ねが大きな力になります。明日も一緒に頑張ろう！💪`,
        en: `🌟 Fantastic work today! You completed ${subjectList} — every study session makes you stronger. Keep it up, you're doing amazing! 💪`,
      };
      aiEl.innerHTML = `
        <div class="ai-card">
          <div class="ai-label">${t('ai_label')}</div>
          <div class="ai-text">${fallback[lang] || fallback.en}</div>
        </div>`;
    }
  },
};
