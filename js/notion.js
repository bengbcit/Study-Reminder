/* js/notion.js — 📋 Notion to-do integration + local checkin panel
   When Notion token + database ID are configured:
     - Fetches real tasks from your Notion database on open
     - Toggling a checkbox syncs back to Notion immediately
     - Refresh button re-fetches from Notion
   When not configured: falls back to a local editable task list.
*/

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
  _loading:      false,
  _error:        '',
  _cbKey:        null,   // Notion checkbox property name (auto-detected)
  _selKey:       null,   // Notion select property name (auto-detected)

  // ── Open modal ───────────────────────────────────────────
  open() {
    const modal = document.getElementById('notionModal');
    if (!modal) return;
    if (!S.notionTasks || !S.notionTasks.length) {
      S.notionTasks = JSON.parse(JSON.stringify(DEFAULT_NOTION_TASKS));
      saveLocal();
    }
    this._activeFilter = 'all';
    this._editMode     = false;
    this._error        = '';
    modal.classList.add('open');

    if (S.notionToken && S.notionDbId) {
      this._fetchFromNotion();
    } else {
      this._render();
    }
  },

  close(e) {
    const modal = document.getElementById('notionModal');
    if (!e || e.target === modal) {
      modal?.classList.remove('open');
      this._editMode = false;
    }
  },

  // ── Fetch tasks from Notion database via serverless proxy ─
  async _fetchFromNotion() {
    this._loading = true;
    this._error   = '';
    this._render();
    try {
      const res = await fetch('/api/notion', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'query', token: S.notionToken, dbId: S.notionDbId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);

      this._cbKey  = data.cbKey  || null;
      this._selKey = data.selKey || null;

      S.notionTasks = (data.tasks || []).map(tk => ({
        id:        '_n_' + tk.id,
        text:      tk.text,
        time:      this._normTime(tk.time),
        done:      tk.done,
        _notionId: tk.id,
      }));
      saveLocal();
    } catch (e) {
      this._error = e.message;
      console.warn('[Notion fetch]', e.message);
    }
    this._loading = false;
    this._render();
  },

  // Map Notion select values → internal time categories
  _normTime(val) {
    if (!val) return '';
    const v = val.toLowerCase();
    if (v.includes('morning') || v.includes('晨') || v.includes('早')) return 'morning';
    if (v.includes('am')      || v.includes('上午'))                    return 'am';
    if (v.includes('pm')      || v.includes('下午'))                    return 'pm';
    if (v.includes('evening') || v.includes('晚')  || v.includes('夜')) return 'evening';
    return '';
  },

  // ── Main render ──────────────────────────────────────────
  _render() {
    const box = document.getElementById('notionBox');
    if (!box) return;

    const l         = I18n.lang;
    const connected = !!(S.notionToken && S.notionDbId);
    const tasks     = S.notionTasks || [];
    const doneCount = tasks.filter(tk => tk.done).length;
    const fromNotion = tasks.some(tk => tk._notionId);

    const timeLabels = {
      morning: t('notion_time_morning'),
      am:      t('notion_time_am'),
      pm:      t('notion_time_pm'),
      evening: t('notion_time_evening'),
    };

    // Loading state
    if (this._loading) {
      box.innerHTML = `
        <div class="notion-header">
          <div class="notion-logo">${_notionIcon()}</div>
          <div class="notion-header-title">${t('notion_title')}</div>
          <button class="notion-close-btn" onclick="Notion.close()">&times;</button>
        </div>
        <div class="notion-loading-state">
          <div class="notion-spinner">⏳</div>
          <div>${{ zh:'正在从 Notion 加载任务…', ja:'Notion からタスクを読み込み中…', en:'Loading tasks from Notion…' }[l] || 'Loading…'}</div>
        </div>`;
      return;
    }

    // Filter tabs
    const filterHtml = TIME_FILTERS.map(f => {
      const lbl = f === 'all' ? t('notion_time_all') : (timeLabels[f] || f);
      return `<button class="nf-tab ${this._activeFilter === f ? 'active' : ''}"
                      onclick="Notion._setFilter('${f}')">${lbl}</button>`;
    }).join('');

    // Task rows
    const filtered = this._activeFilter === 'all'
      ? tasks
      : tasks.filter(tk => tk.time === this._activeFilter);

    const taskHtml = filtered.map(tk => {
      const realIdx = tasks.indexOf(tk);
      const timeLbl = timeLabels[tk.time] || '';

      if (this._editMode && !fromNotion) {
        return `
          <div class="notion-task-row edit-mode">
            <select class="notion-time-sel" onchange="Notion._setTaskTime(${realIdx},this.value)">
              ${['morning','am','pm','evening'].map(tv =>
                `<option value="${tv}" ${tk.time===tv?'selected':''}>${timeLabels[tv]||tv}</option>`
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
          ${timeLbl ? `<span class="notion-time-badge">${timeLbl}</span>` : ''}
          ${tk._notionId ? `<span class="notion-sync-dot" title="Synced with Notion">⚡</span>` : ''}
        </div>`;
    }).join('') || `<p class="notion-empty">${t('notion_no_subjects')}</p>`;

    // Error banner
    const errorHtml = this._error ? `
      <div class="notion-error-banner">
        ⚠️ ${_esc(this._error)}
        <button onclick="Notion._fetchFromNotion()">
          ${{ zh:'重试', ja:'再試行', en:'Retry' }[l]}
        </button>
      </div>` : '';

    // Config section
    const archiveDbLabel = { zh:'打卡记录数据库 ID（归档用）', ja:'打刻記録 DB ID（アーカイブ用）', en:'Checkin Archive DB ID' }[l];
    const cfgHtml = connected ? `
      <details class="notion-cfg-details">
        <summary class="notion-cfg-summary">
          ⚙️ ${{ zh:'Notion 连接设置', ja:'Notion 接続設定', en:'Notion Settings' }[l]}
        </summary>
        <div class="notion-config-section">
          <input class="notion-input" id="notionToken" type="password"
                 placeholder="${t('notion_token_ph')}"
                 value="${S.notionToken || ''}">
          <input class="notion-input" id="notionDbId"
                 placeholder="${t('notion_db_ph')}"
                 value="${S.notionDbId || ''}">
          <input class="notion-input" id="notionArchiveDbId"
                 placeholder="${archiveDbLabel}"
                 value="${S.notionArchiveDbId || ''}">
          <button class="notion-save-cfg-btn" onclick="Notion._saveConfig()">${t('notion_save_cfg')}</button>
        </div>
      </details>` : `
      <div class="notion-config-section">
        <div class="notion-cfg-label">${t('notion_setup_label')}</div>
        <input class="notion-input" id="notionToken" type="password"
               placeholder="${t('notion_token_ph')}"
               value="${S.notionToken || ''}">
        <input class="notion-input" id="notionDbId"
               placeholder="${t('notion_db_ph')}"
               value="${S.notionDbId || ''}">
        <input class="notion-input" id="notionArchiveDbId"
               placeholder="${archiveDbLabel}"
               value="${S.notionArchiveDbId || ''}">
        <p class="notion-cfg-hint">${t('notion_hint')}</p>
        <button class="notion-save-cfg-btn" onclick="Notion._saveConfig()">${t('notion_save_cfg')}</button>
      </div>`;

    box.innerHTML = `
      <div class="notion-header">
        <div class="notion-logo">${_notionIcon()}</div>
        <div class="notion-header-title">${t('notion_title')}</div>
        ${connected
          ? `<button class="notion-edit-toggle"
                     onclick="Notion._fetchFromNotion()"
                     title="${{ zh:'刷新 Notion 任务', ja:'Notion タスクを更新', en:'Refresh from Notion' }[l]}">🔄</button>`
          : `<button class="notion-edit-toggle ${this._editMode ? 'active' : ''}"
                     onclick="Notion._toggleEdit()">${t('notion_edit_tasks')}</button>`
        }
        <button class="notion-close-btn" onclick="Notion.close()">&times;</button>
      </div>

      ${errorHtml}

      <div class="notion-progress-wrap">
        <div class="notion-progress-bar">
          <div class="notion-progress-fill"
               style="width:${tasks.length ? Math.round(doneCount/tasks.length*100) : 0}%"></div>
        </div>
        <span class="notion-progress-lbl">${doneCount} / ${tasks.length}</span>
      </div>

      <div class="notion-filter-tabs">${filterHtml}</div>

      <div class="notion-task-list" id="notionTaskList">${taskHtml}</div>

      ${this._editMode && !fromNotion ? `
      <button class="notion-add-task-btn" onclick="Notion._addTask()">
        ${t('notion_add_task')}
      </button>` : ''}

      <div class="notion-summary-row">
        <textarea class="notion-summary" id="notionSummary"
                  placeholder="${t('notion_summary_ph')}"
                  oninput="Notion._saveSummary(this.value)">${_esc(S.notionDraftSummary || '')}</textarea>
      </div>

      ${(S.notionToken && S.notionArchiveDbId) ? (() => {
        const todayArchive = (S.notionSyncedPages || []).find(p => p.date === todayKey());
        return `<div class="notion-archive-row">
          ${todayArchive
            ? `<a class="notion-archive-btn done"
                  href="${todayArchive.url || '#'}" target="_blank" rel="noopener">
                 ✅ ${{ zh:'今日已归档 ↗', ja:'今日アーカイブ済み ↗', en:'Today archived ↗' }[l]}
               </a>
               <button class="notion-archive-btn" id="notionArchiveBtn"
                       onclick="Notion._archiveToday()" style="margin-top:8px;opacity:.75;background:linear-gradient(135deg,#777,#999)">
                 🔄 ${{ zh:'更新归档（覆盖）', ja:'アーカイブを更新', en:'Update archive' }[l]}
               </button>`
            : `<button class="notion-archive-btn" id="notionArchiveBtn"
                       onclick="Notion._archiveToday()">
                 📤 ${{ zh:'完成今日打卡 → 存档 Notion', ja:'チェックインを Notion に保存', en:"Archive today's checkin to Notion" }[l]}
               </button>`
          }
        </div>`;
      })() : ''}

      ${cfgHtml}
    `;
  },

  // ── Toggle checkbox (local + immediate Notion sync) ──────
  async _toggle(idx) {
    const tasks = S.notionTasks || [];
    const tk    = tasks[idx];
    if (!tk) return;
    tk.done = !tk.done;
    saveLocal();
    this._render();

    if (tk._notionId && S.notionToken && this._cbKey) {
      try {
        await fetch('/api/notion', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action:      'toggle',
            token:       S.notionToken,
            pageId:      tk._notionId,
            checkboxKey: this._cbKey,
            done:        tk.done,
          }),
        });
      } catch (e) {
        console.warn('[Notion toggle]', e.message);
      }
    }
  },

  _setFilter(f) {
    this._activeFilter = f;
    this._render();
  },

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
    setTimeout(() => {
      const inputs = document.querySelectorAll('.notion-task-edit-input');
      inputs[inputs.length - 1]?.focus();
    }, 50);
  },

  _saveSummary(val) {
    S.notionDraftSummary = val;
    saveLocal();
  },

  // ── Archive today's checkin to Notion ────────────────────
  async _archiveToday() {
    if (!S.notionToken || !S.notionArchiveDbId) return;

    const btn = document.getElementById('notionArchiveBtn');
    const l   = I18n.lang;
    if (btn) {
      btn.disabled    = true;
      btn.textContent = { zh:'⏳ 正在归档…', ja:'⏳ アーカイブ中…', en:'⏳ Archiving…' }[l] || '⏳ Archiving…';
    }

    const today      = todayKey();
    const tasks      = (S.notionTasks || []).map(t => ({ text: t.text, done: t.done }));
    const doneCount  = tasks.filter(t => t.done).length;
    const totalCount = tasks.length;
    const existing   = (S.notionSyncedPages || []).find(p => p.date === today);

    try {
      const res = await fetch('/api/notion', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:         'archive',
          token:          S.notionToken,
          dbId:           S.notionArchiveDbId,
          date:           today,
          tasks,
          summary:        S.notionDraftSummary || '',
          doneCount,
          totalCount,
          points:         S.points,
          streak:         S.streak,
          existingPageId: existing?.pageId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);

      if (!S.notionSyncedPages) S.notionSyncedPages = [];
      // Remove any existing entry for today, then prepend updated one
      S.notionSyncedPages = S.notionSyncedPages.filter(p => p.date !== today);
      S.notionSyncedPages.unshift({ date: today, url: data.url || '#', pageId: data.pageId || null });
      S.notionSyncedPages = S.notionSyncedPages.slice(0, 30);
      saveLocal();
      if (window.Auth?.user) Auth.saveUserData();
      showToast({ zh:'✅ 已归档到 Notion', ja:'✅ Notion に保存しました', en:'✅ Archived to Notion' }[l] || '✅ Archived');
    } catch (e) {
      console.warn('[Notion archive]', e.message);
      showToast(({ zh:'归档失败：', ja:'アーカイブ失敗：', en:'Archive failed: ' }[l] || 'Failed: ') + e.message);
    }
    this._render();
  },

  _saveConfig() {
    S.notionToken       = document.getElementById('notionToken')?.value.trim()       || '';
    S.notionDbId        = document.getElementById('notionDbId')?.value.trim()        || '';
    S.notionArchiveDbId = document.getElementById('notionArchiveDbId')?.value.trim() || '';
    saveLocal();
    if (window.Auth?.user) Auth.saveUserData();
    showToast(t('notion_cfg_saved'));
    if (S.notionToken && S.notionDbId) {
      this._fetchFromNotion();
    } else {
      this._render();
    }
  },
};

window.Notion = Notion;

function _esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _notionIcon() {
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5" fill="#000"/>
    <path d="M6 5.5h8.5L18 9v10H6V5.5z" fill="rgba(255,255,255,0.08)"/>
    <text x="4.5" y="17.5" font-size="12" font-weight="900" fill="#fff" font-family="Georgia,serif">N</text>
  </svg>`;
}
