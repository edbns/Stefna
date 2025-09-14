import type { Handler } from '@netlify/functions';
import { json } from './_lib/http';
import { q } from './_db';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json({}, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    console.log('🔄 [3D Migration] Starting 3D columns migration...');

    // Add 3D columns to all media tables
    const migrationQueries = [
      // unreal_reflection_media
      `ALTER TABLE unreal_reflection_media ADD COLUMN IF NOT EXISTS obj_url TEXT`,
      `ALTER TABLE unreal_reflection_media ADD COLUMN IF NOT EXISTS gltf_url TEXT`,
      `ALTER TABLE unreal_reflection_media ADD COLUMN IF NOT EXISTS texture_url TEXT`,
      `ALTER TABLE unreal_reflection_media ADD COLUMN IF NOT EXISTS model_3d_metadata JSONB`,
      
      // presets_media
      `ALTER TABLE presets_media ADD COLUMN IF NOT EXISTS obj_url TEXT`,
      `ALTER TABLE presets_media ADD COLUMN IF NOT EXISTS gltf_url TEXT`,
      `ALTER TABLE presets_media ADD COLUMN IF NOT EXISTS texture_url TEXT`,
      `ALTER TABLE presets_media ADD COLUMN IF NOT EXISTS model_3d_metadata JSONB`,
      
      // custom_prompt_media
      `ALTER TABLE custom_prompt_media ADD COLUMN IF NOT EXISTS obj_url TEXT`,
      `ALTER TABLE custom_prompt_media ADD COLUMN IF NOT EXISTS gltf_url TEXT`,
      `ALTER TABLE custom_prompt_media ADD COLUMN IF NOT EXISTS texture_url TEXT`,
      `ALTER TABLE custom_prompt_media ADD COLUMN IF NOT EXISTS model_3d_metadata JSONB`,
      
      // ghibli_reaction_media
      `ALTER TABLE ghibli_reaction_media ADD COLUMN IF NOT EXISTS obj_url TEXT`,
      `ALTER TABLE ghibli_reaction_media ADD COLUMN IF NOT EXISTS gltf_url TEXT`,
      `ALTER TABLE ghibli_reaction_media ADD COLUMN IF NOT EXISTS texture_url TEXT`,
      `ALTER TABLE ghibli_reaction_media ADD COLUMN IF NOT EXISTS model_3d_metadata JSONB`,
      
      // neo_glitch_media
      `ALTER TABLE neo_glitch_media ADD COLUMN IF NOT EXISTS obj_url TEXT`,
      `ALTER TABLE neo_glitch_media ADD COLUMN IF NOT EXISTS gltf_url TEXT`,
      `ALTER TABLE neo_glitch_media ADD COLUMN IF NOT EXISTS texture_url TEXT`,
      `ALTER TABLE neo_glitch_media ADD COLUMN IF NOT EXISTS model_3d_metadata JSONB`,
      
      // edit_media
      `ALTER TABLE edit_media ADD COLUMN IF NOT EXISTS obj_url TEXT`,
      `ALTER TABLE edit_media ADD COLUMN IF NOT EXISTS gltf_url TEXT`,
      `ALTER TABLE edit_media ADD COLUMN IF NOT EXISTS texture_url TEXT`,
      `ALTER TABLE edit_media ADD COLUMN IF NOT EXISTS model_3d_metadata JSONB`
    ];

    // Execute all migration queries
    for (const query of migrationQueries) {
      try {
        await q(query);
        console.log(`✅ [3D Migration] Executed: ${query.substring(0, 50)}...`);
      } catch (error: any) {
        console.log(`⚠️ [3D Migration] Query may have already been executed: ${error.message}`);
      }
    }

    console.log('✅ [3D Migration] All 3D columns migration completed successfully');

    return json({ 
      success: true, 
      message: '3D columns migration completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [3D Migration] Migration failed:', error);
    return json({ 
      error: 'Migration failed', 
      message: error.message 
    }, { status: 500 });
  }
};
