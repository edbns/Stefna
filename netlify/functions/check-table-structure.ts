// netlify/functions/check-table-structure.ts
// Simple function to check actual table structure and column types

import { Handler } from '@netlify/functions';
import { q } from './_db';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        'Access-Control-Allow-Methods': 'GET, OPTIONS' 
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Check all tables that might have id columns
    const tables = [
      'users', 'user_credits', 'credits_ledger', 'custom_prompt_media',
      'emotion_mask_media', 'ghibli_reaction_media', 'neo_glitch_media',
      'presets_media', 'story', 'story_photo', 'video_jobs',
      'referral_signups', 'ai_generations', 'assets', 'presets_config',
      'app_config', 'auth_otps'
    ];

    const results: any[] = [];

    for (const tableName of tables) {
      try {
        // Check if table exists and get its structure
        const tableInfo = await q(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = $1 
          AND column_name = 'id'
          ORDER BY ordinal_position
        `, [tableName]);

        if (tableInfo && tableInfo.length > 0) {
          results.push({
            table: tableName,
            exists: true,
            columns: tableInfo
          });
        } else {
          results.push({
            table: tableName,
            exists: false,
            columns: []
          });
        }
      } catch (error) {
        results.push({
          table: tableName,
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        'Access-Control-Allow-Methods': 'GET, OPTIONS' 
      },
      body: JSON.stringify({
        message: 'Table structure check completed',
        results: results
      })
    };

  } catch (error) {
    console.error('❌ [CheckTableStructure] Error:', error);
    
    return {
      statusCode: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        'Access-Control-Allow-Methods': 'GET, OPTIONS' 
      },
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Failed to check table structure',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
