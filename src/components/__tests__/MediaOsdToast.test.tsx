import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { SpatialNavigationProvider } from '../../navigation/SpatialNavigationContext';
import { MediaOsdToast } from '../MediaOsdToast';
import * as PlayerContextModule from '../../context/PlayerContext';

describe('MediaOsdToast Component', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders media feedback without redundant TV REMOTE label and auto-dismisses despite playback status change', async () => {
    let currentPlaybackStatus: 'playing' | 'paused' | 'idle' = 'paused';

    vi.spyOn(PlayerContextModule, 'usePlayer').mockImplementation(() => ({
      currentTrack: {
        id: 'track-1',
        title: 'Celestial Dream',
        artist: 'Sonzra Artist',
        album: 'Ambient Journey',
        duration: 240,
      },
      queue: [],
      history: [],
      currentIndex: 0,
      playbackStatus: currentPlaybackStatus,
      currentTime: 10,
      duration: 240,
      shuffle: false,
      repeat: 'off',
      radioEnabled: false,
      volume: 1,
      isMuted: false,
      playTrack: vi.fn(),
      playAlbum: vi.fn(),
      playTracks: vi.fn(),
      addToQueue: vi.fn(),
      togglePlayPause: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      next: vi.fn(),
      prev: vi.fn(),
      seek: vi.fn(),
      toggleShuffle: vi.fn(),
      cycleRepeat: vi.fn(),
      toggleRadio: vi.fn(),
      startRadio: vi.fn(),
      setVolume: vi.fn(),
      toggleMute: vi.fn(),
    } as any));

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <SpatialNavigationProvider>
          <MediaOsdToast />
        </SpatialNavigationProvider>
      );
    });

    // Dispatch physical remote PlayPause keydown event
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'MediaPlayPause', bubbles: true }));
      vi.advanceTimersByTime(50);
    });

    // Check that toast is rendered
    const toast = document.querySelector('[role="status"]');
    expect(toast).not.toBeNull();
    // Verify "TV REMOTE" prefix is removed
    expect(toast?.textContent).not.toContain('TV REMOTE');
    expect(toast?.textContent).toContain('PLAYING');
    expect(toast?.textContent).toContain('Celestial Dream');

    // Simulate playbackStatus changing to 'playing' immediately after
    currentPlaybackStatus = 'playing';
    await act(async () => {
      root.render(
        <SpatialNavigationProvider>
          <MediaOsdToast />
        </SpatialNavigationProvider>
      );
      vi.advanceTimersByTime(100);
    });

    // The toast should STILL be visible before 1600ms expires
    expect(document.querySelector('[role="status"]')).not.toBeNull();

    // Advance timers past 1600ms (e.g. 1700ms)
    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    // Toast should now be auto-dismissed (null)
    expect(document.querySelector('[role="status"]')).toBeNull();
  });
});
