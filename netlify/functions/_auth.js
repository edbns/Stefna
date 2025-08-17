const jwt = require('jsonwebtoken');

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

/**
 * Require JWT authentication and return user info
 * @param {Object} event - Netlify function event
 * @returns {Object} user object with userId and email
 */
function requireJWTUser(event) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  
  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const userId = decoded?.userId || decoded?.sub || decoded?.id;
    if (!userId) {
      throw new Error('Token missing userId/sub');
    }
    
    return { 
      userId, 
      email: decoded?.email 
    };
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid JWT token');
    } else if (error.name === 'TokenExpiredError') {
      throw new Error('JWT token expired');
    } else {
      throw new Error('JWT verification failed');
    }
  }
}

/**
 * Create HTTP response object
 * @param {number} statusCode - HTTP status code
 * @param {any} body - Response body
 * @returns {Object} HTTP response object
 */
function resp(statusCode, body) {
  return {
    statusCode,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  };
}

/**
 * Handle CORS preflight requests
 * @param {Object} event - Netlify function event
 * @returns {Object|null} CORS response or null
 */
function handleCORS(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }
  return null; // No CORS response needed
}

/**
 * Sanitize database URL for security
 * @param {string} url - Database URL to sanitize
 * @returns {string} Sanitized database URL
 */
function sanitizeDatabaseUrl(url) {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    // Ensure it's a postgresql URL
    if (parsed.protocol !== 'postgresql:') {
      throw new Error('Invalid database protocol');
    }
    return url;
  } catch {
    throw new Error('Invalid database URL format');
  }
}

module.exports = {
  requireJWTUser,
  resp,
  handleCORS,
  sanitizeDatabaseUrl
};
