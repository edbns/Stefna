// Utility function to map preset keys to user-friendly display names
export const getPresetDisplayName = (presetKey: string | null | undefined, type?: string): string => {
  if (!presetKey) return 'Custom Prompt'
  
  // Cyber Siren presets
  if (type === 'cyber-siren' || presetKey.startsWith('cyber_') || presetKey.includes('cyber')) {
    const cyberSirenPresets: Record<string, string> = {
      'visor': 'Visor',
      'base': 'Base',
      'tattoos': 'Tattoos', 
      'scanlines': 'Scanlines',
      'cyber_siren_visor': 'Visor',
      'cyber_siren_base': 'Base',
      'cyber_siren_tattoos': 'Tattoos',
      'cyber_siren_scanlines': 'Scanlines',
      'neo_tokyo_visor': 'Visor',
      'neo_tokyo_base': 'Base',
      'neo_tokyo_tattoos': 'Tattoos',
      'neo_tokyo_scanlines': 'Scanlines'
    }
    return cyberSirenPresets[presetKey] || 'Cyber Siren'
  }
  
  // Custom Prompt presets
  if (type === 'custom-prompt' || presetKey.startsWith('user_') || presetKey.includes('custom')) {
    const customPresets: Record<string, string> = {
      'user_custom': 'Custom Prompt',
      'custom': 'Custom Prompt',
      'custom_prompt': 'Custom Prompt'
    }
    return customPresets[presetKey] || 'Custom Prompt'
  }
  
  // Ghibli Reaction presets
  if (presetKey.startsWith('ghibli_') || presetKey.includes('ghibli')) {
    const ghibliPresets: Record<string, string> = {
      'ghibli_tears': 'Tears',
      'ghibli_shock': 'Shock',
      'ghibli_sparkle': 'Sparkle',
      'ghibli_blush': 'Blush',
      'ghibli_dreamy': 'Dreamy',
      'ghibli_magical': 'Magical',
      'tears': 'Tears',
      'shock': 'Shock',
      'sparkle': 'Sparkle',
      'blush': 'Blush',
      'dreamy': 'Dreamy',
      'magical': 'Magical'
    }
    return ghibliPresets[presetKey] || 'Ghibli'
  }
  
  // Emotion Mask presets
  if (presetKey.startsWith('emotion_') || presetKey.includes('emotion') || presetKey.includes('joy_') || presetKey.includes('strength_') || presetKey.includes('nostalgia_') || presetKey.includes('peace_')) {
    const emotionPresets: Record<string, string> = {
      'joy_sadness': 'Joy + Sadness',
      'strength_vulnerability': 'Strength + Vulnerability',
      'nostalgia_distance': 'Nostalgia + Distance',
      'peace_fear': 'Peace + Fear',
      'emotion_angry': 'Angry',
      'emotion_sad': 'Sad',
      'emotion_happy': 'Happy',
      'emotion_surprised': 'Surprised',
      'emotion_love': 'Love',
      'emotion_loneliness': 'Lonely',
      'unreal_reflection_joy_sadness': 'Joy + Sadness',
      'unreal_reflection_strength_vulnerability': 'Strength + Vulnerability',
      'unreal_reflection_nostalgia_distance': 'Nostalgia + Distance',
      'unreal_reflection_peace_fear': 'Peace + Fear'
    }
    return emotionPresets[presetKey] || 'Emotion'
  }
  
  // Story Time presets
  if (type === 'story-time' || presetKey.startsWith('story_') || presetKey === 'auto' || presetKey === 'adventure' || presetKey === 'romance' || presetKey === 'mystery' || presetKey === 'comedy' || presetKey === 'fantasy' || presetKey === 'travel') {
    const storyTimePresets: Record<string, string> = {
      'auto': 'Auto',
      'adventure': 'Adventure',
      'romance': 'Romance',
      'mystery': 'Mystery',
      'comedy': 'Comedy',
      'fantasy': 'Fantasy',
      'travel': 'Travel'
    }
    return storyTimePresets[presetKey] || 'Story'
  }
  
  // Professional presets
  const professionalPresets: Record<string, string> = {
    'cinematic': 'Cinematic',
    'vibrant': 'Vibrant',
    'minimalist': 'Minimalist',
    'vintage': 'Vintage',
    'travel': 'Travel',
    'nature': 'Nature',
    'portrait': 'Portrait',
    'urban': 'Urban',
    'black_white': 'Black & White',
    'soft': 'Soft',
    'warm': 'Warm',
    'editorial': 'Editorial',
    'clarity': 'Clarity',
    'cool': 'Cool',
    'moody': 'Moody'
  }
  
  return professionalPresets[presetKey] || presetKey.charAt(0).toUpperCase() + presetKey.slice(1)
}

// Get preset type for styling
export const getPresetType = (presetKey: string | null | undefined, type?: string): string => {
  if (!presetKey) return 'custom'
  
  if (type === 'cyber-siren' || presetKey.startsWith('cyber_')) return 'cyber-siren'
  if (presetKey.startsWith('ghibli_')) return 'ghibli'
  if (presetKey.startsWith('emotion_') || presetKey.includes('joy_') || presetKey.includes('strength_') || presetKey.includes('nostalgia_') || presetKey.includes('peace_')) return 'emotion'
  if (presetKey.startsWith('story_') || presetKey === 'auto' || presetKey === 'adventure' || presetKey === 'romance' || presetKey === 'mystery' || presetKey === 'comedy' || presetKey === 'fantasy' || presetKey === 'travel') return 'story-time'
  
  return 'professional'
}
