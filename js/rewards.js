/* rewards.js — ⭐ Points, badges, coupon generation and gallery */

const Rewards = {
  BADGES: [
    {
      id: 'first', icon: '🌟',
      name: { zh:'迈出第一步', ja:'最初の一歩', en:'First Step' },
      desc: { zh:'提交第一份简报', ja:'初レポート', en:'First report' },
    },
    {
      id: 'str3', icon: '🔥',
      name: { zh:'3天连击', ja:'3日連続', en:'3-Day Streak' },
      desc: { zh:'连续3天学习', ja:'3日連続', en:'3 days in a row' },
    },
    {
      id: 'str7', icon: '💎',
      name: { zh:'一周无间断', ja:'1週間連続', en:'7-Day Streak' },
      desc: { zh:'连续7天', ja:'7日連続', en:'7 days straight' },
    },
    {
      id: 'pts100', icon: '🏆',
      name: { zh:'百分达成', ja:'100点突破', en:'100 Points' },
      desc: { zh:'累积100积分', ja:'100pt', en:'Earn 100 pts' },
    },
    {
      id: 'all', icon: '🎯',
      name: { zh:'全科完成', ja:'全科目完了', en:'All Done' },
      desc: { zh:'一天完成所有科目', ja:'全科目完了', en:'All subjects in a day' },
    },
    {
      id: 'pts500', icon: '👑',
      name: { zh:'学霸', ja:'秀才', en:'Scholar' },
      desc: { zh:'累积500积分', ja:'500pt', en:'Earn 500 pts' },
    },
  ],

  REWARD_TEMPLATES: [
    { id: 'r1', icon: '🎮', name: { zh:'游戏30分钟', ja:'ゲーム30分', en:'30min Gaming' },      cost: 50,  gradient: 'linear-gradient(135deg,#667eea,#764ba2)', text: '#fff' },
    { id: 'r2', icon: '🍦', name: { zh:'选一个冰淇淋', ja:'アイス1個', en:'Any Ice Cream' },    cost: 80,  gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', text: '#fff' },
    { id: 'r3', icon: '🎬', name: { zh:'看一部电影', ja:'映画1本', en:'Watch a Movie' },         cost: 150, gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', text: '#fff' },
    { id: 'r4', icon: '🛍️', name: { zh:'购买一个心愿', ja:'欲しいもの', en:'A Wish Come True' }, cost: 300, gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', text: '#1a1a1a' },
    { id: 'r5', icon: '🎪', name: { zh:'出去玩一天', ja:'1日お出かけ', en:'A Fun Day Out' },     cost: 500, gradient: 'linear-gradient(135deg,#fa709a,#fee140)', text: '#fff' },
  ],

  render() {
    const el = document.getElementById('rewardsView');
    if (!el) return;

    const next    = this.REWARD_TEMPLATES.find(r => r.cost > S.points);
    const pct     = next ? Math.min(100, Math.round((S.points / next.cost) * 100)) : 100;
    const progHint = next
      ? t('pts_next', { n: next.cost - S.points })
      : (I18n.lang === 'en' ? '🎉 All unlocked!' : I18n.lang === 'ja' ? '🎉 全部解禁！' : '🎉 全部解锁！');

    const earned = this.getEarned();

    el.innerHTML = `
      <!-- Points hero -->
      <div class="pts-hero">
        <div class="pts-big">${S.points}</div>
        <div class="pts-sub">${t('pts_lbl')}</div>
        <div class="prog-w"><div class="prog-f" style="width:${pct}%"></div></div>
        <div class="prog-h">${progHint}</div>
      </div>

      <!-- Weekly check-in -->
      <p class="sec-label">${t('lbl_week')}</p>
      <div class="card" style="padding:14px 18px 10px">
        <div class="week-row">${this._weekHtml()}</div>
      </div>

      <!-- Badges -->
      <p class="sec-label">${t('lbl_badges')}</p>
      <div class="badge-grid">
        ${this.BADGES.map(b => `
          <div class="badge-item ${earned.has(b.id) ? 'earned' : ''}">
            <span class="bi-icon">${b.icon}</span>
            <div class="bi-name">${b.name[I18n.lang] || b.name.zh}</div>
            <div class="bi-desc">${b.desc[I18n.lang] || b.desc.zh}</div>
          </div>`).join('')}
      </div>

      <!-- Redeem -->
      <p class="sec-label">${t('lbl_redeem')}</p>
      <div class="rew-list">
        ${this.REWARD_TEMPLATES.map(r => `
          <div class="rew-item">
            <div class="ri-l">
              <div class="ri-icon">${r.icon}</div>
              <div>
                <div class="ri-name">${r.name[I18n.lang] || r.name.zh}</div>
                <div class="ri-cost">⭐ ${r.cost} ${t('pts_lbl')}</div>
              </div>
            </div>
            <button class="claim-btn" ${S.points < r.cost ? 'disabled' : ''}
                    onclick="Rewards.claim('${r.id}')">${t('redeem')}</button>
          </div>`).join('')}
      </div>

      <!-- Coupon gallery -->
      <p class="sec-label">${t('lbl_coupons')}</p>
      ${this._couponGalleryHtml()}
    `;
  },

  _weekHtml() {
    const days  = t('days');
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d   = new Date(today);
      d.setDate(today.getDate() - today.getDay() + i);
      const key  = dateKey(d);
      const done = !!Object.values(S.history[key] || {}).find(r => r.done);
      const isTd = key === todayKey();
      return `<div class="wd ${done ? 'done' : ''} ${isTd && !done ? 'today' : ''}">${days[i]}</div>`;
    }).join('');
  },

  _couponGalleryHtml() {
    if (!S.coupons.length) {
      return `<div class="info-card">${t('no_coupons')}</div>`;
    }
    return `<div class="coupon-gallery">
      ${S.coupons.map((c, idx) => `
        <div class="coupon-card" style="background:${c.gradient};color:${c.text}"
             onclick="Rewards.openCoupon(${idx})">
          ${c.used ? `<div class="coupon-used">${t('coupon_used')}</div>` : ''}
          <div class="coupon-top">
            <span class="coupon-icon">${c.icon}</span>
            <div>
              <div class="coupon-name">${c.name}</div>
              <div class="coupon-sub">${c.date}</div>
            </div>
          </div>
          <div class="coupon-code"># ${c.code}</div>
        </div>`).join('')}
    </div>`;
  },

  // ── Manually adjust points ───────────────────────────────
  async adjPoints(delta) {
    S.points = Math.max(0, S.points + delta);
    saveLocal();
    this.render();
    if (window.Auth?.user) await Auth.saveUserData();
  },

  // ── Claim reward → generate coupon ───────────────────────
  async claim(id) {
    const tmpl = this.REWARD_TEMPLATES.find(r => r.id === id);
    if (!tmpl || S.points < tmpl.cost) return;

    S.points -= tmpl.cost;

    const coupon = {
      id:       'c' + Date.now(),
      icon:     tmpl.icon,
      name:     tmpl.name[I18n.lang] || tmpl.name.zh,
      cost:     tmpl.cost,
      gradient: tmpl.gradient,
      text:     tmpl.text,
      date:     todayKey(),
      code:     Math.random().toString(36).slice(2,8).toUpperCase(),
      used:     false,
    };
    S.coupons.unshift(coupon);
    saveLocal();

    confetti();
    showToast(t('claim_ok'));
    this.render();

    // Open the newly generated coupon
    this.openCoupon(0);

    // Sync to Firestore
    if (window.Auth?.user) await Auth.saveUserData();
  },

  // ── Coupon detail modal ───────────────────────────────────
  openCoupon(idx) {
    const c = S.coupons[idx];
    if (!c) return;
    const box = document.getElementById('couponBox');
    box.innerHTML = `
      <div style="background:${c.gradient};border-radius:20px;padding:32px 24px;text-align:center;color:${c.text};margin-bottom:16px;position:relative">
        <div style="font-size:56px;margin-bottom:12px">${c.icon}</div>
        <div style="font-size:22px;font-weight:900;margin-bottom:6px">${c.name}</div>
        <div style="font-size:13px;opacity:.8;margin-bottom:16px">${c.date}</div>
        <div style="background:rgba(255,255,255,.2);border-radius:12px;padding:12px;font-size:20px;font-weight:900;letter-spacing:.2em">
          ${c.code}
        </div>
        ${c.used ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,.4);border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#fff">${t('coupon_used')}</div>` : ''}
      </div>
      <div style="display:flex;gap:10px">
        ${!c.used ? `<button class="mconfirm" onclick="Rewards.useCoupon('${c.id}')">${I18n.lang==='en'?'Mark as Used':I18n.lang==='ja'?'使用済みにする':'标记为已使用'}</button>` : ''}
        <button class="mcancel" onclick="document.getElementById('couponModal').classList.remove('open')" style="flex:1">${t('btn_cancel')}</button>
      </div>`;
    document.getElementById('couponModal').classList.add('open');
  },

  closeCoupon(e) {
    if (e.target === document.getElementById('couponModal')) {
      document.getElementById('couponModal').classList.remove('open');
    }
  },

  async useCoupon(id) {
    const c = S.coupons.find(x => x.id === id);
    if (c) c.used = true;
    saveLocal();
    document.getElementById('couponModal').classList.remove('open');
    this.render();
    if (window.Auth?.user) await Auth.saveUserData();
  },

  // ── Badge logic ───────────────────────────────────────────
  getEarned() {
    const e    = new Set();
    const days = Object.keys(S.history).length;
    if (days >= 1)      e.add('first');
    if (S.streak >= 3)  e.add('str3');
    if (S.streak >= 7)  e.add('str7');
    if (S.points >= 100) e.add('pts100');
    if (S.points >= 500) e.add('pts500');
    const td = S.history[todayKey()];
    const enabled = S.subjects.filter(s => s.enabled);
    if (td && enabled.length > 0 && enabled.every(s => td[s.id]?.done)) e.add('all');
    return e;
  },
};

window.Rewards = Rewards;
