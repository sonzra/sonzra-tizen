import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { SpatialNavigationProvider } from '../SpatialNavigationContext';
import { AlbumDetailView } from '../../views/AlbumDetailView';
import * as PlayerContextModule from '../../context/PlayerContext';
import * as ServerContextModule from '../../context/ServerContext';
import { Track } from '../../types/music';
import { findNextFocusableNode } from '../spatialMath';
import { FocusableNode } from '../../types/navigation';

describe('Album Track Actions & Single-Track Playback (Issue #36)', () => {
  let container: HTMLDivElement;

  const mockTracks: Track[] = [
    {
      id: 'track-101',
      title: 'Aurora Borealis',
      artist: 'Nordic Soundscapes',
      album: 'Arctic Echoes',
      albumId: 'album-1',
      duration: 215,
      fidelity: '192k / 24-bit',
      trackNumber: 1,
      isFavorite: false,
    },
    {
      id: 'track-102',
      title: 'Glacier Winds',
      artist: 'Nordic Soundscapes',
      album: 'Arctic Echoes',
      albumId: 'album-1',
      duration: 280,
      fidelity: '192k / 24-bit',
      trackNumber: 2,
      isFavorite: true,
    },
  ];

  const mockAlbum = {
    id: 'album-1',
    title: 'Arctic Echoes',
    artist: 'Nordic Soundscapes',
    artworkUrl: 'http://sonzra.local/artwork/album-1.jpg',
    tracks: mockTracks,
    year: 2026,
    genre: 'Ambient',
  };

  let mockApiClient: any;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);

    mockApiClient = {
      fetchAlbum: vi.fn().mockResolvedValue(mockAlbum),
      toggleFavorite: vi.fn().mockImplementation((_itemId: string, fav: boolean) => Promise.resolve(fav)),
      getArtworkUrl: vi.fn().mockReturnValue('http://sonzra.local/artwork/album-1.jpg'),
      getAudioUrl: vi.fn().mockReturnValue('http://sonzra.local/audio/track-101.flac'),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders track rows with discrete action buttons (Play Next, Add Queue, Favorite, Menu)', async () => {
    vi.spyOn(ServerContextModule, 'useServer').mockReturnValue({
      apiClient: mockApiClient as any,
      config: { serverUrl: 'http://sonzra.local', demoMode: false },
    } as any);

    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue({
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
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <SpatialNavigationProvider initialView="album-detail" initialParam="album-1">
          <AlbumDetailView />
        </SpatialNavigationProvider>
      );
    });

    // Advance timers for fetchAlbum resolution
    await act(async () => {
      vi.runAllTimers();
    });

    // Check track rows exist
    expect(document.getElementById('tv-node-track-row-track-101')).not.toBeNull();
    expect(document.getElementById('tv-node-track-row-track-102')).not.toBeNull();

    // Check action buttons exist for track-101
    expect(document.getElementById('tv-node-track-action-play-next-track-101')).not.toBeNull();
    expect(document.getElementById('tv-node-track-action-add-queue-track-101')).not.toBeNull();
    expect(document.getElementById('tv-node-track-action-fav-track-101')).not.toBeNull();
    expect(document.getElementById('tv-node-track-action-menu-track-101')).not.toBeNull();
  });

  it('plays single track without passing full album tracks array when track row is activated', async () => {
    const playTrackMock = vi.fn();

    vi.spyOn(ServerContextModule, 'useServer').mockReturnValue({
      apiClient: mockApiClient as any,
      config: { serverUrl: 'http://sonzra.local', demoMode: false },
    } as any);

    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue({
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
      playTrack: playTrackMock,
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
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <SpatialNavigationProvider initialView="album-detail" initialParam="album-1">
          <AlbumDetailView />
        </SpatialNavigationProvider>
      );
    });

    await act(async () => {
      vi.runAllTimers();
    });

    const trackRow = document.getElementById('tv-node-track-row-track-101');
    expect(trackRow).not.toBeNull();

    // Click track row
    await act(async () => {
      trackRow?.click();
    });

    // Assert playTrack was called with ONLY the single track, NOT the full tracks array
    expect(playTrackMock).toHaveBeenCalledTimes(1);
    expect(playTrackMock).toHaveBeenCalledWith(mockTracks[0]);
  });

  it('triggers playNext and addToQueue actions on button click', async () => {
    const playNextMock = vi.fn();
    const addToQueueMock = vi.fn();

    vi.spyOn(ServerContextModule, 'useServer').mockReturnValue({
      apiClient: mockApiClient as any,
      config: { serverUrl: 'http://sonzra.local', demoMode: false },
    } as any);

    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue({
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
      playNext: playNextMock,
      addToQueue: addToQueueMock,
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
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <SpatialNavigationProvider initialView="album-detail" initialParam="album-1">
          <AlbumDetailView />
        </SpatialNavigationProvider>
      );
    });

    await act(async () => {
      vi.runAllTimers();
    });

    // Click Play Next button
    const playNextBtn = document.getElementById('tv-node-track-action-play-next-track-101');
    await act(async () => {
      playNextBtn?.click();
    });
    expect(playNextMock).toHaveBeenCalledWith(mockTracks[0]);

    // Click Add to Queue button
    const addQueueBtn = document.getElementById('tv-node-track-action-add-queue-track-101');
    await act(async () => {
      addQueueBtn?.click();
    });
    expect(addToQueueMock).toHaveBeenCalledWith(mockTracks[0]);
  });

  it('toggles favorite via sonzraApi when favorite button is clicked', async () => {
    vi.spyOn(ServerContextModule, 'useServer').mockReturnValue({
      apiClient: mockApiClient as any,
      config: { serverUrl: 'http://sonzra.local', demoMode: false },
    } as any);

    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue({
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
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <SpatialNavigationProvider initialView="album-detail" initialParam="album-1">
          <AlbumDetailView />
        </SpatialNavigationProvider>
      );
    });

    await act(async () => {
      vi.runAllTimers();
    });

    // Click Favorite button on track-101 (initial isFavorite is false, so toggles to true)
    const favBtn = document.getElementById('tv-node-track-action-fav-track-101');
    await act(async () => {
      favBtn?.click();
    });

    expect(mockApiClient.toggleFavorite).toHaveBeenCalledWith('track-101', true);
  });

  it('opens and closes track action modal dialog with focus restoration', async () => {
    vi.spyOn(ServerContextModule, 'useServer').mockReturnValue({
      apiClient: mockApiClient as any,
      config: { serverUrl: 'http://sonzra.local', demoMode: false },
    } as any);

    vi.spyOn(PlayerContextModule, 'usePlayer').mockReturnValue({
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
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <SpatialNavigationProvider initialView="album-detail" initialParam="album-1">
          <AlbumDetailView />
        </SpatialNavigationProvider>
      );
    });

    await act(async () => {
      vi.runAllTimers();
    });

    // Modal should not be open initially
    expect(document.getElementById('tv-node-track-modal-play')).toBeNull();

    // Click Menu / More button for track-101
    const menuBtn = document.getElementById('tv-node-track-action-menu-track-101');
    await act(async () => {
      menuBtn?.click();
    });

    // Modal should now be open
    expect(document.getElementById('tv-node-track-modal-play')).not.toBeNull();
    expect(document.getElementById('tv-node-track-modal-play-next')).not.toBeNull();
    expect(document.getElementById('tv-node-track-modal-add-queue')).not.toBeNull();
    expect(document.getElementById('tv-node-track-modal-fav')).not.toBeNull();
    expect(document.getElementById('tv-node-track-modal-close')).not.toBeNull();

    // Close modal
    const closeBtn = document.getElementById('tv-node-track-modal-close');
    await act(async () => {
      closeBtn?.click();
      vi.runAllTimers();
    });

    // Modal should now be closed
    expect(document.getElementById('tv-node-track-modal-play')).toBeNull();
  });

  describe('Tracklist & Action Buttons Spatial Navigation Matrix', () => {
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

    it('navigates horizontally through track row and action buttons with left barrier escape', () => {
      const playBtn = createMockNode('album-btn-play', 160, 500, 160, 50, 'album-actions');
      const trackRow1 = createMockNode('track-row-1', 900, 200, 500, 50, 'album-tracks');
      const playNext1 = createMockNode('track-action-play-next-1', 1420, 200, 40, 40, 'album-tracks');
      const addQueue1 = createMockNode('track-action-add-queue-1', 1470, 200, 40, 40, 'album-tracks');
      const fav1 = createMockNode('track-action-fav-1', 1520, 200, 40, 40, 'album-tracks');
      const menu1 = createMockNode('track-action-menu-1', 1570, 200, 40, 40, 'album-tracks');

      const trackRow2 = createMockNode('track-row-2', 900, 260, 500, 50, 'album-tracks');
      const playNext2 = createMockNode('track-action-play-next-2', 1420, 260, 40, 40, 'album-tracks');

      const candidates = [playBtn, trackRow1, playNext1, addQueue1, fav1, menu1, trackRow2, playNext2];

      // Right from track-row-1 -> enters playNext1
      const toPlayNext = findNextFocusableNode(trackRow1, candidates, 'right', { activeView: 'album-detail' });
      expect(toPlayNext?.id).toBe('track-action-play-next-1');

      // Right from playNext1 -> addQueue1
      const toAddQueue = findNextFocusableNode(playNext1, candidates, 'right', { activeView: 'album-detail' });
      expect(toAddQueue?.id).toBe('track-action-add-queue-1');

      // Right from addQueue1 -> fav1
      const toFav = findNextFocusableNode(addQueue1, candidates, 'right', { activeView: 'album-detail' });
      expect(toFav?.id).toBe('track-action-fav-1');

      // Right from fav1 -> menu1
      const toMenu = findNextFocusableNode(fav1, candidates, 'right', { activeView: 'album-detail' });
      expect(toMenu?.id).toBe('track-action-menu-1');

      // Left from menu1 -> fav1
      const backToFav = findNextFocusableNode(menu1, candidates, 'left', { activeView: 'album-detail' });
      expect(backToFav?.id).toBe('track-action-fav-1');

      // Left from fav1 -> addQueue1
      const backToAddQueue = findNextFocusableNode(fav1, candidates, 'left', { activeView: 'album-detail' });
      expect(backToAddQueue?.id).toBe('track-action-add-queue-1');

      // Left from addQueue1 -> playNext1
      const backToPlayNext = findNextFocusableNode(addQueue1, candidates, 'left', { activeView: 'album-detail' });
      expect(backToPlayNext?.id).toBe('track-action-play-next-1');

      // Left from playNext1 -> trackRow1
      const backToRow = findNextFocusableNode(playNext1, candidates, 'left', { activeView: 'album-detail' });
      expect(backToRow?.id).toBe('track-row-1');

      // Left barrier escape from trackRow1 -> escapes to album-btn-play
      const escapeLeft = findNextFocusableNode(trackRow1, candidates, 'left', { activeView: 'album-detail' });
      expect(escapeLeft?.id).toBe('album-btn-play');
    });
  });
});
