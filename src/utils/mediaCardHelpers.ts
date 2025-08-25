// Media Card Helper Functions
// Utilities for displaying media card information without social features

import { UserMedia } from '../services/userMediaService';
import { PROFESSIONAL_PRESETS, ProfessionalPresetKey } from '../config/professional-presets';

export function getCardChips(r: UserMedia | any) {
  // Handle both MediaRecord and UserMedia types
  const meta = r.meta || r.metadata || {};
  
  // For MoodMorph, show "MoodMorph" as the mode
  if (meta.presetId === 'moodmorph' || (meta.tag && typeof meta.tag === 'string' && meta.tag.startsWith('mood:'))) {
    return { modeChip: 'MoodMorph', detailChip: 'AI Style Transfer' };
  }
  
  // For presets, show the actual preset name
  if (meta.presetId && PROFESSIONAL_PRESETS[meta.presetId as ProfessionalPresetKey]) {
    const preset = PROFESSIONAL_PRESETS[meta.presetId as ProfessionalPresetKey];
    return { modeChip: preset.label, detailChip: preset.category };
  }
  
  // For custom prompts, show "Custom Prompt"
  if (meta.presetId === 'custom' || (!meta.presetId && meta.prompt)) {
    return { modeChip: 'Custom Prompt', detailChip: 'AI Generated' };
  }
  
  // Default fallback
  return { modeChip: 'AI Generated', detailChip: 'Media' };
}



// Helper to get clean option labels for display
export function formatOptionLabel(optionKey: string): string {
  return optionKey
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper to get a single, clean label for media cards
export function getMediaLabel(media: any): string {
  const meta = media.meta || media.metadata || {};
  
  // For MoodMorph, show "MoodMorph"
  if (meta.presetId === 'moodmorph' || (meta.tag && typeof meta.tag === 'string' && meta.tag.startsWith('mood:'))) {
    return 'MoodMorph';
  }
  
  // For presets, show the actual preset name
  if (meta.presetId && PROFESSIONAL_PRESETS[meta.presetId as ProfessionalPresetKey]) {
    return PROFESSIONAL_PRESETS[meta.presetId as ProfessionalPresetKey].label;
  }
  
  // For custom prompts, show "Custom Prompt"
  if (meta.presetId === 'custom' || (!meta.presetId && meta.prompt)) {
    return 'Custom Prompt';
  }
  
  // Default fallback
  return 'AI Generated';
}

export function getPresetLabel(r: UserMedia | any): string {
  const meta = r.meta || r.metadata || {};
  
  // For presets, show the actual preset name
  if (meta.presetId && PROFESSIONAL_PRESETS[meta.presetId as ProfessionalPresetKey]) {
    return PROFESSIONAL_PRESETS[meta.presetId as ProfessionalPresetKey].label;
  }
  
  // For custom prompts, show "Custom Prompt"
  if (meta.presetId === 'custom' || (!meta.presetId && meta.prompt)) {
    return 'Custom Prompt';
  }
  
  // Default fallback
  return 'AI Generated';
}


