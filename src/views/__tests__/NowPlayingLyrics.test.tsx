import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { SpatialNavigationProvider } from '../../navigation/SpatialNavigationContext';
import { NowPlayingView } from '../NowPlayingView';
import * as PlayerContextModule from '../../context/PlayerContext';

describe('NowPlayingView Queue & Synchronized Lyrics', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  const mockTrack = {
    id: 'track-1',
    title: 'Starfall Over Horizon',
    artist: 'Astral Echoes',
    album: 'Cosmic Journey',
    duration: 300,
    artworkUrl: './test-art.png',
  };

  const mockQueue = [
    mockTrack,
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `queue-track-${i + 2}`,
      title: `Queue Track ${i + 2}`,
      artist: 'Astral Echoes',
      album: 'Cosmic Journey',
      duration: 180 + i * 10,
    })),
  ];

  const mockLyrics = {
    available: true,
    synchronized: true,
    lines: [
      { text: 'Into the silence of midnight', start: 0 },
      { text: 'A beacon guides us onward', start: 10 },
      { text: 'Waves of sound resonant forever', start: 25 },
      { text: 'Stars collide in harmony', start: 40 },
    ],
  };

  it('renders redesigned borderless queue container and scrolls on item focus', async () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
    window.Element.prototype.scrollIntoView = scrollIntoViewMock;
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    vi.spyOn(PlayerContextModule, 'usePlayer').mockImplementation(() => ({
      currentTrack: mockTrack,
      queue: mockQueue,
      currentIndex: 0,
      playbackStatus: 'playing',
      currentTime: 12,
      duration: 300,
      shuffle: false,
      repeat: 'off',
      radioEnabled: false,
      volume: 1,
      isMuted: false,
      lyrics: mockLyrics,
      lyricsLoading: false,
      lyricsFollowing: true,
      setLyricsFollowing: vi.fn(),
      loadLyrics: vi.fn(),
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
          <NowPlayingView />
        </SpatialNavigationProvider>
      );
    });

    // Check queue container has redesigned semi-translucent backdrop without rigid border
    const queuePanel = document.querySelector('[data-testid="now-playing-right-panel"]');
    expect(queuePanel).not.toBeNull();
    expect(queuePanel?.className).toContain('bg-surface-container-lowest/30');

    // Verify dummy spectrum visualizer box is completely removed
    expect(container.textContent).not.toContain('Animated Audio Spectrum Visualizer');

    // Find queue track 6 (beyond 5 items)
    const track6 = document.querySelector('[data-focus-id="np-queue-queue-track-7"]');
    expect(track6).not.toBeNull();

    // Trigger focus on track 6
    await act(async () => {
      track6?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(scrollIntoViewMock).toHaveBeenCalledWith(
      expect.objectContaining({ block: 'nearest' })
    );
    // Verify smooth scroll behavior is completely bypassed to prevent ARM CPU choke
    expect(scrollIntoViewMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    );
  });

  it('renders synchronized lyrics, highlights active line, and allows seeking', async () => {
    const seekMock = vi.fn();
    const setLyricsFollowingMock = vi.fn();

    vi.spyOn(PlayerContextModule, 'usePlayer').mockImplementation(() => ({
      currentTrack: mockTrack,
      queue: mockQueue,
      currentIndex: 0,
      playbackStatus: 'playing',
      currentTime: 12, // Active line should be line index 1 (start: 10 <= 12 < 25)
      duration: 300,
      shuffle: false,
      repeat: 'off',
      radioEnabled: false,
      volume: 1,
      isMuted: false,
      lyrics: mockLyrics,
      lyricsLoading: false,
      lyricsFollowing: true,
      setLyricsFollowing: setLyricsFollowingMock,
      loadLyrics: vi.fn(),
      playTrack: vi.fn(),
      playAlbum: vi.fn(),
      playTracks: vi.fn(),
      addToQueue: vi.fn(),
      togglePlayPause: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      next: vi.fn(),
      prev: vi.fn(),
      seek: seekMock,
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
          <NowPlayingView />
        </SpatialNavigationProvider>
      );
    });

    // Switch to lyrics tab
    const lyricsTab = document.querySelector('[data-focus-id="np-tab-lyrics"]');
    expect(lyricsTab).not.toBeNull();
    await act(async () => {
      lyricsTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Check lyrics rendered
    const lyricLine0 = document.querySelector('[data-focus-id="np-lyric-0"]');
    const lyricLine1 = document.querySelector('[data-focus-id="np-lyric-1"]');
    expect(lyricLine0).not.toBeNull();
    expect(lyricLine1).not.toBeNull();
    expect(lyricLine1?.textContent).toContain('A beacon guides us onward');

    // Line 1 is active (current) with >=24px font and radiant cyan
    expect(lyricLine1?.innerHTML).toContain('text-secondary');
    expect(lyricLine1?.innerHTML).toContain('text-2xl');

    // Line 0 is inactive with >=24px font and high-contrast #E2E1E6
    expect(lyricLine0?.innerHTML).toContain('text-2xl');
    expect(lyricLine0?.innerHTML).toContain('text-[#E2E1E6]/75');

    // Click line 2 to seek to timestamp 25
    const lyricLine2 = document.querySelector('[data-focus-id="np-lyric-2"]');
    await act(async () => {
      lyricLine2?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(seekMock).toHaveBeenCalledWith(25);
  });

  it('renders graceful fallback when lyrics are unavailable', async () => {
    vi.spyOn(PlayerContextModule, 'usePlayer').mockImplementation(() => ({
      currentTrack: mockTrack,
      queue: mockQueue,
      currentIndex: 0,
      playbackStatus: 'playing',
      currentTime: 12,
      duration: 300,
      shuffle: false,
      repeat: 'off',
      radioEnabled: false,
      volume: 1,
      isMuted: false,
      lyrics: { available: false, synchronized: false, lines: [] },
      lyricsLoading: false,
      lyricsFollowing: true,
      setLyricsFollowing: vi.fn(),
      loadLyrics: vi.fn(),
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
          <NowPlayingView />
        </SpatialNavigationProvider>
      );
    });

    // Switch to lyrics tab
    const lyricsTab = document.querySelector('[data-focus-id="np-tab-lyrics"]');
    await act(async () => {
      lyricsTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('No Lyrics Available');
  });
});
