import { describe, it, expect, beforeEach } from 'vitest';
import { findNextFocusableNode, getViewEntryPoint } from '../spatialMath';
import { FocusableNode } from '../../types/navigation';

describe('Artist Detail & Artists Grid Spatial Navigation', () => {
  beforeEach(() => {
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

  describe('Artist Detail View Entry & Action Bar Navigation', () => {
    it('sets primary entry point to Play Top Tracks button', () => {
      const backBtn = createMockNode('artist-detail-back', 160, 40, 140, 40, 'artist-hero');
      const playBtn = createMockNode('artist-btn-play-top', 400, 260, 180, 50, 'artist-actions');
      const radioBtn = createMockNode('artist-btn-radio', 600, 260, 160, 50, 'artist-actions');
      const track1 = createMockNode('artist-track-1', 160, 400, 1000, 60, 'artist-top-tracks');

      const candidates = [backBtn, playBtn, radioBtn, track1];
      const entry = getViewEntryPoint('artist-detail', candidates);
      expect(entry?.id).toBe('artist-btn-play-top');
    });

    it('navigates horizontally across action buttons and escapes Left to Sidebar', () => {
      const sidebar = createMockNode('sidebar-library', 20, 200, 60, 60, 'sidebar');
      const backBtn = createMockNode('artist-detail-back', 160, 40, 140, 40, 'artist-hero');
      const playBtn = createMockNode('artist-btn-play-top', 400, 260, 180, 50, 'artist-actions');
      const radioBtn = createMockNode('artist-btn-radio', 600, 260, 160, 50, 'artist-actions');

      const candidates = [sidebar, backBtn, playBtn, radioBtn];

      // Right from Play Top Tracks -> Artist Radio
      const next1 = findNextFocusableNode(playBtn, candidates, 'right', { activeView: 'artist-detail' });
      expect(next1?.id).toBe('artist-btn-radio');

      // Left from Artist Radio -> Play Top Tracks
      const next2 = findNextFocusableNode(radioBtn, candidates, 'left', { activeView: 'artist-detail' });
      expect(next2?.id).toBe('artist-btn-play-top');

      // Left from Play Top Tracks (leftmost action) -> escapes to Sidebar
      const next3 = findNextFocusableNode(playBtn, candidates, 'left', { activeView: 'artist-detail' });
      expect(next3?.id).toBe('sidebar-library');

      // Up from Play Top Tracks -> Back to Artists button
      const next4 = findNextFocusableNode(playBtn, candidates, 'up', { activeView: 'artist-detail' });
      expect(next4?.id).toBe('artist-detail-back');
    });
  });

  describe('Artist Detail Top Songs & Discography Smooth D-Pad Transitions', () => {
    it('traverses cleanly from action buttons down through Top Songs into Discography albums and Bottom Dock', () => {
      const sidebar = createMockNode('sidebar-library', 20, 200, 60, 60, 'sidebar');
      const playBtn = createMockNode('artist-btn-play-top', 400, 260, 180, 50, 'artist-actions');
      const track1 = createMockNode('artist-track-101', 160, 400, 1000, 56, 'artist-top-tracks');
      const track2 = createMockNode('artist-track-102', 160, 470, 1000, 56, 'artist-top-tracks');
      const album1 = createMockNode('artist-album-card-1', 160, 600, 200, 260, 'artist-albums');
      const album2 = createMockNode('artist-album-card-2', 380, 600, 200, 260, 'artist-albums');
      const dockPlay = createMockNode('dock-btn-play', 960, 1000, 60, 60, 'bottom-dock');

      const candidates = [sidebar, playBtn, track1, track2, album1, album2, dockPlay];

      // 1. Down from playBtn -> first top song
      const down1 = findNextFocusableNode(playBtn, candidates, 'down', { activeView: 'artist-detail' });
      expect(down1?.id).toBe('artist-track-101');

      // 2. Down from track1 -> track2
      const down2 = findNextFocusableNode(track1, candidates, 'down', { activeView: 'artist-detail' });
      expect(down2?.id).toBe('artist-track-102');

      // 3. Down from last track (track2) -> enters Discography albums
      const down3 = findNextFocusableNode(track2, candidates, 'down', { activeView: 'artist-detail' });
      expect(down3?.id).toBe('artist-album-card-1');

      // 4. Horizontal navigation in Discography shelf
      const rightAlbum = findNextFocusableNode(album1, candidates, 'right', { activeView: 'artist-detail' });
      expect(rightAlbum?.id).toBe('artist-album-card-2');

      // 5. Left from col 0 of Discography -> escapes to Sidebar
      const leftAlbum = findNextFocusableNode(album1, candidates, 'left', { activeView: 'artist-detail' });
      expect(leftAlbum?.id).toBe('sidebar-library');

      // 6. Down from Discography albums -> bottom dock
      const downDock = findNextFocusableNode(album1, candidates, 'down', { activeView: 'artist-detail' });
      expect(downDock?.id).toBe('dock-btn-play');

      // 7. Up from bottom dock -> restores spatially closest Discography album shelf
      const upFromDock = findNextFocusableNode(dockPlay, candidates, 'up', { activeView: 'artist-detail' });
      expect(upFromDock?.id).toBe('artist-album-card-2');

      // 8. Up from Discography album -> returns to last top song
      const upToTracks = findNextFocusableNode(album1, candidates, 'up', { activeView: 'artist-detail' });
      expect(upToTracks?.id).toBe('artist-track-102');

      // 9. Up from top song -> returns to Play Top Tracks button
      const upToHero = findNextFocusableNode(track1, candidates, 'up', { activeView: 'artist-detail' });
      expect(upToHero?.id).toBe('artist-btn-play-top');
    });

    it('escapes Left from Top Songs tracklist directly into Sidebar rail', () => {
      const sidebar = createMockNode('sidebar-library', 20, 200, 60, 60, 'sidebar');
      const track1 = createMockNode('artist-track-1', 160, 400, 1000, 56, 'artist-top-tracks');

      const candidates = [sidebar, track1];
      const next = findNextFocusableNode(track1, candidates, 'left', { activeView: 'artist-detail' });
      expect(next?.id).toBe('sidebar-library');
    });
  });

  describe('ArtistsView Circular Cards & Multi-row Grid Navigation', () => {
    it('navigates across circular cards, escapes Left to Sidebar and Down into Bottom Dock', () => {
      const sidebar = createMockNode('sidebar-library', 20, 200, 60, 60, 'sidebar');
      const artist1 = createMockNode('artist-card-1', 160, 120, 220, 280, 'artists-grid');
      const artist2 = createMockNode('artist-card-2', 400, 120, 220, 280, 'artists-grid');
      const artist3 = createMockNode('artist-card-3', 160, 420, 220, 280, 'artists-grid');
      const artist4 = createMockNode('artist-card-4', 400, 420, 220, 280, 'artists-grid');
      const dockPlay = createMockNode('dock-btn-play', 960, 1000, 60, 60, 'bottom-dock');

      const candidates = [sidebar, artist1, artist2, artist3, artist4, dockPlay];

      // Right from artist1 -> artist2
      const right1 = findNextFocusableNode(artist1, candidates, 'right', { activeView: 'artists' });
      expect(right1?.id).toBe('artist-card-2');

      // Left from col 0 (artist1) -> escapes to Sidebar
      const left1 = findNextFocusableNode(artist1, candidates, 'left', { activeView: 'artists' });
      expect(left1?.id).toBe('sidebar-library');

      // Down from artist1 (Row 0) -> artist3 (Row 1)
      const down1 = findNextFocusableNode(artist1, candidates, 'down', { activeView: 'artists' });
      expect(down1?.id).toBe('artist-card-3');

      // Down from artist3 (last row) -> bottom dock
      const downToDock = findNextFocusableNode(artist3, candidates, 'down', { activeView: 'artists' });
      expect(downToDock?.id).toBe('dock-btn-play');

      // Up from artist3 -> artist1
      const up1 = findNextFocusableNode(artist3, candidates, 'up', { activeView: 'artists' });
      expect(up1?.id).toBe('artist-card-1');
    });
  });
});
