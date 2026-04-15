/* report.js — Daily study report: fill, submit, EmailJS send, AI encouragement */

// ── Daily rotating motivational quote (changes every day, language-aware) ──
const DAILY_QUOTES = {
  zh: [
    '学如逆水行舟，不进则退。今天继续前行！🚀',
    '每一分努力，都是未来的自己在说谢谢。💛',
    '不是因为有希望才坚持，而是坚持才有希望。🔥',
    '今天的你，比昨天更厉害了。⭐',
    '成功没有捷径，但每一步都算数。👣',
    '再难也要学，再忙也要看书。📚',
    '你今天种下的努力，将来都会开花。🌸',
    '知识是最好的投资，今天也不例外。💎',
    '相信自己，你比你想象的更强大。💪',
    '每天进步一点点，积累成就大改变。🌟',
    '专注当下，今天的任务就是今天的胜利。🏆',
    '即使慢，只要不停，就一定会到达。🐢',
    '困难是暂时的，你的成长是永久的。🌱',
    '今天学的，明天就是你的竞争力。⚡',
  ],
  ja: [
    '学ぶことを止めたら、成長も止まる。今日も前進！🚀',
    '努力した今日が、未来の自分への贈り物。💛',
    '継続は力なり。今日も一歩ずつ。🔥',
    '昨日よりも少しだけ賢くなった今日の自分を褒めよう。⭐',
    '近道はないけど、歩いた分だけ確実に前へ。👣',
    '忙しくても、本を開く5分を作ろう。📚',
    '今日蒔いた努力の種は、必ず花を咲かせる。🌸',
    '知識こそ最高の投資。今日も積み重ねよう。💎',
    '自分を信じて。君は思っているよりずっと強い。💪',
    '毎日少しずつ、気づいたら大きな変化になっている。🌟',
    '今ここに集中。今日のタスクが今日の勝利。🏆',
    'ゆっくりでもいい、止まらなければ必ず届く。🐢',
    '困難は一時的、成長は永遠に残る。🌱',
    '今日学んだことが、明日の武器になる。⚡',
  ],
  en: [
    "Learning never stops. Keep moving forward today! 🚀",
    "Every effort you make today is a gift to your future self. 💛",
    "Progress, not perfection. Every step counts. 🔥",
    "You're smarter today than you were yesterday — celebrate that! ⭐",
    "There are no shortcuts, but every step gets you closer. 👣",
    "No matter how busy, make time for learning. 📚",
    "The seeds you plant today will bloom in the future. 🌸",
    "Knowledge is the best investment you'll ever make. 💎",
    "Believe in yourself — you're stronger than you think. 💪",
    "Small daily improvements lead to remarkable results. 🌟",
    "Stay focused. Today's tasks are today's victories. 🏆",
    "Slow and steady still wins the race. Keep going! 🐢",
    "Challenges are temporary, but growth is permanent. 🌱",
    "What you learn today becomes your edge tomorrow. ⚡",
  ],
};

function _getDailyQuote(lang) {
  const quotes = DAILY_QUOTES[lang] || DAILY_QUOTES.en;
  // Use date string as a seed to pick the same quote all day, different each day
  const seed = parseInt(todayKey().replace(/-/g, '')) % quotes.length;
  return quotes[seed];
}

const Report = {
  render() {
    const el = document.getElementById('reportList');
    if (!el) return;
    el.innerHTML = '';

    // Daily motivational quote — changes every day, matches current language
    const quoteEl = document.getElementById('reportDailyQuote');
    if (quoteEl) quoteEl.textContent = _getDailyQuote(I18n.lang);

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

    // Sync report email field — fall back to Firebase auth email if none saved
    const repEmail = document.getElementById('reportEmail');
    if (repEmail) repEmail.value = S.emailAddr || window.Auth?.user?.email || '';
  },

  // Auto-save report email back to S.emailAddr on blur
  _saveEmail(el) {
    S.emailAddr = el.value.trim();
    saveLocal();
    // Keep remind page email field in sync too
    const addr = document.getElementById('emailAddr');
    if (addr) addr.value = S.emailAddr;
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
      || S.emailAddr || window.Auth?.user?.email || '';
    if (!toEmail) { showToast('📧 请先填写收件邮箱'); return; }

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

    // Send Discord notification
    Remind.sendDiscord(this._buildTextBody(doneSubjects, totalPts, today));

    confetti();

    // Send email via EmailJS — show result toast after attempt
    this._sendEmail(toEmail, doneSubjects, totalPts, today);

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
    const PUBLIC_KEY  = '1o0k8Wov1W7HtYneq';   // ← Account → API Keys
    const SERVICE_ID  = 'service_mvd09ib';      // ← Email Services → Service ID
    const TEMPLATE_ID = 'template_bp2bmun';     // ← Email Templates → Template ID

    // Initialise EmailJS once (idempotent, safe to call here)
    emailjs.init({ publicKey: PUBLIC_KEY });

    const name = S._localName || window.Auth?.user?.displayName || 'Student';

    // Send all subjects as one combined email to avoid multiple toasts
    const sends = doneSubjects.map(s => {
      const r = S.todayReport[s.id] || {};
      return emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        name:         name,
        subject_name: subjName(s),
        date:         today,
        time:         new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        done:         r.done ? '✅ Completed / 完了 / 完成' : '❌ Incomplete',
        duration:     s.duration + ' min',
        difficulty:   '⭐'.repeat(r.diff || 0) || 'N/A',
        summary:      r.summary || '—',
        hard_points:  r.hard || '—',
        points:       '+' + (s.duration >= 30 ? 20 : 10) + ' pts',
        total_points: String(S.points),
        streak:       S.streak + ' days 🔥',
        to_email:     toEmail,
      });
    });

    // Show a single toast after all emails resolve
    Promise.all(sends).then(() => {
      showToast(t('send_ok'));
    }).catch(err => {
      console.warn('EmailJS error:', err);
      showToast('📧 邮件发送失败：' + (err.text || err.message || '请检查配置'));
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
