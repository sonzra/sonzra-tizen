import { test, expect, Page } from '@playwright/test';

// Remote key helper simulating physical TV remote buttons
async function pressRemote(
  page: Page,
  key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Enter' | 'Escape',
  times = 1
) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.press(key);
    await page.waitForTimeout(60);
  }
}

// Invariant verification: Exactly ONE element on screen has the radiant cyan halo (.tv-focused)
async function expectFocused(page: Page, focusId: string) {
  const node = page.locator(`#tv-node-${focusId}`);
  await expect(node).toBeVisible();
  await expect(node).toHaveClass(/tv-focused/);

  // Invariant: Exactly one focused element on screen at any time
  const allFocused = page.locator('.tv-focused');
  await expect(allFocused).toHaveCount(1);
}

// Helper to enter Home view cleanly via Demo Mode
async function enterHomeView(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await expectFocused(page, 'signin-field-email');
  await pressRemote(page, 'ArrowLeft');
  await expectFocused(page, 'signin-btn-demo');
  await pressRemote(page, 'Enter');
  await expectFocused(page, 'hero-resume');
}

// Helper to navigate from Home to Library
async function navigateToLibrary(page: Page) {
  await pressRemote(page, 'ArrowLeft');
  await expectFocused(page, 'sidebar-home');

  await pressRemote(page, 'ArrowDown');
  await expectFocused(page, 'sidebar-library');

  await pressRemote(page, 'Enter');
  await expectFocused(page, 'library-tab-albums');
}

