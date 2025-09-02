// src/utils/presetMapping.ts
// Utility for mapping database preset values to proper display names

export interface PresetMapping {
  type: string
  presetKey: string
  displayName: string
  cleanPresetKey: string
}

/**
 * Map database preset values to proper display names
 */
export function mapPresetToDisplay(item: any): PresetMapping {
  const { type, presetKey } = item
  
  // Map database types to display types
  const typeMapping: Record<string, string> = {
    'neo_glitch': 'neo-glitch',
    'ghibli_reaction': 'ghibli-reaction', 
    'emotion_mask': 'emotion-mask',
    'presets': 'presets',
    'custom_prompt': 'custom-prompt',
    'story_time': 'story-time'
  }
  
  // Map mediaType to type if type is not available
  const mediaTypeMapping: Record<string, string> = {
    'neo-glitch': 'neo-glitch',
    'ghiblireact': 'ghibli-reaction',
    'emotionmask': 'emotion-mask', 
    'preset': 'presets',
    'custom': 'custom-prompt',
    'storytime': 'story-time'
  }
  
  // Determine the correct type
  let mappedType = typeMapping[type] || mediaTypeMapping[item.mediaType] || type || 'presets'
  
  // Get the display name for the type
  const typeDisplayNames: Record<string, string> = {
    'neo-glitch': 'Neo Tokyo Glitch',
    'ghibli-reaction': 'Ghibli Reaction',
    'emotion-mask': 'Emotion Mask', 
    'presets': 'Presets',
    'custom-prompt': 'Custom Prompt',
    'story-time': 'Story Time'
  }
  
  const displayName = typeDisplayNames[mappedType] || 'AI Generated'
  
  // Clean up the preset key for display
  let cleanPresetKey = ''
  if (presetKey && presetKey !== 'custom' && presetKey !== 'custom_prompt') {
    cleanPresetKey = presetKey
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/(ghibli|reaction|emotion|mask|neo|glitch|tokyo|preset|professional)/gi, '') // Remove redundant words
      .trim()
  }
  
  return {
    type: mappedType,
    presetKey: presetKey || '',
    displayName,
    cleanPresetKey
  }
}

/**
 * Get the full display text for a preset
 */
export function getPresetDisplayText(item: any, showPresetKey: boolean = true): string {
  const mapping = mapPresetToDisplay(item)
  
  // Don't show preset key for custom prompts
  if (mapping.type === 'custom-prompt') {
    return mapping.displayName
  }
  
  // Show preset key if available and showPresetKey is true
  if (showPresetKey && mapping.cleanPresetKey) {
    return `${mapping.displayName} - ${mapping.cleanPresetKey}`
  }
  
  return mapping.displayName
}

/**
 * Get preset type for filtering
 */
export function getPresetTypeForFilter(item: any): string {
  const mapping = mapPresetToDisplay(item)
  return mapping.type
}
