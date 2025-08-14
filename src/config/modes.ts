// Mode configuration for Story Mode, Time Machine, and Restore
// Maps themes/eras/operations to existing preset slugs

export type Mode = 'story' | 'time_machine' | 'restore';

export type StoryTheme =
  | 'auto'
  | 'four_seasons_spring' | 'four_seasons_summer' | 'four_seasons_autumn' | 'four_seasons_winter'
  | 'time_sunrise' | 'time_day' | 'time_sunset' | 'time_night'
  | 'mood_calm' | 'mood_vibrant' | 'mood_dramatic' | 'mood_dreamy'
  | 'style_photorealistic' | 'style_vintage' | 'style_pastels' | 'style_neon';

export type TimeEra =
  | '1920s_noir_glam' | '1960s_kodachrome' | '1980s_vhs_retro'
  | '1990s_disposable' | '2100_cyberpunk';

export type RestoreOp =
  | 'colorize_bw' | 'revive_faded' | 'sharpen_enhance' | 'remove_scratches';

// Map story themes to existing preset slugs
export const STORY_TO_PRESET: Record<StoryTheme, string> = {
  auto: 'auto', // will be resolved to random preset client-side
  four_seasons_spring: 'dreamy_pastels',
  four_seasons_summer: 'sun_kissed',
  four_seasons_autumn: 'moody_forest',
  four_seasons_winter: 'frost_light',

  time_sunrise: 'golden_hour_magic',
  time_day: 'crystal_clear',
  time_sunset: 'cinematic_glow',
  time_night: 'neon_nights',

  mood_calm: 'bright_airy',
  mood_vibrant: 'vivid_pop',
  mood_dramatic: 'urban_grit',
  mood_dreamy: 'dreamy_pastels',

  style_photorealistic: 'crystal_clear',
  style_vintage: 'vintage_film_35mm',
  style_pastels: 'dreamy_pastels',
  style_neon: 'neon_nights',
};

// Map time machine eras to existing preset slugs
export const ERA_TO_PRESET: Record<TimeEra, string> = {
  '1920s_noir_glam': 'noir_classic',
  '1960s_kodachrome': 'vintage_film_35mm',
  '1980s_vhs_retro': 'retro_polaroid',
  '1990s_disposable': 'vintage_film_35mm',
  '2100_cyberpunk': 'neon_nights',
};

// Map restore operations to existing preset slugs
export const RESTORE_TO_PRESET: Record<RestoreOp, string> = {
  colorize_bw: 'crystal_clear',
  revive_faded: 'vivid_pop',
  sharpen_enhance: 'crystal_clear',
  remove_scratches: 'crystal_clear',
};

// UI labels for display
export const STORY_THEME_LABELS: Record<StoryTheme, string> = {
  auto: 'Auto (Surprise Me)',
  four_seasons_spring: 'Spring',
  four_seasons_summer: 'Summer',
  four_seasons_autumn: 'Autumn',
  four_seasons_winter: 'Winter',
  time_sunrise: 'Sunrise',
  time_day: 'Day',
  time_sunset: 'Sunset',
  time_night: 'Night',
  mood_calm: 'Calm',
  mood_vibrant: 'Vibrant',
  mood_dramatic: 'Dramatic',
  mood_dreamy: 'Dreamy',
  style_photorealistic: 'Photorealistic',
  style_vintage: 'Vintage Film',
  style_pastels: 'Pastels',
  style_neon: 'Neon Pop',
};

export const TIME_ERA_LABELS: Record<TimeEra, string> = {
  '1920s_noir_glam': '1920s Noir Glam',
  '1960s_kodachrome': '1960s Kodachrome',
  '1980s_vhs_retro': '1980s VHS Retro',
  '1990s_disposable': '1990s Disposable Camera',
  '2100_cyberpunk': 'Futuristic Cyberpunk (Year 2100)',
};

export const RESTORE_OP_LABELS: Record<RestoreOp, string> = {
  colorize_bw: 'Colorize B/W Photo',
  revive_faded: 'Revive Faded Colors',
  sharpen_enhance: 'Sharpen & Enhance Details',
  remove_scratches: 'Remove Scratches & Artifacts',
};

// Mode labels for display
export const MODE_LABELS: Record<Mode, string> = {
  story: 'Story Mode',
  time_machine: 'Time Machine',
  restore: 'Restore',
};

// Mode descriptions
export const MODE_DESCRIPTIONS: Record<Mode, string> = {
  story: 'Transform one image into a mini narrative with multiple coordinated variations',
  time_machine: 'Pick a specific era and see your image reimagined in that time',
  restore: 'Bring old or damaged photos back to life with AI',
};


