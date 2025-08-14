// HTTP Helper Functions
// Wrappers around fetch for serverless API calls

import type { UserProfile, UserSettings } from '../types/user';

export async function getMe(): Promise<UserProfile> {
  const r = await fetch('/.netlify/functions/me');
  if (!r.ok) throw new Error('Failed to fetch user profile');
  return r.json();
}

export async function patchUserSettings(patch: Partial<UserSettings>): Promise<void> {
  const r = await fetch('/.netlify/functions/settings', { 
    method: 'PATCH', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(patch) 
  });
  if (!r.ok) throw new Error('Failed to update settings');
  return r.json();
}

export async function postJson(url: string, body: unknown): Promise<any> {
  const r = await fetch(url, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(body) 
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json().catch(() => ({}));
}

// Note: Account management uses existing OTP system
// Email changes, signout, and account deletion should use existing endpoints
