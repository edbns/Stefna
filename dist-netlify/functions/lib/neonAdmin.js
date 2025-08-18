// Mock Neon admin client interface for backward compatibility
export const neonAdmin = {
    from: (table) => {
        console.warn(`neonAdmin.from('${table}') is deprecated. Use Neon sql directly instead.`);
        return {
            select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
            insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
            update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
            delete: () => ({ eq: () => ({ data: null, error: null }) })
        };
    }
};
// Legacy export for backward compatibility
export const supabaseAdmin = neonAdmin;
