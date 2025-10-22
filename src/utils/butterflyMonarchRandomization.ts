// src/utils/butterflyMonarchRandomization.ts

/**
 * Butterfly Monarch Randomization Utility
 * Generates randomized butterfly colors for the Butterfly Monarch preset
 */

export interface ButterflyColor {
  primaryColor: string;
  secondaryColor: string;
  backgroundGradient: string;
  description: string;
}

// Butterfly color variations (7 total color schemes)
export const BUTTERFLY_COLORS: ButterflyColor[] = [
  {
    primaryColor: 'electric blue',
    secondaryColor: 'vivid blue',
    backgroundGradient: 'soft indigo gradient',
    description: 'vibrant, electric, and mesmerizing'
  },
  {
    primaryColor: 'deep violet',
    secondaryColor: 'royal purple',
    backgroundGradient: 'soft lavender gradient',
    description: 'regal, mystical, and elegant'
  },
  {
    primaryColor: 'emerald green',
    secondaryColor: 'jade green',
    backgroundGradient: 'soft forest gradient',
    description: 'natural, vibrant, and fresh'
  },
  {
    primaryColor: 'sunset orange',
    secondaryColor: 'warm amber',
    backgroundGradient: 'soft peach gradient',
    description: 'warm, radiant, and glowing'
  },
  {
    primaryColor: 'rose pink',
    secondaryColor: 'coral pink',
    backgroundGradient: 'soft blush gradient',
    description: 'romantic, soft, and ethereal'
  },
  {
    primaryColor: 'pure white',
    secondaryColor: 'pearl white',
    backgroundGradient: 'soft silver gradient',
    description: 'pristine, angelic, and luminous'
  },
  {
    primaryColor: 'midnight black',
    secondaryColor: 'obsidian black',
    backgroundGradient: 'soft charcoal gradient',
    description: 'dark, powerful, and dramatic'
  }
];

// Color rotation state - tracks which colors have been used recently
let butterflyColorRotationState = {
  usedColors: [] as number[],
  lastReset: Date.now()
};

/**
 * Get the next butterfly color in rotation, ensuring all colors are used before repeating
 */
function getNextButterflyColorInRotation(): number {
  const now = Date.now();
  
  // Reset rotation state every 5 minutes to allow for fresh starts
  if (now - butterflyColorRotationState.lastReset > 5 * 60 * 1000) {
    butterflyColorRotationState.usedColors = [];
    butterflyColorRotationState.lastReset = now;
  }
  
  // If we've used all colors, reset the used list
  if (butterflyColorRotationState.usedColors.length >= BUTTERFLY_COLORS.length) {
    butterflyColorRotationState.usedColors = [];
  }
  
  // Get available colors (not used recently)
  const availableColors = [];
  for (let i = 0; i < BUTTERFLY_COLORS.length; i++) {
    if (!butterflyColorRotationState.usedColors.includes(i)) {
      availableColors.push(i);
    }
  }
  
  // If no available colors (shouldn't happen), reset and use all
  if (availableColors.length === 0) {
    butterflyColorRotationState.usedColors = [];
    availableColors.push(...Array.from({ length: BUTTERFLY_COLORS.length }, (_, i) => i));
  }
  
  // Randomly select from available colors
  const selectedIndex = availableColors[Math.floor(Math.random() * availableColors.length)];
  
  // Mark this color as used
  butterflyColorRotationState.usedColors.push(selectedIndex);
  
  return selectedIndex;
}

/**
 * Generate a randomized butterfly monarch prompt
 * @param basePrompt The base prompt template with color placeholders
 * @returns Randomized prompt with butterfly color injection
 */
export function generateButterflyMonarchPrompt(basePrompt: string): string {
  // Use rotation system to ensure all colors are used before repeating
  const colorIndex = getNextButterflyColorInRotation();
  const randomColor = BUTTERFLY_COLORS[colorIndex];
  
  console.log('🦋 [Butterfly Monarch] Selected color:', randomColor.primaryColor, '| Description:', randomColor.description);
  
  // Replace all color placeholders with the selected colors
  const randomizedPrompt = basePrompt
    .replace(/{PRIMARY_COLOR}/g, randomColor.primaryColor)
    .replace(/{SECONDARY_COLOR}/g, randomColor.secondaryColor)
    .replace(/{BACKGROUND_GRADIENT}/g, randomColor.backgroundGradient);
  
  return randomizedPrompt;
}

/**
 * Get a random butterfly color
 */
export function getRandomButterflyColor(): ButterflyColor {
  return BUTTERFLY_COLORS[Math.floor(Math.random() * BUTTERFLY_COLORS.length)];
}

/**
 * Get all available butterfly colors
 */
export function getAllButterflyColors(): ButterflyColor[] {
  return BUTTERFLY_COLORS;
}

