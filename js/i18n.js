/* i18n.js — Internationalization module (zh / ja / en) */

const I18N = {
  zh: {
    appTitle: '学习小星星',
    tab_sub: '📚 课程', tab_rem: '⏰ 提醒', tab_timer: '⏱ 计时',
    tab_rep: '📝 简报', tab_cal: '📅 日历', tab_stats: '📊 统计', tab_rew: '⭐ 奖励',
    lbl_sub: '我的学习科目', lbl_noti: '提醒方式', lbl_time: '每日提醒时间',
    lbl_rep: '今日学习简报',
    note_sub: '开关暂停科目（保留记录）。保存后当天日历自动更新。',
    btn_add: '添加科目', btn_save: '💾 保存设置',
    btn_add_cal: '📅 把今天课程加入邮件日历',
    n_email: '邮件', n_push: '浏览器',
    email_lbl: '📧 收件邮箱（Gmail / Hotmail 等）',
    email_note: '简报提交后自动发到此邮箱',
    push_lbl: '🔔 提前提醒时间',
    push_note: '页面打开期间有效，弹出横幅提醒',
    t_start: '开始时间', t_ontime: '准时',
    rep_email_lbl: '发送到邮箱',
    btn_submit_all: '✉️ 提交今日简报',
    sum_ph: '今天学了什么？有什么收获？',
    hard_ph: '遇到了什么难点？',
    diff_lbl: '难度', done_lbl: '今天完成了',
    pts_lbl: '总积分', lbl_week: '本周打卡',
    lbl_badges: '成就徽章', lbl_redeem: '积分兑换',
    lbl_coupons: '我的奖励券',
    pts_next: '再得 {n} 分解锁下一个奖励',
    modal_add: '添加新科目', dur_lbl: '每天', dur_min: '分钟',
    pick_icon: '图标', pick_color: '颜色',
    btn_cancel: '取消', btn_add2: '添加',
    save_ok: '✅ 设置已保存！', send_ok: '✅ 简报已发送！',
    tg_ok: '✅ Telegram 测试成功！', claim_ok: '🎉 兑换成功！',
    no_done: '请先勾选完成并填写总结', coupon_used: '已使用',
    timer_pick: '选择要计时的科目', timer_start: '开始',
    timer_pause: '暂停', timer_resume: '继续', timer_reset: '重置',
    timer_done: '🎉 完成！太棒了！', timer_running: '专注中…',
    stats_total_days: '学习天数', stats_total_pts: '累计积分',
    stats_streak: '连续天数', stats_subjects: '活跃科目',
    stats_weekly: '本周完成情况', stats_subject_dist: '科目分布',
    ai_label: '🤖 AI 专属鼓励',
    profile_title: '我的主页', profile_badges: '获得的徽章',
    profile_logout: '退出登录',
    login: '登录', register: '注册',
    email_field: '邮箱', password_field: '密码', name_field: '昵称',
    google_login: 'Google 登录',
    days: ['日','一','二','三','四','五','六'],
    months: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
    redeem: '兑换', no_rec: '这天没有学习记录',
    no_coupons: '还没有奖励券，快去兑换吧！',
    cal_tip: '🟠 有记录  🟢 全部完成  点击查看详情',
    pts_earn: '积分',
  },
  ja: {
    appTitle: 'スタディスター',
    tab_sub: '📚 科目', tab_rem: '⏰ リマインド', tab_timer: '⏱ タイマー',
    tab_rep: '📝 レポート', tab_cal: '📅 カレンダー', tab_stats: '📊 統計', tab_rew: '⭐ 報酬',
    lbl_sub: '学習科目', lbl_noti: '通知方法', lbl_time: '毎日の通知時刻',
    lbl_rep: '今日の学習レポート',
    note_sub: 'トグルで停止（記録は残ります）。保存するとカレンダーが更新されます。',
    btn_add: '科目を追加', btn_save: '💾 保存',
    btn_add_cal: '📅 今日の科目をカレンダーに追加',
    n_email: 'メール', n_push: 'ブラウザ',
    email_lbl: '📧 受信メールアドレス',
    email_note: 'レポート提出後に自動送信',
    push_lbl: '🔔 事前通知',
    push_note: 'ページを開いている間バナー表示',
    t_start: '開始時刻', t_ontime: '時刻通り',
    rep_email_lbl: '送信先メール',
    btn_submit_all: '✉️ レポートを提出',
    sum_ph: '今日何を学んだ？',
    hard_ph: '難しかった点は？',
    diff_lbl: '難易度', done_lbl: '完了した',
    pts_lbl: '合計ポイント', lbl_week: '今週',
    lbl_badges: 'バッジ', lbl_redeem: 'ポイント交換',
    lbl_coupons: 'クーポン',
    pts_next: 'あと {n} ポイントで次の報酬',
    modal_add: '新しい科目', dur_lbl: '毎日', dur_min: '分',
    pick_icon: 'アイコン', pick_color: 'カラー',
    btn_cancel: 'キャンセル', btn_add2: '追加',
    save_ok: '✅ 保存しました！', send_ok: '✅ 送信しました！',
    tg_ok: '✅ Telegram テスト成功！', claim_ok: '🎉 交換成功！',
    no_done: '完了チェックと内容を入力してください',
    coupon_used: '使用済み',
    timer_pick: '科目を選んでください', timer_start: 'スタート',
    timer_pause: '一時停止', timer_resume: '再開', timer_reset: 'リセット',
    timer_done: '🎉 完了！よくできました！', timer_running: '集中中…',
    stats_total_days: '学習日数', stats_total_pts: '累計ポイント',
    stats_streak: '連続日数', stats_subjects: 'アクティブ科目',
    stats_weekly: '今週の完了', stats_subject_dist: '科目分布',
    ai_label: '🤖 AIからの応援',
    profile_title: 'マイページ', profile_badges: '獲得バッジ',
    profile_logout: 'ログアウト',
    login: 'ログイン', register: '登録',
    email_field: 'メール', password_field: 'パスワード', name_field: 'ニックネーム',
    google_login: 'Googleでログイン',
    days: ['日','月','火','水','木','金','土'],
    months: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
    redeem: '交換', no_rec: 'この日の記録はありません',
    no_coupons: 'まだクーポンがありません！',
    cal_tip: '🟠 記録あり  🟢 全完了  タップで詳細',
    pts_earn: 'ポイント',
  },
  en: {
    appTitle: 'Study Stars',
    tab_sub: '📚 Subjects', tab_rem: '⏰ Reminders', tab_timer: '⏱ Timer',
    tab_rep: '📝 Report', tab_cal: '📅 Calendar', tab_stats: '📊 Stats', tab_rew: '⭐ Rewards',
    lbl_sub: 'My Subjects', lbl_noti: 'Notifications', lbl_time: 'Daily Reminder Time',
    lbl_rep: "Today's Study Report",
    note_sub: "Toggle to pause subjects (history kept). Save to update today's calendar.",
    btn_add: 'Add Subject', btn_save: '💾 Save Settings',
    btn_add_cal: '📅 Add today\'s subjects to email calendar',
    n_email: 'Email', n_push: 'Browser',
    email_lbl: '📧 Recipient Email (Gmail, Hotmail, etc.)',
    email_note: 'Reports are auto-emailed here',
    push_lbl: '🔔 Remind Before',
    push_note: 'Shows a banner while the page is open',
    t_start: 'Start Time', t_ontime: 'On time',
    rep_email_lbl: 'Send to Email',
    btn_submit_all: '✉️ Submit Today\'s Report',
    sum_ph: 'What did you learn today?',
    hard_ph: 'What was challenging?',
    diff_lbl: 'Difficulty', done_lbl: 'Completed today',
    pts_lbl: 'Total Points', lbl_week: 'This Week',
    lbl_badges: 'Badges', lbl_redeem: 'Redeem',
    lbl_coupons: 'My Coupons',
    pts_next: '{n} more points to next reward',
    modal_add: 'Add New Subject', dur_lbl: 'Daily', dur_min: 'min',
    pick_icon: 'Icon', pick_color: 'Color',
    btn_cancel: 'Cancel', btn_add2: 'Add',
    save_ok: '✅ Saved!', send_ok: '✅ Report sent!',
    tg_ok: '✅ Telegram test sent!', claim_ok: '🎉 Redeemed!',
    no_done: 'Check done and write a summary first',
    coupon_used: 'Used',
    timer_pick: 'Pick a subject to start', timer_start: 'Start',
    timer_pause: 'Pause', timer_resume: 'Resume', timer_reset: 'Reset',
    timer_done: '🎉 Done! Great job!', timer_running: 'Focusing…',
    stats_total_days: 'Study Days', stats_total_pts: 'Total Points',
    stats_streak: 'Streak', stats_subjects: 'Active Subjects',
    stats_weekly: 'Weekly Completion', stats_subject_dist: 'Subject Distribution',
    ai_label: '🤖 AI Encouragement',
    profile_title: 'My Profile', profile_badges: 'Earned Badges',
    profile_logout: 'Log Out',
    login: 'Login', register: 'Register',
    email_field: 'Email', password_field: 'Password', name_field: 'Nickname',
    google_login: 'Sign in with Google',
    days: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    redeem: 'Get', no_rec: 'No records for this day',
    no_coupons: 'No coupons yet — redeem some rewards!',
    cal_tip: '🟠 Has records  🟢 All done  Tap for details',
    pts_earn: 'pts',
  }
};

