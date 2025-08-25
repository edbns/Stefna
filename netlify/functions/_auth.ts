import { requireAuth } from "./_lib/auth";

// Re-export the unified auth functions
export { requireAuth };

export function httpErr(status: number, code: string, extra: any = {}) {
  const err: any = new Error(code);
  err.statusCode = status;
  err.code = code;
  err.extra = extra;
  return err;
}

// Utility functions for other functions
export function resp(statusCode: number, body: any) {
  return {
    statusCode,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  };
}

export function handleCORS(event: any) {
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

export function sanitizeDatabaseUrl(url: string): string {
  if (!url) return '';
  
  // Basic URL validation and sanitization
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
