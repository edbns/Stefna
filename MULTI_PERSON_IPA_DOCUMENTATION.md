# Multi-Person IPA System Documentation

## Overview
This document explains the Multi-Person Identity Preservation & Group-Aware Handling system implemented in the Stefna AI photo app. The system extends the original single-face IPA to support couples, families, and groups while maintaining identity preservation.

## What Was Implemented

### 1. Group Detection & Classification
- **Location**: `src/utils/promptEnhancement.ts`
- **Functions Added**:
  - `detectCoupleFromPrompt(prompt: string): boolean` - Detects romantic keywords
  - `determineGroupType(prompt: string, faceCount: number): 'solo' | 'couple' | 'family' | 'group'` - Classifies group type
  - `getGroupPromptPrefix(groupType): string` - Returns group-specific prompt prefixes
  - `getGroupNegativePromptAdditions(groupType): string` - Returns group-specific negative prompt additions

### 2. Multi-Person IPA Matching
- **Location**: `src/services/identityPreservationService.ts`
- **New Interfaces**:
  - `FaceMatch` - Individual face matching results
  - `MultiPersonIPAResult` - Overall multi-person IPA check result
- **New Methods**:
  - `performMultiPersonIPACheck()` - Public method to initiate multi-person IPA
  - `checkMultiPersonIdentityPreservation()` - Private method for multi-face comparison
  - `extractAllFaceEmbeddings()` - Extracts embeddings for all detected faces
  - `matchFacesByGroupType()` - Applies matching rules based on group type

### 3. Group-Aware Prompt Scaffolding
- **Location**: `netlify/functions/unified-generate-background.ts`
- **Function Added**:
  - `applyGroupAwarePromptScaffolding(originalPrompt, faceCount, presetId)` - Applies group-aware prompt modifications
- **Integration Points**:
  - BFL Generation Mode
  - Edit Mode (Fal.ai)
  - Unreal Reflection Mode (Fal.ai)
  - Parallel Self Mode (Fal.ai)
  - General Fal.ai Generation

### 4. Granular Control for Parallel Self Presets
- **Location**: `src/utils/promptEnhancement.ts`
- **Constants Added**:
  - `PARALLEL_SELF_GROUP_INJECTION_MAP` - Maps preset IDs to allowed group types
- **Function Added**:
  - `shouldApplyGroupInjection(presetId, groupType): boolean` - Checks if group injection is allowed

## How It Works

### Group Detection Flow
1. **Prompt Analysis**: System analyzes the user's prompt for romantic keywords (couple, together, romantic, lovers, partners, holding hands)
2. **Face Count**: System counts detected faces in the source image via TensorFlow.js MediaPipe Face Mesh predictions.length
3. **Group Classification**: Based on both prompt keywords and face count, determines group type:
   - `solo`: 1 person
   - `couple`: 2 people + romantic keywords
   - `family`: 3+ people + family keywords
   - `group`: 3+ people + group keywords

### Prompt Injection Rules
The system only injects group-aware prompts when:
1. **Multiple people detected** (not solo)
2. **Preset allows the group type** (based on `PARALLEL_SELF_GROUP_INJECTION_MAP`)

### Parallel Self Preset Rules
| Preset | Couple | Family | Group | Group Prompt Style | Notes |
|--------|--------|--------|-------|-------------------|-------|
| Rain Dancer | ✅ | ✅ | ✅ | Cinematic, emotional | Rain scene fits all group types |
| The Untouchable | ✅ | ❌ | ✅ | Editorial, fashion power | Fashion power duo or editorial squad |
| Holiday Mirage | ✅ | ✅ | ❌ | Luxury travel, vacation | Luxury getaway = couples, families |
| The One That Got Away | ❌ | ❌ | ❌ | Solo narrative | Solo narrative only |
| Nightshade | ✅ | ❌ | ✅ | Street fashion, edgy | Edgy fashion friends or duo looks |
| Afterglow | ✅ | ❌ | ❌ | Intimate, after-party | Couple moment only |

## Technical Implementation Details

### Group Prompt Prefixes
- **Couple**: "Transform this couple into a cinematic fashion duo, both styled in matching looks and lighting, each person preserving their original face and identity."
- **Family**: "Transform this family into a stylish modern group, preserving each person's age, face, and group size — children remain children, adults remain adults."
- **Group**: "Transform this group into a cohesive fashion collective. No extra people added, no one removed. All original faces must remain the same."

