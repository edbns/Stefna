// Preferences Card Component
// Displays user preferences with toggle controls

import React, { useState, useEffect } from 'react';
import { getMe, patchUserSettings } from '../../lib/http';
import type { UserSettings } from '../../types/user';

export default function PreferencesCard() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const profile = await getMe();
      setSettings(profile.settings);
      setError(null);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const setFlag = async <K extends keyof UserSettings>(key: K, val: UserSettings[K]) => {
    if (!settings) return;
    
    try {
      // Optimistic update
      setSettings(prev => prev ? { ...prev, [key]: val } : prev);
      
      // Persist to server
      await patchUserSettings({ [key]: val });
    } catch (err) {
      console.error('Failed to update setting:', err);
      // Revert optimistic update
      setSettings(prev => prev ? { ...prev, [key]: !val } : prev);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/20 p-4 bg-neutral-900/40">
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded mb-3 w-24"></div>
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="rounded-2xl border border-red-900/50 p-4 bg-red-950/30">
        <h3 className="text-sm font-medium mb-3 text-red-300">Preferences</h3>
        <p className="text-xs text-red-400">{error || 'Failed to load preferences'}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/20 p-4 bg-neutral-900/40">
      <h3 className="text-sm font-medium mb-3 text-white">Preferences</h3>
      <div className="flex flex-col gap-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-white/80">Auto-share to Feed</span>
          <input 
            type="checkbox" 
            checked={settings.autoShareToFeed}
            onChange={e => setFlag('autoShareToFeed', e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/10 text-white focus:ring-white/20 focus:ring-2"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-white/80">Allow Remix by others</span>
          <input 
            type="checkbox" 
            checked={settings.allowRemixByDefault}
            onChange={e => setFlag('allowRemixByDefault', e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/10 text-white focus:ring-white/20 focus:ring-2"
          />
        </label>
      </div>
      <p className="mt-3 text-xs text-neutral-400">
        Affects new creations. You can change per item.
      </p>
    </div>
  );
}
