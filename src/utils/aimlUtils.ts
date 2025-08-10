// AIML API utility functions for building payloads and parsing results

type ResourceType = 'image' | 'video';

export function buildEditPayload({
  prompt, 
  sourceUrl, 
  steps, 
  strength, 
  resourceType
}: {
  prompt: string; 
  sourceUrl: string; 
  steps?: number; 
  strength?: number; 
  resourceType: ResourceType;
}) {
  const common = {
    prompt,
    num_inference_steps: steps ?? 36,
  };

  if (resourceType === 'image') {
    return {
      endpoint: '/v1/images/generations',
      body: {
        ...common,
        model: 'flux/dev/image-to-image',
        image_url: sourceUrl,
        strength: Math.min(Math.max(strength ?? 0.7, 0.4), 0.9),
      }
    };
  }

  // VIDEO-TO-VIDEO: keep the same pattern; adjust the field name to whatever your provider expects.
  return {
    endpoint: '/v1/videos/edits',   // or your provider's V2V path
    body: {
      ...common,
      model: 'video/dev/video-to-video', // placeholder model name; use your actual one
      video_url: sourceUrl,              // some providers still use "input_url"
      strength: Math.min(Math.max(strength ?? 0.7, 0.4), 0.9),
    }
  };
}

export function pickResultUrl(res: any) {
  return res?.images?.[0]?.url ?? res?.videos?.[0]?.url ?? res?.data?.[0]?.url ?? res?.result_url ?? null;
}
