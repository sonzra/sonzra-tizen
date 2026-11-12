import { describe, it, expect, beforeEach } from 'vitest';
import { findNextFocusableNode } from '../spatialMath';
import { FocusableNode } from '../../types/navigation';

describe('Player Dock Fast Navigation & Ergonomics', () => {
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

  it('navigates from bottom of sidebar rail directly into bottom player dock', () => {
    const sidebarHome = createMockNode('sidebar-home', 10, 100, 50, 50, 'sidebar');
    const sidebarProfile = createMockNode('sidebar-profile', 10, 700, 40, 40, 'sidebar');
    const sidebarDock = createMockNode('sidebar-player-dock', 10, 760, 48, 48, 'sidebar');

    const dockTrack = createMockNode('dock-track-info', 120, 980, 200, 60, 'bottom-dock');
    const dockPlay = createMockNode('dock-btn-play', 500, 980, 60, 60, 'bottom-dock');

    const candidates = [sidebarHome, sidebarProfile, sidebarDock, dockTrack, dockPlay];

    // Down from sidebarProfile -> sidebarDock
    const next1 = findNextFocusableNode(sidebarProfile, candidates, 'down', { activeView: 'home' });
    expect(next1?.id).toBe('sidebar-player-dock');

    // Down from sidebarDock -> dock-btn-play
    const next2 = findNextFocusableNode(sidebarDock, candidates, 'down', { activeView: 'home' });
    expect(next2?.id).toBe('dock-btn-play');
  });

  it('navigates left from leftmost dock item into sidebar-player-dock', () => {
    const sidebarDock = createMockNode('sidebar-player-dock', 10, 760, 48, 48, 'sidebar');
    const sidebarHome = createMockNode('sidebar-home', 10, 100, 50, 50, 'sidebar');
    const dockTrack = createMockNode('dock-track-info', 120, 980, 200, 60, 'bottom-dock');
    const dockPlay = createMockNode('dock-btn-play', 500, 980, 60, 60, 'bottom-dock');

    const candidates = [sidebarHome, sidebarDock, dockTrack, dockPlay];

    // Left from dock-btn-play -> dock-track-info
    const next1 = findNextFocusableNode(dockPlay, candidates, 'left', { activeView: 'home' });
    expect(next1?.id).toBe('dock-track-info');

    // Left from dock-track-info -> sidebar-player-dock
    const next2 = findNextFocusableNode(dockTrack, candidates, 'left', { activeView: 'home' });
    expect(next2?.id).toBe('sidebar-player-dock');
  });

  it('enables left barrier escape to sidebar and then 1-step down to player dock', () => {
    const sidebarHome = createMockNode('sidebar-home', 10, 100, 50, 50, 'sidebar');
    const sidebarDock = createMockNode('sidebar-player-dock', 10, 760, 48, 48, 'sidebar');
    const heroResume = createMockNode('hero-resume', 150, 200, 180, 50, 'hero-actions');
    const dockPlay = createMockNode('dock-btn-play', 500, 980, 60, 60, 'bottom-dock');

    const candidates = [sidebarHome, sidebarDock, heroResume, dockPlay];

    // Left from hero-resume escapes to sidebar
    const step1 = findNextFocusableNode(heroResume, candidates, 'left', { activeView: 'home' });
    expect(step1?.group).toBe('sidebar');

    // Down from sidebarDock enters player dock directly
    const step2 = findNextFocusableNode(sidebarDock, candidates, 'down', { activeView: 'home' });
    expect(step2?.id).toBe('dock-btn-play');
  });
});
