import { Album, Artist, Audiobook, LyricsData, PodcastShow, Playlist, ServerConfig, Track } from '../types/music';
import { AuthSession, User } from '../types/auth';
import {
  MOCK_ALBUMS,
  MOCK_ARTISTS,
  MOCK_AUDIOBOOKS,
  MOCK_PLAYLISTS,
  MOCK_PODCASTS,
} from '../__tests__/fixtures/mockData';

export function parseLyricsContent(raw: string): { synchronized: boolean; lines: { text: string; start: number | null }[] } {
  if (!raw || typeof raw !== 'string') {
    return { synchronized: false, lines: [] };
  }
  const lrcRegex = /^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/;
  const rawLines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  let hasTimestamp = false;
  const lines: { text: string; start: number | null }[] = [];

  for (const line of rawLines) {
    const match = line.match(lrcRegex);
    if (match) {
      hasTimestamp = true;
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const msPart = match[3] ? parseFloat(`0.${match[3]}`) : 0;
      const start = mins * 60 + secs + msPart;
      lines.push({ text: match[4] || '', start });
    } else {
      lines.push({ text: line, start: null });
    }
  }

  const validLines = lines.filter((l) => l.text.length > 0);
  return {
    synchronized: hasTimestamp && validLines.some((l) => l.start !== null),
    lines: validLines,
  };
}

