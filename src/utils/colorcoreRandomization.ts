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

/**
 * Generate a randomized colorcore prompt
 * @param basePrompt The base prompt template with placeholders
 * @returns Randomized prompt with color theme and poses
 */
export function generateColorcorePrompt(basePrompt: string): string {
  // Use a more robust random selection with timestamp for better randomization
  const seed = Date.now() + Math.random();
  const themeIndex = Math.floor((seed * 1000) % COLORCORE_THEMES.length);
  const randomTheme = COLORCORE_THEMES[themeIndex];
  
  // Randomly select 4 different poses with better shuffling
  const shuffledPoses = [...COLORCORE_POSES];
  for (let i = shuffledPoses.length - 1; i > 0; i--) {
    const j = Math.floor((seed * (i + 1) * 1000) % (i + 1));
    [shuffledPoses[i], shuffledPoses[j]] = [shuffledPoses[j], shuffledPoses[i]];
  }
  const selectedPoses = shuffledPoses.slice(0, 4);
  
  console.log('🎨 [Colorcore] Selected theme:', randomTheme.color, 'Poses:', selectedPoses.map(p => p.name));
  
  // Replace placeholders in the base prompt
  let randomizedPrompt = basePrompt
    .replace(/{COLOR}/g, randomTheme.color)
    .replace(/{COLOR_DESCRIPTION}/g, randomTheme.description);
  
  // Update pose descriptions
  const poseDescriptions = selectedPoses.map(pose => pose.name).join(', ');
  randomizedPrompt = randomizedPrompt.replace(/{POSES}/g, poseDescriptions);
  
  // Update styling suggestions based on theme
  const femaleStyling = randomTheme.styling.female.join(', ');
  const maleStyling = randomTheme.styling.male.join(', ');
  
  randomizedPrompt = randomizedPrompt
    .replace(/{FEMALE_STYLING}/g, femaleStyling)
    .replace(/{MALE_STYLING}/g, maleStyling);
  
  return randomizedPrompt;
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
