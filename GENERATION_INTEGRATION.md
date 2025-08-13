# 🚀 Generation Integration Guide

This guide shows how to integrate the new generation event system and ensure spinners stop reliably while V2V lands in Cloudinary every time.

## 📁 New Files Added

- `src/lib/generationEvents.ts` - Centralized generation state management
- `src/lib/mediaUtils.ts` - URL mapping utilities for Cloudinary resources  
- `src/examples/GenerationIntegration.tsx` - Integration examples
- `GENERATION_INTEGRATION.md` - This guide

## 🔧 Quick Integration

### 1. Show Spinner (Any Component)

```tsx
import { useGenerationEvents } from '@/lib/generationEvents';

export default function YourComponent() {
  const { isRunning, lastEvent } = useGenerationEvents();

  return (
    <>
      {isRunning && <Spinner />}
      {lastEvent?.kind === 'error' && (
        <div className="error">Error: {lastEvent.message}</div>
      )}
      {/* Your UI */}
    </>
  );
}
```

### 2. Start Generation (Images + Videos)

```tsx
import { generationStart, generationDone, withGenerationTimeout } from '@/lib/generationEvents';

async function dispatchGenerate({ isVideo, payload, toast }) {
  generationStart({ kind: isVideo ? 'video' : 'image' });
  const clearTimeout = withGenerationTimeout(90000); // 90s safety
  
  try {
    if (isVideo) {
      // START V2V
      const start = await fetch("/.netlify/functions/start-v2v", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // { video_url, prompt, ... }
      });
      if (!start.ok) throw new Error(`start-v2v ${start.status}`);
      const { job_id } = await start.json();

      // POLL with Cloudinary persistence
      for (let i = 0; i < 45; i++) { // 90s max
        await new Promise(r => setTimeout(r, 2000));
        const r = await fetch(`/.netlify/functions/poll-v2v?id=${job_id}&persist=true&userId=${payload.userId}`);
        if (!r.ok) throw new Error(`poll-v2v ${r.status}`);
        const j = await r.json();

        if (j.status === "failed") throw new Error(j.error);
        if (j.status === "completed") {
          generationDone({ kind: "video", ...j.data });
          return j.data;
        }
      }
      throw new Error('V2V timeout');
      
    } else {
      // IMAGE flow (aimlApi + save-media)
      const result = await fetch("/.netlify/functions/aimlApi", { /* ... */ });
      // ... save-media call
      generationDone({ kind: "image", publicId, url });
    }
  } catch (err) {
    generationDone({ kind: "error", message: String(err) });
    throw err;
  } finally {
    clearTimeout();
  }
}
```

### 3. URL Mapping (Feed/Gallery)

```tsx
import { toFinalUrl, mapFeedItemUrls } from '@/lib/mediaUtils';

// Individual URLs
const videoUrl = toFinalUrl("stefna/outputs/user/abc123", "video");
const imageUrl = toFinalUrl("stefna/outputs/user/def456", "image");

// Batch mapping for feed
const mappedItems = feedItems.map(mapFeedItemUrls);
```

## 🎯 Key Benefits

### ✅ Reliable Spinner Control
- **Global state**: `useGenerationEvents()` hook tracks running status
- **Event-driven**: Components automatically react to generation start/stop
- **Safety timeout**: 90s hard cutoff prevents infinite spinners
- **Error handling**: Spinners stop on any error condition

### ✅ V2V Cloudinary Persistence  
- **Auto-persist**: `&persist=true` saves videos to Cloudinary
- **Proper tags**: Videos get `stefna`, `v2v`, `type:output` tags
- **User folders**: Organized in `stefna/outputs/{userId}/`
- **Metadata**: Includes user_id and timestamps

### ✅ Unified URL Handling
- **Resource detection**: Auto-detects image vs video
- **Cloudinary optimization**: Built-in transformations support
- **Thumbnail generation**: Video thumbnails for previews
- **Fallback handling**: Graceful degradation if cloud not configured

## 🔄 Migration Steps

1. **Add the new files** (already done)
2. **Update spinner components** to use `useGenerationEvents()`
3. **Update generation calls** to use `generationStart()` and `generationDone()`
4. **Update feed mapping** to use `mapFeedItemUrls()` or `toFinalUrl()`
5. **Test both image and video flows**

## 🧪 Testing

### Image Generation Test
1. Upload an image
2. Select a preset
3. Verify spinner shows and stops
4. Check image appears in feed

### Video Generation Test  
1. Upload a video
2. Select a preset
3. Verify spinner shows during processing
4. Check video saves to Cloudinary with proper tags
5. Verify video appears in feed with correct URL

## 🚨 Troubleshooting

### Spinner Never Stops
- Check that `generationDone()` is called in all code paths
- Verify `finally` blocks call cleanup
- Use browser dev tools to check for `generation:done` events

### V2V 404 Errors
- Verify `AIML_API_URL` is set to base URL (no `/v2v` suffix)
- Check `AIML_API_KEY` is configured
- Look for successful path in logs: `[start-v2v] trying https://...`

### Videos Not in Cloudinary
- Ensure `&persist=true` in poll URL
- Check Cloudinary env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Look for upload logs: `[poll-v2v] uploading video to Cloudinary`

### URL Generation Issues
- Verify `VITE_CLOUDINARY_CLOUD_NAME` is set in frontend
- Check public_id format in feed data
- Use browser network tab to verify final URLs resolve

## 📝 Notes

- The system is designed to be **fail-safe** - spinners will stop even if events are missed
- V2V persistence is **optional** - videos work without Cloudinary, just won't be saved
- URL utilities **gracefully degrade** - will return raw URLs if Cloudinary not configured
- All functions include **extensive logging** for debugging

Ready to ship! 🎉
