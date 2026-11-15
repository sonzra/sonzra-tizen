import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Square, Activity } from 'lucide-react';
import { useSpatialNav, MediaAction } from '../navigation/SpatialNavigationContext';
import { usePlayer } from '../context/PlayerContext';

export const MediaOsdToast: React.FC = () => {
  const { registerMediaHandler } = useSpatialNav();
  const { currentTrack, playbackStatus } = usePlayer();
  const [visible, setVisible] = useState<boolean>(false);
  const [actionLabel, setActionLabel] = useState<string>('');
  const [actionIcon, setActionIcon] = useState<string>('activity');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackStatusRef = useRef<string>(playbackStatus);

  useEffect(() => {
    playbackStatusRef.current = playbackStatus;
  }, [playbackStatus]);

  useEffect(() => {
    const unregister = registerMediaHandler((action: MediaAction) => {
      let label = '';
      let icon = '';

      switch (action) {
        case 'play':
          label = 'PLAY';
          icon = 'play';
          break;
        case 'pause':
          label = 'PAUSED';
          icon = 'pause';
          break;
        case 'playpause':
          label = playbackStatusRef.current === 'playing' ? 'PAUSED' : 'PLAYING';
          icon = playbackStatusRef.current === 'playing' ? 'pause' : 'play';
          break;
        case 'next':
          label = 'NEXT TRACK';
          icon = 'next';
          break;
        case 'prev':
          label = 'PREVIOUS TRACK';
          icon = 'prev';
          break;
        case 'stop':
          label = 'STOPPED';
          icon = 'stop';
          break;
      }

      setActionLabel(label);
      setActionIcon(icon);
      setVisible(true);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setVisible(false);
      }, 1600);
    });

    return () => {
      unregister();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [registerMediaHandler]);

  if (!visible) return null;

  const renderIcon = () => {
    switch (actionIcon) {
      case 'play':
        return <Play className="w-6 h-6 fill-current ml-0.5" />;
      case 'pause':
        return <Pause className="w-6 h-6 fill-current" />;
      case 'next':
        return <SkipForward className="w-6 h-6" />;
      case 'prev':
        return <SkipBack className="w-6 h-6" />;
      case 'stop':
        return <Square className="w-5 h-5 fill-current" />;
      default:
        return <Activity className="w-6 h-6" />;
    }
  };

  return (
    <aside
      className="fixed top-8 right-10 z-[100] pointer-events-none transition-all duration-300 ease-out"
      role="status"
      aria-live="polite"
      aria-label="Media Control Feedback"
    >
      <div className="flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-surface-container-high/95 backdrop-blur-2xl border border-secondary/40 shadow-[0_0_28px_rgba(73,220,202,0.45)] text-on-surface">
        <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary shadow-[0_0_12px_rgba(73,220,202,0.6)]">
          {renderIcon()}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-widest uppercase text-secondary font-mono">
              {actionLabel}
            </span>
          </div>
          {currentTrack ? (
            <span className="text-[14px] font-semibold text-on-surface truncate max-w-[240px]">
              {currentTrack.title}
            </span>
          ) : (
            <span className="text-[13px] text-on-surface-variant font-medium">Sonzra Master Audio</span>
          )}
        </div>
      </div>
    </aside>
  );
};
