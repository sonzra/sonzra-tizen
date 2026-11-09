import { Album, Artist, ServerConfig, Track } from '../types/music';
import { MOCK_ALBUMS, MOCK_ARTISTS } from './mockData';

export class SonzraApiClient {
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
  }

  updateConfig(config: ServerConfig) {
    this.config = config;
  }

  getAudioUrl(track: Track): string {
    if (this.config.demoMode || !this.config.serverUrl || track.audioUrl) {
      return track.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    }
    const base = this.config.serverUrl.replace(/\/$/, '');
    return `${base}/server_connections/${this.config.serverConnectionId}/audio/${track.id}`;
  }

  getArtworkUrl(itemId: string, fallback?: string): string {
    if (this.config.demoMode || !this.config.serverUrl) {
      return fallback || './sonzra-mark.svg';
    }
    const base = this.config.serverUrl.replace(/\/$/, '');
    return `${base}/server_connections/${this.config.serverConnectionId}/artwork/${itemId}`;
  }

  async testConnection(url: string, _connectionId: string): Promise<{ success: boolean; message: string; latency?: number }> {
    const start = Date.now();
    try {
      const cleanUrl = url.replace(/\/$/, '');
      // Try Sonzra health check or root
      const response = await fetch(`${cleanUrl}/up`, { method: 'GET', mode: 'cors' });
      const latency = Date.now() - start;
      if (response.ok) {
        return { success: true, message: `Connected to Sonzra Server (${latency}ms)`, latency };
      }
      return { success: false, message: `Server returned HTTP ${response.status}` };
    } catch (err: any) {
      // In TV/local dev environments without CORS headers, report informative message
      return {
        success: false,
        message: err.message?.includes('Failed to fetch')
          ? 'Network or CORS error connecting to Sonzra host'
          : `Connection error: ${err.message}`,
      };
    }
  }

  async fetchAlbums(): Promise<Album[]> {
    if (this.config.demoMode) {
      return MOCK_ALBUMS;
    }
    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/library/albums`, {
        headers: {
          Accept: 'application/json',
          ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.albums || MOCK_ALBUMS;
    } catch (err) {
      console.warn('Falling back to mock albums:', err);
      return MOCK_ALBUMS;
    }
  }

  async fetchAlbum(albumId: string): Promise<Album | null> {
    const albums = await this.fetchAlbums();
    const found = albums.find((a) => a.id === albumId);
    if (found) return found;

    if (this.config.demoMode) {
      return MOCK_ALBUMS.find((a) => a.id === albumId) || null;
    }

    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const response = await fetch(
        `${cleanUrl}/server_connections/${this.config.serverConnectionId}/library_items/${albumId}`,
        {
          headers: {
            Accept: 'application/json',
            ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
          },
        }
      );
      if (response.ok) {
        const item = await response.json();
        return item;
      }
    } catch (e) {
      console.warn(`Failed to fetch album ${albumId}:`, e);
    }
    return MOCK_ALBUMS.find((a) => a.id === albumId) || null;
  }

  async fetchArtists(): Promise<Artist[]> {
    if (this.config.demoMode) {
      return MOCK_ARTISTS;
    }
    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/library/artists`, {
        headers: {
          Accept: 'application/json',
          ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.artists || MOCK_ARTISTS;
    } catch (err) {
      console.warn('Falling back to mock artists:', err);
      return MOCK_ARTISTS;
    }
  }

  async fetchArtist(artistId: string): Promise<Artist | null> {
    const artists = await this.fetchArtists();
    const found = artists.find((a) => a.id === artistId);
    if (found) return found;
    return MOCK_ARTISTS.find((a) => a.id === artistId) || null;
  }
}
