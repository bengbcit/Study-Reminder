// api/notion.js — Vercel serverless: Notion API proxy
// Proxies all Notion API calls server-side to avoid CORS restrictions.
// Actions: query (fetch tasks), toggle (checkbox), add (new page), delete (archive)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const { action, token, dbId, pageId, checkboxKey, name, time } = body;
  const done = body.done;

  if (!token) return res.status(400).json({ error: 'Missing Notion token' });

  const hdr = {
    'Authorization':  `Bearer ${token}`,
    'Notion-Version': '2022-06-28',
    'Content-Type':   'application/json',
  };

  // Shared fetch helper — throws on Notion error responses
  async function nFetch(url, method = 'GET', payload) {
    const opts = { method, headers: hdr };
    if (payload !== undefined) opts.body = JSON.stringify(payload);
    const r    = await fetch(url, opts);
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || `Notion ${r.status}`);
    return data;
  }

  // Find first property key of a given type
  function findKey(props, type) {
    return Object.keys(props).find(k => props[k].type === type) || null;
  }

  // Extract plain text from a page's title property
  function pageTitle(page) {
    const p = Object.values(page.properties || {}).find(v => v.type === 'title');
    return (p?.title || []).map(t => t.plain_text).join('') || 'Untitled';
  }

  try {

    // ── query: fetch all tasks from a database ──────────────
    if (action === 'query') {
      if (!dbId) return res.status(400).json({ error: 'Missing dbId' });

      const data  = await nFetch(
        `https://api.notion.com/v1/databases/${dbId}/query`,
        'POST',
        { page_size: 100 }
      );
      const pages  = (data.results || []).filter(p => !p.archived);
      const sample = pages[0]?.properties || {};
      const cbKey  = findKey(sample, 'checkbox');
      const selKey = findKey(sample, 'select');

      const tasks = pages.map(p => ({
        id:   p.id,
        text: pageTitle(p),
        done: cbKey  ? (p.properties[cbKey]?.checkbox  || false) : false,
        time: selKey ? (p.properties[selKey]?.select?.name || '') : '',
      }));

      return res.status(200).json({ tasks, cbKey, selKey });
    }

    // ── toggle: update checkbox on a Notion page ────────────
    if (action === 'toggle') {
      if (!pageId || !checkboxKey || done === undefined)
        return res.status(400).json({ error: 'Missing pageId, checkboxKey, or done' });

      await nFetch(`https://api.notion.com/v1/pages/${pageId}`, 'PATCH', {
        properties: { [checkboxKey]: { checkbox: Boolean(done) } },
      });
      return res.status(200).json({ ok: true });
    }

    // ── add: create a new page (task) in the database ───────
    if (action === 'add') {
      if (!dbId || !name) return res.status(400).json({ error: 'Missing dbId or name' });

      const db    = await nFetch(`https://api.notion.com/v1/databases/${dbId}`);
      const cbKey  = findKey(db.properties, 'checkbox');
      const selKey = findKey(db.properties, 'select');

      const properties = {
        'Name': { title: [{ text: { content: name } }] },
        ...(cbKey  && { [cbKey]:  { checkbox: false } }),
        ...(selKey && time && { [selKey]: { select: { name: time } } }),
      };

      const page = await nFetch('https://api.notion.com/v1/pages', 'POST', {
        parent: { database_id: dbId },
        properties,
      });
      return res.status(200).json({ id: page.id, cbKey, selKey });
    }

    // ── delete: archive a Notion page ───────────────────────
    if (action === 'delete') {
      if (!pageId) return res.status(400).json({ error: 'Missing pageId' });
      await nFetch(`https://api.notion.com/v1/pages/${pageId}`, 'PATCH', { archived: true });
      return res.status(200).json({ ok: true });
    }

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

      const db       = await nFetch(`https://api.notion.com/v1/databases/${dbId}`);
      const titleKey = findKey(db.properties, 'title') || 'Name';

      const page = await nFetch('https://api.notion.com/v1/pages', 'POST', {
        parent:     { database_id: dbId },
        properties: {
          [titleKey]: { title: [{ type: 'text', text: { content: `${date} 打卡记录` } }] },
        },
        children,
      });

      return res.status(200).json({ url: page.url || '' });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });

  } catch (e) {
    console.error('[notion proxy]', e.message);
    return res.status(500).json({ error: e.message });
  }
};
