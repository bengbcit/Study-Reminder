/* api/generate-avatar.js — AI avatar / portrait generation
   Uses Stability AI stable-image/generate/core endpoint (square format for avatars).

   SETUP: Same STABILITY_API_KEY as generate-bg.js (shared env variable).

   Accepts: POST { prompt: "avatar style description" }
   Returns: { dataUrl: "data:image/jpeg;base64,..." }
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

  if (!apiKey) {
    return res.status(200).json({
      error: 'no_key',
      message: 'Add STABILITY_API_KEY to Vercel Environment Variables.',
      dataUrl: _avatarPlaceholder(),
    });
  }

  // ── Build avatar-optimised prompt ──
  const fullPrompt = `${prompt}, high-quality avatar, centered portrait, clean background, detailed, vibrant colors, game character style`;
  const negativePrompt = 'multiple people, text, watermark, extra limbs, blurry, deformed, nsfw, low quality';

  try {
    const form = new FormData();
    form.append('prompt', fullPrompt);
    form.append('negative_prompt', negativePrompt);
    form.append('output_format', 'jpeg');
    form.append('width', '1024');
    form.append('height', '1024');  // Square — ideal for circular avatar
    form.append('cfg_scale', '7');
    form.append('steps', '30');

    const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'image/*',
      },
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Stability AI avatar error:', errText);
      return res.status(502).json({ error: 'Avatar generation failed', detail: errText.slice(0, 200) });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;

    return res.status(200).json({ dataUrl });

  } catch (err) {
    console.error('generate-avatar error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// SVG placeholder avatar (planet + star icon)
function _avatarPlaceholder() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
    <rect width="256" height="256" rx="20" fill="#0d0628"/>
    <circle cx="128" cy="128" r="60" fill="#4C1D95" opacity="0.7"/>
    <text x="128" y="148" text-anchor="middle" font-size="72">🪐</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
