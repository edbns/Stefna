# Profile Integration Guide

Complete guide for implementing user profiles, onboarding, and media integration in Stefna.

## 🎯 Overview

This system provides:
- **3-step onboarding modal** (avatar → username → sharing preferences)
- **Dual API approach** (Netlify Functions + Direct Supabase)
- **Media with profile integration** (username/avatar on every item)
- **Event-driven architecture** (auth state changes trigger profile checks)

## 🗄️ Database Setup

Run this migration in your Supabase SQL Editor:

```sql
-- See: database-profiles-onboarding-migration.sql
-- Creates profiles table, RLS policies, triggers, and indexes
```

Key features:
- Auto-creates profile on user signup
- Case-insensitive unique usernames
- Row Level Security (RLS) enabled
- Onboarding completion tracking

## 🔧 Services Architecture

### Profile Service (`src/services/profile.ts`)

**Netlify Functions Approach** (recommended for existing setup):
```ts
import { ensureAndUpdateProfile, completeOnboarding } from '../services/profile';

// Complete onboarding
const profile = await completeOnboarding({
  username: 'john_doe',
  avatar_url: 'https://example.com/avatar.jpg',
  share_to_feed: false,
  allow_remix: true
});
```

**Direct Supabase Approach** (for new implementations):
```ts
import { updateMyProfile, ensureAndUpdateProfileDirect } from '../services/profile';

// Direct Supabase update
await updateMyProfile({
  username: 'john_doe',
  avatarUrl: 'https://example.com/avatar.jpg',
  shareToFeed: false,
  allowRemix: true
});
```

### Media Service (`src/services/media.ts`)

Get media with profile information attached:

```ts
import { getMyMediaWithProfile, getPublicMediaWithProfiles } from '../services/media';

// Get my media with my profile attached
const myMedia = await getMyMediaWithProfile();

// Get public feed with all user profiles
const publicFeed = await getPublicMediaWithProfiles(50);

// Each item now has owner_profile data
myMedia.forEach(item => {
  console.log(item.owner_profile.username);
  console.log(item.owner_profile.avatar_url);
});
```

## 🎨 Onboarding Flow

### 1. ProfileSetupModal Component

3-step modal that appears after first login:

```tsx
import ProfileSetupModal from '../components/ProfileSetupModal';

<ProfileSetupModal
  isOpen={showProfileSetup}
  onClose={() => setShowProfileSetup(false)}
  userId={user.id}
  token={authToken}
  onComplete={(profile) => {
    console.log('Profile setup completed:', profile);
    setShowProfileSetup(false);
  }}
/>
```

### 2. Auth Bootstrap System

Automatically triggers onboarding checks:

```ts
// src/services/authBootstrap.ts
import { initializeAuthBootstrap } from '../services/authBootstrap';

// Call once in App.tsx
useEffect(() => {
  initializeAuthBootstrap();
}, []);
```

This sets up listeners that automatically:
- Check if user needs onboarding on sign-in
- Ensure profile exists
- Trigger ProfileSetupModal when needed

### 3. Auth State Changes

Enhanced auth service with event listeners:

```ts
import authService from '../services/authService';

// Listen for auth changes
const unsubscribe = authService.onAuthStateChange(async (authState) => {
  if (authState.isAuthenticated) {
    console.log('User signed in:', authState.user);
    // Profile checks happen automatically via bootstrap
  }
});

// Clean up
return unsubscribe;
```

## 🖼️ Media Cards with Profiles

Updated media cards show rich user information:

```tsx
// In your media grid component
{media.map(item => (
  <div key={item.id} className="media-card">
    {/* User Info */}
    <div className="flex items-center space-x-2">
      <img 
        src={item.owner_profile?.avatar_url} 
        className="w-8 h-8 rounded-full" 
      />
      <span>{item.owner_profile?.username}</span>
      
      {/* Sharing Badges */}
      {item.visibility === 'public' && (
        <span className="badge-public">Public</span>
      )}
      {item.allow_remix && (
        <span className="badge-remix">Remix OK</span>
      )}
    </div>
    
    {/* Media content */}
    <img src={item.url} alt={item.prompt} />
  </div>
))}
```

