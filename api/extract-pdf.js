/* api/extract-pdf.js — PDF → Vocabulary extraction via Gemini 1.5 Flash
   Handles both native-text and scanned PDFs (Gemini reads pages as images).
   Env var required: GEMINI_API_KEY
   Free tier: 15 RPM · 1M TPM · 1500 req/day (gemini-1.5-flash)
*/

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',   // ~15 MB PDF after base64 overhead
    },
  },
};

const MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      words: [],
      _demo: true,
      message: 'GEMINI_API_KEY not configured. Add it to Vercel Environment Variables.',
    });
  }

  const { pdfBase64, lang = 'jp', maxWords = 30 } = req.body || {};
  if (!pdfBase64) return res.status(400).json({ error: 'No PDF data provided' });

  const limit = Math.min(Math.max(parseInt(maxWords) || 30, 5), 100);
  const isJP  = lang === 'jp';

  // ── Prompt ────────────────────────────────────────────────────────────
  const prompt = isJP
    ? `このPDF（スキャン画像でも可）から日本語の語彙を最大${limit}語抽出してください。
各単語を以下のJSONフィールドで返してください：
- "word": 日本語の単語（漢字・かな）
- "kana": ひらがな・カタカナの読み方
- "meaning": 中国語または英語の意味
- "level": 推定JLPTレベル（N1/N2/N3/N4/N5 または空文字）
- "cat": 品詞（動詞/名詞/形容詞/副詞/接続詞 または空文字）
- "ex": この単語を使った短い例文（日本語）

機能語（は・が・を等の助詞）は除外し、名詞・動詞・形容詞・副詞を優先してください。
応答はJSON配列のみ。他のテキスト不要。
例: [{"word":"勉強","kana":"べんきょう","meaning":"学习","level":"N4","cat":"名詞","ex":"毎日勉強します。"}]`
    : `Extract up to ${limit} English vocabulary words from this PDF (may be a scanned image).
Return each word as a JSON object with these exact fields:
- "word": the English word or phrase
- "pron": IPA pronunciation (e.g. /ˈwɜːd/) — leave empty string if unsure
- "meaning": a concise definition in Chinese or English
- "level": estimated CEFR level (A1/A2/B1/B2/C1/C2 or empty string)
- "cat": part of speech (noun/verb/adjective/adverb/phrase or empty string)
- "ex": a short example sentence using the word

Prioritise uncommon or advanced vocabulary. Exclude extremely basic words (the, is, a).
Return ONLY a valid JSON array. No markdown, no explanation.
Example: [{"word":"serendipity","pron":"/ˌsɛrənˈdɪpɪti/","meaning":"意外发现美好事物","level":"C1","cat":"noun","ex":"Finding this old photo was pure serendipity."}]`;

  // ── Call Gemini ───────────────────────────────────────────────────────
  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const msg = data?.error?.message || `Gemini error ${geminiRes.status}`;
      return res.status(500).json({ error: msg });
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON array even if wrapped in markdown code fences
    const match = raw.match(/\[[\s\S]*?\]/);
    if (!match) {
      return res.status(500).json({
        error: 'Gemini did not return a word list. The PDF may be unreadable or empty.',
        rawPreview: raw.slice(0, 300),
      });
    }

    let words;
    try {
      words = JSON.parse(match[0]);
    } catch (parseErr) {
      return res.status(500).json({ error: 'JSON parse failed: ' + parseErr.message });
    }

    return res.status(200).json({ words, count: words.length, lang });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
