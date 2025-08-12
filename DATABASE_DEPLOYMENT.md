# 🗄️ Database Migration Guide for Stefna Production

## Overview
This guide will help you safely migrate your existing database to support all the new features we've implemented.

## 📋 Prerequisites
- Access to your Supabase SQL editor
- Backup of your current database (recommended)
- All existing tables are preserved

## 🚀 Migration Steps

### Step 1: Run Main Migration
1. Open your **Supabase SQL Editor**
2. Copy and paste the entire contents of `database-complete-migration.sql`
3. Click **Run** to execute
4. Wait for completion and check for any errors

**Expected Output:**
- ✅ media_assets table updated with new columns
- ✅ usage tracking table created
- ✅ All indexes and RLS policies updated
- ✅ Verification queries show table statuses

### Step 2: Run Interaction Migration
1. In the same SQL editor session
2. Copy and paste the entire contents of `database-interaction-migration.sql`
3. Click **Run** to execute
4. Wait for completion and check for any errors

**Expected Output:**
- ✅ media_likes, media_remixes, media_shares tables ready
- ✅ Helper functions created
- ✅ Views for easy querying created
- ✅ Triggers for automatic tracking

## 🔍 Verification Queries

After running both migrations, you can verify everything is working:

```sql
-- Check table statuses
SELECT 
  'media_assets' as table_name,
  COUNT(*) as row_count,
  '✅ Ready' as status
FROM media_assets
UNION ALL
SELECT 
  'usage' as table_name,
  COUNT(*) as row_count,
  '✅ Ready' as status
FROM usage
UNION ALL
SELECT 
  'media_likes' as table_name,
  COUNT(*) as row_count,
  '✅ Ready' as status
FROM media_likes;

-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'media_assets' 
  AND column_name IN ('user_id', 'result_url', 'mode', 'visibility')
ORDER BY column_name;
```

## 🎯 What Gets Added/Updated

### New Columns in `media_assets`:
- `result_url` - AI-generated output URL
- `source_url` - Original input URL for I2I/V2V
- `job_id` - Unique job identifier
- `model` - AI model used
- `mode` - Generation mode (i2i, v2v, t2i, preset, remix)
- `prompt` - User's prompt
- `negative_prompt` - Negative prompt used
- `strength` - I2I/V2V strength (0.0-1.0)
- `visibility` - Public/private setting
- `allow_remix` - Whether others can remix
- `parent_asset_id` - For remixes, points to original

### New Tables:
- `usage` - Daily quota tracking
- `media_likes` - Like tracking
- `media_remixes` - Remix tracking  
- `media_shares` - Share tracking

### New Functions:
- `ensure_usage_row()` - Creates usage tracking rows
- `bump_usage()` - Increments daily counters
- `get_media_interaction_counts()` - Gets like/remix/share counts
- `has_user_liked_media()` - Checks if user liked media
- `has_user_remixed_media()` - Checks if user remixed media
- `has_user_shared_media()` - Checks if user shared media

### New Views:
- `public_media_with_counts` - Public feed with interaction counts
- `user_media_with_counts` - User media with interaction counts

## ⚠️ Important Notes

1. **No Data Loss**: All existing data is preserved
2. **Backward Compatible**: Old code will continue to work
3. **RLS Enabled**: Row Level Security is enabled on all tables
4. **Indexes Created**: Performance indexes are automatically added
5. **Triggers Active**: Automatic tracking and validation is enabled

## 🧪 Testing After Migration

1. **Test preset functionality** - Should work without 400 errors
2. **Test database saves** - Media should save successfully
3. **Test interaction features** - Likes, remixes, shares should work
4. **Check logs** - No more "sr is not a constructor" errors

## 🆘 Troubleshooting

### If you get errors:
1. Check that all tables exist in your database
2. Ensure you have proper permissions in Supabase
3. Run migrations one at a time
4. Check the verification queries for any missing tables

### Common Issues:
- **Table already exists**: Use `CREATE TABLE IF NOT EXISTS`
- **Column already exists**: Use `ADD COLUMN IF NOT EXISTS`
- **Policy conflicts**: Scripts automatically drop and recreate policies

## ✅ Success Indicators

After successful migration, you should see:
- All verification queries return ✅ Ready status
- No error messages in the SQL editor
- Application works without database errors
- Preset functionality saves to database successfully

## 🚀 Next Steps

Once migration is complete:
1. Test the application locally
2. Deploy to production
3. Monitor for any remaining issues
4. Enjoy the improved functionality!

---

**Need Help?** Check the verification queries and ensure all tables show "✅ Ready" status.
