# 打卡双写归档 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在打卡 tab 加一个"完成今日打卡 → 存档 Notion"按钮，点击后把当日任务状态、统计和备注异步写入 Notion 任务数据库，同时保存到本地。

**Architecture:** `js/notion.js` 负责 UI 和触发归档逻辑；`api/notion.js`（Vercel serverless）负责调用 Notion API 创建页面；CSS 新增归档按钮样式。三个文件改动相互独立，按顺序完成。

**Tech Stack:** Vanilla JS, Notion API v1 (via Vercel serverless), localStorage, Firebase Firestore

---

## 文件改动一览

| 文件 | 操作 | 职责 |
|------|------|------|
| `api/notion.js` | Modify | 新增 `archive` action，调用 Notion API 创建归档页 |
| `js/notion.js` | Modify | 新增归档按钮 HTML + `_archiveToday()` 方法 |
| `css/style.css` | Modify | 新增 `.notion-archive-btn` 相关样式 |

---

## Task 1: `api/notion.js` — 新增 archive action

**Files:**
- Modify: `api/notion.js`

- [ ] **Step 1: 在 `api/notion.js` 的 try 块里，在 `return res.status(400).json({ error: 'Unknown action' })` 之前插入 archive action**

找到文件末尾的这行：
```js
    return res.status(400).json({ error: 'Unknown action: ' + action });
```

在它前面插入：

```js
    // ── archive: create a daily checkin record page ──────────
    if (action === 'archive') {
      const { dbId, date, tasks, summary, doneCount, totalCount, points, streak } = body;
      if (!dbId || !date) return res.status(400).json({ error: 'Missing dbId or date' });

      const donePct   = totalCount > 0 ? Math.round(doneCount / totalCount * 100) : 0;
      const doneTasks = (tasks || []).filter(t => t.done);
      const notDone   = (tasks || []).filter(t => !t.done);

      const toDoBlock = (text, checked) => ({
        object: 'block', type: 'to_do',
        to_do: { rich_text: [{ type: 'text', text: { content: String(text || '') } }], checked },
      });
      const para = (content) => ({
        object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: String(content || '') } }] },
      });
      const h = (content, level = 2) => ({
        object: 'block', type: `heading_${level}`,
        [`heading_${level}`]: { rich_text: [{ type: 'text', text: { content } }] },
      });
      const divider = () => ({ object: 'block', type: 'divider', divider: {} });

      const children = [
        h(`📅 ${date} 打卡记录`),
        para(`完成率：${donePct}%（${doneCount}/${totalCount}）  ⭐ 积分：${points || 0}  🔥 连续：${streak || 0} 天`),
        divider(),
        h('✅ 已完成任务', 3),
        ...(doneTasks.length ? doneTasks.map(t => toDoBlock(t.text, true))  : [para('（无）')]),
        h('⬜ 未完成任务', 3),
        ...(notDone.length  ? notDone.map(t  => toDoBlock(t.text, false)) : [para('（全部完成！🎉）')]),
      ];

      if (summary) {
        children.push(divider(), h('📝 备注', 3), para(summary));
      }

      const page = await nFetch('https://api.notion.com/v1/pages', 'POST', {
        parent:     { database_id: dbId },
        properties: {
          Name: { title: [{ type: 'text', text: { content: `${date} 打卡记录` } }] },
        },
        children,
      });

      return res.status(200).json({ url: page.url || '' });
    }

```

- [ ] **Step 2: 验证文件语法正确**

```bash
node -e "require('./api/notion.js')" 2>&1 | head -5
```

期望输出：空（无报错）。如果有语法错误，根据提示修正。

- [ ] **Step 3: Commit**

```bash
git add api/notion.js
git commit -m "feat: add archive action to Notion serverless proxy"
```

---

## Task 2: `css/style.css` — 归档按钮样式

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: 在 `.notion-cfg-details` 样式块之后，追加以下 CSS**

找到 `css/style.css` 里这行：
```css
.notion-cfg-details[open] .notion-cfg-summary { color: #333; }
```

在它后面追加：

```css

/* ── Notion: archive button ────────────────────────────────── */
.notion-archive-row { padding: 12px 18px 4px; }
.notion-archive-btn {
  display: block; width: 100%; padding: 13px;
  border: none; border-radius: 14px; cursor: pointer;
  background: linear-gradient(135deg, #FF6B35, #FFB300);
  color: #fff; font-size: 14px; font-weight: 700;
  text-align: center; text-decoration: none;
  transition: opacity .15s;
}
.notion-archive-btn:hover  { opacity: .88; }
.notion-archive-btn:disabled { opacity: .5; cursor: wait; }
.notion-archive-btn.done {
  background: linear-gradient(135deg, #52C97A, #4A90D9);
}
```

