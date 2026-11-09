import React from 'react';
import { Focusable, FocusableProps } from '../navigation/Focusable';

interface FocusableButtonProps extends Omit<FocusableProps, 'children'> {
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const FocusableButton: React.FC<FocusableButtonProps> = ({
  label,
  icon,
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <Focusable
      className={`tv-btn tv-btn-${variant} tv-btn-${size} ${className}`}
      {...props}
    >
      {({ isFocused }) => (
        <div className={`tv-btn-content ${isFocused ? 'tv-btn-focused' : ''}`}>
          {icon && <span className="tv-btn-icon">{icon}</span>}
          <span className="tv-btn-label">{label}</span>
        </div>
      )}
    </Focusable>
  );
};
