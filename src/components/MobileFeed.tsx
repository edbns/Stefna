// Mobile-optimized feed component for view-only experience
import React from 'react';
import type { UserMedia } from '../services/userMediaService';

interface MobileFeedProps {
  feed: UserMedia[];
  onToggleLike?: (media: UserMedia) => void;
  userLikes?: Record<string, boolean>;
  isLoggedIn?: boolean;
}

const MobileFeed: React.FC<MobileFeedProps> = ({
  feed,
  onToggleLike,
  userLikes = {},
  isLoggedIn = false
}) => {

  // Function to get proper media type display (same logic as desktop PresetTag)
  const getMediaTypeDisplay = (media: UserMedia): string => {
    // Get the actual data from the media
    const actualType = media.metadata?.presetType || media.type || media.mode
    const actualPresetKey = media.metadata?.presetKey || media.presetKey || media.preset
    
    // Map types to display names (same as PresetTag)
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
    
    // Map preset keys to display names (same as PresetTag)
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
      
      // Unreal Reflection
      'unreal_reflection_digital_monk': 'Digital Monk',
      'unreal_reflection_urban_oracle': 'Urban Oracle',
      'unreal_reflection_desert_mirror': 'Desert Mirror',
      'unreal_reflection_lumin_void': 'Lumin Void',
      'unreal_reflection_prism_break': 'Prism Break',
      'unreal_reflection_chromatic_bloom': 'Chromatic Bloom',
      'digital_monk': 'Digital Monk',
      'urban_oracle': 'Urban Oracle',
      'desert_mirror': 'Desert Mirror',
      'lumin_void': 'Lumin Void',
      'prism_break': 'Prism Break',
      'chromatic_bloom': 'Chromatic Bloom',
      
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
    
    // Fallback to 'AI' if nothing matches
    return 'AI'
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 pb-24">
      {feed.map((media) => (
        <div key={media.id} className="bg-white/5 rounded-xl overflow-hidden">
          {/* Media */}
          <div className="relative">
            {media.type === 'video' ? (
              <video
                src={media.url}
                className="w-full h-auto"
                controls
                playsInline
                muted
              />
            ) : (
              <img
                src={media.url}
                alt="Generated content"
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            )}
            
            {/* Media Type Badge */}
            <div className="absolute top-2 left-2">
              <span className="px-2 py-1 bg-black/80 text-white text-xs rounded-full border border-white/20">
                {getMediaTypeDisplay(media)}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Bottom Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-white text-black py-3 px-4 z-50">
        <div className="text-center">
          <p className="text-sm font-medium">
            Enjoy the full experience on our website — app coming soon!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileFeed;
