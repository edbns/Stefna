// src/utils/paperPopRandomization.ts

export interface PaperPopVariation {
  wallpaperColor: string;
  headPose: string;
  expression: string;
  blush: string;
  lip: string;
  liner: string;
  freckles: string;
  hairStyle: string;
  hairDetail: string;
  ripStyle: string;
  lightingStyle: string;
  emoji: string;
  moodLine: string;
}

// Variable options
const WALLPAPER_COLORS = [
  'tangerine orange',
  'lemon yellow',
  'lavender purple',
  'cotton pink',
  'watermelon red',
  'mint green',
  'sky blue'
];

const HEAD_POSES = [
  'tilted sideways',
  'slightly turned',
  'chin lifted',
  'tilted down',
  'facing forward',
  'head turned halfway'
];

const EXPRESSIONS = [
  'tongue out',
  'wide eyes with joy',
  'playful wink',
  'soft smile',
  'eyes half-lidded',
  'mouth open in surprise',
  'pouty lips'
];

const BLUSH_OPTIONS = [
  'dewy orange blush',
  'cotton candy pink blush',
  'violet cream blush',
  'sun-kissed coral blush',
  'glowy peach blush'
];

const LIP_OPTIONS = [
  'peach-tinted lips',
  'clear gloss',
  'mauve gloss',
  'juicy red gloss',
  'watermelon gloss'
];

const LINER_OPTIONS = [
  'neon orange liner',
  'pastel blue liner',
  'soft purple shimmer liner',
  'mint inner-corner liner',
  'yellow winged liner'
];

const FRECKLES_OPTIONS = [
  'freckles across cheeks',
  'heart-shaped freckles',
  'star glitter freckles',
  'subtle sun freckles',
  'none'
];

const HAIR_STYLES = [
  'wild curls',
  'space buns',
  'sleek bob',
  'high pigtails',
  'fluffy afro',
  'short flipped bob',
  'messy bun'
];

const HAIR_DETAILS = [
  'colorful barrettes',
  'candy-colored clips',
  'chrome hair pins',
  'tiny bow clips',
  'star-shaped hairpins',
  'none'
];

const RIP_STYLES = [
  'energetic rips',
  'soft curled folds',
  'sharp diagonal tears',
  'rounded break lines',
  'jagged paper bursts'
];

const LIGHTING_STYLES = [
  'high-key sunlight glow',
  'softbox bounce light',
  'studio flash with glow',
  'pop-art ad lighting'
];

// Emoji and mood combinations
const MOOD_COMBINATIONS = [
  { emoji: '🍊', moodLine: 'fresh citrus energy, playful and bright' },
  { emoji: '🌸', moodLine: 'soft dreamy pop, delicate but bold' },
  { emoji: '💜', moodLine: 'cosmic candy vibes, sweet and electric' },
  { emoji: '🍉', moodLine: 'juicy summer burst, fun and spontaneous' },
  { emoji: '✨', moodLine: 'sparkling youth glow, confident and joyful' },
  { emoji: '🎀', moodLine: 'cute rebellious charm, innocent with edge' },
  { emoji: '🌈', moodLine: 'rainbow optimism, colorful and fearless' }
];

// Rotation state to ensure variety
let paperPopRotationState = {
  usedCombinations: [] as number[],
  lastReset: Date.now()
};

// Get next variation in rotation
function getNextPaperPopInRotation(): number {
  const totalCombinations = WALLPAPER_COLORS.length;
  
  // Reset if all combinations used or after 1 hour
  if (paperPopRotationState.usedCombinations.length >= totalCombinations || 
      Date.now() - paperPopRotationState.lastReset > 3600000) {
    paperPopRotationState.usedCombinations = [];
    paperPopRotationState.lastReset = Date.now();
  }
  
  // Find unused combinations
  let availableIndices = [];
  for (let i = 0; i < totalCombinations; i++) {
    if (!paperPopRotationState.usedCombinations.includes(i)) {
      availableIndices.push(i);
    }
  }
  
  // Pick random from available
  const selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  paperPopRotationState.usedCombinations.push(selectedIndex);
  
  return selectedIndex;
}

// Generate random Paper Pop variation
export function generatePaperPopVariation(): PaperPopVariation {
  const colorIndex = getNextPaperPopInRotation();
  const moodCombo = MOOD_COMBINATIONS[Math.floor(Math.random() * MOOD_COMBINATIONS.length)];
  
  return {
    wallpaperColor: WALLPAPER_COLORS[colorIndex],
    headPose: HEAD_POSES[Math.floor(Math.random() * HEAD_POSES.length)],
    expression: EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)],
    blush: BLUSH_OPTIONS[Math.floor(Math.random() * BLUSH_OPTIONS.length)],
    lip: LIP_OPTIONS[Math.floor(Math.random() * LIP_OPTIONS.length)],
    liner: LINER_OPTIONS[Math.floor(Math.random() * LINER_OPTIONS.length)],
    freckles: FRECKLES_OPTIONS[Math.floor(Math.random() * FRECKLES_OPTIONS.length)],
    hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)],
    hairDetail: HAIR_DETAILS[Math.floor(Math.random() * HAIR_DETAILS.length)],
    ripStyle: RIP_STYLES[Math.floor(Math.random() * RIP_STYLES.length)],
    lightingStyle: LIGHTING_STYLES[Math.floor(Math.random() * LIGHTING_STYLES.length)],
    emoji: moodCombo.emoji,
    moodLine: moodCombo.moodLine
  };
}

// Generate prompt with random variations
export function generatePaperPopPrompt(basePrompt: string): string {
  const variation = generatePaperPopVariation();
  
  let randomizedPrompt = basePrompt
    .replace(/\{\{wallpaper_color\}\}/g, variation.wallpaperColor)
    .replace(/\{\{head_pose\}\}/g, variation.headPose)
    .replace(/\{\{expression\}\}/g, variation.expression)
    .replace(/\{\{blush\}\}/g, variation.blush)
    .replace(/\{\{lip\}\}/g, variation.lip)
    .replace(/\{\{liner\}\}/g, variation.liner)
    .replace(/\{\{freckles\}\}/g, variation.freckles)
    .replace(/\{\{hair_style\}\}/g, variation.hairStyle)
    .replace(/\{\{hair_detail\}\}/g, variation.hairDetail)
    .replace(/\{\{rip_style\}\}/g, variation.ripStyle)
    .replace(/\{\{lighting_style\}\}/g, variation.lightingStyle)
    .replace(/\{\{emoji\}\}/g, variation.emoji)
    .replace(/\{\{mood_line\}\}/g, variation.moodLine);
  
  return randomizedPrompt;
}

