// Mobile-optimized feed component with generation capabilities
import React, { useState } from 'react';
import type { UserMedia } from '../services/userMediaService';
import MobileGenerationApp from './MobileGenerationApp';

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
  const [showGenerationApp, setShowGenerationApp] = useState(false);

  // If user wants to generate content, show the full generation app
  if (showGenerationApp) {
    return (
      <div className="mobile-feed">
        <button 
          className="back-to-feed-button"
          onClick={() => setShowGenerationApp(false)}
        >
          ← Back to Feed
        </button>
        <MobileGenerationApp />
      </div>
    );
  }

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
    
    // Map preset keys to display names - REMOVED specific mappings to show only type names
    const presetNames: Record<string, string> = {
      // All specific preset mappings removed - only showing type names now
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
        <div key={media.id} className="bg-white/5 overflow-hidden">
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

      {/* Bottom Banner with Create Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white text-black py-3 px-4 z-50">
        <div className="text-center">
          <p className="text-sm font-medium mb-3">
            Enjoy the full experience on our website — app coming soon!
          </p>
          {isLoggedIn && (
            <button 
              className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium"
              onClick={() => setShowGenerationApp(true)}
            >
              ✨ Create Content
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileFeed;
