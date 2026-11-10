import React, { useState, useEffect } from 'react';

interface TopHeaderProps {
  zoneName?: string;
  subhead?: string;
  showBitPerfect?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  zoneName = 'Living Room',
  subhead = 'TIZEN MASTER HUB • 10FT MODE',
  showBitPerfect = false,
}) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-24 right-0 h-20 bg-surface/50 backdrop-blur-xl z-40 px-10 flex items-center justify-between border-b border-white/[0.04]">
      {/* Left Indicator / Subhead */}
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(73,220,202,1)]"></span>
        <span className="text-[12px] font-bold text-secondary uppercase tracking-[0.2em] font-mono">
          {subhead}
        </span>
        {showBitPerfect && (
          <div className="ml-4 flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-secondary-container/20 text-secondary text-[11px] font-mono font-bold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            BIT-PERFECT DAC
          </div>
        )}
      </div>

      {/* Right Controls, Clock, and Remote Hints */}
      <div className="flex items-center gap-6">
        {/* Room Zone Badge */}
        <div className="flex items-center gap-2 bg-surface-container-low/80 px-3.5 py-1.5 rounded-full border border-white/[0.04] shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(73,220,202,0.8)]"></span>
          <span className="font-label-md text-label-md text-on-surface font-medium">{zoneName}</span>
        </div>

        {/* Digital Clock */}
        <div className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold">
          {timeString || '9:42 PM'}
        </div>

        {/* TV Remote Key Hints */}
        <div className="hidden lg:flex items-center gap-2.5 bg-surface-container-low/70 px-3.5 py-1.5 rounded-full border border-white/[0.03]">
          <div className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">keyboard_return</span>
            <span>Return</span>
          </div>
          <span className="text-outline-variant font-label-md text-label-md">•</span>
          <div className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">menu</span>
            <span>Options</span>
          </div>
        </div>
      </div>
    </header>
  );
};
