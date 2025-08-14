# 🔍 Display Issues Analysis - FullScreenMediaViewer & MediaCard

## 🎯 **Problems Identified**

### **1. Missing Prompt Display** ❌
**Issue**: FullScreenMediaViewer shows "No prompt available" even for AI-generated content

**Root Cause**: 
- `getUserMedia.ts` (line 66) extracts prompt from Cloudinary context: `r.context?.custom?.prompt || null`
- But `save-media.ts` only stores `user_id` in context (line 91), **not the prompt**
- The prompt data is never saved to Cloudinary context during generation

### **2. Missing Profile Photos & Names** ❌
**Issue**: No user avatars or usernames displayed in MediaCard or FullScreenMediaViewer

**Root Causes**:
- `getPublicFeed.ts` (line 34): `user_avatar: null, // Not stored in Cloudinary context`
- `getUserMedia.ts` doesn't fetch user profile data from `profiles` table
- Media data only has `userId` but no `userUsername` or `userAvatar` fields populated

### **3. Profile Context Data Mismatch** ❌
**Issue**: Components expect different field names than what ProfileContext provides

**Mismatches**:
- **FullScreenMediaViewer** expects `profileData.name` but **ProfileContext** defaults to `'User Name'`
- **ProfileContext** has `avatar: string | File | null` but components expect `string` URLs only
- **UserMedia** interface has `userUsername` but **ProfileContext** has `username`

## 🛠️ **Detailed Analysis**

### **A. Prompt Storage Issue**

#### **Current Flow (Broken):**
```typescript
// save-media.ts - Only stores user_id
context: { user_id: uid }

// getUserMedia.ts - Tries to get prompt that was never stored
prompt: r.context?.custom?.prompt || null  // Always null!
```

#### **What Should Happen:**
```typescript
// save-media.ts - Should store prompt + metadata
context: { 
  user_id: uid,
  prompt: generationData.prompt,
  preset_key: generationData.presetId,
  mode: generationData.mode
}
```

### **B. User Profile Data Missing**

#### **Current Flow (Broken):**
```typescript
// getUserMedia.ts - No user profile lookup
const items = (res?.resources || []).map((r: any) => ({
  // ... other fields
  // Missing: userUsername, userAvatar, userTier
}))
```

#### **What Should Happen:**
```typescript
// getUserMedia.ts - Should join with profiles table
// 1. Get media from Cloudinary
// 2. Extract unique user IDs
// 3. Fetch user profiles from Supabase
// 4. Merge profile data with media items
```

### **C. ProfileContext Field Mismatches**

#### **Current Mismatches:**
```typescript
// ProfileContext.tsx
interface ProfileData {
  name: string        // ← Components expect this
  username?: string   // ← But UserMedia has userUsername
  avatar: string | File | null  // ← Components expect string only
}

// FullScreenMediaViewer.tsx
const displayName = profileData.name  // ← Expects 'name'
const avatarUrl = profileData.avatar  // ← Expects string, gets File?

// UserMedia interface
userUsername?: string  // ← Different from ProfileContext.username
userAvatar?: string    // ← Components expect this populated
```

## 🎯 **Required Fixes**

### **1. Fix Prompt Storage**
**File**: `netlify/functions/save-media.ts`
```typescript
// Add prompt and metadata to Cloudinary context
context: {
  user_id: uid,
  prompt: requestBody.prompt || '',
  preset_key: requestBody.presetId || '',
  mode: requestBody.mode || '',
  generation_id: requestBody.runId || ''
}
```

### **2. Fix User Profile Data Fetching**
**File**: `netlify/functions/getUserMedia.ts`
```typescript
// After getting media from Cloudinary, fetch user profiles
const userIds = [...new Set(items.map(item => item.user_id))]
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, username, avatar_url')
  .in('id', userIds)

// Merge profile data with media items
const enrichedItems = items.map(item => ({
  ...item,
  userUsername: profiles.find(p => p.id === item.user_id)?.username || '',
  userAvatar: profiles.find(p => p.id === item.user_id)?.avatar_url || ''
}))
```

### **3. Fix ProfileContext Data Structure**
**File**: `src/contexts/ProfileContext.tsx`
```typescript
interface ProfileData {
  id?: string
  name: string
  username?: string
  avatar: string | null  // Remove File type, only string URLs
  shareToFeed: boolean
  allowRemix: boolean
  // ... other fields
}
```

### **4. Fix Component Field Mapping**
**Files**: `FullScreenMediaViewer.tsx`, `MasonryMediaGrid.tsx`
```typescript
// Use consistent field names
const displayName = current.userUsername || profileData.username || 'Anonymous'
const avatarUrl = current.userAvatar || profileData.avatar
```

## 🚨 **Impact Assessment**

### **Current State:**
- ❌ **Prompts**: Never displayed (always "No prompt available")
- ❌ **User Names**: Show "Anonymous User" or user IDs
- ❌ **Avatars**: Show initials only, never actual profile photos
- ❌ **Profile Context**: Mismatched field names cause display issues

### **After Fixes:**
- ✅ **Prompts**: Full AI generation prompts displayed with copy functionality
- ✅ **User Names**: Real usernames from profiles table
- ✅ **Avatars**: Actual user profile photos
- ✅ **Profile Context**: Consistent field mapping across components

## 📋 **Implementation Priority**

1. **High Priority**: Fix prompt storage in `save-media.ts` (affects all AI content)
2. **High Priority**: Fix user profile fetching in `getUserMedia.ts` (affects all user display)
3. **Medium Priority**: Fix ProfileContext field types (affects current user display)
4. **Low Priority**: Update component field mapping (cosmetic improvements)

**Root cause**: The backend isn't storing or retrieving the right data, so the frontend components can't display it properly! 🎯
