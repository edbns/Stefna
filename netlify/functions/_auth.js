/**
 * Authentication helper for Netlify functions
 * Provides bulletproof user authentication and response formatting
 */

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
  resp, 
  handleCORS 
};
