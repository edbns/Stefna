// Admin security utilities
// Provides enhanced security for admin functions

import { q } from './_db';

/**
 * Check if an IP address is allowed for admin access
 * @param ip - The IP address to check
 * @returns true if IP is allowed, false otherwise
 */
export function isAllowedAdminIP(ip: string): boolean {
  const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
  
  // If no IPs are configured, allow all (for development)
  if (allowedIPs.length === 0) {
    console.log('⚠️ [Admin Security] No admin IPs configured - allowing all IPs');
    return true;
  }
  
  const isAllowed = allowedIPs.includes(ip);
  if (!isAllowed) {
    console.log('🚫 [Admin Security] Blocked admin access from IP:', ip);
  }
  
  return isAllowed;
}

/**
 * Get client IP from request headers
 * @param event - Netlify function event
 * @returns Client IP address
 */
export function getClientIP(event: any): string {
  return event.headers['x-forwarded-for'] || 
         event.headers['x-real-ip'] || 
         event.headers['x-client-ip'] || 
         'unknown';
}

/**
 * Log admin action for audit trail
 * @param action - The action performed
 * @param adminId - Admin identifier (IP or user ID)
 * @param details - Additional details about the action
 * @param clientIP - Client IP address
 */
export async function logAdminAction(
  action: string, 
  adminId: string, 
  details: any, 
  clientIP: string
): Promise<void> {
  try {
    await q(`
      INSERT INTO admin_audit_log (action, admin_id, details, ip_address, timestamp)
      VALUES ($1, $2, $3, $4, NOW())
    `, [action, adminId, JSON.stringify(details), clientIP]);
    
    console.log('📝 [Admin Audit] Logged action:', { action, adminId, clientIP });
  } catch (error) {
    console.error('❌ [Admin Audit] Failed to log action:', error);
    // Don't throw error - logging failure shouldn't break admin functions
  }
}

/**
 * Verify admin authentication
 * @param event - Netlify function event
 * @returns Admin authentication result
 */
export function verifyAdminAuth(event: any): { 
  isAuthenticated: boolean; 
  adminId: string; 
  clientIP: string;
  error?: string;
} {
  const clientIP = getClientIP(event);
  
  // Check IP whitelist
  if (!isAllowedAdminIP(clientIP)) {
    return {
      isAuthenticated: false,
      adminId: '',
      clientIP,
      error: 'IP address not allowed for admin access'
    };
  }
  
  // Check admin secret
  const adminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'];
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return {
      isAuthenticated: false,
      adminId: clientIP, // Use IP as admin ID for logging
      clientIP,
      error: 'Invalid admin secret'
    };
  }
  
  return {
    isAuthenticated: true,
    adminId: clientIP, // Use IP as admin ID for logging
    clientIP
  };
}

/**
 * Admin security middleware
 * @param handler - The admin function handler
 * @returns Secured admin handler
 */
export function withAdminSecurity(handler: any) {
  return async (event: any) => {
    // Verify admin authentication
    const authResult = verifyAdminAuth(event);
    
    if (!authResult.isAuthenticated) {
      console.log('🚫 [Admin Security] Blocked unauthorized admin access:', {
        ip: authResult.clientIP,
        error: authResult.error
      });
      
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' ? 'https://stefna.xyz' : '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Admin access denied'
        })
      };
    }
    
    // Log admin access
    await logAdminAction('admin_access', authResult.adminId, {
      method: event.httpMethod,
      path: event.path,
      userAgent: event.headers['user-agent']
    }, authResult.clientIP);
    
    // Call the original handler with admin context
    try {
      const result = await handler(event, authResult);
      
      // Log successful admin action
      await logAdminAction('admin_action_success', authResult.adminId, {
        method: event.httpMethod,
        path: event.path
      }, authResult.clientIP);
      
      return result;
    } catch (error) {
      // Log failed admin action
      await logAdminAction('admin_action_error', authResult.adminId, {
        method: event.httpMethod,
        path: event.path,
        error: error instanceof Error ? error.message : String(error)
      }, authResult.clientIP);
      
      throw error;
    }
  };
}

/**
 * Create admin audit log table (run this migration)
 */
export const createAdminAuditLogTable = `
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  admin_id VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_timestamp ON admin_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
`;
