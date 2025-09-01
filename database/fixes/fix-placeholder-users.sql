-- 🧹 CLEAN UP PLACEHOLDER USERS
-- This script removes all the placeholder users that were accidentally created
-- These users have emails like 'user-UUID@placeholder.com' and are not real users

-- Step 1: Show all placeholder users
SELECT 
    id,
    email,
    name,
    created_at,
    CASE 
        WHEN email LIKE 'user-%@placeholder.com' THEN 'PLACEHOLDER - TO DELETE'
        ELSE 'REAL USER - KEEP'
    END as user_type
FROM users
ORDER BY 
    CASE WHEN email LIKE 'user-%@placeholder.com' THEN 1 ELSE 0 END,
    created_at;

-- Step 2: Count placeholder vs real users
SELECT 
    COUNT(CASE WHEN email LIKE 'user-%@placeholder.com' THEN 1 END) as placeholder_users,
    COUNT(CASE WHEN email NOT LIKE 'user-%@placeholder.com' THEN 1 END) as real_users,
    COUNT(*) as total_users
FROM users;

-- Step 3: Check if placeholder users have any associated data
WITH placeholder_users AS (
    SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
)
SELECT 
    'Media records from placeholder users' as check_type,
    (SELECT COUNT(*) FROM custom_prompt_media WHERE user_id IN (SELECT id FROM placeholder_users)) as custom_prompt,
    (SELECT COUNT(*) FROM emotion_mask_media WHERE user_id IN (SELECT id FROM placeholder_users)) as emotion_mask,
    (SELECT COUNT(*) FROM ghibli_reaction_media WHERE user_id IN (SELECT id FROM placeholder_users)) as ghibli,
    (SELECT COUNT(*) FROM neo_glitch_media WHERE user_id IN (SELECT id FROM placeholder_users)) as neo_glitch,
    (SELECT COUNT(*) FROM presets_media WHERE user_id IN (SELECT id FROM placeholder_users)) as presets;

-- Step 4: Check credit transactions from placeholder users
WITH placeholder_users AS (
    SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
)
SELECT 
    'Credits used by placeholder users' as metric,
    COUNT(*) as transactions,
    SUM(ABS(amount)) as total_credits_used
FROM credits_ledger 
WHERE user_id IN (SELECT id FROM placeholder_users);

-- Step 5: CLEANUP - DELETE PLACEHOLDER USERS AND ALL THEIR DATA
-- EXECUTING NOW - Deleting all placeholder users and their data

-- Delete all data associated with placeholder users
WITH placeholder_users AS (
    SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
)
DELETE FROM credits_ledger WHERE user_id IN (SELECT id FROM placeholder_users);

WITH placeholder_users AS (
    SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
)
DELETE FROM user_credits WHERE user_id IN (SELECT id FROM placeholder_users);

WITH placeholder_users AS (
    SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
)
DELETE FROM user_settings WHERE user_id IN (SELECT id FROM placeholder_users);

WITH placeholder_users AS (
    SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
)
DELETE FROM custom_prompt_media WHERE user_id IN (SELECT id FROM placeholder_users);

WITH placeholder_users AS (
    SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
)
DELETE FROM emotion_mask_media WHERE user_id IN (SELECT id FROM placeholder_users);

WITH placeholder_users AS (
    SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
)
DELETE FROM ghibli_reaction_media WHERE user_id IN (SELECT id FROM placeholder_users);

WITH placeholder_users AS (
    SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
)
DELETE FROM neo_glitch_media WHERE user_id IN (SELECT id FROM placeholder_users);

WITH placeholder_users AS (
    SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
)
DELETE FROM presets_media WHERE user_id IN (SELECT id FROM placeholder_users);

WITH placeholder_users AS (
    SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
)
DELETE FROM story WHERE user_id IN (SELECT id FROM placeholder_users);

WITH placeholder_users AS (
    SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
)
DELETE FROM assets WHERE user_id IN (SELECT id FROM placeholder_users);

WITH placeholder_users AS (
    SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
)
DELETE FROM referral_signups 
WHERE referrer_user_id IN (SELECT id FROM placeholder_users) 
   OR new_user_id IN (SELECT id FROM placeholder_users);

-- Finally, delete the placeholder users themselves
DELETE FROM users WHERE email LIKE 'user-%@placeholder.com';

-- Step 6: Verify cleanup results
SELECT 
    'Users remaining after cleanup' as metric,
    COUNT(*) as count,
    STRING_AGG(email, ', ' ORDER BY created_at) as emails
FROM users;

-- Step 7: Fix the update-profile function to prevent this from happening again
-- The fix needs to be done in the code, not SQL
