import { useEffect, useState } from 'react';
import { fetchPublicFeed } from '../lib/feed';
import type { Asset } from '../lib/types';
import RemixButton from '../components/RemixButton';

// Get Cloudinary cloud name from environment
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

export default function Home() {
  const [items, setItems] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRemix = (sourceAssetId: string, sourcePublicId: string) => {
    // Navigate to editor with remix data
    // You can implement navigation logic here or use a callback prop
    console.log(`[Home] Remix requested:`, { sourceAssetId, sourcePublicId });
    // Example: navigate to editor with remix data
    // navigate('/editor', { state: { remixData: { sourceAssetId, sourcePublicId } } });
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPublicFeed(50);
        setItems(data);
        console.log(`[Home] Loaded ${data.length} public assets`);
      } catch (err) {
        console.error('[Home] Error loading feed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load feed');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading feed...</div>;
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  const renderMedia = (asset: Asset) => {
    if (!asset.cloudinary_public_id || !asset.media_type) {
      return (
        <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
          <span className="text-gray-500">Media not available</span>
        </div>
      );
    }

    const mediaUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${asset.media_type}/upload/${asset.cloudinary_public_id}`;
    
    if (asset.media_type === 'video') {
      return (
        <video 
          src={mediaUrl} 
          className="w-full h-48 object-cover rounded"
          controls
          preload="metadata"
        />
      );
    } else {
      return (
        <img 
          src={mediaUrl} 
          alt={`AI generated ${asset.preset_key || 'custom'} image`}
          className="w-full h-48 object-cover rounded"
          loading="lazy"
        />
      );
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500 text-lg">
          No public media found yet. Be the first to share something!
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((a) => (
        <figure key={a.id} className="rounded-2xl shadow p-2">
          {renderMedia(a)}
          <div className="mt-2 space-y-2">
            <figcaption className="text-sm opacity-70">
              {a.preset_key ?? 'custom'} • {new Date(a.published_at!).toLocaleString()}
            </figcaption>
            
            {/* Interactive Buttons */}
            <div className="flex items-center justify-between">
              {/* Like Button */}
              <button
                onClick={() => console.log(`[Home] Like clicked for asset: ${a.id}`)}
                className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:text-red-500 transition-colors"
                title="Like this creation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 000-6.364l-1.317-1.318a4.5 4.5 0 00-6.364 0L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>0</span>
              </button>
              
              {/* Remix Button */}
              {a.allow_remix && (
                <RemixButton
                  assetId={a.id}
                  cloudinaryPublicId={a.cloudinary_public_id!}
                  mediaType={a.media_type!}
                  onRemix={handleRemix}
                />
              )}
            </div>
          </div>
        </figure>
      ))}
    </div>
  );
}
