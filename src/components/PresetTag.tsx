import React from 'react'
import { mapPresetToDisplay, getPresetDisplayText } from '../utils/presetMapping'

interface PresetTagProps {
  presetKey: string | null | undefined
  type?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onClick?: (event: React.MouseEvent) => void
  clickable?: boolean
  showPresetKey?: boolean
  // Add item prop for better mapping
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
  // Debug logging to see what data is being passed
  console.log('🔍 [PresetTag] Rendering with:', { presetKey, type, showPresetKey, item });
  
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  
  // Unified glossy black styling for all preset types
  const unifiedStyle = 'bg-glossy-black-800 text-glossy-white-50 border-glossy-black-600 hover:bg-glossy-black-700'
  
  // Use the new mapping utility
  const getDisplayText = () => {
    if (item) {
      // Use the item for better mapping
      return getPresetDisplayText(item, showPresetKey)
    } else {
      // Fallback to old logic for backward compatibility
      const mapping = mapPresetToDisplay({ type, presetKey })
      
      if (mapping.type === 'custom-prompt') {
        return mapping.displayName
      }
      
      if (showPresetKey && mapping.cleanPresetKey) {
        return `${mapping.displayName} - ${mapping.cleanPresetKey}`
      }
      
      return mapping.displayName
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
