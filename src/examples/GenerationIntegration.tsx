// Integration Examples - How to use the generation events system
// Copy these patterns into your actual components

import React from 'react';
import { 
  useGenerationEvents, 
  generationStart, 
  generationDone, 
  withGenerationTimeout 
} from '../lib/generationEvents';
import { toFinalUrl, mapFeedItemUrls } from '../lib/mediaUtils';

// Example 1: Component that shows spinner
export function FullScreenMediaViewer() {
  const { isRunning, lastEvent } = useGenerationEvents();

  return (
    <div className="viewer">
      {isRunning && (
        <div className="spinner-overlay">
          <div className="spinner" />
          <p>Generating...</p>
        </div>
      )}
      
      {lastEvent?.kind === 'error' && (
        <div className="error-toast">
          Error: {lastEvent.message}
        </div>
      )}
      
      {/* Rest of your UI */}
    </div>
  );
}

// Example 2: Generation dispatch function (images + videos)
export async function dispatchGenerate({ 
  isVideo, 
  payload, 
  toast 
}: { 
  isVideo: boolean; 
  payload: any; 
  toast?: any; 
}) {
  // Start generation and set up safety timeout
  generationStart({ kind: isVideo ? 'video' : 'image' });
  const clearTimeout = withGenerationTimeout(90000); // 90s timeout
  
  try {
    if (isVideo) {
      // VIDEO FLOW: start-v2v → poll-v2v with Cloudinary persistence
      console.log('🎬 Starting V2V generation...');
      
      const startRes = await fetch("/.netlify/functions/start-v2v", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // { video_url, prompt, ... }
      });
      
      if (!startRes.ok) {
        const errorText = await startRes.text();
        throw new Error(`start-v2v ${startRes.status}: ${errorText}`);
      }
      
      const { job_id } = await startRes.json();
      console.log('🎬 V2V job started:', job_id);
      
      // Poll with Cloudinary persistence
      for (let attempts = 0; attempts < 45; attempts++) { // Max 90s (45 * 2s)
        await new Promise(r => setTimeout(r, 2000));
        
        const pollRes = await fetch(
          `/.netlify/functions/poll-v2v?id=${encodeURIComponent(job_id)}&persist=true&userId=${payload.userId || 'public'}`
        );
        
        if (!pollRes.ok) {
          const errorText = await pollRes.text();
          throw new Error(`poll-v2v ${pollRes.status}: ${errorText}`);
        }
        
        const result = await pollRes.json();
        console.log('🎬 V2V poll result:', result);
        
        if (result.status === "failed") {
          throw new Error(result.error || "V2V generation failed");
        }
        
        if (result.status === "completed") {
          // result.data => { mediaType:'video', resultUrl, publicId }
          const { resultUrl, publicId } = result.data;
          
          console.log('✅ V2V completed:', { resultUrl, publicId });
          
          generationDone({ 
            kind: "video", 
            resultUrl,
            publicId,
            data: result.data 
          });
          
          toast?.success('Video generation complete!');
          return result.data;
        }
        
        // Still processing, continue polling
        console.log('🔄 V2V still processing...');
      }
      
      throw new Error('V2V generation timed out');
      
    } else {
      // IMAGE FLOW: aimlApi → save-media (your existing flow)
      console.log('🖼️ Starting I2I generation...');
      
      const aimlRes = await fetch("/.netlify/functions/aimlApi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!aimlRes.ok) {
        const errorText = await aimlRes.text();
        throw new Error(`aimlApi ${aimlRes.status}: ${errorText}`);
      }
      
      const aimlResult = await aimlRes.json();
      console.log('🖼️ I2I result:', aimlResult);
      
      if (!aimlResult.success || !aimlResult.image_url) {
        throw new Error('Image generation failed');
      }
      
      // Save to Cloudinary
      const saveRes = await fetch("/.netlify/functions/save-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result_url: aimlResult.image_url,
          user_id: payload.userId || 'public',
          preset_key: payload.preset_key,
          share_now: payload.share_now || false,
          allow_remix: payload.allow_remix || false,
        }),
      });
      
      if (!saveRes.ok) {
        const errorText = await saveRes.text();
        throw new Error(`save-media ${saveRes.status}: ${errorText}`);
      }
      
      const saveResult = await saveRes.json();
      console.log('✅ I2I saved:', saveResult);
      
      generationDone({ 
        kind: "image", 
        url: saveResult.url,
        publicId: saveResult.public_id,
        data: saveResult 
      });
      
      toast?.success('Image generation complete!');
      return saveResult;
    }
    
  } catch (error) {
    console.error('Generation error:', error);
    const message = error instanceof Error ? error.message : String(error);
    
    generationDone({ 
      kind: 'error', 
      message 
    });
    
    toast?.error(message);
    throw error;
    
  } finally {
    clearTimeout(); // Clear the safety timeout
  }
}

// Example 3: Feed component with proper URL mapping
export function MediaFeed({ items }: { items: any[] }) {
  const mappedItems = items.map(mapFeedItemUrls);
  
  return (
    <div className="feed-grid">
      {mappedItems.map((item) => (
        <div key={item.id} className="feed-item">
          {item.media_type === 'video' ? (
            <video 
              src={item.final} 
              poster={item.thumbnail}
              controls
              className="media-element"
            />
          ) : (
            <img 
              src={item.final} 
              alt="Generated content"
              className="media-element"
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Example 4: Manual URL generation
export function MediaUrlExamples() {
  // For a video public_id
  const videoPublicId = "stefna/outputs/user123/abc123";
  const videoUrl = toFinalUrl(videoPublicId, "video");
  // Result: https://res.cloudinary.com/yourcloud/video/upload/stefna/outputs/user123/abc123.mp4
  
  // For an image public_id  
  const imagePublicId = "stefna/outputs/user123/def456";
  const imageUrl = toFinalUrl(imagePublicId, "image");
  // Result: https://res.cloudinary.com/yourcloud/image/upload/stefna/outputs/user123/def456.jpg
  
  return (
    <div>
      <video src={videoUrl} controls />
      <img src={imageUrl} alt="Generated" />
    </div>
  );
}

// Example 5: Component integration pattern
export function GenerationButton({ onGenerate }: { onGenerate: () => void }) {
  const { isRunning } = useGenerationEvents();
  
  return (
    <button 
      onClick={onGenerate}
      disabled={isRunning}
      className={`generate-btn ${isRunning ? 'loading' : ''}`}
    >
      {isRunning ? 'Generating...' : 'Generate'}
    </button>
  );
}
