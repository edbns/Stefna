-- Database Migration: Notifications System (FIXED)
-- Creates notifications table and triggers for remix notifications

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,  -- Using TEXT to match media_assets.user_id
  kind text NOT NULL CHECK (kind IN ('remix', 'like', 'share', 'system')),
  media_id uuid REFERENCES public.media_assets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 2. Create indexes for efficient notification queries
CREATE INDEX IF NOT EXISTS notifications_user_id_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_id_read_idx
  ON public.notifications (user_id, read);

CREATE INDEX IF NOT EXISTS notifications_kind_idx
  ON public.notifications (kind);

CREATE INDEX IF NOT EXISTS notifications_media_id_idx
  ON public.notifications (media_id);

-- 3. Create function to automatically send remix notifications
CREATE OR REPLACE FUNCTION notify_remix()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for new records that have a parent_id (remixes)
  IF NEW.parent_id IS NOT NULL THEN
    -- Log the remix for debugging
    RAISE NOTICE 'Remix created: child=%, parent=%', NEW.id, NEW.parent_id;
    
    -- The actual notification will be sent via the Netlify function
    -- This trigger just logs the event
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to call notification function on new media with parent_id
DROP TRIGGER IF EXISTS trigger_notify_remix ON public.media_assets;
CREATE TRIGGER trigger_notify_remix
  AFTER INSERT ON public.media_assets
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION notify_remix();

-- 5. RLS Policies for notifications
-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
DROP POLICY IF EXISTS notifications_user_policy ON public.notifications;
CREATE POLICY notifications_user_policy ON public.notifications
  FOR ALL USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR user_id = current_setting('request.jwt.claims', true)::json->>'userId'
  );

-- 6. Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(target_user_id text)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.notifications
    WHERE user_id = target_user_id
    AND read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(target_user_id text, notification_ids uuid[] DEFAULT NULL)
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  IF notification_ids IS NULL THEN
    -- Mark all notifications as read for the user
    UPDATE public.notifications
    SET read = true
    WHERE user_id = target_user_id AND read = false;
  ELSE
    -- Mark specific notifications as read
    UPDATE public.notifications
    SET read = true
    WHERE user_id = target_user_id
    AND id = ANY(notification_ids)
    AND read = false;
  END IF;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to clean up old notifications (optional)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_to_keep integer DEFAULT 30)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep
  AND read = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to get notifications for a user (with pagination)
CREATE OR REPLACE FUNCTION get_user_notifications(
  target_user_id text,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0,
  unread_only boolean DEFAULT false
)
RETURNS TABLE (
  id uuid,
  kind text,
  media_id uuid,
  created_at timestamptz,
  read boolean,
  metadata jsonb
) AS $$
BEGIN
  IF unread_only THEN
    RETURN QUERY
    SELECT n.id, n.kind, n.media_id, n.created_at, n.read, n.metadata
    FROM public.notifications n
    WHERE n.user_id = target_user_id AND n.read = false
    ORDER BY n.created_at DESC
    LIMIT limit_count OFFSET offset_count;
  ELSE
    RETURN QUERY
    SELECT n.id, n.kind, n.media_id, n.created_at, n.read, n.metadata
    FROM public.notifications n
    WHERE n.user_id = target_user_id
    ORDER BY n.created_at DESC
    LIMIT limit_count OFFSET offset_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Notifications migration completed successfully!';
  RAISE NOTICE 'Created: notifications table with proper indexes';
  RAISE NOTICE 'Created: RLS policies for user privacy';
  RAISE NOTICE 'Created: helper functions for notification management';
  RAISE NOTICE 'Created: trigger for remix notifications';
END $$;
