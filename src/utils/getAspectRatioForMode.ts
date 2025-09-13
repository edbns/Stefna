export function getAspectRatioForMode(mode: string): string {
  switch (mode) {
    case 'ghibli_reaction':
    case 'unreal_reflection':
    case 'custom':
    case 'presets':
      return '4:5'; // Instagram/Facebook/X-friendly portrait

    case 'neo_glitch':
      return '16:9'; // Cinematic wide (Stability.ai)

    case 'story_time':
      return '9:16'; // Vertical for TikTok/Reels (Kling video)

    default:
      return '1:1'; // Safe fallback
  }
}

export function getDimensionsForAspectRatio(aspectRatio: string): { width: number, height: number } {
  switch (aspectRatio) {
    case '4:5':
      return { width: 1024, height: 1280 };
    case '3:4':
      return { width: 960, height: 1280 };
    case '16:9':
      return { width: 1280, height: 720 };
    case '9:16':
      return { width: 720, height: 1280 };
    case '1:1':
    default:
      return { width: 1024, height: 1024 };
  }
}
