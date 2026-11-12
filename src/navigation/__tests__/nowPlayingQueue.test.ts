import { describe, it, expect, beforeEach } from 'vitest';
import { findNextFocusableNode } from '../spatialMath';
import { FocusableNode } from '../../types/navigation';

describe('Now Playing Queue Spatial Navigation & Safe Traversal', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  function createMockNode(
    id: string,
    left: number,
    top: number,
    width = 60,
    height = 60,
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

  it('navigates cleanly right from transport controls into queue panel without scrub trap', () => {
    const backBtn = createMockNode('np-btn-back', 40, 20, 40, 40, 'now-playing-header');
    const scrubBar = createMockNode('np-scrub-bar', 600, 300, 500, 30, 'now-playing-controls');
    const playBtn = createMockNode('np-ctrl-play', 700, 360, 64, 64, 'now-playing-controls');
    const nextBtn = createMockNode('np-ctrl-next', 780, 360, 48, 48, 'now-playing-controls');
    const favBtn = createMockNode('np-ctrl-fav', 850, 360, 48, 48, 'now-playing-controls');

    const queue1 = createMockNode('np-queue-track-1', 1300, 200, 350, 60, 'now-playing-queue');
    const queue2 = createMockNode('np-queue-track-2', 1300, 270, 350, 60, 'now-playing-queue');

    const candidates = [backBtn, scrubBar, playBtn, nextBtn, favBtn, queue1, queue2];

    // Right from favBtn -> queue1
    const nextFromFav = findNextFocusableNode(favBtn, candidates, 'right', { activeView: 'now-playing' });
    expect(nextFromFav?.id).toBe('np-queue-track-1');

    // Down from queue1 -> queue2
    const nextInQueue = findNextFocusableNode(queue1, candidates, 'down', { activeView: 'now-playing' });
    expect(nextInQueue?.id).toBe('np-queue-track-2');

    // Left from queue2 -> back to play control
    const backToControls = findNextFocusableNode(queue2, candidates, 'left', { activeView: 'now-playing' });
    expect(backToControls?.id).toBe('np-ctrl-play');
  });

  it('navigates up inside queue and reaches back button when at top', () => {
    const backBtn = createMockNode('np-btn-back', 40, 20, 40, 40, 'now-playing-header');
    const queue1 = createMockNode('np-queue-track-1', 1300, 200, 350, 60, 'now-playing-queue');
    const queue2 = createMockNode('np-queue-track-2', 1300, 270, 350, 60, 'now-playing-queue');

    const candidates = [backBtn, queue1, queue2];

    const upFromQ2 = findNextFocusableNode(queue2, candidates, 'up', { activeView: 'now-playing' });
    expect(upFromQ2?.id).toBe('np-queue-track-1');

    const upFromQ1 = findNextFocusableNode(queue1, candidates, 'up', { activeView: 'now-playing' });
    expect(upFromQ1?.id).toBe('np-btn-back');
  });
});
