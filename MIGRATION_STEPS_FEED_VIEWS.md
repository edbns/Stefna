# Feed Views Migration Steps

## Overview
This guide helps you safely migrate to the new feed structure without conflicts.

## Step 1: Check Existing Views
First, check what views currently exist in your database:

```sql
-- Check existing views
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname LIKE '%feed%'
ORDER BY viewname;
```

## Step 2: Drop Existing Views (if any)
If you have existing views that conflict, drop them:

```sql
-- Drop existing views (adjust names as needed)
DROP VIEW IF EXISTS public.public_feed CASCADE;
DROP VIEW IF EXISTS public.public_feed_v2 CASCADE;
DROP VIEW IF EXISTS public.media_feed CASCADE;
-- Add any other feed-related views you find
```

## Step 3: Create New Views
Run the view creation script:

```sql
-- Create the original public_feed view (for backward compatibility)
CREATE VIEW public.public_feed AS
SELECT 
  id,
  user_id,
  cloudinary_public_id,
  media_type,
  status,
  is_public,
  allow_remix,
  published_at,
  source_asset_id,
  preset_key,
  prompt,
  created_at
FROM public.assets
WHERE is_public = true 
  AND status = 'ready'
  AND published_at IS NOT NULL
  AND cloudinary_public_id IS NOT NULL
  AND media_type IS NOT NULL
ORDER BY published_at DESC;

-- Create the new public_feed_v2 view with only the six exposed fields
CREATE VIEW public.public_feed_v2 AS
SELECT 
  id,
  cloudinary_public_id,
  media_type,
  published_at,
  source_asset_id,
  preset_key
FROM public.assets
WHERE is_public = true 
  AND status = 'ready'
  AND published_at IS NOT NULL
  AND cloudinary_public_id IS NOT NULL
  AND media_type IS NOT NULL
ORDER BY published_at DESC;
```

## Step 4: Grant Permissions
```sql
-- Grant access to both views
GRANT SELECT ON public.public_feed TO anon, authenticated;
GRANT SELECT ON public.public_feed_v2 TO anon, authenticated;
```

## Step 5: Verify Creation
```sql
-- Verify the views were created successfully
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE viewname IN ('public_feed', 'public_feed_v2')
ORDER BY viewname;

-- Test the views
SELECT COUNT(*) FROM public.public_feed_v2;
```

## Alternative: Use the Migration Script
Instead of running SQL manually, you can use the provided migration script:

1. **Run the main schema first**: `database-unified-assets-schema.sql`
2. **Then run the views script**: `database-create-feed-views.sql`

## Troubleshooting

### Error: "cannot change name of view column"
This means there's a conflicting view. Solution:
1. Drop the conflicting view first
2. Create the new view with the desired structure

### Error: "view does not exist"
This is normal if you don't have existing views. Just proceed with creation.

### Error: "permission denied"
Make sure you're running as a database owner or have the necessary privileges.

## Verification
After successful migration, test the new feed API:

```bash
curl "https://your-domain/.netlify/functions/getPublicFeed?limit=5"
```

You should get a response like:
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "cloudinary_public_id": "public_id",
      "media_type": "image",
      "published_at": "timestamp",
      "source_asset_id": "uuid",
      "preset_key": "preset_name"
    }
  ]
}
```

## Rollback (if needed)
If you need to rollback:

```sql
-- Drop the new views
DROP VIEW IF EXISTS public.public_feed_v2 CASCADE;
DROP VIEW IF EXISTS public.public_feed CASCADE;

-- Recreate your old views if needed
```

## Notes
- The `CASCADE` option will drop dependent objects
- Views are read-only, so dropping them won't affect your data
- Always backup your database before major schema changes
- Test in a development environment first
