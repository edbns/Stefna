-- Add avatar_url column to users table for profile photos
-- This fixes the issue where profile updates weren't persisting

-- Step 1: Add avatar_url column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Step 2: Add updated_at column if it doesn't exist (needed for profile updates)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 3: Create index for avatar_url lookups (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON public.users(avatar_url);

-- Step 4: Create index for updated_at (for tracking profile changes)
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON public.users(updated_at);

-- Step 5: Create a trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Create trigger on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Step 7: Grant necessary permissions
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Step 8: Verify the changes
-- You can run this query to check the table structure:
-- \d public.users

-- Step 9: Optional: Update existing users with default avatar if needed
-- UPDATE public.users SET avatar_url = NULL WHERE avatar_url IS NULL;

-- Step 10: Optional: Add comment to document the column
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user profile photo/avatar image';
COMMENT ON COLUMN public.users.updated_at IS 'Timestamp when user profile was last updated';
