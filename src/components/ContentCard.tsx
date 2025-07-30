import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Maximize2, 
  ExternalLink, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX,
  LogIn
} from 'lucide-react';
import { Content } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Official Platform Logo Components
const PlatformLogos = {
  youtube: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-red-600">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  instagram: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <defs>
        <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f09433" />
          <stop offset="25%" stopColor="#e6683c" />
          <stop offset="50%" stopColor="#dc2743" />
          <stop offset="75%" stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
      <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  twitter: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-black">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  facebook: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-blue-600">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  linkedin: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-blue-700">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  tiktok: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-black">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
  reddit: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-orange-600">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  ),
  twitch: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-purple-600">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
    </svg>
  )
};

// Sentiment colors with dot indicators - updated for black and white theme
const sentimentColors = {
  positive: { bg: 'bg-gray-50', text: 'text-black', dot: 'bg-black', border: 'border-gray-200' },
  negative: { bg: 'bg-gray-50', text: 'text-black', dot: 'bg-gray-400', border: 'border-gray-200' },
  neutral: { bg: 'bg-gray-50', text: 'text-black', dot: 'bg-gray-500', border: 'border-gray-200' }
};

interface ContentCardProps {
  content: Content;
  viewMode: 'grid' | 'list';
  onAuthOpen?: () => void;
}

const ContentCard: React.FC<ContentCardProps> = ({ content, viewMode, onAuthOpen }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();

  // Get the platform icon component
  const PlatformIcon = PlatformLogos[content.platform as keyof typeof PlatformLogos];
  const sentimentStyle = sentimentColors[content.sentiment];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Auto-play video when component mounts
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Auto-play failed, which is expected in some browsers
      });
    }
  }, []);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFullscreen(true);
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://${content.platform}.com/${content.creator.username}`, '_blank');
  };

  const handleViewOriginal = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Generate platform-specific URL based on content ID and platform
    let url = '';
    switch (content.platform) {
      case 'youtube':
        url = `https://youtube.com/watch?v=${content.id}`;
        break;
      case 'instagram':
        url = `https://instagram.com/p/${content.id}`;
        break;
      case 'twitter':
        url = `https://twitter.com/i/status/${content.id}`;
        break;
      case 'tiktok':
        url = `https://tiktok.com/@${content.creator.username}/video/${content.id}`;
        break;
      case 'facebook':
        url = `https://facebook.com/${content.id}`;
        break;
      case 'linkedin':
        url = `https://linkedin.com/posts/${content.id}`;
        break;
      case 'reddit':
        url = `https://reddit.com/r/${content.id}`;
        break;
      case 'twitch':
        url = `https://twitch.tv/videos/${content.id}`;
        break;
      default:
        url = `https://${content.platform}.com`;
    }
    window.open(url, '_blank');
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 h-full flex flex-col relative">
        {/* Video/Thumbnail Section */}
        <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
          {/* Animated Trending Tag - Top Left */}
          <div className="absolute top-3 left-3 z-20">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
              <span className="relative">
                Trending
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
              </span>
            </div>
          </div>

          {/* Platform Icon - Top Right */}
          <div className="absolute top-3 right-3 z-20">
            <div className="bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-lg">
              {PlatformIcon ? <PlatformIcon /> : <span className="text-lg">📱</span>}
            </div>
          </div>

          {/* Video Player */}
          <div className="relative w-full h-full cursor-pointer group" onClick={handleVideoClick}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              poster={content.thumbnail}
              muted={isMuted}
              loop
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src="#" type="video/mp4" />
            </video>
            
            {/* Fallback image if video fails */}
            <img 
              src={content.thumbnail} 
              alt={content.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-gray-800" />
                ) : (
                  <Play className="w-6 h-6 text-gray-800 ml-1" />
                )}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={handleMuteToggle}
                className="bg-black/50 backdrop-blur-sm text-white p-1.5 rounded-lg hover:bg-black/70 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-3 h-3" />
                ) : (
                  <Volume2 className="w-3 h-3" />
                )}
              </button>

              <button
                onClick={handleFullscreen}
                className="bg-black/50 backdrop-blur-sm text-white p-1.5 rounded-lg hover:bg-black/70 transition-colors"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight font-['Figtree'] line-clamp-2">
            {content.title}
          </h3>

          <p className="text-gray-600 text-xs leading-relaxed font-['Figtree'] line-clamp-2">
            {content.description}
          </p>

          <div className="flex items-center gap-2">
            <img 
              src={content.creator.avatar} 
              alt={content.creator.name}
              className="w-6 h-6 rounded-full object-cover ring-1 ring-gray-100"
            />
            <button
              onClick={handleCreatorClick}
              className="text-xs font-medium text-gray-700 hover:text-blue-600 transition-colors font-['Figtree'] flex items-center gap-1 group"
            >
              @{content.creator.username}
              <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                <Eye className="w-3 h-3" />
                <span className="font-medium">{formatNumber(content.metrics.views)}</span>
              </div>
              <div className="flex items-center gap-1 hover:text-red-500 transition-colors">
                <Heart className="w-3 h-3" />
                <span className="font-medium">{formatNumber(content.metrics.likes)}</span>
              </div>
              <div className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                <MessageCircle className="w-3 h-3" />
                <span className="font-medium">{formatNumber(content.metrics.comments)}</span>
              </div>
              <div className="flex items-center gap-1 hover:text-green-500 transition-colors">
                <Share2 className="w-3 h-3" />
                <span className="font-medium">{formatNumber(content.metrics.shares)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section with Sentiment and Action Buttons */}
        <div className="px-4 pb-4">
          <div className="flex justify-between items-center">
            {/* Sentiment Badge */}
            <div className={`px-4 py-2 rounded-full text-xs border ${sentimentStyle.bg} ${sentimentStyle.text} ${sentimentStyle.border} flex items-center gap-2 font-medium shadow-sm`}>
              <div className={`w-2 h-2 rounded-full ${sentimentStyle.dot} animate-pulse`}></div>
              <span className="capitalize">{content.sentiment}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* View Original Post Button */}
              <button
                onClick={handleViewOriginal}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                title="View original post"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-6xl w-full aspect-video">
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors text-3xl font-light"
            >
              ×
            </button>
            <video
              className="w-full h-full object-contain rounded-lg"
              controls
              autoPlay
              poster={content.thumbnail}
            >
              <source src="#" type="video/mp4" />
            </video>
            <img 
              src={content.thumbnail} 
              alt={content.title}
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ContentCard;