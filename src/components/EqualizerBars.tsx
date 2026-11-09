import React from 'react';

interface EqualizerBarsProps {
  isPlaying: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const EqualizerBars: React.FC<EqualizerBarsProps> = ({ isPlaying, size = 'md' }) => {
  const barClass = `eq-bar ${isPlaying ? 'eq-playing' : 'eq-paused'}`;
  const sizeClass = `eq-container-${size}`;

  return (
    <div className={`eq-container ${sizeClass}`} aria-hidden="true">
      <span className={`${barClass} eq-bar-1`} />
      <span className={`${barClass} eq-bar-2`} />
      <span className={`${barClass} eq-bar-3`} />
      <span className={`${barClass} eq-bar-4`} />
    </div>
  );
};
