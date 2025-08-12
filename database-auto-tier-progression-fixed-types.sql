-- Automatic Tier Progression System - Fixed Data Types
-- Users get promoted automatically based on metrics

-- Step 1: Create the main promotion function FIRST
CREATE OR REPLACE FUNCTION public.check_and_promote_user_tier(p_user_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_current_tier TEXT;
  v_total_photos INTEGER;
  v_account_age_days INTEGER;
  v_total_usage INTEGER;
  v_new_tier TEXT;
  v_promotion_message TEXT;
BEGIN
  -- Get current user metrics
  SELECT 
    u.tier,
    COALESCE(u.total_photos, 0),
    EXTRACT(DAYS FROM (NOW() - u.created_at)),
    COALESCE(u.daily_usage, 0)
  INTO v_current_tier, v_total_photos, v_account_age_days, v_total_usage
  FROM public.users u
  WHERE u.id = p_user_id;
  
  -- Default to registered if no user found
  IF v_current_tier IS NULL THEN
    RETURN 'User not found';
  END IF;
  
  -- Determine new tier based on metrics
  v_new_tier := v_current_tier;
  
  -- Promotion to VERIFIED tier
  IF v_current_tier = 'registered' AND 
     v_total_photos >= 15 AND 
     v_account_age_days >= 7 AND 
     v_total_usage >= 50 THEN
    v_new_tier := 'verified';
    v_promotion_message := 'Congratulations! You''ve been promoted to Verified Creator!';
  
  -- Promotion to CONTRIBUTOR tier  
  ELSIF v_current_tier = 'verified' AND 
        v_total_photos >= 75 AND 
        v_account_age_days >= 30 AND 
        v_total_usage >= 300 THEN
    v_new_tier := 'contributor';
    v_promotion_message := 'Amazing! You''ve reached Contributor status!';
  END IF;
  
  -- Update tier if promotion earned
  IF v_new_tier != v_current_tier THEN
    UPDATE public.users 
    SET tier = v_new_tier,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Log the promotion for admin tracking
    INSERT INTO public.user_promotions (
      user_id, 
      old_tier, 
      new_tier, 
      promoted_at, 
      metrics_at_promotion
    ) VALUES (
      p_user_id,
      v_current_tier,
      v_new_tier,
      NOW(),
      jsonb_build_object(
        'total_photos', v_total_photos,
        'account_age_days', v_account_age_days,
        'total_usage', v_total_usage
      )
    );
    
    RETURN v_promotion_message;
  END IF;
  
  RETURN 'No promotion at this time';
END;
$$;

-- Step 2: Create promotions tracking table with correct data types
CREATE TABLE IF NOT EXISTS public.user_promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id), -- Fixed: UUID references UUID
  old_tier TEXT NOT NULL,
  new_tier TEXT NOT NULL,
  promoted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metrics_at_promotion JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_promotions_user_id ON public.user_promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_promotions_promoted_at ON public.user_promotions(promoted_at);

-- Step 4: Enable RLS
ALTER TABLE public.user_promotions ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policy: Only admins can view promotions
CREATE POLICY "Admins can view all promotions" ON public.user_promotions
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM users WHERE tier = 'admin'
  ));

-- Step 6: Create trigger function that runs after media generation
CREATE OR REPLACE FUNCTION public.trigger_tier_progression()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_promotion_result TEXT;
BEGIN
  -- Only check progression for new media (not updates)
  IF TG_OP = 'INSERT' THEN
    -- Check and promote user tier
    SELECT check_and_promote_user_tier(NEW.user_id) INTO v_promotion_result;
    
    -- Log promotion result (for debugging)
    IF v_promotion_result NOT LIKE 'No promotion%' THEN
      RAISE NOTICE 'User % promoted: %', NEW.user_id, v_promotion_result;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 7: Create triggers on tables (AFTER functions exist)
DROP TRIGGER IF EXISTS auto_tier_progression_trigger ON public.media_assets;
CREATE TRIGGER auto_tier_progression_trigger
  AFTER INSERT ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_tier_progression();

-- Also trigger on assets table (for uploads)
DROP TRIGGER IF EXISTS auto_tier_progression_assets_trigger ON public.assets;
CREATE TRIGGER auto_tier_progression_assets_trigger
  AFTER INSERT ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_tier_progression();

-- Step 8: Create function to manually check promotion eligibility (for testing)
CREATE OR REPLACE FUNCTION public.check_user_promotion_eligibility(p_user_id UUID)
RETURNS TABLE(
  current_tier TEXT,
  total_photos INTEGER,
  account_age_days INTEGER,
  total_usage INTEGER,
  next_tier TEXT,
  requirements_met BOOLEAN,
  promotion_message TEXT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.tier,
    COALESCE(u.total_photos, 0),
    EXTRACT(DAYS FROM (NOW() - u.created_at))::INTEGER,
    COALESCE(u.daily_usage, 0),
    CASE 
      WHEN u.tier = 'registered' THEN 'verified'
      WHEN u.tier = 'verified' THEN 'contributor'
      ELSE 'max_tier'
    END,
    CASE 
      WHEN u.tier = 'registered' AND COALESCE(u.total_photos, 0) >= 15 AND EXTRACT(DAYS FROM (NOW() - u.created_at)) >= 7 AND COALESCE(u.daily_usage, 0) >= 50 THEN TRUE
      WHEN u.tier = 'verified' AND COALESCE(u.total_photos, 0) >= 75 AND EXTRACT(DAYS FROM (NOW() - u.created_at)) >= 30 AND COALESCE(u.daily_usage, 0) >= 300 THEN TRUE
      ELSE FALSE
    END,
    CASE 
      WHEN u.tier = 'registered' AND COALESCE(u.total_photos, 0) >= 15 AND EXTRACT(DAYS FROM (NOW() - u.created_at)) >= 7 AND COALESCE(u.daily_usage, 0) >= 50 THEN 'Ready for Verified!'
      WHEN u.tier = 'verified' AND COALESCE(u.total_photos, 0) >= 75 AND EXTRACT(DAYS FROM (NOW() - u.created_at)) >= 30 AND COALESCE(u.daily_usage, 0) >= 300 THEN 'Ready for Contributor!'
      ELSE 'Keep creating to reach the next tier!'
    END
  FROM public.users u
  WHERE u.id = p_user_id;
END;
$$;

-- Step 9: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_and_promote_user_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_promotion_eligibility(UUID) TO authenticated;
