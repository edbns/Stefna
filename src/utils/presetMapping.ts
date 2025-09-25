// src/utils/presetMapping.ts
// Utility for mapping database preset values to proper display names

import { getPresetDisplayName, getPresetType } from './presetLabels'

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
  // Handle both direct properties and metadata properties
  // Use item.presetType first (which comes from backend item.type), then fall back to item.type
  const type = item.presetType || item.type || item.metadata?.presetType || item.mediaType;
  const presetKey = item.presetKey || item.metadata?.presetKey || item.preset;
  
  // Map database types to display types
  const typeMapping: Record<string, string> = {
    'cyber_siren': 'cyber-siren',
    'ghibli_reaction': 'ghibli-reaction', 
    'unreal_reflection': 'unreal-reflection',
    'presets': 'presets',
    'custom_prompt': 'custom-prompt',
    'story_time': 'story-time',
    'story': 'story-time',
    'edit': 'edit',
    'parallel_self': 'parallel-self'
  }
  
  // Map mediaType to type if type is not available
  const mediaTypeMapping: Record<string, string> = {
    'cyber-siren': 'cyber-siren',
    'ghiblireact': 'ghibli-reaction',
    'unrealreflection': 'unreal-reflection', 
    'preset': 'presets',
    'custom': 'custom-prompt',
    'storytime': 'story-time'
  }
  
  // Determine the correct type
  let mappedType = typeMapping[type] || mediaTypeMapping[item.mediaType] || type || 'presets'
  
  // Get the display name for the type
  const typeDisplayNames: Record<string, string> = {
    'cyber-siren': 'Cyber Siren',
    'ghibli-reaction': 'Ghibli Reaction',
    'unreal-reflection': 'Unreal Reflection', 
    'presets': 'Presets',
    'custom-prompt': 'Custom Prompt',
    'story-time': 'Story Time',
    'edit': 'Studio',
    'parallel-self': 'Parallel Self'
  }
  
  const displayName = typeDisplayNames[mappedType] || 'AI Generated'
  
  // Use the existing presetLabels utility for clean preset key
  const cleanPresetKey = getPresetDisplayName(presetKey, mappedType)
  
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
  if (showPresetKey && mapping.cleanPresetKey && mapping.cleanPresetKey !== mapping.displayName) {
    return `${mapping.displayName} - ${mapping.cleanPresetKey}`
  }
  
  return mapping.displayName
}

/**
 * Get preset type for filtering
 */
export function getPresetTypeForFilter(item: any): string {
  // The backend sends the preset type in item.type (e.g., 'cyber_siren', 'presets', 'edit')
  // The frontend stores it in item.presetType for consistency
  // Use item.presetType first (which comes from backend item.type), then fall back to item.type
  const presetType = item.presetType || item.type || 'presets'
  
  // Map the preset type to the filter format
  const typeMapping: Record<string, string> = {
    'cyber_siren': 'cyber-siren',
    'ghibli_reaction': 'ghibli-reaction', 
    'unreal_reflection': 'unreal-reflection',
    'presets': 'presets',
    'custom_prompt': 'custom-prompt',
    'story_time': 'story-time',
    'story': 'story-time',
    'edit': 'edit',
    'parallel_self': 'parallel-self'
  }
  
  const mappedType = typeMapping[presetType] || presetType
  
  return mappedType
}

/**
 * Get display name for filter type
 */
export function getFilterDisplayName(filterType: string): string {
  const filterDisplayNames: Record<string, string> = {
    'cyber-siren': 'Cyber Siren',
    'ghibli-reaction': 'Ghibli Reaction',
    'unreal-reflection': 'Unreal Reflection',
    'presets': 'Presets',
    'custom-prompt': 'Custom Prompt',
    'story-time': 'Story Time',
    'edit': 'Studio',
    'parallel-self': 'Parallel Self'
  }
  
  return filterDisplayNames[filterType] || filterType.charAt(0).toUpperCase() + filterType.slice(1)
}
