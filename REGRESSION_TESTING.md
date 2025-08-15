# Regression Testing Checklist

## Daily Testing Requirements

### Core Generation Pipeline
- [ ] **Generate with local file (blob→https)**
  - Upload image → should convert to HTTPS before calling AIML API
  - No more "image_url must be a full https URL" errors
  
- [ ] **Generate with remote https URL**
  - Use existing HTTPS URL → should work directly without upload
  
- [ ] **Force AIML 200 (image_url)**
  - Test response format: `{ image_url: "..." }`
  - Should save media and update UI
  
- [ ] **Force AIML 200 (images[0].url)**
  - Test response format: `{ images: [{ url: "..." }] }`
  - Should save media and update UI
  
- [ ] **Force AIML 500**
  - Test error handling and user feedback
  - Should show error toast, not crash

### Advanced Features
- [ ] **Story run (2 beats)**
  - Test Story Mode generation
  - Should create video job and process beats
  
- [ ] **Time Machine generation**
  - Test era-based transformations
  - Should work with feature flag enabled
  
- [ ] **Restore operations**
  - Test image restoration/enhancement
  - Should work with feature flag enabled

### System Stability
- [ ] **Boot on fresh profile/localStorage**
  - Clear localStorage and refresh
  - Should set default preset, not null
  
- [ ] **Notifications 500 in background**
  - Test graceful degradation
  - Should not crash or show errors to user
  
- [ ] **Upload another image while run in flight**
  - Start generation, then upload new image
  - Should queue or reject appropriately

### UI/UX Flow
- [ ] **Composer closes on Generate click**
  - Should close immediately, not wait for network
  
- [ ] **Preset selection persists**
  - Select preset, refresh page
  - Should remember selection
  
- [ ] **Prompt persistence**
  - Type prompt, close composer, reopen
  - Should restore last prompt

## Feature Flag Testing

### Enable/Disable Features
```bash
# Disable Story Mode
VITE_ENABLE_STORY_MODE=false npm run dev

# Disable Time Machine
VITE_ENABLE_TIME_MACHINE=false npm run dev

# Disable Restore
VITE_ENABLE_RESTORE=false npm run dev

# Disable Preset Rotation
VITE_ENABLE_PRESET_ROTATION=false npm run dev
```

### Expected Behavior
- **Disabled features** should not appear in UI
- **Enabled features** should work normally
- **Toggling flags** should update UI without page refresh

## Error Scenarios

### Network Failures
- [ ] **AIML API timeout**
- [ ] **Cloudinary upload failure**
- [ ] **Save media failure**
- [ ] **Publish failure (non-blocking)**

### State Corruption
- [ ] **selectedPreset becomes null**
- [ ] **Generation state gets stuck**
- [ ] **Queue overflow**

## Performance Checks

### Generation Pipeline
- [ ] **Single generation** completes in reasonable time
- [ ] **Multiple queued generations** process sequentially
- [ ] **Memory usage** stays stable during long runs
- [ ] **UI responsiveness** maintained during generation

### File Handling
- [ ] **Large image uploads** (10MB+) work
- [ ] **Multiple file types** supported
- [ ] **Upload progress** visible to user

## Browser Compatibility

### Modern Browsers
- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest)
- [ ] **Edge** (latest)

### Mobile
- [ ] **iOS Safari** (latest)
- [ ] **Chrome Mobile** (latest)

## Console Monitoring

### Expected Logs
- `🎯 Using boot default preset: cinematic_glow`
- `🚩 Feature Flags: { enabled: [...], disabled: [...] }`
- `📁 File selected: filename.jpg`
- `💾 Saving generation result to DB`

### Error Patterns to Watch
- `ERR_BLOCKED_BY_CLIENT` (should be suppressed)
- `Generation failed, skipping completion handling` (should not occur)
- `selectedPreset became null unexpectedly` (should auto-recover)

## Quick Health Check

Run this command to verify system health:
```bash
npm run build && npm run dev
```

**Expected Output:**
- ✅ Build successful
- ✅ Dev server starts on port 3000+
- ✅ No console errors on page load
- ✅ Feature flags logged
- ✅ Default preset set
- ✅ All imports resolve correctly
