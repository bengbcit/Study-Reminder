/* notion.js — 📋 Notion-style study checkin panel
   Features:
   - Editable task list (add/remove/rename tasks with time-of-day labels)
   - Time filter tabs: All / Morning / AM / PM / Evening
   - Working checkboxes that save state locally
   - Summary input
   - Sync to Notion database via /api/notion serverless endpoint
   - Fully i18n (zh/ja/en)
*/

// Default custom tasks (separate from subjects — user can freely edit)
const DEFAULT_NOTION_TASKS = [
  { id: 'nt1', text: '日语单词：晨间快速过 20 个新词', time: 'morning', done: false },
  { id: 'nt2', text: '运动：有氧 / 力量训练 (30-60min)', time: 'morning', done: false },
  { id: 'nt3', text: '日语单词：新词 50 个 (30min)',    time: 'am',      done: false },
  { id: 'nt4', text: 'AI 知识点学习 (30min)',            time: 'pm',      done: false },
  { id: 'nt5', text: 'Python 学习 + 代码实践 (60min)',   time: 'pm',      done: false },
  { id: 'nt6', text: 'Claude Code + Vibe Coding',        time: 'evening', done: false },
  { id: 'nt7', text: '今日完成度总结 / 明日任务规划',   time: 'evening', done: false },
];

const TIME_FILTERS = ['all', 'morning', 'am', 'pm', 'evening'];

