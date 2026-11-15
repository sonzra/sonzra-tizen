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

  it('navigates through extended queue (> 5 items) smoothly without focus loss', () => {
    const queueItems: FocusableNode[] = [];
    for (let i = 0; i < 8; i++) {
      queueItems.push(createMockNode(`np-queue-track-${i + 1}`, 1300, 200 + i * 70, 350, 60, 'now-playing-queue'));
    }

    // Down from item 4 to item 5, then item 5 to 6, 6 to 7, 7 to 8
    for (let i = 0; i < 7; i++) {
      const nextNode = findNextFocusableNode(queueItems[i], queueItems, 'down', { activeView: 'now-playing' });
      expect(nextNode?.id).toBe(`np-queue-track-${i + 2}`);
    }

    // Up from item 8 back to item 7, etc.
    for (let i = 7; i > 0; i--) {
      const prevNode = findNextFocusableNode(queueItems[i], queueItems, 'up', { activeView: 'now-playing' });
      expect(prevNode?.id).toBe(`np-queue-track-${i}`);
    }
  });

  it('navigates through tabs, lyrics lines, and resume follow button cleanly', () => {
    const tabQueue = createMockNode('np-tab-queue', 1300, 150, 100, 36, 'now-playing-tabs');
    const tabLyrics = createMockNode('np-tab-lyrics', 1410, 150, 100, 36, 'now-playing-tabs');
    const resumeBtn = createMockNode('np-lyrics-resume-follow', 1350, 200, 180, 40, 'now-playing-lyrics');
    const lyric1 = createMockNode('np-lyric-0', 1300, 260, 350, 50, 'now-playing-lyrics');
    const lyric2 = createMockNode('np-lyric-1', 1300, 320, 350, 50, 'now-playing-lyrics');
    const playBtn = createMockNode('np-ctrl-play', 700, 360, 64, 64, 'now-playing-controls');

    const candidates = [tabQueue, tabLyrics, resumeBtn, lyric1, lyric2, playBtn];

    // Right from tabQueue -> tabLyrics
    const rightTab = findNextFocusableNode(tabQueue, candidates, 'right', { activeView: 'now-playing' });
    expect(rightTab?.id).toBe('np-tab-lyrics');

    // Down from tabLyrics -> resumeBtn (or top lyric)
    const downFromTab = findNextFocusableNode(tabLyrics, candidates, 'down', { activeView: 'now-playing' });
    expect(downFromTab?.id).toBe('np-lyrics-resume-follow');

    // Down from resumeBtn -> lyric1
    const downFromResume = findNextFocusableNode(resumeBtn, candidates, 'down', { activeView: 'now-playing' });
    expect(downFromResume?.id).toBe('np-lyric-0');

    // Down from lyric1 -> lyric2
    const downToL2 = findNextFocusableNode(lyric1, candidates, 'down', { activeView: 'now-playing' });
    expect(downToL2?.id).toBe('np-lyric-1');

    // Left from lyric2 -> back to playBtn (no trap)
    const leftToControls = findNextFocusableNode(lyric2, candidates, 'left', { activeView: 'now-playing' });
    expect(leftToControls?.id).toBe('np-ctrl-play');

    // Up from resumeBtn -> tabs
    const upFromResume = findNextFocusableNode(resumeBtn, candidates, 'up', { activeView: 'now-playing' });
    expect(upFromResume?.id).toBe('np-tab-queue');
  });
});
