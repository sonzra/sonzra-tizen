import React from 'react';
import { Play, Pause, SkipForward, Maximize2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { Focusable } from '../navigation/Focusable';
import { EqualizerBars } from './EqualizerBars';

export const MiniPlayer: React.FC = () => {
  const { currentTrack, playbackStatus, currentTime, duration, togglePlayPause, next } = usePlayer();
  const { activeView, goToView } = useSpatialNav();

  // Hide mini player if nothing is loaded or if already in full now-playing view
  if (!currentTrack || activeView === 'now-playing') {
    return null;
  }

  const isPlaying = playbackStatus === 'playing';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="tv-mini-player-container" role="region" aria-label="Persistent Mini Player">
      {/* Progress track at top of mini player */}
      <div className="tv-mini-progress-bar">
        <div className="tv-mini-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="tv-mini-player-body">
        {/* Track identity (Clicking opens Full Now Playing) */}
        <Focusable
          focusId="mini-player-info"
          group="mini-player"
          className="tv-mini-info-focusable"
          onEnter={() => goToView('now-playing')}
          onClick={() => goToView('now-playing')}
        >
          {({ isFocused }) => (
            <div className={`tv-mini-track-info ${isFocused ? 'tv-mini-track-focused' : ''}`}>
              <div className="tv-mini-art-wrap">
                <img
                  src={currentTrack.artworkUrl || './sonzra-mark.svg'}
                  alt=""
                  className="tv-mini-artwork"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                  }}
                />
                {isPlaying && (
                  <div className="tv-mini-eq-overlay">
                    <EqualizerBars isPlaying={true} size="sm" />
                  </div>
                )}
              </div>
              <div className="tv-mini-meta">
                <div className="tv-mini-title">{currentTrack.title}</div>
                <div className="tv-mini-artist">{currentTrack.artist} • {currentTrack.album}</div>
              </div>
              <Maximize2 size={18} className="tv-mini-expand-icon" />
            </div>
          )}
        </Focusable>

        {/* Transport Actions */}
        <div className="tv-mini-controls">
          <Focusable
            focusId="mini-btn-playpause"
            group="mini-player"
            className="tv-mini-btn"
            onEnter={togglePlayPause}
            onClick={togglePlayPause}
          >
            {({ isFocused }) => (
              <div className={`tv-mini-btn-inner ${isFocused ? 'tv-control-focused' : ''}`}>
                {isPlaying ? <Pause size={22} /> : <Play size={22} />}
              </div>
            )}
          </Focusable>

          <Focusable
            focusId="mini-btn-next"
            group="mini-player"
            className="tv-mini-btn"
            onEnter={next}
            onClick={next}
          >
            {({ isFocused }) => (
              <div className={`tv-mini-btn-inner ${isFocused ? 'tv-control-focused' : ''}`}>
                <SkipForward size={22} />
              </div>
            )}
          </Focusable>
        </div>
      </div>
    </div>
  );
};
