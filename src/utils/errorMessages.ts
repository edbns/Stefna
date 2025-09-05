// Error message mapping utility
// Maps technical errors to user-friendly messages

export interface ErrorMessage {
  title: string;
  message: string;
}

/**
 * Maps technical error messages to user-friendly error messages
 * @param error - The error object or error message string
 * @returns User-friendly error title and message
 */
export function mapErrorToUserMessage(error: Error | string): ErrorMessage {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Insufficient credits
  if (errorMessage.includes('INSUFFICIENT_CREDITS') || 
      errorMessage.includes('Insufficient credits') || 
      errorMessage.includes('credits but only have')) {
    return {
      title: 'No Credits',
      message: 'Wait for daily reset or upgrade your plan.'
    };
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout') || 
      errorMessage.includes('ERR_TIMED_OUT') ||
      errorMessage.includes('timed out')) {
    return {
      title: 'Request Timed Out',
      message: 'Try again with a smaller image.'
    };
  }
  
  // Connection issues
  if (errorMessage.includes('Unexpected response format') || 
      errorMessage.includes('Request blocked by client') ||
      errorMessage.includes('blocked by client')) {
    return {
      title: 'Connection Issue',
      message: 'Check your internet and try again.'
    };
  }
  
  // Network errors
  if (errorMessage.includes('Failed to fetch') || 
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('Network error')) {
    return {
      title: 'Network Error',
      message: 'Check your internet connection.'
    };
  }
  
  // Validation errors
  if (errorMessage.includes('Invalid') || 
      errorMessage.includes('Missing') ||
      errorMessage.includes('Required field')) {
    return {
      title: 'Invalid Input',
      message: 'Check your input and try again.'
    };
  }
  
  // Server errors
  if (errorMessage.includes('Server error') || 
      errorMessage.includes('500') ||
      errorMessage.includes('Internal server error')) {
    return {
      title: 'Server Error',
      message: 'Try again in a few minutes.'
    };
  }
  
  // Authentication errors
  if (errorMessage.includes('Unauthorized') || 
      errorMessage.includes('401') ||
      errorMessage.includes('Authentication')) {
    return {
      title: 'Authentication Error',
      message: 'Please sign in again.'
    };
  }
  
  // File upload errors
  if (errorMessage.includes('File too large') || 
      errorMessage.includes('Upload failed') ||
      errorMessage.includes('Invalid file type')) {
    return {
      title: 'Upload Error',
      message: 'Try a different image.'
    };
  }
  
  // Generation-specific errors
  if (errorMessage.includes('Generation failed') || 
      errorMessage.includes('Model error') ||
      errorMessage.includes('AI service')) {
    return {
      title: 'Generation Failed',
      message: 'Try again with different settings.'
    };
  }
  
  // Default fallback
  return {
    title: 'Something went wrong',
    message: 'Please try again.'
  };
}

/**
 * Helper function to get just the title from an error
 */
export function getErrorTitle(error: Error | string): string {
  return mapErrorToUserMessage(error).title;
}

/**
 * Helper function to get just the message from an error
 */
export function getErrorMessage(error: Error | string): string {
  return mapErrorToUserMessage(error).message;
}
