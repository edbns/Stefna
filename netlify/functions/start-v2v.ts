// netlify/functions/start-v2v.ts - DISABLED: V2V not supported by AIML
import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  // V2V is currently disabled - AIML doesn't support video-to-video
  return {
    statusCode: 503,
    body: JSON.stringify({ 
      error: 'V2V_DISABLED',
      message: 'Video-to-video generation is currently disabled as AIML API does not support it'
    })
  };
}