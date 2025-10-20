// src/utils/chromaticSmokeRandomization.ts

/**
 * Chromatic Smoke Randomization Utility
 * Generates randomized smoke colors for the Chromatic Smoke preset
 * Similar to Colorcore but focused on smoke color injection
 */

export interface SmokeColor {
  color: string;
  description: string;
}

// Smoke color variations (8 total colors as specified)
export const SMOKE_COLORS: SmokeColor[] = [
  {
    color: 'dusky pink',
    description: 'soft, romantic, and ethereal'
  },
  {
    color: 'deep red',
    description: 'bold, passionate, and intense'
  },
  {
    color: 'amber-orange',
    description: 'warm, energetic, and fiery'
  },
  {
    color: 'golden yellow',
    description: 'bright, luminous, and radiant'
  },
  {
    color: 'emerald green',
    description: 'rich, mysterious, and vibrant'
  },
  {
    color: 'cobalt blue',
    description: 'deep, cool, and sophisticated'
  },
  {
    color: 'violet',
    description: 'royal, mystical, and enchanting'
  },
  {
    color: 'dark gray',
    description: 'sleek, powerful, and monochromatic'
  }
];

// Color rotation state - tracks which colors have been used recently
let smokeColorRotationState = {
  usedColors: [] as number[],
  lastReset: Date.now()
};

/**
 * Get the next smoke color in rotation, ensuring all colors are used before repeating
 */
function getNextSmokeColorInRotation(): number {
  const now = Date.now();
  
  // Reset rotation state every 5 minutes to allow for fresh starts
  if (now - smokeColorRotationState.lastReset > 5 * 60 * 1000) {
    smokeColorRotationState.usedColors = [];
    smokeColorRotationState.lastReset = now;
  }
  
  // If we've used all colors, reset the used list
  if (smokeColorRotationState.usedColors.length >= SMOKE_COLORS.length) {
    smokeColorRotationState.usedColors = [];
  }
  
  // Get available colors (not used recently)
  const availableColors = [];
  for (let i = 0; i < SMOKE_COLORS.length; i++) {
    if (!smokeColorRotationState.usedColors.includes(i)) {
      availableColors.push(i);
    }
  }
  
  // If no available colors (shouldn't happen), reset and use all
  if (availableColors.length === 0) {
    smokeColorRotationState.usedColors = [];
    availableColors.push(...Array.from({ length: SMOKE_COLORS.length }, (_, i) => i));
  }
  
  // Randomly select from available colors
  const selectedIndex = availableColors[Math.floor(Math.random() * availableColors.length)];
  
  // Mark this color as used
  smokeColorRotationState.usedColors.push(selectedIndex);
  
  return selectedIndex;
}

/**
 * Generate a randomized chromatic smoke prompt
 * @param basePrompt The base prompt template with {SMOKE_COLOR} placeholder
 * @returns Randomized prompt with smoke color injection
 */
export function generateChromaticSmokePrompt(basePrompt: string): string {
  // Use rotation system to ensure all colors are used before repeating
  const colorIndex = getNextSmokeColorInRotation();
  const randomColor = SMOKE_COLORS[colorIndex];
  
  console.log('🌫️ [Chromatic Smoke] Selected color:', randomColor.color, '| Description:', randomColor.description);
  
  // Replace the {SMOKE_COLOR} placeholder with the selected color
  const randomizedPrompt = basePrompt.replace(/{SMOKE_COLOR}/g, randomColor.color);
  
  return randomizedPrompt;
}

/**
 * Get a random smoke color
 */
export function getRandomSmokeColor(): SmokeColor {
  return SMOKE_COLORS[Math.floor(Math.random() * SMOKE_COLORS.length)];
}

/**
 * Get all available smoke colors
 */
export function getAllSmokeColors(): SmokeColor[] {
  return SMOKE_COLORS;
}
