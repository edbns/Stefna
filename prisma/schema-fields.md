# Prisma Field Change Log

## 2025-08-28 - Major Schema Overhaul (Async System)

### ❌ Removed Fields
- `preset` from `CustomPromptMedia` → replaced with `presetKey`
- `preset` from `EmotionMaskMedia` → replaced with `presetKey`
- `preset` from `PresetsMedia` → replaced with `presetKey`
- `preset` from `NeoGlitchMedia` → replaced with `presetKey`

### ✅ Added Fields
- `presetKey` to all media models (standardized naming)
- `sourceUrl` to `EmotionMaskMedia`, `CustomPromptMedia`, `PresetsMedia`
- `errorMessage` to all media models for better error handling
- `runId` to `EmotionMaskMedia`, `CustomPromptMedia`, `PresetsMedia`
- `updatedAt` to all media models for tracking changes
- `mediaUploadAgreed` to `UserSettings` for agreement persistence

### 🔄 Field Type Changes
- `imageUrl` in all media models: `String` → `String?` (optional for async jobs)
- `status` in all media models: `"completed"` → `"processing"` (default for async)

### 📊 Index Updates
- Added `runId` indexes for performance
- Added `presetKey` indexes for filtering
- Added `status` indexes for querying

## 2025-08-28 - Database Reset
- Complete database reset and sync with new schema
- All tables now match Prisma schema exactly
- No more schema drift issues

## Migration Notes
- Used `npx prisma db push --force-reset` due to constraint conflicts
- All existing data was cleared (acceptable for development)
- New schema is fully compatible with async generation system

## Future Changes
- Always update this log when modifying schema.prisma
- Use `Prisma.ModelSelect` types for compile-time safety
- Test field names locally before deploying
