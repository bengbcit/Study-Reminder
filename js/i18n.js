/* i18n.js — Internationalization module (zh / ja / en)
   KEY FIX: I18n.set() now calls window._refreshAuthGate() so the login
   form re-renders in the new language immediately when user switches language.
*/

const I18N = {
  zh: {
    appTitle: '学习星球',
    tab_sub: '📚 课程', tab_rem: '⏰ 提醒', tab_timer: '⏱ 计时',
    tab_rep: '📝 简报', tab_cal: '📅 日历', tab_stats: '📊 统计', tab_rew: '⭐ 奖励',
    lbl_sub: '我的学习科目', lbl_noti: '提醒方式', lbl_time: '每日提醒时间',
    lbl_rep: '今日学习简报',
    note_sub: '开关暂停科目（保留记录）。保存后当天日历自动更新。',
    btn_add: '添加科目', btn_save: '💾 保存设置',
    btn_add_cal: '📅 把今天课程加入邮件日历',
    n_email: '邮件', n_push: '浏览器', n_discord: 'Discord',
    email_lbl: '📧 收件邮箱（Gmail / Hotmail 等）',
    email_note: '简报提交后自动发到此邮箱',
    push_lbl: '🔔 提前提醒时间',
    push_note: '页面打开时生效，在页面顶部弹出横幅＋提示音',
    push_preview_btn: '👀 立即预览提醒效果',
    discord_title: '🎮 Discord Webhook 设置（最简单，无需账号）',
    discord_step1: '打开 Discord → 进入你的频道 → 点击右上角 <b>齿轮设置</b>',
    discord_step2: '左侧选 <b>Integrations</b> → <b>Webhooks</b> → <b>New Webhook</b>',
    discord_step3: '点击 <b>Copy Webhook URL</b>，贴到下方',
    discord_step4: '点测试按钮，Discord 频道会收到消息 ✅',
    discord_test_btn: '🎮 发送测试消息',
    discord_note: '✅ 完全免费 · 无需 Bot · 一个 URL 搞定 · 支持富文本消息',
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
    modal_add: '添加新科目', modal_edit: '编辑科目', dur_lbl: '每天', dur_min: '分钟',
    pick_icon: '图标', pick_color: '颜色', pick_bg: '背景颜色',
    btn_cancel: '取消', btn_add2: '添加', btn_save2: '保存',
    save_ok: '✅ 设置已保存！', send_ok: '✅ 简报已发送！',
    tg_ok: '✅ Discord 测试成功！', claim_ok: '🎉 兑换成功！',
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
    email_field: '邮箱', password_field: '密码', name_field: '昵称（可选）',
    google_login: 'Google 登录',
    auth_fill_both: '请输入邮箱和密码',
    auth_pw_short: '密码至少需要6位',
    days: ['日','一','二','三','四','五','六'],
    months: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
    redeem: '兑换', no_rec: '这天没有学习记录',
    no_coupons: '还没有奖励券，快去兑换吧！',
    cal_tip: '🟠 有记录  🟢 全部完成  点击查看详情',
    pts_earn: '积分',
    // Notion
    notion_btn: '📋 打卡',
    notion_title: 'Notion 打卡记录',
    notion_setup_label: '⚙️ 设置 Notion 集成',
    notion_token_ph: 'Notion Integration Token (secret_xxx…)',
    notion_db_ph: '数据库 ID（URL 中的32位字符）',
    notion_hint: '在 Notion 创建 Integration → 分享给数据库 → 粘贴 Token 和 Database ID',
    notion_save_cfg: '💾 保存配置',
    notion_tasks_label: '今日任务',
    notion_summary_ph: '今日学习总结…',
    notion_sync_btn: '同步到 Notion',
    notion_recent_label: '📄 最近同步',
    notion_open: '打开',
    notion_no_sync: '还没有同步记录',
    notion_no_subjects: '请先在课程页面添加科目',
    notion_not_cfg: '尚未配置 Notion',
    notion_not_cfg_hint: '在上方填入 Token 和 Database ID 即可开始同步',
    notion_cfg_saved: '✅ Notion 配置已保存',
    notion_synced: '✅ 已同步到 Notion！',
    notion_sync_fail: '同步失败',
    notion_no_config: '请先填写 Notion Token 和数据库 ID',
    notion_edit_tasks: '编辑任务',
    notion_add_task: '＋ 添加任务',
    notion_task_ph: '任务内容…',
    notion_time_all: '全部',
    notion_time_morning: '晨间',
    notion_time_am: '上午',
    notion_time_pm: '下午',
    notion_time_evening: '晚间',
    no_subjects_enabled: '请先在「课程设置」中启用科目',
    timer_done_badge: '⏱ 计时完成',
    // Theme
    theme_btn: '🎨',
    theme_title: '背景主题',
    theme_default: '默认',
    theme_saved: '✅ 主题已保存',
  },
  ja: {
    appTitle: 'スタディプラネット',
    tab_sub: '📚 科目', tab_rem: '⏰ リマインド', tab_timer: '⏱ タイマー',
    tab_rep: '📝 レポート', tab_cal: '📅 カレンダー', tab_stats: '📊 統計', tab_rew: '⭐ 報酬',
    lbl_sub: '学習科目', lbl_noti: '通知方法', lbl_time: '毎日の通知時刻',
    lbl_rep: '今日の学習レポート',
    note_sub: 'トグルで停止（記録は残ります）。保存するとカレンダーが更新されます。',
    btn_add: '科目を追加', btn_save: '💾 保存',
    btn_add_cal: '📅 今日の科目をカレンダーに追加',
    n_email: 'メール', n_push: 'ブラウザ', n_discord: 'Discord',
    email_lbl: '📧 受信メールアドレス',
    email_note: 'レポート提出後に自動送信',
    push_lbl: '🔔 事前通知',
    push_note: 'ページが開いている間バナーと音で通知',
    push_preview_btn: '👀 通知をプレビュー',
    discord_title: '🎮 Discord Webhook 設定（簡単・アカウント不要）',
    discord_step1: 'Discord を開く → チャンネルに入る → ⚙️ チャンネル設定',
    discord_step2: 'Integrations → Webhooks → New Webhook',
    discord_step3: 'Copy Webhook URL をコピーして下に貼り付け',
    discord_step4: 'テストボタンを押す → Discord にメッセージが届く ✅',
    discord_test_btn: '🎮 テストメッセージを送信',
    discord_note: '✅ 完全無料 · Bot不要 · URLのみ · リッチテキスト対応',
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
    modal_add: '新しい科目', modal_edit: '科目を編集', dur_lbl: '毎日', dur_min: '分',
    pick_icon: 'アイコン', pick_color: 'カラー', pick_bg: '背景色',
    btn_cancel: 'キャンセル', btn_add2: '追加', btn_save2: '保存',
    save_ok: '✅ 保存しました！', send_ok: '✅ 送信しました！',
    tg_ok: '✅ Discord テスト成功！', claim_ok: '🎉 交換成功！',
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
    email_field: 'メール', password_field: 'パスワード', name_field: 'ニックネーム（任意）',
    google_login: 'Googleでログイン',
    auth_fill_both: 'メールとパスワードを入力してください',
    auth_pw_short: 'パスワードは6文字以上にしてください',
    days: ['日','月','火','水','木','金','土'],
    months: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
    redeem: '交換', no_rec: 'この日の記録はありません',
    no_coupons: 'まだクーポンがありません！',
    cal_tip: '🟠 記録あり  🟢 全完了  タップで詳細',
    pts_earn: 'ポイント',
    // Notion
    notion_btn: '📋 打卡',
    notion_title: 'Notion 学習ログ',
    notion_setup_label: '⚙️ Notion 連携設定',
    notion_token_ph: 'Notion Integration Token (secret_xxx…)',
    notion_db_ph: 'データベース ID（URLの32文字）',
    notion_hint: 'Notion で Integration 作成 → データベースに共有 → Token と DB ID を貼り付け',
    notion_save_cfg: '💾 設定を保存',
    notion_tasks_label: '今日のタスク',
    notion_summary_ph: '今日の学習まとめ…',
    notion_sync_btn: 'Notion に同期',
    notion_recent_label: '📄 最近の同期',
    notion_open: '開く',
    notion_no_sync: '同期記録はまだありません',
    notion_no_subjects: '先に科目を追加してください',
    notion_not_cfg: 'Notion が設定されていません',
    notion_not_cfg_hint: '上のフォームに Token と DB ID を入力してください',
    notion_cfg_saved: '✅ Notion 設定を保存しました',
    notion_synced: '✅ Notion に同期しました！',
    notion_sync_fail: '同期に失敗しました',
    notion_no_config: 'Notion Token と DB ID を入力してください',
    notion_edit_tasks: 'タスクを編集',
    notion_add_task: '＋ タスクを追加',
    notion_task_ph: 'タスク内容…',
    notion_time_all: 'すべて',
    notion_time_morning: '朝',
    notion_time_am: '午前',
    notion_time_pm: '午後',
    notion_time_evening: '夜',
    no_subjects_enabled: '先に科目設定で科目を有効にしてください',
    timer_done_badge: '⏱ タイマー完了',
    // Theme
    theme_btn: '🎨',
    theme_title: '背景テーマ',
    theme_default: 'デフォルト',
    theme_saved: '✅ テーマを保存しました',
  },
  en: {
    appTitle: 'Study Planet',
    tab_sub: '📚 Subjects', tab_rem: '⏰ Reminders', tab_timer: '⏱ Timer',
    tab_rep: '📝 Report', tab_cal: '📅 Calendar', tab_stats: '📊 Stats', tab_rew: '⭐ Rewards',
    lbl_sub: 'My Subjects', lbl_noti: 'Notifications', lbl_time: 'Daily Reminder Time',
    lbl_rep: "Today's Study Report",
    note_sub: "Toggle to pause subjects (history kept). Save to update today's calendar.",
    btn_add: 'Add Subject', btn_save: '💾 Save Settings',
    btn_add_cal: "📅 Add today's subjects to email calendar",
    n_email: 'Email', n_push: 'Browser', n_discord: 'Discord',
    email_lbl: '📧 Recipient Email (Gmail, Hotmail, etc.)',
    email_note: 'Reports are auto-emailed here',
    push_lbl: '🔔 Remind Before',
    push_note: 'Shows a banner + sound while the page is open',
    push_preview_btn: '👀 Preview Reminder Now',
    discord_title: '🎮 Discord Webhook Setup (easiest, no account needed)',
    discord_step1: 'Open Discord → go to your channel → click the ⚙️ gear icon',
    discord_step2: 'Select Integrations → Webhooks → New Webhook',
    discord_step3: 'Click Copy Webhook URL and paste it below',
    discord_step4: 'Hit the test button — your channel gets a message ✅',
    discord_test_btn: '🎮 Send Test Message',
    discord_note: '✅ Free · No bot needed · One URL · Rich text support',
    t_start: 'Start Time', t_ontime: 'On time',
    rep_email_lbl: 'Send to Email',
    btn_submit_all: "✉️ Submit Today's Report",
    sum_ph: 'What did you learn today?',
    hard_ph: 'What was challenging?',
    diff_lbl: 'Difficulty', done_lbl: 'Completed today',
    pts_lbl: 'Total Points', lbl_week: 'This Week',
    lbl_badges: 'Badges', lbl_redeem: 'Redeem',
    lbl_coupons: 'My Coupons',
    pts_next: '{n} more points to next reward',
    modal_add: 'Add New Subject', modal_edit: 'Edit Subject', dur_lbl: 'Daily', dur_min: 'min',
    pick_icon: 'Icon', pick_color: 'Color', pick_bg: 'Background Color',
    btn_cancel: 'Cancel', btn_add2: 'Add', btn_save2: 'Save',
    save_ok: '✅ Saved!', send_ok: '✅ Report sent!',
    tg_ok: '✅ Discord test sent!', claim_ok: '🎉 Redeemed!',
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
    email_field: 'Email', password_field: 'Password', name_field: 'Nickname (optional)',
    google_login: 'Sign in with Google',
    auth_fill_both: 'Please enter both email and password',
    auth_pw_short: 'Password must be at least 6 characters',
    days: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    redeem: 'Get', no_rec: 'No records for this day',
    no_coupons: 'No coupons yet — redeem some rewards!',
    cal_tip: '🟠 Has records  🟢 All done  Tap for details',
    pts_earn: 'pts',
    // Notion
    notion_btn: '📋 Log',
    notion_title: 'Notion Study Log',
    notion_setup_label: '⚙️ Notion Integration Setup',
    notion_token_ph: 'Notion Integration Token (secret_xxx…)',
    notion_db_ph: 'Database ID (32-char string from URL)',
    notion_hint: 'Create an Integration in Notion → Share with your DB → Paste Token & DB ID',
    notion_save_cfg: '💾 Save Config',
    notion_tasks_label: "Today's Tasks",
    notion_summary_ph: 'Study summary for today…',
    notion_sync_btn: 'Sync to Notion',
    notion_recent_label: '📄 Recent Syncs',
    notion_open: 'Open',
    notion_no_sync: 'No syncs yet',
    notion_no_subjects: 'Add subjects first in the Subjects tab',
    notion_not_cfg: 'Notion not configured',
    notion_not_cfg_hint: 'Fill in the Token and Database ID above to get started',
    notion_cfg_saved: '✅ Notion config saved',
    notion_synced: '✅ Synced to Notion!',
    notion_sync_fail: 'Sync failed',
    notion_no_config: 'Please enter your Notion Token and Database ID',
    notion_edit_tasks: 'Edit Tasks',
    notion_add_task: '＋ Add Task',
    notion_task_ph: 'Task description…',
    notion_time_all: 'All',
    notion_time_morning: 'Morning',
    notion_time_am: 'AM',
    notion_time_pm: 'PM',
    notion_time_evening: 'Evening',
    no_subjects_enabled: 'Enable subjects in the Subjects tab first',
    timer_done_badge: '⏱ Timer done',
    // Theme
    theme_btn: '🎨',
    theme_title: 'Background Theme',
    theme_default: 'Default',
    theme_saved: '✅ Theme saved',
  }
};

