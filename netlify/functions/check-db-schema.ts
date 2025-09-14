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
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    });
  }

  if (event.httpMethod !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    console.log('🔍 [Schema Check] Checking database schema for 3D columns...');

    // Check which tables have the 3D columns
    const schemaCheck = await q(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('unreal_reflection_media', 'presets_media', 'custom_prompt_media', 'ghibli_reaction_media', 'neo_glitch_media', 'edit_media')
      AND column_name IN ('obj_url', 'gltf_url', 'texture_url', 'model_3d_metadata')
      ORDER BY table_name, column_name;
    `);

    console.log('📊 [Schema Check] Found columns:', schemaCheck);

    // Check if any tables are missing the columns
    const missingColumns = [];
    const tables = ['unreal_reflection_media', 'presets_media', 'custom_prompt_media', 'ghibli_reaction_media', 'neo_glitch_media', 'edit_media'];
    const columns = ['obj_url', 'gltf_url', 'texture_url', 'model_3d_metadata'];

    for (const table of tables) {
      for (const column of columns) {
        const exists = schemaCheck.find((row: any) => row.table_name === table && row.column_name === column);
        if (!exists) {
          missingColumns.push(`${table}.${column}`);
        }
      }
    }

    console.log('❌ [Schema Check] Missing columns:', missingColumns);

    return json({ 
      success: true,
      existingColumns: schemaCheck,
      missingColumns: missingColumns,
      needsMigration: missingColumns.length > 0,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [Schema Check] Failed:', error);
    return json({ 
      error: 'Schema check failed', 
      message: error.message 
    }, { status: 500 });
  }
};
