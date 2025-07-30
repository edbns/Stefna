import React, { useEffect, useState, useRef, useCallback } from 'react';
import LastFMService, { LastFMTrack } from '../services/LastFMService';
import { ExternalLink, Flame, Music2 } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const TRACKS_PER_PAGE = 15;

const TrendingMusic: React.FC = () => {
  const [tracks, setTracks] = useState<LastFMTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const fetchTracks = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      const newTracks = await LastFMService.getTrendingTracks(TRACKS_PER_PAGE, pageNum);
      setTracks((prev) => (pageNum === 1 ? newTracks : [...prev, ...newTracks]));
      setHasMore(newTracks.length === TRACKS_PER_PAGE);
    } catch (err) {
      setError('Failed to load trending music');
      toast.error('Failed to load trending music');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracks(page);
  }, [page, fetchTracks]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [hasMore, loading]);

  if (error) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-semibold text-black mb-2">Failed to load trending music</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => { setPage(1); fetchTracks(1); }}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-black mb-2">🎵 Trending Music</h2>
          <p className="text-gray-600">Top tracks globally from Last.fm</p>
        </div>
      </div>
      {tracks.length === 0 && loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-20 text-gray-500 text-lg">
          🎧 No trending tracks found right now — check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track, idx) => {
            const image = track.image?.find((img) => img.size === 'extralarge')?.['#text'] ||
                          track.image?.find((img) => img.size === 'large')?.['#text'] ||
                          track.image?.[0]?.['#text'] || '';
            return (
              <div
                key={track.url + idx}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group animate-fadeIn"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                      {image ? (
                        <img src={image} alt={track.name} className="w-full h-full object-cover" />
                      ) : (
                        <Music2 className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-black line-clamp-2">{track.name}</h3>
                      <a
                        href={track.artist.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        {track.artist.name}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium animate-pulse">
                    <Flame className="w-3 h-3" /> Trending
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-black text-white rounded-md text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    Listen <ExternalLink className="w-4 h-4" />
                  </a>
                  {/* Placeholder for Spotify preview */}
                  <span className="text-xs text-gray-400 ml-2">Spotify preview coming soon</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Infinite scroll loader */}
      <div ref={loaderRef} />
      {loading && tracks.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      )}
    </div>
  );
};

export default TrendingMusic;