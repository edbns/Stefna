import { Handler } from '@netlify/functions';
import { json } from './_lib/http';
import { withAuth } from './_withAuth';

export const handler: Handler = withAuth(async (event, context) => {
  // Only allow admin users to run this migration
  const userId = context.user?.id;
  if (!userId) {
    return json({ error: 'Authentication required' }, { statusCode: 401 });
  }

  // Check if user is admin (you can add your admin check logic here)
  // For now, we'll allow any authenticated user to run this migration
  // In production, you might want to restrict this to specific admin users

  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    console.log('🔗 Connected to database for migration');

    // First, fix any existing negative values
    const fixNegativeResult = await pool.query(`
      UPDATE users 
      SET total_likes_received = 0 
      WHERE total_likes_received < 0
    `);
    
    console.log(`✅ Fixed ${fixNegativeResult.rowCount} users with negative likes`);

    // Add a check constraint to prevent future negative values
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD CONSTRAINT check_total_likes_received_non_negative 
        CHECK (total_likes_received >= 0)
      `);
      console.log('✅ Added check constraint for non-negative likes');
    } catch (constraintError: any) {
      if (constraintError.code === '42710') {
        console.log('ℹ️ Constraint already exists, skipping');
      } else {
        throw constraintError;
      }
    }

    // Update the trigger function to ensure it never goes below 0
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_likes_count()
      RETURNS TRIGGER AS $$
      BEGIN
          IF TG_OP = 'INSERT' THEN
              -- Increment likes count
              EXECUTE format('UPDATE %I SET likes_count = likes_count + 1 WHERE id = $1', NEW.media_type || '_media')
              USING NEW.media_id;
              
              -- Update user's total likes received (increment)
              UPDATE users 
              SET total_likes_received = total_likes_received + 1 
              WHERE id = (
                  SELECT user_id 
                  FROM (
                      SELECT user_id FROM custom_prompt_media WHERE id = NEW.media_id AND NEW.media_type = 'custom_prompt'
                      UNION ALL
                      SELECT user_id FROM presets_media WHERE id = NEW.media_id AND NEW.media_type = 'presets'
                      UNION ALL
                      SELECT user_id FROM emotion_mask_media WHERE id = NEW.media_id AND NEW.media_type = 'emotion_mask'
                      UNION ALL
                      SELECT user_id FROM ghibli_reaction_media WHERE id = NEW.media_id AND NEW.media_type = 'ghibli_reaction'
                      UNION ALL
                      SELECT user_id FROM neo_glitch_media WHERE id = NEW.media_id AND NEW.media_type = 'neo_glitch'
                      UNION ALL
                      SELECT user_id FROM story_media WHERE id = NEW.media_id AND NEW.media_type = 'story'
                  ) AS media_users
              );
              
          ELSIF TG_OP = 'DELETE' THEN
              -- Decrement likes count
              EXECUTE format('UPDATE %I SET likes_count = likes_count - 1 WHERE id = $1', OLD.media_type || '_media')
              USING OLD.media_id;
              
              -- Update user's total likes received (decrement, but never below 0)
              UPDATE users 
              SET total_likes_received = GREATEST(total_likes_received - 1, 0)
              WHERE id = (
                  SELECT user_id 
                  FROM (
                      SELECT user_id FROM custom_prompt_media WHERE id = OLD.media_id AND OLD.media_type = 'custom_prompt'
                      UNION ALL
                      SELECT user_id FROM presets_media WHERE id = OLD.media_id AND OLD.media_type = 'presets'
                      UNION ALL
                      SELECT user_id FROM emotion_mask_media WHERE id = OLD.media_id AND OLD.media_type = 'emotion_mask'
                      UNION ALL
                      SELECT user_id FROM ghibli_reaction_media WHERE id = OLD.media_id AND OLD.media_type = 'ghibli_reaction'
                      UNION ALL
                      SELECT user_id FROM neo_glitch_media WHERE id = OLD.media_id AND OLD.media_type = 'neo_glitch'
                      UNION ALL
                      SELECT user_id FROM story_media WHERE id = OLD.media_id AND OLD.media_type = 'story'
                  ) AS media_users
              );
          END IF;
          
          RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Updated trigger function to prevent negative values');

    // Verify the fix worked
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as negative_count 
      FROM users 
      WHERE total_likes_received < 0
    `);
    
    const negativeCount = verifyResult.rows[0].negative_count;
    console.log(`🔍 Users with negative likes after fix: ${negativeCount}`);

    await pool.end();

    return json({
      success: true,
      message: 'Migration completed successfully',
      fixedUsers: fixNegativeResult.rowCount,
      remainingNegativeUsers: negativeCount
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { statusCode: 500 });
  }
});
