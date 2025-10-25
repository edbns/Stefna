// src/utils/paperPopRandomization.ts

// Structured theme-based randomization for Paper Pop preset
// Each theme is a cohesive bundle to prevent mismatched aesthetics

export interface PaperPopTheme {
  id: string;
  colorName: string;
  headPose: string;
  expression: string;
  makeup: {
    blush: string;
    lip: string;
    liner: string;
    extra: string;
  };
  hair: {
    style: string;
    color: string;
    detail: string;
  };
  ripStyle: string;
  lighting: string;
  moodLine: string;
}

// Theme profiles - each is a complete, cohesive aesthetic bundle
const PAPER_POP_THEMES: PaperPopTheme[] = [
  {
    id: 'tangerine_pop',
    colorName: 'tangerine orange',
    headPose: 'tilted sideways',
    expression: 'tongue out, eyes wide with joy',
    makeup: {
      blush: 'dewy orange blush',
      lip: 'peach-tinted gloss',
      liner: 'soft neon orange liner',
      extra: 'freckles across cheeks'
    },
    hair: {
      style: 'wild curls',
      color: 'warm chestnut',
      detail: 'colorful barrettes'
    },
    ripStyle: 'energetic rips and playful fold-outs',
    lighting: 'high-key sunlight glow',
    moodLine: 'She\'s not breaking the rules — she is the rule.'
  },
  {
    id: 'lavender_glow',
    colorName: 'lavender purple',
    headPose: 'chin lifted slightly',
    expression: 'soft wink and half smile',
    makeup: {
      blush: 'violet cream blush',
      lip: 'mauve gloss',
      liner: 'soft lilac shimmer liner',
      extra: 'tiny silver freckles'
    },
    hair: {
      style: 'space buns',
      color: 'ash brown',
      detail: 'star clips'
    },
    ripStyle: 'soft curled folds',
    lighting: 'diffused lavender studio light',
    moodLine: 'She glows in her own gravity.'
  },
  {
    id: 'lemon_zing',
    colorName: 'lemon yellow',
    headPose: 'slightly turned',
    expression: 'cheeky grin with raised brow',
    makeup: {
      blush: 'sunbeam yellow blush',
      lip: 'clear gloss',
      liner: 'pastel yellow liner',
      extra: 'sun freckles'
    },
    hair: {
      style: 'sleek bob',
      color: 'honey blonde',
      detail: 'tiny bow clips'
    },
    ripStyle: 'rounded tear lines',
    lighting: 'warm studio flash',
    moodLine: 'She\'s citrus-coded chaos.'
  },
  {
    id: 'cotton_pink',
    colorName: 'cotton candy pink',
    headPose: 'facing forward',
    expression: 'pouty lips and glossy stare',
    makeup: {
      blush: 'baby pink gloss blush',
      lip: 'bubblegum gloss',
      liner: 'pearl white liner',
      extra: 'none'
    },
    hair: {
      style: 'high pigtails',
      color: 'soft blonde',
      detail: 'pearl clips'
    },
    ripStyle: 'curled torn edges',
    lighting: 'milky light bloom',
    moodLine: 'Too sweet to block, too sharp to ignore.'
  },
  {
    id: 'mint_rush',
    colorName: 'mint green',
    headPose: 'head tilted back',
    expression: 'eyes closed mid-laugh',
    makeup: {
      blush: 'pale peach tint',
      lip: 'mint-sheen gloss',
      liner: 'soft green liner',
      extra: 'tiny sparkle freckles'
    },
    hair: {
      style: 'messy bun',
      color: 'dark brown',
      detail: 'chrome pins'
    },
    ripStyle: 'clean folded tears',
    lighting: 'cool daylight flash',
    moodLine: 'She\'s freshness with attitude.'
  },
  {
    id: 'cherry_burn',
    colorName: 'cherry red',
    headPose: 'chin slightly down, tilted toward camera',
    expression: 'tongue out, lips parted with confident stare',
    makeup: {
      blush: 'deep crimson blush high on cheeks',
      lip: 'matte red lipstick',
      liner: 'sharp winged liner in dark red',
      extra: 'freckles in the shape of tiny hearts'
    },
    hair: {
      style: 'messy layered bob',
      color: 'jet black',
      detail: 'metallic red bobby pins'
    },
    ripStyle: 'angular tear lines, sharp points',
    lighting: 'hot beauty flash with red bounce',
    moodLine: 'She doesn\'t just enter — she ruptures the frame.'
  },
  {
    id: 'milk_cloud',
    colorName: 'matte white',
    headPose: 'head tilted up, eyes half-lidded',
    expression: 'closed mouth smile, soft glow stare',
    makeup: {
      blush: 'cloudy peach blush',
      lip: 'clear gloss with white shimmer',
      liner: 'white pastel liner',
      extra: 'glossy freckles with holographic sparkles'
    },
    hair: {
      style: 'soft halo bun',
      color: 'platinum blonde',
      detail: 'tiny pearl barrettes'
    },
    ripStyle: 'soft folds like flower petals',
    lighting: 'milky softbox with high exposure glow',
    moodLine: 'She came wrapped in light — now you can\'t look away.'
  },
  {
    id: 'gloss_blackout',
    colorName: 'mirror black',
    headPose: 'facing forward, low chin, intense gaze',
    expression: 'pout with tongue barely showing, deadpan eyes',
    makeup: {
      blush: 'smoky gray contour',
      lip: 'black gloss lips',
      liner: 'shiny jet black cat eye',
      extra: 'freckles in matte black dots'
    },
    hair: {
      style: 'wet-look long layers',
      color: 'blue-black',
      detail: 'tiny silver rings in strands'
    },
    ripStyle: 'ripped like vinyl with shiny folds',
    lighting: 'spotlight from above with black reflections',
    moodLine: 'She\'s the blackout filter no one can block.'
  }
];

