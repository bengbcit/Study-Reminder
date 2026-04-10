/* notion.js — 📋 Notion 打卡记录 integration
   Syncs today's study tasks to a Notion database row.
   Uses Notion API via a serverless proxy (api/notion.js) to keep token secure.
*/

const Notion = {

  // ── Open the Notion panel modal ───────────────────────────
  open() {
    const modal = document.getElementById('notionModal');
    if (modal) {
      modal.classList.add('open');
      this._render();
    }
  },

  close(e) {
    const modal = document.getElementById('notionModal');
    if (!modal) return;
    if (!e || e.target === modal) modal.classList.remove('open');
  },

  // ── Main render ───────────────────────────────────────────
  _render() {
    const box = document.getElementById('notionBox');
    if (!box) return;

    const hasConfig = !!(S.notionToken && S.notionDbId);
    const enabled   = S.subjects.filter(s => s.enabled);
    const today     = todayKey();
    const rec       = S.history[today] || {};

    // Build task list from today's subjects
    const taskRows = enabled.map(s => {
      const done = S.todayReport[s.id]?.done || rec[s.id]?.done || false;
      return `
        <div class="notion-task-row" id="ntask_${s.id}">
          <div class="notion-task-check ${done ? 'done' : ''}"
               onclick="Notion._toggleTask('${s.id}')">
            ${done ? '✓' : ''}
          </div>
          <span class="notion-task-icon">${s.icon}</span>
          <span class="notion-task-name">${subjName(s)}</span>
          <span class="notion-task-dur">${s.duration} ${t('dur_min')}</span>
        </div>`;
    }).join('');

    const syncedPagesHtml = (S.notionSyncedPages || []).slice(0, 5).map(p => `
      <div class="notion-synced-row">
        <span>📄 ${p.date}</span>
        <a href="${p.url}" target="_blank" rel="noopener" class="notion-open-link">
          ${t('notion_open')} ↗
        </a>
      </div>`).join('') || `<p class="notion-empty">${t('notion_no_sync')}</p>`;

    box.innerHTML = `
      <!-- Header -->
      <div class="notion-header">
        <div class="notion-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="4" fill="#000"/>
            <path d="M6 6h8l4 4v8H6V6z" fill="#fff" opacity=".15"/>
            <text x="5" y="17" font-size="11" font-weight="900" fill="#fff" font-family="sans-serif">N</text>
          </svg>
        </div>
        <div class="notion-header-title">${t('notion_title')}</div>
        <button class="notion-close-btn" onclick="Notion.close()">&times;</button>
      </div>

      <!-- Config section -->
      <div class="notion-section">
        <div class="notion-section-label">${t('notion_setup_label')}</div>
        <input class="notion-input" id="notionToken" type="password"
               placeholder="${t('notion_token_ph')}"
               value="${S.notionToken || ''}">
        <input class="notion-input" id="notionDbId"
               placeholder="${t('notion_db_ph')}"
               value="${S.notionDbId || ''}">
        <div class="notion-hint">${t('notion_hint')}</div>
        <button class="notion-save-btn" onclick="Notion._saveConfig()">${t('notion_save_cfg')}</button>
      </div>

      ${hasConfig ? `
      <!-- Today's tasks -->
      <div class="notion-section">
        <div class="notion-section-label">📅 ${today} — ${t('notion_tasks_label')}</div>
        <div class="notion-task-list">${taskRows || `<p class="notion-empty">${t('notion_no_subjects')}</p>`}</div>

        <!-- Summary input -->
        <textarea class="notion-summary" id="notionSummary"
                  placeholder="${t('notion_summary_ph')}">${S.notionDraftSummary || ''}</textarea>

        <button class="notion-sync-btn" onclick="Notion.syncToNotion()">
          <span id="notionSyncIcon">📤</span> ${t('notion_sync_btn')}
        </button>
      </div>

      <!-- Recent syncs -->
      <div class="notion-section">
        <div class="notion-section-label">${t('notion_recent_label')}</div>
        ${syncedPagesHtml}
      </div>
      ` : `
      <div class="notion-empty-state">
        <div style="font-size:40px;margin-bottom:12px">📋</div>
        <div style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:6px">${t('notion_not_cfg')}</div>
        <div style="font-size:12px;color:var(--text2)">${t('notion_not_cfg_hint')}</div>
      </div>
      `}
    `;
  },

  _saveConfig() {
    S.notionToken = document.getElementById('notionToken')?.value.trim() || '';
    S.notionDbId  = document.getElementById('notionDbId')?.value.trim()  || '';
    saveLocal();
    if (window.Auth?.user) Auth.saveUserData();
    showToast(t('notion_cfg_saved'));
    this._render();
  },

  _toggleTask(id) {
    if (!S.todayReport[id]) S.todayReport[id] = {};
    S.todayReport[id].done = !S.todayReport[id].done;
    saveLocal();
    this._render();
    // Also refresh calendar if visible
    if (window.Cal) Cal._renderGrid();
  },

  // ── Sync to Notion via serverless proxy ───────────────────
  async syncToNotion() {
    if (!S.notionToken || !S.notionDbId) {
      showToast(t('notion_no_config'));
      return;
    }

    const syncBtn  = document.querySelector('.notion-sync-btn');
    const syncIcon = document.getElementById('notionSyncIcon');
    if (syncBtn) { syncBtn.disabled = true; syncIcon.textContent = '⏳'; }

    const today    = todayKey();
    const enabled  = S.subjects.filter(s => s.enabled);
    const summary  = document.getElementById('notionSummary')?.value.trim() || '';
    S.notionDraftSummary = summary;
    saveLocal();

    // Build checkin items
    const items = enabled.map(s => {
      const done = S.todayReport[s.id]?.done || S.history[today]?.[s.id]?.done || false;
      const nm   = subjName(s);
      return { name: `${s.icon} ${nm}`, done, duration: s.duration };
    });

    const doneCount  = items.filter(i => i.done).length;
    const totalCount = items.length;

    const payload = {
      token:   S.notionToken,
      dbId:    S.notionDbId,
      date:    today,
      items,
      summary,
      points:  S.points,
      streak:  S.streak,
      doneCount,
      totalCount,
      lang:    I18n.lang,
    };

    try {
      const res = await fetch('/api/notion', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'HTTP ' + res.status);
      }

      const data = await res.json();

      // Record synced page
      if (!S.notionSyncedPages) S.notionSyncedPages = [];
      S.notionSyncedPages.unshift({ date: today, url: data.url || '#', pageId: data.pageId });
      S.notionSyncedPages = S.notionSyncedPages.slice(0, 20); // keep last 20
      saveLocal();
      if (window.Auth?.user) Auth.saveUserData();

      showToast(t('notion_synced'));
      if (syncIcon) syncIcon.textContent = '✅';
      if (syncBtn)  syncBtn.disabled = false;
      this._render();

    } catch (e) {
      console.warn('Notion sync error:', e.message);
      showToast(`${t('notion_sync_fail')}: ${e.message}`);
      if (syncIcon) syncIcon.textContent = '📤';
      if (syncBtn)  syncBtn.disabled = false;
    }
  },
};

// Make global
window.Notion = Notion;
