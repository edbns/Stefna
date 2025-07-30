export const API_ENDPOINTS = {
  YOUTUBE_TRENDING: '/.netlify/functions/trending-youtube',
  REDDIT_TRENDING: '/.netlify/functions/trending-reddit',
  AI_CHAT: '/.netlify/functions/ai-chat',
  AI_SUMMARY: '/.netlify/functions/openrouter-summary',
  TEST: '/.netlify/functions/test'
} as const;

export const API_TIMEOUT = 10000; // 10 seconds
export const API_RETRY_ATTEMPTS = 3;
export const API_CACHE_DURATION = 20 * 60 * 1000; // 20 minutes

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const; 