// src/utils/venomCeremonyRandomization.ts

/**
 * Venom Ceremony Randomization Utility
 * Generates randomized fashion, symbols, environment, lighting, and pose for the Venom Ceremony preset
 */

export const VENOM_FASHION_LOOKS: string[] = [
  'Sculpted black latex bodice with serpent embossing and sharp shoulder cuts',
  'Glossy black latex dress with corset center and sheer cutout panels',
  'Black latex catsuit with high neck and open chest window',
  'Structured black latex armor top with snake-scale patterns and sheer chiffon skirt',
  'Tight black latex halter with gold spine detailing and high-cut hips',
  'Long-sleeve black latex gown with thigh slit and high collar',
  'Cropped latex top with matching high-waisted latex skirt and gold ring belt',
  'Deep-cut latex wrap dress with gold detailing across the waist',
  'Latex bodice with sheer structured sleeves and black velvet corset lacing',
  'Off-shoulder latex dress with claw-like gold shoulder jewelry'
];

export const VENOM_SYMBOLS: string[] = [
  'Black snake wrapped around neck like a living necklace',
  'Snake curled on wrist or hand, posed as if whispering',
  'Gold ceremonial dagger strapped to her thigh with velvet bands',
  'Thin venom-drop tattoos across collarbone in ritual pattern',
  'Coiled snake bracelet with glowing eyes',
  'Gold rings shaped like serpent heads biting their tails',
  'Tiny black rune symbols glowing faintly on her exposed back',
  'One snake coiled gently around her waist like a belt',
  'Dagger in hand, pointed downward, ceremonial not violent',
  'Black pendant with snake-shaped metal frame resting on chest'
];

export const VENOM_ENVIRONMENTS: string[] = [
  'Candlelit temple chamber with pillars shaped like snakes',
  'Cracked black stone floor with molten gold glowing in seams',
  'Large ceremonial circle drawn in ash around her feet',
  'Golden walls with slow-moving shadow shapes in the distance',
  'Serpent statue throne behind her, partially blurred',
  'Smoldering ritual pit beside her, casting red flicker',
  'Tall narrow hallway lit by rows of floor candles',
  'Onyx staircase descending behind her, shrouded in smoke',
  'Black silk curtains flowing behind her in still air',
  'Large circular mirror on floor reflecting only firelight and shadow'
];

export const VENOM_LIGHTING: string[] = [
  'Scene lit only by flickering candles and fire at ground level',
  'Warm gold firelight casting reflections on latex and smoke',
  'Candle glow from one side, deep shadow on the other',
  'Firepit below illuminating from underneath, face half-lit',
  'Golden ritual flames behind her silhouette, forming halo',
  'Soft side lighting from torches, front in shadow',
  'Reflected firelight from cracked floor tiles lighting her outline',
  'Glowing symbols on the wall casting ambient red hue',
  'Smoke in the scene catching and diffusing candlelight',
  'No overhead light — only natural flicker and glow'
];

export const VENOM_POSES: string[] = [
  'One leg forward, hips turned slightly, hand on hip, confident stare',
  'Arms down, one hand relaxed, the other near shoulder holding the snake',
  'Kneeling on one knee, hand resting on thigh, gaze forward',
  'Standing tall with chin slightly up, arms behind back',
  'One arm raised slowly in ritual pose, palm open',
  'Back arched slightly, dagger at her side, legs apart',
  'One foot forward, shoulder angled toward camera, face in shadow',
  'Holding the dagger with both hands in front of her chest',
  'Arm wrapped gently across torso as if holding in power',
  'Standing still, symmetrical, both hands down — letting the scene speak'
];

// Rotation state for all five elements
let rotationState = {
  usedFashion: [] as number[],
  usedSymbols: [] as number[],
  usedEnvironments: [] as number[],
  usedLighting: [] as number[],
  usedPoses: [] as number[],
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
    rotationState.usedSymbols = [];
    rotationState.usedEnvironments = [];
    rotationState.usedLighting = [];
    rotationState.usedPoses = [];
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
 * Generate a randomized Venom Ceremony prompt
 * @param basePrompt The base prompt template with placeholders for {FASHION_INJECTION_HERE}, {SYMBOL_INJECTION_HERE}, {ENVIRONMENT_INJECTION_HERE}, {LIGHTING_INJECTION_HERE}, and {POSE_INJECTION_HERE}
 * @returns Randomized prompt with selected fashion, symbol, environment, lighting, and pose
 */
export function generateVenomCeremonyPrompt(basePrompt: string): string {
  // Use rotation system for all five elements
  const fashionIndex = getNextInRotation(rotationState.usedFashion, VENOM_FASHION_LOOKS.length);
  const symbolIndex = getNextInRotation(rotationState.usedSymbols, VENOM_SYMBOLS.length);
  const environmentIndex = getNextInRotation(rotationState.usedEnvironments, VENOM_ENVIRONMENTS.length);
  const lightingIndex = getNextInRotation(rotationState.usedLighting, VENOM_LIGHTING.length);
  const poseIndex = getNextInRotation(rotationState.usedPoses, VENOM_POSES.length);
  
  const selectedFashion = VENOM_FASHION_LOOKS[fashionIndex];
  const selectedSymbol = VENOM_SYMBOLS[symbolIndex];
  const selectedEnvironment = VENOM_ENVIRONMENTS[environmentIndex];
  const selectedLighting = VENOM_LIGHTING[lightingIndex];
  const selectedPose = VENOM_POSES[poseIndex];
  
  console.log('🐍 [Venom Ceremony] Selected:', {
    fashion: selectedFashion.substring(0, 40) + '...',
    symbol: selectedSymbol.substring(0, 40) + '...',
    environment: selectedEnvironment.substring(0, 40) + '...',
    lighting: selectedLighting.substring(0, 40) + '...',
    pose: selectedPose.substring(0, 40) + '...'
  });
  
  // Replace all placeholders in the base prompt
  let randomizedPrompt = basePrompt
    .replace(/{FASHION_INJECTION_HERE}/g, selectedFashion)
    .replace(/{SYMBOL_INJECTION_HERE}/g, selectedSymbol)
    .replace(/{ENVIRONMENT_INJECTION_HERE}/g, selectedEnvironment)
    .replace(/{LIGHTING_INJECTION_HERE}/g, selectedLighting)
    .replace(/{POSE_INJECTION_HERE}/g, selectedPose);
  
  return randomizedPrompt;
}

/**
 * Get a random fashion look (for fallback or manual selection)
 */
export function getRandomFashionLook(): string {
  return VENOM_FASHION_LOOKS[Math.floor(Math.random() * VENOM_FASHION_LOOKS.length)];
}

/**
 * Get a random symbol (for fallback or manual selection)
 */
export function getRandomSymbol(): string {
  return VENOM_SYMBOLS[Math.floor(Math.random() * VENOM_SYMBOLS.length)];
}

/**
 * Get a random environment (for fallback or manual selection)
 */
export function getRandomEnvironment(): string {
  return VENOM_ENVIRONMENTS[Math.floor(Math.random() * VENOM_ENVIRONMENTS.length)];
}

/**
 * Get a random lighting (for fallback or manual selection)
 */
export function getRandomLighting(): string {
  return VENOM_LIGHTING[Math.floor(Math.random() * VENOM_LIGHTING.length)];
}

/**
 * Get a random pose (for fallback or manual selection)
 */
export function getRandomPose(): string {
  return VENOM_POSES[Math.floor(Math.random() * VENOM_POSES.length)];
}

