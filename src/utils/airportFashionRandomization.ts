// src/utils/airportFashionRandomization.ts

/**
 * Airport Fashion Randomization Utility
 * Generates randomized fashion looks, scenes, and time of day for the Airport Fashion preset
 */

export const AIRPORT_FASHION_LOOKS: string[] = [
  'Monochrome ivory pantsuit with oversized blazer and platform sneakers',
  'Off-shoulder knitted sweater with mini skirt and chunky boots',
  'Slim-fit black turtleneck tucked into wide-leg denim with designer handbag',
  'Crop bomber jacket with high-waisted joggers and a face mask pulled down',
  'Pastel cardigan over ribbed tank top and flared jeans with platform loafers',
  'Graphic Y2K tee tucked into pleated mini skirt with leg warmers',
  'Structured trench coat draped over shoulders with small crossbody bag',
  'All-black airport security chic — long coat, cap, sunglasses',
  'Pink two-piece lounge set with fuzzy slippers and Dior tote',
  'Cropped leather jacket, cargo pants, and white sunglasses'
];

export const AIRPORT_SCENES: string[] = [
  'Airport crosswalk with paparazzi slightly blurred in the distance',
  'Arrival zone outside Incheon terminal, backdrop of buses and signage',
  'Luxury car pulling up at airport curb as she walks past',
  'Mid-crosswalk with dramatic shadow lines and airport logo in the background',
  'Fans behind security barrier snapping photos near baggage area',
  'Empty early-morning crosswalk, minimal background noise',
  'Crosswalk wet from rain, faint airport reflections on the ground',
  'High-angle airport escalator shot with branding in the background',
  'Runway-lit exit gate corridor with airport lounge behind her',
  'Night-lit crosswalk with terminal entrance doors glowing behind her'
];

export const TIME_OF_DAY_OPTIONS: string[] = [
  'Golden hour sunlight casting soft shadows across the crosswalk',
  'Cloudy daylight with natural diffused light and no harsh contrast',
  'Bright midday sun with sharp airport lines and strong reflections',
  'Early morning blue-hour glow with crisp, cool lighting',
  'Late afternoon shadow play with warm tones and depth',
  'Nighttime artificial lighting from terminal signs and cars',
  'Rainy evening with wet pavement reflecting crosswalk lights',
  'Overcast afternoon with cool tones and no shadows'
];

// Rotation state for all three elements
let rotationState = {
  usedFashion: [] as number[],
  usedScenes: [] as number[],
  usedTimeOfDay: [] as number[],
  lastReset: Date.now()
};

/**
 * Get the next item in rotation for a given array, ensuring all items are used before repeating
 */
function getNextInRotation(usedList: number[], totalCount: number): number {
  const now = Date.now();
  
  // Reset rotation state every 5 minutes to allow for fresh starts
  if (now - rotationState.lastReset > 5 * 60 * 1000) {
    rotationState.usedFashion = [];
    rotationState.usedScenes = [];
    rotationState.usedTimeOfDay = [];
    rotationState.lastReset = now;
  }
  
  // If we've used all items, reset the used list
  if (usedList.length >= totalCount) {
    usedList.length = 0;
  }
  
  // Get available items (not used recently)
  const availableItems = [];
  for (let i = 0; i < totalCount; i++) {
    if (!usedList.includes(i)) {
      availableItems.push(i);
    }
  }
  
  // If no available items (shouldn't happen), reset and use all
  if (availableItems.length === 0) {
    usedList.length = 0;
    availableItems.push(...Array.from({ length: totalCount }, (_, i) => i));
  }
  
  // Randomly select from available items
  const selectedIndex = availableItems[Math.floor(Math.random() * availableItems.length)];
  
  // Mark this item as used
  usedList.push(selectedIndex);
  
  return selectedIndex;
}

/**
 * Generate a randomized Airport Fashion prompt
 * @param basePrompt The base prompt template with {FASHION_INJECTION_HERE}, {SCENE_INJECTION_HERE}, and {TIME_OF_DAY_INJECTION_HERE} placeholders
 * @returns Randomized prompt with selected fashion, scene, and time of day
 */
export function generateAirportFashionPrompt(basePrompt: string): string {
  // Use rotation system for all three elements
  const fashionIndex = getNextInRotation(rotationState.usedFashion, AIRPORT_FASHION_LOOKS.length);
  const sceneIndex = getNextInRotation(rotationState.usedScenes, AIRPORT_SCENES.length);
  const timeIndex = getNextInRotation(rotationState.usedTimeOfDay, TIME_OF_DAY_OPTIONS.length);
  
  const selectedFashion = AIRPORT_FASHION_LOOKS[fashionIndex];
  const selectedScene = AIRPORT_SCENES[sceneIndex];
  const selectedTime = TIME_OF_DAY_OPTIONS[timeIndex];
  
  console.log('✈️ [Airport Fashion] Selected:', {
    fashion: selectedFashion.substring(0, 40) + '...',
    scene: selectedScene.substring(0, 40) + '...',
    time: selectedTime.substring(0, 40) + '...'
  });
  
  // Replace all placeholders in the base prompt
  let randomizedPrompt = basePrompt
    .replace(/{FASHION_INJECTION_HERE}/g, selectedFashion)
    .replace(/{SCENE_INJECTION_HERE}/g, selectedScene)
    .replace(/{TIME_OF_DAY_INJECTION_HERE}/g, selectedTime);
  
  return randomizedPrompt;
}

/**
 * Get a random fashion look (for fallback or manual selection)
 */
export function getRandomFashionLook(): string {
  return AIRPORT_FASHION_LOOKS[Math.floor(Math.random() * AIRPORT_FASHION_LOOKS.length)];
}

/**
 * Get a random scene (for fallback or manual selection)
 */
export function getRandomScene(): string {
  return AIRPORT_SCENES[Math.floor(Math.random() * AIRPORT_SCENES.length)];
}

/**
 * Get a random time of day (for fallback or manual selection)
 */
export function getRandomTimeOfDay(): string {
  return TIME_OF_DAY_OPTIONS[Math.floor(Math.random() * TIME_OF_DAY_OPTIONS.length)];
}