const I18n = {
  lang: 'zh',

  set(l) {
    this.lang = l;
    // Update lang buttons
    document.querySelectorAll('.lb').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.lb').forEach(b => {
      if (b.textContent.trim() === { zh:'中', ja:'日', en:'EN' }[l]) b.classList.add('active');
    });
    document.documentElement.lang = l;
    // Update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if (I18N[l][k] !== undefined) el.textContent = I18N[l][k];
    });
    document.getElementById('appTitle').textContent = this.t('appTitle');
    // Re-render dynamic views
    if (window.Subjects) Subjects.render();
    if (window.Report)   Report.render();
    if (window.Rewards)  Rewards.render();
    if (window.Cal)      Cal.render();
    if (window.Stats)    Stats.render();
    if (window.Timer)    Timer.render();
    this.updateSelects();
  },

  t(k, vars) {
    let s = (I18N[this.lang] && I18N[this.lang][k]) || k;
    if (vars) Object.keys(vars).forEach(v => { s = s.replace('{' + v + '}', vars[v]); });
    return s;
  },

  updateSelects() {
    const sel = document.getElementById('remindBefore');
    if (!sel) return;
    const opts = this.lang === 'en'
      ? [[0,'On time'],[5,'5 min before'],[10,'10 min before'],[15,'15 min before'],[30,'30 min before']]
      : this.lang === 'ja'
      ? [[0,'時刻通り'],[5,'5分前'],[10,'10分前'],[15,'15分前'],[30,'30分前']]
      : [[0,'准时'],[5,'5 分钟前'],[10,'10 分钟前'],[15,'15 分钟前'],[30,'30 分钟前']];
    const cur = sel.value;
    sel.innerHTML = opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    sel.value = cur;
  }
};

// Shorthand
function t(k, vars) { return I18n.t(k, vars); }
