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

export const NowPlayingView: React.FC = () => {
  const {
    currentTrack,
    queue,
    currentIndex,
    playbackStatus,
    currentTime,
    duration,
    shuffle,
    repeat,
    togglePlayPause,
    next,
    prev,
    seek,
    toggleShuffle,
    cycleRepeat,
    playTracks,
  } = usePlayer();

  const { goBack } = useSpatialNav();
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);

  // If no track is playing yet, default to the hero track for pristine 10ft cinema display
  const activeTrack =
    currentTrack ||
    MOCK_ALBUMS[0].tracks?.[7] ||
    MOCK_ALBUMS[0].tracks?.[0] || {
      id: 'fallback-track',
      title: 'Celestial Reverie',
      artist: 'The Glass Hours',
      album: 'Echoes in Violet',
      duration: 375,
      artworkUrl: MOCK_ALBUMS[0].artworkUrl,
      fidelity: '96kHz / 24-bit',
      trackNumber: 8,
    };

  const isPlaying = playbackStatus === 'playing';
  const displayDuration = duration > 0 ? duration : activeTrack.duration || 375;
  const progressPercent = displayDuration > 0 ? (currentTime / displayDuration) * 100 : 38;

  // Queue tracks or remaining album tracks
  const upcomingTracks =
    queue.length > 0 && currentIndex >= 0
      ? queue.slice(currentIndex + 1)
      : (MOCK_ALBUMS[0].tracks || []).filter((t) => t.id !== activeTrack.id).slice(0, 5);

  return (
    <div className="relative w-full flex-1 flex flex-col justify-between overflow-hidden select-none pb-28">
      {/* Atmospheric Glow & Cinematic Backdrop */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-24 left-1/4 w-[750px] h-[750px] rounded-full bg-primary-container/20 blur-[160px]"></div>
        <div className="absolute bottom-10 left-10 w-[600px] h-[600px] rounded-full bg-secondary-container/15 blur-[170px]"></div>
        <div className="absolute top-1/3 right-1/4 w-[650px] h-[650px] rounded-full bg-tertiary-container/15 blur-[180px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(14,14,20,0.85)_100%)]"></div>
      </div>

      {/* Top Ambient Header / Metadata & Audio Format Bar */}
      <header className="relative z-20 flex items-center justify-between w-full h-14 shrink-0 pt-1">
        {/* Left Indicators */}
        <div className="flex items-center gap-3">
          <Focusable
            focusId="np-btn-back"
            group="now-playing-header"
            className="rounded-full cursor-pointer"
            onEnter={goBack}
            onClick={goBack}
          >
            {({ isFocused }) => (
              <button
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isFocused
                    ? 'bg-surface-container-high ring-2 ring-secondary text-secondary scale-105'
                    : 'bg-surface-container-high/80 text-on-surface-variant hover:text-on-surface border border-outline-variant/30'
                }`}
                title="Back"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
            )}
          </Focusable>

          <div className="flex items-center gap-2.5 bg-surface-container-high/90 border border-outline-variant/30 backdrop-blur-xl px-4 py-1.5 rounded-full shadow-lg">
            <span
              className={`w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_#49dcca] ${
                isPlaying ? 'animate-pulse' : ''
              }`}
            ></span>
            <span className="font-label-md text-sm font-bold tracking-wider text-secondary uppercase">
              Now Playing · 10ft Cinema
            </span>
          </div>
          <div className="flex items-center gap-2 bg-surface-container/70 border border-outline-variant/20 backdrop-blur-md px-4 py-1.5 rounded-full text-on-surface-variant font-label-md text-sm">
            <span className="material-symbols-outlined text-lg text-primary">cast_connected</span>
            <span className="font-medium text-on-surface">Living Room Samsung Q90C</span>
            <span className="text-xs text-outline bg-surface-container-highest px-2 py-0.5 rounded-md font-mono">
              eARC
            </span>
          </div>
        </div>

        {/* Right Audio Fidelity Badges */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-surface-container-high/90 border border-secondary/30 px-3.5 py-1.5 rounded-full text-secondary font-label-md text-xs font-semibold shadow-sm">
            <span className="material-symbols-outlined text-base">graphic_eq</span>
            <span>{activeTrack.fidelity || 'FLAC 96kHz / 24-bit'}</span>
          </div>
          <div className="bg-surface-container-high/80 border border-outline-variant/30 px-3 py-1.5 rounded-full text-on-surface font-label-md text-xs font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-primary">verified</span>
            <span>Master Audio</span>
          </div>
          <div className="bg-surface-container/70 border border-outline-variant/20 px-3 py-1.5 rounded-full text-on-surface-variant font-label-md text-xs">
            Stereo PCM
          </div>
        </div>
      </header>

      {/* Center Stage 3-Column 16:9 Landscape Layout */}
      <main className="relative z-10 grid grid-cols-12 gap-8 items-center flex-1 my-auto w-full min-h-0 py-6">
        {/* Column 1 (Left 5 cols): Vinyl Sleeve Stage & Real-time Visualizer */}
        <div className="col-span-12 lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-[340px] h-[340px] xl:w-[400px] xl:h-[400px] flex items-center justify-center">
            {/* Back Vinyl Record with Grooves and Label */}
            <div
              className={`absolute -right-10 xl:-right-12 w-[320px] h-[320px] xl:w-[370px] xl:h-[370px] rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex items-center justify-center border border-white/5 ${
                isPlaying ? 'animate-spin-vinyl' : ''
              }`}
              style={{
                background:
                  'radial-gradient(circle, #2a2930 0%, #0e0e14 42%, #1b1b21 50%, #0e0e14 62%, #1b1b21 72%, #0e0e14 100%)',
              }}
            >
              {/* Grooves */}
              <div className="absolute inset-3 rounded-full border border-outline-variant/15 pointer-events-none"></div>
              <div className="absolute inset-8 rounded-full border border-outline-variant/20 pointer-events-none"></div>
              <div className="absolute inset-16 rounded-full border border-outline-variant/15 pointer-events-none"></div>
              <div className="absolute inset-24 rounded-full border border-outline-variant/20 pointer-events-none"></div>

              {/* Center Vinyl Label */}
              <div className="w-32 h-32 xl:w-36 xl:h-36 rounded-full overflow-hidden shadow-inner flex items-center justify-center relative border-4 border-surface-container-lowest bg-gradient-to-tr from-primary-container to-secondary">
                <span className="text-[9px] font-extrabold text-surface-container-lowest uppercase tracking-wider font-mono">
                  SIDE A · 96kHz
                </span>
                <div className="absolute w-5 h-5 bg-surface-container-lowest rounded-full shadow-inner border border-surface-variant"></div>
              </div>
            </div>

            {/* Front Sleeve Album Art */}
            <div className="relative z-10 w-[310px] h-[310px] xl:w-[360px] xl:h-[360px] rounded-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] bg-surface-container-high border border-outline-variant/30">
              <img
                className="w-full h-full object-cover"
                src={activeTrack.artworkUrl || MOCK_ALBUMS[0].artworkUrl}
                alt={activeTrack.title}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-surface-container-lowest/80 via-transparent to-primary/20 pointer-events-none"></div>
              {/* Sleek Tag Badge */}
              <div className="absolute bottom-4 left-4 bg-surface-container-lowest/85 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-outline-variant/30 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_6px_#49dcca]"></span>
                <span className="text-xs font-mono font-bold tracking-widest text-on-surface uppercase">
                  Studio Master · FLAC
                </span>
              </div>
            </div>
          </div>

          {/* Animated Audio Spectrum Visualizer */}
          <div className="w-[310px] xl:w-[360px] h-12 mt-6 px-4 bg-surface-container-low/60 border border-outline-variant/25 backdrop-blur-md rounded-xl flex items-end justify-between gap-1.5 pb-2.5 pt-2">
            {[45, 95, 35, 75, 88, 55, 68, 92, 40, 70, 35, 85, 50, 60, 38, 25].map((h, i) => (
              <div
                key={i}
                className="w-2 rounded-full bg-secondary transition-all duration-300"
                style={{
                  height: isPlaying ? `${h}%` : `${Math.max(25, Math.round(h * 0.45))}%`,
                  opacity: isPlaying ? 1 : 0.65,
                  boxShadow: isPlaying ? '0 0 8px rgba(73,220,202,0.7)' : undefined,
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Column 2 (Center 4 cols): Hero Track Metadata, Scrubbing, & 10ft Remote Controls */}
        <div className="col-span-12 lg:col-span-4 flex flex-col justify-center px-2">
          {/* Release Context */}
          <div className="flex items-center gap-2.5 mb-2 font-label-md text-sm text-on-surface-variant font-medium">
            <span className="text-secondary font-bold uppercase tracking-widest bg-secondary/10 px-2.5 py-0.5 rounded-md border border-secondary/20">
              Track {String(activeTrack.trackNumber || 1).padStart(2, '0')}
            </span>
            <span className="text-outline">•</span>
            <span className="truncate">{activeTrack.album}</span>
          </div>

          {/* Song Title (Widescreen 10ft Scale) */}
          <h1 className="text-4xl xl:text-5xl font-extrabold text-on-surface tracking-tight mb-2 leading-tight drop-shadow-md font-serif-title">
            {activeTrack.title}
          </h1>

          {/* Artist Credit */}
          <div className="flex items-center flex-wrap gap-2 mb-6">
            <span className="text-2xl font-bold text-primary">{activeTrack.artist}</span>
          </div>

          {/* Large Scrub Progress Bar for TV */}
          <div className="w-full flex flex-col gap-2 mb-8">
            <Focusable
              focusId="np-scrub-bar"
              group="now-playing-controls"
              className="w-full cursor-pointer py-2"
              onEnter={() => setIsScrubbing((prev) => !prev)}
              onClick={() => setIsScrubbing((prev) => !prev)}
              onBlur={() => setIsScrubbing(false)}
              onArrow={(direction) => {
                if (!isScrubbing) return false;
                if (direction === 'left') {
                  seek(Math.max(0, currentTime - 10));
                  return true;
                }
                if (direction === 'right') {
                  seek(Math.min(displayDuration, currentTime + 10));
                  return true;
                }
                return false;
              }}
            >
              {({ isFocused }) => (
                <div
                  className={`relative w-full h-3.5 bg-surface-container-highest rounded-full overflow-visible flex items-center transition-all ${
                    isFocused
                      ? isScrubbing
                        ? 'ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.9)] animate-pulse'
                        : 'ring-2 ring-secondary/80 shadow-[0_0_12px_rgba(73,220,202,0.5)]'
                      : ''
                  }`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-primary-container via-secondary to-secondary rounded-full relative"
                    style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                  >
                    {/* Playhead with Glow */}
                    <div
                      className={`absolute -right-3.5 -top-2 w-7 h-7 rounded-full bg-white shadow-[0_0_16px_#49dcca] flex items-center justify-center transition-transform ${
                        isScrubbing ? 'scale-125' : ''
                      }`}
                    >
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          isScrubbing ? 'bg-secondary animate-ping' : 'bg-secondary'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </Focusable>

            {/* Timestamps & Scrub State Hint */}
            <div className="flex justify-between items-center text-sm font-label-md px-1 text-on-surface-variant">
              <span className="text-secondary font-bold font-mono">
                {formatTime(currentTime || 0)}
              </span>
              {isScrubbing ? (
                <span className="text-[11px] font-mono text-secondary uppercase tracking-wider font-semibold animate-pulse">
                  Seek Mode Active • Press Enter to lock
                </span>
              ) : (
                <span className="text-[11px] font-mono text-outline">
                  Press Enter to Seek
                </span>
              )}
              <span className="font-mono text-outline">
                {formatTime(displayDuration)}
              </span>
            </div>
          </div>

          {/* Large 10-Foot Remote Transport Controls */}
          <div className="flex items-center justify-between xl:justify-start xl:gap-3 flex-wrap">
            {/* Shuffle */}
            <Focusable
              focusId="np-ctrl-shuffle"
              group="now-playing-controls"
              className="rounded-full cursor-pointer"
              onEnter={toggleShuffle}
              onClick={toggleShuffle}
            >
              {({ isFocused }) => (
                <button
                  className={`w-12 h-12 rounded-full border border-outline-variant/30 flex items-center justify-center transition-all shadow-md cursor-pointer ${
                    isFocused
                      ? 'bg-surface-container-high ring-2 ring-secondary text-secondary scale-110'
                      : shuffle
                      ? 'bg-surface-container-high text-secondary border-secondary/40'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Shuffle"
                >
                  <span className="material-symbols-outlined text-2xl">shuffle</span>
                </button>
              )}
            </Focusable>

            {/* Previous Track */}
            <Focusable
              focusId="np-ctrl-prev"
              group="now-playing-controls"
              className="rounded-full cursor-pointer"
              onEnter={prev}
              onClick={prev}
            >
              {({ isFocused }) => (
                <button
                  className={`w-12 h-12 rounded-full border border-outline-variant/30 flex items-center justify-center transition-all shadow-md cursor-pointer ${
                    isFocused
                      ? 'bg-surface-container-high ring-2 ring-secondary text-secondary scale-110'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                  }`}
                  title="Previous"
                >
                  <span className="material-symbols-outlined text-3xl">skip_previous</span>
                </button>
              )}
            </Focusable>

            {/* Hero Play/Pause Button */}
            <Focusable
              focusId="np-ctrl-play"
              group="now-playing-controls"
              className="rounded-full cursor-pointer"
              onEnter={togglePlayPause}
              onClick={togglePlayPause}
            >
              {({ isFocused }) => (
                <button
                  className={`w-16 h-16 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-[0_0_35px_rgba(122,90,248,0.55)] transition-all cursor-pointer relative ${
                    isFocused ? 'ring-4 ring-secondary scale-110 shadow-[0_0_40px_rgba(73,220,202,0.8)]' : ''
                  }`}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  <span
                    className="material-symbols-outlined text-4xl text-on-primary-container"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>
              )}
            </Focusable>

            {/* Next Track */}
            <Focusable
              focusId="np-ctrl-next"
              group="now-playing-controls"
              className="rounded-full cursor-pointer"
              onEnter={next}
              onClick={next}
            >
              {({ isFocused }) => (
                <button
                  className={`w-12 h-12 rounded-full border border-outline-variant/30 flex items-center justify-center transition-all shadow-md cursor-pointer ${
                    isFocused
                      ? 'bg-surface-container-high ring-2 ring-secondary text-secondary scale-110'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                  }`}
                  title="Next"
                >
                  <span className="material-symbols-outlined text-3xl">skip_next</span>
                </button>
              )}
            </Focusable>

            {/* Repeat */}
            <Focusable
              focusId="np-ctrl-repeat"
              group="now-playing-controls"
              className="rounded-full cursor-pointer"
              onEnter={cycleRepeat}
              onClick={cycleRepeat}
            >
              {({ isFocused }) => (
                <button
                  className={`w-12 h-12 rounded-full border border-outline-variant/30 flex items-center justify-center transition-all shadow-md cursor-pointer ${
                    isFocused
                      ? 'bg-surface-container-high ring-2 ring-secondary text-secondary scale-110'
                      : repeat !== 'off'
                      ? 'bg-surface-container-high text-secondary border-secondary/40'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Repeat"
                >
                  <span className="material-symbols-outlined text-2xl">
                    {repeat === 'one' ? 'repeat_one' : 'repeat'}
                  </span>
                </button>
              )}
            </Focusable>

            {/* Favorite */}
            <Focusable
              focusId="np-ctrl-fav"
              group="now-playing-controls"
              className="rounded-full cursor-pointer"
              onEnter={() => setIsFavorite(!isFavorite)}
              onClick={() => setIsFavorite(!isFavorite)}
            >
              {({ isFocused }) => (
                <button
                  className={`w-12 h-12 rounded-full border border-outline-variant/30 flex items-center justify-center transition-all shadow-md cursor-pointer ${
                    isFocused
                      ? 'bg-surface-container-high ring-2 ring-secondary text-error scale-110'
                      : isFavorite
                      ? 'bg-surface-container-high text-error'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Favorite"
                >
                  <span
                    className="material-symbols-outlined text-2xl"
                    style={{ fontVariationSettings: isFavorite ? '"FILL" 1' : undefined }}
                  >
                    {isFavorite ? 'favorite' : 'favorite_border'}
                  </span>
                </button>
              )}
            </Focusable>
          </div>
        </div>

        {/* Column 3 (Right 3 cols): Expansive 'Up Next' Queue Shelf */}
        <div className="col-span-12 lg:col-span-3 h-full flex flex-col justify-start bg-surface-container-low/75 border border-outline-variant/30 backdrop-blur-2xl p-5 rounded-3xl shadow-2xl">
          {/* Shelf Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-2xl">queue_music</span>
                <h2 className="text-xl font-bold text-on-surface">Up Next</h2>
              </div>
              <span className="bg-surface-container-highest text-secondary text-xs font-semibold px-2.5 py-0.5 rounded-full border border-secondary/20">
                {upcomingTracks.length} in Queue
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">Continuous playback from album shelf</p>
          </div>

          {/* Queue Track List */}
          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[380px]">
            {upcomingTracks.map((track) => {
              const focusId = `np-queue-${track.id}`;

              const handleSelectQueueTrack = () => {
                if (queue.length > 0) {
                  const targetIdx = queue.findIndex((t) => t.id === track.id);
                  if (targetIdx >= 0) {
                    playTracks(queue, targetIdx);
                    return;
                  }
                }
                const fullList = [activeTrack, ...upcomingTracks];
                const targetIdx = fullList.findIndex((t) => t.id === track.id);
                playTracks(fullList, targetIdx >= 0 ? targetIdx : 0);
              };

              return (
                <Focusable
                  key={track.id}
                  focusId={focusId}
                  group="now-playing-queue"
                  className="rounded-2xl cursor-pointer"
                  onEnter={handleSelectQueueTrack}
                  onClick={handleSelectQueueTrack}
                >
                  {({ isFocused }) => (
                    <div
                      className={`flex items-center justify-between p-2 rounded-2xl transition-all cursor-pointer ${
                        isFocused
                          ? 'bg-surface-container-high ring-2 ring-secondary shadow-[0_0_15px_rgba(73,220,202,0.4)] scale-102'
                          : 'bg-surface-container/80 border border-outline-variant/20 hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-surface-container-highest shrink-0 shadow-md">
                          <img
                            className="w-full h-full object-cover"
                            src={track.artworkUrl || activeTrack.artworkUrl}
                            alt={track.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                            }}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`font-bold text-xs truncate ${
                              isFocused ? 'text-secondary' : 'text-on-surface'
                            }`}
                          >
                            {track.title}
                          </span>
                          <span className="text-[11px] text-on-surface-variant truncate">
                            {track.artist}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-outline ml-2 shrink-0">
                        {formatTime(track.duration)}
                      </span>
                    </div>
                  )}
                </Focusable>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};
