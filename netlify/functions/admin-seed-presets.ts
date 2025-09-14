import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { json } from './_lib/http';

// ============================================================================
// VERSION: 7.0 - RAW SQL MIGRATION
// ============================================================================
// This function uses raw SQL queries through the _db helper
// - Replaced Prisma with direct SQL queries
// - Uses q, qOne, qCount for database operations
// - Seeds preset configurations
// ============================================================================

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Basic admin check (you may want to enhance this)
    if (!event.headers.authorization) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🌱 [Admin] Starting preset seeding...');

    // Define default presets
    const defaultPresets = [
      {
        preset_key: 'neo_tokyo_glitch',
        name: 'Neo Tokyo Glitch',
        description: 'Cyberpunk aesthetic with glitch effects',
        strength: 1.0,
        category: 'cyberpunk',
        is_active: true,
        is_custom: false,
        metadata: { style: 'cyberpunk', effect: 'glitch' }
      },
      {
        preset_key: 'ghibli_reaction',
        name: 'Ghibli Reaction',
        description: 'Studio Ghibli inspired artistic style',
        strength: 1.0,
        category: 'artistic',
        is_active: true,
        is_custom: false,
        metadata: { style: 'ghibli', inspiration: 'studio_ghibli' }
      },
      {
        preset_key: 'unreal_reflection',
        name: 'Emotion Mask',
        description: 'Emotional expression enhancement',
        strength: 1.0,
        category: 'portrait',
        is_active: true,
        is_custom: false,
        metadata: { style: 'portrait', enhancement: 'emotion' }
      },
      {
        preset_key: 'custom_prompt',
        name: 'Custom Prompt',
        description: 'User-defined custom generation',
        strength: 1.0,
        category: 'custom',
        is_active: true,
        is_custom: true,
        metadata: { style: 'custom', user_defined: true }
      }
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const preset of defaultPresets) {
      try {
        // Check if preset already exists
        const existing = await q(`
          SELECT id FROM presets_config WHERE preset_key = $1
        `, [preset.preset_key]);

        if (existing && existing.length > 0) {
          // Update existing preset
          await q(`
            UPDATE presets_config 
            SET preset_name = $1, preset_description = $2, preset_strength = $3, preset_category = $4, 
                is_active = $5, preset_prompt = $6, preset_negative_prompt = $7, updated_at = NOW()
            WHERE preset_key = $8
          `, [
            preset.preset_name, preset.preset_description, preset.preset_strength, preset.preset_category,
            preset.is_active, preset.preset_prompt || '', preset.preset_negative_prompt || '', preset.preset_key
          ]);
          updatedCount++;
          console.log(`✏️ [Admin] Updated preset: ${preset.preset_key}`);
        } else {
          // Create new preset
          const created = await q(`
            INSERT INTO presets_config (preset_key, preset_name, preset_description, preset_strength, preset_category, 
                                     is_active, preset_prompt, preset_negative_prompt, preset_rotation_index, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            RETURNING id
          `, [
            preset.preset_key, preset.preset_name, preset.preset_description, preset.preset_strength,
            preset.preset_category, preset.is_active, preset.preset_prompt || '', preset.preset_negative_prompt || '', 0
          ]);
          
          if (created && created.length > 0) {
            createdCount++;
            console.log(`✅ [Admin] Created preset: ${preset.preset_key}`);
          }
        }
      } catch (error) {
        console.error(`❌ [Admin] Error processing preset ${preset.preset_key}:`, error);
      }
    }

    console.log(`🌱 [Admin] Preset seeding completed: ${createdCount} created, ${updatedCount} updated`);

    return json({
      success: true,
      message: 'Preset seeding completed',
      created: createdCount,
      updated: updatedCount,
      total: createdCount + updatedCount
    });

  } catch (error) {
    console.error('💥 [Admin] Error seeding presets:', error);
    return json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};
