# 🚀 Neon Migration Checklist - Remaining Work

## 📊 **Current Status: 50% Complete - 14/28 Functions Migrated**

### ✅ **Already Migrated (Working)**
- `save-media.ts` - ✅ Fixed payload handling and database schema
- `verify-otp.js` - ✅ Fixed user creation and JWT handling
- `update-profile.ts` - ✅ Fixed profile updates and user settings
- `check-tier-promotion.js` - ✅ Fixed 500 errors and graceful fallbacks
- `user-settings.js` - ✅ Fixed authentication and response format
- `get-referral-stats.js` - ✅ Fixed database queries and error handling
- `get-user-profile.js` - ✅ **JUST MIGRATED** - Now uses Neon + JWT
- `delete-media.js` - ✅ **JUST MIGRATED** - Now uses Neon + JWT
- `list-assets.js` - ✅ **JUST MIGRATED** - Now uses Neon + JWT
- `updateMediaVisibility.js` - ✅ **JUST MIGRATED** - Now uses Neon + JWT
- `record-asset.js` - ✅ **JUST MIGRATED** - Now uses Neon + JWT
- `debug-feed.js` - ✅ **JUST MIGRATED** - Now uses Neon + JWT
- `usage-stats.js` - ✅ **JUST MIGRATED** - Now uses Neon + JWT
- `add-bonus-credits.js` - ✅ **JUST MIGRATED** - Now uses Neon + JWT

### 🎯 **Recent Accomplishments (Latest Session)**
- **Profile Refresh Issues Fixed**: Added userMediaUpdated events to MoodMorph and custom prompt generation
- **Console Error Resolution**: Fixed blob URL fetching, UI validation, and RUM adblock noise
- **Migration Pattern Established**: Consistent JWT auth, Neon database, response helpers
- **Error Handling**: Graceful fallbacks instead of 500 errors
- **Testing Tools**: Added development helpers for debugging

### 🎯 **Recent Accomplishments**
- **Console Error Fixes**: Fixed blob URL fetching, UI validation race conditions, RUM adblock noise
- **Migration Pattern Established**: Consistent JWT auth, Neon database, response helpers
- **Error Handling**: Graceful fallbacks instead of 500 errors
- **Testing Tools**: Added development helpers for debugging

---

## 🚨 **CRITICAL CONSOLE ERRORS - RECENTLY FIXED**

### ✅ **Issues Resolved (No More Console Spam)**
- **Blob URL Fetching**: Fixed i2i "Source upload failed: Failed to fetch" errors
- **UI Validation Race**: Fixed "Presets group has no configured options" warnings
- **RUM Adblock Noise**: Eliminated ERR_BLOCKED_BY_CLIENT spam
- **getUserMedia 405**: Fixed Method Not Allowed errors
- **Theme Fallbacks**: Added safe defaults for undefined variables

### 🔧 **Debug Tools Added**
- `window.testSaveMedia()` - Test save-media endpoint with minimal payload
- Enhanced error messages and validation timing
- Better logging for troubleshooting

---

## 🔄 **REMAINING BACKEND FUNCTIONS TO MIGRATE**

### **High Priority (Core Functionality)**
- [x] `debug-feed.js` - ✅ **MIGRATED** - Now uses Neon + JWT
- [x] `list-assets.js` - ✅ **MIGRATED** - Now uses Neon + JWT
- [x] `updateMediaVisibility.js` - ✅ **MIGRATED** - Now uses Neon + JWT
- [x] `record-asset.js` - ✅ **MIGRATED** - Now uses Neon + JWT
- [x] `usage-stats.js` - ✅ **MIGRATED** - Now uses Neon + JWT

### **Medium Priority (User Features)**
- [x] `add-bonus-credits.js` - ✅ **MIGRATED** - Now uses Neon + JWT
- [ ] `update-user.js` - Uses Supabase for user updates
- [ ] `bulk-share.js` - Uses Supabase for bulk operations
- [ ] `process-referral.js` - Uses Supabase for referral processing
- [ ] `admin-upgrade-user.js` - Uses Supabase for admin operations

### **Low Priority (Utility Functions)**
- [ ] `video-job-worker.ts` - Uses Supabase for video processing
- [ ] `video-job-status.ts` - Uses Supabase for video status
- [ ] `v2v-webhook.ts` - Uses Supabase for video webhooks
- [ ] `mark-timeout.ts` - Uses Supabase for timeout handling
- [ ] `cleanup-otps.js` - Uses Supabase for OTP cleanup
- [ ] `fix-null-values.js` - Uses Supabase for data fixes
- [ ] `migrate-user-media.js` - Uses Supabase for migration
- [ ] `backfill-media.ts` - Uses Supabase for backfilling
- [ ] `test-profile-connection.ts` - Uses Supabase for testing
- [ ] `purge-user.js` - Uses Supabase for user purging

### **Library Files**
- [ ] `netlify/lib/supabaseAdmin.ts` - Admin Supabase client
- [ ] `netlify/lib/supabaseUser.ts` - User Supabase client
- [ ] `netlify/lib/supabaseUser.js` - User Supabase client (JS)

---

## 🎨 **FRONTEND SERVICES TO MIGRATE**

### **Critical Services (High Priority)**
- [ ] `src/services/media.ts` - **ALL media operations use Supabase**
- [ ] `src/lib/feed.ts` - **Public feed uses Supabase**
- [ ] `src/services/profile.ts` - **Profile operations use Supabase**

