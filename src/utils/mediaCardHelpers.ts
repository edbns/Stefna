// Media Card Helper Functions
// Utilities for displaying media card information without social features

import { MediaRecord } from '../lib/types'
import { PRESETS } from './presets/types'

export function getCardChips(r: MediaRecord | any) {
  // Handle both MediaRecord and UserMedia types
  const meta = r.meta || r.metadata || {};
  
  const modeChip = 'Preset';

  const detailChip = PRESETS[meta.presetId]?.label ?? meta.presetId ?? 'Custom Preset';

  return { modeChip, detailChip };
}

export function formatRemixCount(count?: number): string {
  if (!count || count === 0) return '';
  return `Remixed · ${count}`;
}

// Helper to determine if a media item is a remix
export function isRemix(media: any): boolean {
  return !!(media.parentId || media.originalMediaId);
}

// Helper to get clean option labels for display
export function formatOptionLabel(optionKey: string): string {
  return optionKey
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


