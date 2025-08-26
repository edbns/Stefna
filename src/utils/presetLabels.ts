// Utility function to map preset keys to user-friendly display names
export const getPresetDisplayName = (presetKey: string | null | undefined, type?: string): string => {
  if (!presetKey) return 'Custom Prompt'
  
  // Neo Tokyo Glitch presets
  if (type === 'neo-glitch' || presetKey.startsWith('neo_')) {
    const neoPresets: Record<string, string> = {
      'visor': 'Visor',
      'base': 'Base',
      'tattoos': 'Tattoos', 
      'scanlines': 'Scanlines'
    }
    return neoPresets[presetKey] || 'Neo Tokyo'
  }
  
  // Ghibli Reaction presets
  if (presetKey.startsWith('ghibli_')) {
    const ghibliPresets: Record<string, string> = {
      'ghibli_sparkle': 'Sparkle',
      'ghibli_blush': 'Blush',
      'ghibli_dreamy': 'Dreamy',
      'ghibli_magical': 'Magical'
    }
    return ghibliPresets[presetKey] || 'Ghibli'
  }
  
  // Emotion Mask presets
  if (presetKey.startsWith('emotion_')) {
    const emotionPresets: Record<string, string> = {
      'emotion_angry': 'Angry',
      'emotion_sad': 'Sad',
      'emotion_happy': 'Happy',
      'emotion_surprised': 'Surprised',
      'emotion_love': 'Love',
      'emotion_loneliness': 'Lonely'
    }
    return emotionPresets[presetKey] || 'Emotion'
  }
  
  // Professional presets
  const professionalPresets: Record<string, string> = {
    'cinematic': 'Cinematic',
    'portrait': 'Portrait',
    'landscape': 'Landscape',
    'artistic': 'Artistic',
    'vintage': 'Vintage',
    'modern': 'Modern',
    'dramatic': 'Dramatic',
    'soft': 'Soft',
    'bold': 'Bold',
    'elegant': 'Elegant'
  }
  
  return professionalPresets[presetKey] || presetKey.charAt(0).toUpperCase() + presetKey.slice(1)
}

// Get preset type for styling
export const getPresetType = (presetKey: string | null | undefined, type?: string): string => {
  if (!presetKey) return 'custom'
  
  if (type === 'neo-glitch' || presetKey.startsWith('neo_')) return 'neo-tokyo'
  if (presetKey.startsWith('ghibli_')) return 'ghibli'
  if (presetKey.startsWith('emotion_')) return 'emotion'
  
  return 'professional'
}
