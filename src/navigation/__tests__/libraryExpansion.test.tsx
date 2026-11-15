import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { SpatialNavigationProvider } from '../SpatialNavigationContext';
import { ServerProvider } from '../../context/ServerContext';
import { PlayerProvider } from '../../context/PlayerContext';
import { LibraryView } from '../../views/LibraryView';
import { MOCK_PLAYLISTS, MOCK_AUDIOBOOKS, MOCK_PODCASTS } from '../../__tests__/fixtures/mockData';

describe('Library Expansion Parity (Issues #5, #14, #15)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/playlists')) {
        return Promise.resolve({
          ok: true,
          json: async () => MOCK_PLAYLISTS,
        } as any);
      }
      if (url.includes('/audiobooks')) {
        return Promise.resolve({
          ok: true,
          json: async () => MOCK_AUDIOBOOKS,
        } as any);
      }
      if (url.includes('/podcasts')) {
        return Promise.resolve({
          ok: true,
          json: async () => MOCK_PODCASTS,
        } as any);
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as any);
    });
  });

  const renderComponent = async () => {
    const root = createRoot(container);
    root.render(
      <SpatialNavigationProvider>
        <ServerProvider>
          <PlayerProvider>
            <LibraryView />
          </PlayerProvider>
        </ServerProvider>
      </SpatialNavigationProvider>
    );
    await new Promise((r) => setTimeout(r, 250));
    return root;
  };

  it('renders all core library category tabs including Audiobooks and Playlists', async () => {
    await renderComponent();

    // Invariant: Core tabs exist, and redundant tracks tab is removed (Issue #32)
    expect(document.getElementById('tv-node-library-tab-albums')).not.toBeNull();
    expect(document.getElementById('tv-node-library-tab-artists')).not.toBeNull();
    expect(document.getElementById('tv-node-library-tab-tracks')).toBeNull();
    expect(document.getElementById('tv-node-library-tab-playlists')).not.toBeNull();
    expect(document.getElementById('tv-node-library-tab-audiobooks')).not.toBeNull();
    expect(document.getElementById('tv-node-library-tab-podcasts')).not.toBeNull();
  });

  it('renders collaborative playlist indicator badge and sync button on Playlists tab', async () => {
    await renderComponent();

    // Select Playlists tab
    const playlistsTab = document.getElementById('tv-node-library-tab-playlists');
    expect(playlistsTab).not.toBeNull();
    playlistsTab?.click();

    await new Promise((r) => setTimeout(r, 150));

    // Verify Sync Playlists button is present
    const syncBtn = document.getElementById('tv-node-library-btn-sync-playlists');
    expect(syncBtn).not.toBeNull();
    expect(syncBtn?.textContent).toContain('Sync Playlists');

    // Verify collaborative playlist card exists
    const collabPlaylist = MOCK_PLAYLISTS.find((p) => p.isCollaborative);
    expect(collabPlaylist).toBeDefined();

    const collabCard = document.getElementById(`tv-node-library-playlist-${collabPlaylist?.id}`);
    expect(collabCard).not.toBeNull();

    // Verify 10-foot collaborator indicator ("Curated with Sarah")
    expect(collabCard?.textContent).toContain(`Curated with ${collabPlaylist?.collaboratorName}`);
  });

  it('renders audiobooks with progress and supports chapter navigation modal', async () => {
    await renderComponent();

    // Switch to Audiobooks tab
    const audiobooksTab = document.getElementById('tv-node-library-tab-audiobooks');
    expect(audiobooksTab).not.toBeNull();
    audiobooksTab?.click();

    await new Promise((r) => setTimeout(r, 150));

    const solarisBook = MOCK_AUDIOBOOKS[0];
    const bookCard = document.getElementById(`tv-node-library-audiobook-${solarisBook.id}`);
    expect(bookCard).not.toBeNull();

    // Verify progress tracking displayed
    expect(bookCard?.textContent).toContain(`${solarisBook.progressPercent}% DONE`);

    // Click to open Chapter Navigation modal
    bookCard?.click();
    await new Promise((r) => setTimeout(r, 150));

    // Verify Chapter Modal opened with chapters list
    const firstChapter = solarisBook.chapters?.[0];
    expect(firstChapter).toBeDefined();

    const chapterNode = document.getElementById(`tv-node-audiobook-chapter-${firstChapter?.id}`);
    expect(chapterNode).not.toBeNull();
    expect(chapterNode?.textContent).toContain(firstChapter?.title);

    // Verify modal close button
    const closeBtn = document.getElementById('tv-node-audiobook-modal-close');
    expect(closeBtn).not.toBeNull();
    closeBtn?.click();

    await new Promise((r) => setTimeout(r, 150));
    expect(document.getElementById('tv-node-audiobook-modal-close')).toBeNull();
  });

  it('renders podcasts section with show cards and episode drawer', async () => {
    await renderComponent();

    // Switch to Podcasts tab
    const podcastsTab = document.getElementById('tv-node-library-tab-podcasts');
    expect(podcastsTab).not.toBeNull();
    podcastsTab?.click();

    await new Promise((r) => setTimeout(r, 80));

    // Verify podcast show cards
    const showCard = document.getElementById('tv-node-library-podcast-podcast-audiophile-sanctuary');
    expect(showCard).not.toBeNull();
    expect(showCard?.textContent).toContain('Audiophile Sanctuary');

    // Click to open episode drawer
    showCard?.click();
    await new Promise((r) => setTimeout(r, 80));

    const episodeNode = document.getElementById('tv-node-podcast-ep-ep-as-1');
    expect(episodeNode).not.toBeNull();
    expect(episodeNode?.textContent).toContain('Episode 16');

    // Close modal
    const closeBtn = document.getElementById('tv-node-podcast-modal-close');
    expect(closeBtn).not.toBeNull();
    closeBtn?.click();

    await new Promise((r) => setTimeout(r, 80));
    expect(document.getElementById('tv-node-podcast-modal-close')).toBeNull();
  });
});
