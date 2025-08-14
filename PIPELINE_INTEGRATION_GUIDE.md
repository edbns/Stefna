# 🔧 Pipeline Integration Guide

## Overview

This guide explains how to integrate the new bulletproof generation pipeline that fixes the three critical issues:

1. **Clicks fire side-effects before preflight** ✅ Fixed
2. **Broken mappings & Story playlist** ✅ Fixed  
3. **Error path doesn't unwind UI** ✅ Fixed

## 🚀 Quick Start

### 1. Initialize the App (Required)

Add this to your main App component or bootstrap:

```typescript
import { initializeApp } from './services/appBootstrap'

// In your App component's useEffect
useEffect(() => {
  initializeApp().catch(console.error)
}, [])
```

### 2. Use the New Handlers

Replace old handler calls with the new pipeline-based ones:

```typescript
// OLD WAY ❌
import { onPresetClick } from './handlers/presetHandlers'
await onPresetClick(presetId, sourceUrl)

// NEW WAY ✅
import { onPresetClick } from './handlers/presetHandlers'
const result = await onPresetClick(presetId, file, sourceUrl)
if (result?.success) {
  // Handle success
}
```

### 3. Subscribe to UI State Changes

```typescript
import { subscribeToUIState } from './services/generationPipeline'

useEffect(() => {
  const unsubscribe = subscribeToUIState((state) => {
    setIsBusy(state.busy)
    setCurrentRunId(state.currentRunId)
  })
  return unsubscribe
}, [])
```

### 4. Check Validation State

```typescript
import { subscribeToValidationState, isTimeMachineOptionAvailable } from './utils/validateMappings'

// Disable unavailable options in UI
const isOptionAvailable = isTimeMachineOptionAvailable('1920s_art_deco')

// Subscribe to validation changes
useEffect(() => {
  const unsubscribe = subscribeToValidationState((state) => {
    setUnavailableOptions(state.unavailableTimeMachineOptions)
    setStoryDisabled(state.storyDisabled)
  })
  return unsubscribe
}, [])
```

## 📋 Handler API Reference

### Preset Handler
```typescript
onPresetClick(presetId: string, file?: File, sourceUrl?: string)
```

### Time Machine Handler
```typescript
onTimeMachineClick(option: string, file?: File, sourceUrl?: string)
```

### Story Mode Handler
```typescript
onStoryClick(files: File[], basePrompt?: string)
```

### Restore Handler
```typescript
onRestoreClick(media: Media, operation?: string)
```

## 🔄 Migration Checklist

### ✅ Backend Files Created/Updated:
- `src/services/generationPipeline.ts` - Main pipeline
- `src/utils/authFetch.ts` - Auth wrapper with 401 handling
- `src/utils/validateMappings.ts` - Mapping validation
- `src/config/timeMachineMap.ts` - Complete mappings (47 options)
- `src/config/storyModeConfig.ts` - Story mode configuration
- `src/services/appBootstrap.ts` - App initialization
- `src/handlers/*Handlers.ts` - Updated all handlers

### 🔧 What's Fixed:

1. **Preflight Checks**: All validations happen BEFORE uploads
2. **Complete Mappings**: 47 Time Machine options, all Story presets mapped
3. **Error Cleanup**: Always clears busy state, prevents stuck UI
4. **Auth Handling**: Automatic 401 retry with fresh tokens
5. **Stale Request Prevention**: Run IDs prevent cross-talk

### 🎯 Key Benefits:

- **No more stuck UI** after errors
- **No more broken preset mappings**
- **No more uploads before validation**
- **Automatic auth token refresh**
- **Centralized error handling**
- **Clean separation of concerns**

## 🚨 Breaking Changes

### Handler Signatures Changed:
```typescript
// OLD
onPresetClick(presetId: string, sourceUrl?: string): Promise<void>

// NEW  
onPresetClick(presetId: string, file?: File, sourceUrl?: string): Promise<GenerationResult | null>
```

### Import Changes:
```typescript
// Replace these imports
import { authenticatedFetch } from '../utils/apiClient'
// With
import { authFetch } from '../utils/authFetch'
```

## 🧪 Testing

1. **Test preset clicks** - Should validate before upload
2. **Test invalid options** - Should show error, not get stuck
3. **Test 401 scenarios** - Should retry automatically
4. **Test mapping validation** - Invalid options should be disabled
5. **Test error recovery** - UI should always clean up

## 📞 Integration Support

If you need help integrating these changes:

1. Check the console for validation warnings
2. Ensure `initializeApp()` is called on startup
3. Replace old handler imports with new ones
4. Subscribe to UI state changes for loading indicators
5. Use validation state to disable broken options

The pipeline is designed to be backward-compatible where possible, but the new handlers provide much better error handling and user experience.
