import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { PlaybackStatus, RepeatMode, Track, Album } from '../types/music';
import { SonzraApiClient } from '../services/sonzraApi';
import { useServer } from './ServerContext';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';

interface PlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  history: Track[];
  currentIndex: number;
  playbackStatus: PlaybackStatus;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  isMuted: boolean;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  playAlbum: (album: Album, startTrackId?: string, shuffle?: boolean) => void;
  playTracks: (tracks: Track[], startIndex?: number, shuffle?: boolean) => void;
  addToQueue: (trackOrTracks: Track | Track[]) => void;
  togglePlayPause: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config } = useServer();
  const { registerMediaHandler } = useSpatialNav();

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [volume, setVolumeState] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const apiClientRef = useRef(new SonzraApiClient(config));

  // Sync API client with server configuration changes
  useEffect(() => {
    apiClientRef.current.updateConfig(config);
  }, [config]);

  // Initialize HTML5 Audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onPlaying = () => {
      setPlaybackStatus('playing');
    };

    const onPause = () => {
      setPlaybackStatus((prev) => (prev === 'loading' ? prev : 'paused'));
    };

    const onWaiting = () => {
      setPlaybackStatus('loading');
    };

    const onError = (e: Event) => {
      console.warn('Audio playback error:', e);
      setPlaybackStatus('error');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('error', onError);
    };
  }, []);

  const playIndex = useCallback(
    (index: number, queueList?: Track[]) => {
      const activeQueue = queueList || queue;
      if (index < 0 || index >= activeQueue.length) {
        setPlaybackStatus('idle');
        return;
      }

      const track = activeQueue[index];
      setCurrentTrack(track);
      setCurrentIndex(index);
      setCurrentTime(0);
      setDuration(track.duration || 0);
      setPlaybackStatus('loading');

      if (audioRef.current) {
        const audioUrl = apiClientRef.current.getAudioUrl(track);
        audioRef.current.src = audioUrl;
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .then(() => setPlaybackStatus('playing'))
          .catch((err) => {
            console.warn('Playback play() was rejected:', err);
            // Autoplay policies or format issues
            setPlaybackStatus('paused');
          });
      }
    },
    [queue]
  );

  const next = useCallback(() => {
    if (repeat === 'one' && currentTrack) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    if (queue.length === 0) return;

    if (currentTrack) {
      setHistory((prev) => [...prev, currentTrack]);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      playIndex(nextIndex);
    } else if (repeat === 'all') {
      playIndex(0);
    } else {
      setPlaybackStatus('paused');
    }
  }, [repeat, currentTrack, queue, currentIndex, playIndex]);

  const prev = useCallback(() => {
    // If more than 3 seconds in, restart track
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (history.length > 0) {
      const prevTrack = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      const idx = queue.findIndex((t) => t.id === prevTrack.id);
      if (idx !== -1) {
        playIndex(idx);
      } else {
        playTrack(prevTrack);
      }
    } else if (currentIndex > 0) {
      playIndex(currentIndex - 1);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, [history, currentIndex, queue, playIndex]);

  // Handle ended event using current state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      next();
    };

    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('ended', onEnded);
    };
  }, [next]);

  const playTrack = useCallback(
    (track: Track, newQueue?: Track[]) => {
      const q = newQueue || [track];
      const idx = q.findIndex((t) => t.id === track.id);
      setQueue(q);
      playIndex(idx >= 0 ? idx : 0, q);
    },
    [playIndex]
  );

  const playTracks = useCallback(
    (tracks: Track[], startIndex = 0, doShuffle = false) => {
      if (!tracks || tracks.length === 0) return;
      let finalTracks = [...tracks];
      let finalIndex = startIndex;

      if (doShuffle) {
        const startTrack = finalTracks[startIndex];
        const rest = finalTracks.filter((_, i) => i !== startIndex);
        // Shuffle remaining
        for (let i = rest.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rest[i], rest[j]] = [rest[j], rest[i]];
        }
        finalTracks = [startTrack, ...rest];
        finalIndex = 0;
        setShuffle(true);
      }

      setQueue(finalTracks);
      playIndex(finalIndex, finalTracks);
    },
    [playIndex]
  );

  const playAlbum = useCallback(
    async (album: Album, startTrackId?: string, doShuffle = false) => {
      let tracks = album.tracks;
      if (!tracks || tracks.length === 0) {
        try {
          const fullAlbum = await apiClientRef.current.fetchAlbum(album.id);
          tracks = fullAlbum?.tracks || [];
        } catch (err) {
          console.warn('Failed to load album tracks for playback:', err);
        }
      }
      if (!tracks || tracks.length === 0) return;
      const startIndex = startTrackId
        ? tracks.findIndex((t) => t.id === startTrackId)
        : 0;
      playTracks(tracks, Math.max(0, startIndex), doShuffle);
    },
    [playTracks]
  );

  const addToQueue = useCallback((trackOrTracks: Track | Track[]) => {
    const items = Array.isArray(trackOrTracks) ? trackOrTracks : [trackOrTracks];
    setQueue((prev) => [...prev, ...items]);
  }, []);

  const play = useCallback(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play().then(() => setPlaybackStatus('playing')).catch(console.warn);
    } else if (queue.length > 0) {
      playIndex(0);
    }
  }, [currentTrack, queue, playIndex]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaybackStatus('paused');
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (playbackStatus === 'playing') {
      pause();
    } else {
      play();
    }
  }, [playbackStatus, pause, play]);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) {
      const clamped = Math.max(0, Math.min(seconds, audioRef.current.duration || 0));
      audioRef.current.currentTime = clamped;
      setCurrentTime(clamped);
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const nextVal = !prev;
      if (nextVal && queue.length > 1 && currentTrack) {
        // Reorder upcoming tracks
        const before = queue.slice(0, currentIndex + 1);
        const upcoming = queue.slice(currentIndex + 1);
        for (let i = upcoming.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
        }
        setQueue([...before, ...upcoming]);
      }
      return nextVal;
    });
  }, [queue, currentIndex, currentTrack]);

  const cycleRepeat = useCallback(() => {
    setRepeat((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMute = !prev;
      if (audioRef.current) {
        audioRef.current.muted = nextMute;
      }
      return nextMute;
    });
  }, []);

  // Hook into Tizen hardware remote media keys
  useEffect(() => {
    const unregister = registerMediaHandler((action) => {
      switch (action) {
        case 'play':
          play();
          break;
        case 'pause':
          pause();
          break;
        case 'playpause':
          togglePlayPause();
          break;
        case 'next':
          next();
          break;
        case 'prev':
          prev();
          break;
        case 'stop':
          pause();
          break;
      }
    });

    return unregister;
  }, [registerMediaHandler, play, pause, togglePlayPause, next, prev]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        history,
        currentIndex,
        playbackStatus,
        currentTime,
        duration,
        shuffle,
        repeat,
        volume,
        isMuted,
        playTrack,
        playAlbum,
        playTracks,
        addToQueue,
        togglePlayPause,
        play,
        pause,
        next,
        prev,
        seek,
        toggleShuffle,
        cycleRepeat,
        setVolume,
        toggleMute,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
