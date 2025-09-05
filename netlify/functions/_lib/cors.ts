// CORS configuration utilities for Netlify Functions
// Provides secure CORS headers based on environment

/**
 * Get the allowed origin based on environment
 */
export function getAllowedOrigin(): string {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (nodeEnv === 'production') {
    // Production: Only allow your domain
    return 'https://stefna.xyz';
  } else {
    // Development: Allow localhost and common dev ports
    return '*'; // Keep permissive for development
  }
}

/**
 * Get CORS headers for responses
 */
export function getCORSHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400' // 24 hours
  };
}

/**
 * Get CORS headers for admin functions (more restrictive)
 */
export function getAdminCORSHeaders(): Record<string, string> {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  return {
    'Access-Control-Allow-Origin': nodeEnv === 'production' ? 'https://stefna.xyz' : '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '3600' // 1 hour for admin functions
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCORS(event: any, isAdmin: boolean = false): any | null {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: isAdmin ? getAdminCORSHeaders() : getCORSHeaders(),
      body: ''
    };
  }
  return null; // No CORS response needed
}

/**
 * Add CORS headers to any response
 */
export function addCORSHeaders(response: any, isAdmin: boolean = false): any {
  if (response && response.headers) {
    const corsHeaders = isAdmin ? getAdminCORSHeaders() : getCORSHeaders();
    response.headers = { ...response.headers, ...corsHeaders };
  }
  return response;
}
