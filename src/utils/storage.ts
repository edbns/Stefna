import { UserQuota, PromptRecipe } from '../types';

const STORAGE_KEYS = {
  USER_QUOTA: 'ai_photo_app_quota',
  FAVORITE_PROMPTS: 'ai_photo_app_favorites',
  PROMPT_FEED: 'ai_photo_app_feed',
  LAST_RESET: 'ai_photo_app_last_reset'
};

export const storage = {
  // Quota management
  getUserQuota(): UserQuota {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_QUOTA);
    const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);
    
    const now = new Date();
    const resetTime = new Date();
    resetTime.setHours(24, 0, 0, 0); // Reset at midnight
    
    // Check if we need to reset daily quota
    if (!lastReset || new Date(lastReset).getDate() !== now.getDate()) {
      const newQuota: UserQuota = {
        dailyLimit: 10,
        used: 0,
        resetTime,
        bonusTokens: 0
      };
      localStorage.setItem(STORAGE_KEYS.USER_QUOTA, JSON.stringify(newQuota));
      localStorage.setItem(STORAGE_KEYS.LAST_RESET, now.toISOString());
      return newQuota;
    }
    
    return stored ? JSON.parse(stored) : {
      dailyLimit: 10,
      used: 0,
      resetTime,
      bonusTokens: 0
    };
  },

  updateUserQuota(quota: UserQuota) {
    localStorage.setItem(STORAGE_KEYS.USER_QUOTA, JSON.stringify(quota));
  },

  // Favorites
  getFavoritePrompts(): string[] {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVORITE_PROMPTS);
    return stored ? JSON.parse(stored) : [];
  },

  addFavoritePrompt(promptId: string) {
    const favorites = this.getFavoritePrompts();
    if (!favorites.includes(promptId)) {
      favorites.push(promptId);
      localStorage.setItem(STORAGE_KEYS.FAVORITE_PROMPTS, JSON.stringify(favorites));
    }
  },

  removeFavoritePrompt(promptId: string) {
    const favorites = this.getFavoritePrompts();
    const updated = favorites.filter(id => id !== promptId);
    localStorage.setItem(STORAGE_KEYS.FAVORITE_PROMPTS, JSON.stringify(updated));
  },

  // Prompt feed (demo data)
  getPromptFeed(): PromptRecipe[] {
    const stored = localStorage.getItem(STORAGE_KEYS.PROMPT_FEED);
    return stored ? JSON.parse(stored) : [];
  },

  savePromptToFeed(prompt: PromptRecipe) {
    const feed = this.getPromptFeed();
    feed.unshift(prompt); // Add to beginning
    localStorage.setItem(STORAGE_KEYS.PROMPT_FEED, JSON.stringify(feed));
  }
};