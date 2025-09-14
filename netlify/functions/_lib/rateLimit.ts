// Rate limiting utilities for Netlify Functions
// Uses in-memory storage for simplicity (resets on function restart)

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// In-memory rate limit store (resets on function restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations
export const RATE_LIMITS = {
  'otp-request': { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  'generation': { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 requests per hour
  'api-calls': { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 requests per hour
  'admin-functions': { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50 admin requests per hour
} as const;

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier for the rate limit (usually IP + action)
 * @param config - Rate limit configuration
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // No entry or window expired, create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return true;
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return false;
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  return true;
}

/**
 * Get rate limit info for a key
 * @param key - Unique identifier for the rate limit
 * @param config - Rate limit configuration
 * @returns Rate limit status information
 */
export function getRateLimitInfo(key: string, config: RateLimitConfig): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }

  return {
    allowed: entry.count < config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime
  };
}

/**
 * Create a rate limit key from request context
 * @param event - Netlify function event
 * @param action - Action being rate limited
 * @returns Unique rate limit key
 */
export function createRateLimitKey(event: any, action: string): string {
  // Use IP address + action as the key
  const ip = event.headers['x-forwarded-for'] || 
            event.headers['x-real-ip'] || 
            event.headers['x-client-ip'] || 
            'unknown';
  
  return `${ip}:${action}`;
}

/**
 * Rate limiting middleware for Netlify Functions
 * @param config - Rate limit configuration
 * @param action - Action name for rate limiting
 * @returns Middleware function
 */
export function withRateLimit(config: RateLimitConfig, action: string) {
  return (handler: any) => {
    return async (event: any) => {
      const key = createRateLimitKey(event, action);
      const rateLimitInfo = getRateLimitInfo(key, config);

      if (!rateLimitInfo.allowed) {
        return {
          statusCode: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitInfo.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000).toString()
          },
          body: JSON.stringify({
            error: 'Rate limit exceeded',
            message: `Too many requests. Try again in ${Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000)} seconds.`,
            retryAfter: Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000)
          })
        };
      }

      // Add rate limit headers to response
      const response = await handler(event);
      
      if (response && response.headers) {
        response.headers['X-RateLimit-Limit'] = config.maxRequests.toString();
        response.headers['X-RateLimit-Remaining'] = rateLimitInfo.remaining.toString();
        response.headers['X-RateLimit-Reset'] = rateLimitInfo.resetTime.toString();
      }

      return response;
    };
  };
}
