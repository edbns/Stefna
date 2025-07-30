export const PLATFORMS = {
  YOUTUBE: 'youtube',
  REDDIT: 'reddit',
  TIKTOK: 'tiktok',
  INSTAGRAM: 'instagram',
  TWITTER: 'twitter'
} as const;

export const PLATFORM_CONFIGS = {
  [PLATFORMS.YOUTUBE]: {
    name: 'YouTube',
    icon: '🎥',
    color: '#FF0000',
    apiEndpoint: '/.netlify/functions/trending-youtube'
  },
  [PLATFORMS.REDDIT]: {
    name: 'Reddit',
    icon: '🤖',
    color: '#FF4500',
    apiEndpoint: '/.netlify/functions/trending-reddit'
  },
  [PLATFORMS.TIKTOK]: {
    name: 'TikTok',
    icon: '🎵',
    color: '#000000',
    apiEndpoint: '/.netlify/functions/trending-tiktok'
  },
  [PLATFORMS.INSTAGRAM]: {
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    apiEndpoint: '/.netlify/functions/trending-instagram'
  },
  [PLATFORMS.TWITTER]: {
    name: 'Twitter',
    icon: '🐦',
    color: '#1DA1F2',
    apiEndpoint: '/.netlify/functions/trending-twitter'
  }
} as const;

export const PLATFORM_NAMES = Object.values(PLATFORMS); 