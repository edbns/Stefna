import React from 'react'
import { getPresetDisplayName, getPresetType } from '../utils/presetLabels'

interface PresetTagProps {
  presetKey: string | null | undefined
  type?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onClick?: (event: React.MouseEvent) => void // Add click handler for filtering
  clickable?: boolean // Make tags clickable for filtering
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
  
  if (!presetKey) {
    // Handle custom prompts
    if (type === 'custom') {
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
          title="Generated with custom prompt"
          onClick={clickable ? (e) => onClick?.(e) : undefined}
        >
          Custom Prompt
        </div>
      )
    }
    return null
  }
  
  const displayName = getPresetDisplayName(presetKey, type)
  const presetType = getPresetType(presetKey, type)
  
  // Format: [Preset] - [Sub-preset] for better UX
  const formatDisplayText = () => {
    if (presetType === 'custom') return 'Custom Prompt'
    
    // Get the main preset name
    const mainPresetNames = {
      'neo-tokyo': 'Neo Tokyo Glitch',
      'ghibli': 'Ghibli Reaction', 
      'emotion': 'Emotion Mask',
      'professional': 'Professional'
    }
    
    const mainPreset = mainPresetNames[presetType as keyof typeof mainPresetNames] || 'Professional'
    
    // If it's a custom prompt or no sub-preset, just show main preset
    if (!presetKey || presetType === 'custom') {
      return mainPreset
    }
    
    // Show format: [Preset] - [Sub-preset]
    return `${mainPreset} - ${displayName}`
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
      title={`Generated with ${displayName} preset`}
      onClick={clickable ? (e) => onClick?.(e) : undefined}
    >
      {formatDisplayText()}
    </div>
  )
}

export default PresetTag
