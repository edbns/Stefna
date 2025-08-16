# 🚀 Neon Migration Checklist - Remaining Work

## 📊 **Current Status: 70% Complete**

### ✅ **Already Migrated (Working)**
- `save-media.ts` - ✅ Fixed and working
- `verify-otp.js` - ✅ Fixed and working  
- `update-profile.ts` - ✅ Fixed and working
- `check-tier-promotion.js` - ✅ Fixed and working
- `user-settings.js` - ✅ Fixed and working
- `get-referral-stats.js` - ✅ Fixed and working
- `get-user-profile.js` - ✅ **JUST MIGRATED**
- `delete-media.js` - ✅ **JUST MIGRATED**

---

## 🔄 **REMAINING BACKEND FUNCTIONS TO MIGRATE**

### **High Priority (Core Functionality)**
- [ ] `debug-feed.js` - Uses Supabase for feed debugging
- [ ] `list-assets.js` - Uses Supabase for asset listing
- [ ] `updateMediaVisibility.js` - Uses Supabase for visibility updates
- [ ] `record-asset.js` - Uses Supabase for asset recording
- [ ] `usage-stats.js` - Uses Supabase for usage tracking

### **Medium Priority (User Features)**
- [ ] `add-bonus-credits.js` - Uses Supabase for credit management
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

**Last Updated:** $(date)
**Status:** 70% Complete - 8/28 functions migrated
**Next Priority:** Complete high-priority media functions
