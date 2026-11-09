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
  return (
    <Focusable
      className={`tv-card tv-card-${aspectRatio} ${className}`}
      {...props}
    >
      {({ isFocused }) => (
        <div className={`tv-card-inner ${isFocused ? 'tv-card-focused' : ''}`}>
          <div className={`tv-card-media-wrapper tv-media-${aspectRatio}`}>
            <img
              src={imageUrl}
              alt={title}
              className="tv-card-img"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = './sonzra-mark.svg';
              }}
            />
            {badge && <span className="tv-card-badge">{badge}</span>}
            {isFocused && (
              <div className="tv-card-overlay-play">
                <Play className="tv-card-play-icon" />
              </div>
            )}
          </div>
          <div className="tv-card-meta">
            <h3 className="tv-card-title" title={title}>
              {title}
            </h3>
            {subtitle && (
              <p className="tv-card-subtitle" title={subtitle}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
    </Focusable>
  );
};
