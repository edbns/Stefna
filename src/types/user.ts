// User Types and Settings
// Defines the user profile and settings structure for the simplified account system

export type UserSettings = {
  autoShareToFeed: boolean;       // default false
  allowRemixByDefault: boolean;   // default true
  remixNotifications: boolean;    // default true
};

export type UserProfile = {
  id: string;
  email: string;
  settings: UserSettings;
};

// Default settings for new users
export const DEFAULT_USER_SETTINGS: UserSettings = {
  autoShareToFeed: false,
  allowRemixByDefault: true,
  remixNotifications: true,
};
