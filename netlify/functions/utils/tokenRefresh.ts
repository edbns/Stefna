// netlify/functions/utils/tokenRefresh.ts
// Shared utility for refreshing expired JWT tokens

export interface TokenRefreshResult {
  success: boolean;
  newToken?: string;
  error?: string;
}

/**
 * Attempts to refresh an expired JWT token
 * @param userToken - The current user token
 * @param baseUrl - Base URL for the application
 * @returns Promise<TokenRefreshResult>
 */
export async function refreshUserToken(
  userToken: string, 
  baseUrl: string = process.env.URL || 'http://localhost:8888'
): Promise<TokenRefreshResult> {
  try {
    console.log('🔄 [TokenRefresh] Attempting to refresh expired token...');
    
    // Try to refresh the token by calling our auth refresh endpoint
    const refreshResponse = await fetch(`${baseUrl}/.netlify/functions/auth-refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      }
    });

    if (refreshResponse.ok) {
      const refreshResult = await refreshResponse.json();
      if (refreshResult.newToken) {
        console.log('✅ [TokenRefresh] Token refreshed successfully');
        return {
          success: true,
          newToken: refreshResult.newToken
        };
      }
    }
    
    // If refresh fails, return failure
    console.warn('⚠️ [TokenRefresh] Token refresh failed, token may be invalid');
    return {
      success: false,
      error: 'Token refresh failed'
    };
  } catch (error: any) {
    console.warn('⚠️ [TokenRefresh] Token refresh error:', error.message);
    return {
      success: false,
      error: error.message || 'Unknown refresh error'
    };
  }
}

/**
 * Gets a fresh token for API calls, falling back to original if refresh fails
 * @param userToken - The current user token
 * @param baseUrl - Base URL for the application
 * @returns Promise<string> - Fresh token or original token
 */
export async function getFreshToken(
  userToken: string,
  baseUrl: string = process.env.URL || 'http://localhost:8888'
): Promise<string> {
  const refreshResult = await refreshUserToken(userToken, baseUrl);
  
  if (refreshResult.success && refreshResult.newToken) {
    return refreshResult.newToken;
  }
  
  // Return original token if refresh fails (will handle error in API calls)
  console.warn('⚠️ [TokenRefresh] Using original token, refresh failed');
  return userToken;
}

/**
 * Validates if a token appears to be expired based on error messages
 * @param errorMessage - Error message from API call
 * @returns boolean - True if token appears expired
 */
export function isTokenExpiredError(errorMessage: string): boolean {
  const expiredKeywords = [
    'token is expired',
    'validation failed',
    'jwt',
    'authorization failed',
    'expired',
    'invalid token',
    'unauthorized'
  ];
  
  return expiredKeywords.some(keyword => 
    errorMessage.toLowerCase().includes(keyword.toLowerCase())
  );
}
