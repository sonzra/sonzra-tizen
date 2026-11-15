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

export interface PlaylistCollaborator {
  id: string;
  displayName: string;
  username?: string;
  email?: string;
}

export interface Playlist {
  id: string;
  name: string;
  artworkUrl?: string;
  trackCount?: number;
  duration?: number; // total in seconds
  isCollaborative?: boolean;
  isSharedWithMe?: boolean;
  isOwner?: boolean;
  collaboratorName?: string; // e.g. "Sarah" or "Curated with Sarah"
  collaborators?: PlaylistCollaborator[];
  tracks?: Track[];
}

export interface AudiobookChapter {
  id: string;
  title: string;
  startPositionSeconds: number;
  duration: number; // in seconds
}

export interface Audiobook {
  id: string;
  title: string;
  author: string;
  narrator?: string;
  duration: number; // in seconds
  playbackPositionSeconds?: number;
  progressPercent?: number;
  artworkUrl: string;
  audioUrl?: string;
  year?: number;
  chapters?: AudiobookChapter[];
}

export interface PodcastEpisode {
  id: string;
  title: string;
  showTitle?: string;
  description?: string;
  publishDate?: string;
  duration: number; // in seconds
  playbackPositionSeconds?: number;
  progressPercent?: number;
  audioUrl?: string;
  artworkUrl?: string;
}

export interface PodcastShow {
  id: string;
  title: string;
  author: string;
  artworkUrl: string;
  description?: string;
  episodeCount?: number;
  episodes?: PodcastEpisode[];
}

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
export type RepeatMode = 'off' | 'all' | 'one';

export interface LyricLine {
  text: string;
  start?: number | null; // seconds timestamp
}

export interface LyricsData {
  available: boolean;
  synchronized: boolean;
  lines: LyricLine[];
}

export interface ServerConfig {
  serverUrl: string;
  serverConnectionId: string;
  authToken?: string;
  demoMode: boolean;
  serverName?: string;
}
