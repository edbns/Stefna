import React from 'react'
import { getPresetTypeForFilter, getFilterDisplayName } from '../utils/presetMapping'

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
  
  // Simple mapping function using unified system
  const getDisplayText = () => {
    // Get the actual data from the item
    const actualType = item?.presetType || item?.metadata?.presetType || item?.type || type
    const actualPresetKey = item?.metadata?.presetKey || item?.presetKey || presetKey
    
    // If we have no data, don't show anything
    if (!actualType && !actualPresetKey) {
      return null
    }
    
    // Use the unified mapping system to get the filter type
    const filterType = getPresetTypeForFilter(item || { type: actualType, presetKey: actualPresetKey })
    
    // Use the unified display name function
    const displayName = getFilterDisplayName(filterType)
    
    return displayName
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
