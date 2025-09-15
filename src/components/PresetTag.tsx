import React from 'react'

interface PresetTagProps {
  presetKey: string | null | undefined
  type?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onClick?: (event: React.MouseEvent) => void
  clickable?: boolean
  showPresetKey?: boolean
  item?: any
}

const PresetTag: React.FC<PresetTagProps> = ({ 
  presetKey, 
  type, 
  className = '', 
  size = 'md',
  onClick,
  clickable = false,
  showPresetKey = true,
  item
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  
  // Simple black styling
  const unifiedStyle = 'bg-black/80 text-white border-white/20 hover:bg-black/90'
  
  // Simple mapping function
  const getDisplayText = () => {
    // Get the actual data from the item
    const actualType = item?.presetType || item?.metadata?.presetType || item?.type || type
    const actualPresetKey = item?.metadata?.presetKey || item?.presetKey || presetKey
    
    console.log('🔍 [PresetTag] Data:', {
      itemPresetType: item?.presetType,
      itemMetadataPresetType: item?.metadata?.presetType,
      itemType: item?.type,
      actualType,
      actualPresetKey,
      displayText: actualType && typeNames[actualType] ? typeNames[actualType] : 'No mapping found'
    })
    
    // If we have no data, don't show anything
    if (!actualType && !actualPresetKey) {
      // console.log('❌ [PresetTag] No data available, not rendering') // REMOVED - excessive debug logging
      return null
    }
    
    // Map types to display names
    const typeNames: Record<string, string> = {
      'neo_glitch': 'Neo Tokyo Glitch',
      'ghibli_reaction': 'Ghibli Reaction',
      'unreal_reflection': 'Unreal Reflection',
      'presets': 'Presets',
      'custom_prompt': 'Custom Prompt',
      'story_time': 'Story Time',
      'story': 'Story Time',
      'edit': 'Studio',
      // Media type mappings
      'neo-glitch': 'Neo Tokyo Glitch',
      'ghiblireact': 'Ghibli Reaction',
      'unrealreflection': 'Unreal Reflection',
      'preset': 'Presets',
      'custom': 'Custom Prompt',
      'storytime': 'Story Time',
      // Additional mappings
      'ghibli-reaction': 'Ghibli Reaction',
      'unreal-reflection': 'Unreal Reflection',
      'custom-prompt': 'Custom Prompt',
      'story-time': 'Story Time'
    }
    
    // Map preset keys to display names - REMOVED specific mappings to show only type names
    const presetNames: Record<string, string> = {
      // All specific preset mappings removed - only showing type names now
    }
    
    // If we have a preset key, use it
    if (actualPresetKey && presetNames[actualPresetKey]) {
      return presetNames[actualPresetKey]
    }
    
    // If we have a type, use it with smart defaults
    if (actualType && typeNames[actualType]) {
      // For default preset keys, show the type name instead
      if (actualPresetKey === 'default') {
        return typeNames[actualType]
      }
      return typeNames[actualType]
    }
    
    // If we have a preset key but no mapping, show it as is
    if (actualPresetKey) {
      return actualPresetKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    }
    
    // If we have a type but no mapping, show it as is
    if (actualType) {
      return actualType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    }
    
    // If we have nothing, don't show anything
    return null
  }
  
  const displayText = getDisplayText()
  
  // Don't render if no display text
  if (!displayText) {
    return null
  }

  return (
    <div 
      className={`
        ${sizeClasses[size]}
        ${unifiedStyle}
        border rounded-full font-medium
        shadow-sm backdrop-blur-sm
        transition-all duration-200
        hover:scale-105 hover:shadow-md
        ${clickable ? 'cursor-pointer' : ''}
        ${className}
      `}
      title={`Generated with ${displayText}`}
      onClick={clickable ? (e) => onClick?.(e) : undefined}
    >
      {displayText}
    </div>
  )
}

export default PresetTag
