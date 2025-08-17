# Stefna Token System Documentation

## Overview
This document explains the current simplified token/credits system implemented in Stefna. The system has been cleaned up and simplified to remove unused tier complexity.

## 🏗️ User System (Simplified)

### Current Approach
- **All users get the same experience** - no more tier complexity
- **Consistent limits** for everyone
- **Simple and fair** - no social media verification needed

### Why This Approach?
- **Pivoted away from social media verification** - not doing what other platforms do
- **Focus on core functionality** - AI generation, not user status
- **Easier to maintain** - no complex tier logic
- **Better user experience** - everyone gets the same great features

## 💰 Initial Credits

### New User Signup
- **Initial credits**: 30 (matches daily limit)
- **Auto-provisioned**: When user first calls `get-user-profile`
- **One-time only**: Won't duplicate if called multiple times
- **Database**: Stored in `user_credits` table

### Why 30 credits?
- **Simple math**: 30 credits = 15 photos OR 6 videos per day
- **Daily reset**: Fresh 30 credits every 24 hours
- **No confusion**: Users can use all their credits within daily limits

## 🎁 Referral System

### Referral Bonuses (Aligned Frontend/Backend)
- **Referrer (existing user)**: +50 credits
- **New user (referred)**: +25 credits
- **Total bonus per referral**: 75 credits

### Implementation
- **Backend**: `process-referral.js` awards real credits via `credits_ledger`
- **Frontend**: `ProfileTokenDisplay.tsx` shows real backend data
- **No more localStorage confusion**: All data comes from database

## 💸 Generation Costs

### Current Costs (Working Features Only)
- **📸 Photos: 2 credits** (HD quality only)
- **🎥 Videos: 5 credits** (disabled until AIML supports video-to-video)
- **🚫 No SD option** - HD quality only for better results
- **🔄 Two-phase charging** - reserve → commit/refund prevents lost charges

### Why This Approach?
- **Focus on what works** - HD photos only until video is ready
- **Better user experience** - no broken video generation
- **Simpler pricing** - one cost for one working feature
- **Future-ready** - video support will be added when AIML provides it

### Example Usage
```
New user with 30 credits:
- Photos: 15 HD photos/day (30 ÷ 2)
- Videos: Not available yet
- Daily limit: 30 tokens (15 HD photos)
```

### Future Plans
- **🎥 Video support** will be added when AIML provides video-to-video
- **💰 Video pricing** will be set based on actual costs
- **🔄 Migration** will be seamless when video is ready

## 🔄 Daily Reset

### Reset Schedule
- **Time**: Midnight UTC (00:00)
- **What resets**: Daily usage counters
- **What doesn't reset**: Total credits balance

### Example Day
```
Day 1: 30 credits, use 20 → 10 remaining
Day 2: 30 credits (reset), use 15 → 15 remaining
Total balance: Still 10 from Day 1
```

## 🗄️ Database Tables

### Core Tables
- **`app_config`**: Global configuration (daily cap, costs, referral bonuses)
- **`user_credits`**: Current credit balance per user
- **`credits_ledger`**: Transaction history with status tracking (reserved/committed/refunded/granted)
- **`referral_signups`**: Referral tracking (one row per new user)
- **`v_user_daily_usage`**: View for daily usage calculations

### Key Functions
- **`app.allow_today_simple()`**: Check daily cap
- **`app.reserve_credits()`**: Reserve credits before generation
- **`app.finalize_credits()`**: Commit or refund reserved credits
- **`app.grant_credits()`**: Award credits (starter, referral, etc.)

### Key Fields
```sql
-- app_config
key (text) | value (jsonb)

-- user_credits
user_id (uuid) | balance (int) | updated_at (timestamptz)

-- credits_ledger  
id (uuid) | user_id (uuid) | request_id (uuid) | action (text) | amount (int) | status (text) | meta (jsonb) | created_at (timestamptz)

-- referral_signups
id (uuid) | referrer_user_id (uuid) | new_user_id (uuid) | referrer_email (text) | new_user_email (text) | created_at (timestamptz)
```

## 🚀 API Endpoints

### Credit Management
- **`/get-user-profile`**: Auto-provisions 30 credits for new users
- **`/credits-reserve`**: Reserves credits before generation (2 for images, 5 for videos)
- **`/credits-finalize`**: Commits or refunds reserved credits
- **`/deduct-credits`**: Compatibility wrapper for existing code
- **`/process-referral`**: Awards 50+25 credits for referrals

