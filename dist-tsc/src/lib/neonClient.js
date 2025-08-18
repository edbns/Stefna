// src/lib/neonClient.ts - Now Neon-compatible via Netlify Functions
// This file provides a mock client interface for backward compatibility
// All actual database operations now go through Netlify functions
// through Netlify functions instead of direct Neon calls
export const neonClient = {
    // Mock Neon client interface for backward compatibility
    auth: {
        getUser: () => {
            console.warn('neonClient.auth.getUser() is deprecated. Use authService.getCurrentUser() instead.');
            return { data: { user: null }, error: null };
        },
        getSession: () => {
            console.warn('neonClient.auth.getSession() is deprecated. Use authService.getToken() instead.');
            return { data: { session: null }, error: null };
        }
    },
    from: (table) => {
        console.warn(`neonClient.from('${table}') is deprecated. Use our service functions instead.`);
        return {
            select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
            insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
            update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
            delete: () => ({ eq: () => ({ data: null, error: null }) })
        };
    }
};
// Legacy export for backward compatibility
export const supabaseClient = neonClient;
export const __neonClientDeprecated = {
    message: 'This Neon client is deprecated. Use our service functions instead.',
    alternatives: {
        auth: 'Use authService.getCurrentUser() and authService.getToken()',
        database: 'Use our service functions like userService, mediaService, etc.'
    }
};
