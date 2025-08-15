# Intent Queue System - Developer Guide

## 🎯 Overview

The Intent Queue system provides **race-condition-free, one-click generation** for all preset types (Preset, Time Machine, Restore, Story Mode). It eliminates the need for manual "Generate" buttons and ensures bulletproof HTTPS validation.

## 🚨 **IMPORTANT: Do NOT Add New Files**

This system is **complete and self-contained**. Before adding new files, understand the existing architecture:

### ✅ **What We Have (Use These):**
- `src/state/intentQueue.ts` - Single source of truth for all generation intents
- `src/runner/kick.ts` - Unified execution engine
- `src/lib/upload.ts` - Upload handler with auto-kick
- `src/components/HiddenUploader.tsx` - Seamless file picker
- `src/components/PresetButton.tsx` - Intent-based button components

### ❌ **What NOT to Add:**
- ~~New preset handlers~~ (use existing `runPreset`)
- ~~New upload components~~ (use `HiddenUploader`)
- ~~New generation pipelines~~ (use `kickRunIfReady`)
- ~~New state stores~~ (use `intentQueue`)

---

## 🏗️ Architecture

```
User Click → Intent Queue → Upload (if needed) → Auto-Execute → Clear Intent
     ↓              ↓              ↓                ↓              ↓
PresetButton → setIntent() → HiddenUploader → kickRunIfReady() → clearIntent()
```

### **Core Flow:**
1. **Button Click** → Sets intent in queue
2. **Check Source** → If no HTTPS URL, open file picker
3. **Upload Success** → Sets `sourceUrl` and triggers `kickRunIfReady()`
4. **Auto-Execute** → Runs the queued intent with validated source
5. **Cleanup** → Clears intent and resets uploader

---

## 📁 File Structure & Responsibilities

### **🎯 Intent Management**
```typescript
// src/state/intentQueue.ts
type Intent = 
  | { kind: 'preset'; presetId: string }
  | { kind: 'time_machine'; key: string }
  | { kind: 'restore'; key: string }
  | { kind: 'story'; theme: string };

// Usage:
const { setIntent, sourceUrl } = useIntentQueue();
setIntent({ kind: 'preset', presetId: 'vintage_film_35mm' });
```

### **⚡ Execution Engine**
```typescript
// src/runner/kick.ts
export async function kickRunIfReady(): Promise<void>

// Features:
// - Single pending run protection (_busy flag)
// - HTTPS validation before execution
// - Handles all 4 intent types
// - Auto-clears intent after completion
```

### **📤 Upload Integration**
```typescript
// src/lib/upload.ts
export async function handleUploadSelectedFile(file: File): Promise<string>

// Flow:
// 1. Upload to Cloudinary → get secure_url
// 2. Validate HTTPS URL
// 3. Set sourceUrl in intent queue
// 4. Trigger kickRunIfReady() via microtask
```

### **🎨 UI Components**
```typescript
// src/components/PresetButton.tsx
// - PresetButton, TimeMachineButton, RestoreButton, StoryButton
// - Set intent → check source → run immediately OR open file picker
// - No manual "Generate" button needed

// src/components/HiddenUploader.tsx
// - Hidden file input (id="hidden-file-input")
// - Auto-resets after each upload (no refresh needed)
// - Integrated with handleUploadSelectedFile
```

---

## 🔧 How to Add New Features

### **✅ Adding a New Preset:**
```typescript
// 1. Add to PRESETS in src/utils/presets/types.ts
export const PRESETS = {
  // ... existing presets
  my_new_preset: {
    id: 'my_new_preset',
    label: 'My New Preset',
    prompt: 'amazing new style',
    // ... other properties
  }
} satisfies Record<string, Preset>;

// 2. Use existing PresetButton component
<PresetButton presetId="my_new_preset">
  My New Preset
</PresetButton>

// That's it! No new files needed.
```

### **✅ Adding a New Time Machine Era:**
```typescript
// 1. Add to OPTION_GROUPS.time_machine in src/utils/presets/types.ts
export const OPTION_GROUPS = {
  time_machine: {
    // ... existing eras
    '2010s_instagram': { use: 'vintage_film_35mm', overrides: { strength: 0.6 } }
  }
};

// 2. Use existing TimeMachineButton component
<TimeMachineButton optionKey="2010s_instagram">
  2010s Instagram
</TimeMachineButton>
```

### **✅ Adding Custom Logic:**
```typescript
// Hook into the existing pipeline in src/runner/kick.ts
if (pending.kind === 'preset') {
  const preset = resolvePreset(pending.presetId);
  
  // Add custom logic here if needed
  if (preset.id === 'my_special_preset') {
    // Custom handling
  }
  
  await runPreset(preset, sourceUrl);
}
```

---

## 🛡️ Built-in Protections

### **Race Condition Prevention:**
- **Microtask debouncing** after upload
- **Single pending run** protection (`_busy` flag)
- **State settlement** before execution

### **HTTPS Validation (Triple-Gated):**
1. **Upload validation** - Verifies `secure_url.startsWith('https://')`
2. **Pre-execution check** - Validates source before `runPreset`
3. **Final gate** - Validates `job.params.image_url` before API call

### **Error Recovery:**
- **Auto-reset uploader** after each run
- **Intent cleanup** in finally blocks
- **Graceful fallbacks** for missing options

---

## 🔍 Debugging

### **Console Commands:**
```javascript
// Inspect current state
window.debugIntent()
// Returns: { pending: {...}, sourceUrl: "https://..." }

// Expected flow logs:
🧭 Setting intent: { kind: 'preset', presetId: '...' }
📁 File selected: image.jpg
📤 Upload successful, secure_url: https://...
🖼️ Setting source URL: https://...
🚀 kickRunIfReady called: { pending: {...}, hasSource: true }
✅ HTTPS source validated: https://...
✅ Intent completed successfully
```

### **Environment Flags:**
```bash
# Bypass intent queue for debugging (not implemented yet)
VITE_ONE_CLICK_DIRECT=1
```

---

## ⚠️ Common Mistakes to Avoid

### **❌ DON'T:**
- Create new upload handlers (use `handleUploadSelectedFile`)
- Create new generation pipelines (use `kickRunIfReady`)
- Add manual "Generate" buttons (intents auto-execute)
- Call `runPreset` directly from UI (use intent queue)
- Create new state stores (use `intentQueue`)

### **✅ DO:**
- Use existing button components (`PresetButton`, etc.)
- Add new presets to `PRESETS` object
- Add new options to `OPTION_GROUPS`
- Hook into existing pipeline for custom logic
- Follow the intent → upload → kick → clear flow

---

## 🎉 Benefits of This System

- **One-Click UX** - No manual Generate button needed
- **Race-Condition Free** - Bulletproof state management
- **HTTPS Safe** - Triple-gated validation prevents API 400s
- **Self-Contained** - All logic in 6 core files
- **Debuggable** - Comprehensive logging and debug hooks
- **Extensible** - Easy to add new presets/options without new files

---

## 📞 Need Help?

1. **Check existing components** in `src/components/PresetButton.tsx`
2. **Review intent types** in `src/state/intentQueue.ts`
3. **Trace execution flow** in `src/runner/kick.ts`
4. **Use debug commands** `window.debugIntent()`
5. **Follow the logs** in browser console

**Remember: This system is complete. Before adding files, make sure you can't achieve your goal with the existing architecture.**
