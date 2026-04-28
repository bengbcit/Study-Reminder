/* api/word-fill.js — Chinese word auto-fill via Gemini
   Returns: pron (pinyin), root (联想词), rel (相关词), level (HSK), cat (词性), defs[]
   Env var required: GEMINI_API_KEY
*/

const MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(200).json({ _demo: true });

  const { word } = req.body || {};
  if (!word) return res.status(400).json({ error: 'No word provided' });

  const prompt = `你是专业的汉语词典。请为词语「${word}」生成词典条目，严格按下面JSON格式返回，不要任何额外文字或markdown代码块：
{
  "word": "${word}",
  "pron": "带声调的拼音，如 shuì jiào",
  "root": "2-4个联想词，顿号分隔，如 睡眠、休息、打盹",
  "rel": "2-4个相关词或反义词，顿号分隔，如 失眠、早起、入睡",
  "level": "HSK等级：HSK1 / HSK2 / HSK3 / HSK4 / HSK5 / HSK6（不在HSK则留空字符串）",
  "cat": "词性：动词 / 名词 / 形容词 / 副词 / 其他",
  "defs": [
    {
      "meaning": "英文释义，如 to sleep; to go to bed",
      "ex": "包含该词的中文例句"
    },
    {
      "meaning": "日文释义（必须是正确日语），如 眠る；寝る",
      "ex": "包含该词的另一个中文例句"
    }
  ]
}`;

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    });

    const data = await geminiRes.json();
    if (!geminiRes.ok) {
      return res.status(500).json({ error: data?.error?.message || `Gemini error ${geminiRes.status}` });
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Gemini returned no JSON' });

    let result;
    try { result = JSON.parse(match[0]); }
    catch (e) { return res.status(500).json({ error: 'JSON parse failed: ' + e.message }); }

    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
