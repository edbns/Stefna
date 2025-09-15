import type { Handler } from "@netlify/functions";
import { q } from './_db';
import { json } from "./_lib/http";

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  console.log('🔧 [fix-likes-constraint] Starting constraint fix...');

  try {
    // Drop the existing constraint
    console.log('🔧 [fix-likes-constraint] Dropping existing constraint...');
    await q('ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_media_type_check');

    // Add the updated constraint that includes 'edit'
    console.log('🔧 [fix-likes-constraint] Adding updated constraint...');
    await q(`ALTER TABLE likes ADD CONSTRAINT likes_media_type_check 
             CHECK (media_type IN ('custom_prompt', 'unreal_reflection', 'ghibli_reaction', 'neo_glitch', 'presets', 'story', 'edit'))`);

    console.log('✅ [fix-likes-constraint] Constraint updated successfully!');

    return json({ 
      success: true, 
      message: 'Likes table constraint updated to include edit media type' 
    });

  } catch (error) {
    console.error('💥 [fix-likes-constraint] Error:', error);
    return json({ 
      error: 'Failed to update constraint', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};
