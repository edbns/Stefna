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
    const actualType = item?.metadata?.presetType || item?.type || type
    const actualPresetKey = item?.metadata?.presetKey || item?.presetKey || presetKey
    
    // console.log('🔍 [PresetTag] Data:', { // REMOVED - excessive debug logging
    //   actualType, 
    //   actualPresetKey, 
    //   itemType: item?.type,
    //   itemMetadataType: item?.metadata?.presetType,
    //   itemPresetKey: item?.presetKey,
    //   itemMetadataPresetKey: item?.metadata?.presetKey
    // })
    
    // If we have no data, don't show anything
    if (!actualType && !actualPresetKey) {
      // console.log('❌ [PresetTag] No data available, not rendering') // REMOVED - excessive debug logging
      return null
    }
    
    // Map types to display names
    const typeNames: Record<string, string> = {
      'neo_glitch': 'Neo Tokyo Glitch',
      'ghibli_reaction': 'Ghibli Reaction',
      'emotion_mask': 'Emotion Mask',
      'presets': 'Presets',
      'custom_prompt': 'Custom Prompt',
      'story_time': 'Story Time',
      'story': 'Story Time',
      'edit': 'Studio',
      // Media type mappings
      'neo-glitch': 'Neo Tokyo Glitch',
      'ghiblireact': 'Ghibli Reaction',
      'emotionmask': 'Emotion Mask',
      'preset': 'Presets',
      'custom': 'Custom Prompt',
      'storytime': 'Story Time',
      // Additional mappings
      'ghibli-reaction': 'Ghibli Reaction',
      'emotion-mask': 'Emotion Mask',
      'custom-prompt': 'Custom Prompt',
      'story-time': 'Story Time'
    }
    
    // Map preset keys to display names
    const presetNames: Record<string, string> = {
      // Neo Tokyo Glitch
      'neo_tokyo_glitch': 'Neo Tokyo Glitch',
      'cyberpunk_glitch': 'Cyberpunk Glitch',
      'digital_distortion': 'Digital Distortion',
      'matrix_glitch': 'Matrix Glitch',
      'holographic_glitch': 'Holographic Glitch',
      'retro_glitch': 'Retro Glitch',
      
      // Ghibli Reaction
      'ghibli_blush': 'Blush',
      'ghibli_dreamy': 'Dreamy',
      'ghibli_magical': 'Magical',
      'ghibli_shock': 'Shock',
      'ghibli_sparkle': 'Sparkle',
      'ghibli_tears': 'Tears',
      'blush': 'Blush',
      'dreamy': 'Dreamy',
      'magical': 'Magical',
      'shock': 'Shock',
      'sparkle': 'Sparkle',
      'tears': 'Tears',
      
      // Emotion Mask
      'emotion_mask_nostalgia': 'Nostalgia',
      'emotion_mask_distance': 'Distance',
      'emotion_mask_joy': 'Joy',
      'emotion_mask_sadness': 'Sadness',
      'emotion_mask_anger': 'Anger',
      'emotion_mask_fear': 'Fear',
      'emotion_mask_surprise': 'Surprise',
      'emotion_mask_disgust': 'Disgust',
      'emotion_mask_trust': 'Trust',
      'emotion_mask_anticipation': 'Anticipation',
      'emotion_mask_strength_vuln': 'Strength & Vulnerability',
      'nostalgia': 'Nostalgia',
      'distance': 'Distance',
      'joy': 'Joy',
      'sadness': 'Sadness',
      'anger': 'Anger',
      'fear': 'Fear',
      'surprise': 'Surprise',
      'disgust': 'Disgust',
      'trust': 'Trust',
      'anticipation': 'Anticipation',
      'strength_vuln': 'Strength & Vulnerability',
      
      // Presets
      'flux_dev': 'Flux Dev',
      'flux_pro': 'Flux Pro',
      'flux_realism': 'Flux Realism',
      'flux_creative': 'Flux Creative',
      'flux_artistic': 'Flux Artistic',
      'flux_photorealistic': 'Flux Photorealistic',
      'tropical_boost': 'Tropical Boost',
      'vintage_fade': 'Vintage Fade',
      'cinematic_grade': 'Cinematic Grade',
      'monochrome_mood': 'Monochrome Mood',
      'warm_sunset': 'Warm Sunset',
      'cool_blue': 'Cool Blue',
      'dramatic_contrast': 'Dramatic Contrast',
      'soft_pastel': 'Soft Pastel',
      'bold_vibrant': 'Bold Vibrant',
      'muted_elegant': 'Muted Elegant',
      
      // Custom Prompt
      'custom': 'Custom Prompt',
      
      // Story Time
      'story_time': 'Story Time',
      'story': 'Story Time'
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
