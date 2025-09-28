import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Download, Eye } from 'lucide-react';
import { optimizeFeedImage } from '../utils/cloudinaryOptimization';

interface TagPageData {
  tag: string;
  totalCount: number;
  media: Array<{
    id: string;
    type: string;
    user_id: string;
    image_url: string;
    preset: string;
    prompt: string;
    created_at: string;
    likes_count: number;
    user_name?: string;
    user_avatar?: string;
  }>;
  popularTags: Array<{
    tag: string;
    count: number;
  }>;
}

export default function TagPageScreen() {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<TagPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tag) return;

    const fetchTagData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/.netlify/functions/getTagPage?tag=${encodeURIComponent(tag)}`);
        const result = await response.json();

        if (result.success) {
          setData(result);
        } else {
          setError('Failed to load tag data');
        }
      } catch (err) {
        console.error('Error fetching tag data:', err);
        setError('Failed to load tag data');
      } finally {
        setLoading(false);
      }
    };

    fetchTagData();
  }, [tag]);

  const formatTagName = (tagName: string): string => {
    return tagName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Error: {error || 'Tag not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Feed
            </button>
            <div className="text-white/60 text-sm">
              {data.totalCount} images
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        {/* Tag Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            {formatTagName(data.tag)} AI Art
          </h1>
          <p className="text-white/80 text-lg mb-6">
            Discover {data.totalCount} stunning AI-generated images created with the {formatTagName(data.tag)} style
          </p>
          
          {/* Popular Tags */}
          {data.popularTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {data.popularTags.slice(0, 8).map((popularTag) => (
                <button
                  key={popularTag.tag}
                  onClick={() => navigate(`/tag/${popularTag.tag}`)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    popularTag.tag === data.tag
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {formatTagName(popularTag.tag)} ({popularTag.count})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.media.map((item) => (
            <div key={item.id} className="bg-black rounded-xl overflow-hidden shadow-lg group">
              {/* Image */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={optimizeFeedImage(item.image_url)}
                  alt={item.prompt}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-3">
                    <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                      <Heart size={16} className="text-white" />
                    </button>
                    <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                      <Share2 size={16} className="text-white" />
                    </button>
                    <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                      <Download size={16} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* User Info */}
                <div className="flex items-center mb-3">
                  {item.user_avatar && (
                    <img
                      src={item.user_avatar}
                      alt={item.user_name || 'User'}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                  )}
                  <span className="text-white/60 text-sm">
                    {item.user_name || 'Anonymous'}
                  </span>
                </div>

                {/* Prompt */}
                <p className="text-white text-sm mb-3 line-clamp-2">
                  {item.prompt}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-white/60 text-xs">
                  <div className="flex items-center">
                    <Heart size={12} className="mr-1" />
                    {item.likes_count}
                  </div>
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {data.media.length < data.totalCount && (
          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-white text-black rounded-full hover:bg-white/90 transition-colors"
            >
              View All in Feed
            </button>
          </div>
        )}
      </div>

      {/* SEO Meta Tags (for SSR if implemented) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `${formatTagName(data.tag)} AI Art`,
            "description": `Discover ${data.totalCount} stunning AI-generated images created with the ${formatTagName(data.tag)} style on Stefna`,
            "url": `https://stefna.xyz/tag/${data.tag}`,
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": data.totalCount,
              "itemListElement": data.media.slice(0, 10).map((item, index) => ({
                "@type": "ImageObject",
                "position": index + 1,
                "url": item.image_url,
                "description": item.prompt,
                "creator": {
                  "@type": "Person",
                  "name": item.user_name || "Anonymous"
                }
              }))
            }
          })
        }}
      />
    </div>
  );
}