test.describe('Library & Album Detail TV Remote Spatial Navigation E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await enterHomeView(page);
    await navigateToLibrary(page);
  });

  test('Flow 3.1: Navigation into LibraryView anchors focus on first category tab', async ({ page }) => {
    await expectFocused(page, 'library-tab-albums');
    await expect(page.locator('h1')).toContainText('Your Library');
  });

  test('Flow 3.2: Horizontal navigation across category tabs to sort selector', async ({ page }) => {
    await expectFocused(page, 'library-tab-albums');

    // Right across filter tabs
    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'library-tab-artists');

    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'library-tab-tracks');

    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'library-tab-playlists');

    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'library-tab-podcasts');

    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'library-sort-selector');

    // Left returns to podcasts
    await pressRemote(page, 'ArrowLeft');
    await expectFocused(page, 'library-tab-podcasts');
  });

  test('Flow 3.3: Descend from tabs into 5-column Album Grid and Left Escape to Sidebar', async ({ page }) => {
    await expectFocused(page, 'library-tab-albums');

    // Down enters the album grid row
    await pressRemote(page, 'ArrowDown');

    // Verify currently focused node is an album card in library-grid
    const focusedCard = page.locator('.tv-focused');
    await expect(focusedCard).toBeVisible();
    const cardId = await focusedCard.getAttribute('id');
    expect(cardId).toMatch(/^tv-node-library-card-/);

    // Left barrier escape from Column 0 card directly into Sidebar rail
    await pressRemote(page, 'ArrowLeft');
    await expectFocused(page, 'sidebar-library');

    // Right from Sidebar returns into active view
    await pressRemote(page, 'ArrowRight');
    const returnedFocused = page.locator('.tv-focused');
    await expect(returnedFocused).toBeVisible();
  });

  test('Flow 3.4: Open AlbumDetailView from grid card and verify initial focus on Play Album', async ({ page }) => {
    await expectFocused(page, 'library-tab-albums');

    // Down to grid
    await pressRemote(page, 'ArrowDown');
    const focusedCard = page.locator('.tv-focused');
    const cardId = await focusedCard.getAttribute('id');
    expect(cardId).toBeTruthy();

    // Enter opens Album Detail View
    await pressRemote(page, 'Enter');

    // Initial focus on Play Album button
    await expectFocused(page, 'album-btn-play');
    await expect(page.locator('#tv-node-album-btn-play')).toContainText('Play Album');
  });

  test('Flow 3.5: Horizontal action navigation across AlbumDetailView action bar', async ({ page }) => {
    await expectFocused(page, 'library-tab-albums');
    await pressRemote(page, 'ArrowDown');
    await pressRemote(page, 'Enter');
    await expectFocused(page, 'album-btn-play');

    // Right to Shuffle
    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'album-btn-shuffle');

    // Right to Queue
    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'album-btn-queue');

    // Right to Favorite
    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'album-btn-fav');

    // Left back to Queue
    await pressRemote(page, 'ArrowLeft');
    await expectFocused(page, 'album-btn-queue');
  });

  test('Flow 3.6: Left Barrier Escape from AlbumDetailView into Sidebar and return', async ({ page }) => {
    await expectFocused(page, 'library-tab-albums');
    await pressRemote(page, 'ArrowDown');
    await pressRemote(page, 'Enter');
    await expectFocused(page, 'album-btn-play');

    // Left escapes from Play Album directly into Sidebar rail
    await pressRemote(page, 'ArrowLeft');
    await expectFocused(page, 'sidebar-library');

    // Right returns to Play Album
    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'album-btn-play');
  });

  test('Flow 3.7: Navigate Down from action bar into tracklist and play a track', async ({ page }) => {
    await expectFocused(page, 'library-tab-albums');
    await pressRemote(page, 'ArrowDown');
    await pressRemote(page, 'Enter');
    await expectFocused(page, 'album-btn-play');

    // Down into tracklist
    await pressRemote(page, 'ArrowDown');
    const firstTrack = page.locator('.tv-focused');
    const trackId = await firstTrack.getAttribute('id');
    expect(trackId).toMatch(/^tv-node-track-row-/);

    // Down to second track
    await pressRemote(page, 'ArrowDown');
    const secondTrack = page.locator('.tv-focused');
    const secondTrackId = await secondTrack.getAttribute('id');
    expect(secondTrackId).toMatch(/^tv-node-track-row-/);
    expect(secondTrackId).not.toBe(trackId);

    // Press Enter to play track
    await pressRemote(page, 'Enter');

    // Bottom dock reflects playing track
    await expect(page.locator('#tv-node-dock-track-info')).toBeVisible();
    await expect(page.locator('#tv-node-dock-btn-play')).toBeVisible();
  });

  test('Flow 3.8: Return / Back key returns from AlbumDetailView to LibraryView and restores focus', async ({ page }) => {
    await expectFocused(page, 'library-tab-albums');
    await pressRemote(page, 'ArrowDown');

    const originCard = page.locator('.tv-focused');
    const originCardId = (await originCard.getAttribute('id'))!.replace('tv-node-', '');

    // Enter opens album
    await pressRemote(page, 'Enter');
    await expectFocused(page, 'album-btn-play');

    // Remote Return / Back key (Escape in browser)
    await pressRemote(page, 'Escape');

    // Restores focus to the origin album card in LibraryView!
    await expectFocused(page, originCardId);
  });

  test('Flow 3.9: Zero Focus Trap - Full round trip navigation cycle', async ({ page }) => {
    // 1. In Library: tab-albums
    await expectFocused(page, 'library-tab-albums');

    // 2. Down to grid
    await pressRemote(page, 'ArrowDown');

    // 3. Enter album detail
    await pressRemote(page, 'Enter');
    await expectFocused(page, 'album-btn-play');

    // 4. Down to track
    await pressRemote(page, 'ArrowDown');

    // 5. Left returns to album-btn-play
    await pressRemote(page, 'ArrowLeft');
    await expectFocused(page, 'album-btn-play');

    // 6. Left to sidebar
    await pressRemote(page, 'ArrowLeft');
    await expectFocused(page, 'sidebar-library');

    // 7. Up to Home in sidebar
    await pressRemote(page, 'ArrowUp');
    await expectFocused(page, 'sidebar-home');

    // 8. Press Enter to switch to Home view and focus entry point
    await pressRemote(page, 'Enter');
    await expectFocused(page, 'hero-resume');
  });
});
