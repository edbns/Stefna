import React from 'react'
import { getPresetDisplayName, getPresetType } from '../utils/presetLabels'

interface PresetTagProps {
  presetKey: string | null | undefined
  type?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const PresetTag: React.FC<PresetTagProps> = ({ 
  presetKey, 
  type, 
  className = '', 
  size = 'md' 
}) => {
  if (!presetKey) {
    // Handle custom prompts
    if (type === 'custom') {
      return (
        <div 
          className={`
            ${sizeClasses[size]}
            ${typeStyles.custom}
            border rounded-full font-medium
            shadow-sm backdrop-blur-sm
            transition-all duration-200
            hover:scale-105 hover:shadow-md
            ${className}
          `}
          title="Generated with custom prompt"
        >
          Custom
        </div>
      )
    }
    return null
  }
  
  const displayName = getPresetDisplayName(presetKey, type)
  const presetType = getPresetType(presetKey, type)
  
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  
  // Preset type styling
  const typeStyles = {
    'neo-tokyo': 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white border-purple-400/30',
    'ghibli': 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white border-blue-400/30',
    'emotion': 'bg-gradient-to-r from-orange-600/80 to-red-600/80 text-white border-orange-400/30',
    'professional': 'bg-gradient-to-r from-gray-600/80 to-slate-600/80 text-white border-gray-400/30',
    'custom': 'bg-gradient-to-r from-green-600/80 to-emerald-600/80 text-white border-green-400/30'
  }
  
  return (
    <div 
      className={`
        ${sizeClasses[size]}
        ${typeStyles[presetType as keyof typeof typeStyles] || typeStyles.custom}
        border rounded-full font-medium
        shadow-sm backdrop-blur-sm
        transition-all duration-200
        hover:scale-105 hover:shadow-md
        ${className}
      `}
      title={`Generated with ${displayName} preset`}
    >
      {displayName}
    </div>
  )
}

export default PresetTag
