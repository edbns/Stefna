# 🔧 Profile Update Fix - Complete Solution

## 🚨 **Root Cause Analysis**

The profile update functionality was failing due to **three critical mismatches**:

### **1. Authentication System Mismatch**
- **Problem**: `update-profile.ts` used `supabase.auth.getUser(token)` expecting Supabase Auth tokens
- **Reality**: System uses **custom OTP authentication** with custom JWT tokens
- **Fix**: Use custom JWT verification with `jsonwebtoken` library

### **2. Database Table Reference Mismatch**  
- **Problem**: Profiles table referenced `auth.users(id)` (Supabase Auth users)
- **Reality**: System uses custom `users` table for OTP authentication
- **Fix**: Update foreign key to reference `public.users(id)`

### **3. RLS Policy Mismatch**
- **Problem**: RLS policies expected Supabase Auth context
- **Reality**: Custom JWT tokens don't work with Supabase Auth RLS
- **Fix**: Use service role with custom RLS policies

## ✅ **Files Fixed**

### **1. Backend Function Fixed**
- **File**: `netlify/functions/update-profile.ts`
- **Changes**:
  - ✅ Custom JWT token verification instead of Supabase Auth
  - ✅ Proper foreign key reference to `users` table
  - ✅ Username uniqueness validation
  - ✅ Comprehensive error handling
  - ✅ Service role database access

### **2. Database Schema Fixed**
- **File**: `database-fix-profiles-constraints.sql`
- **Changes**:
  - ✅ Correct foreign key: `users(id)` not `auth.users(id)`
  - ✅ Proper RLS policies for custom authentication
  - ✅ Service role permissions
  - ✅ Helper function for safe upserts
  - ✅ Automatic profile creation for existing users

### **3. Profile Retrieval Fixed**
- **File**: `netlify/functions/get-user-profile.js`
- **Changes**:
  - ✅ Verify user exists in `users` table first
  - ✅ Better error handling for missing profiles
  - ✅ Include user data in default profile response

## 🔄 **Migration Steps**

### **Step 1: Run Database Migration**
Execute `database-fix-profiles-constraints.sql` in Supabase SQL Editor:
```sql
-- This will:
-- 1. Drop and recreate profiles table with correct constraints
-- 2. Set up proper RLS policies
-- 3. Create helper functions
-- 4. Migrate existing user data
```

### **Step 2: Deploy Updated Functions**
The fixed functions are already in place:
- `netlify/functions/update-profile.ts` - Fixed authentication
- `netlify/functions/get-user-profile.js` - Fixed user verification

### **Step 3: Test Profile Updates**
1. **Login** with OTP to get custom JWT token
2. **Update profile** - should work without 500 errors
3. **Check database** - profile should be created/updated in `profiles` table

## 🧪 **Testing Checklist**

### **Profile Creation**
- [ ] New user can create profile after OTP login
- [ ] Username validation works (3-30 chars, alphanumeric + underscore/hyphen)
- [ ] Avatar URL saves correctly
- [ ] Share/remix settings save correctly

### **Profile Updates**
- [ ] Existing user can update username
- [ ] Username uniqueness is enforced
- [ ] Empty username converts to null
- [ ] Avatar updates work
- [ ] Settings toggles work

### **Error Handling**
- [ ] Invalid JWT returns 401
- [ ] Duplicate username returns 400 with clear message
- [ ] Invalid username format returns 400
- [ ] Missing user returns 401

### **Database Integrity**
- [ ] Profiles table references `users(id)` correctly
- [ ] Foreign key constraints work
- [ ] RLS policies allow service role access
- [ ] Triggers update `updated_at` automatically

## 🔍 **Debugging Commands**

### **Check Database Structure**
```sql
-- Verify profiles table structure
\d public.profiles

-- Check foreign key constraints
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='profiles';
```

### **Check RLS Policies**
```sql
-- View RLS policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
```

### **Test Profile Function**
```sql
-- Test the upsert function
SELECT * FROM public.upsert_profile(
  (SELECT id FROM public.users LIMIT 1),
  'test_username',
  'https://example.com/avatar.jpg',
  true,
  true,
  true
);
```

## 🎯 **Expected Results**

After applying these fixes:

1. **Profile updates work** without 500 errors
2. **Foreign key constraints** are satisfied
3. **Authentication** uses custom JWT tokens correctly
4. **RLS policies** work with service role
5. **Error messages** are clear and actionable
6. **Database integrity** is maintained

## 🚨 **Common Issues**

### **If Still Getting 500 Errors:**
1. Check JWT_SECRET is set in environment
2. Verify users table has the user ID
3. Run the database migration script
4. Check Supabase logs for specific errors

### **If Username Validation Fails:**
1. Check username meets requirements (3-30 chars)
2. Verify no special characters except underscore/hyphen
3. Ensure username is unique

### **If Foreign Key Errors:**
1. Ensure database migration ran successfully
2. Verify profiles table references users(id)
3. Check user exists in users table before profile update

The system should now handle profile updates correctly with proper error handling and database integrity.
