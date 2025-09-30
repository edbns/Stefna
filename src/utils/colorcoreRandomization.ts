// src/utils/colorcoreRandomization.ts

/**
 * Colorcore Randomization Utility
 * Generates randomized color themes and poses for the Colorcore preset
 */

export interface ColorcoreTheme {
  color: string;
  description: string;
  styling: {
    female: string[];
    male: string[];
  };
}

export interface ColorcorePose {
  name: string;
  description: string;
}

// Color themes with styling variations (all punchy and vibrant)
export const COLORCORE_THEMES: ColorcoreTheme[] = [
  {
    color: 'punchy neon yellow',
    description: 'electric, bold, and eye-catching',
    styling: {
      female: ['crop tops with puff sleeves', 'oversized hoodies', 'knit cardigans', 'mini dresses', 'satin camisoles', 'flowy pastel blouses', 'mesh tops', 'off-shoulder tops', 'high-neck tunics with belt', 'matching co-ord sets', 'with heart-shaped sunglasses or colored tinted glasses', 'with cat ears or bunny ears headband', 'with chunky hoop earrings or chokers'],
      male: ['oversized tees', 'bomber jackets', 'sleeveless vests', 'long tunics', 'casual hoodies']
    }
  },
  {
    color: 'bold hot pink',
    description: 'punchy, vibrant, and energetic',
    styling: {
      female: ['crop tops with prints', 'oversized hoodies', 'satin camisoles', 'mini dresses', 'mesh tops with sheer layers', 'off-shoulder tops', 'flowy pastel blouses', 'lingerie-inspired tops', 'matching co-ord sets', 'with heart-shaped sunglasses or Y2K shades', 'with cat ears or oversized bows', 'with chunky hoop earrings or long dangling earrings'],
      male: ['pink button-ups', 'soft hoodies', 'linen shirts', 'casual tees', 'streetwear jackets']
    }
  },
  {
    color: 'vivid purple',
    description: 'bold, striking, and intense',
    styling: {
      female: ['knit cardigans', 'flowy pastel blouses', 'mini dresses', 'long-sleeve modest dresses', 'satin camisoles', 'crop tops', 'high-neck tunics with belt', 'matching co-ord sets', 'with round Harry Potter glasses or frameless glasses', 'with flower crowns or pearl headbands', 'with chokers and beaded bracelets'],
      male: ['purple polos', 'light jackets', 'dress shirts', 'casual sweaters', 'oversized hoodies']
    }
  },
  {
    color: 'electric lime green',
    description: 'punchy, fresh, and vibrant',
    styling: {
      female: ['crop tops', 'oversized hoodies', 'mesh tops', 'mini dresses', 'satin camisoles', 'off-shoulder tops', 'matching co-ord sets', 'flowy pastel blouses', 'with colored tinted glasses', 'with bucket hats or berets', 'with chunky hoop earrings or stackable rings'],
      male: ['lime tees', 'athletic shirts', 'casual polos', 'light jackets', 'oversized hoodies']
    }
  },
  {
    color: 'bright tangerine orange',
    description: 'energetic, bold, and fiery',
    styling: {
      female: ['crop tops with prints', 'oversized hoodies', 'mini dresses', 'satin camisoles', 'mesh tops', 'matching co-ord sets', 'off-shoulder tops', 'with Y2K shades or heart-shaped sunglasses', 'with oversized bows or hair clips', 'with long dangling earrings or chokers'],
      male: ['orange shirts', 'bold tees', 'statement jackets', 'warm sweaters', 'casual hoodies']
    }
  },
  {
    color: 'pure black',
    description: 'sleek, powerful, and bold',
    styling: {
      female: ['crop tops', 'oversized hoodies', 'mesh tops with sheer layers', 'mini dresses', 'satin camisoles', 'off-shoulder tops', 'lingerie-inspired tops', 'matching co-ord sets', 'with frameless glasses or round glasses', 'with chokers and stackable rings', 'with chunky hoop earrings'],
      male: ['black shirts', 'leather jackets', 'dress shirts', 'classic tees', 'oversized hoodies']
    }
  }
];

// Pose variations (photobooth-style, expressive)
export const COLORCORE_POSES: ColorcorePose[] = [
  { name: 'finger heart', description: 'making a heart shape with fingers' },
  { name: 'peace sign under the chin', description: 'peace sign gesture under the chin' },
  { name: 'both hands under face (kawaii)', description: 'both hands cupping face in cute pose' },
  { name: 'tongue out with tilted head', description: 'playful tongue out with head tilted' },
  { name: 'chin resting on back of hand', description: 'chin resting on back of hand' },
  { name: 'framing face with both hands', description: 'both hands framing the face' },
  { name: 'elbow out and winking', description: 'elbow out with a wink' },
  { name: 'side profile smirk', description: 'side profile with smirk' },
  { name: 'one hand raised above head', description: 'one hand raised above head' },
  { name: 'leaning forward like a model', description: 'leaning forward in model pose' },
  { name: 'eyes wide open with hands near cheeks', description: 'eyes wide with hands near cheeks' },
  { name: 'V-sign over one eye', description: 'V-sign gesture over one eye' }
];

// Cute animals that can appear in 1-2 random frames
export const COLORCORE_ANIMALS: string[] = [
  'holding a fluffy puppy',
  'cuddling a small kitten',
  'holding a baby corgi in arms',
  'cuddling a pomeranian',
  'holding a bunny rabbit',
  'with a small kitten on shoulder',
  'holding a tiny piglet',
  'cuddling a golden retriever puppy',
  'holding a small fluffy white kitten',
  'with a baby pig in arms'
];

