# 🏗️ Unified Schema Implementation Guide

## Overview
This guide explains how to implement the **separate tables, unified read model** architecture for Stefna's uploads vs generated content.

## 🎯 **Why This Architecture?**

### **Current Problem**
- Mixed usage of `assets` and `media_assets` tables
- No clear separation between uploads and AI-generated content
- Type mismatches causing database errors
- Confusing data flow for remixes

### **Solution Benefits**
- **Clean separation**: Uploads vs generated content have different lifecycles
- **Unified experience**: Users see all content in one place
- **Better RLS**: Different privacy rules for different content types
- **Easier remix logic**: Clear parent-child relationships

## 🗄️ **Database Schema**

### **Table 1: `assets` (Raw Uploads)**
```sql
-- Stores user uploads (always private)
CREATE TABLE assets (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,           -- Supports both UUIDs and guest IDs
  url TEXT NOT NULL,               -- Cloudinary URL
  public_id TEXT,                  -- Cloudinary public_id
  resource_type VARCHAR(10),       -- 'image' or 'video'
  folder TEXT,                     -- Cloudinary folder
  bytes INTEGER,                   -- File size
  width INTEGER,                   -- Image/video width
  height INTEGER,                  -- Image/video height
  duration REAL,                   -- Video duration
  meta JSONB,                      -- Flexible metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Table 2: `media_assets` (Generated Content)**
```sql
-- Stores AI-generated content (can be public/private)
CREATE TABLE media_assets (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,           -- Supports both UUIDs and guest IDs
  result_url TEXT NOT NULL,        -- AI-generated output URL
  source_url TEXT,                 -- Original upload URL (for I2I/V2V)
  parent_asset_id UUID REFERENCES media_assets(id), -- For remixes
  prompt TEXT NOT NULL DEFAULT '', -- Generation prompt
  resource_type VARCHAR(10),       -- 'image' or 'video'
  visibility VARCHAR(20) DEFAULT 'private', -- 'private', 'public', 'unlisted'
  allow_remix BOOLEAN DEFAULT false, -- Can others remix this?
  public_id TEXT,                  -- Cloudinary public_id
  folder TEXT,                     -- Cloudinary folder
  bytes INTEGER,                   -- File size
  width INTEGER,                   -- Image/video width
  height INTEGER,                  -- Image/video height
  duration REAL,                   -- Video duration
  metadata JSONB,                  -- AI model info, settings, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Unified View: `user_all_media`**
```sql
-- Combines uploads and generated content for UI
CREATE VIEW user_all_media AS
SELECT 
  'upload' as kind,                -- Distinguishes content type
  id, user_id, url, resource_type, created_at,
  'private' as visibility,         -- Uploads are always private
  false as allow_remix,            -- Uploads can't be remixed directly
  null as prompt,                  -- No prompt for uploads
  null as parent_asset_id,         -- No parent for uploads
  null as result_url,              -- No result URL for uploads
  null as source_url               -- No source URL for uploads
FROM assets
UNION ALL
SELECT 
  'generated' as kind,             -- AI-generated content
  id, user_id, result_url as url, resource_type, created_at,
  visibility, allow_remix, prompt, parent_asset_id, result_url, source_url
FROM media_assets;
```

## 🔄 **Data Flow**

### **1. Upload Flow**
```
User uploads file → Cloudinary → record-asset → assets table
```

### **2. Generation Flow**
```
User selects upload → I2I/V2V API → aimlApi → media_assets table
```

### **3. Remix Flow**
```
User clicks remix → I2I with parent URL → aimlApi → media_assets table (with parent_asset_id)
```

### **4. Read Flow**
```
UI requests media → getUserMedia → user_all_media view → Combined results
```

## 🛠️ **Implementation Steps**

### **Step 1: Run Database Migration**
1. Execute `database-unified-schema-migration.sql` in Supabase SQL editor
2. This will:
   - Create/fix `assets` table for uploads
   - Update `media_assets` table for generated content
   - Create `user_all_media` view
   - Set up proper RLS policies
   - Create performance indexes

### **Step 2: Update Netlify Functions**

#### **`record-asset.js`** ✅ **Already Updated**
- **Purpose**: Record user uploads
- **Table**: `assets` (for uploads)
- **Status**: ✅ Updated to use `assets` table

#### **`aimlApi.js`** ✅ **Already Correct**
- **Purpose**: Save AI-generated content
- **Table**: `media_assets` (for generated content)
- **Status**: ✅ Already using `media_assets` table

#### **`getUserMedia.js`** ✅ **Already Updated**
- **Purpose**: Fetch user's combined media
- **Table**: `user_all_media` view (unified read)
- **Status**: ✅ Updated to use unified view

### **Step 3: Update Client Code**

#### **Media Display**
```typescript
// The unified view provides consistent structure
interface MediaItem {
  kind: 'upload' | 'generated';
  id: string;
  url: string;
  resource_type: 'image' | 'video';
  visibility: 'private' | 'public' | 'unlisted';
  allow_remix: boolean;
  prompt?: string;
  parent_asset_id?: string;
  created_at: string;
}

// Show different UI based on kind
{media.map(item => (
  <MediaCard 
    key={item.id}
    item={item}
    showRemixButton={item.kind === 'generated' && (item.allow_remix || item.user_id === currentUserId)}
    showPrompt={item.kind === 'generated'}
  />
))}
```

#### **Remix Logic**
```typescript
// When user clicks remix
const handleRemix = async (sourceItem: MediaItem) => {
  if (sourceItem.kind === 'generated' && sourceItem.allow_remix) {
    // Send I2I with parent reference
    const response = await fetch('/.netlify/functions/aimlApi', {
      method: 'POST',
      body: JSON.stringify({
        user_id: currentUserId,
        source_url: sourceItem.url,
        prompt: userPrompt,
        parent_asset_id: sourceItem.id, // Link to parent
        resource_type: sourceItem.resource_type
      })
    });
  }
};
```

## 🔒 **RLS Policies**

### **`assets` Table (Uploads)**
- **Always private**: Users can only see their own uploads
- **No sharing**: Uploads are never public

### **`media_assets` Table (Generated)**
- **Selective visibility**: Can be private, public, or unlisted
- **Remix controls**: `allow_remix` flag controls who can remix
- **Public access**: Public content visible to all authenticated users

## 📊 **Performance Considerations**

### **Indexes Created**
- `idx_assets_user_id` - Fast user upload queries
- `idx_media_assets_user_id` - Fast user generation queries
- `idx_media_assets_visibility` - Fast public feed queries
- `idx_media_assets_parent_asset_id` - Fast remix chain queries

### **Query Optimization**
- `user_all_media` view combines data efficiently
- RLS policies ensure users only see relevant content
- Pagination with `LIMIT 100` prevents large result sets

## 🧪 **Testing Checklist**

### **Upload Flow**
- [ ] Upload image/video → stored in `assets` table
- [ ] `record-asset` returns 200
- [ ] File appears in user's media gallery

### **Generation Flow**
- [ ] Select upload → I2I/V2V generation
- [ ] Result stored in `media_assets` table
- [ ] Generated content appears in gallery

### **Remix Flow**
- [ ] Click remix on public content
- [ ] New generation linked to parent via `parent_asset_id`
- [ ] Remix chain visible in UI

### **Privacy Controls**
- [ ] Uploads always private
- [ ] Generated content respects visibility settings
- [ ] Public feed only shows public generated content

## 🚀 **Deployment**

### **1. Database Migration**
```bash
# Run in Supabase SQL editor
# database-unified-schema-migration.sql
```

### **2. Function Updates** ✅ **Complete**
- All Netlify functions updated
- Ready for deployment

### **3. Client Updates**
- Update media display components
- Implement remix logic
- Test unified media loading

## 🎉 **Benefits After Implementation**

1. **Cleaner data model**: Clear separation of concerns
2. **Better user experience**: All content in one place
3. **Easier remix logic**: Clear parent-child relationships
4. **Improved performance**: Optimized queries and indexes
5. **Better privacy controls**: Different rules for different content types
6. **Scalable architecture**: Easy to add new content types

## 🔍 **Monitoring & Debugging**

### **Check Database State**
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('assets', 'media_assets', 'user_all_media');

-- Check view structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'user_all_media';

-- Test unified view
SELECT * FROM user_all_media LIMIT 5;
```

### **Common Issues**
1. **Type mismatches**: Ensure `user_id` is TEXT in both tables
2. **RLS policies**: Verify policies allow proper access
3. **View permissions**: Ensure authenticated users can access view

---

**Next Steps**: Run the migration script, test the flows, and update client components to use the unified media structure.
