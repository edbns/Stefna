export interface LastFMTrack {
  name: string;
  playcount: string;
  listeners: string;
  mbid: string;
  url: string;
  streamable: string;
  artist: {
    name: string;
    mbid: string;
    url: string;
  };
  image: Array<{
    '#text': string;
    size: string;
  }>;
  // Enhanced fields
  album?: {
    name: string;
    mbid: string;
    url: string;
  };
  duration?: string;
  genre?: string;
  tags?: Array<{
    name: string;
    url: string;
  }>;
  wiki?: {
    summary: string;
    content: string;
  };
}

export interface LastFMTrackResponse {
  tracks: {
    track: LastFMTrack[];
    '@attr': any;
  };
}

export interface LastFMTrackInfoResponse {
  track: LastFMTrack;
}

class LastFMService {
  private baseURL = 'https://ws.audioscrobbler.com/2.0/';
  private apiKey = import.meta.env.VITE_LASTFM_API_KEY;

  async getTrendingTracks(limit: number = 15, page: number = 1): Promise<LastFMTrack[]> {
    const url = `${this.baseURL}?method=chart.gettoptracks&api_key=${this.apiKey}&format=json&limit=${limit}&page=${page}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch trending tracks');
    const data: LastFMTrackResponse = await response.json();
    return data.tracks.track;
  }

  async getTrackInfo(artist: string, track: string): Promise<LastFMTrack | null> {
    try {
      const url = `${this.baseURL}?method=track.getinfo&api_key=${this.apiKey}&format=json&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data: LastFMTrackInfoResponse = await response.json();
      return data.track;
    } catch (error) {
      console.error('Error fetching track info:', error);
      return null;
    }
  }

  async getArtistInfo(artist: string): Promise<any> {
    try {
      const url = `${this.baseURL}?method=artist.getinfo&api_key=${this.apiKey}&format=json&artist=${encodeURIComponent(artist)}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      return data.artist;
    } catch (error) {
      console.error('Error fetching artist info:', error);
      return null;
    }
  }

  async getAlbumInfo(artist: string, album: string): Promise<any> {
    try {
      const url = `${this.baseURL}?method=album.getinfo&api_key=${this.apiKey}&format=json&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      return data.album;
    } catch (error) {
      console.error('Error fetching album info:', error);
      return null;
    }
  }

  formatDuration(seconds: string): string {
    const totalSeconds = parseInt(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatPlayCount(count: string): string {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }
}

export default new LastFMService();