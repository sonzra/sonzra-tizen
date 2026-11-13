import { Album, Artist, ServerConfig, Track } from '../types/music';
import { AuthSession, User } from '../types/auth';

export class SonzraApiClient {
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
  }

  updateConfig(config: ServerConfig) {
    this.config = config;
  }

  private resolveUrl(url?: string): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    let resolved = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const base = this.config.serverUrl.replace(/\/$/, '');
      resolved = `${base}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    if (this.config.authToken && (resolved.includes('/artwork/') || resolved.includes('/audio/'))) {
      if (!resolved.includes('token=')) {
        const delimiter = resolved.includes('?') ? '&' : '?';
        resolved = `${resolved}${delimiter}token=${encodeURIComponent(this.config.authToken)}`;
      }
    }
    return resolved;
  }

  async signIn(email_address: string, password: string): Promise<AuthSession> {
    const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
    const response = await fetch(`${cleanUrl}/api/v1/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email_address, password }),
    });

    if (!response.ok) {
      let errorMsg = `Sign in failed (HTTP ${response.status})`;
      try {
        const data = await response.json();
        if (data.error) errorMsg = data.error;
      } catch {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return {
      token: data.token,
      session_id: data.session_id,
      user: data.user,
    };
  }

  async signOut(): Promise<void> {
    if (!this.config.authToken || !this.config.serverUrl) return;
    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      await fetch(`${cleanUrl}/api/v1/session`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.config.authToken}`,
        },
      });
    } catch (err) {
      console.warn('Sign out request failed:', err);
    }
  }

  async fetchCurrentSession(): Promise<User | null> {
    if (!this.config.authToken || !this.config.serverUrl) return null;
    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/api/v1/session`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.config.authToken}`,
        },
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.user;
    } catch {
      return null;
    }
  }

  getAudioUrl(track: Track): string {
    if (this.config.demoMode || !this.config.serverUrl) {
      return track.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    }
    if (track.audioUrl) {
      return this.resolveUrl(track.audioUrl)!;
    }
    const base = this.config.serverUrl.replace(/\/$/, '');
    return this.resolveUrl(`${base}/server_connections/${this.config.serverConnectionId}/audio/${track.id}`)!;
  }

  getArtworkUrl(itemId: string, fallback?: string): string {
    if (this.config.demoMode || !this.config.serverUrl) {
      return fallback || './sonzra-mark.svg';
    }
    if (fallback && (fallback.startsWith('http') || fallback.startsWith('/'))) {
      return this.resolveUrl(fallback)!;
    }
    const base = this.config.serverUrl.replace(/\/$/, '');
    return this.resolveUrl(`${base}/server_connections/${this.config.serverConnectionId}/artwork/${itemId}`)!;
  }

  async testConnection(url: string, _connectionId: string): Promise<{ success: boolean; message: string; latency?: number }> {
    const start = Date.now();
    try {
      const cleanUrl = url.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/up`, { method: 'GET', mode: 'cors' });
      const latency = Date.now() - start;
      if (response.ok) {
        return { success: true, message: `Connected to Sonzra Server (${latency}ms)`, latency };
      }
      return { success: false, message: `Server returned HTTP ${response.status}` };
    } catch (err: any) {
      return {
        success: false,
        message: err.message?.includes('Failed to fetch')
          ? 'Network or CORS error connecting to Sonzra host'
          : `Connection error: ${err.message}`,
      };
    }
  }

  async fetchAlbums(): Promise<Album[]> {
    if (!this.config.serverUrl) {
      return [];
    }
    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/api/v1/library/albums`, {
        headers: {
          Accept: 'application/json',
          ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
        },
      });
      if (!response.ok) {
        console.warn(`fetchAlbums returned HTTP ${response.status}`);
        return [];
      }
      const raw = await response.json();
      const items = Array.isArray(raw) ? raw : (raw.albums || []);

      return items.map((item: any) => ({
        id: String(item.id),
        title: item.name || item.title || 'Unknown Album',
        artist: item.artist || 'Unknown Artist',
        year: item.year ? Number(item.year) : undefined,
        genre: item.genre,
        artworkUrl: this.resolveUrl(item.artwork_url || item.artworkUrl) || './sonzra-mark.svg',
        trackCount: item.track_count || item.tracks?.length || 0,
        tracks: item.tracks?.map((t: any) => this.mapTrack(t)),
      }));
    } catch (err) {
      console.warn('Failed to fetch albums from server:', err);
      return [];
    }
  }

  async fetchAlbum(albumId: string): Promise<Album | null> {
    if (!this.config.serverUrl) {
      return null;
    }

    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/api/v1/library/items/${albumId}`, {
        headers: {
          Accept: 'application/json',
          ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
        },
      });
      if (response.ok) {
        const item = await response.json();
        const tracks = (item.tracks || []).map((t: any) => this.mapTrack(t, item));
        const totalDuration = tracks.reduce((acc: number, t: Track) => acc + (t.duration || 0), 0);

        return {
          id: String(item.id),
          title: item.name || item.title || 'Unknown Album',
          artist: item.artist || 'Unknown Artist',
          year: item.year ? Number(item.year) : undefined,
          genre: item.genre,
          artworkUrl: this.resolveUrl(item.artwork_url || item.artworkUrl) || './sonzra-mark.svg',
          trackCount: tracks.length,
          duration: totalDuration,
          tracks,
        };
      }
    } catch (e) {
      console.warn(`Failed to fetch album ${albumId}:`, e);
    }
    return null;
  }

  async fetchRadioTracks(itemId: string, limit = 12): Promise<Track[]> {
    if (!this.config.serverUrl || !this.config.serverConnectionId) {
      return [];
    }
    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const response = await fetch(
        `${cleanUrl}/server_connections/${this.config.serverConnectionId}/radio_tracks/${itemId}?limit=${limit}`,
        {
          headers: {
            Accept: 'application/json',
            ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
          },
        }
      );
      if (!response.ok) {
        console.warn(`fetchRadioTracks returned HTTP ${response.status}`);
        return [];
      }
      const data = await response.json();
      const items = data.items || [];
      return items.map((item: any) => ({
        id: String(item.item_id || item.id),
        title: item.title || item.name || 'Unknown Track',
        artist: item.artist || 'Unknown Artist',
        album: item.album || 'Radio Mix',
        duration: typeof item.duration === 'string' ? this.parseDurationString(item.duration) : (item.duration || 180),
        artworkUrl: this.resolveUrl(item.artwork || item.artwork_url) || './sonzra-mark.svg',
        audioUrl: this.resolveUrl(item.source || item.audio_url || item.stream_url),
        fidelity: 'Lossless',
        isFavorite: Boolean(item.favorite),
      }));
    } catch (err) {
      console.warn('Failed to fetch radio tracks:', err);
      return [];
    }
  }

  private parseDurationString(dur: string): number {
    if (!dur) return 180;
    const parts = dur.split(':').map(Number);
    if (parts.length === 2) {
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    }
    if (parts.length === 3) {
      return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    }
    return Number(dur) || 180;
  }

  async fetchArtists(): Promise<Artist[]> {
    if (!this.config.serverUrl) {
      return [];
    }
    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/api/v1/library/artists`, {
        headers: {
          Accept: 'application/json',
          ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
        },
      });
      if (!response.ok) {
        console.warn(`fetchArtists returned HTTP ${response.status}`);
        return [];
      }
      const raw = await response.json();
      const items = Array.isArray(raw) ? raw : (raw.artists || []);

      return items.map((item: any) => ({
        id: String(item.id),
        name: item.name || 'Unknown Artist',
        genre: item.genre,
        artworkUrl: this.resolveUrl(item.artwork_url || item.artworkUrl) || './sonzra-mark.svg',
        albumCount: item.album_count || item.albums?.length || 0,
      }));
    } catch (err) {
      console.warn('Failed to fetch artists from server:', err);
      return [];
    }
  }

  async fetchArtist(artistId: string): Promise<Artist | null> {
    if (!this.config.serverUrl) {
      return null;
    }

    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/api/v1/library/items/${artistId}`, {
        headers: {
          Accept: 'application/json',
          ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
        },
      });
      if (response.ok) {
        const item = await response.json();
        const topTracks = (item.tracks || []).map((t: any) => this.mapTrack(t));
        const albums = (item.discography || item.albums || []).map((alb: any) => ({
          id: String(alb.id),
          title: alb.name || alb.title,
          artist: alb.artist || item.name,
          year: alb.year ? Number(alb.year) : undefined,
          artworkUrl: this.resolveUrl(alb.artwork_url || alb.artworkUrl) || './sonzra-mark.svg',
          trackCount: alb.track_count || 0,
        }));

        return {
          id: String(item.id),
          name: item.name || 'Unknown Artist',
          genre: item.genre,
          artworkUrl: this.resolveUrl(item.artwork_url || item.artworkUrl) || './sonzra-mark.svg',
          albumCount: albums.length,
          bio: item.overview || item.bio,
          topTracks,
          albums,
        };
      }
    } catch (e) {
      console.warn(`Failed to fetch artist ${artistId}:`, e);
    }
    return null;
  }

  async reportPlayback(report: {
    event: 'started' | 'progress' | 'stopped' | 'completed' | 'paused';
    itemId: string;
    positionSeconds?: number;
    durationSeconds?: number;
    paused?: boolean;
  }): Promise<void> {
    if (this.config.demoMode || !this.config.serverUrl) return;
    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      await fetch(`${cleanUrl}/api/v1/playback_reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
        },
        body: JSON.stringify({
          event: report.event,
          item_id: report.itemId,
          position_seconds: report.positionSeconds,
          duration_seconds: report.durationSeconds,
          paused: report.paused,
        }),
      });
    } catch (err) {
      console.warn('Failed to send playback report:', err);
    }
  }

  private mapTrack(track: any, parentAlbum?: any): Track {
    return {
      id: String(track.id),
      title: track.title || track.name || 'Unknown Track',
      artist: track.artist || parentAlbum?.artist || 'Unknown Artist',
      artistId: track.artist_id || track.artistId,
      album: track.album || parentAlbum?.name || parentAlbum?.title || 'Unknown Album',
      albumId: track.album_id || parentAlbum?.id,
      duration: track.duration_seconds || (track.duration_ticks ? Math.round(track.duration_ticks / 10000000) : 180),
      trackNumber: track.track_number || track.trackNumber,
      discNumber: track.disc_number || track.discNumber,
      year: track.year || parentAlbum?.year,
      artworkUrl: this.resolveUrl(track.artwork_url || track.artworkUrl) || (parentAlbum ? this.resolveUrl(parentAlbum.artwork_url) : undefined),
      audioUrl: this.resolveUrl(track.stream_url || track.audio_url || track.audioUrl),
      codec: track.codec,
      bitrate: track.bitrate,
    };
  }
}
