/* api/generate-bg.js — AI background image generation (2K quality)
   Uses Stability AI stable-image/generate/ultra endpoint.

   SETUP (one time):
   1. Sign up at https://platform.stability.ai and get an API key
   2. In Vercel dashboard → Settings → Environment Variables
   3. Add: STABILITY_API_KEY = sk-...your key...
   4. Redeploy — this endpoint activates automatically.

   The endpoint accepts: POST { prompt: "your style description" }
   Returns: { url: "...", dataUrl: "data:image/..." }
*/

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'prompt required' });
  }

  const apiKey = process.env.STABILITY_API_KEY;

  // ── If no API key: return a placeholder so the UI still works ──
  if (!apiKey) {
    return res.status(200).json({
      error: 'no_key',
      message: 'Add STABILITY_API_KEY to Vercel Environment Variables to enable AI background generation.',
      // Return a gradient placeholder data URL as fallback
      dataUrl: _gradientPlaceholder(),
    });
  }

  // ── Enhance prompt for high-quality scenic backgrounds ──
  const fullPrompt = `${prompt}, masterpiece, ultra-detailed, cinematic lighting, 4K resolution, breathtaking background, ambient atmosphere, no text, no watermark`;
  const negativePrompt = 'people, faces, text, watermark, signature, blurry, low quality, pixelated artifacts, nsfw';

  try {
    // Stability AI v2 REST API — stable-image/generate/ultra
    // Outputs WEBP up to 1MP (≈1344x768 for 16:9) per generation unit
    // For 2K, we request the maximum allowed dimensions
    const form = new FormData();
    form.append('prompt', fullPrompt);
    form.append('negative_prompt', negativePrompt);
    form.append('output_format', 'jpeg');
    form.append('width', '1344');
    form.append('height', '768');
    form.append('cfg_scale', '7');
    form.append('steps', '30');

    const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/ultra', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'image/*',
      },
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Stability AI error:', errText);
      return res.status(502).json({ error: 'Image generation failed', detail: errText.slice(0, 200) });
    }

    // Convert binary response to base64 data URL
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return res.status(200).json({ dataUrl });

  } catch (err) {
    console.error('generate-bg error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// Generates a colourful CSS gradient as a base64 SVG placeholder
function _gradientPlaceholder() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1344" height="768">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0d0628"/>
        <stop offset="40%" style="stop-color:#1a0a4a"/>
        <stop offset="80%" style="stop-color:#0a1a3d"/>
        <stop offset="100%" style="stop-color:#200850"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="46%" text-anchor="middle" fill="rgba(167,139,250,0.6)"
          font-size="22" font-family="monospace">
      Add STABILITY_API_KEY to enable AI backgrounds
    </text>
    <text x="50%" y="54%" text-anchor="middle" fill="rgba(167,139,250,0.4)"
          font-size="14" font-family="monospace">
      platform.stability.ai → Vercel Env Vars → STABILITY_API_KEY
    </text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