- [ ] **Step 2: Commit**

```bash
git add css/style.css
git commit -m "feat: add notion archive button styles"
```

---

## Task 3: `js/notion.js` — 归档按钮 + `_archiveToday()` 方法

**Files:**
- Modify: `js/notion.js`

- [ ] **Step 1: 在 `_render()` 方法里，找到 summary textarea 的 HTML，在它后面、`${cfgHtml}` 前面插入归档按钮**

找到 `_render()` 里这段：

```js
      <div class="notion-summary-row">
        <textarea class="notion-summary" id="notionSummary"
                  placeholder="${t('notion_summary_ph')}"
                  oninput="Notion._saveSummary(this.value)">${_esc(S.notionDraftSummary || '')}</textarea>
      </div>

      ${cfgHtml}
```

替换成：

```js
      <div class="notion-summary-row">
        <textarea class="notion-summary" id="notionSummary"
                  placeholder="${t('notion_summary_ph')}"
                  oninput="Notion._saveSummary(this.value)">${_esc(S.notionDraftSummary || '')}</textarea>
      </div>

      ${connected ? (() => {
        const todayArchive = (S.notionSyncedPages || []).find(p => p.date === todayKey());
        return `<div class="notion-archive-row">
          ${todayArchive
            ? `<a class="notion-archive-btn done"
                  href="${todayArchive.url || '#'}" target="_blank" rel="noopener">
                 ✅ ${{ zh:'今日已归档 ↗', ja:'今日アーカイブ済み ↗', en:'Today archived ↗' }[l]}
               </a>`
            : `<button class="notion-archive-btn" id="notionArchiveBtn"
                       onclick="Notion._archiveToday()">
                 📤 ${{ zh:'完成今日打卡 → 存档 Notion', ja:'チェックインを Notion に保存', en:"Archive today's checkin to Notion" }[l]}
               </button>`
          }
        </div>`;
      })() : ''}

      ${cfgHtml}
```

- [ ] **Step 2: 在 `_saveSummary()` 方法之后、`_saveConfig()` 之前，插入 `_archiveToday()` 方法**

找到：
```js
  _saveSummary(val) {
    S.notionDraftSummary = val;
    saveLocal();
  },

  _saveConfig() {
```

在 `_saveSummary` 和 `_saveConfig` 之间插入：

```js
  // ── Archive today's checkin to Notion ────────────────────
  async _archiveToday() {
    if (!S.notionToken || !S.notionDbId) return;

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

    try {
      const res = await fetch('/api/notion', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:     'archive',
          token:      S.notionToken,
          dbId:       S.notionDbId,
          date:       today,
          tasks,
          summary:    S.notionDraftSummary || '',
          doneCount,
          totalCount,
          points:     S.points,
          streak:     S.streak,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);

      if (!S.notionSyncedPages) S.notionSyncedPages = [];
      S.notionSyncedPages.unshift({ date: today, url: data.url || '#' });
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

```

- [ ] **Step 3: 浏览器手动验证**

1. 推送到 Vercel（下一步 commit 后 push）
2. 打开 `https://study-reminder-dusky.vercel.app/`，登录
3. 点击"📋 打卡" tab
4. 确保已配置 Notion token + dbId
5. 打几个任务的勾，在备注里写点内容
6. 点击底部"📤 完成今日打卡 → 存档 Notion"
7. 期望：按钮变灰显示"⏳ 正在归档…" → Toast 显示"✅ 已归档到 Notion" → 按钮变成绿色"✅ 今日已归档 ↗"
8. 点击"✅ 今日已归档 ↗"，跳转到 Notion，确认页面内容正确（标题、任务列表、备注、统计）

- [ ] **Step 4: Commit 并推送**

```bash
git add js/notion.js
git commit -m "feat: add archive today button and _archiveToday method to notion panel"
git push
```

---

## 验收标准

- [ ] Notion 未配置时，归档按钮不显示
- [ ] 点击按钮后显示 loading 状态，不可重复点击
- [ ] 归档成功后按钮变成"已归档 ↗"绿色链接，可跳转到 Notion 页面
- [ ] 当天刷新后按钮仍显示"已归档 ↗"（状态持久化到 localStorage）
- [ ] Notion 请求失败时显示错误 toast，按钮恢复可点击
- [ ] Notion 归档页包含：标题（日期）、完成率、积分、连续天数、已完成任务列表、未完成任务列表、备注（若有）
