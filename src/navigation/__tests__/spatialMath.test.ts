import { describe, it, expect, beforeEach } from 'vitest';
import { findNearestNeighbor, findNextFocusableNode } from '../spatialMath';
import { FocusableNode } from '../../types/navigation';
import {
  getDirectionFromEvent,
  isBackKey,
  isEnterKey,
  isMediaFastForward,
  isMediaNext,
  isMediaPause,
  isMediaPlay,
  isMediaPlayPause,
  isMediaPrev,
  isMediaRewind,
  isMediaStop,
  TIZEN_KEYS,
} from '../tizenKeys';

describe('Spatial Navigation Math', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
  });

  function createMockNode(
    id: string,
    left: number,
    top: number,
    width = 100,
    height = 50,
    group?: string
  ): FocusableNode {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);

    // Mock getBoundingClientRect
    el.getBoundingClientRect = () => ({
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
      x: left,
      y: top,
      toJSON: () => {},
    });

    return {
      id,
      group,
      element: el,
    };
  }

  describe('Classic Nearest Neighbor', () => {
    it('correctly navigates right across horizontally aligned nodes', () => {
      const nodeA = createMockNode('node-a', 0, 100);
      const nodeB = createMockNode('node-b', 150, 100);
      const nodeC = createMockNode('node-c', 300, 100);

      const neighbor = findNearestNeighbor(nodeA, [nodeA, nodeB, nodeC], 'right');
      expect(neighbor?.id).toBe('node-b');
    });

    it('correctly navigates down across vertically aligned nodes', () => {
      const nodeA = createMockNode('node-a', 100, 0);
      const nodeB = createMockNode('node-b', 100, 150);
      const nodeC = createMockNode('node-c', 100, 300);

      const neighbor = findNearestNeighbor(nodeA, [nodeA, nodeB, nodeC], 'down');
      expect(neighbor?.id).toBe('node-b');
    });

    it('correctly handles navigation left and up', () => {
      const nodeA = createMockNode('node-a', 200, 200);
      const nodeLeft = createMockNode('node-left', 50, 200);
      const nodeUp = createMockNode('node-up', 200, 50);

      const leftNeighbor = findNearestNeighbor(nodeA, [nodeA, nodeLeft, nodeUp], 'left');
      expect(leftNeighbor?.id).toBe('node-left');

      const upNeighbor = findNearestNeighbor(nodeA, [nodeA, nodeLeft, nodeUp], 'up');
      expect(upNeighbor?.id).toBe('node-up');
    });

    it('returns null if no node exists in requested direction', () => {
      const nodeA = createMockNode('node-a', 100, 100);
      const nodeBelow = createMockNode('node-below', 100, 300);

      const upNeighbor = findNearestNeighbor(nodeA, [nodeA, nodeBelow], 'up');
      expect(upNeighbor).toBeNull();
    });
  });

  describe('10-Foot Leanback Hierarchical Shelf Navigation (Home View)', () => {
    it('prevents hero-favorite focus trap: pressing down from hero-favorite navigates to continue-shelf (NOT bottom dock)', () => {
      // Sidebar
      const sidebarHome = createMockNode('sidebar-home', 0, 100, 96, 50, 'sidebar');
      // Hero actions row
      const heroResume = createMockNode('hero-resume', 200, 500, 150, 50, 'hero-actions');
      const heroQueue = createMockNode('hero-queue', 370, 500, 120, 50, 'hero-actions');
      const heroDetails = createMockNode('hero-details', 510, 500, 120, 50, 'hero-actions');
      const heroFav = createMockNode('hero-favorite', 680, 500, 50, 50, 'hero-actions');
      // Continue shelf row
      const continueCard0 = createMockNode('continue-card-0', 200, 900, 200, 200, 'continue-shelf');
      const continueCard1 = createMockNode('continue-card-1', 450, 900, 200, 200, 'continue-shelf');
      const continueCard2 = createMockNode('continue-card-2', 700, 900, 200, 200, 'continue-shelf');
      // Recent shelf row (scrolled down)
      const recentCard0 = createMockNode('recent-card-0', 200, 1300, 200, 200, 'recent-shelf');
      // Fixed bottom player dock
      const dockPlay = createMockNode('dock-btn-play', 960, 1020, 50, 50, 'bottom-dock');

      const allNodes = [
        sidebarHome,
        heroResume,
        heroQueue,
        heroDetails,
        heroFav,
        continueCard0,
        continueCard1,
        continueCard2,
        recentCard0,
        dockPlay,
      ];

      // 1. Moving down from hero-favorite MUST go to continue-shelf (card closest to X=650 is card 2)
      const nextFromFav = findNextFocusableNode(heroFav, allNodes, 'down', { activeView: 'home' });
      expect(nextFromFav?.id).toBe('continue-card-2');
      expect(nextFromFav?.id).not.toBe('dock-btn-play');

      // 2. Moving down from continue-card-2 MUST go to recent-shelf
      const nextFromContinue = findNextFocusableNode(continueCard2, allNodes, 'down', { activeView: 'home' });
      expect(nextFromContinue?.id).toBe('recent-card-0');
      expect(nextFromContinue?.id).not.toBe('dock-btn-play');

      // 3. Moving down from recent-card-0 (bottom shelf) MUST go to bottom-dock
      const nextFromRecent = findNextFocusableNode(recentCard0, allNodes, 'down', { activeView: 'home' });
      expect(nextFromRecent?.id).toBe('dock-btn-play');

      // 4. Moving UP from bottom-dock MUST return to recent-shelf (NOT hero-favorite!)
      const nextFromDock = findNextFocusableNode(dockPlay, allNodes, 'up', { activeView: 'home' });
      expect(nextFromDock?.id).toBe('recent-card-0');
      expect(nextFromDock?.id).not.toBe('hero-favorite');

      // 5. Moving UP from recent-card-0 MUST return to continue-shelf
      const backToContinue = findNextFocusableNode(recentCard0, allNodes, 'up', { activeView: 'home' });
      expect(backToContinue?.id).toBe('continue-card-0');

      // 6. Moving UP from continue-card-0 MUST return to hero-actions
      const backToHero = findNextFocusableNode(continueCard0, allNodes, 'up', { activeView: 'home' });
      expect(backToHero?.id).toBe('hero-resume');
    });

    it('seamlessly transitions to Sidebar rail when pressing Left from leftmost elements', () => {
      const sidebarHome = createMockNode('sidebar-home', 0, 100, 96, 50, 'sidebar');
      const sidebarLib = createMockNode('sidebar-library', 0, 170, 96, 50, 'sidebar');
      const heroResume = createMockNode('hero-resume', 200, 500, 150, 50, 'hero-actions');
      const continueCard0 = createMockNode('continue-card-0', 200, 900, 200, 200, 'continue-shelf');
      const dockInfo = createMockNode('dock-track-info', 200, 1020, 200, 50, 'bottom-dock');

      const allNodes = [sidebarHome, sidebarLib, heroResume, continueCard0, dockInfo];

      // Left from hero-resume -> sidebar-home
      const fromHero = findNextFocusableNode(heroResume, allNodes, 'left', { activeView: 'home' });
      expect(fromHero?.id).toBe('sidebar-home');

      // Left from continue-card-0 -> sidebar-home
      const fromContinue = findNextFocusableNode(continueCard0, allNodes, 'left', { activeView: 'home' });
      expect(fromContinue?.id).toBe('sidebar-home');

      // Left from dock-track-info -> sidebar-home
      const fromDock = findNextFocusableNode(dockInfo, allNodes, 'left', { activeView: 'home' });
      expect(fromDock?.id).toBe('sidebar-home');

      // Right from sidebar-home -> returns to hero-resume!
      const enterContent = findNextFocusableNode(sidebarHome, allNodes, 'right', { activeView: 'home' });
      expect(enterContent?.id).toBe('hero-resume');
    });

    it('maintains vertical movement within sidebar and does not jump into content on Up/Down', () => {
      const sidebarHome = createMockNode('sidebar-home', 0, 100, 96, 50, 'sidebar');
      const sidebarLib = createMockNode('sidebar-library', 0, 170, 96, 50, 'sidebar');
      const sidebarNP = createMockNode('sidebar-now-playing', 0, 240, 96, 50, 'sidebar');
      const heroResume = createMockNode('hero-resume', 200, 170, 150, 50, 'hero-actions');

      const allNodes = [sidebarHome, sidebarLib, sidebarNP, heroResume];

      // Down from sidebar-home -> sidebar-library
      const step1 = findNextFocusableNode(sidebarHome, allNodes, 'down', { activeView: 'home' });
      expect(step1?.id).toBe('sidebar-library');

      // Down from sidebar-library -> sidebar-now-playing
      const step2 = findNextFocusableNode(sidebarLib, allNodes, 'down', { activeView: 'home' });
      expect(step2?.id).toBe('sidebar-now-playing');

      // Up from sidebar-library -> sidebar-home
      const stepUp = findNextFocusableNode(sidebarLib, allNodes, 'up', { activeView: 'home' });
      expect(stepUp?.id).toBe('sidebar-home');
    });
  });

  describe('Library View Grid 2D Navigation', () => {
    it('correctly navigates a 5-column grid with tab transitions and bottom dock exit', () => {
      const sidebarLib = createMockNode('sidebar-library', 0, 170, 96, 50, 'sidebar');
      const tabAlbums = createMockNode('library-tab-albums', 200, 120, 100, 40, 'library-tabs');
      const tabArtists = createMockNode('library-tab-artists', 320, 120, 100, 40, 'library-tabs');

      // Row 0 of Grid (Y = 300)
      const card0 = createMockNode('card-0', 200, 300, 150, 200, 'library-grid');
      const card1 = createMockNode('card-1', 400, 300, 150, 200, 'library-grid');
      const card2 = createMockNode('card-2', 600, 300, 150, 200, 'library-grid');

      // Row 1 of Grid (Y = 550)
      const card3 = createMockNode('card-3', 200, 550, 150, 200, 'library-grid');
      const card4 = createMockNode('card-4', 400, 550, 150, 200, 'library-grid');
      const card5 = createMockNode('card-5', 600, 550, 150, 200, 'library-grid');

      const dockPlay = createMockNode('dock-btn-play', 960, 1020, 50, 50, 'bottom-dock');

      const allNodes = [
        sidebarLib,
        tabAlbums,
        tabArtists,
        card0,
        card1,
        card2,
        card3,
        card4,
        card5,
        dockPlay,
      ];

      // 1. Down from tabAlbums -> card0
      const downFromTab = findNextFocusableNode(tabAlbums, allNodes, 'down', { activeView: 'library' });
      expect(downFromTab?.id).toBe('card-0');

      // 2. Down from card0 (Row 0) -> card3 (Row 1, matching column)
      const downFromCard0 = findNextFocusableNode(card0, allNodes, 'down', { activeView: 'library' });
      expect(downFromCard0?.id).toBe('card-3');

      // 3. Right from card3 -> card4
      const rightFromCard3 = findNextFocusableNode(card3, allNodes, 'right', { activeView: 'library' });
      expect(rightFromCard3?.id).toBe('card-4');

      // 4. Up from card4 (Row 1) -> card1 (Row 0)
      const upFromCard4 = findNextFocusableNode(card4, allNodes, 'up', { activeView: 'library' });
      expect(upFromCard4?.id).toBe('card-1');

      // 5. Up from card0 (Row 0) -> tabAlbums (centerX aligned)
      const upFromCard0 = findNextFocusableNode(card0, allNodes, 'up', { activeView: 'library' });
      expect(upFromCard0?.id).toBe('library-tab-albums');

      // 6. Left from card3 (Col 0) -> sidebar-library
      const leftFromCol0 = findNextFocusableNode(card3, allNodes, 'left', { activeView: 'library' });
      expect(leftFromCol0?.id).toBe('sidebar-library');

      // 7. Down from card4 (Row 1, bottom row) -> dockPlay
      const downFromBottomRow = findNextFocusableNode(card4, allNodes, 'down', { activeView: 'library' });
      expect(downFromBottomRow?.id).toBe('dock-btn-play');
    });
  });

  describe('Album Detail View Split Navigation', () => {
    it('correctly transitions between album actions and tracklist rows', () => {
      const sidebarLib = createMockNode('sidebar-library', 0, 170, 96, 50, 'sidebar');
      const btnPlay = createMockNode('album-btn-play', 200, 450, 140, 50, 'album-actions');
      const btnShuffle = createMockNode('album-btn-shuffle', 360, 450, 50, 50, 'album-actions');

      const track1 = createMockNode('track-row-1', 700, 200, 500, 45, 'album-tracks');
      const track2 = createMockNode('track-row-2', 700, 260, 500, 45, 'album-tracks');
      const track3 = createMockNode('track-row-3', 700, 320, 500, 45, 'album-tracks');

      const dockPlay = createMockNode('dock-btn-play', 960, 1020, 50, 50, 'bottom-dock');

      const allNodes = [sidebarLib, btnPlay, btnShuffle, track1, track2, track3, dockPlay];

      // 1. Right from btnShuffle -> track1
      const rightFromBtn = findNextFocusableNode(btnShuffle, allNodes, 'right', { activeView: 'album-detail' });
      expect(rightFromBtn?.id).toBe('track-row-1');

      // 2. Down from track1 -> track2
      const downFromTrack1 = findNextFocusableNode(track1, allNodes, 'down', { activeView: 'album-detail' });
      expect(downFromTrack1?.id).toBe('track-row-2');

      // 3. Left from track2 -> btnPlay (action bar)
      const leftFromTrack2 = findNextFocusableNode(track2, allNodes, 'left', { activeView: 'album-detail' });
      expect(leftFromTrack2?.id).toBe('album-btn-play');

      // 4. Left from btnPlay -> sidebar-library
      const leftFromBtnPlay = findNextFocusableNode(btnPlay, allNodes, 'left', { activeView: 'album-detail' });
      expect(leftFromBtnPlay?.id).toBe('sidebar-library');

      // 5. Down from track3 (last track) -> dockPlay
      const downFromLastTrack = findNextFocusableNode(track3, allNodes, 'down', { activeView: 'album-detail' });
      expect(downFromLastTrack?.id).toBe('dock-btn-play');
    });
  });

  describe('Now Playing Cinema View Navigation', () => {
    it('correctly navigates header, scrub bar, and transport controls', () => {
      const backBtn = createMockNode('np-btn-back', 40, 30, 40, 40, 'now-playing-header');
      const scrubBar = createMockNode('np-scrub-bar', 400, 400, 800, 30, 'now-playing-controls');
      const ctrlPrev = createMockNode('np-ctrl-prev', 700, 480, 50, 50, 'now-playing-controls');
      const ctrlPlay = createMockNode('np-ctrl-play', 770, 480, 70, 70, 'now-playing-controls');
      const ctrlNext = createMockNode('np-ctrl-next', 860, 480, 50, 50, 'now-playing-controls');

      const allNodes = [backBtn, scrubBar, ctrlPrev, ctrlPlay, ctrlNext];

      // Down from backBtn -> scrubBar
      const downFromBack = findNextFocusableNode(backBtn, allNodes, 'down', { activeView: 'now-playing' });
      expect(downFromBack?.id).toBe('np-scrub-bar');

      // Down from scrubBar -> ctrlPlay
      const downFromScrub = findNextFocusableNode(scrubBar, allNodes, 'down', { activeView: 'now-playing' });
      expect(downFromScrub?.id).toBe('np-ctrl-play');

      // Up from ctrlPlay -> scrubBar
      const upFromPlay = findNextFocusableNode(ctrlPlay, allNodes, 'up', { activeView: 'now-playing' });
      expect(upFromPlay?.id).toBe('np-scrub-bar');

      // Up from scrubBar -> backBtn
      const upFromScrub = findNextFocusableNode(scrubBar, allNodes, 'up', { activeView: 'now-playing' });
      expect(upFromScrub?.id).toBe('np-btn-back');

      // Right from ctrlPrev -> ctrlPlay
      const rightFromPrev = findNextFocusableNode(ctrlPrev, allNodes, 'right', { activeView: 'now-playing' });
      expect(rightFromPrev?.id).toBe('np-ctrl-play');
    });
  });

  describe('Tizen Hardware Remote Key Normalization', () => {
    it('correctly normalizes standard Arrow keys and e.key strings to spatial directions', () => {
      expect(getDirectionFromEvent({ keyCode: 38, key: 'ArrowUp' } as any)).toBe('up');
      expect(getDirectionFromEvent({ keyCode: 40, key: 'ArrowDown' } as any)).toBe('down');
      expect(getDirectionFromEvent({ keyCode: 37, key: 'ArrowLeft' } as any)).toBe('left');
      expect(getDirectionFromEvent({ keyCode: 39, key: 'ArrowRight' } as any)).toBe('right');
    });

    it('correctly maps Samsung TV platform-specific keycodes', () => {
      expect(getDirectionFromEvent({ keyCode: TIZEN_KEYS.TIZEN_UP, key: '' } as any)).toBe('up');
      expect(getDirectionFromEvent({ keyCode: TIZEN_KEYS.TIZEN_DOWN, key: '' } as any)).toBe('down');
      expect(getDirectionFromEvent({ keyCode: TIZEN_KEYS.TIZEN_LEFT, key: '' } as any)).toBe('left');
      expect(getDirectionFromEvent({ keyCode: TIZEN_KEYS.TIZEN_RIGHT, key: '' } as any)).toBe('right');
    });

    it('identifies Samsung TV multimedia keys correctly', () => {
      expect(isMediaPlay({ keyCode: 415, key: 'MediaPlay' } as any)).toBe(true);
      expect(isMediaPause({ keyCode: 19, key: 'MediaPause' } as any)).toBe(true);
      expect(isMediaPlayPause({ keyCode: 10252, key: 'MediaPlayPause' } as any)).toBe(true);
      expect(isMediaStop({ keyCode: 413, key: 'MediaStop' } as any)).toBe(true);
      expect(isMediaNext({ keyCode: 10233, key: 'MediaTrackNext' } as any)).toBe(true);
      expect(isMediaPrev({ keyCode: 10232, key: 'MediaTrackPrevious' } as any)).toBe(true);
      expect(isMediaFastForward({ keyCode: 417, key: 'MediaFastForward' } as any)).toBe(true);
      expect(isMediaRewind({ keyCode: 412, key: 'MediaRewind' } as any)).toBe(true);
    });

    it('identifies Enter and Back/Return keys correctly', () => {
      expect(isEnterKey({ keyCode: 13, key: 'Enter' } as any)).toBe(true);
      expect(isBackKey({ keyCode: 10009, key: '' } as any)).toBe(true);
      expect(isBackKey({ keyCode: 27, key: 'Escape' } as any)).toBe(true);
    });
  });

  describe('Sidebar Rail Full Reachability (Brand & Profile)', () => {
    it('navigates cleanly through sidebar brand, nav items, and profile', () => {
      const brand = createMockNode('sidebar-brand', 24, 20, 48, 48, 'sidebar');
      const home = createMockNode('sidebar-home', 24, 80, 48, 48, 'sidebar');
      const lib = createMockNode('sidebar-library', 24, 140, 48, 48, 'sidebar');
      const settings = createMockNode('sidebar-settings', 24, 900, 48, 48, 'sidebar');
      const profile = createMockNode('sidebar-profile', 24, 960, 48, 48, 'sidebar');

      const heroResume = createMockNode('hero-resume', 200, 500, 150, 50, 'hero-actions');
      const allNodes = [brand, home, lib, settings, profile, heroResume];

      // Up from home -> brand
      const upFromHome = findNextFocusableNode(home, allNodes, 'up', { activeView: 'home' });
      expect(upFromHome?.id).toBe('sidebar-brand');

      // Down from brand -> home
      const downFromBrand = findNextFocusableNode(brand, allNodes, 'down', { activeView: 'home' });
      expect(downFromBrand?.id).toBe('sidebar-home');

      // Down from settings -> profile
      const downFromSettings = findNextFocusableNode(settings, allNodes, 'down', { activeView: 'home' });
      expect(downFromSettings?.id).toBe('sidebar-profile');

      // Up from profile -> settings
      const upFromProfile = findNextFocusableNode(profile, allNodes, 'up', { activeView: 'home' });
      expect(upFromProfile?.id).toBe('sidebar-settings');

      // Right from brand -> heroResume (entry point)
      const rightFromBrand = findNextFocusableNode(brand, allNodes, 'right', { activeView: 'home' });
      expect(rightFromBrand?.id).toBe('hero-resume');

      // Right from profile -> heroResume (entry point)
      const rightFromProfile = findNextFocusableNode(profile, allNodes, 'right', { activeView: 'home' });
      expect(rightFromProfile?.id).toBe('hero-resume');
    });
  });
});
