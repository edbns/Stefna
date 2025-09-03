// User Settings Service
// Manages user privacy and sharing preferences

export interface UserSettings {
  media_upload_agreed: boolean;
  share_to_feed: boolean;
}

class UserSettingsService {
  private static instance: UserSettingsService;
  private settings: UserSettings | null = null;
  private isLoading = false;

  constructor() {}

  static getInstance(): UserSettingsService {
    if (!UserSettingsService.instance) {
      UserSettingsService.instance = new UserSettingsService();
    }
    return UserSettingsService.instance;
  }

  // Load user settings from database
  async loadSettings(): Promise<UserSettings> {
    if (this.settings && !this.isLoading) {
      return this.settings;
    }

    this.isLoading = true;
    
    try {
      // Always use the unified authenticated client (handles token + app key)
      const { authenticatedFetch } = await import('../utils/apiClient');
      const response = await authenticatedFetch('/.netlify/functions/user-settings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to load settings: ${response.status}`);
      }

      const result = await response.json();
      const newSettings: UserSettings = (result && result.settings && typeof result.settings.share_to_feed === 'boolean')
        ? result.settings as UserSettings
        : { media_upload_agreed: false, share_to_feed: false };
      this.settings = newSettings;
      
      // No localStorage - database is single source of truth
      console.log('✅ [UserSettings] Loaded from database:', newSettings);
      return newSettings;
    } catch (error) {
      console.error('❌ [UserSettings] Failed to load settings:', error);
      
      // No localStorage fallback - database only
      // Default settings if database fails
      this.settings = {
        media_upload_agreed: false,
        share_to_feed: false
      };
      console.warn('⚠️ [UserSettings] Using default settings (database unavailable)');
      return this.settings;
    } finally {
      this.isLoading = false;
    }
  }

  // Update user settings
  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const { authenticatedFetch } = await import('../utils/apiClient');
      const response = await authenticatedFetch('/.netlify/functions/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update settings: ${response.status}`);
      }

      const result = await response.json();
      const newSettings: UserSettings = (result && result.settings && typeof result.settings.share_to_feed === 'boolean')
        ? result.settings as UserSettings
        : { media_upload_agreed: false, share_to_feed: false };
      this.settings = newSettings;
      
      // No localStorage - database is single source of truth
      console.log('✅ [UserSettings] Updated settings in database:', newSettings);
      return newSettings;
    } catch (error) {
      console.error('❌ [UserSettings] Failed to update settings:', error);
      throw error;
    }
  }

  // Get current settings (cached)
  getSettings(): UserSettings | null {
    return this.settings;
  }

  // Clear cache (force reload from database)
  clearCache(): void {
    this.settings = null;
  }
}

export default UserSettingsService;
