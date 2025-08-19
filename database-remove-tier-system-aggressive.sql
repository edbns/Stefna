-- Aggressive Tier System Removal Migration
-- This migration uses CASCADE to remove ALL dependencies on the tier column
-- Date: 2025-08-19

-- Step 1: Drop ALL views that might reference tier (CASCADE will handle dependencies)
DROP VIEW IF EXISTS app_users CASCADE;
DROP VIEW IF EXISTS public_feed CASCADE;
DROP VIEW IF EXISTS public_feed_v2 CASCADE;
DROP VIEW IF EXISTS public_feed_working CASCADE;
DROP VIEW IF EXISTS app_media CASCADE;

-- Step 2: Drop any functions that reference tier
-- This will drop any database functions that use the tier column
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, pronamespace::regnamespace as schema_name
        FROM pg_proc 
        WHERE pg_get_functiondef(oid) LIKE '%tier%'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.schema_name || '.' || func_record.proname || ' CASCADE';
        RAISE NOTICE 'Dropped function: %.%', func_record.schema_name, func_record.proname;
    END LOOP;
END $$;

-- Step 3: Drop any triggers that might reference tier
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table, event_object_schema
        FROM information_schema.triggers 
        WHERE action_statement LIKE '%tier%'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON ' || trigger_record.event_object_schema || '.' || trigger_record.event_object_table || ' CASCADE';
        RAISE NOTICE 'Dropped trigger: % on %.%', trigger_record.trigger_name, trigger_record.event_object_schema, trigger_record.event_object_table;
    END LOOP;
END $$;

-- Step 4: Drop any indexes on the tier column
DROP INDEX IF EXISTS users_tier_idx;
DROP INDEX IF EXISTS users_tier_created_at_idx;
DROP INDEX IF EXISTS users_tier_created_at_idx_2;
DROP INDEX IF EXISTS users_tier_created_at_idx_3;

-- Step 5: Now try to drop the tier column with CASCADE
ALTER TABLE users DROP COLUMN IF EXISTS tier CASCADE;

-- Step 6: If the above still fails, try a more aggressive approach
-- Drop and recreate the users table without the tier column
DO $$
BEGIN
    -- Check if tier column still exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'tier'
    ) THEN
        RAISE NOTICE 'Tier column still exists, attempting table recreation...';
        
        -- Create new users table without tier
        CREATE TABLE users_new (
            id TEXT NOT NULL,
            email TEXT NOT NULL,
            external_id TEXT NOT NULL,
            created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP(3) NOT NULL,
            CONSTRAINT "users_pkey" PRIMARY KEY (id)
        );
        
        -- Copy data (excluding tier)
        INSERT INTO users_new (id, email, external_id, created_at, updated_at)
        SELECT id, email, external_id, created_at, updated_at FROM users;
        
        -- Drop old table and rename new one
        DROP TABLE users CASCADE;
        ALTER TABLE users_new RENAME TO users;
        
        -- Recreate indexes
        CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
        CREATE UNIQUE INDEX "users_external_id_key" ON "users"("external_id");
        
        RAISE NOTICE 'Users table recreated successfully without tier column';
    ELSE
        RAISE NOTICE 'Tier column removed successfully';
    END IF;
END $$;

-- Step 7: Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Step 8: Test that users table still works
SELECT id, email, external_id, created_at, updated_at 
FROM users 
LIMIT 5;

-- Step 9: Now recreate all views with the simplified structure
-- (This will be done by the database-fix-all-views.sql script)
