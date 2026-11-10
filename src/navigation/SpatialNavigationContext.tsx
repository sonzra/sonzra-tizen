import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { ActiveView, Direction, FocusableNode } from '../types/navigation';
import { findNearestNeighbor } from './spatialMath';
import {
  isBackKey,
  isEnterKey,
  isMediaNext,
  isMediaPause,
  isMediaPlay,
  isMediaPlayPause,
  isMediaPrev,
  registerTizenKeys,
  TIZEN_KEYS,
} from './tizenKeys';

interface NavigationHistoryItem {
  view: ActiveView;
  param?: string;
  focusId?: string;
}

interface SpatialNavigationContextType {
  focusedId: string | null;
  setFocus: (id: string) => void;
  registerNode: (node: FocusableNode) => void;
  unregisterNode: (id: string) => void;
  navigate: (direction: Direction) => void;
  activeView: ActiveView;
  viewParam: string | null;
  openAlbum: (albumId: string) => void;
  openArtist: (artistId: string) => void;
  goToView: (view: ActiveView, param?: string) => void;
  goBack: () => void;
  canGoBack: boolean;
  registerMediaHandler: (handler: (action: 'play' | 'pause' | 'playpause' | 'next' | 'prev') => void) => () => void;
}

const SpatialNavigationContext = createContext<SpatialNavigationContextType | null>(null);

