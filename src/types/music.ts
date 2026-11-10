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
  sampleRate?: string;
  bitDepth?: string;
  fidelity?: string; // e.g. "96kHz / 24-bit" or "FLAC 24b/96k"
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
  codecBadge?: string; // e.g. "FLAC 96kHz / 24-bit" or "DSD64 2.8MHz" or "24-BIT"
  masterBadge?: string; // e.g. "MASTER MQA" or "MQA MASTER"
  fileSize?: string; // e.g. "1.42 GB"
  isNew?: boolean;
  progressPercent?: number; // e.g. 68
  remainingTime?: string; // e.g. "38:12 remaining"
  currentTrackIndex?: number; // e.g. 8
  currentTrackTitle?: string; // e.g. "Celestial Reverie"
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
