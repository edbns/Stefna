# Database Table Consolidation Plan

## Current Situation
You have **3 different tables** causing confusion:

### 1. `assets` Table ✅ (WORKING)
- **Purpose**: AI-generated media (Emotion Mask, presets, AIML API results)
- **Schema**: `id`, `user_id`, `cloudinary_public_id`, `media_type`, `status`, `is_public`, `final_url`, etc.
- **Status**: Working correctly, used by `save-media` function

### 2. `media_assets` Table ✅ (WORKING)  
- **Purpose**: User-uploaded media (Cloudinary uploads, user content)
- **Schema**: `id`, `owner_id`, `url`, `public_id`, `resource_type`, `visibility`, etc.
- **Status**: Working correctly, used by `getUserMedia` function

### 3. `media` Table ❌ (EMPTY/LEGACY)
- **Purpose**: Unknown/legacy
- **Schema**: Incomplete, missing columns like `media_type`
- **Status**: Causing errors, should be removed

### 4. `media_batches` Table ❌ (REFERENCED BUT MAY NOT EXIST)
- **Purpose**: Batch processing metadata
- **Schema**: Referenced in code but may not exist in Neon
- **Status**: Can be eliminated by storing batch data in `assets.meta` JSON

## The Problem
The `save-media` function was inconsistently trying to use both `media` and `assets` tables, causing the error:
```
column "media_type" of relation "media" does not exist
```

## The Solution

### Phase 1: Fix Functions (COMPLETED ✅)
- ✅ `save-media.ts` → Now uses `assets` table consistently
- ✅ `save-media-batch.ts` → Now uses `assets` table consistently

### Phase 2: Clean Up Database
```sql
-- Remove the empty/legacy media table
DROP TABLE IF EXISTS public.media;

-- Remove the media_batches table (batch data now stored in assets.meta)
DROP TABLE IF EXISTS public.media_batches;

-- Verify assets table has all needed columns
-- (already confirmed working)
```

### Phase 3: Update Documentation
- **`assets`** → Use for AI-generated media (Emotion Mask, presets)
- **`media_assets`** → Use for user-uploaded media (Cloudinary)

## Why This Happened
1. **Migration from Supabase to Neon** → Schema differences
2. **Inconsistent function logic** → Some functions used wrong tables
3. **Legacy table references** → Old code trying to use non-existent columns

## Prevention for Future
1. **Single source of truth** for each media type
2. **Clear table purposes** documented in code
3. **Consistent function behavior** across all endpoints
4. **Schema validation** before deployment

## Current Status
- ✅ **Functions fixed** to use correct tables
- 🔄 **Database cleanup** needed (remove `media` table)
- 🔄 **Testing** to verify complete workflow
- 🔄 **Deployment** of fixed functions

## Next Steps
1. Deploy the fixed functions
2. Remove the empty `media` table
3. Test the complete Emotion Mask workflow
4. Verify media appears in profiles and feeds
