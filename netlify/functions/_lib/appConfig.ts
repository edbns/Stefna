// App Configuration Utility
// Reads configuration values from the app_config table

import { qOne } from '../_db';

export interface AppConfig {
  daily_cap: number;               // Daily credit limit (default: 30)
  referral_referrer_bonus: number; // Referrer bonus (default: 50)
  referral_new_bonus: number;      // New user bonus (default: 25)
}

// Cache for app config to avoid repeated database calls
let appConfigCache: AppConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get app configuration from database
 * Uses caching to improve performance
 */
export async function getAppConfig(): Promise<AppConfig> {
  const now = Date.now();
  
  // Return cached config if still valid
  if (appConfigCache && (now - cacheTimestamp) < CACHE_TTL) {
    return appConfigCache;
  }
  
  try {
    console.log('🔧 [AppConfig] Loading configuration from database...');
    
    // Get all config values
    const [dailyCap, referrerBonus, newUserBonus] = await Promise.all([
      qOne(`SELECT value FROM app_config WHERE key = 'daily_cap'`),
      qOne(`SELECT value FROM app_config WHERE key = 'referral_referrer_bonus'`),
      qOne(`SELECT value FROM app_config WHERE key = 'referral_new_bonus'`)
    ]);
    
    // Parse values with fallbacks
    const config: AppConfig = {
      daily_cap: parseInt(dailyCap?.value || '30'),
      referral_referrer_bonus: parseInt(referrerBonus?.value || '50'),
      referral_new_bonus: parseInt(newUserBonus?.value || '25')
    };
    
    // Cache the config
    appConfigCache = config;
    cacheTimestamp = now;
    
    console.log('✅ [AppConfig] Configuration loaded:', config);
    return config;
    
  } catch (error) {
    console.error('❌ [AppConfig] Failed to load configuration:', error);
    
    // Return default config on error
    const defaultConfig: AppConfig = {
      daily_cap: 30,
      referral_referrer_bonus: 50,
      referral_new_bonus: 25
    };
    
    return defaultConfig;
  }
}

/**
 * Get daily credit limit from app config
 */
export async function getDailyCreditLimit(): Promise<number> {
  const config = await getAppConfig();
  return config.daily_cap;
}

/**
 * Get referral bonus amounts from app config
 */
export async function getReferralBonuses(): Promise<{ referrer: number; newUser: number }> {
  const config = await getAppConfig();
  return {
    referrer: config.referral_referrer_bonus,
    newUser: config.referral_new_bonus
  };
}

/**
 * Clear config cache (useful for testing or when config changes)
 */
export function clearAppConfigCache(): void {
  appConfigCache = null;
  cacheTimestamp = 0;
  console.log('🗑️ [AppConfig] Cache cleared');
}
