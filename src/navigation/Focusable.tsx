import React, { useEffect, useRef } from 'react';
import { useSpatialNav } from './SpatialNavigationContext';
import { Direction } from '../types/navigation';

export interface FocusableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onFocus' | 'onBlur'> {
  focusId: string;
  group?: string;
  onEnter?: () => void;
  onFocus?: (element: HTMLDivElement | null) => void;
  onBlur?: () => void;
  onArrow?: (direction: Direction) => boolean | void;
  autoFocus?: boolean;
  upId?: string;
  downId?: string;
  leftId?: string;
  rightId?: string;
  className?: string;
  children: React.ReactNode | ((props: { isFocused: boolean }) => React.ReactNode);
  disabled?: boolean;
  focusVariant?: 'cyan' | 'primary' | 'none';
}

export const Focusable: React.FC<FocusableProps> = ({
  focusId,
  group,
  onEnter,
  onFocus,
  onBlur,
  onArrow,
  autoFocus = false,
  upId,
  downId,
  leftId,
  rightId,
  className = '',
  children,
  disabled = false,
  focusVariant = 'cyan',
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
    onFocus,
    onBlur,
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
    onFocus,
    onBlur,
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
      onFocus: () => {
        propsRef.current.onFocus?.(elementRef.current);
      },
      onBlur: () => {
        propsRef.current.onBlur?.();
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

  const focusClass = !isFocused
    ? ''
    : focusVariant === 'primary'
    ? 'tv-focused-primary'
    : focusVariant === 'none'
    ? ''
    : 'tv-focused';

  return (
    <div
      ref={elementRef}
      id={`tv-node-${focusId}`}
      data-focus-id={focusId}
      tabIndex={-1}
      className={`tv-focusable ${focusClass} ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...rest}
    >
      {typeof children === 'function' ? children({ isFocused }) : children}
    </div>
  );
};
