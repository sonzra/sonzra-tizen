import React, { useState, useEffect } from 'react';
import { TIZEN_KEYS } from '../navigation/tizenKeys';

export const TvRemoteSimulator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPhysicalTv, setIsPhysicalTv] = useState(false);

  useEffect(() => {
    // Detect if running on real Samsung TV hardware (tvinputdevice or productinfo provided by OS)
    if (
      typeof window !== 'undefined' &&
      (Boolean((window as any).tizen?.tvinputdevice?.registerKey) ||
       Boolean((window as any).webapis?.productinfo))
    ) {
      setIsPhysicalTv(true);
    }

    const handleGlobalKey = (e: KeyboardEvent) => {
      // Allow pressing F2 or Alt+R to toggle TV remote simulator in browser
      if (e.key === 'F2' || (e.altKey && e.key.toLowerCase() === 'r')) {
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Never render simulator overlay on actual physical Samsung TV hardware
  if (isPhysicalTv) {
    return null;
  }

  const sendKey = (keyCode: number, keyName: string) => {
    const event = new KeyboardEvent('keydown', {
      keyCode,
      which: keyCode,
      key: keyName,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans select-none">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-container-highest/90 text-secondary border border-secondary/40 shadow-[0_0_20px_rgba(73,220,202,0.35)] hover:scale-105 active:scale-95 transition-all text-xs font-mono font-bold backdrop-blur-md cursor-pointer"
          title="Open Samsung TV Remote Controller Simulator"
        >
          <span className="material-symbols-outlined text-[18px]">settings_remote</span>
          <span>TV REMOTE SIMULATOR</span>
        </button>
      ) : (
        <div className="w-64 bg-[#14141E]/95 border border-white/10 rounded-3xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl flex flex-col gap-4 text-on-surface animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">settings_remote</span>
              <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-secondary">
                Samsung TV Remote
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-on-surface-variant hover:text-on-surface text-[14px] p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-on-surface-variant leading-tight">
            Simulate physical TV controller keycodes & D-pad navigation directly in your browser.
          </p>

          {/* D-Pad Controller */}
          <div className="relative w-44 h-44 mx-auto my-1 flex items-center justify-center">
            {/* Outer Circular Ring */}
            <div className="absolute inset-0 rounded-full bg-surface-container-low border border-white/10 shadow-inner"></div>

            {/* Up Button */}
            <button
              onClick={() => sendKey(TIZEN_KEYS.UP, 'ArrowUp')}
              className="absolute top-2 w-14 h-11 rounded-t-full bg-surface-container-high hover:bg-secondary/20 active:bg-secondary/40 flex items-center justify-center text-on-surface hover:text-secondary transition-all cursor-pointer"
              title="D-Pad Up (ArrowUp)"
            >
              <span className="material-symbols-outlined text-[20px]">expand_less</span>
            </button>

            {/* Down Button */}
            <button
              onClick={() => sendKey(TIZEN_KEYS.DOWN, 'ArrowDown')}
              className="absolute bottom-2 w-14 h-11 rounded-b-full bg-surface-container-high hover:bg-secondary/20 active:bg-secondary/40 flex items-center justify-center text-on-surface hover:text-secondary transition-all cursor-pointer"
              title="D-Pad Down (ArrowDown)"
            >
              <span className="material-symbols-outlined text-[20px]">expand_more</span>
            </button>

            {/* Left Button */}
            <button
              onClick={() => sendKey(TIZEN_KEYS.LEFT, 'ArrowLeft')}
              className="absolute left-2 w-11 h-14 rounded-l-full bg-surface-container-high hover:bg-secondary/20 active:bg-secondary/40 flex items-center justify-center text-on-surface hover:text-secondary transition-all cursor-pointer"
              title="D-Pad Left (ArrowLeft)"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>

            {/* Right Button */}
            <button
              onClick={() => sendKey(TIZEN_KEYS.RIGHT, 'ArrowRight')}
              className="absolute right-2 w-11 h-14 rounded-r-full bg-surface-container-high hover:bg-secondary/20 active:bg-secondary/40 flex items-center justify-center text-on-surface hover:text-secondary transition-all cursor-pointer"
              title="D-Pad Right (ArrowRight)"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>

            {/* Center Enter / OK Button */}
            <button
              onClick={() => sendKey(TIZEN_KEYS.ENTER, 'Enter')}
              className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-tr from-surface-container-highest to-surface-container-high hover:from-secondary/30 hover:to-primary-container/40 active:scale-95 border border-white/10 flex flex-col items-center justify-center text-on-surface hover:text-secondary shadow-lg transition-all cursor-pointer"
              title="Enter / OK (13)"
            >
              <span className="text-[12px] font-mono font-bold">OK</span>
            </button>
          </div>

          {/* Action Row: Return / Back */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => sendKey(TIZEN_KEYS.RETURN, 'Escape')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest active:scale-95 text-xs font-mono font-semibold transition-all border border-white/5 cursor-pointer"
              title="Tizen Hardware Return Key (10009)"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>RETURN</span>
            </button>

            <button
              onClick={() => sendKey(TIZEN_KEYS.ENTER, 'Enter')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest active:scale-95 text-xs font-mono font-semibold transition-all border border-white/5 cursor-pointer"
              title="Select / Enter (13)"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>SELECT</span>
            </button>
          </div>

          {/* Media Transport Controls */}
          <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-outline">
              Hardware Media Keys
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => sendKey(TIZEN_KEYS.MEDIA_REWIND, 'MediaRewind')}
                className="py-2 rounded-lg bg-surface-container-high hover:bg-secondary/20 flex items-center justify-center text-on-surface hover:text-secondary transition-all cursor-pointer"
                title="Rewind (412)"
              >
                <span className="material-symbols-outlined text-[18px]">fast_rewind</span>
              </button>
              <button
                onClick={() => sendKey(TIZEN_KEYS.MEDIA_PLAY_PAUSE, 'MediaPlayPause')}
                className="py-2 rounded-lg bg-surface-container-high hover:bg-secondary/20 flex items-center justify-center text-on-surface hover:text-secondary transition-all cursor-pointer"
                title="Play / Pause (10252)"
              >
                <span className="material-symbols-outlined text-[18px]">play_pause</span>
              </button>
              <button
                onClick={() => sendKey(TIZEN_KEYS.MEDIA_STOP, 'MediaStop')}
                className="py-2 rounded-lg bg-surface-container-high hover:bg-secondary/20 flex items-center justify-center text-on-surface hover:text-secondary transition-all cursor-pointer"
                title="Stop (413)"
              >
                <span className="material-symbols-outlined text-[18px]">stop</span>
              </button>
              <button
                onClick={() => sendKey(TIZEN_KEYS.MEDIA_FAST_FORWARD, 'MediaFastForward')}
                className="py-2 rounded-lg bg-surface-container-high hover:bg-secondary/20 flex items-center justify-center text-on-surface hover:text-secondary transition-all cursor-pointer"
                title="Fast Forward (417)"
              >
                <span className="material-symbols-outlined text-[18px]">fast_forward</span>
              </button>
            </div>
          </div>

          {/* Keyboard Helper Tips */}
          <div className="text-[10px] font-mono text-outline-variant leading-relaxed border-t border-white/5 pt-2">
            <div>• Keyboard Arrows: D-Pad</div>
            <div>• Enter: Select / OK</div>
            <div>• Esc / Backspace: Return / Back</div>
          </div>
        </div>
      )}
    </div>
  );
};