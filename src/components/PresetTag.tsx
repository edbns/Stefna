import React from 'react'

interface PresetTagProps {
  presetKey: string | null | undefined
  type?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onClick?: (event: React.MouseEvent) => void
  clickable?: boolean
  showPresetKey?: boolean
}

const PresetTag: React.FC<PresetTagProps> = ({ 
  presetKey, 
  type, 
  className = '', 
  size = 'md',
  onClick,
  clickable = false,
  showPresetKey = true
}) => {
  // Debug logging to see what data is being passed
  console.log('🔍 [PresetTag] Rendering with:', { presetKey, type, showPresetKey });
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  
  // Unified glossy black styling for all preset types
  const unifiedStyle = 'bg-glossy-black-800 text-glossy-white-50 border-glossy-black-600 hover:bg-glossy-black-700'
  
  // Get the preset type label
  const getPresetTypeLabel = () => {
    switch (type) {
      case 'neo-glitch':
        return 'Neo Tokyo Glitch'
      case 'ghibli-reaction':
        return 'Ghibli Reaction'
      case 'emotion-mask':
        return 'Emotion Mask'
      case 'presets':
        return 'Presets'
      case 'custom-prompt':
        return 'Custom Prompt'
      case 'story-time':
        return 'Story Time'
      default:
        // Fallback to presetKey if type is not available
        if (presetKey) {
          if (presetKey.startsWith('ghibli_')) return 'Ghibli Reaction'
          if (presetKey.startsWith('emotion_') || presetKey.includes('joy_') || presetKey.includes('strength_') || presetKey.includes('nostalgia_') || presetKey.includes('peace_')) return 'Emotion Mask'
          if (presetKey.startsWith('neo_')) return 'Neo Tokyo Glitch'
          if (presetKey === 'custom' || presetKey === 'custom_prompt') return 'Custom Prompt'
          if (presetKey.startsWith('story_') || presetKey === 'auto' || presetKey === 'adventure' || presetKey === 'romance' || presetKey === 'mystery' || presetKey === 'comedy' || presetKey === 'fantasy' || presetKey === 'travel') return 'Story Time'
          return 'Presets'
        }
        return 'AI Generated'
    }
  }

  // Get the full display text (type + preset key if available)
  const getDisplayText = () => {
    const typeLabel = getPresetTypeLabel()
    
    // Don't show preset key for custom prompts
    if (type === 'custom-prompt' || typeLabel === 'Custom Prompt') {
      return typeLabel
    }
    
    // Show preset key if available and showPresetKey is true
    if (showPresetKey && presetKey && presetKey !== 'custom' && presetKey !== 'custom_prompt') {
      // Clean up the preset key for display
      const cleanKey = presetKey
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/(ghibli|reaction|emotion|mask|neo|glitch|tokyo)/gi, '') // Remove redundant words
        .trim()
      
      if (cleanKey) {
        return `${typeLabel} - ${cleanKey}`
      }
    }
    
    return typeLabel
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
      title={`Generated with ${getPresetTypeLabel()}${presetKey && presetKey !== 'custom' && presetKey !== 'custom_prompt' ? ` - ${presetKey}` : ''}`}
      onClick={clickable ? (e) => onClick?.(e) : undefined}
      style={{ 
        backgroundColor: '#212529', 
        color: '#f8f9fa', 
        borderColor: '#495057',
        zIndex: 1000,
        position: 'relative'
      }}
    >
      🔍 {getDisplayText()}
    </div>
  )
}

export default PresetTag
