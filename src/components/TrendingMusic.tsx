import React, { useEffect, useState, useRef, useCallback } from 'react';
import LastFMService, { LastFMTrack } from '../services/LastFMService';
import { ExternalLink, Flame, Music2, Clock, Tag, Disc, User } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import InteractionButtons from './InteractionButtons';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const TRACKS_PER_PAGE = 15;

const TrendingMusic: React.FC = () => {
  const [tracks, setTracks] = useState<LastFMTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [detailedTracks, setDetailedTracks] = useState<Map<string, LastFMTrack>>(new Map());
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  const fetchTracks = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      const newTracks = await LastFMService.getTrendingTracks(TRACKS_PER_PAGE, pageNum);
      setTracks((prev) => (pageNum === 1 ? newTracks : [...prev, ...newTracks]));
      setHasMore(newTracks.length === TRACKS_PER_PAGE);
      
      // Fetch detailed info for new tracks
      if (pageNum === 1) {
        setDetailedTracks(new Map());
      }
      
      // Fetch detailed info for each track
      for (const track of newTracks) {
        try {
          const detailedInfo = await LastFMService.getTrackInfo(track.artist.name, track.name);
          if (detailedInfo) {
            setDetailedTracks(prev => new Map(prev).set(track.url, detailedInfo));
          }
        } catch (error) {
          console.error('Error fetching detailed track info:', error);
        }
      }
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

  const handleAuthPrompt = () => {
    toast.error('Please sign in to interact with content');
    // You can trigger the auth modal here if needed
  };

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
            
            const detailedTrack = detailedTracks.get(track.url);
            const duration = detailedTrack?.duration ? LastFMService.formatDuration(detailedTrack.duration) : null;
            const playCount = LastFMService.formatPlayCount(track.playcount);
            const tags = detailedTrack?.tags?.slice(0, 3) || [];
            const album = detailedTrack?.album?.name;
            const genre = detailedTrack?.genre;

            return (
              <div
                key={track.url + idx}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group"
              >
                {/* Header with Image and Basic Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                      {image ? (
                        <img src={image} alt={track.name} className="w-full h-full object-cover" />
                      ) : (
                        <Music2 className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-black line-clamp-2">{track.name}</h3>
                      <a
                        href={track.artist.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        onClick={e => e.stopPropagation()}
                      >
                        <User className="w-3 h-3" />
                        {track.artist.name}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium animate-pulse">
                    <Flame className="w-3 h-3" /> Trending
                  </div>
                </div>

                {/* Detailed Information */}
                <div className="space-y-3 mb-4">
                  {/* Album and Duration */}
                  {(album || duration) && (
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      {album && (
                        <div className="flex items-center gap-1">
                          <Disc className="w-3 h-3" />
                          <span className="line-clamp-1">{album}</span>
                        </div>
                      )}
                      {duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{duration}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Genre */}
                  {genre && (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-gray-500">Genre:</span>
                      <span className="text-purple-600 font-medium">{genre}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Tag className="w-3 h-3 text-gray-400" />
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag, tagIdx) => (
                          <span
                            key={tagIdx}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Play Count */}
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">{playCount}</span> plays
                  </div>
                </div>

                {/* Interaction Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <InteractionButtons
                    contentType="music"
                    contentId={track.url}
                    metadata={{
                      trackName: track.name,
                      artistName: track.artist.name,
                      album: album,
                      genre: genre
                    }}
                    onAuthOpen={handleAuthPrompt}
                  />
                  
                  {/* Listen Button */}
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-black text-white rounded-md text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    Listen <ExternalLink className="w-4 h-4" />
                  </a>
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