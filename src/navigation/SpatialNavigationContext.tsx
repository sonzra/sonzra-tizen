import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { ActiveView, Direction, FocusableNode } from '../types/navigation';
import { findNextFocusableNode, getViewEntryPoint } from './spatialMath';
import {
  getDirectionFromEvent,
  isBackKey,
  isEnterKey,
  isMediaNext,
  isMediaPause,
  isMediaPlay,
  isMediaPlayPause,
  isMediaPrev,
  isMediaStop,
  registerTizenKeys,
} from './tizenKeys';

interface NavigationHistoryItem {
  view: ActiveView;
  param?: string;
  focusId?: string;
}

export type MediaAction = 'play' | 'pause' | 'playpause' | 'next' | 'prev' | 'stop';

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
  registerMediaHandler: (handler: (action: MediaAction) => void) => () => void;
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

  // Track the last focused node in main content (non-sidebar, non-dock)
  const lastFocusedContentIdRef = useRef<string | null>(null);
  // Track last focused node per semantic group
  const lastFocusedByGroupRef = useRef<Map<string, string>>(new Map());

  const mediaHandlersRef = useRef<Set<(action: MediaAction) => void>>(new Set());

  // Register Tizen TV hardware keys on startup
  useEffect(() => {
    registerTizenKeys();
  }, []);

  const registerMediaHandler = useCallback((handler: (action: MediaAction) => void) => {
    mediaHandlersRef.current.add(handler);
    return () => {
      mediaHandlersRef.current.delete(handler);
    };
  }, []);

  const setFocus = useCallback((id: string) => {
    const prevId = focusedIdRef.current;
    focusedIdRef.current = id;
    const prevNode = prevId ? nodesRef.current.get(prevId) : null;
    const nextNode = nodesRef.current.get(id);

    if (prevNode && prevNode.id !== id) {
      prevNode.onBlur?.();
      prevNode.element?.classList?.remove('tv-focused');
    }

    // Clean up any stray focus halos across the document
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.tv-focused').forEach((el) => {
        if (!nextNode || el !== nextNode.element) {
          el.classList.remove('tv-focused');
        }
      });
    }

    if (nextNode && nextNode.element && nextNode.element.isConnected) {
      setFocusedId(id);
      nextNode.element.classList.add('tv-focused');
      nextNode.onFocus?.();

      // Update group memory
      if (nextNode.group) {
        lastFocusedByGroupRef.current.set(nextNode.group, id);
      }

      // Update content memory if inside main view (not fixed bars)
      if (nextNode.group !== 'sidebar' && nextNode.group !== 'bottom-dock') {
        lastFocusedContentIdRef.current = id;
      }

      // Smooth scroll viewport to center focused content element
      // (Do NOT trigger viewport scrolling when focusing fixed rails)
      if (nextNode.group !== 'sidebar' && nextNode.group !== 'bottom-dock') {
        try {
          nextNode.element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        } catch (err) {
          nextNode.element.scrollIntoView(false);
        }
      }
    } else {
      setFocusedId(id);
    }
  }, []);

  const registerNode = useCallback((node: FocusableNode) => {
    nodesRef.current.set(node.id, node);

    const currentActiveNode = focusedIdRef.current ? nodesRef.current.get(focusedIdRef.current) : null;
    const isCurrentValid = Boolean(currentActiveNode && currentActiveNode.element && currentActiveNode.element.isConnected);

    // Initial focus allocation: ONLY if current focus is missing or stale
    if (!isCurrentValid) {
      if (
        node.autoFocus ||
        node.id === 'signin-field-email' ||
        node.id === 'hero-resume' ||
        node.id === 'sidebar-home' ||
        node.id === 'library-tab-albums'
      ) {
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
      const candidates = Array.from(nodesRef.current.values()).filter(
        (n) => n.element && n.element.isConnected
      );
      if (candidates.length > 0) {
        // Fallback to entry point of current view
        const entry =
          getViewEntryPoint(activeView, candidates, lastFocusedContentIdRef.current) ||
          candidates.find((c) => c.autoFocus) ||
          candidates.find((c) => c.id === 'signin-field-email') ||
          candidates.find((c) => c.group !== 'sidebar' && c.group !== 'bottom-dock') ||
          candidates[0];
        setFocus(entry.id);
      } else {
        focusedIdRef.current = null;
        setFocusedId(null);
      }
    }
  }, [activeView, setFocus]);

  const navigate = useCallback((direction: Direction) => {
    const currentId = focusedIdRef.current;
    const currentNode = currentId ? nodesRef.current.get(currentId) : null;
    if (!currentNode || !currentNode.element || !currentNode.element.isConnected) {
      // Current focus was lost, unmounted, or detached. Re-anchor immediately.
      const candidates = Array.from(nodesRef.current.values()).filter(
        (n) => n.element && n.element.isConnected
      );
      if (candidates.length > 0) {
        const entry =
          getViewEntryPoint(activeView, candidates, lastFocusedContentIdRef.current) ||
          candidates.find((c) => c.group !== 'sidebar' && c.group !== 'bottom-dock') ||
          candidates[0];
        setFocus(entry.id);
      }
      return;
    }

    // 1. Custom arrow handler override
    if (currentNode.onArrow) {
      const handled = currentNode.onArrow(direction);
      if (handled) return;
    }

    // 2. Explicit directional overrides
    if (direction === 'up' && currentNode.upId && nodesRef.current.has(currentNode.upId)) {
      setFocus(currentNode.upId);
      return;
    }
    if (direction === 'down' && currentNode.downId && nodesRef.current.has(currentNode.downId)) {
      setFocus(currentNode.downId);
      return;
    }
    if (direction === 'left' && currentNode.leftId && nodesRef.current.has(currentNode.leftId)) {
      setFocus(currentNode.leftId);
      return;
    }
    if (direction === 'right' && currentNode.rightId && nodesRef.current.has(currentNode.rightId)) {
      setFocus(currentNode.rightId);
      return;
    }

    // 3. Group-aware spatial navigator
    const candidates = Array.from(nodesRef.current.values()).filter(
      (node) => node.id !== currentId && node.element && node.element.isConnected
    );

    const nextNode = findNextFocusableNode(currentNode, candidates, direction, {
      activeView,
      lastFocusedByGroup: lastFocusedByGroupRef.current,
      lastFocusedContentId: lastFocusedContentIdRef.current,
    });

    if (nextNode) {
      setFocus(nextNode.id);
    }
  }, [activeView, setFocus]);

  const goToView = useCallback((newView: ActiveView, param?: string) => {
    setHistory((prev) => [
      ...prev,
      { view: activeView, param: viewParam || undefined, focusId: focusedIdRef.current || undefined },
    ]);
    setActiveView(newView);
    setViewParam(param || null);

    // If focus was on main content, reset content memory so view picks its fresh entry point
    if (focusedIdRef.current && !focusedIdRef.current.startsWith('sidebar-')) {
      lastFocusedContentIdRef.current = null;
    }
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
      if (isMediaStop(e)) {
        e.preventDefault();
        mediaHandlersRef.current.forEach((fn) => fn('stop'));
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
      const direction = getDirectionFromEvent(e);
      if (direction) {
        e.preventDefault();
        navigate(direction);
        return;
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