export const SpatialNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [viewParam, setViewParam] = useState<string | null>(null);
  const [history, setHistory] = useState<NavigationHistoryItem[]>([]);

  const nodesRef = useRef<Map<string, FocusableNode>>(new Map());
  const focusedIdRef = useRef<string | null>(null);
  focusedIdRef.current = focusedId;

  const mediaHandlersRef = useRef<Set<(action: 'play' | 'pause' | 'playpause' | 'next' | 'prev') => void>>(new Set());

  // Register Tizen TV hardware keys on startup
  useEffect(() => {
    registerTizenKeys();
  }, []);

  const registerMediaHandler = useCallback((handler: (action: 'play' | 'pause' | 'playpause' | 'next' | 'prev') => void) => {
    mediaHandlersRef.current.add(handler);
    return () => {
      mediaHandlersRef.current.delete(handler);
    };
  }, []);

  const setFocus = useCallback((id: string) => {
    const prevNode = focusedIdRef.current ? nodesRef.current.get(focusedIdRef.current) : null;
    const nextNode = nodesRef.current.get(id);

    if (prevNode && prevNode.id !== id) {
      prevNode.onBlur?.();
      prevNode.element.classList.remove('tv-focused');
    }

    if (nextNode) {
      setFocusedId(id);
      nextNode.element.classList.add('tv-focused');
      nextNode.onFocus?.();

      // Ensure visible in TV viewing area
      try {
        nextNode.element.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      } catch (err) {
        // Fallback for older WebKit / Tizen browsers
        nextNode.element.scrollIntoView(false);
      }
    } else {
      setFocusedId(id);
    }
  }, []);

  const registerNode = useCallback((node: FocusableNode) => {
    nodesRef.current.set(node.id, node);

    // If no node is focused yet, focus this first node (or sidebar item)
    if (!focusedIdRef.current) {
      if (node.id === 'sidebar-albums' || node.id.startsWith('sidebar-')) {
        setFocus(node.id);
      }
    }
  }, [setFocus]);

  const unregisterNode = useCallback((id: string) => {
    const node = nodesRef.current.get(id);
    if (node) {
      node.element.classList.remove('tv-focused');
    }
    nodesRef.current.delete(id);

    // If the unmounted node was focused, reset or re-evaluate
    if (focusedIdRef.current === id) {
      // Find a fallback
      const candidates = Array.from(nodesRef.current.values());
      if (candidates.length > 0) {
        setFocus(candidates[0].id);
      } else {
        setFocusedId(null);
      }
    }
  }, [setFocus]);

  const navigate = useCallback((direction: Direction) => {
    const currentId = focusedIdRef.current;
    if (!currentId) {
      const candidates = Array.from(nodesRef.current.values());
      if (candidates.length > 0) {
        setFocus(candidates[0].id);
      }
      return;
    }

    const currentNode = nodesRef.current.get(currentId);
    if (!currentNode) return;

    // Custom arrow handler override
    if (currentNode.onArrow) {
      const handled = currentNode.onArrow(direction);
      if (handled) return;
    }

    const candidates = Array.from(nodesRef.current.values()).filter(
      (node) => node.id !== currentId && node.element && node.element.isConnected
    );

    const neighbor = findNearestNeighbor(currentNode, candidates, direction);
    if (neighbor) {
      setFocus(neighbor.id);
    }
  }, [setFocus]);

  const goToView = useCallback((newView: ActiveView, param?: string) => {
    setHistory((prev) => [
      ...prev,
      { view: activeView, param: viewParam || undefined, focusId: focusedIdRef.current || undefined },
    ]);
    setActiveView(newView);
    setViewParam(param || null);
  }, [activeView, viewParam]);

  const openAlbum = useCallback((albumId: string) => {
    goToView('album-detail', albumId);
  }, [goToView]);

  const openArtist = useCallback((artistId: string) => {
    goToView('artist-detail', artistId);
  }, [goToView]);

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const nextHistory = [...history];
      const previous = nextHistory.pop()!;
      setHistory(nextHistory);
      setActiveView(previous.view);
      setViewParam(previous.param || null);

      if (previous.focusId && nodesRef.current.has(previous.focusId)) {
        setTimeout(() => setFocus(previous.focusId!), 50);
      }
    } else if (activeView !== 'home') {
      setActiveView('home');
      setViewParam(null);
      setFocus('sidebar-home');
    } else {
      // At root home view: focus sidebar if not already focused
      if (focusedIdRef.current && !focusedIdRef.current.startsWith('sidebar-')) {
        setFocus('sidebar-home');
      } else {
        // Can exit or minimize on Tizen
        if (typeof window !== 'undefined' && window.tizen?.application?.getCurrentApplication) {
          try {
            window.tizen.application.getCurrentApplication().exit();
          } catch (e) {
            console.log('Tizen exit prevented:', e);
          }
        }
      }
    }
  }, [history, activeView, setFocus]);

  // Global Remote Control & Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Tizen Hardware Media Keys
      if (isMediaPlayPause(e)) {
        e.preventDefault();
        mediaHandlersRef.current.forEach((fn) => fn('playpause'));
        return;
      }
      if (isMediaPlay(e)) {
        e.preventDefault();
        mediaHandlersRef.current.forEach((fn) => fn('play'));
        return;
      }
      if (isMediaPause(e)) {
        e.preventDefault();
        mediaHandlersRef.current.forEach((fn) => fn('pause'));
        return;
      }
      if (isMediaNext(e)) {
        e.preventDefault();
        mediaHandlersRef.current.forEach((fn) => fn('next'));
        return;
      }
      if (isMediaPrev(e)) {
        e.preventDefault();
        mediaHandlersRef.current.forEach((fn) => fn('prev'));
        return;
      }

      // 2. Return / Back Key
      if (isBackKey(e)) {
        e.preventDefault();
        goBack();
        return;
      }

      // 3. Enter / OK Key
      if (isEnterKey(e)) {
        if (focusedIdRef.current) {
          const node = nodesRef.current.get(focusedIdRef.current);
          if (node && node.onEnter) {
            e.preventDefault();
            node.onEnter();
            return;
          }
        }
      }

      // 4. Directional D-Pad Keys
      switch (e.keyCode) {
        case TIZEN_KEYS.UP:
        case 38: // ArrowUp
          e.preventDefault();
          navigate('up');
          break;
        case TIZEN_KEYS.DOWN:
        case 40: // ArrowDown
          e.preventDefault();
          navigate('down');
          break;
        case TIZEN_KEYS.LEFT:
        case 37: // ArrowLeft
          e.preventDefault();
          navigate('left');
          break;
        case TIZEN_KEYS.RIGHT:
        case 39: // ArrowRight
          e.preventDefault();
          navigate('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goBack, navigate]);

  return (
    <SpatialNavigationContext.Provider
      value={{
        focusedId,
        setFocus,
        registerNode,
        unregisterNode,
        navigate,
        activeView,
        viewParam,
        openAlbum,
        openArtist,
        goToView,
        goBack,
        canGoBack: history.length > 0 || activeView !== 'home',
        registerMediaHandler,
      }}
    >
      {children}
    </SpatialNavigationContext.Provider>
  );
};

export const useSpatialNav = () => {
  const context = useContext(SpatialNavigationContext);
  if (!context) {
    throw new Error('useSpatialNav must be used within a SpatialNavigationProvider');
  }
  return context;
};
