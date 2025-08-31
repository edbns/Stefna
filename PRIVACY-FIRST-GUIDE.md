# 🔒 Privacy-First Implementation Guide

## Overview
Stefna implements a **privacy-first approach** where users are private by default and must explicitly opt-in to share their media publicly.

## Key Principles
1. **Users are PRIVATE by default** (`share_to_feed = FALSE`)
2. **Users must explicitly opt-in** to share their media publicly
3. **Public feed only shows media** from users who have enabled sharing
4. **New registrations start private** automatically
5. **Users can toggle sharing** at any time

## Database Schema

### User Settings Table
```sql
CREATE TABLE user_settings (
    user_id TEXT PRIMARY KEY REFERENCES users(id),
    media_upload_agreed BOOLEAN DEFAULT FALSE,
    share_to_feed BOOLEAN DEFAULT FALSE, -- 🔒 PRIVACY-FIRST: Private by default
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);
```

### Media Tables
All media tables have a `status` field that controls generation state:
- `'completed'` - Generation finished successfully
- `'processing'` - Generation in progress  
- `'failed'` - Generation failed
- `'pending'` - Job created but not started

**Note**: Media visibility is NOT controlled by the `status` field. It's controlled by `user_settings.share_to_feed`.

## Feed Visibility Logic

### Public Feed Query
The `getPublicFeed()` function filters media by:
1. **User privacy setting**: `user_settings.share_to_feed = TRUE`
2. **Generation status**: `media.status = 'completed'`
3. **Valid image**: `media.image_url IS NOT NULL`

### Feed Visibility Rules
- ✅ **Visible**: User has `share_to_feed = TRUE` AND media is `completed`
- ❌ **Hidden**: User has `share_to_feed = FALSE` (regardless of media status)
- ❌ **Hidden**: Media is `processing`, `failed`, or `pending`

## Frontend Implementation

### User Settings Toggle
```typescript
// ProfileScreen.tsx
const updateUserSettings = async (shareToFeed: boolean) => {
  await authenticatedFetch('/.netlify/functions/user-settings', {
    method: 'POST',
    body: JSON.stringify({ share_to_feed: shareToFeed })
  });
};
```

### Media Generation
```typescript
// HomeNew.tsx - Media respects user's share preference
isPublic: profileData.shareToFeed
```

## Testing Privacy-First

### Test Cases
1. **New user registration** → Should start with `share_to_feed = FALSE`
2. **Public feed** → Should be empty when no users have sharing enabled
3. **Toggle ON** → User's media should appear in public feed
4. **Toggle OFF** → User's media should disappear from public feed

### Verification Queries
```sql
-- Check user privacy settings
SELECT COUNT(*) FROM user_settings WHERE share_to_feed = TRUE;

-- Check public feed items
SELECT COUNT(*) FROM (
  SELECT f.* FROM feed f
  JOIN user_settings u ON u.user_id = f.user_id 
  WHERE u.share_to_feed = TRUE
) public_items;
```

## Common Mistakes to Avoid

❌ **Don't assume** media status controls visibility
❌ **Don't hardcode** `isPublic: true` in media generation
❌ **Don't forget** to respect `profileData.shareToFeed` preference
❌ **Don't change** the default value of `share_to_feed` to `TRUE`

✅ **Do use** `user_settings.share_to_feed` for privacy control
✅ **Do respect** user's privacy preference in all media operations
✅ **Do test** feed visibility when toggling share settings
✅ **Do maintain** privacy-first defaults for new users

## Migration Notes

If you need to change privacy behavior:
1. **Update database schema** with proper defaults
2. **Update existing users** with migration script
3. **Test thoroughly** with real user scenarios
4. **Document changes** in this guide

## Files to Check

- `database-schema.sql` - Schema with privacy-first defaults
- `netlify/functions/getPublicFeed.ts` - Feed filtering logic
- `netlify/functions/user-settings.ts` - Privacy setting management
- `src/screens/ProfileScreen.tsx` - User toggle interface
- `src/components/HomeNew.tsx` - Media generation with privacy
- `src/contexts/ProfileContext.tsx` - Privacy state management
