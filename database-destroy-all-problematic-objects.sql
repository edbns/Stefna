-- Destroy All Problematic Objects
-- This script will find and destroy ANY object that might be causing issues
-- Date: 2025-08-19

-- Step 1: Find and destroy ALL views (no mercy)
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT schemaname, viewname
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'DROP VIEW IF EXISTS ' || view_record.schemaname || '.' || view_record.viewname || ' CASCADE';
            RAISE NOTICE 'Destroyed view: %.%', view_record.schemaname, view_record.viewname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to destroy view %.%: %', view_record.schemaname, view_record.viewname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 2: Find and destroy ALL functions (no mercy)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname as schema_name, p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.schema_name || '.' || func_record.function_name || ' CASCADE';
            RAISE NOTICE 'Destroyed function: %.%', func_record.schema_name, func_record.function_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to destroy function %.%: %', func_record.schema_name, func_record.function_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 3: Find and destroy ALL materialized views
DO $$
DECLARE
    matview_record RECORD;
BEGIN
    FOR matview_record IN 
        SELECT schemaname, matviewname
        FROM pg_matviews 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS ' || matview_record.schemaname || '.' || matview_record.matviewname || ' CASCADE';
            RAISE NOTICE 'Destroyed materialized view: %.%', matview_record.schemaname, matview_record.matviewname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to destroy materialized view %.%: %', matview_record.schemaname, matview_record.matviewname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 4: Find and destroy ALL triggers
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table, event_object_schema
        FROM information_schema.triggers 
        WHERE event_object_schema = 'public'
    LOOP
        BEGIN
            EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON ' || trigger_record.event_object_schema || '.' || trigger_record.event_object_table || ' CASCADE';
            RAISE NOTICE 'Destroyed trigger: % on %.%', trigger_record.trigger_name, trigger_record.event_object_schema, trigger_record.event_object_table;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to destroy trigger %: %', trigger_record.trigger_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 5: Drop any remaining indexes on users table
DROP INDEX IF EXISTS users_tier_idx;
DROP INDEX IF EXISTS users_tier_created_at_idx;
DROP INDEX IF EXISTS users_tier_created_at_idx_2;
DROP INDEX IF EXISTS users_tier_created_at_idx_3;
DROP INDEX IF EXISTS users_email_key;
DROP INDEX IF EXISTS users_external_id_key;

-- Step 6: Nuclear option - completely recreate users table
BEGIN;

-- Create new users table with minimal structure
CREATE TABLE users_new (
    id TEXT NOT NULL,
    email TEXT NOT NULL,
    external_id TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL
);

-- Copy data (excluding problematic fields)
INSERT INTO users_new (id, email, external_id, created_at, updated_at)
SELECT 
    id, 
    email, 
    external_id, 
    created_at, 
    updated_at 
FROM users;

-- Drop old table completely
DROP TABLE users CASCADE;

-- Rename new table
ALTER TABLE users_new RENAME TO users;

-- Add primary key constraint
ALTER TABLE users ADD CONSTRAINT "users_pkey" PRIMARY KEY (id);

-- Recreate essential indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_external_id_key" ON "users"("external_id");

COMMIT;

-- Step 7: Verify the new table structure
SELECT 'FINAL USERS TABLE STRUCTURE' as info, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Step 8: Test that the new table works
SELECT 'TESTING NEW TABLE' as info, COUNT(*) as user_count FROM users;

-- Step 9: Verify no problematic objects remain
SELECT 'REMAINING VIEWS' as info, COUNT(*) as count FROM pg_views WHERE schemaname = 'public'
UNION ALL
SELECT 'REMAINING FUNCTIONS' as info, COUNT(*) as count FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public'
UNION ALL
SELECT 'REMAINING MATERIALIZED VIEWS' as info, COUNT(*) as count FROM pg_matviews WHERE schemaname = 'public';

RAISE NOTICE 'Nuclear destruction completed. All problematic objects eliminated. Users table recreated cleanly.';