### **Configuration Files**
- [ ] `src/lib/supabaseClient.ts` - **Main Supabase client**
- [ ] `src/utils/supabaseClient.ts` - **Alternative Supabase client**
- [ ] `src/config/environment.ts` - **Supabase configuration**

### **Supporting Services**
- [ ] `src/services/userService.ts` - User operations use Supabase

---

## 🔧 **MIGRATION PATTERN TO USE**

### **For Netlify Functions:**
```javascript
// OLD (Supabase)
const { createClient } = require('@supabase/supabase-js')
const { verifyAuth } = require('./_auth')

// NEW (Neon)
const { neon } = require('@neondatabase/serverless')
const { requireJWTUser, resp, handleCORS } = require('./_auth')

// OLD (Supabase queries)
const { data, error } = await supabase.from('table').select('*')

// NEW (Neon queries)
const data = await sql`SELECT * FROM table`
```

### **For Frontend Services:**
```typescript
// OLD (Direct Supabase)
const { data } = await supabase.from('media_assets').select('*')

// NEW (Netlify Functions)
const response = await fetch('/.netlify/functions/get-user-media', {
  headers: { Authorization: `Bearer ${token}` }
})
const data = await response.json()
```

---

## 📋 **MIGRATION STEPS FOR EACH FUNCTION**

### **Step 1: Update Imports**
- Replace `@supabase/supabase-js` with `@neondatabase/serverless`
- Replace `verifyAuth` with `requireJWTUser`
- Add `resp` and `handleCORS` helpers

### **Step 2: Update Authentication**
- Replace `verifyAuth(event)` with `requireJWTUser(event)`
- Use `user.userId` instead of `userId`
- Add CORS handling

### **Step 3: Update Database Queries**
- Replace Supabase client with Neon `sql` template literals
- Update table/column names to match your current schema
- Handle errors gracefully with try/catch

### **Step 4: Update Response Format**
- Replace manual response objects with `resp()` helper
- Ensure consistent error handling

---

## 🎯 **RECOMMENDED MIGRATION ORDER**

### **Phase 1: Core Media Functions (Today)**
1. ✅ `save-media.ts` - DONE
2. ✅ `delete-media.js` - DONE
3. [ ] `list-assets.js` - Next priority
4. [ ] `updateMediaVisibility.js` - Next priority
5. [ ] `record-asset.js` - Next priority

### **Phase 2: User Management (Tomorrow)**
1. ✅ `verify-otp.js` - DONE
2. ✅ `update-profile.ts` - DONE
3. ✅ `get-user-profile.js` - DONE
4. [ ] `update-user.js` - Next priority
5. [ ] `add-bonus-credits.js` - Next priority

### **Phase 3: Feed & Display (Day 3)**
1. [ ] `debug-feed.js` - Next priority
2. [ ] `src/lib/feed.ts` - Frontend migration
3. [ ] `src/services/media.ts` - Frontend migration

### **Phase 4: Advanced Features (Day 4)**
1. [ ] Video processing functions
2. [ ] Admin functions
3. [ ] Utility functions

---

## 🚨 **CRITICAL NOTES**

### **Database Schema Changes**
- **Use `media_assets` table** (not `assets` or `media`)
- **Use `users` table** with correct columns: `id`, `email`, `external_id`, `name`, `tier`, `created_at`, `updated_at`
- **Use `user_settings` table** (not `profiles`)
- **Use compatibility views** when reading data: `app_media`, `app_users`, `app_user_settings`

### **Authentication Changes**
- **All functions now use JWT** instead of Supabase auth
- **Use `requireJWTUser(event)`** for auth checks
- **Use `user.userId`** for user identification

### **Response Format Changes**
- **Use `resp()` helper** for consistent responses
- **Handle missing tables gracefully** - return safe defaults instead of 500 errors
- **Use CORS handling** for all functions

---

## 📝 **TESTING CHECKLIST**

### **After Each Migration:**
- [ ] Function starts without errors
- [ ] Authentication works (JWT accepted)
- [ ] Database queries execute successfully
- [ ] Response format matches expected structure
- [ ] Error handling works gracefully
- [ ] CORS headers are present

### **Integration Testing:**
- [ ] Frontend can call the function
- [ ] Data flows correctly through the system
- [ ] No console errors in browser
- [ ] User experience remains smooth

---

## 🎉 **COMPLETION GOALS**

### **Target: 100% Migration by End of Week**
- **Day 1-2**: Complete all high-priority backend functions
- **Day 3**: Complete frontend service migration
- **Day 4**: Complete remaining utility functions
- **Day 5**: Testing and bug fixes

### **Success Metrics:**
- ✅ Zero Supabase imports in codebase
- ✅ All functions use Neon database
- ✅ Consistent JWT authentication
- ✅ Graceful error handling
- ✅ No 500 errors from missing tables

---

## 🔗 **USEFUL RESOURCES**

### **Migration Examples:**
- See `save-media.ts` for media handling pattern
- See `verify-otp.js` for user creation pattern
- See `update-profile.ts` for profile update pattern

### **Database Schema:**
- Check `database-compatibility-view.sql` for view definitions
- Check `prisma/migrations/` for current table structure

### **Helper Functions:**
- `_auth.js` contains `requireJWTUser`, `resp`, `handleCORS`
- Use these consistently across all functions

---

**Last Updated:** August 16, 2025
**Status:** 50% Complete - 14/28 functions migrated
**Next Priority:** Complete remaining medium-priority user management functions
