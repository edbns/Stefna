-- Add total_likes_received field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_likes_received INTEGER DEFAULT 0;

-- Update existing users with their current like counts
UPDATE users 
SET total_likes_received = (
  SELECT COALESCE(COUNT(*), 0)
  FROM likes l
  JOIN (
    SELECT id FROM neo_glitch_media WHERE user_id = users.id
    UNION ALL
    SELECT id FROM ghibli_reaction_media WHERE user_id = users.id
    UNION ALL
    SELECT id FROM emotion_mask_media WHERE user_id = users.id
    UNION ALL
    SELECT id FROM presets_media WHERE user_id = users.id
    UNION ALL
    SELECT id FROM custom_prompt_media WHERE user_id = users.id
    UNION ALL
    SELECT id FROM story WHERE user_id = users.id
  ) media ON l.media_id = media.id
)
WHERE total_likes_received = 0;

-- Create trigger to automatically update total_likes_received when likes are added/removed
CREATE OR REPLACE FUNCTION update_user_likes_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the user_id for the media that was liked/unliked
  DECLARE
    target_user_id TEXT;
  BEGIN
    -- Find the user who owns the media
    SELECT user_id INTO target_user_id
    FROM (
      SELECT user_id FROM neo_glitch_media WHERE id = COALESCE(NEW.media_id, OLD.media_id)
      UNION ALL
      SELECT user_id FROM ghibli_reaction_media WHERE id = COALESCE(NEW.media_id, OLD.media_id)
      UNION ALL
      SELECT user_id FROM emotion_mask_media WHERE id = COALESCE(NEW.media_id, OLD.media_id)
      UNION ALL
      SELECT user_id FROM presets_media WHERE id = COALESCE(NEW.media_id, OLD.media_id)
      UNION ALL
      SELECT user_id FROM custom_prompt_media WHERE id = COALESCE(NEW.media_id, OLD.media_id)
      UNION ALL
      SELECT user_id FROM story WHERE id = COALESCE(NEW.media_id, OLD.media_id)
    ) media_owners
    LIMIT 1;
    
    IF target_user_id IS NOT NULL THEN
      -- Update the total_likes_received count for the user
      UPDATE users 
      SET total_likes_received = (
        SELECT COALESCE(COUNT(*), 0)
        FROM likes l
        JOIN (
          SELECT id FROM neo_glitch_media WHERE user_id = target_user_id
          UNION ALL
          SELECT id FROM ghibli_reaction_media WHERE user_id = target_user_id
          UNION ALL
          SELECT id FROM emotion_mask_media WHERE user_id = target_user_id
          UNION ALL
          SELECT id FROM presets_media WHERE user_id = target_user_id
          UNION ALL
          SELECT id FROM custom_prompt_media WHERE user_id = target_user_id
          UNION ALL
          SELECT id FROM story WHERE user_id = target_user_id
        ) media ON l.media_id = media.id
      )
      WHERE id = target_user_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
  END;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for likes table
DROP TRIGGER IF EXISTS trigger_update_likes_received_insert ON likes;
DROP TRIGGER IF EXISTS trigger_update_likes_received_delete ON likes;

CREATE TRIGGER trigger_update_likes_received_insert
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_likes_received();

CREATE TRIGGER trigger_update_likes_received_delete
  AFTER DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_likes_received();