/**
 * Generate a randomized colorcore prompt
 * @param basePrompt The base prompt template with placeholders
 * @returns Randomized prompt with color theme and poses
 */
export function generateColorcorePrompt(basePrompt: string): string {
  // Use Math.random() directly for unbiased color selection
  const themeIndex = Math.floor(Math.random() * COLORCORE_THEMES.length);
  const randomTheme = COLORCORE_THEMES[themeIndex];
  
  // Randomly select 4 different poses using Fisher-Yates shuffle
  const shuffledPoses = [...COLORCORE_POSES];
  for (let i = shuffledPoses.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPoses[i], shuffledPoses[j]] = [shuffledPoses[j], shuffledPoses[i]];
  }
  const selectedPoses = shuffledPoses.slice(0, 4);
  
  // Randomly decide if we add animals (1 or 2 frames)
  const numAnimalFrames = Math.random() < 0.7 ? (Math.random() < 0.6 ? 1 : 2) : 0; // 70% chance of animals, then 60% for 1, 40% for 2
  const animalFrameIndices: number[] = [];
  const animalDescriptions: string[] = [];
  
  if (numAnimalFrames > 0) {
    // Select which frames get animals
    const frameIndices = [0, 1, 2, 3];
    const shuffledFrames = frameIndices.sort(() => Math.random() - 0.5);
    animalFrameIndices.push(...shuffledFrames.slice(0, numAnimalFrames));
    
    // Select random animals for each frame
    for (let i = 0; i < numAnimalFrames; i++) {
      const randomAnimal = COLORCORE_ANIMALS[Math.floor(Math.random() * COLORCORE_ANIMALS.length)];
      // Add color-matched accessory to the animal
      const colorAccessory = getAnimalAccessory(randomTheme.color);
      animalDescriptions.push(`${randomAnimal} ${colorAccessory}`);
    }
  }
  
  // Build pose descriptions with animals
  const poseDescriptions: string[] = [];
  for (let i = 0; i < 4; i++) {
    const animalIndex = animalFrameIndices.indexOf(i);
    if (animalIndex !== -1) {
      poseDescriptions.push(`${selectedPoses[i].name} while ${animalDescriptions[animalIndex]}`);
    } else {
      poseDescriptions.push(selectedPoses[i].name);
    }
  }
  
  // Randomly select 3-4 styling items for female (not all of them)
  const shuffledFemaleStyling = [...randomTheme.styling.female].sort(() => Math.random() - 0.5);
  const selectedFemaleStyling = shuffledFemaleStyling.slice(0, 3 + Math.floor(Math.random() * 2)); // 3 or 4 items
  
  // Randomly select 2-3 styling items for male (not all of them)
  const shuffledMaleStyling = [...randomTheme.styling.male].sort(() => Math.random() - 0.5);
  const selectedMaleStyling = shuffledMaleStyling.slice(0, 2 + Math.floor(Math.random() * 2)); // 2 or 3 items
  
  console.log('🎨 [Colorcore] Color:', randomTheme.color, '| Animals:', numAnimalFrames, 'frames', animalFrameIndices.length > 0 ? `(${animalFrameIndices.join(', ')})` : '', '| Styling: F', selectedFemaleStyling.length, 'M', selectedMaleStyling.length);
  
  // Replace placeholders in the base prompt
  let randomizedPrompt = basePrompt
    .replace(/{COLOR}/g, randomTheme.color)
    .replace(/{COLOR_DESCRIPTION}/g, randomTheme.description);
  
  // Update pose descriptions
  const posesText = poseDescriptions.join(', ');
  randomizedPrompt = randomizedPrompt.replace(/{POSES}/g, posesText);
  
  // Update styling suggestions based on selected subset
  const femaleStyling = selectedFemaleStyling.join(', ');
  const maleStyling = selectedMaleStyling.join(', ');
  
  randomizedPrompt = randomizedPrompt
    .replace(/{FEMALE_STYLING}/g, femaleStyling)
    .replace(/{MALE_STYLING}/g, maleStyling);
  
  return randomizedPrompt;
}

/**
 * Get color-matched accessory for animals
 */
function getAnimalAccessory(color: string): string {
  const accessories = [
    'with a {color} bow',
    'with a {color} collar',
    'with a {color} ribbon',
    'with a {color} bandana'
  ];
  
  const randomAccessory = accessories[Math.floor(Math.random() * accessories.length)];
  
  // Map color names to simple colors for accessories
  const colorMap: Record<string, string> = {
    'punchy neon yellow': 'yellow',
    'bold hot pink': 'pink',
    'vivid purple': 'purple',
    'electric lime green': 'green',
    'bright tangerine orange': 'orange',
    'pure black': 'white' // White accessory on black background for contrast
  };
  
  return randomAccessory.replace('{color}', colorMap[color] || 'colorful');
}

/**
 * Get a random color theme
 */
export function getRandomColorTheme(): ColorcoreTheme {
  return COLORCORE_THEMES[Math.floor(Math.random() * COLORCORE_THEMES.length)];
}

/**
 * Get random poses (4 different ones)
 */
export function getRandomPoses(): ColorcorePose[] {
  const shuffled = [...COLORCORE_POSES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4);
}