## 🔄 Complete Integration Example

See `src/examples/ProfileIntegrationExample.tsx` for a full working example that demonstrates:

- Profile loading and updates
- Media feeds with profile integration
- Like/unlike functionality
- Real-time auth state handling
- Form validation and error handling

## 🛡️ Security & RLS

The system uses Row Level Security (RLS) to ensure:

- Users can only read/update their own profiles
- Public profiles are readable by everyone (for media cards)
- Media visibility respects user preferences
- Username uniqueness is enforced

## 🎯 Usage Patterns

### New User Flow
1. User signs up → auth state change detected
2. Bootstrap checks `onboarding_completed` → false
3. ProfileSetupModal appears automatically
4. User completes 3 steps → profile created with `onboarding_completed: true`
5. Media cards now show their username/avatar

### Existing User Flow
1. User signs in → auth state change detected
2. Bootstrap checks `onboarding_completed` → true
3. No modal shown, profile data loaded
4. Media cards show their existing profile info

### Media Creation Flow
1. User generates/uploads media
2. Media saved with `user_id` reference
3. When displaying, profile is joined/attached
4. Cards show username, avatar, and sharing preferences

## 🔧 Customization

### Custom Profile Fields
Add fields to the `profiles` table and update the interfaces:

```ts
// Add to Profile interface
export interface Profile {
  // ... existing fields
  bio?: string;
  website?: string;
  social_links?: Record<string, string>;
}
```

### Custom Onboarding Steps
Extend ProfileSetupModal with additional steps:

```tsx
// Add step 4: Bio/Website
{step === 4 && (
  <div>
    <textarea 
      placeholder="Tell us about yourself..."
      value={bio}
      onChange={(e) => setBio(e.target.value)}
    />
  </div>
)}
```

### Custom Media Types
Extend MediaItem interface for additional media types:

```ts
export interface MediaItem {
  // ... existing fields
  media_type: 'image' | 'video' | 'audio' | 'document';
  metadata?: Record<string, any>;
}
```

## 🚀 Deployment Checklist

1. ✅ Run database migration in Supabase
2. ✅ Update environment variables (VITE_SUPABASE_URL, etc.)
3. ✅ Deploy Netlify Functions (update-profile, get-user-profile)
4. ✅ Test onboarding flow with new user
5. ✅ Verify RLS policies work correctly
6. ✅ Check media cards show profile information
7. ✅ Test username uniqueness validation

## 🐛 Troubleshooting

**Profile not created on signup:**
- Check if trigger `on_auth_user_created` exists
- Verify RLS policies allow INSERT for authenticated users

**Username uniqueness errors:**
- Ensure unique index `profiles_username_key` exists
- Check case-insensitive validation in frontend

**Media cards not showing profiles:**
- Verify JOIN queries in media service
- Check if `owner_profile` is properly attached

**Onboarding modal not appearing:**
- Check `onboarding_completed` field value
- Verify auth bootstrap is initialized
- Check console for auth state change events

## 📚 API Reference

### Profile Service Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `ensureAndUpdateProfile()` | Update via Netlify Functions | `Promise<Profile>` |
| `updateMyProfile()` | Direct Supabase update | `Promise<Profile>` |
| `getCurrentProfile()` | Get current user profile | `Promise<Profile \| null>` |
| `needsOnboarding()` | Check if onboarding needed | `Promise<boolean>` |
| `completeOnboarding()` | Finish onboarding process | `Promise<Profile>` |

### Media Service Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getMyMediaWithProfile()` | Get user's media + profile | `Promise<MediaItem[]>` |
| `getPublicMediaWithProfiles()` | Get public feed + profiles | `Promise<MediaItem[]>` |
| `toggleMediaLike()` | Like/unlike media | `Promise<{liked: boolean, likeCount: number}>` |
| `updateMediaSharing()` | Update visibility/remix settings | `Promise<MediaItem>` |

This system provides a complete foundation for user profiles and social features in Stefna! 🎯
