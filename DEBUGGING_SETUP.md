# Debugging Setup Guide

This guide contains the debugging patches implemented to identify what's silently blocking the generation flow.

## What Was Implemented

### 1. Global Browser Logging ✅
- Added error event listeners for `window.onerror` and `unhandledrejection`
- Intercepted `window.fetch` to log all network requests with unique IDs
- Added to `src/main.tsx`

### 2. Visible User Intent Guard ✅
- Updated `requireUserIntent` function in `src/utils/generationGuards.ts`
- Now logs `🛡️ requireUserIntent: ALLOW/BLOCK` for every call
- Added guard to all generation entry points

### 3. Centralized Generation Dispatcher ✅
- Created `dispatchGenerate` function in `src/components/HomeNew.tsx`
- Added comprehensive logging with `console.table` for state sanity checks
- All generate/remix buttons now use this centralized function

### 4. Health Endpoint ✅
- Updated `netlify/functions/health.js` to return simple env checks
- Returns boolean status for key environment variables

### 5. Proper State Management ✅
- Ensured `isGenerating` is always reset in `finally` blocks
- Added sanity logging before API calls

## Testing Steps

### Step 1: Verify Global Logging
1. Open browser console
2. Refresh the page
3. You should see fetch interception setup message
4. Any errors should now be logged with `[window.onerror]` prefix

### Step 2: Test Health Endpoint
Run this in browser console:
```javascript
fetch('/.netlify/functions/health').then(r=>r.json()).then(console.log)
```
Expected: `{ok: true, env: {SUPABASE_URL: true, ANON_KEY: true, ...}}`

### Step 3: Test Generation Flow
1. Upload an image/video
2. Enter a prompt
3. Click Generate
4. Check console for:
   - `▶ dispatchGenerate` with kind
   - `🛡️ requireUserIntent: ALLOW`
   - `[fetch>]` for aimlApi call
   - `[fetch<]` with status code
   - `⏹ dispatchGenerate done` with timing

### Step 4: Test Preset Generation
1. Click a preset button
2. Should see `dispatchGenerate('preset')` in console
3. Same logging flow as custom generation

### Step 5: Test Remix
1. Click remix on any media
2. Should see `dispatchGenerate('remix')` in console
3. Same logging flow

## What to Look For

### If No Fetch Logs Appear
- Button click never reaches network layer
- Check if button is disabled (`isGenerating`, missing `previewUrl`, etc.)
- Check if guard is blocking silently

### If Fetch Logs But No Response
- Network request is made but fails
- Check server logs for errors
- Check environment variables in health endpoint

### If Guard Blocks
- Look for `🛡️ requireUserIntent: BLOCK` messages
- Check if `userInitiated: true` is being passed

### If State Issues
- Look for sanity check tables showing unexpected values
- Check if `isGenerating` gets stuck in `true` state

## Quick Debug Commands

```javascript
// Test health endpoint
fetch('/.netlify/functions/aimlApi', { method: 'OPTIONS' }).then(r=>console.log('aimlApi', r.status));

// Check current state (run in HomeNew context)
console.table({
  hasActiveAssetUrl: !!previewUrl,
  promptLen: prompt?.length ?? 0,
  isGenerating,
  isAuthenticated,
});
```

## Expected Flow
1. User clicks Generate/Remix
2. `dispatchGenerate` called with kind
3. Guard checks `requireUserIntent({ userInitiated: true, source: kind })`
4. Sanity checks logged to console
5. `[fetch>]` logs API call
6. `[fetch<]` logs response
7. Success/error handling
8. `⏹ dispatchGenerate done` with timing

If any step fails, the console will show exactly where the flow breaks.
