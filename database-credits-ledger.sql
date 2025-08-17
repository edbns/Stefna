-- Credits Ledger Table for Stefna v2
-- This table is now managed by the new credits system in database-usage-schema.sql
-- The old schema has been replaced with a more robust system that includes:
-- - Two-phase charging (reserve -> commit/refund)
-- - Idempotent operations
-- - Daily cap enforcement
-- - Referral tracking

-- This file is kept for reference but the actual schema is now in database-usage-schema.sql
-- The new system uses the app.* functions and tables defined there.
