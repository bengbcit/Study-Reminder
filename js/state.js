/* state.js — Local state management, default data, and shared utilities */

const DEFAULT_SUBJECTS = [
  { id:'eng',  name:'英语', nameJa:'英語',  nameEn:'English', icon:'🇬🇧', color:'#52C97A', bg:'#EEFFED', enabled:true,  duration:30 },
  { id:'cn',   name:'中文', nameJa:'中国語', nameEn:'Chinese', icon:'📖', color:'#9B6DFF', bg:'#F3EEFF', enabled:true,  duration:20 },
  { id:'py',   name:'Python',nameJa:'Python',nameEn:'Python',  icon:'🐍', color:'#4A90D9', bg:'#EEF5FF', enabled:false, duration:30 },
  { id:'math', name:'数学', nameJa:'数学',  nameEn:'Math',    icon:'🔢', color:'#FFB300', bg:'#FFF8E1', enabled:false, duration:20 },
];

// S holds all runtime state (merged from localStorage + Firestore)
const S = {
  subjects:      [],
  notify:        { email: true, discord: false, push: false },
  startTime:     '09:00',
  remindBefore:  15,
  emailAddr:     'takeiteasylyaoi@gmail.com',
  discordWebhook: '',
  points:        0,
  streak:        0,
  history:       {},   // { 'YYYY-MM-DD': { subjectId: { done, summary, hard, diff, subj, icon } } }
  todayReport:   {},   // { subjectId: { done, summary, hard, diff } }
  coupons:       [],   // [{ id, icon, name, cost, date, used }]
  avatar:        null, // emoji string or base64 data URL
  notionToken:   "",
  notionDbId:    "",
  notionSyncedPages: [],
  notionDraftSummary: "",
  themeBg:       "",    // background theme id
  calMonth:      new Date().getMonth(),
  calYear:       new Date().getFullYear(),
  selectedDay:   null,
};

// ── Persistence ──────────────────────────────────────────────
function loadLocal() {
  try {
    // Try current key first
    const raw = localStorage.getItem('ss_v4');
    if (raw) {
      Object.assign(S, JSON.parse(raw));
    } else {
      // Migrate from older version (ss_v3 had tgToken/tgChatId)
      const old = localStorage.getItem('ss_v3');
      if (old) {
        const parsed = JSON.parse(old);
        // Migrate telegram → discord (just drop the token, keep notify structure)
        if (parsed.notify?.telegram !== undefined) {
          parsed.notify.discord = false;
          delete parsed.notify.telegram;
        }
        delete parsed.tgToken;
        delete parsed.tgChatId;
        Object.assign(S, parsed);
      }
    }
  } catch (e) {
    console.warn('loadLocal error:', e);
  }
  // Ensure notify has all expected keys (safe defaults)
  S.notify = { email: true, discord: false, push: false, ...S.notify };
  if (!S.subjects || !S.subjects.length) {
    S.subjects = JSON.parse(JSON.stringify(DEFAULT_SUBJECTS));
  }
}

function saveLocal() {
  localStorage.setItem('ss_v4', JSON.stringify(S));
}

// ── Date helpers ─────────────────────────────────────────────
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function pad(n) { return String(n).padStart(2, '0'); }

function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

// ── Streak calculation ───────────────────────────────────────
function recalcStreak() {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const k = dateKey(d);
    const rec = S.history[k];
    if (rec && Object.values(rec).some(r => r.done)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  S.streak = streak;
}

// ── Subject name helper ──────────────────────────────────────
function subjName(s) {
  const l = I18n.lang;
  return l === 'ja' && s.nameJa ? s.nameJa
       : l === 'en' && s.nameEn ? s.nameEn
       : s.name;
}

// ── Toast ────────────────────────────────────────────────────
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2600);
}

// ── Confetti ─────────────────────────────────────────────────
function confetti() {
  const cols = ['#FF6B35','#FFB300','#52C97A','#4A90D9','#9B6DFF'];
  for (let i = 0; i < 26; i++) {
    const el = document.createElement('div');
    el.className = 'cp';
    el.style.cssText = `left:${Math.random()*100}%;background:${cols[i%cols.length]};`
      + `animation-delay:${Math.random()*.5}s;animation-duration:${1+Math.random()*.8}s;`
      + `border-radius:${Math.random()>.5?'50%':'2px'}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}

// ── Points ───────────────────────────────────────────────────
function addPoints(n) {
  S.points += n;
  document.getElementById('streakNum').textContent = S.streak;
  saveLocal();
  if (window.Rewards) Rewards.render();
}
