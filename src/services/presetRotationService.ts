// Smart Preset Rotation Service
// Handles weekly rotation, usage tracking, and smart retention

import { PROFESSIONAL_PRESETS, ProfessionalPresetConfig, ProfessionalPresetKey } from '../config/professional-presets';

export interface PresetUsage {
  presetId: string;
  usageCount: number;
  lastUsed: Date;
  userRating?: number; // Optional user rating system
  category: string;
}

export interface RotationConfig {
  totalPresets: number; // How many presets to show (default: 6)
  retentionCount: number; // How many most-used presets to keep (default: 3)
  rotationDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  rotationTime: string; // Time of day to rotate (default: '00:00')
}

class PresetRotationService {
  private readonly STORAGE_KEY = 'stefna_preset_rotation';
  private readonly USAGE_STORAGE_KEY = 'stefna_preset_usage';
  private readonly DEFAULT_CONFIG: RotationConfig = {
    totalPresets: 6,
    retentionCount: 3,
    rotationDay: 'monday',
    rotationTime: '00:00'
  };

  // Get current rotation configuration
  private getRotationConfig(): RotationConfig {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return { ...this.DEFAULT_CONFIG, ...JSON.parse(stored) };
      } catch {
        return this.DEFAULT_CONFIG;
      }
    }
    return this.DEFAULT_CONFIG;
  }

  // Get current preset usage data
  private getPresetUsage(): Record<string, PresetUsage> {
    const stored = localStorage.getItem(this.USAGE_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {};
  }

  // Save preset usage data
  private savePresetUsage(usage: Record<string, PresetUsage>): void {
    localStorage.setItem(this.USAGE_STORAGE_KEY, JSON.stringify(usage));
  }

  // Check if it's time to rotate presets
  private shouldRotate(): boolean {
    const config = this.getRotationConfig();
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as RotationConfig['rotationDay'];
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    // Check if it's rotation day and time
    if (currentDay === config.rotationDay && currentTime === config.rotationTime) {
      // Check if we already rotated today
      const lastRotation = localStorage.getItem('stefna_last_rotation');
      const today = now.toDateString();
      
      if (lastRotation !== today) {
        localStorage.setItem('stefna_last_rotation', today);
        return true;
      }
    }
    
    return false;
  }

  // Get the current active presets (with smart rotation)
  public getActivePresets(): ProfessionalPresetConfig[] {
    try {
      const config = this.getRotationConfig();
      const usage = this.getPresetUsage();
      
      // Check if we need to rotate
      if (this.shouldRotate()) {
        this.performRotation();
      }
      
      // Get current active presets from storage
      const activePresetIds = this.getStoredActivePresets();
      
      // If no active presets stored, generate new ones
      if (!activePresetIds || activePresetIds.length === 0) {
        console.log('No active presets found, generating initial rotation...');
        return this.generateNewRotation();
      }
      
      // Return the active presets
      const activePresets = activePresetIds
        .map(id => PROFESSIONAL_PRESETS[id as ProfessionalPresetKey])
        .filter(Boolean);
      
      console.log(`Returning ${activePresets.length} active presets`);
      return activePresets;
    } catch (error) {
      console.error('Error getting active presets:', error);
      // Fallback to random selection if there's an error
      console.log('Falling back to random preset selection');
      return this.getRandomPresets(6);
    }
  }

  // Generate a new rotation of presets using structured sets
  private generateNewRotation(): ProfessionalPresetConfig[] {
    try {
      const config = this.getRotationConfig();
      
      // Get the next rotation set based on current week
      const currentSet = this.getCurrentRotationSet();
      const presetIds = this.getPresetIdsForSet(currentSet);
      
      // Get the actual preset objects
      const newRotation = presetIds
        .map(id => PROFESSIONAL_PRESETS[id as ProfessionalPresetKey])
        .filter(Boolean);
      
      // Store the new rotation
      this.storeActivePresets(newRotation.map(p => p.id));
      
      console.log(`Generated new rotation using Set ${currentSet}:`, newRotation.map(p => p.name));
      
      return newRotation;
    } catch (error) {
      console.error('Error generating new rotation:', error);
      // Fallback to random selection if there's an error
      return this.getRandomPresets(6);
    }
  }

  // Perform the rotation
  private performRotation(): void {
    console.log('Performing preset rotation...');
    const newPresets = this.generateNewRotation();
    console.log('New preset rotation:', newPresets.map(p => p.name));
  }

  // Store active preset IDs
  private storeActivePresets(presetIds: string[]): void {
    localStorage.setItem('stefna_active_presets', JSON.stringify(presetIds));
  }

  // Get stored active preset IDs
  private getStoredActivePresets(): string[] {
    const stored = localStorage.getItem('stefna_active_presets');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  }

  // Track preset usage
  public trackPresetUsage(presetId: string): void {
    const usage = this.getPresetUsage();
    const now = new Date();
    
    if (usage[presetId]) {
      usage[presetId].usageCount += 1;
      usage[presetId].lastUsed = now;
    } else {
      const preset = PROFESSIONAL_PRESETS[presetId as ProfessionalPresetKey];
      if (preset) {
        usage[presetId] = {
          presetId,
          usageCount: 1,
          lastUsed: now,
          category: preset.category
        };
      }
    }
    
    this.savePresetUsage(usage);
  }

  // Get preset usage statistics
  public getPresetStats(): {
    totalUsage: number;
    mostUsed: PresetUsage[];
    leastUsed: PresetUsage[];
    categoryStats: Record<string, number>;
  } {
    const usage = this.getPresetUsage();
    const usageArray = Object.values(usage);
    
    const totalUsage = usageArray.reduce((sum, u) => sum + u.usageCount, 0);
    const mostUsed = [...usageArray].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
    const leastUsed = [...usageArray].sort((a, b) => a.usageCount - b.usageCount).slice(0, 5);
    
    const categoryStats: Record<string, number> = {};
    usageArray.forEach(u => {
      categoryStats[u.category] = (categoryStats[u.category] || 0) + u.usageCount;
    });
    
    return {
      totalUsage,
      mostUsed,
      leastUsed,
      categoryStats
    };
  }

  // Shuffle array (Fisher-Yates algorithm)
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Force rotation (for testing or manual control)
  public forceRotation(): void {
    console.log('Forcing preset rotation...');
    this.performRotation();
  }

  // Get current rotation set info (for debugging/monitoring)
  public getCurrentRotationInfo(): {
    currentSet: string;
    setDescription: string;
    presetNames: string[];
    nextRotation: Date;
  } {
    const currentSet = this.getCurrentRotationSet();
    const presetIds = this.getPresetIdsForSet(currentSet);
    const presetNames = presetIds
      .map(id => PROFESSIONAL_PRESETS[id as ProfessionalPresetKey]?.name)
      .filter(Boolean);
    
    const setDescriptions: Record<string, string> = {
      'A': 'Cinematic Everyday',
      'B': 'Travel Vibes', 
      'C': 'Urban Mood',
      'D': 'Natural Elements',
      'E': 'Cultural Moments',
      'F': 'Noir Street'
    };
    
    return {
      currentSet,
      setDescription: setDescriptions[currentSet] || 'Unknown',
      presetNames,
      nextRotation: this.getNextRotationTime()
    };
  }

  // Get next rotation time
  public getNextRotationTime(): Date {
    const config = this.getRotationConfig();
    const now = new Date();
    const currentDay = now.getDay();
    const targetDay = this.getDayNumber(config.rotationDay);
    
    let daysUntilRotation = (targetDay - currentDay + 7) % 7;
    if (daysUntilRotation === 0 && now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) >= config.rotationTime) {
      daysUntilRotation = 7;
    }
    
    const nextRotation = new Date(now);
    nextRotation.setDate(now.getDate() + daysUntilRotation);
    nextRotation.setHours(parseInt(config.rotationTime.split(':')[0]), parseInt(config.rotationTime.split(':')[1]), 0, 0);
    
    return nextRotation;
  }

  // Convert day string to number
  private getDayNumber(day: string): number {
    const days: Record<string, number> = { 
      sunday: 0, 
      monday: 1, 
      tuesday: 2, 
      wednesday: 3, 
      thursday: 4, 
      friday: 5, 
      saturday: 6 
    };
    return days[day.toLowerCase()] || 0;
  }

  // Clear all data (for testing or reset)
  public clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USAGE_STORAGE_KEY);
    localStorage.removeItem('stefna_active_presets');
    localStorage.removeItem('stefna_last_rotation');
    console.log('Cleared all preset rotation data');
  }

  // Get random presets (for rotation fallback)
  private getRandomPresets(count: number): ProfessionalPresetConfig[] {
    const presets = Object.values(PROFESSIONAL_PRESETS);
    const shuffled = this.shuffleArray(presets);
    return shuffled.slice(0, count);
  }

  // Get current rotation set based on week number
  private getCurrentRotationSet(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil(days / 7);
    
    // 6 sets, rotate every week
    const setIndex = (weekNumber - 1) % 6;
    const sets = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    return sets[setIndex];
  }

  // Get preset IDs for a specific rotation set
  private getPresetIdsForSet(setId: string): string[] {
    const rotationSets: Record<string, string[]> = {
      'A': [ // Set A - Cinematic Everyday
        'cinematic_glow',      // Cinematic
        'vivid_pop',           // Vibrant
        'festival_vibes',      // Vibrant
        'bright_airy',         // Minimal
        'vintage_film_35mm',   // Vintage
        'moody_forest'         // Nature
      ],
      'B': [ // Set B - Travel Vibes
        'golden_hour_magic',   // Cinematic
        'tropical_boost',      // Vibrant
        'ocean_breeze',        // Vibrant
        'soft_skin_portrait',  // Portrait
        'retro_polaroid',      // Vintage
        'desert_glow'          // Travel
      ],
      'C': [ // Set C - Urban Mood
        'high_fashion_editorial', // Cinematic
        'festival_vibes',      // Vibrant
        'neon_nights',         // Vibrant
        'mono_drama',          // Minimal/B&W
        'vintage_film_35mm',   // Vintage
        'urban_grit'           // Urban
      ],
      'D': [ // Set D - Natural Elements
        'sun_kissed',          // Cinematic
        'crystal_clear',       // Vibrant
        'dreamy_pastels',      // Soft/Portrait
        'retro_polaroid',      // Vintage
        'wildlife_focus',      // Nature
        'frost_light'          // Travel/Nature
      ],
      'E': [ // Set E - Cultural Moments
        'golden_hour_magic',   // Cinematic
        'vivid_pop',           // Vibrant
        'cultural_glow',       // Vibrant/Travel
        'soft_skin_portrait',  // Portrait
        'desert_glow',         // Vintage/Travel
        'rainy_day_mood'       // Nature/Moody
      ],
      'F': [ // Set F - Noir Street
        'noir_classic',        // Cinematic B&W
        'street_story',        // Vibrant/Urban
        'mono_drama',          // Minimalist
        'urban_grit',          // Vibrant
        'vintage_film_35mm',   // Vintage
        'rainy_day_mood'       // Nature/Street
      ]
    };
    
    return rotationSets[setId] || rotationSets['A'];
  }
}

// Export singleton instance
export const presetRotationService = new PresetRotationService();
export default presetRotationService;
