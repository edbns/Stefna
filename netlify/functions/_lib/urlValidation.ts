// URL validation utilities for media generation functions
// Ensures only valid URLs are stored in the database

/**
 * Validates if a URL is properly formatted and accessible
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Must be a valid HTTP/HTTPS URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false;
  }
  
  // Must not be empty after protocol
  if (url.length <= 8) { // "https://" is 8 chars
    return false;
  }
  
  // Basic URL structure validation
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.length > 0 && urlObj.pathname.length > 0;
  } catch {
    return false;
  }
}

/**
 * Sanitizes and validates an image URL before database storage
 * Returns null if the URL is invalid
 */
export function sanitizeImageUrl(url: string): string | null {
  if (!isValidImageUrl(url)) {
    console.warn('⚠️ [URL Validation] Invalid image URL detected:', url);
    return null;
  }
  
  // Ensure HTTPS for security
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }
  
  return url;
}

/**
 * Validates and logs URL issues for debugging
 */
export function validateAndLogUrl(url: string, context: string): boolean {
  if (!url) {
    console.error(`❌ [${context}] URL is null/undefined`);
    return false;
  }
  
  if (typeof url !== 'string') {
    console.error(`❌ [${context}] URL is not a string:`, typeof url, url);
    return false;
  }
  
  if (!url.startsWith('http')) {
    console.error(`❌ [${context}] URL does not start with http:`, url);
    return false;
  }
  
  if (url.length < 10) {
    console.error(`❌ [${context}] URL is too short:`, url);
    return false;
  }
  
  try {
    new URL(url);
    console.log(`✅ [${context}] URL validation passed:`, url.substring(0, 60) + '...');
    return true;
  } catch (error) {
    console.error(`❌ [${context}] URL is malformed:`, url, error);
    return false;
  }
}
