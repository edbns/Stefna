// Input sanitization utilities for user-generated content
// Prevents XSS and other injection attacks

/**
 * Basic HTML sanitization (removes script tags and dangerous attributes)
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocols
    .replace(/javascript:/gi, '')
    // Remove on* event handlers
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove dangerous attributes
    .replace(/\s(style|onload|onerror|onclick|onmouseover)\s*=\s*["'][^"']*["']/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '')
    // Remove object tags
    .replace(/<object\b[^>]*>.*?<\/object>/gi, '')
    // Remove embed tags
    .replace(/<embed\b[^>]*>/gi, '')
    // Remove link tags with javascript
    .replace(/<link[^>]*href\s*=\s*["']javascript:[^"']*["'][^>]*>/gi, '')
    // Remove meta tags with javascript
    .replace(/<meta[^>]*content\s*=\s*["'][^"']*javascript:[^"']*["'][^>]*>/gi, '');
}

/**
 * Sanitize user prompts for AI generation
 * @param prompt - The prompt to sanitize
 * @returns Sanitized prompt
 */
export function sanitizePrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') {
    return '';
  }

  return prompt
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
    // Limit length (prevent extremely long prompts)
    .substring(0, 1000);
}

/**
 * Sanitize email addresses
 * @param email - The email to sanitize
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Sanitize and validate
  const sanitized = email.toLowerCase().trim();
  
  if (!emailRegex.test(sanitized)) {
    return null;
  }

  // Check for suspicious patterns
  if (sanitized.includes('javascript:') || 
      sanitized.includes('<script') || 
      sanitized.includes('data:')) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitize file names
 * @param filename - The filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'untitled';
  }

  return filename
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    .replace(/\/+/g, '')
    .replace(/\\+/g, '')
    // Remove dangerous characters
    .replace(/[<>:"|?*]/g, '')
    // Remove control characters
    .replace(/[\x00-\x1f\x7f]/g, '')
    // Limit length
    .substring(0, 255)
    // Ensure it's not empty
    .trim() || 'untitled';
}

/**
 * Sanitize JSON input
 * @param input - The input to sanitize
 * @returns Sanitized object
 */
export function sanitizeJSON(input: any): any {
  if (typeof input === 'string') {
    return sanitizeHTML(input);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = Array.isArray(input) ? [] : {};
    
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        const sanitizedKey = sanitizeHTML(key);
        sanitized[sanitizedKey] = sanitizeJSON(input[key]);
      }
    }
    
    return sanitized;
  }
  
  return input;
}

/**
 * Validate and sanitize user input for database storage
 * @param input - The input to validate and sanitize
 * @param type - The type of input (prompt, email, filename, etc.)
 * @returns Sanitized input or null if invalid
 */
export function validateAndSanitize(input: any, type: 'prompt' | 'email' | 'filename' | 'html' | 'json'): string | null {
  if (!input) {
    return null;
  }

  switch (type) {
    case 'prompt':
      return sanitizePrompt(String(input));
    case 'email':
      return sanitizeEmail(String(input));
    case 'filename':
      return sanitizeFilename(String(input));
    case 'html':
      return sanitizeHTML(String(input));
    case 'json':
      return JSON.stringify(sanitizeJSON(input));
    default:
      return String(input);
  }
}

/**
 * Check for suspicious patterns in user input
 * @param input - The input to check
 * @returns true if suspicious patterns found, false otherwise
 */
export function detectSuspiciousPatterns(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i,
    /eval\(/i,
    /expression\(/i,
    /url\(/i,
    /@import/i,
    /\.\.\//g, // Path traversal
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}
