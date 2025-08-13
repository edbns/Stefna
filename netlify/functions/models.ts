// models.ts - Explicit model definitions for V2V/I2V
export const MODELS = {
  I2V: 'kling-video/v1.6/standard/image-to-video',
  V2V: 'kling-video/v1.6/standard/video-to-video',
};

export function detectIsVideo(url?: string): boolean {
  return !!url && /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}

export function isVideoAsset(asset: any): boolean {
  return asset?.resource_type === 'video'
      || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(asset?.secure_url || asset?.url || '');
}
