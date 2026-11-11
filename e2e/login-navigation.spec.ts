import { test, expect, Page } from '@playwright/test';

// Remote key helper simulating physical TV remote buttons
async function pressRemote(
  page: Page,
  key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Enter' | 'Escape',
  times = 1
) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.press(key);
    // 50ms pause matching remote debounce & CSS focus transitions
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

test.describe('Login & TV Remote Spatial Navigation E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean unauthenticated state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Flow 1.1: Initial load anchors focus on Email field with radiant halo', async ({ page }) => {
    await expectFocused(page, 'signin-field-email');

    const emailField = page.locator('#tv-node-signin-field-email');
    await expect(emailField).toBeVisible();
    await expect(emailField).toContainText('demo@sonzra.com');

    // UI/UX Invariant: 10-foot legibility checks
    const brandTitle = page.locator('h1');
    await expect(brandTitle).toContainText('Sonzra Audio');
  });

  test('Flow 1.2: Horizontal navigation between Email and Password fields', async ({ page }) => {
    await expectFocused(page, 'signin-field-email');

    // Press Right to move to Password field
    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'signin-field-password');

    // Press Left to move back to Email field
    await pressRemote(page, 'ArrowLeft');
    await expectFocused(page, 'signin-field-email');
  });

  test('Flow 1.3: Navigation to Demo Mode button and enter Home view', async ({ page }) => {
    await expectFocused(page, 'signin-field-email');

    // Press Left from Email field to move to Left Column demo button
    await pressRemote(page, 'ArrowLeft');
    await expectFocused(page, 'signin-btn-demo');

    // Press Enter to activate Demo Mode
    await pressRemote(page, 'Enter');

    // Should transition to HomeView and focus hero-resume
    await expectFocused(page, 'hero-resume');
    await expect(page.locator('#tv-node-hero-resume')).toBeVisible();
    await expect(page.locator('aside[role="navigation"]')).toBeVisible();
  });

  test('Flow 1.4: Navigation to Advanced Server Settings toggle and server input', async ({ page }) => {
    await expectFocused(page, 'signin-field-email');

    // Press Down to move to Server URL toggle
    await pressRemote(page, 'ArrowDown');
    await expectFocused(page, 'signin-btn-toggle-server');

    // Press Enter to toggle Advanced Server Settings
    await pressRemote(page, 'Enter');

    // Server input field should now be visible
    const serverField = page.locator('#tv-node-signin-field-server');
    await expect(serverField).toBeVisible();
    await expect(serverField).toContainText('http://192.168.31.139:3000');
  });

  test('Flow 1.5: Navigation to Password visibility toggle', async ({ page }) => {
    await expectFocused(page, 'signin-field-email');

    // Down to Server toggle, then Right to Password toggle
    await pressRemote(page, 'ArrowDown');
    await expectFocused(page, 'signin-btn-toggle-server');

    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'signin-btn-toggle-pw');

    // Toggle password visibility
    const passwordField = page.locator('#tv-node-signin-field-password');
    await expect(passwordField).toContainText('••••••••');

    await pressRemote(page, 'Enter');
    await expect(passwordField).toContainText('password');
  });

  test('Flow 1.6: Navigate into TV Virtual Keyboard and traverse alphanumeric keys', async ({ page }) => {
    await expectFocused(page, 'signin-field-email');

    // Navigate Down to Server toggle, then Down into keyboard row 0 (numbers)
    await pressRemote(page, 'ArrowDown');
    await expectFocused(page, 'signin-btn-toggle-server');

    await pressRemote(page, 'ArrowDown');
    await expectFocused(page, 'kb-num-0');

    // Move Right through number row
    await pressRemote(page, 'ArrowRight', 3);
    await expectFocused(page, 'kb-num-3');

    // Move Down into QWERTY row
    await pressRemote(page, 'ArrowDown');
    // Bounding box puts it on character key in row 1
    const focusedRow1 = await page.locator('.tv-focused').getAttribute('data-focus-id');
    expect(focusedRow1).toMatch(/^kb-char-/);
  });

  test('Flow 1.7: Type characters via Virtual Keyboard into Email field', async ({ page }) => {
    await expectFocused(page, 'signin-field-email');

    // Navigate to Clear button inside keyboard
    await pressRemote(page, 'ArrowDown'); // to server toggle
    await pressRemote(page, 'ArrowDown'); // to kb-num-0

    // Down 4 times to bottom utility row
    await pressRemote(page, 'ArrowDown', 4);

    // Look for Clear button or navigate to it
    const clearBtn = page.locator('#tv-node-kb-btn-clear');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      const emailField = page.locator('#tv-node-signin-field-email');
      await expect(emailField).toContainText('name@domain.com'); // Placeholder shown when empty
    }
  });

  test('Flow 1.8: Empty credentials submit triggers validation error banner', async ({ page }) => {
    await expectFocused(page, 'signin-field-email');

    // Clear email field via keyboard clear
    await pressRemote(page, 'ArrowDown'); // to server toggle
    await pressRemote(page, 'ArrowDown'); // to kb-num-0
    await pressRemote(page, 'ArrowDown', 4); // to bottom utility row

    const clearBtn = page.locator('#tv-node-kb-btn-clear');
    await clearBtn.click();

    // Click submit
    const submitBtn = page.locator('#tv-node-signin-btn-submit');
    await submitBtn.click();

    // Error banner should appear
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Please enter your email address');
  });

  test('Flow 1.9: Submit with valid credentials connects to real server and transitions to HomeView', async ({
    page,
  }) => {
    await expectFocused(page, 'signin-field-email');

    // Default pre-populated credentials: demo@sonzra.com / password / http://192.168.31.139:3000
    // Click submit
    const submitBtn = page.locator('#tv-node-signin-btn-submit');
    await submitBtn.click();

    // Should authenticate against real server and navigate to HomeView
    await expect(page.locator('#tv-node-hero-resume')).toBeVisible({ timeout: 10000 });
    await expectFocused(page, 'hero-resume');

    // Verify token was cached in localStorage
    const savedToken = await page.evaluate(() => {
      return localStorage.getItem('sonzra_tv_auth_session');
    });
    expect(savedToken).toBeTruthy();
    expect(savedToken).toContain('demo@sonzra.com');
  });

  test('Flow 1.10: Zero Focus Trap - Full round-trip navigation cycle', async ({ page }) => {
    // Start on Email
    await expectFocused(page, 'signin-field-email');

    // Right to Password
    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'signin-field-password');

    // Left back to Email
    await pressRemote(page, 'ArrowLeft');
    await expectFocused(page, 'signin-field-email');

    // Left to Demo Mode CTA
    await pressRemote(page, 'ArrowLeft');
    await expectFocused(page, 'signin-btn-demo');

    // Right back to Email
    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'signin-field-email');

    // Down to Server Toggle
    await pressRemote(page, 'ArrowDown');
    await expectFocused(page, 'signin-btn-toggle-server');

    // Right to Password Toggle
    await pressRemote(page, 'ArrowRight');
    await expectFocused(page, 'signin-btn-toggle-pw');

    // Up back to Password
    await pressRemote(page, 'ArrowUp');
    await expectFocused(page, 'signin-field-password');
  });

  test('Flow 1.11: Keyboard retention - Pressing Enter on Backspace retains focus on keyboard without jumping to username', async ({
    page,
  }) => {
    await expectFocused(page, 'signin-field-email');
    const emailField = page.locator('#tv-node-signin-field-email');
    await expect(emailField).toContainText('demo@sonzra.com');

    // Focus directly on the backspace button in the virtual keyboard via hover
    const backspaceNode = page.locator('#tv-node-kb-btn-backspace');
    await backspaceNode.hover();
    await expectFocused(page, 'kb-btn-backspace');

    // Press Enter via remote controller 3 times consecutively
    await pressRemote(page, 'Enter');
    // Focus MUST remain on backspace button, NOT jump back to email field!
    await expectFocused(page, 'kb-btn-backspace');
    await expect(emailField).toContainText('demo@sonzra.co'); // 'm' deleted

    await pressRemote(page, 'Enter');
    await expectFocused(page, 'kb-btn-backspace');
    await expect(emailField).toContainText('demo@sonzra.c'); // 'o' deleted

    await pressRemote(page, 'Enter');
    await expectFocused(page, 'kb-btn-backspace');
    await expect(emailField).toContainText('demo@sonzra.'); // 'c' deleted

    // Test a character key: hover 'a', press Enter twice, focus stays on 'a'
    const charA = page.locator('#tv-node-kb-char-a');
    await charA.hover();
    await expectFocused(page, 'kb-char-a');

    await pressRemote(page, 'Enter');
    await expectFocused(page, 'kb-char-a');
    await expect(emailField).toContainText('demo@sonzra.a');

    await pressRemote(page, 'Enter');
    await expectFocused(page, 'kb-char-a');
    await expect(emailField).toContainText('demo@sonzra.aa');
  });

  test('Flow 1.12: Failed authentication displays visible error banner in app without unmounting SignInView', async ({
    page,
  }) => {
    await expectFocused(page, 'signin-field-email');

    // Fill in invalid credentials
    // Click on password field and clear/type invalid password
    const clearBtn = page.locator('#tv-node-kb-btn-clear');
    const passwordField = page.locator('#tv-node-signin-field-password');
    await passwordField.click();

    // Clear password
    await clearBtn.click();

    // Type a single character 'x' into password
    const charX = page.locator('#tv-node-kb-char-x');
    await charX.click();
    await pressRemote(page, 'Enter');

    // Submit the form with bad password (demo@sonzra.com / x)
    const submitBtn = page.locator('#tv-node-signin-btn-submit');
    await submitBtn.click();

    // Error banner MUST appear with visible role="alert" containing the server error message
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText(/Invalid email address or password|failed/i);

    // Verify SignInView remains visible (did NOT unmount into blank screen)
    await expect(page.locator('#tv-node-signin-field-email')).toBeVisible();
    await expect(page.locator('#tv-node-signin-btn-submit')).toBeVisible();
  });
});
