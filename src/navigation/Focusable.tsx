import React, { useEffect, useRef } from 'react';
import { useSpatialNav } from './SpatialNavigationContext';
import { Direction } from '../types/navigation';

export interface FocusableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  focusId: string;
  group?: string;
  onEnter?: () => void;
  onArrow?: (direction: Direction) => boolean | void;
  autoFocus?: boolean;
  upId?: string;
  downId?: string;
  leftId?: string;
  rightId?: string;
  className?: string;
  children: React.ReactNode | ((props: { isFocused: boolean }) => React.ReactNode);
  disabled?: boolean;
}

export const Focusable: React.FC<FocusableProps> = ({
  focusId,
  group,
  onEnter,
  onArrow,
  autoFocus = false,
  upId,
  downId,
  leftId,
  rightId,
  className = '',
  children,
  disabled = false,
  onClick,
  ...rest
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { focusedId, setFocus, registerNode, unregisterNode } = useSpatialNav();
  const isFocused = focusedId === focusId;

  useEffect(() => {
    if (disabled || !elementRef.current) return;

    registerNode({
      id: focusId,
      group,
      element: elementRef.current,
      autoFocus,
      upId,
      downId,
      leftId,
      rightId,
      onEnter: () => {
        if (!disabled && onEnter) {
          onEnter();
        } else if (!disabled && onClick) {
          elementRef.current?.click();
        }
      },
      onArrow,
    });

    if (autoFocus) {
      setFocus(focusId);
    }

    return () => {
      unregisterNode(focusId);
    };
  }, [
    focusId,
    group,
    disabled,
    onEnter,
    onArrow,
    autoFocus,
    upId,
    downId,
    leftId,
    rightId,
    registerNode,
    unregisterNode,
    setFocus,
    onClick,
  ]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    setFocus(focusId);
    if (onEnter) {
      onEnter();
    }
    if (onClick) {
      onClick(e);
    }
  };

  const handleMouseEnter = () => {
    if (!disabled) {
      setFocus(focusId);
    }
  };

  return (
    <div
      ref={elementRef}
      id={`tv-node-${focusId}`}
      data-focus-id={focusId}
      tabIndex={-1}
      className={`tv-focusable ${isFocused ? 'tv-focused' : ''} ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...rest}
    >
      {typeof children === 'function' ? children({ isFocused }) : children}
    </div>
  );
};
