import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Square, Activity, ListPlus } from 'lucide-react';
import { useSpatialNav, MediaAction } from '../navigation/SpatialNavigationContext';
import { usePlayer } from '../context/PlayerContext';

export const MediaOsdToast: React.FC = () => {
  const { registerMediaHandler } = useSpatialNav();
  const player = usePlayer();
  const currentTrack = player?.currentTrack;
  const playbackStatus = player?.playbackStatus;
  const toastMessage = player?.toastMessage;

  const [visible, setVisible] = useState<boolean>(false);
  const [actionLabel, setActionLabel] = useState<string>('');
  const [actionDetail, setActionDetail] = useState<string>('');
  const [actionIcon, setActionIcon] = useState<string>('activity');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackStatusRef = useRef<string>(playbackStatus || 'idle');
  const currentTrackRef = useRef(currentTrack);
  const lastToastIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (playbackStatus) {
      playbackStatusRef.current = playbackStatus;
    }
  }, [playbackStatus]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // Handle toast notifications dispatched from PlayerContext (e.g. queue actions)
  useEffect(() => {
    if (!toastMessage || toastMessage.id === lastToastIdRef.current) return;
    lastToastIdRef.current = toastMessage.id;
    setActionLabel(toastMessage.label);
    setActionDetail(toastMessage.message);
    setActionIcon(toastMessage.icon || 'queue');
    setVisible(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, toastMessage.duration || 2800);
  }, [toastMessage]);

  // Handle hardware remote media keys
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
      setActionDetail(currentTrackRef.current ? currentTrackRef.current.title : 'Sonzra Master Audio');
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
      case 'queue':
        return <ListPlus className="w-6 h-6" />;
      default:
        return <Activity className="w-6 h-6" />;
    }
  };

  return (
    <aside
      className="fixed top-20 right-20 z-[100] pointer-events-none transition-all duration-300 ease-out"
      role="status"
      aria-live="polite"
      aria-label="Media Control Feedback"
    >
      <div className="flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-[#131319]/95 backdrop-blur-2xl border border-secondary/40 shadow-[0_0_28px_rgba(73,220,202,0.45)] text-on-surface">
        <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary shadow-[0_0_12px_rgba(73,220,202,0.6)]">
          {renderIcon()}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-widest uppercase text-secondary font-mono">
              {actionLabel}
            </span>
          </div>
          <span className="text-[14px] font-semibold text-on-surface truncate max-w-[340px]">
            {actionDetail || (currentTrack ? currentTrack.title : 'Sonzra Master Audio')}
          </span>
        </div>
      </div>
    </aside>
  );
};
