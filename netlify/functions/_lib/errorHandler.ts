// Error handling utilities for Netlify Functions
// Provides secure error responses that don't leak sensitive information

export interface ErrorResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Sanitize error message for production
 */
export function sanitizeError(error: any, isProduction: boolean = false): string {
  if (isProduction) {
    // In production, return generic error messages
    if (error?.message?.includes('database') || error?.message?.includes('connection')) {
      return 'Service temporarily unavailable. Please try again later.';
    }
    if (error?.message?.includes('authentication') || error?.message?.includes('auth')) {
      return 'Authentication failed. Please sign in again.';
    }
    if (error?.message?.includes('validation') || error?.message?.includes('invalid')) {
      return 'Invalid request. Please check your input and try again.';
    }
    return 'An error occurred. Please try again later.';
  }
  
  // In development, return detailed error messages
  return error?.message || 'Unknown error occurred';
}

/**
 * Create a secure error response
 */
export function createErrorResponse(
  error: any,
  statusCode: number = 500,
  isProduction: boolean = false,
  corsHeaders?: Record<string, string>
): ErrorResponse {
  const sanitizedMessage = sanitizeError(error, isProduction);
  
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    },
    body: JSON.stringify({
      ok: false,
      error: sanitizedMessage,
      ...(isProduction ? {} : { 
        details: error?.message,
        stack: error?.stack 
      })
    })
  };
}

/**
 * Handle common error scenarios
 */
export function handleCommonErrors(error: any, corsHeaders?: Record<string, string>): ErrorResponse | null {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Database connection errors
  if (error?.message?.includes('database') || error?.message?.includes('connection')) {
    return createErrorResponse(error, 503, isProduction, corsHeaders);
  }
  
  // Authentication errors
  if (error?.message?.includes('authentication') || error?.message?.includes('auth')) {
    return createErrorResponse(error, 401, isProduction, corsHeaders);
  }
  
  // Validation errors
  if (error?.message?.includes('validation') || error?.message?.includes('invalid')) {
    return createErrorResponse(error, 400, isProduction, corsHeaders);
  }
  
  // Rate limiting errors
  if (error?.message?.includes('rate limit') || error?.message?.includes('too many')) {
    return createErrorResponse(error, 429, isProduction, corsHeaders);
  }
  
  return null;
}

/**
 * Safe error handler for Netlify Functions
 */
export function withErrorHandler(
  handler: (event: any) => Promise<any>,
  corsHeaders?: Record<string, string>
) {
  return async (event: any) => {
    try {
      return await handler(event);
    } catch (error: any) {
      console.error('Function error:', error);
      
      // Try to handle common errors
      const commonError = handleCommonErrors(error, corsHeaders);
      if (commonError) {
        return commonError;
      }
      
      // Fallback to generic error
      return createErrorResponse(error, 500, process.env.NODE_ENV === 'production', corsHeaders);
    }
  };
}
