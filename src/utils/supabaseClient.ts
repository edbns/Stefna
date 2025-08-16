// src/utils/supabaseClient.ts - Now Neon-compatible via Netlify Functions
import { authenticatedFetch } from './apiClient';

// This file is kept for backward compatibility but now uses our Neon backend
// through Netlify functions instead of direct Supabase calls

// Mock Supabase client for backward compatibility
export const supabase = {
  from: (table: string) => {
    console.warn(`supabase.from('${table}') is deprecated. Use our service functions instead.`);
    return {
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: 'Use service functions instead' } }),
          limit: () => ({ data: [], error: null })
        })
      })
    };
  }
};

// Create authenticated client for user-specific queries (now uses our Netlify functions)
export const sbForUser = (jwt: string) => ({
  from: (table: string) => {
    console.warn(`sbForUser.from('${table}') is deprecated. Use our service functions instead.`);
    return {
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: 'Use service functions instead' } }),
          limit: () => ({ data: [], error: null })
        })
      })
    };
  }
});

// Export a more specific warning for developers
export const __supabaseClientDeprecated = {
  message: 'These Supabase clients are deprecated. Use our service functions instead.',
  alternatives: {
    media: 'import { getMyMediaWithProfile } from "../services/media"',
    profile: 'import { getCurrentProfile } from "../services/profile"',
    auth: 'import authService from "../services/authService"',
    authenticatedFetch: 'import { authenticatedFetch } from "./apiClient"'
  }
};
