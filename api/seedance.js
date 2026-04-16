// api/seedance.js — Vercel serverless function
// Proxies requests to kie.ai Seedance 2 API server-side.
// API key is never exposed to the browser.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'KIE_API_KEY not configured' });
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // ── POST /api/seedance → create generation task ──────────
  if (req.method === 'POST') {
    const {
      prompt,
      reference_image_urls = [],
      reference_video_urls = [],
      reference_audio_urls = [],
      return_last_frame = false,
      generate_audio = true,
      resolution = '720p',
      aspect_ratio = '16:9',
      duration = 15,
    } = req.body || {};

    try {
      const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'bytedance/seedance-2',
          input: {
            prompt,
            reference_image_urls,
            reference_video_urls,
            reference_audio_urls,
            return_last_frame,
            generate_audio,
            resolution,
            aspect_ratio,
            duration,
            web_search: false,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data.msg || 'kie.ai error' });
      }

      return res.status(200).json({ taskId: data.data?.taskId });

    } catch (err) {
      console.error('[seedance create]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── GET /api/seedance?taskId=xxx → query task status ────
  if (req.method === 'GET') {
    const { taskId } = req.query;
    if (!taskId) return res.status(400).json({ error: 'Missing taskId' });

    try {
      const response = await fetch(
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
        { method: 'GET', headers }
      );

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data.msg || 'kie.ai error' });
      }

      const job = data.data || {};
      let resultUrls = [];
      if (job.resultJson) {
        try {
          resultUrls = JSON.parse(job.resultJson).resultUrls || [];
        } catch (_) {}
      }

      return res.status(200).json({
        taskId:    job.taskId,
        state:     job.state,        // 'waiting' | 'success' | 'fail'
        resultUrls,
        failMsg:   job.failMsg || null,
      });

    } catch (err) {
      console.error('[seedance query]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
