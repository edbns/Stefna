# Intent Queue - Quick Reference

## 🚀 Most Common Tasks

### **Add New Preset**
```typescript
// 1. src/utils/presets/types.ts
export const PRESETS = {
  my_preset: { id: 'my_preset', label: 'My Style', prompt: '...', /* ... */ }
};

// 2. Use in UI
<PresetButton presetId="my_preset">My Style</PresetButton>
```

### **Add Time Machine Era**
```typescript
// 1. src/utils/presets/types.ts
OPTION_GROUPS.time_machine['1970s_disco'] = { use: 'vintage_film_35mm' };

// 2. Use in UI  
<TimeMachineButton optionKey="1970s_disco">70s Disco</TimeMachineButton>
```

### **Add Restore Option**
```typescript
// 1. src/utils/presets/types.ts
OPTION_GROUPS.restore['fix_blur'] = { use: 'crystal_clear', overrides: { strength: 0.8 } };

// 2. Use in UI
<RestoreButton optionKey="fix_blur">Fix Blur</RestoreButton>
```

### **Add Story Theme**
```typescript
// 1. src/utils/presets/story.ts
STORY_THEMES.seasons = [
  { label: 'Spring', use: 'dreamy_pastels' },
  { label: 'Summer', use: 'sun_kissed' },
  // ...
];

// 2. Use in UI
<StoryButton theme="seasons">Four Seasons</StoryButton>
```

## 🔍 Debug Commands

```javascript
window.debugIntent()           // Current state
console.log('🧭 Intent:', ...)  // Set intent
console.log('📤 Upload:', ...)  // Upload success  
console.log('🚀 Kick:', ...)    // Execution start
console.log('✅ Done:', ...)     // Completion
```

## 📁 Core Files (Don't Add More)

- `src/state/intentQueue.ts` - State management
- `src/runner/kick.ts` - Execution engine  
- `src/lib/upload.ts` - Upload handler
- `src/components/HiddenUploader.tsx` - File picker
- `src/components/PresetButton.tsx` - UI components
- `src/utils/presets/types.ts` - Data definitions

## ⚡ Flow

Click → Intent → Upload → Kick → Clear → Reset

**No manual Generate button needed!**
