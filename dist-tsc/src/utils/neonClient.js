// src/utils/neonClient.ts - Now Neon-compatible via Netlify Functions
// This file provides a mock client interface for backward compatibility
// All actual database operations now go through Netlify functions
// through Netlify functions instead of direct Neon calls
// Mock Neon client for backward compatibility
export const neon = {
    from: (table) => {
        console.warn(`neon.from('${table}') is deprecated. Use our service functions instead.`);
        return {
            select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
            insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
            update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
            delete: () => ({ eq: () => ({ data: null, error: null }) })
        };
    }
};
// Legacy export for backward compatibility
export const supabase = neon;
export const __neonClientDeprecated = {
    message: 'These Neon clients are deprecated. Use our service functions instead.',
    alternatives: {
        database: 'Use our service functions like userService, mediaService, etc.'
    }
};
