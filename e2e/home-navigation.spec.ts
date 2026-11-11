import { test, expect, Page } from '@playwright/test';

// Remote key helper simulating physical TV remote buttons
async function pressRemote(
  page: Page,
  key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Enter' | 'Escape',
  times = 1
) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.press(key);
    // 50ms pause matching TV remote debounce & CSS focus transitions
    await page.waitForTimeout(50);
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

// Helper to enter Home view cleanly via Demo Mode using remote navigation
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

test.describe('Home Sanctuary & TV Remote Spatial Navigation E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await enterHomeView(page);
  });

  test('Flow 2.1: Initial entry into Home anchors focus on Hero Resume button with radiant cyan halo', async ({ page }) => {
    await expectFocused(page, 'hero-resume');

    // UI/UX Invariant: 10-foot legibility checks
    const brand = page.locator('h1');
    await expect(brand).toBeVisible();
    await expect(page.locator('#tv-node-hero-resume')).toContainText('Resume Playback');
  });

  test('Flow 2.2: Horizontal hero action navigation', async ({ page }) => {
    await expectFocused(page, 'hero-resume');

    // Move Right to Queue button
    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'hero-queue');

    // Move Right to Details button
    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'hero-details');

    // Move Right to Favorite button
    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'hero-favorite');

    // Move Left back across hero actions to Resume
    await pressRemote(page, 'ArrowLeft', 3);
    await expectFocused(page, 'hero-resume');
  });

  test('Flow 2.3 & 2.4: Left Barrier Escape from Hero to Sidebar and Right Return', async ({ page }) => {
    await expectFocused(page, 'hero-resume');

    // Press Left from leftmost element of hero -> MUST transition cleanly to Sidebar
    await pressRemote(page, 'ArrowLeft');
    await expectFocused(page, 'sidebar-home');

    // Press Right from Sidebar -> MUST return cleanly to content entry point (hero-resume)
    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'hero-resume');
  });

  test('Flow 2.5: Descending vertical shelf hierarchy: Hero -> Continue Shelf -> Recent Shelf -> Bottom Player Dock', async ({
    page,
  }) => {
    await expectFocused(page, 'hero-resume');

    // Down to Continue Listening shelf
    await pressRemote(page, 'ArrowDown');
    const focusedCard1 = await page.locator('.tv-focused').getAttribute('data-focus-id');
    expect(focusedCard1).toMatch(/^continue-card-/);

    // Down to Recently Added shelf
    await pressRemote(page, 'ArrowDown');
    const focusedCard2 = await page.locator('.tv-focused').getAttribute('data-focus-id');
    expect(focusedCard2).toMatch(/^recent-card-/);

    // Down to Bottom Player Dock
    await pressRemote(page, 'ArrowDown');
    const dockFocused = await page.locator('.tv-focused').getAttribute('data-focus-id');
    expect(dockFocused).toMatch(/^dock-/);
  });

  test('Flow 2.6: Horizontal shelf traversal within Continue Listening shelf', async ({ page }) => {
    await expectFocused(page, 'hero-resume');
    await pressRemote(page, 'ArrowDown');

    const firstCardId = await page.locator('.tv-focused').getAttribute('data-focus-id');
    expect(firstCardId).toMatch(/^continue-card-/);

    // Traverse Right to next card
    await pressRemote(page, 'ArrowRight');
    const secondCardId = await page.locator('.tv-focused').getAttribute('data-focus-id');
    expect(secondCardId).toMatch(/^continue-card-/);
    expect(secondCardId).not.toBe(firstCardId);

    // Traverse Left back to first card
    await pressRemote(page, 'ArrowLeft');
    await expectFocused(page, firstCardId!);
  });

  test('Flow 2.7: Left Barrier Escape from leftmost shelf card to Sidebar', async ({ page }) => {
    await expectFocused(page, 'hero-resume');
    await pressRemote(page, 'ArrowDown'); // on leftmost continue card

    // Press Left -> transitions to Sidebar
    await pressRemote(page, 'ArrowLeft');
    await expectFocused(page, 'sidebar-home');
  });

  test('Flow 2.8: Group Memory - Up from Bottom Player Dock restores last-focused shelf card', async ({ page }) => {
    await expectFocused(page, 'hero-resume');

    // Down to Continue shelf, then Down to Recent shelf
    await pressRemote(page, 'ArrowDown');
    await pressRemote(page, 'ArrowDown');

    // Right to second card on Recent shelf
    await pressRemote(page, 'ArrowRight');
    const rememberedCardId = await page.locator('.tv-focused').getAttribute('data-focus-id');
    expect(rememberedCardId).toMatch(/^recent-card-/);

    // Down into Bottom Player Dock
    await pressRemote(page, 'ArrowDown');
    const inDockId = await page.locator('.tv-focused').getAttribute('data-focus-id');
    expect(inDockId).toMatch(/^dock-/);

    // Up from Bottom Dock MUST return to remembered card, NEVER jumping to hero
    await pressRemote(page, 'ArrowUp');
    await expectFocused(page, rememberedCardId!);
  });

  test('Flow 2.9: Sidebar rail vertical navigation', async ({ page }) => {
    await expectFocused(page, 'hero-resume');
    await pressRemote(page, 'ArrowLeft');
    await expectFocused(page, 'sidebar-home');

    // Up to brand mark
    await pressRemote(page, 'ArrowUp');
    await expectFocused(page, 'sidebar-brand');

    // Down through navigation items
    await pressRemote(page, 'ArrowDown');
    await expectFocused(page, 'sidebar-home');

    await pressRemote(page, 'ArrowDown');
    await expectFocused(page, 'sidebar-library');

    await pressRemote(page, 'ArrowDown');
    await expectFocused(page, 'sidebar-now-playing');

    await pressRemote(page, 'ArrowDown');
    await expectFocused(page, 'sidebar-search');

    await pressRemote(page, 'ArrowDown');
    await expectFocused(page, 'sidebar-settings');
  });

  test('Flow 2.10: View switching via sidebar and Back navigation', async ({ page }) => {
    await expectFocused(page, 'hero-resume');
    await pressRemote(page, 'ArrowLeft');
    await expectFocused(page, 'sidebar-home');

    // Navigate to Settings in sidebar (4 steps down: library, now-playing, search, settings)
    await pressRemote(page, 'ArrowDown', 4);
    await expectFocused(page, 'sidebar-settings');
    await pressRemote(page, 'Enter');

    // Settings view rendered
    await expect(page.locator('#tv-node-input-server-url')).toBeVisible();

    // Press Return / Escape key to go Back to Home
    await pressRemote(page, 'Escape');
    await expect(page.locator('#tv-node-hero-resume')).toBeVisible();
  });

  test('Flow 2.11: Zero Focus Trap - Full round-trip navigation across all zones', async ({ page }) => {
    // 1. Start at Hero Resume
    await expectFocused(page, 'hero-resume');

    // 2. Right through Hero
    await pressRemote(page, 'ArrowRight', 3);
    await expectFocused(page, 'hero-favorite');

    // 3. Down to Continue shelf
    await pressRemote(page, 'ArrowDown');
    const continueId = await page.locator('.tv-focused').getAttribute('data-focus-id');
    expect(continueId).toMatch(/^continue-card-/);

    // 4. Down to Recent shelf
    await pressRemote(page, 'ArrowDown');
    const recentId = await page.locator('.tv-focused').getAttribute('data-focus-id');
    expect(recentId).toMatch(/^recent-card-/);

    // 5. Down to Bottom Dock
    await pressRemote(page, 'ArrowDown');
    const dockId = await page.locator('.tv-focused').getAttribute('data-focus-id');
    expect(dockId).toMatch(/^dock-/);

    // 6. Up back to Recent shelf
    await pressRemote(page, 'ArrowUp');
    await expectFocused(page, recentId!);

    // 7. Left to leftmost card and into Sidebar
    await pressRemote(page, 'ArrowLeft', 4);
    await expectFocused(page, 'sidebar-home');

    // 8. Right back into Content (Content Memory restores shelf card)
    await pressRemote(page, 'ArrowRight');
    const returnedContentId = await page.locator('.tv-focused').getAttribute('data-focus-id');
    expect(returnedContentId).toMatch(/^(recent|continue)-card-/);

    // 9. Up from shelf back to Hero (Hero group memory restores hero-favorite)
    await pressRemote(page, 'ArrowUp', 2);
    await expectFocused(page, 'hero-favorite');

    // 10. Left back to Hero Resume
    await pressRemote(page, 'ArrowLeft', 3);
    await expectFocused(page, 'hero-resume');
  });

  test('Flow 2.12: Card activation starts playback and updates persistent player dock', async ({ page }) => {
    await expectFocused(page, 'hero-resume');
    await pressRemote(page, 'ArrowDown'); // on first continue card

    // Press Enter to play album
    await pressRemote(page, 'Enter');

    // Verify Persistent Bottom Player Dock reflects active playback
    const dock = page.locator('#tv-node-dock-track-info');
    await expect(dock).toBeVisible();

    // Invariant: Exactly one focused element
    const allFocused = page.locator('.tv-focused');
    await expect(allFocused).toHaveCount(1);
  });
});