const Notion = {
  _activeFilter: 'all',
  _editMode:     false,

  // ── Entry point ───────────────────────────────────────────
  open() {
    const modal = document.getElementById('notionModal');
    if (!modal) return;
    // Init tasks from state if not set
    if (!S.notionTasks || !S.notionTasks.length) {
      S.notionTasks = JSON.parse(JSON.stringify(DEFAULT_NOTION_TASKS));
      saveLocal();
    }
    this._activeFilter = 'all';
    this._editMode     = false;
    modal.classList.add('open');
    this._render();
  },

  close(e) {
    const modal = document.getElementById('notionModal');
    if (!e || e.target === modal) {
      modal?.classList.remove('open');
      this._editMode = false;
    }
  },

  // ── Main render ───────────────────────────────────────────
  _render() {
    const box = document.getElementById('notionBox');
    if (!box) return;

    const l          = I18n.lang;
    const hasConfig  = !!(S.notionToken && S.notionDbId);
    const tasks      = S.notionTasks || [];
    const today      = todayKey();
    const doneCount  = tasks.filter(t => t.done).length;

    const timeLabels = {
      morning: t('notion_time_morning'),
      am:      t('notion_time_am'),
      pm:      t('notion_time_pm'),
      evening: t('notion_time_evening'),
    };

    // Filter tabs
    const filterHtml = TIME_FILTERS.map(f => {
      const label = f === 'all'
        ? t('notion_time_all')
        : timeLabels[f];
      return `<button class="nf-tab ${this._activeFilter === f ? 'active' : ''}"
                      onclick="Notion._setFilter('${f}')">${label}</button>`;
    }).join('');

    // Task list
    const filtered = this._activeFilter === 'all'
      ? tasks
      : tasks.filter(tk => tk.time === this._activeFilter);

    const taskHtml = filtered.map((tk, visIdx) => {
      // Find real index in full array
      const realIdx = tasks.indexOf(tk);
      const timeLbl = timeLabels[tk.time] || tk.time;

      if (this._editMode) {
        return `
          <div class="notion-task-row edit-mode">
            <select class="notion-time-sel" onchange="Notion._setTaskTime(${realIdx},this.value)">
              ${['morning','am','pm','evening'].map(tv =>
                `<option value="${tv}" ${tk.time===tv?'selected':''}>${timeLabels[tv]}</option>`
              ).join('')}
            </select>
            <input class="notion-task-edit-input" value="${_esc(tk.text)}"
                   oninput="Notion._editTaskText(${realIdx},this.value)"
                   placeholder="${t('notion_task_ph')}">
            <button class="notion-del-btn" onclick="Notion._deleteTask(${realIdx})">✕</button>
          </div>`;
      }

      return `
        <div class="notion-task-row ${tk.done ? 'done' : ''}"
             onclick="Notion._toggle(${realIdx})">
          <div class="notion-task-check ${tk.done ? 'checked' : ''}">
            ${tk.done ? `<svg width="11" height="9" viewBox="0 0 11 9"><path d="M1 4l3 3 6-6" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>` : ''}
          </div>
          <span class="notion-task-name ${tk.done ? 'striked' : ''}">${_esc(tk.text)}</span>
          <span class="notion-time-badge">${timeLbl}</span>
        </div>`;
    }).join('') || `<p class="notion-empty">${t('notion_no_subjects')}</p>`;

    // Summary input
    const summaryHtml = `
      <div class="notion-summary-row">
        <textarea class="notion-summary" id="notionSummary"
                  placeholder="${t('notion_summary_ph')}"
                  oninput="Notion._saveSummary(this.value)">${_esc(S.notionDraftSummary || '')}</textarea>
      </div>`;

    // Recent syncs
    const recentHtml = (S.notionSyncedPages || []).slice(0, 5).map(p => `
      <div class="notion-synced-row">
        <span>📄 ${p.date}</span>
        <a href="${p.url || '#'}" target="_blank" rel="noopener" class="notion-open-link">
          ${t('notion_open')} ↗
        </a>
      </div>`).join('') || `<p class="notion-empty">${t('notion_no_sync')}</p>`;

    box.innerHTML = `
      <!-- ── Header ─────────────────────────────────────── -->
      <div class="notion-header">
        <div class="notion-logo">${_notionIcon()}</div>
        <div class="notion-header-title">${t('notion_title')}</div>
        <button class="notion-edit-toggle ${this._editMode ? 'active' : ''}"
                onclick="Notion._toggleEdit()">
          ${t('notion_edit_tasks')}
        </button>
        <button class="notion-close-btn" onclick="Notion.close()">&times;</button>
      </div>

      <!-- ── Progress bar ──────────────────────────────── -->
      <div class="notion-progress-wrap">
        <div class="notion-progress-bar">
          <div class="notion-progress-fill"
               style="width:${tasks.length ? Math.round(doneCount/tasks.length*100) : 0}%"></div>
        </div>
        <span class="notion-progress-lbl">${doneCount} / ${tasks.length}</span>
      </div>

      <!-- ── Filter tabs ────────────────────────────────── -->
      <div class="notion-filter-tabs">${filterHtml}</div>

      <!-- ── Task list ──────────────────────────────────── -->
      <div class="notion-task-list" id="notionTaskList">
        ${taskHtml}
      </div>

      <!-- ── Add task (edit mode only) ─────────────────── -->
      ${this._editMode ? `
      <button class="notion-add-task-btn" onclick="Notion._addTask()">
        ${t('notion_add_task')}
      </button>` : ''}

      <!-- ── Summary ────────────────────────────────────── -->
      ${summaryHtml}

      <!-- ── Sync to Notion ─────────────────────────────── -->
      ${hasConfig ? `
      <div class="notion-sync-section">
        <button class="notion-sync-btn" id="notionSyncBtn" onclick="Notion.syncToNotion()">
          <span id="notionSyncIcon">📤</span> ${t('notion_sync_btn')}
        </button>
        <div class="notion-synced-list">${recentHtml}</div>
      </div>
      ` : `
      <div class="notion-config-section">
        <div class="notion-cfg-label">${t('notion_setup_label')}</div>
        <input class="notion-input" id="notionToken" type="password"
               placeholder="${t('notion_token_ph')}"
               value="${S.notionToken || ''}">
        <input class="notion-input" id="notionDbId"
               placeholder="${t('notion_db_ph')}"
               value="${S.notionDbId || ''}">
        <p class="notion-cfg-hint">${t('notion_hint')}</p>
        <button class="notion-save-cfg-btn" onclick="Notion._saveConfig()">${t('notion_save_cfg')}</button>
      </div>
      `}
    `;
  },

  // ── Toggle checkbox ───────────────────────────────────────
  _toggle(idx) {
    if (!S.notionTasks[idx]) return;
    S.notionTasks[idx].done = !S.notionTasks[idx].done;
    saveLocal();
    this._render();
  },

  // ── Filter ────────────────────────────────────────────────
  _setFilter(f) {
    this._activeFilter = f;
    this._render();
  },

  // ── Edit mode ─────────────────────────────────────────────
  _toggleEdit() {
    this._editMode = !this._editMode;
    this._render();
  },

  _editTaskText(idx, val) {
    if (S.notionTasks[idx]) S.notionTasks[idx].text = val;
    saveLocal();
  },

  _setTaskTime(idx, val) {
    if (S.notionTasks[idx]) S.notionTasks[idx].time = val;
    saveLocal();
    this._render();
  },

  _deleteTask(idx) {
    S.notionTasks.splice(idx, 1);
    saveLocal();
    this._render();
  },

  _addTask() {
    S.notionTasks.push({
      id:   'nt' + Date.now(),
      text: '',
      time: this._activeFilter !== 'all' ? this._activeFilter : 'am',
      done: false,
    });
    saveLocal();
    this._render();
    // Focus the new input
    setTimeout(() => {
      const inputs = document.querySelectorAll('.notion-task-edit-input');
      inputs[inputs.length - 1]?.focus();
    }, 50);
  },

  // ── Summary ───────────────────────────────────────────────
  _saveSummary(val) {
    S.notionDraftSummary = val;
    saveLocal();
  },

  // ── Notion config ─────────────────────────────────────────
  _saveConfig() {
    S.notionToken = document.getElementById('notionToken')?.value.trim() || '';
    S.notionDbId  = document.getElementById('notionDbId')?.value.trim()  || '';
    saveLocal();
    if (window.Auth?.user) Auth.saveUserData();
    showToast(t('notion_cfg_saved'));
    this._render();
  },

  // ── Sync to Notion via serverless proxy ──────────────────
  async syncToNotion() {
    if (!S.notionToken || !S.notionDbId) {
      showToast(t('notion_no_config'));
      return;
    }
    const syncBtn  = document.getElementById('notionSyncBtn');
    const syncIcon = document.getElementById('notionSyncIcon');
    if (syncBtn) syncBtn.disabled = true;
    if (syncIcon) syncIcon.textContent = '⏳';

    const today    = todayKey();
    const tasks    = S.notionTasks || [];
    const summary  = S.notionDraftSummary || '';
    const doneCount = tasks.filter(tk => tk.done).length;

    try {
      const res = await fetch('/api/notion', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token:      S.notionToken,
          dbId:       S.notionDbId,
          date:       today,
          tasks,
          summary,
          doneCount,
          totalCount: tasks.length,
          points:     S.points,
          streak:     S.streak,
          lang:       I18n.lang,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'HTTP ' + res.status);
      }
      const data = await res.json();
      if (!S.notionSyncedPages) S.notionSyncedPages = [];
      S.notionSyncedPages.unshift({ date: today, url: data.url || '#' });
      S.notionSyncedPages = S.notionSyncedPages.slice(0, 20);
      saveLocal();
      if (window.Auth?.user) Auth.saveUserData();
      showToast(t('notion_synced'));
      if (syncIcon) syncIcon.textContent = '✅';
    } catch (e) {
      console.warn('Notion sync:', e.message);
      showToast(`${t('notion_sync_fail')}: ${e.message}`);
      if (syncIcon) syncIcon.textContent = '📤';
    }
    if (syncBtn) syncBtn.disabled = false;
  },
};

window.Notion = Notion;

// ── Helpers ───────────────────────────────────────────────────
function _esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _notionIcon() {
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="5" fill="#000"/>
    <path d="M6 5.5h8.5L18 9v10H6V5.5z" fill="rgba(255,255,255,0.08)"/>
    <text x="4.5" y="17.5" font-size="12" font-weight="900" fill="#fff" font-family="Georgia,serif">N</text>
  </svg>`;
}
