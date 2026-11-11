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

  // Store mutable callbacks & dynamic navigation properties in a ref so changes
  // do not trigger effect re-execution or unregistering/re-registering nodes.
  const propsRef = useRef({
    group,
    onEnter,
    onArrow,
    onClick,
    upId,
    downId,
    leftId,
    rightId,
    disabled,
  });
  propsRef.current = {
    group,
    onEnter,
    onArrow,
    onClick,
    upId,
    downId,
    leftId,
    rightId,
    disabled,
  };

  useEffect(() => {
    if (disabled || !elementRef.current) return;

    registerNode({
      id: focusId,
      get group() {
        return propsRef.current.group;
      },
      element: elementRef.current,
      autoFocus,
      get upId() {
        return propsRef.current.upId;
      },
      get downId() {
        return propsRef.current.downId;
      },
      get leftId() {
        return propsRef.current.leftId;
      },
      get rightId() {
        return propsRef.current.rightId;
      },
      onEnter: () => {
        const current = propsRef.current;
        if (!current.disabled && current.onEnter) {
          current.onEnter();
        } else if (!current.disabled && current.onClick) {
          elementRef.current?.click();
        }
      },
      onArrow: (direction: Direction) => {
        return propsRef.current.onArrow?.(direction);
      },
    });

    if (autoFocus) {
      setFocus(focusId);
    }

    return () => {
      unregisterNode(focusId);
    };
  }, [focusId, disabled, autoFocus, registerNode, unregisterNode, setFocus]);

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
