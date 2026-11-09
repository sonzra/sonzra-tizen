import React from 'react';
import { Disc, Users, Radio, Settings, Music2 } from 'lucide-react';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { Focusable } from '../navigation/Focusable';
import { usePlayer } from '../context/PlayerContext';
import { EqualizerBars } from './EqualizerBars';
import { ActiveView } from '../types/navigation';

export const Sidebar: React.FC = () => {
  const { activeView, goToView } = useSpatialNav();
  const { playbackStatus, currentTrack } = usePlayer();
  const isPlaying = playbackStatus === 'playing';

  const navItems: Array<{ id: string; view: ActiveView; label: string; icon: React.ReactNode }> = [
    { id: 'sidebar-albums', view: 'albums', label: 'Albums', icon: <Disc size={28} /> },
    { id: 'sidebar-artists', view: 'artists', label: 'Artists', icon: <Users size={28} /> },
    {
      id: 'sidebar-now-playing',
      view: 'now-playing',
      label: 'Now Playing',
      icon: isPlaying ? <EqualizerBars isPlaying={true} size="sm" /> : <Radio size={28} />,
    },
    { id: 'sidebar-settings', view: 'settings', label: 'Settings', icon: <Settings size={28} /> },
  ];

  return (
    <aside className="tv-sidebar" role="navigation" aria-label="Main Navigation">
      <div className="tv-sidebar-brand">
        <div className="tv-brand-logo-wrap">
          <img src="./sonzra-mark.svg" alt="Sonzra" className="tv-brand-logo" />
        </div>
        <div className="tv-brand-text">
          <span className="tv-brand-name">SONZRA</span>
          <span className="tv-brand-tag">TV EDITION</span>
        </div>
      </div>

      <nav className="tv-sidebar-nav">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <Focusable
              key={item.id}
              focusId={item.id}
              group="sidebar"
              className={`tv-nav-item ${isActive ? 'tv-nav-active' : ''}`}
              onEnter={() => goToView(item.view)}
              onClick={() => goToView(item.view)}
            >
              {({ isFocused }) => (
                <div className={`tv-nav-item-inner ${isFocused ? 'tv-nav-focused' : ''}`}>
                  <span className="tv-nav-icon">{item.icon}</span>
                  <span className="tv-nav-label">{item.label}</span>
                  {isActive && <div className="tv-nav-indicator" />}
                </div>
              )}
            </Focusable>
          );
        })}
      </nav>

      {currentTrack && (
        <div className="tv-sidebar-now-playing-peek">
          <Focusable
            focusId="sidebar-now-playing-card"
            group="sidebar"
            className="tv-peek-card"
            onEnter={() => goToView('now-playing')}
            onClick={() => goToView('now-playing')}
          >
            {({ isFocused }) => (
              <div className={`tv-peek-inner ${isFocused ? 'tv-peek-focused' : ''}`}>
                <img
                  src={currentTrack.artworkUrl || './sonzra-mark.svg'}
                  alt=""
                  className="tv-peek-thumb"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                  }}
                />
                <div className="tv-peek-info">
                  <div className="tv-peek-title">{currentTrack.title}</div>
                  <div className="tv-peek-artist">{currentTrack.artist}</div>
                </div>
                {isPlaying && <EqualizerBars isPlaying={true} size="sm" />}
              </div>
            )}
          </Focusable>
        </div>
      )}

      <div className="tv-sidebar-footer">
        <div className="tv-tizen-badge">
          <Music2 size={16} />
          <span>TIZEN 10-FOOT UI</span>
        </div>
      </div>
    </aside>
  );
};
