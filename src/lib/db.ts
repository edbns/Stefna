// Database Interface
// Pseudo interface used by functions/components; wire to your real DB
// This provides a clean abstraction layer for user operations

import type { UserProfile, UserSettings } from '../types/user';

export const db = {
  // User operations
  getUserById: async (userId: string): Promise<UserProfile | null> => {
    // TODO: Implement with your actual database
    // This should fetch user profile with settings from Supabase
    throw new Error('getUserById not implemented');
  },

  updateUserEmail: async (userId: string, newEmail: string): Promise<void> => {
    // TODO: Implement with your actual database
    // This should update the user's email in the users table
    throw new Error('updateUserEmail not implemented');
  },

  updateUserSettings: async (userId: string, patch: Partial<UserSettings>): Promise<void> => {
    // TODO: Implement with your actual database
    // This should update user settings in the database
    throw new Error('updateUserSettings not implemented');
  },

  // Session management
  revokeAllSessionsForUser: async (userId: string): Promise<void> => {
    // TODO: Implement session revocation
    // This could involve updating a session version number or clearing session tokens
    throw new Error('revokeAllSessionsForUser not implemented');
  },

  // OTP storage for email changes
  putEmailOtp: async (userId: string, payload: { hash: string; email: string; expiresAt: number }): Promise<void> => {
    // TODO: Implement OTP storage
    // Store hashed OTP with expiration for email change verification
    throw new Error('putEmailOtp not implemented');
  },

  getEmailOtp: async (userId: string): Promise<{ hash: string; email: string; expiresAt: number } | null> => {
    // TODO: Implement OTP retrieval
    // Get stored OTP data for verification
    throw new Error('getEmailOtp not implemented');
  },

  deleteEmailOtp: async (userId: string): Promise<void> => {
    // TODO: Implement OTP cleanup
    // Remove OTP after successful verification or expiration
    throw new Error('deleteEmailOtp not implemented');
  },

  // Account deletion
  deleteUserHard: async (userId: string): Promise<void> => {
    // TODO: Implement complete user deletion
    // This should remove user data, media, and all associated records
    throw new Error('deleteUserHard not implemented');
  },
};

// Note: These are placeholder implementations
// In a real implementation, these would use Supabase client or your database of choice
// Example implementation patterns:
//
// getUserById: async (userId: string) => {
//   const { data, error } = await supabase
//     .from('users')
//     .select('id, email, settings')
//     .eq('id', userId)
//     .single();
//   if (error) throw error;
//   return data;
// },
