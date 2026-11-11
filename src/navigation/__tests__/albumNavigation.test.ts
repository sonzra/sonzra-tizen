import { describe, it, expect, beforeEach } from 'vitest';
import { findNextFocusableNode } from '../spatialMath';
import { FocusableNode } from '../../types/navigation';

describe('Album Detail View Spatial Navigation', () => {
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

  it('navigates horizontally across action buttons before entering tracklist', () => {
    const sidebar = createMockNode('sidebar-library', 20, 200, 60, 60, 'sidebar');
    const playBtn = createMockNode('album-btn-play', 160, 500, 160, 50, 'album-actions');
    const shuffleBtn = createMockNode('album-btn-shuffle', 340, 500, 50, 50, 'album-actions');
    const queueBtn = createMockNode('album-btn-queue', 400, 500, 50, 50, 'album-actions');
    const favBtn = createMockNode('album-btn-fav', 460, 500, 50, 50, 'album-actions');
    const track1 = createMockNode('track-row-1', 900, 150, 700, 60, 'album-tracks');
    const track2 = createMockNode('track-row-2', 900, 220, 700, 60, 'album-tracks');

    const candidates = [sidebar, playBtn, shuffleBtn, queueBtn, favBtn, track1, track2];

    // Right from play -> shuffle
    const next1 = findNextFocusableNode(playBtn, candidates, 'right', { activeView: 'album-detail' });
    expect(next1?.id).toBe('album-btn-shuffle');

    // Right from shuffle -> queue
    const next2 = findNextFocusableNode(shuffleBtn, candidates, 'right', { activeView: 'album-detail' });
    expect(next2?.id).toBe('album-btn-queue');

    // Right from queue -> fav
    const next3 = findNextFocusableNode(queueBtn, candidates, 'right', { activeView: 'album-detail' });
    expect(next3?.id).toBe('album-btn-fav');

    // Right from fav (rightmost action) -> enters tracklist
    const next4 = findNextFocusableNode(favBtn, candidates, 'right', { activeView: 'album-detail' });
    expect(next4?.id).toBe('track-row-1');
  });

  it('navigates left from tracklist back to action buttons and escapes to sidebar', () => {
    const sidebar = createMockNode('sidebar-library', 20, 200, 60, 60, 'sidebar');
    const playBtn = createMockNode('album-btn-play', 160, 500, 160, 50, 'album-actions');
    const shuffleBtn = createMockNode('album-btn-shuffle', 340, 500, 50, 50, 'album-actions');
    const track1 = createMockNode('track-row-1', 900, 150, 700, 60, 'album-tracks');

    const candidates = [sidebar, playBtn, shuffleBtn, track1];

    // Left from track -> returns to play button
    const next1 = findNextFocusableNode(track1, candidates, 'left', { activeView: 'album-detail' });
    expect(next1?.id).toBe('album-btn-play');

    // Left from play button -> escapes to sidebar
    const next2 = findNextFocusableNode(playBtn, candidates, 'left', { activeView: 'album-detail' });
    expect(next2?.id).toBe('sidebar-library');
  });

  it('navigates vertically down through tracks into bottom dock and restores via group memory', () => {
    const playBtn = createMockNode('album-btn-play', 160, 500, 160, 50, 'album-actions');
    const track1 = createMockNode('track-row-1', 900, 150, 700, 60, 'album-tracks');
    const track2 = createMockNode('track-row-2', 900, 220, 700, 60, 'album-tracks');
    const dockPlay = createMockNode('dock-btn-play', 960, 1000, 60, 60, 'bottom-dock');

    const candidates = [playBtn, track1, track2, dockPlay];

    // Down from playBtn -> enters tracklist
    const downFromPlay = findNextFocusableNode(playBtn, candidates, 'down', { activeView: 'album-detail' });
    expect(downFromPlay?.id).toBe('track-row-1');

    // Down from track1 -> track2
    const downFromTrack1 = findNextFocusableNode(track1, candidates, 'down', { activeView: 'album-detail' });
    expect(downFromTrack1?.id).toBe('track-row-2');

    // Down from last track -> enters bottom dock
    const downFromTrack2 = findNextFocusableNode(track2, candidates, 'down', { activeView: 'album-detail' });
    expect(downFromTrack2?.id).toBe('dock-btn-play');

    // Up from bottom dock with lastFocusedContentId = track-row-2 -> restores track-row-2
    const upFromDock = findNextFocusableNode(dockPlay, candidates, 'up', {
      activeView: 'album-detail',
      lastFocusedContentId: 'track-row-2',
    });
    expect(upFromDock?.id).toBe('track-row-2');

    // Up from track1 -> returns to album-btn-play
    const upFromTrack1 = findNextFocusableNode(track1, candidates, 'up', { activeView: 'album-detail' });
    expect(upFromTrack1?.id).toBe('album-btn-play');
  });
});
