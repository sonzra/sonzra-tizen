export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  duration: number; // in seconds
  trackNumber?: number;
  discNumber?: number;
  year?: number;
  artworkUrl?: string;
  audioUrl?: string;
  codec?: string;
  bitrate?: string;
  isFavorite?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  year?: number;
  genre?: string;
  artworkUrl: string;
  trackCount: number;
  duration?: number; // total in seconds
  tracks?: Track[];
}

export interface Artist {
  id: string;
  name: string;
  genre?: string;
  artworkUrl: string;
  albumCount: number;
  bio?: string;
  topTracks?: Track[];
  albums?: Album[];
}

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
export type RepeatMode = 'off' | 'all' | 'one';

export interface ServerConfig {
  serverUrl: string;
  serverConnectionId: string;
  authToken?: string;
  demoMode: boolean;
  serverName?: string;
}
