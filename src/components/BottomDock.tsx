import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { Focusable } from '../navigation/Focusable';
import { MOCK_ALBUMS } from '../services/mockData';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const BottomDock: React.FC = () => {
  const {
    currentTrack,
    playbackStatus,
    currentTime,
    duration,
    shuffle,
    repeat,
    togglePlayPause,
    next,
    prev,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const { activeView, goToView } = useSpatialNav();
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  // Hide dock if in full now-playing view
  if (activeView === 'now-playing') {
    return null;
  }

  // Fallback to active album track if nothing currently playing
  const displayTrack =
    currentTrack ||
    MOCK_ALBUMS[0].tracks?.[7] ||
    MOCK_ALBUMS[0].tracks?.[0] || {
      id: 'fallback',
      title: 'Solaris Reflections',
      artist: 'Aethelgard Ambient',
      album: 'Solaris',
      duration: 310,
      artworkUrl: MOCK_ALBUMS[0].artworkUrl,
    };

  const isPlaying = playbackStatus === 'playing';
  const displayDuration = duration > 0 ? duration : displayTrack.duration || 310;
  const progressPercent = displayDuration > 0 ? (currentTime / displayDuration) * 100 : 66;

  return (
    <aside
      className="fixed bottom-0 left-24 right-0 h-24 bg-surface-container-lowest/95 backdrop-blur-2xl z-40 px-10 flex items-center justify-between shadow-[0_-2px_12px_rgba(0,0,0,0.35)] border-t border-white/[0.04] select-none"
      role="region"
      aria-label="Persistent Mini Player Dock"
    >
      {/* Left Track Info */}
      <Focusable
        focusId="dock-track-info"
        group="bottom-dock"
        className="rounded-xl cursor-pointer"
        onEnter={() => goToView('now-playing')}
        onClick={() => goToView('now-playing')}
      >
        {({ isFocused }) => (
          <div
            className={`flex items-center gap-4 min-w-[280px] p-1.5 rounded-xl transition-all ${
              isFocused ? 'ring-2 ring-secondary shadow-[0_0_15px_rgba(73,220,202,0.4)] scale-102' : ''
            }`}
          >
            <div className="w-14 h-14 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden ring-1 ring-outline-variant/30 shrink-0">
              <img
                src={displayTrack.artworkUrl || MOCK_ALBUMS[0].artworkUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate max-w-[200px]">
                {displayTrack.title}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant truncate max-w-[200px]">
                {displayTrack.artist}
              </span>
            </div>
          </div>
        )}
      </Focusable>

      {/* Center Transport & Scrub bar */}
      <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl px-6">
        <div className="flex items-center gap-4">
          {/* Shuffle */}
          <Focusable
            focusId="dock-btn-shuffle"
            group="bottom-dock"
            className="rounded-full cursor-pointer"
            onEnter={toggleShuffle}
            onClick={toggleShuffle}
          >
            {({ isFocused }) => (
              <button
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isFocused
                    ? 'ring-2 ring-secondary text-secondary scale-110'
                    : shuffle
                    ? 'text-secondary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Shuffle"
              >
                <span className="material-symbols-outlined text-[22px]">shuffle</span>
              </button>
            )}
          </Focusable>

          {/* Previous */}
          <Focusable
            focusId="dock-btn-prev"
            group="bottom-dock"
            className="rounded-full cursor-pointer"
            onEnter={prev}
            onClick={prev}
          >
            {({ isFocused }) => (
              <button
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isFocused
                    ? 'ring-2 ring-secondary text-secondary scale-110'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Previous"
              >
                <span className="material-symbols-outlined text-[24px]">skip_previous</span>
              </button>
            )}
          </Focusable>

          {/* Play / Pause Hero */}
          <Focusable
            focusId="dock-btn-play"
            group="bottom-dock"
            className="rounded-full cursor-pointer"
            onEnter={togglePlayPause}
            onClick={togglePlayPause}
          >
            {({ isFocused }) => (
              <button
                className={`w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-[0_0_16px_rgba(122,90,248,0.5)] transition-all cursor-pointer ${
                  isFocused ? 'ring-2 ring-secondary scale-110 shadow-[0_0_20px_rgba(73,220,202,0.8)]' : ''
                }`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                <span
                  className="material-symbols-outlined text-[28px]"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
            )}
          </Focusable>

          {/* Next */}
          <Focusable
            focusId="dock-btn-next"
            group="bottom-dock"
            className="rounded-full cursor-pointer"
            onEnter={next}
            onClick={next}
          >
            {({ isFocused }) => (
              <button
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isFocused
                    ? 'ring-2 ring-secondary text-secondary scale-110'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Next"
              >
                <span className="material-symbols-outlined text-[24px]">skip_next</span>
              </button>
            )}
          </Focusable>

          {/* Repeat */}
          <Focusable
            focusId="dock-btn-repeat"
            group="bottom-dock"
            className="rounded-full cursor-pointer"
            onEnter={cycleRepeat}
            onClick={cycleRepeat}
          >
            {({ isFocused }) => (
              <button
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isFocused
                    ? 'ring-2 ring-secondary text-secondary scale-110'
                    : repeat !== 'off'
                    ? 'text-secondary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Repeat"
              >
                <span className="material-symbols-outlined text-[22px]">
                  {repeat === 'one' ? 'repeat_one' : 'repeat'}
                </span>
              </button>
            )}
          </Focusable>
        </div>

        {/* Scrub line with timestamps */}
        <div className="w-full flex items-center gap-3">
          <span className="font-label-md text-label-md text-outline font-mono text-[13px]">
            {formatTime(currentTime || 204)}
          </span>
          <div className="relative flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary rounded-full shadow-[0_0_10px_rgba(73,220,202,0.7)]"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            ></div>
          </div>
          <span className="font-label-md text-label-md text-outline font-mono text-[13px]">
            {formatTime(displayDuration)}
          </span>
        </div>
      </div>

      {/* Right Badges and Buttons */}
      <div className="flex items-center gap-3 min-w-[200px] justify-end">
        <div className="px-2.5 py-0.5 rounded border border-secondary text-secondary font-label-md text-xs font-bold tracking-wider">
          Hi-Res FLAC
        </div>

        {/* Favorite */}
        <Focusable
          focusId="dock-btn-fav"
          group="bottom-dock"
          className="rounded-full cursor-pointer"
          onEnter={() => setIsFavorite(!isFavorite)}
          onClick={() => setIsFavorite(!isFavorite)}
        >
          {({ isFocused }) => (
            <button
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isFocused
                  ? 'ring-2 ring-secondary text-error scale-110'
                  : isFavorite
                  ? 'text-error'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Favorite"
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: isFavorite ? '"FILL" 1' : undefined }}
              >
                {isFavorite ? 'favorite' : 'favorite_border'}
              </span>
            </button>
          )}
        </Focusable>

        {/* Open Now Playing Queue */}
        <Focusable
          focusId="dock-btn-queue"
          group="bottom-dock"
          className="rounded-full cursor-pointer"
          onEnter={() => goToView('now-playing')}
          onClick={() => goToView('now-playing')}
        >
          {({ isFocused }) => (
            <button
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isFocused
                  ? 'ring-2 ring-secondary text-secondary scale-110'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Now Playing Cinema"
            >
              <span className="material-symbols-outlined text-[22px]">queue_music</span>
            </button>
          )}
        </Focusable>
      </div>
    </aside>
  );
};
