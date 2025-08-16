/**
 * Authentication helper for Netlify functions
 * Provides bulletproof user authentication and response formatting
 */

const jwt = require('jsonwebtoken');

/**
 * Safely sanitize database URL to prevent connection errors
 * @param {string} rawUrl - Raw database URL from environment
 * @returns {string} Cleaned database URL
 */
function sanitizeDatabaseUrl(rawUrl) {
  if (!rawUrl) return '';
  
  // Remove psql prefix and quotes if present
  let cleanUrl = rawUrl.replace(/^psql\s+['"]?/, '').replace(/['"]?$/, '');
  
  // Remove -pooler from hostname if present (use direct connection)
  cleanUrl = cleanUrl.replace(/-pooler\./g, '.');
  
  return cleanUrl;
}

/**
 * Extract and validate user from Netlify context
 * @param {Object} context - Netlify function context
 * @returns {Object|null} User object with id and email, or null if unauthorized
 */
function requireUser(context) {
  const u = context.clientContext?.user;
  if (!u?.sub) return null;
  return { id: u.sub, email: u.email };
}

/**
 * Verify JWT token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {Object|null} Decoded JWT payload or null if invalid
 */
function verifyJWT(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    console.error('JWT_SECRET environment variable not set');
    return null;
  }
  
  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return null;
  }
}

/**
 * Extract user from JWT token in Authorization header
 * @param {Object} event - Netlify function event
 * @returns {Object|null} User object with userId and email, or null if unauthorized
 */
function requireJWTUser(event) {
  const authHeader = event.headers?.authorization;
  if (!authHeader) return null;
  
  const payload = verifyJWT(authHeader);
  if (!payload) return null;
  
  return {
    userId: payload.userId,
    email: payload.email
  };
}

/**
 * Format consistent responses
 * @param {number} status - HTTP status code
 * @param {any} body - Response body
 * @returns {Object} Formatted response object
 */
function resp(status, body) {
  return { 
    statusCode: status, 
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    }
  };
}

/**
 * Handle CORS preflight requests
 * @param {Object} event - Netlify function event
 * @returns {Object|null} CORS response or null if not preflight
 */
function handleCORS(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  }
  return null;
}

module.exports = { 
  requireUser, 
  requireJWTUser,
  verifyJWT,
  resp, 
  handleCORS,
  sanitizeDatabaseUrl
};
