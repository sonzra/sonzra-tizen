import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { Focusable } from '../navigation/Focusable';
import { FocusableButton } from '../components/FocusableButton';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  ArrowLeft,
  ListMusic,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { EqualizerBars } from '../components/EqualizerBars';

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
    isMuted,
    togglePlayPause,
    next,
    prev,
    seek,
    toggleShuffle,
    cycleRepeat,
    toggleMute,
    playTrack,
  } = usePlayer();

  const { goBack } = useSpatialNav();
  const [showQueueDrawer, setShowQueueDrawer] = useState<boolean>(true);

  if (!currentTrack) {
    return (
      <div className="tv-view-content tv-now-playing-empty">
        <div className="tv-empty-icon-wrap">
          <ListMusic size={64} />
        </div>
        <h2>No Track Playing</h2>
        <p>Select an album or track from the library to begin playback.</p>
        <FocusableButton
          focusId="now-playing-empty-back"
          group="now-playing"
          label="Explore Albums"
          variant="primary"
          autoFocus={true}
          onEnter={goBack}
          onClick={goBack}
        />
      </div>
    );
  }

  const isPlaying = playbackStatus === 'playing';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const upcomingTracks = queue.slice(currentIndex + 1);

  return (
    <div className="tv-now-playing-screen" role="main" aria-label="Now Playing">
      {/* Ambient background glow using current artwork */}
      <div
        className="tv-ambient-backdrop"
        style={{ backgroundImage: `url(${currentTrack.artworkUrl})` }}
      />
      <div className="tv-ambient-overlay" />

      {/* Top Bar Navigation */}
      <header className="tv-np-top-bar">
        <FocusableButton
          focusId="np-btn-back"
          group="now-playing-top"
          label="Back"
          icon={<ArrowLeft size={20} />}
          variant="ghost"
          size="sm"
          onEnter={goBack}
          onClick={goBack}
        />
        <div className="tv-np-header-title">NOW PLAYING</div>
        <FocusableButton
          focusId="np-btn-toggle-queue"
          group="now-playing-top"
          label={showQueueDrawer ? 'Hide Queue' : 'Show Queue'}
          icon={<ListMusic size={20} />}
          variant="ghost"
          size="sm"
          onEnter={() => setShowQueueDrawer((prev) => !prev)}
          onClick={() => setShowQueueDrawer((prev) => !prev)}
        />
      </header>

      {/* Main Content: Left Stage (Art & Controls) + Right Stage (Queue) */}
      <div className="tv-np-stage">
        {/* Left Stage */}
        <section className="tv-np-main-stage" aria-label="Current Track Player">
          <div className="tv-np-artwork-container">
            <div className="tv-np-artwork-frame">
              <img
                src={currentTrack.artworkUrl || './sonzra-mark.svg'}
                alt={currentTrack.title}
                className="tv-np-artwork-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                }}
              />
              {isPlaying && (
                <div className="tv-np-floating-eq">
                  <EqualizerBars isPlaying={true} size="md" />
                </div>
              )}
            </div>
          </div>

          <div className="tv-np-meta-container">
            <div className="tv-np-quality-badge">
              <span>{currentTrack.codec || 'FLAC 24-bit'}</span>
              {currentTrack.bitrate && <span className="tv-badge-divider">•</span>}
              {currentTrack.bitrate && <span>{currentTrack.bitrate}</span>}
            </div>

            <h1 className="tv-np-track-title">{currentTrack.title}</h1>
            <h2 className="tv-np-artist-name">{currentTrack.artist}</h2>
            <h3 className="tv-np-album-name">{currentTrack.album}</h3>

            {/* Interactive Timeline Scrubber */}
            <div className="tv-np-scrubber-wrapper">
              <Focusable
                focusId="np-scrubber"
                group="now-playing-controls"
                className="tv-np-scrubber-focusable"
                onArrow={(dir) => {
                  if (dir === 'left') {
                    seek(currentTime - 10);
                    return true;
                  }
                  if (dir === 'right') {
                    seek(currentTime + 10);
                    return true;
                  }
                  return false;
                }}
                onEnter={togglePlayPause}
              >
                {({ isFocused }) => (
                  <div className={`tv-scrubber-track ${isFocused ? 'tv-scrubber-focused' : ''}`}>
                    <div
                      className="tv-scrubber-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                    <div
                      className="tv-scrubber-handle"
                      style={{ left: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </Focusable>

              <div className="tv-np-time-labels">
                <span className="tv-time-current">{formatTime(currentTime)}</span>
                <span className="tv-time-hint">Left / Right to seek ±10s</span>
                <span className="tv-time-duration">{formatTime(duration || currentTrack.duration)}</span>
              </div>
            </div>

            {/* Transport Bar */}
            <div className="tv-np-transport-bar">
              {/* Shuffle */}
              <Focusable
                focusId="np-btn-shuffle"
                group="now-playing-controls"
                className={`tv-transport-btn ${shuffle ? 'tv-transport-active' : ''}`}
                onEnter={toggleShuffle}
                onClick={toggleShuffle}
              >
                {({ isFocused }) => (
                  <div className={`tv-transport-icon-wrap ${isFocused ? 'tv-control-focused' : ''}`}>
                    <Shuffle size={26} />
                  </div>
                )}
              </Focusable>

              {/* Prev */}
              <Focusable
                focusId="np-btn-prev"
                group="now-playing-controls"
                className="tv-transport-btn"
                onEnter={prev}
                onClick={prev}
              >
                {({ isFocused }) => (
                  <div className={`tv-transport-icon-wrap ${isFocused ? 'tv-control-focused' : ''}`}>
                    <SkipBack size={30} />
                  </div>
                )}
              </Focusable>

              {/* Play / Pause (Hero Button) */}
              <Focusable
                focusId="np-btn-playpause"
                group="now-playing-controls"
                autoFocus={true}
                className="tv-transport-btn tv-transport-hero"
                onEnter={togglePlayPause}
                onClick={togglePlayPause}
              >
                {({ isFocused }) => (
                  <div
                    className={`tv-transport-hero-wrap ${
                      isFocused ? 'tv-control-hero-focused' : ''
                    }`}
                  >
                    {isPlaying ? <Pause size={38} /> : <Play size={38} className="tv-play-glyph" />}
                  </div>
                )}
              </Focusable>

              {/* Next */}
              <Focusable
                focusId="np-btn-next"
                group="now-playing-controls"
                className="tv-transport-btn"
                onEnter={next}
                onClick={next}
              >
                {({ isFocused }) => (
                  <div className={`tv-transport-icon-wrap ${isFocused ? 'tv-control-focused' : ''}`}>
                    <SkipForward size={30} />
                  </div>
                )}
              </Focusable>

              {/* Repeat */}
              <Focusable
                focusId="np-btn-repeat"
                group="now-playing-controls"
                className={`tv-transport-btn ${repeat !== 'off' ? 'tv-transport-active' : ''}`}
                onEnter={cycleRepeat}
                onClick={cycleRepeat}
              >
                {({ isFocused }) => (
                  <div className={`tv-transport-icon-wrap ${isFocused ? 'tv-control-focused' : ''}`}>
                    {repeat === 'one' ? <Repeat1 size={26} /> : <Repeat size={26} />}
                  </div>
                )}
              </Focusable>

              {/* Mute toggle */}
              <Focusable
                focusId="np-btn-mute"
                group="now-playing-controls"
                className={`tv-transport-btn ${isMuted ? 'tv-transport-active' : ''}`}
                onEnter={toggleMute}
                onClick={toggleMute}
              >
                {({ isFocused }) => (
                  <div className={`tv-transport-icon-wrap ${isFocused ? 'tv-control-focused' : ''}`}>
                    {isMuted ? <VolumeX size={26} /> : <Volume2 size={26} />}
                  </div>
                )}
              </Focusable>
            </div>
          </div>
        </section>

        {/* Right Stage: Up Next Queue Drawer */}
        {showQueueDrawer && (
          <aside className="tv-np-queue-stage" aria-label="Playback Queue">
            <div className="tv-queue-header">
              <span className="tv-queue-title">UP NEXT IN QUEUE</span>
              <span className="tv-queue-count">{upcomingTracks.length} tracks remaining</span>
            </div>

            <div className="tv-queue-list">
              {upcomingTracks.length === 0 ? (
                <div className="tv-queue-empty">End of queue. Add tracks from library.</div>
              ) : (
                upcomingTracks.map((track, idx) => (
                  <Focusable
                    key={`queue-item-${track.id}-${idx}`}
                    focusId={`np-queue-track-${track.id}-${idx}`}
                    group="now-playing-queue"
                    className="tv-queue-item"
                    onEnter={() => playTrack(track, queue)}
                    onClick={() => playTrack(track, queue)}
                  >
                    {({ isFocused }) => (
                      <div className={`tv-queue-item-inner ${isFocused ? 'tv-track-focused' : ''}`}>
                        <img
                          src={track.artworkUrl || './sonzra-mark.svg'}
                          alt=""
                          className="tv-queue-thumb"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                          }}
                        />
                        <div className="tv-queue-meta">
                          <span className="tv-queue-track-title">{track.title}</span>
                          <span className="tv-queue-track-artist">{track.artist}</span>
                        </div>
                        <span className="tv-queue-track-duration">
                          {formatTime(track.duration)}
                        </span>
                      </div>
                    )}
                  </Focusable>
                ))
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