// Rotation state to ensure variety across themes
let paperPopRotationState = {
  usedThemes: [] as number[],
  lastReset: Date.now()
};

// Get next theme in rotation
function getNextThemeInRotation(): number {
  const totalThemes = PAPER_POP_THEMES.length;
  
  // Reset if all themes used or after 1 hour
  if (paperPopRotationState.usedThemes.length >= totalThemes || 
      Date.now() - paperPopRotationState.lastReset > 3600000) {
    paperPopRotationState.usedThemes = [];
    paperPopRotationState.lastReset = Date.now();
  }
  
  // Find unused themes
  let availableIndices = [];
  for (let i = 0; i < totalThemes; i++) {
    if (!paperPopRotationState.usedThemes.includes(i)) {
      availableIndices.push(i);
    }
  }
  
  // Pick random from available
  const selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  paperPopRotationState.usedThemes.push(selectedIndex);
  
  return selectedIndex;
}

// Optional: Micro-variations within a theme (can add more variation if needed)
function applyMicroVariations(theme: PaperPopTheme): PaperPopTheme {
  // Currently returns theme as-is, but could add small variations like:
  // - slight expression tweaks
  // - alternative rip styles within the same aesthetic
  return { ...theme };
}

// Generate prompt with selected theme
export function generatePaperPopPrompt(basePrompt: string): string {
  const themeIndex = getNextThemeInRotation();
  const selectedTheme = applyMicroVariations(PAPER_POP_THEMES[themeIndex]);
  
  // Replace all template variables with theme values
  let randomizedPrompt = basePrompt
    .replace(/\{\{theme\.color_name\}\}/g, selectedTheme.colorName)
    .replace(/\{\{theme\.head_pose\}\}/g, selectedTheme.headPose)
    .replace(/\{\{theme\.expression\}\}/g, selectedTheme.expression)
    .replace(/\{\{theme\.makeup\.blush\}\}/g, selectedTheme.makeup.blush)
    .replace(/\{\{theme\.makeup\.lip\}\}/g, selectedTheme.makeup.lip)
    .replace(/\{\{theme\.makeup\.liner\}\}/g, selectedTheme.makeup.liner)
    .replace(/\{\{theme\.makeup\.extra\}\}/g, selectedTheme.makeup.extra)
    .replace(/\{\{theme\.hair\.style\}\}/g, selectedTheme.hair.style)
    .replace(/\{\{theme\.hair\.color\}\}/g, selectedTheme.hair.color)
    .replace(/\{\{theme\.hair\.detail\}\}/g, selectedTheme.hair.detail)
    .replace(/\{\{theme\.rip_style\}\}/g, selectedTheme.ripStyle)
    .replace(/\{\{theme\.lighting\}\}/g, selectedTheme.lighting)
    .replace(/\{\{theme\.mood_line\}\}/g, selectedTheme.moodLine);
  
  return randomizedPrompt;
}