const I18n = {
  // Restore last-used language from localStorage (default: 'zh')
  lang: (['zh','ja','en'].includes(localStorage.getItem('ss_lang'))
         ? localStorage.getItem('ss_lang') : 'zh'),

  set(l) {
    this.lang = l;
    // Persist so language survives page reload
    localStorage.setItem('ss_lang', l);

    // ── Language toggle buttons ────────────────────────────
    document.querySelectorAll('.lb').forEach(b => {
      const map = { zh:'中', ja:'日', en:'EN' };
      b.classList.toggle('active', b.textContent.trim() === map[l]);
    });
    document.documentElement.lang = l;

    // ── All static data-i18n elements ─────────────────────
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if (I18N[l]?.[k] !== undefined) el.textContent = I18N[l][k];
    });

    // ── data-i18n-html (for HTML content like bold tags) ──
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const k = el.getAttribute('data-i18n-html');
      if (I18N[l]?.[k] !== undefined) el.innerHTML = I18N[l][k];
    });

    // ── App title ──────────────────────────────────────────
    const appTitle = document.getElementById('appTitle');
    if (appTitle) appTitle.textContent = this.t('appTitle');

    // ── Nav tab labels ─────────────────────────────────────
    document.querySelectorAll('.tabs .tab').forEach(btn => {
      const key = btn.getAttribute('data-i18n');
      if (key && I18N[l]?.[key]) btn.textContent = I18N[l][key];
    });

    // ── AUTH GATE: re-render login form in new language ────
    // This is the KEY fix — always refresh auth gate on lang switch
    if (typeof window._refreshAuthGate === 'function') {
      window._refreshAuthGate();
    }

    // ── Notion tab button text ─────────────────────────────
    const notionBtn = document.getElementById('notionTabBtn');
    if (notionBtn) notionBtn.textContent = this.t('notion_btn');

    // ── Re-render all dynamic page views ──────────────────
    if (window.Subjects) Subjects.render();
    if (window.Report)   Report.render();
    if (window.Rewards)  Rewards.render();
    if (window.Cal)      Cal.render();
    if (window.Stats)    Stats.render();
    if (window.Timer)    Timer.render();
    // Sync remind page input values so they reflect the correct language context
    if (window.Remind)   Remind.syncUI();
    // Re-render Notion modal content if it is currently open
    if (window.Notion && document.getElementById('notionModal')?.classList.contains('open')) {
      Notion._render();
    }

    // ── Select dropdowns ───────────────────────────────────
    this.updateSelects();
  },

  t(k, vars) {
    // Fallback chain: current lang → zh → key itself
    let s = (I18N[this.lang]?.[k]) ?? (I18N.zh?.[k]) ?? k;
    if (vars) Object.keys(vars).forEach(v => { s = s.replace('{' + v + '}', vars[v]); });
    return s;
  },

  updateSelects() {
    const sel = document.getElementById('remindBefore');
    if (!sel) return;
    const l = this.lang;
    const opts = l === 'en'
      ? [[0,'On time'],[5,'5 min before'],[10,'10 min before'],[15,'15 min before'],[30,'30 min before']]
      : l === 'ja'
      ? [[0,'時刻通り'],[5,'5分前'],[10,'10分前'],[15,'15分前'],[30,'30分前']]
      : [[0,'准时'],[5,'5 分钟前'],[10,'10 分钟前'],[15,'15 分钟前'],[30,'30 分钟前']];
    const cur = sel.value;
    sel.innerHTML = opts.map(([v, lbl]) => `<option value="${v}">${lbl}</option>`).join('');
    sel.value = cur;
  }
};

function t(k, vars) { return I18n.t(k, vars); }
