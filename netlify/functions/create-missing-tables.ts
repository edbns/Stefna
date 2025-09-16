import type { Handler } from '@netlify/functions';
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    console.log('🔄 [Database Migration] Starting likes and edit_media table creation...');

    // Step 1: Create the likes table
    await q(`
      CREATE TABLE IF NOT EXISTS likes (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        media_id TEXT NOT NULL,
        media_type TEXT NOT NULL,
        created_at TIMESTAMPTZ(6) DEFAULT NOW(),
        updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
        UNIQUE(user_id, media_id, media_type)
      )
    `);

    // Step 2: Create the edit_media table
    await q(`
      CREATE TABLE IF NOT EXISTS edit_media (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        image_url TEXT,
        source_url TEXT NOT NULL,
        prompt TEXT NOT NULL,
        preset TEXT NOT NULL DEFAULT 'edit',
        run_id TEXT,
        fal_job_id TEXT,
        created_at TIMESTAMPTZ(6) DEFAULT NOW(),
        updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
        status TEXT DEFAULT 'completed',
        metadata JSONB DEFAULT '{}',
        stability_job_id TEXT,
        preset_week INTEGER,
        preset_rotation_index INTEGER,
        is_currently_available BOOLEAN DEFAULT TRUE
      )
    `);

    // Step 3: Create indexes for likes table
    await q(`CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_likes_media_id ON likes(media_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_likes_media_type ON likes(media_type)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_likes_user_media ON likes(user_id, media_id, media_type)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC)`);

    // Step 4: Create indexes for edit_media table
    await q(`CREATE INDEX IF NOT EXISTS idx_edit_media_status ON edit_media(status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_edit_media_user_id_created_at ON edit_media(user_id, created_at DESC)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_edit_media_fal_job_id ON edit_media(fal_job_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_edit_media_preset ON edit_media(preset)`);

    // Step 5: Create triggers for updated_at columns
    await q(`
      CREATE TRIGGER update_likes_updated_at 
      BEFORE UPDATE ON likes 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    
    await q(`
      CREATE TRIGGER update_edit_media_updated_at 
      BEFORE UPDATE ON edit_media 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    // Step 6: Verify tables were created
    const likesTable = await q(`SELECT COUNT(*) as count FROM likes`);
    const editMediaTable = await q(`SELECT COUNT(*) as count FROM edit_media`);

    console.log('✅ [Database Migration] Successfully created likes and edit_media tables');

    return json({
      success: true,
      message: 'Migration completed successfully',
      tables: {
        likes: { count: likesTable[0]?.count || 0 },
        edit_media: { count: editMediaTable[0]?.count || 0 }
      }
    });

  } catch (error: any) {
    console.error('💥 [Database Migration] Error:', error?.message || error);
    return json({ 
      error: 'Migration failed',
      details: error?.message 
    }, { status: 500 });
  }
};
