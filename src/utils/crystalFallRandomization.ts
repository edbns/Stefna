// src/utils/crystalFallRandomization.ts

/**
 * Crystal Fall Randomization Utility
 * Generates randomized crystal colors for the Crystal Fall preset
 * Similar to Chromatic Smoke and Colorcore
 */

export interface CrystalColor {
  color: string;
  description: string;
}

// Crystal color variations (6 total colors as specified)
export const CRYSTAL_COLORS: CrystalColor[] = [
  {
    color: 'clear quartz, icy white, and silver reflections only',
    description: 'crystalline, pure, and luminous'
  },
  {
    color: 'warm amber, golden topaz, and sunset orange tones',
    description: 'warm, radiant, and golden'
  },
  {
    color: 'deep violet and amethyst, shimmering against the black',
    description: 'mystical, regal, and rich'
  },
  {
    color: 'pale rose, blush pink, and champagne hues',
    description: 'soft, romantic, and ethereal'
  },
  {
    color: 'emerald green shards and cool jade accents',
    description: 'vibrant, mysterious, and natural'
  },
  {
    color: 'electric blue and dark navy tones only',
    description: 'cool, powerful, and sophisticated'
  }
];

// Color rotation state - tracks which colors have been used recently
let crystalColorRotationState = {
  usedColors: [] as number[],
  lastReset: Date.now()
};

/**
 * Get the next crystal color in rotation, ensuring all colors are used before repeating
 */
function getNextCrystalColorInRotation(): number {
  const now = Date.now();
  
  // Reset rotation state every 5 minutes to allow for fresh starts
  if (now - crystalColorRotationState.lastReset > 5 * 60 * 1000) {
    crystalColorRotationState.usedColors = [];
    crystalColorRotationState.lastReset = now;
  }
  
  // If we've used all colors, reset the used list
  if (crystalColorRotationState.usedColors.length >= CRYSTAL_COLORS.length) {
    crystalColorRotationState.usedColors = [];
  }
  
  // Get available colors (not used recently)
  const availableColors = [];
  for (let i = 0; i < CRYSTAL_COLORS.length; i++) {
    if (!crystalColorRotationState.usedColors.includes(i)) {
      availableColors.push(i);
    }
  }
  
  // If no available colors (shouldn't happen), reset and use all
  if (availableColors.length === 0) {
    crystalColorRotationState.usedColors = [];
    availableColors.push(...Array.from({ length: CRYSTAL_COLORS.length }, (_, i) => i));
  }
  
  // Randomly select from available colors
  const selectedIndex = availableColors[Math.floor(Math.random() * availableColors.length)];
  
  // Mark this color as used
  crystalColorRotationState.usedColors.push(selectedIndex);
  
  return selectedIndex;
}

/**
 * Generate a randomized crystal fall prompt
 * @param basePrompt The base prompt template with {CRYSTAL_COLOR} placeholder
 * @returns Randomized prompt with crystal color injection
 */
export function generateCrystalFallPrompt(basePrompt: string): string {
  // Use rotation system to ensure all colors are used before repeating
  const colorIndex = getNextCrystalColorInRotation();
  const randomColor = CRYSTAL_COLORS[colorIndex];
  
  console.log('💎 [Crystal Fall] Selected color:', randomColor.color, '| Description:', randomColor.description);
  
  // Replace the {CRYSTAL_COLOR} placeholder with the selected color
  const randomizedPrompt = basePrompt.replace(/{CRYSTAL_COLOR}/g, randomColor.color);
  
  return randomizedPrompt;
}

/**
 * Get a random crystal color
 */
export function getRandomCrystalColor(): CrystalColor {
  return CRYSTAL_COLORS[Math.floor(Math.random() * CRYSTAL_COLORS.length)];
}

/**
 * Get all available crystal colors
 */
export function getAllCrystalColors(): CrystalColor[] {
  return CRYSTAL_COLORS;
}

