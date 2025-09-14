// Mobile Browser Gallery Component
// Converted from mobile app gallery with sections
import React, { useState, useEffect } from 'react';
import { UserMedia } from '../services/userMediaService';
import { Image } from 'lucide-react';

interface MobileGalleryProps {
  media: UserMedia[];
  isLoading: boolean;
  onMediaClick?: (media: UserMedia) => void;
  onDeleteMedia?: (media: UserMedia) => void;
  className?: string;
}

interface MediaSection {
  title: string;
  data: UserMedia[];
}

export default function MobileGallery({
  media,
  isLoading,
  onMediaClick,
  onDeleteMedia,
  className = ''
}: MobileGalleryProps) {
  const [sections, setSections] = useState<MediaSection[]>([]);

  // Group media by mode/type (same logic as mobile app)
  useEffect(() => {
    const labelFor = (item: UserMedia): string => {
      const type = (item.type || '').toLowerCase();
      const presetType = item.metadata?.presetType?.toLowerCase() || '';
      
      if (type === 'neo_glitch' || presetType === 'neo_glitch' || item.prompt?.includes('neo') || item.prompt?.includes('glitch')) {
        return 'Neo Tokyo Glitch';
      }
      if (type === 'ghibli_reaction' || presetType === 'ghibli_reaction' || item.prompt?.includes('ghibli')) {
        return 'Ghibli Reaction';
      }
      if (type === 'unreal_reflection' || presetType === 'unreal_reflection') {
        return 'Unreal Reflection';
      }
      if (type === 'custom_prompt' || presetType === 'custom_prompt' || item.prompt?.includes('custom')) {
        return 'Custom';
      }
      if (type === 'edit' || presetType === 'edit' || item.prompt?.includes('edit') || item.prompt?.includes('studio')) {
        return 'Studio';
      }
      if (type === 'story_time' || presetType === 'story_time' || item.prompt?.includes('story')) {
        return 'Story Time';
      }
      return 'Presets';
    };

    const groups: Record<string, UserMedia[]> = {};
    for (const m of media || []) {
      const key = labelFor(m);
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    
    const s = Object.keys(groups).map(title => ({ title, data: groups[title] }));
    setSections(s);
  }, [media]);

  const getPresetTag = (item: UserMedia) => {
    // Extract preset information from the media item
    if (item.prompt?.includes('neo') || item.prompt?.includes('glitch')) return 'Neo Glitch';
    if (item.prompt?.includes('custom')) return 'Custom';
    if (item.prompt?.includes('studio') || item.prompt?.includes('edit')) return 'Studio';
    if (item.prompt?.includes('ghibli')) return 'Ghibli Reaction';
    if (item.prompt?.includes('unreal') || item.prompt?.includes('reflection')) return 'Unreal Reflection';
    if (item.prompt?.includes('story')) return 'Story Time';
    return 'AI Generated';
  };

  const renderMediaItem = (item: UserMedia) => {
    return (
      <div 
        key={item.id} 
        className="media-item"
        onClick={() => onMediaClick?.(item)}
      >
        <div className="media-image">
          {item.url ? (
            <img 
              src={item.url} 
              alt="Generated content"
              className="media-image-content"
              loading="lazy"
            />
          ) : (
            <div className="media-image-placeholder">
              <Image size={24} color="#666666" />
            </div>
          )}
        </div>
        <div className="media-info">
          <span className="preset-tag">{getPresetTag(item)}</span>
          <span className="media-date">
            {new Date(item.timestamp).toLocaleDateString()}
          </span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`mobile-gallery ${className}`}>
        <div className="loading-container">
          <span className="loading-text">Loading your creations...</span>
        </div>
      </div>
    );
  }

  if (!media || media.length === 0) {
    return (
      <div className={`mobile-gallery ${className}`}>
        <div className="empty-container">
          <div className="empty-icon">
            <Image size={60} color="#666666" />
          </div>
          <span className="empty-text">No Media</span>
          <span className="empty-subtext">Upload a photo or take one to get started</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`mobile-gallery ${className}`}>
      <div className="gallery-container">
        {sections.map((section) => (
          <div key={section.title} className="section">
            <h3 className="section-header">{section.title}</h3>
            <div className="section-grid">
              {section.data.map((item) => (
                <div key={item.id} className="section-item-wrapper">
                  {renderMediaItem(item)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .mobile-gallery {
          flex: 1;
          background-color: #000000;
          padding-bottom: 100px; /* Space for floating footer */
        }
        
        .loading-container {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        
        .loading-text {
          font-size: 16px;
          color: #cccccc;
          text-align: center;
        }

        .empty-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }
        
        .empty-icon {
          margin-bottom: 24px;
        }
        
        .empty-text {
          font-size: 24px;
          font-weight: bold;
          color: #ffffff;
          margin-bottom: 8px;
          text-align: center;
        }
        
        .empty-subtext {
          font-size: 16px;
          color: #cccccc;
          text-align: center;
          line-height: 24px;
        }

        .gallery-container {
          padding: 16px;
          padding-top: 20px;
        }
        
        .section {
          margin-bottom: 24px;
        }
        
        .section-header {
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          margin-top: 8px;
          margin-bottom: 8px;
        }
        
        .section-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        .section-item-wrapper {
          width: 100%;
        }

        .media-item {
          width: 100%;
          background-color: #1a1a1a;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .media-item:hover {
          transform: scale(1.02);
        }
        
        .media-image {
          width: 100%;
          aspect-ratio: 1;
          background-color: #333333;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        
        .media-image-content {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .media-image-placeholder {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .media-info {
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        
        .preset-tag {
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          background-color: #333333;
          padding: 4px 8px;
          border-radius: 8px;
        }
        
        .media-date {
          font-size: 11px;
          color: #cccccc;
        }
        
        /* Mobile-specific adjustments */
        @media (max-width: 480px) {
          .gallery-container {
            padding: 12px;
            padding-top: 16px;
          }
          
          .section-grid {
            gap: 12px;
          }
          
          .media-info {
            padding: 8px;
          }
          
          .preset-tag {
            font-size: 11px;
            padding: 3px 6px;
          }
          
          .media-date {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}