export function normalizeLyricsPayload(data: any): LyricsData {
  if (!data) {
    return { available: false, synchronized: false, lines: [] };
  }

  if (typeof data === 'string') {
    const parsed = parseLyricsContent(data);
    return {
      available: parsed.lines.length > 0,
      synchronized: parsed.synchronized,
      lines: parsed.lines,
    };
  }

  if (Array.isArray(data.lines) && data.lines.length > 0) {
    const lines = data.lines
      .map((l: any) => {
        if (typeof l === 'string') {
          const parsed = parseLyricsContent(l);
          return parsed.lines[0] || { text: l.trim(), start: null };
        }
        const text = String(l.text || l.Text || l.content || l.line || '').trim();
        let start: number | null = null;
        const rawStart = l.start ?? l.Start ?? l.time ?? l.timestamp;
        if (rawStart !== undefined && rawStart !== null) {
          const num = Number(rawStart);
          if (!isNaN(num)) {
            start = num > 100000 ? num / 10000000 : num;
          }
        }
        return { text, start };
      })
      .filter((l: any) => l.text.length > 0);

    const isSync = data.synchronized !== undefined
      ? Boolean(data.synchronized)
      : lines.length > 0 && lines.some((l: any) => l.start !== null);

    return {
      available: data.available !== undefined ? Boolean(data.available && lines.length > 0) : lines.length > 0,
      synchronized: isSync,
      lines,
    };
  }

  const rawText = data.lyrics || data.lrc || data.text || data.plainLyrics || data.content;
  if (typeof rawText === 'string' && rawText.trim().length > 0) {
    const parsed = parseLyricsContent(rawText);
    return {
      available: parsed.lines.length > 0,
      synchronized: parsed.synchronized,
      lines: parsed.lines,
    };
  }

  return {
    available: false,
    synchronized: false,
    lines: [],
  };
}

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

  async fetchAlbums(letter?: string): Promise<Album[]> {
    if (this.config.demoMode || !this.config.serverUrl) {
      if (letter) {
        return MOCK_ALBUMS.filter((a) => {
          const first = a.title.trim().charAt(0).toUpperCase();
          return letter === '#' ? !(first >= 'A' && first <= 'Z') : first === letter;
        });
      }
      return MOCK_ALBUMS;
    }
    if (!this.config.serverUrl) {
      return [];
    }
    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const queryParam = letter ? `?letter=${encodeURIComponent(letter)}` : '';
      const response = await fetch(`${cleanUrl}/api/v1/library/albums${queryParam}`, {
        headers: {
          Accept: 'application/json',
          ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
        },
      });
      if (!response.ok) {
        console.warn(`fetchAlbums returned HTTP ${response.status}`);
        return this.config.demoMode ? MOCK_ALBUMS : [];
      }
      const raw = await response.json();
      const items = Array.isArray(raw) ? raw : (raw.albums || []);
      if (!items.length && this.config.demoMode) {
        return MOCK_ALBUMS;
      }

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
      return this.config.demoMode ? MOCK_ALBUMS : [];
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

  async fetchLyrics(itemId: string): Promise<LyricsData> {
    if (this.config.demoMode || !this.config.serverUrl || !this.config.serverConnectionId) {
      return {
        available: true,
        synchronized: true,
        lines: [
          { text: '漂浮在静谧的星海之中', start: 0 },
          { text: 'Drifting across the quiet celestial sea', start: 4 },
          { text: '远方的微光 闪烁着永恒的旋律', start: 8 },
          { text: 'A distant shimmer echoing eternal melody', start: 13 },
          { text: '时间如水流逝 记忆在此刻停驻', start: 18 },
          { text: 'Time flows like water, memories anchored here', start: 24 },
          { text: '纯净的音符 穿越时空的界限', start: 30 },
          { text: 'Pure acoustic resonance crossing dimensions', start: 36 },
          { text: '在黑暗中绽放的光辉', start: 42 },
          { text: 'Radiance blooming in the cosmic dark', start: 48 },
          { text: '音符随风起舞 直至黎明降临', start: 54 },
          { text: 'Notes dancing with the wind until the dawn arrives', start: 60 },
        ],
      };
    }

    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const response = await fetch(
        `${cleanUrl}/server_connections/${this.config.serverConnectionId}/lyrics/${itemId}`,
        {
          headers: {
            Accept: 'application/json',
            ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
          },
        }
      );

      if (!response.ok) {
        return { available: false, synchronized: false, lines: [] };
      }

      const contentType = response.headers?.get?.('content-type') || '';
      let data: any;
      if (contentType.includes('text/plain')) {
        data = await response.text();
      } else {
        try {
          data = await response.json();
        } catch {
          data = await response.text();
        }
      }

      return normalizeLyricsPayload(data);
    } catch (err) {
      console.warn(`Failed to fetch lyrics for item ${itemId}:`, err);
      return { available: false, synchronized: false, lines: [] };
    }
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

  async fetchArtists(letter?: string): Promise<Artist[]> {
    if (this.config.demoMode || !this.config.serverUrl) {
      if (letter) {
        return MOCK_ARTISTS.filter((a) => {
          const first = a.name.trim().charAt(0).toUpperCase();
          return letter === '#' ? !(first >= 'A' && first <= 'Z') : first === letter;
        });
      }
      return MOCK_ARTISTS;
    }
    if (!this.config.serverUrl) {
      return [];
    }
    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const queryParam = letter ? `?letter=${encodeURIComponent(letter)}` : '';
      const response = await fetch(`${cleanUrl}/api/v1/library/artists${queryParam}`, {
        headers: {
          Accept: 'application/json',
          ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
        },
      });
      if (!response.ok) {
        console.warn(`fetchArtists returned HTTP ${response.status}`);
        return this.config.demoMode ? MOCK_ARTISTS : [];
      }
      const raw = await response.json();
      const items = Array.isArray(raw) ? raw : (raw.artists || []);
      if (!items.length && this.config.demoMode) {
        return MOCK_ARTISTS;
      }

      return items.map((item: any) => ({
        id: String(item.id),
        name: item.name || 'Unknown Artist',
        genre: item.genre,
        artworkUrl: this.resolveUrl(item.artwork_url || item.artworkUrl) || './sonzra-mark.svg',
        albumCount: item.album_count || item.albums?.length || 0,
      }));
    } catch (err) {
      console.warn('Failed to fetch artists from server:', err);
      return this.config.demoMode ? MOCK_ARTISTS : [];
    }
  }

  async fetchPlaylists(): Promise<Playlist[]> {
    if (this.config.demoMode || !this.config.serverUrl) {
      return MOCK_PLAYLISTS;
    }
    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const endpoint = this.config.serverConnectionId
        ? `${cleanUrl}/server_connections/${this.config.serverConnectionId}/playlists`
        : `${cleanUrl}/api/v1/library/playlists`;
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
          ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
        },
      });
      if (!response.ok) {
        console.warn(`fetchPlaylists returned HTTP ${response.status}`);
        return MOCK_PLAYLISTS;
      }
      const raw = await response.json();
      const items = Array.isArray(raw) ? raw : (raw.items || raw.playlists || []);
      if (!items.length) {
        return MOCK_PLAYLISTS;
      }
      return items.map((item: any) => {
        const isCollab =
          item.CollaborationStatus === 'collaborative' ||
          item.is_collaborative === true ||
          item.isCollaborative === true ||
          item.IsSharedWithOthers === true;
        const isSharedWithMe =
          item.CollaborationStatus === 'shared_with_me' ||
          item.is_shared_with_me === true ||
          item.isSharedWithMe === true ||
          (item.IsOwner === false && isCollab);
        const isOwner = item.IsOwner !== undefined ? Boolean(item.IsOwner) : !isSharedWithMe;
        const collaborators = Array.isArray(item.collaborators)
          ? item.collaborators.map((c: any) => ({
              id: String(c.id || c.UserId),
              displayName: c.display_name || c.displayName || c.username || c.Name || 'Curator',
              username: c.username,
              email: c.email,
            }))
          : [];
        const collabName =
          item.collaborator_name ||
          item.collaboratorName ||
          (collaborators.length > 0 ? collaborators.map((c: any) => c.displayName).join(', ') : isCollab ? 'Curator' : undefined);

        return {
          id: String(item.id || item.Id),
          name: item.name || item.title || item.Name || 'Untitled Playlist',
          artworkUrl: this.resolveUrl(item.artwork_url || item.artworkUrl || item.ArtworkUrl) || './sonzra-mark.svg',
          trackCount: item.track_count || item.trackCount || item.tracks?.length || (item.CumulativeRunTimeTicks ? Math.round(item.CumulativeRunTimeTicks / 10000000 / 180) : 0),
          duration: item.duration || (item.CumulativeRunTimeTicks ? Math.round(item.CumulativeRunTimeTicks / 10000000) : undefined),
          isCollaborative: isCollab,
          isSharedWithMe,
          isOwner,
          collaboratorName: collabName,
          collaborators,
          tracks: item.tracks?.map((t: any) => this.mapTrack(t)),
        };
      });
    } catch (err) {
      console.warn('Failed to fetch playlists from server:', err);
      return MOCK_PLAYLISTS;
    }
  }

  async fetchPlaylistDetails(playlistId: string): Promise<Playlist | null> {
    const fallback = MOCK_PLAYLISTS.find((p) => p.id === playlistId);
    if (!this.config.serverUrl) {
      return fallback || null;
    }
    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/api/v1/library/items/${playlistId}`, {
        headers: {
          Accept: 'application/json',
          ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
        },
      });
      if (response.ok) {
        const item = await response.json();
        const tracks = (item.tracks || []).map((t: any) => this.mapTrack(t));
        return {
          id: String(item.id),
          name: item.name || item.title || 'Untitled Playlist',
          artworkUrl: this.resolveUrl(item.artwork_url || item.artworkUrl) || './sonzra-mark.svg',
          trackCount: tracks.length,
          duration: tracks.reduce((acc: number, t: Track) => acc + (t.duration || 0), 0),
          isCollaborative: item.is_collaborative || item.isCollaborative || fallback?.isCollaborative,
          collaboratorName: item.collaborator_name || item.collaboratorName || fallback?.collaboratorName,
          collaborators: item.collaborators || fallback?.collaborators,
          tracks,
        };
      }
    } catch (e) {
      console.warn(`Failed to fetch playlist details ${playlistId}:`, e);
    }
    return fallback || null;
  }

  async fetchAudiobooks(): Promise<Audiobook[]> {
    if (this.config.demoMode || !this.config.serverUrl) {
      return MOCK_AUDIOBOOKS;
    }
    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const endpoint = this.config.serverConnectionId
        ? `${cleanUrl}/server_connections/${this.config.serverConnectionId}/audiobooks`
        : `${cleanUrl}/api/v1/library/audiobooks`;
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
          ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
        },
      });
      if (!response.ok) {
        console.warn(`fetchAudiobooks returned HTTP ${response.status}`);
        return MOCK_AUDIOBOOKS;
      }
      const raw = await response.json();
      const items = Array.isArray(raw) ? raw : (raw.items || raw.audiobooks || []);
      if (!items.length) {
        return MOCK_AUDIOBOOKS;
      }
      return items.map((item: any) => {
        const durationSec =
          item.duration_seconds ||
          item.duration ||
          (item.RunTimeTicks ? Math.round(item.RunTimeTicks / 10000000) : 3600);
        const positionSec =
          item.playback_position_seconds ||
          item.playbackPositionSeconds ||
          (item.UserData?.PlaybackPositionTicks ? Math.round(item.UserData.PlaybackPositionTicks / 10000000) : 0);
        const progressPercent =
          item.progressPercent ??
          (durationSec > 0 ? Math.round((positionSec / durationSec) * 100) : 0);
        const chapters = (item.chapters || item.Chapters || []).map((ch: any, idx: number) => ({
          id: String(ch.id || ch.Id || `ch-${idx + 1}`),
          title: ch.name || ch.title || ch.Name || `Chapter ${idx + 1}`,
          startPositionSeconds: ch.start_position_seconds ?? (ch.StartPositionTicks ? Math.round(ch.StartPositionTicks / 10000000) : 0),
          duration: ch.duration_seconds ?? (ch.RunTimeTicks ? Math.round(ch.RunTimeTicks / 10000000) : 1800),
        }));

        return {
          id: String(item.id || item.Id),
          title: item.name || item.title || item.Name || 'Untitled Audiobook',
          author: item.author || item.AlbumArtist || item.Artists?.[0] || 'Unknown Author',
          narrator: item.narrator || item.Narrator,
          duration: durationSec,
          playbackPositionSeconds: positionSec,
          progressPercent,
          year: item.year || item.ProductionYear,
          artworkUrl: this.resolveUrl(item.artwork_url || item.artworkUrl || item.ArtworkUrl) || './sonzra-mark.svg',
          audioUrl: this.resolveUrl(item.stream_url || item.audio_url || item.audioUrl),
          chapters,
        };
      });
    } catch (err) {
      console.warn('Failed to fetch audiobooks from server:', err);
      return MOCK_AUDIOBOOKS;
    }
  }

  async fetchPodcasts(): Promise<PodcastShow[]> {
    if (this.config.demoMode || !this.config.serverUrl) {
      return MOCK_PODCASTS;
    }
    try {
      const cleanUrl = this.config.serverUrl.replace(/\/$/, '');
      const endpoint = this.config.serverConnectionId
        ? `${cleanUrl}/server_connections/${this.config.serverConnectionId}/podcasts`
        : `${cleanUrl}/api/v1/library/podcasts`;
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
          ...(this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {}),
        },
      });
      if (!response.ok) {
        console.warn(`fetchPodcasts returned HTTP ${response.status}`);
        return MOCK_PODCASTS;
      }
      const raw = await response.json();
      const items = Array.isArray(raw) ? raw : (raw.items || raw.podcasts || []);
      if (!items.length) {
        return MOCK_PODCASTS;
      }
      return items.map((item: any) => {
        const episodes = (item.episodes || item.tracks || item.Items || []).map((ep: any, idx: number) => ({
          id: String(ep.id || ep.Id || `ep-${idx + 1}`),
          title: ep.name || ep.title || ep.Name || `Episode ${idx + 1}`,
          showTitle: item.name || item.title,
          description: ep.description || ep.Overview,
          publishDate: ep.publish_date || ep.PremiereDate?.slice(0, 10),
          duration: ep.duration_seconds || (ep.RunTimeTicks ? Math.round(ep.RunTimeTicks / 10000000) : 1800),
          audioUrl: this.resolveUrl(ep.stream_url || ep.audio_url || ep.audioUrl),
          artworkUrl: this.resolveUrl(ep.artwork_url || item.artwork_url) || './sonzra-mark.svg',
        }));

        return {
          id: String(item.id || item.Id),
          title: item.name || item.title || item.Name || 'Untitled Podcast',
          author: item.author || item.AlbumArtist || item.Artists?.[0] || 'Unknown Creator',
          artworkUrl: this.resolveUrl(item.artwork_url || item.artworkUrl || item.ArtworkUrl) || './sonzra-mark.svg',
          description: item.description || item.Overview,
          episodeCount: item.episode_count || episodes.length,
          episodes,
        };
      });
    } catch (err) {
      console.warn('Failed to fetch podcasts from server:', err);
      return MOCK_PODCASTS;
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
