// Mobile-optimized feed component for view-only experience
import React from 'react';
import { Heart, Share2, Download } from 'lucide-react';
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
  const handleLike = (media: UserMedia) => {
    if (!isLoggedIn) {
      // Show login prompt for mobile users
      alert('Please visit Stefna on desktop to create an account and like content!');
      return;
    }
    onToggleLike?.(media);
  };

  const handleShare = async (media: UserMedia) => {
    try {
      await navigator.clipboard.writeText(media.url);
      alert('Media URL copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleDownload = async (media: UserMedia) => {
    try {
      const response = await fetch(media.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `stefna-${media.id}.${media.type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 pb-20">
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
                {media.mode === 'neo_glitch' ? 'Neo Tokyo' :
                 media.mode === 'ghibli_reaction' ? 'Ghibli' :
                 media.mode === 'emotion_mask' ? 'Emotion' :
                 media.mode === 'presets' ? 'Preset' :
                 media.mode === 'custom_prompt' ? 'Custom' :
                 media.mode === 'edit' ? 'Studio' : 'AI'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 space-y-3">
            {/* Prompt */}
            {media.prompt && (
              <p className="text-white/80 text-sm leading-relaxed">
                {media.prompt}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Like Button */}
                <button
                  onClick={() => handleLike(media)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    userLikes[media.id]
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  <Heart size={16} className={userLikes[media.id] ? 'fill-current' : ''} />
                  <span className="text-sm">{media.likes_count || 0}</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={() => handleShare(media)}
                  className="flex items-center space-x-1 px-3 py-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <Share2 size={16} />
                  <span className="text-sm">Share</span>
                </button>
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleDownload(media)}
                className="flex items-center space-x-1 px-3 py-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Download size={16} />
                <span className="text-sm">Save</span>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Mobile Notice */}
      <div className="text-center py-8">
        <div className="bg-white/5 rounded-xl p-6 space-y-3">
          <h3 className="text-white font-semibold">📱 Mobile View</h3>
          <p className="text-white/60 text-sm">
            You're viewing Stefna on mobile. To create content and access your profile, 
            please visit us on desktop or wait for our mobile app!
          </p>
          <div className="text-white/40 text-xs">
            Browse, like, and share content • Desktop for full features
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileFeed;
