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
              <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                {media.mode === 'neo_glitch' ? 'Neo Tokyo Glitch' :
                 media.mode === 'ghibli_reaction' ? 'Ghibli Reaction' :
                 media.mode === 'emotion_mask' ? 'Emotion Mask' :
                 media.mode === 'presets' ? 'Presets' :
                 media.mode === 'custom_prompt' ? 'Custom Prompt' :
                 media.mode === 'edit' ? 'Studio' : 'AI'}
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