### Referral System
- **`/get-referral-stats`**: Returns real referral data from database
- **Frontend**: Calls backend instead of localStorage

## ⚠️ What Was Cleaned Up

### Removed (Unused Complexity)
- ❌ Tier system (verified, contributor)
- ❌ Automatic tier promotion
- ❌ Admin upgrade functions
- ❌ Complex tier-based limits
- ❌ Social media verification logic
- ❌ Promotions table references

### Kept (Core Functionality)
- ✅ Simple credit system
- ✅ Referral bonuses
- ✅ Daily limits
- ✅ Rate limiting
- ✅ Anti-abuse protection

## 🔧 For Future Developers

### Adding New Features
1. **Keep it simple** - no need for complex tier systems
2. **Focus on core** - AI generation, not user status
3. **Consistent limits** - same experience for everyone

### Frontend Integration
Use the `runGeneration` helper from `src/lib/credits.ts`:

```typescript
import { runGeneration } from '@/lib/credits';

await runGeneration({
  token: authToken,
  action: 'image.gen',
  runJob: async (requestId) => {
    const resp = await fetch("/.netlify/functions/aimlApi", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ prompt, image_url, requestId }),
    });
    return { ok: resp.ok };
  },
});
```

### Changing Credit Amounts
1. Update values in `app_config` table:
   ```sql
   UPDATE app_config SET value = '40' WHERE key = 'daily_cap';
   UPDATE app_config SET value = '3' WHERE key = 'image_cost';
   ```
2. Or update the defaults in `database-usage-schema.sql`
3. No code changes needed - all values are database-driven

### Referral System Changes
1. Update `process-referral.js` bonus amounts
2. Update frontend display expectations
3. Test referral flow end-to-end

## 📊 Testing

### Test Scenarios
1. **New user signup**: Should get 30 credits
2. **Daily limit**: Should reset at midnight UTC
3. **Referral**: Should award 50+25 credits
4. **Generation**: Should deduct correct amounts
5. **Insufficient credits**: Should return 402 error

### Test Commands
```bash
# Test credit provisioning
curl -H "Authorization: Bearer TOKEN" https://stefna.xyz/.netlify/functions/get-user-profile

# Test referral processing
curl -X POST -H "Authorization: Bearer TOKEN" -d '{"referrerEmail":"test@example.com","newUserId":"123","newUserEmail":"new@example.com"}' https://stefna.xyz/.netlify/functions/process-referral

# Test referral stats
curl -H "Authorization: Bearer TOKEN" https://stefna.xyz/.netlify/functions/get-referral-stats
```

## 🎯 Key Principles

1. **Simplicity first** - no unnecessary complexity
2. **Fair for all** - same limits for everyone
3. **Core focus** - AI generation, not user verification
4. **Transparency** - users see real data, not placeholder values
5. **Maintainability** - clean code structure for future developers
6. **Two-phase charging** - reserve → commit/refund prevents lost charges
7. **Unified authentication** - single JWT_SECRET across all functions

## 🚫 What We Don't Do

- ❌ Social media verification
- ❌ Content approval systems
- ❌ User tier promotions
- ❌ Complex permission systems
- ❌ Status-based features

## ✅ What We Do

- ✅ AI image/video generation
- ✅ Simple credit system
- ✅ Referral bonuses
- ✅ Daily usage limits
- ✅ Rate limiting protection

---

**Last Updated**: August 17, 2025
**Status**: ✅ Stefna Credits v2 - Simple & Referral-First
**Next Review**: When changing credit amounts or adding new features
**Philosophy**: Keep it simple, focus on core functionality

## 🚀 Migration Guide

### From Old System to New System

1. **Run the SQL migration** in `database-usage-schema.sql`
2. **Update environment variables**:
   - Set `JWT_SECRET` (unified across all functions)
   - Remove or set `AUTH_JWT_SECRET = JWT_SECRET` for compatibility
3. **Deploy new functions**:
   - `credits-reserve.ts`
   - `credits-finalize.ts`
   - Updated `get-user-profile.ts`
   - Updated `process-referral.ts`
4. **Update frontend** to use `runGeneration` helper
5. **Test the flow**: reserve → generate → finalize

### What Changed
- ✅ **Two-phase charging**: reserve → commit/refund
- ✅ **Unified JWT**: single JWT_SECRET everywhere
- ✅ **Database-driven config**: change values without redeploy
- ✅ **Idempotent operations**: no more duplicate charges
- ✅ **Clear daily cap**: 30/day limit, not auto-topup
