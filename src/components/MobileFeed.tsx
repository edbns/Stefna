// Mobile-optimized feed component
import React, { useEffect, useRef } from 'react';
import type { UserMedia } from '../services/userMediaService';
import LoadingSpinner from './LoadingSpinner';

interface MobileFeedProps {
  feed: UserMedia[];
  onToggleLike?: (media: UserMedia) => void;
  userLikes?: Record<string, boolean>;
  isLoggedIn?: boolean;
  onLastItemRef?: (ref: HTMLDivElement | null) => void;
  isLoadingMore?: boolean;
  hasMoreFeed?: boolean;
}

const MobileFeed: React.FC<MobileFeedProps> = ({
  feed,
  onToggleLike,
  userLikes = {},
  isLoggedIn = false,
  onLastItemRef,
  isLoadingMore = false,
  hasMoreFeed = true
}) => {
  const lastItemRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (lastItemRef.current && onLastItemRef) {
      onLastItemRef(lastItemRef.current);
    }
    
    return () => {
      if (onLastItemRef) {
        onLastItemRef(null);
      }
    };
  }, [onLastItemRef]);

  // Function to get proper media type display (same logic as desktop PresetTag)
  const getMediaTypeDisplay = (media: UserMedia): string => {
    // Get the actual data from the media
    const actualType = media.metadata?.presetType || media.type
    const actualPresetKey = media.metadata?.presetKey || media.presetKey
    
    // Map types to display names (same as PresetTag)
    const typeNames: Record<string, string> = {
      'neo_glitch': 'Cyber Siren',
      'ghibli_reaction': 'Ghibli Reaction',
      'unreal_reflection': 'Unreal Reflection',
      'presets': 'Presets',
      'custom_prompt': 'Custom Prompt',
      'story_time': 'Story Time',
      'story': 'Story Time',
      'edit': 'Studio',
      // Media type mappings
      'neo-glitch': 'Cyber Siren',
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
      {feed.map((media, index) => (
        <div 
          key={media.id} 
          className="bg-white/5 overflow-hidden"
          ref={index === feed.length - 1 ? lastItemRef : null}
        >
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

      {/* Loading indicator for infinite scroll */}
      {isLoadingMore && hasMoreFeed && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="sm" text="Loading more..." />
        </div>
      )}
      
      {/* End of feed indicator */}
      {!hasMoreFeed && feed.length > 0 && (
        <div className="text-center py-8 text-white/40 text-sm">
          You've reached the end of the feed
        </div>
      )}
    </div>
  );
};

export default MobileFeed;