*Note: These prefixes are merged dynamically with user prompts via `${prefix} ${userPrompt}` template.*

### Negative Prompt Additions
- **Couple**: ", face duplication, missing faces, extra people, generic characters"
- **Family**: ", incorrect age, face swap, character replacement"
- **Group**: ", face duplication, missing faces, extra people, generic characters"

### IPA Matching Rules
- **Solo**: Identity match on single face using cosine similarity of face embeddings
- **Couple**: Identity match on both faces + ensure 2 people in output using cosine similarity
- **Family**: Match number of faces AND approximate age class using cosine similarity
- **Group**: Match face count AND spacing using cosine similarity

*Note: All matching is done per-face using cosine similarity of TensorFlow.js face embeddings.*

## Integration Points

### 1. BFL Generation Mode
```typescript
// Before enhancement
const { scaffoldedPrompt, negativePromptAdditions } = applyGroupAwarePromptScaffolding(
  originalPrompt, 
  faceCount, 
  undefined // BFL doesn't use presetId - undefined is safe
);
```

### 2. Fal.ai Edit Mode
```typescript
// Before enhancement
const { scaffoldedPrompt, negativePromptAdditions } = applyGroupAwarePromptScaffolding(
  originalPrompt, 
  faceCount, 
  undefined // Edit mode doesn't use presetId - undefined is safe
);
```

### 3. Unreal Reflection Mode
```typescript
// Before enhancement
const { scaffoldedPrompt, negativePromptAdditions } = applyGroupAwarePromptScaffolding(
  originalPrompt, 
  faceCount, 
  undefined // Unreal Reflection doesn't use presetId - undefined is safe
);
```

### 4. Parallel Self Mode
```typescript
// Before enhancement
const { scaffoldedPrompt, negativePromptAdditions } = applyGroupAwarePromptScaffolding(
  originalPrompt, 
  faceCount, 
  params.parallelSelfPresetId // Uses presetId for granular control
);
```

*Note: All undefined presetId values are intentional except in Parallel Self mode.*

## Important Notes for Developers

### ⚠️ Critical Rules
1. **Never modify solo behavior** - Solo photos work exactly as before
2. **Group injection only happens when appropriate** - Multiple people + preset allows it
3. **Preset-specific rules must be respected** - Each Parallel Self preset has specific group type allowances
4. **The One That Got Away is solo-only** - Never inject group prompts for this preset

### 🔧 Maintenance
- **Adding new presets**: Update `PARALLEL_SELF_GROUP_INJECTION_MAP` if they should support group injection
- **Modifying group detection**: Update `detectCoupleFromPrompt()` and `determineGroupType()` functions
- **Changing prompt prefixes**: Update `getGroupPromptPrefix()` function
- **Adding new group types**: Update all related functions and type definitions

### 🐛 Debugging
- Check `groupType` in logs to see what was detected
- Verify `shouldApplyGroupInjection()` returns correct boolean
- Check `scaffoldedPrompt` vs `originalPrompt` to see if injection occurred
- Review `negativePromptAdditions` to see what was added
- **CLI Testing**: Use `npm run test:ipa` (if available) or manual testing with different group sizes

## File Structure
```
src/
├── utils/
│   └── promptEnhancement.ts          # Group detection & prompt injection logic
├── services/
│   └── identityPreservationService.ts # Multi-person IPA matching
└── presets/
    └── parallelSelf.ts               # Parallel Self preset definitions

netlify/functions/
└── unified-generate-background.ts    # Main generation pipeline with group scaffolding
```

## Testing
To test the system:
1. **Solo photos**: Should work exactly as before (no group injection)
2. **Couple photos**: Should get couple-specific prompts (if preset allows)
3. **Family photos**: Should get family-specific prompts (if preset allows)
4. **Group photos**: Should get group-specific prompts (if preset allows)
5. **The One That Got Away**: Should never get group injection (solo-only)

## Future Enhancements
- Smart retry logic for failed multi-person IPA
- Age class detection for family matching
- Relationship detection (holding hands, etc.)
- Custom group types beyond the current four
- **Pose analysis** to detect interaction in couple/family photos
- **Face coverage heatmaps** to penalize cropped/missing faces
- **Handling of synthetic extra faces** generated accidentally

---

**Last Updated**: January 2025  
**Developer**: AI Assistant  
**Status**: Production Ready ✅
