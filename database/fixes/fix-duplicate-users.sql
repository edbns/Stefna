-- 🚨 FIX DUPLICATE USERS IN DATABASE
-- This script will clean up duplicate user accounts and fix the data integrity issues
-- Run this script CAREFULLY as it will modify your user data

-- Step 1: First, let's see the damage - show all users with their emails
SELECT 
    id, 
    email, 
    created_at,
    CASE 
        WHEN email IN (SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1) 
        THEN 'DUPLICATE' 
        ELSE 'UNIQUE' 
    END as status
FROM users 
ORDER BY email, created_at;

-- Step 2: Show duplicate emails and how many times they appear
SELECT 
    email, 
    COUNT(*) as duplicate_count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 3: Create a backup table before we clean up
CREATE TABLE IF NOT EXISTS users_backup_before_cleanup AS 
SELECT * FROM users;

-- Step 4: Identify which users to keep (keeping the OLDEST account for each email)
WITH users_to_keep AS (
    SELECT DISTINCT ON (email) 
        id,
        email,
        created_at
    FROM users
    ORDER BY email, created_at ASC  -- Keep the oldest account
),
users_to_delete AS (
    SELECT u.id, u.email, u.created_at
    FROM users u
    WHERE NOT EXISTS (
        SELECT 1 FROM users_to_keep utk 
        WHERE utk.id = u.id
    )
)
SELECT 
    'TO_DELETE' as action,
    id,
    email,
    created_at
FROM users_to_delete
UNION ALL
SELECT 
    'TO_KEEP' as action,
    id,
    email,
    created_at
FROM users_to_keep
ORDER BY email, action DESC;

-- Step 5: Clean up related tables for users we're about to delete
-- First, let's see what data would be affected
WITH users_to_delete AS (
    SELECT u.id
    FROM users u
    WHERE u.id NOT IN (
        SELECT DISTINCT ON (email) id
        FROM users
        ORDER BY email, created_at ASC
    )
)
SELECT 
    'user_credits' as table_name,
    COUNT(*) as records_to_delete
FROM user_credits 
WHERE user_id IN (SELECT id FROM users_to_delete)
UNION ALL
SELECT 
    'user_settings' as table_name,
    COUNT(*) as records_to_delete
FROM user_settings 
WHERE user_id IN (SELECT id FROM users_to_delete)
UNION ALL
SELECT 
    'credits_ledger' as table_name,
    COUNT(*) as records_to_delete
FROM credits_ledger 
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Step 6: ACTUAL DELETION - UNCOMMENT THESE LINES TO EXECUTE
-- WARNING: This will permanently delete duplicate users!

/*
-- Delete related records first (due to foreign key constraints)
WITH users_to_delete AS (
    SELECT u.id
    FROM users u
    WHERE u.id NOT IN (
        SELECT DISTINCT ON (email) id
        FROM users
        ORDER BY email, created_at ASC
    )
)
DELETE FROM user_credits WHERE user_id IN (SELECT id FROM users_to_delete);

WITH users_to_delete AS (
    SELECT u.id
    FROM users u
    WHERE u.id NOT IN (
        SELECT DISTINCT ON (email) id
        FROM users
        ORDER BY email, created_at ASC
    )
)
DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users_to_delete);

WITH users_to_delete AS (
    SELECT u.id
    FROM users u
    WHERE u.id NOT IN (
        SELECT DISTINCT ON (email) id
        FROM users
        ORDER BY email, created_at ASC
    )
)
DELETE FROM credits_ledger WHERE user_id IN (SELECT id FROM users_to_delete);

-- Now delete the duplicate users
WITH users_to_keep AS (
    SELECT DISTINCT ON (email) id
    FROM users
    ORDER BY email, created_at ASC
)
DELETE FROM users 
WHERE id NOT IN (SELECT id FROM users_to_keep);
*/

-- Step 7: Verify the cleanup worked
SELECT 
    'Total users after cleanup' as metric,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Unique emails after cleanup' as metric,
    COUNT(DISTINCT email) as count
FROM users;

-- Step 8: Fix the user_settings table to ensure privacy-first defaults
UPDATE user_settings 
SET share_to_feed = FALSE 
WHERE share_to_feed IS NULL OR share_to_feed = TRUE;

-- Step 9: Add a unique constraint on email to prevent future duplicates
-- ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
