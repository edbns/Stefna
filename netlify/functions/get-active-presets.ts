import type { Handler } from "@netlify/functions";
import { q } from './_db';
import { json } from './_lib/http';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Get active presets from database
    // These are the 6 presets that are currently active/rotating
    const activePresets = await q(`
      SELECT slug, label, prompt, negative_prompt, strength, description
      FROM active_presets
      ORDER BY created_at DESC
      LIMIT 6
    `);

    // Transform to the format expected by the frontend
    const presets = activePresets.map(preset => ({
      id: preset.slug,
      label: preset.label,
      prompt: preset.prompt,
      negative_prompt: preset.negative_prompt,
      strength: preset.strength,
      description: preset.description
    }));

    return json({ presets });
  } catch (error) {
    console.error('Error fetching active presets:', error);
    return json({ error: 'Failed to fetch presets' }, { status: 500 });
  }
};
