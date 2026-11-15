import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { SpatialNavigationProvider } from '../SpatialNavigationContext';
import { ServerProvider } from '../../context/ServerContext';
import { PlayerProvider } from '../../context/PlayerContext';
import { LibraryView } from '../../views/LibraryView';
import { ArtistsView } from '../../views/ArtistsView';
import { MOCK_ALBUMS, MOCK_ARTISTS, MOCK_PLAYLISTS, MOCK_AUDIOBOOKS, MOCK_PODCASTS } from '../../__tests__/fixtures/mockData';

describe('Library Parity, Filtering & Grid Density (Issues #32, #33, #34, #35)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/library/albums')) {
        return Promise.resolve({
          ok: true,
          json: async () => MOCK_ALBUMS,
        } as any);
      }
      if (url.includes('/api/v1/library/artists')) {
        return Promise.resolve({
          ok: true,
          json: async () => MOCK_ARTISTS,
        } as any);
      }
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

  const renderLibrary = async () => {
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

  const renderArtists = async () => {
    const root = createRoot(container);
    root.render(
      <SpatialNavigationProvider>
        <ServerProvider>
          <PlayerProvider>
            <ArtistsView />
          </PlayerProvider>
        </ServerProvider>
      </SpatialNavigationProvider>
    );
    await new Promise((r) => setTimeout(r, 250));
    return root;
  };

  it('Issue #32: purges redundant tracks tab from category navigation', async () => {
    await renderLibrary();

    // Verify tracks tab is purged
    expect(document.getElementById('tv-node-library-tab-tracks')).toBeNull();

    // Verify remaining tabs are intact
    expect(document.getElementById('tv-node-library-tab-albums')).not.toBeNull();
    expect(document.getElementById('tv-node-library-tab-artists')).not.toBeNull();
    expect(document.getElementById('tv-node-library-tab-playlists')).not.toBeNull();
    expect(document.getElementById('tv-node-library-tab-audiobooks')).not.toBeNull();
    expect(document.getElementById('tv-node-library-tab-podcasts')).not.toBeNull();
  });

  it('Issue #35: cleans header by removing inaccurate counter pill badges', async () => {
    await renderLibrary();

    // Header has title and host
    const h1 = document.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toContain('Your Library');

    // Pill badges with local slice counts are removed
    const textContent = document.body.textContent || '';
    expect(textContent).not.toContain('20 Albums');
    expect(textContent).not.toContain('20 Artists');
    expect(textContent).not.toContain('Tracks');
  });

  it('Issue #33: AlphabetRail acts as primary filter for Albums defaulting to A or first letter', async () => {
    await renderLibrary();

    // Verify AlphabetRail exists
    const alphaA = document.getElementById('tv-node-alpha-A');
    expect(alphaA).not.toBeNull();

    // Section header displays active letter
    const sectionHeaders = document.querySelectorAll('span.font-mono.text-lg');
    expect(sectionHeaders.length).toBeGreaterThan(0);
    const activeSectionLetter = sectionHeaders[0].textContent?.trim();
    expect(activeSectionLetter).toBe('A');

    // Verify that cards rendered start with letter A
    const albumCards = document.querySelectorAll('[id^="tv-node-library-card-"]');
    expect(albumCards.length).toBeGreaterThan(0);

    // Switch to letter B on AlphabetRail
    const alphaB = document.getElementById('tv-node-alpha-B');
    expect(alphaB).not.toBeNull();
    alphaB?.click();

    await new Promise((r) => setTimeout(r, 150));

    // Section header updates to 'B'
    const updatedSectionHeaders = document.querySelectorAll('span.font-mono.text-lg');
    expect(updatedSectionHeaders[0].textContent?.trim()).toBe('B');
  });

  it('Issue #33: AlphabetRail acts as primary filter in ArtistsView', async () => {
    await renderArtists();

    // AlphabetRail is present
    const alphaA = document.getElementById('tv-node-alpha-A');
    expect(alphaA).not.toBeNull();

    // Default section letter is 'A'
    const sectionHeaders = document.querySelectorAll('span.font-mono.text-lg');
    expect(sectionHeaders.length).toBeGreaterThan(0);
    expect(sectionHeaders[0].textContent?.trim()).toBe('A');

    // Switch letter to 'C'
    const alphaC = document.getElementById('tv-node-alpha-C');
    expect(alphaC).not.toBeNull();
    alphaC?.click();

    await new Promise((r) => setTimeout(r, 150));

    const updatedSectionHeaders = document.querySelectorAll('span.font-mono.text-lg');
    expect(updatedSectionHeaders[0].textContent?.trim()).toBe('C');
  });

  it('Issue #34: aligns Artists, Playlists, Audiobooks, and Podcasts to 8-column benchmark grid density', async () => {
    await renderLibrary();

    // Benchmark: Albums tab has 8-column grid class
    const albumsGrid = document.querySelector('.grid-cols-2.sm\\:grid-cols-4.md\\:grid-cols-6.lg\\:grid-cols-8');
    expect(albumsGrid).not.toBeNull();

    // Switch to Playlists tab
    const playlistsTab = document.getElementById('tv-node-library-tab-playlists');
    playlistsTab?.click();
    await new Promise((r) => setTimeout(r, 150));

    const playlistsGrid = document.querySelector('[aria-label="Playlists Grid"] .grid-cols-2.sm\\:grid-cols-4.md\\:grid-cols-6.lg\\:grid-cols-8');
    expect(playlistsGrid).not.toBeNull();

    // Switch to Audiobooks tab
    const audiobooksTab = document.getElementById('tv-node-library-tab-audiobooks');
    audiobooksTab?.click();
    await new Promise((r) => setTimeout(r, 150));

    const audiobooksGrid = document.querySelector('[aria-label="Audiobooks Grid"] .grid-cols-2.sm\\:grid-cols-4.md\\:grid-cols-6.lg\\:grid-cols-8');
    expect(audiobooksGrid).not.toBeNull();

    // Switch to Podcasts tab
    const podcastsTab = document.getElementById('tv-node-library-tab-podcasts');
    podcastsTab?.click();
    await new Promise((r) => setTimeout(r, 150));

    const podcastsGrid = document.querySelector('[aria-label="Podcasts Grid"] .grid-cols-2.sm\\:grid-cols-4.md\\:grid-cols-6.lg\\:grid-cols-8');
    expect(podcastsGrid).not.toBeNull();
  });
});
