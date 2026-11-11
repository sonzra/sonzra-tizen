import React, { useState, useEffect, useRef } from 'react';
import { useSpatialNav, MediaAction } from '../navigation/SpatialNavigationContext';
import { usePlayer } from '../context/PlayerContext';

export const MediaOsdToast: React.FC = () => {
  const { registerMediaHandler } = useSpatialNav();
  const { currentTrack, playbackStatus } = usePlayer();
  const [visible, setVisible] = useState<boolean>(false);
  const [actionLabel, setActionLabel] = useState<string>('');
  const [actionIcon, setActionIcon] = useState<string>('graphic_eq');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unregister = registerMediaHandler((action: MediaAction) => {
      let label = '';
      let icon = '';

      switch (action) {
        case 'play':
          label = 'PLAY';
          icon = 'play_arrow';
          break;
        case 'pause':
          label = 'PAUSED';
          icon = 'pause';
          break;
        case 'playpause':
          label = playbackStatus === 'playing' ? 'PAUSED' : 'PLAYING';
          icon = playbackStatus === 'playing' ? 'pause' : 'play_arrow';
          break;
        case 'next':
          label = 'NEXT TRACK';
          icon = 'skip_next';
          break;
        case 'prev':
          label = 'PREVIOUS TRACK';
          icon = 'skip_previous';
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
  }, [registerMediaHandler, playbackStatus]);

  if (!visible) return null;

  return (
    <aside
      className="fixed top-8 right-10 z-[100] pointer-events-none transition-all duration-300 ease-out"
      role="status"
      aria-live="polite"
      aria-label="Media Control Feedback"
    >
      <div className="flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-surface-container-high/95 backdrop-blur-2xl border border-secondary/40 shadow-[0_0_28px_rgba(73,220,202,0.45)] text-on-surface">
        <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary shadow-[0_0_12px_rgba(73,220,202,0.6)]">
          <span className="material-symbols-outlined text-[24px]">{actionIcon}</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-widest uppercase text-secondary font-mono">
              TV REMOTE · {actionLabel}
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
