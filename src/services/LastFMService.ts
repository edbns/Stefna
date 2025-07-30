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
}

export interface LastFMTrackResponse {
  tracks: {
    track: LastFMTrack[];
    '@attr': any;
  };
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
}

export default new LastFMService();