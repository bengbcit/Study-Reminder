/* api/encourage.js — Vercel serverless function
   Calls Anthropic API server-side so the API key is never exposed to the browser.

   Setup:
   1. In Vercel dashboard → Settings → Environment Variables
   2. Add: ANTHROPIC_API_KEY = sk-ant-...your key...
   3. Redeploy — the function will automatically activate.
*/

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subjectList, lang } = req.body || {};

  // Language-aware fallback (used when no API key or on error)
  const fallback = {
    zh: `🌟 太棒了！今天完成了学习，你真的很努力！每一天的坚持都让你变得更强，明天继续加油！💪`,
    ja: `🌟 すごい！今日も学習を頑張りました！毎日の積み重ねが大きな力になります。明日も一緒に頑張ろう！💪`,
    en: `🌟 Great job completing your studies today! Every session brings you one step closer to your goals. Keep up the amazing work! 💪`,
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ text: fallback[lang] || fallback.en });
  }

  const prompts = {
    zh: `一个孩子刚完成了今天的学习：${subjectList}。请用温暖鼓励的语气写2-3句中文鼓励话语，要具体提到学习的科目，让孩子感到被肯定和有动力继续。只输出鼓励的话，不要任何前缀或解释。`,
    ja: `子どもが今日の学習を終えました：${subjectList}。日本語で温かく励ます2〜3文を書いてください。具体的な科目に触れ、フレンドリーな口調で。鼓励の言葉だけを出力してください。`,
    en: `A child just completed their study session: ${subjectList}. Write a warm, enthusiastic 2-3 sentence encouragement in English. Be specific, mention the subjects, and use a friendly motivating tone. Output only the encouragement, no prefix.`,
  };

  const prompt = prompts[lang] || prompts.en;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001', // Fast and cheap for short encouragements
        max_tokens: 200,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) throw new Error('Anthropic API error: ' + response.status);

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    return res.status(200).json({ text });

  } catch (err) {
    console.error('AI encouragement error:', err.message);
    return res.status(200).json({ text: fallback[lang] || fallback.en });
  }
}
