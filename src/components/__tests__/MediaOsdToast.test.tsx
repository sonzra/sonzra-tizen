import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { SpatialNavigationProvider } from '../../navigation/SpatialNavigationContext';
import { MediaOsdToast, showOsdToast } from '../MediaOsdToast';
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

  it('renders queue feedback toast with album track count and auto-dismisses after 2.8s', async () => {
    vi.spyOn(PlayerContextModule, 'usePlayer').mockImplementation(() => ({
      currentTrack: null,
      playbackStatus: 'idle',
      toastMessage: {
        id: 12345,
        label: 'ADDED TO QUEUE',
        message: 'Added 12 tracks from "Echoes of Eternity" to queue',
        icon: 'queue',
        duration: 2800,
      },
    } as any));

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <SpatialNavigationProvider>
          <MediaOsdToast />
        </SpatialNavigationProvider>
      );
      vi.advanceTimersByTime(50);
    });

    const toast = document.querySelector('[role="status"]');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain('ADDED TO QUEUE');
    expect(toast?.textContent).toContain('Added 12 tracks from "Echoes of Eternity" to queue');

    // Still visible at 2500ms
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    expect(document.querySelector('[role="status"]')).not.toBeNull();

    // Dismissed after 2800ms
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(document.querySelector('[role="status"]')).toBeNull();
  });

  it('renders queue feedback toast for single track addition', async () => {
    vi.spyOn(PlayerContextModule, 'usePlayer').mockImplementation(() => ({
      currentTrack: null,
      playbackStatus: 'idle',
      toastMessage: {
        id: 67890,
        label: 'ADDED TO QUEUE',
        message: 'Added "Starlight Serenades" to queue',
        icon: 'queue',
        duration: 2800,
      },
    } as any));

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <SpatialNavigationProvider>
          <MediaOsdToast />
        </SpatialNavigationProvider>
      );
      vi.advanceTimersByTime(50);
    });

    const toast = document.querySelector('[role="status"]');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain('ADDED TO QUEUE');
    expect(toast?.textContent).toContain('Added "Starlight Serenades" to queue');
  });

  it('renders custom queue/favorite notifications via showOsdToast and auto-dismisses', async () => {
    vi.spyOn(PlayerContextModule, 'usePlayer').mockImplementation(() => ({
      currentTrack: null,
      queue: [],
      history: [],
      currentIndex: -1,
      playbackStatus: 'idle',
      currentTime: 0,
      duration: 0,
      shuffle: false,
      repeat: 'off',
      radioEnabled: false,
      volume: 1,
      isMuted: false,
      playTrack: vi.fn(),
      playAlbum: vi.fn(),
      playTracks: vi.fn(),
      playNext: vi.fn(),
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
      lyrics: null,
      lyricsLoading: false,
      lyricsFollowing: true,
      setLyricsFollowing: vi.fn(),
      loadLyrics: vi.fn(),
    } as any));

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <SpatialNavigationProvider>
          <MediaOsdToast />
        </SpatialNavigationProvider>
      );
    });

    // Trigger custom queue toast
    await act(async () => {
      showOsdToast({
        label: 'ADDED TO QUEUE',
        title: 'Song of the Wind',
        icon: 'queue',
      });
      vi.advanceTimersByTime(50);
    });

    const toast = document.querySelector('[role="status"]');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain('ADDED TO QUEUE');
    expect(toast?.textContent).toContain('Song of the Wind');

    // Advance timers past 1600ms
    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    expect(document.querySelector('[role="status"]')).toBeNull();
  });
});
