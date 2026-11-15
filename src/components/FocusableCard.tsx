import React from 'react';
import { Focusable, FocusableProps } from '../navigation/Focusable';
import { Play } from 'lucide-react';

interface FocusableCardProps extends Omit<FocusableProps, 'children'> {
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl: string;
  aspectRatio?: 'square' | 'circle';
  onPlayClick?: () => void;
}

export const FocusableCard: React.FC<FocusableCardProps> = ({
  title,
  subtitle,
  badge,
  imageUrl,
  aspectRatio = 'square',
  onPlayClick,
  className = '',
  ...props
}) => {
  const isCircle = aspectRatio === 'circle';

  return (
    <Focusable
      className={`rounded-xl cursor-pointer relative tv-card tv-card-${aspectRatio} ${className}`}
      {...props}
    >
      {({ isFocused }) => (
        <div
          className={`flex flex-col rounded-xl p-2.5 h-full transition-colors duration-75 tv-card-inner ${
            isFocused
              ? 'bg-surface-container z-10 tv-card-focused'
              : 'bg-surface-container-low shadow-md'
          }`}
        >
          {/* Media / Artwork Wrapper */}
          <div
            className={`relative w-full aspect-square ${
              isCircle ? 'rounded-full' : 'rounded-lg'
            } overflow-hidden bg-surface-container-high mb-2 shadow-md tv-card-media-wrapper tv-media-${aspectRatio}`}
          >
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover tv-card-img"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = './sonzra-mark.svg';
              }}
            />
            {badge && (
              <span className="absolute bottom-2 right-2 bg-surface-container-lowest/85 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-mono text-secondary font-semibold tv-card-badge">
                {badge}
              </span>
            )}
            {isFocused && (
              <div className="absolute inset-0 bg-surface-dim/40 backdrop-blur-[1px] flex items-center justify-center tv-card-overlay-play">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    if (onPlayClick) {
                      e.stopPropagation();
                      onPlayClick();
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-secondary text-surface-container-lowest flex items-center justify-center shadow-[0_0_18px_rgba(73,220,202,0.9)] cursor-pointer"
                  title="Play"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5 tv-card-play-icon" />
                </button>
              </div>
            )}
          </div>

          {/* Metadata Section (10-Foot Distance Legibility >= 14px for title) */}
          <div className="flex flex-col pt-0.5 px-0.5 min-w-0 tv-card-meta">
            <h3
              className={`text-[15px] font-bold leading-tight truncate transition-colors tv-card-title ${
                isFocused ? 'text-secondary' : 'text-on-surface'
              }`}
              title={title}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                className="text-[13px] text-on-surface-variant truncate mt-0.5 tv-card-subtitle"
                title={subtitle}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
    </Focusable>
  );
};
