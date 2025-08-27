import React from 'react'

interface PresetTagProps {
  presetKey: string | null | undefined
  type?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onClick?: (event: React.MouseEvent) => void
  clickable?: boolean
}

const PresetTag: React.FC<PresetTagProps> = ({ 
  presetKey, 
  type, 
  className = '', 
  size = 'md',
  onClick,
  clickable = false
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  
  // Unified glossy black styling for all preset types
  const unifiedStyle = 'bg-glossy-black-800 text-glossy-white-50 border-glossy-black-600 hover:bg-glossy-black-700'
  
  // Simple, clean tag display based on generation type
  const getDisplayText = () => {
    // Use the type field directly from new dedicated tables
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
      default:
        // Fallback to presetKey if type is not available
        if (presetKey) {
          if (presetKey.startsWith('ghibli_')) return 'Ghibli Reaction'
          if (presetKey.startsWith('emotion_') || presetKey.includes('joy_') || presetKey.includes('strength_') || presetKey.includes('nostalgia_') || presetKey.includes('peace_')) return 'Emotion Mask'
          if (presetKey.startsWith('neo_')) return 'Neo Tokyo Glitch'
          if (presetKey === 'custom' || presetKey === 'custom_prompt') return 'Custom Prompt'
          return 'Presets'
        }
        return 'AI Generated'
    }
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
      title={`Generated with ${getDisplayText()}`}
      onClick={clickable ? (e) => onClick?.(e) : undefined}
    >
      {getDisplayText()}
    </div>
  )
}

export default PresetTag
