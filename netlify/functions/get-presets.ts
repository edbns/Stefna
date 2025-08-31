// netlify/functions/get-presets.ts
// Fetch available presets from database with rotation system
// Returns currently available presets (respecting 25-preset rotation)
// Separate from standalone modes (ghibli, emotion mask, neo glitch)

import { Handler } from '@netlify/functions';
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
    console.log('🎨 [Get Presets] Fetching available presets from database');

    // Calculate current week for rotation (1-5 cycle)
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const daysSinceStartOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.floor(daysSinceStartOfYear / 7) % 5 + 1;

    console.log('📅 [Get Presets] Current week:', currentWeek);

    // Fetch currently available presets from database
    const availablePresets = await q(`
      SELECT
        id,
        preset_key,
        preset_name,
        preset_description,
        preset_category,
        preset_prompt,
        preset_negative_prompt,
        preset_strength,
        preset_rotation_index,
        preset_week,
        is_active
      FROM presets_config
      WHERE is_active = true
      AND preset_week = $1
      ORDER BY preset_rotation_index ASC
    `, [currentWeek]);

    console.log('✅ [Get Presets] Found', availablePresets.length, 'available presets for week', currentWeek);

    // Transform to frontend-friendly format
    const presets = availablePresets.map(preset => ({
      id: preset.preset_key,
      key: preset.preset_key,
      label: preset.preset_name,
      description: preset.preset_description,
      category: preset.preset_category,
      prompt: preset.preset_prompt,
      negativePrompt: preset.preset_negative_prompt,
      strength: preset.preset_strength,
      rotationIndex: preset.preset_rotation_index,
      week: preset.preset_week,
      isActive: preset.is_active
    }));

    return json({
      success: true,
      data: {
        presets,
        currentWeek,
        totalAvailable: presets.length,
        rotationInfo: {
          totalPresetsInSystem: 25,
          weeksInCycle: 5,
          presetsPerWeek: 5
        }
      }
    });

  } catch (error) {
    console.error('❌ [Get Presets] Error:', error);
    return json({
      success: false,
      error: 'Failed to fetch presets',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
