// src/lib/supabaseClient.ts - Now Neon-compatible via Netlify Functions
import { authenticatedFetch } from '../utils/apiClient';

// This file is kept for backward compatibility but now uses our Neon backend
// through Netlify functions instead of direct Supabase calls

export const supabaseClient = {
  // Mock Supabase client interface for backward compatibility
  // All actual operations now go through our Netlify functions
  
  auth: {
    getUser: async () => {
      // This should not be called directly - use authService instead
      console.warn('supabaseClient.auth.getUser() is deprecated. Use authService.getCurrentUser() instead.');
      return { data: { user: null }, error: null };
    },
    
    getSession: async () => {
      // This should not be called directly - use authService instead
      console.warn('supabaseClient.auth.getSession() is deprecated. Use authService.getToken() instead.');
      return { data: { session: null }, error: null };
    }
  },
  
  from: (table: string) => {
    // Mock table interface for backward compatibility
    // This should not be called directly - use our service functions instead
    console.warn(`supabaseClient.from('${table}') is deprecated. Use our service functions instead.`);
    
    return {
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: 'Use service functions instead' } }),
          limit: () => ({ data: [], error: null })
        }),
        update: () => ({
          eq: () => ({
            select: () => ({ data: null, error: { message: 'Use service functions instead' } })
          })
        }),
        insert: () => ({
          select: () => ({ data: null, error: { message: 'Use service functions instead' } })
        }),
        delete: () => ({
          eq: () => ({ error: { message: 'Use service functions instead' } })
        })
      })
    };
  }
};

// Export a more specific warning for developers
export const __supabaseClientDeprecated = {
  message: 'This Supabase client is deprecated. Use our service functions instead.',
  alternatives: {
    media: 'import { getMyMediaWithProfile } from "../services/media"',
    profile: 'import { getCurrentProfile } from "../services/profile"',
    auth: 'import authService from "../services/authService"'
  }
};
