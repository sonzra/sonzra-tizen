import { describe, it, expect, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { SpatialNavigationProvider } from '../../navigation/SpatialNavigationContext';
import { ServerProvider } from '../../context/ServerContext';
import { AuthProvider } from '../../context/AuthContext';
import { SettingsView } from '../SettingsView';

describe('SettingsView Redesign & Virtual Keyboard Integration', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('renders with OLED Dark Sanctuary styling and user profile card', async () => {
    const root = createRoot(container);
    root.render(
      <SpatialNavigationProvider>
        <ServerProvider>
          <AuthProvider>
            <SettingsView />
          </AuthProvider>
        </ServerProvider>
      </SpatialNavigationProvider>
    );

    await new Promise((r) => setTimeout(r, 80));

    expect(container.textContent).toContain('Settings & User Profile');
    expect(container.textContent).toContain('BIT-PERFECT DAC ACTIVE');
    expect(container.textContent).toContain('Sonzra Server Connection');
    expect(container.textContent).toContain('Tizen TV Environment');
    expect(container.textContent).toContain('Sign Out & Switch User');
  });

  it('opens and closes the on-screen virtual keyboard when clicking server URL input', async () => {
    const root = createRoot(container);
    root.render(
      <SpatialNavigationProvider>
        <ServerProvider>
          <AuthProvider>
            <SettingsView />
          </AuthProvider>
        </ServerProvider>
      </SpatialNavigationProvider>
    );

    await new Promise((r) => setTimeout(r, 80));

    // Initially keyboard drawer is closed
    expect(container.textContent).not.toContain('TV KEYBOARD · EDITING:');

    // Click server URL focusable
    const serverUrlInput = container.querySelector('[data-focus-id="input-server-url"]') as HTMLElement;
    expect(serverUrlInput).toBeTruthy();
    serverUrlInput.click();

    await new Promise((r) => setTimeout(r, 80));

    // Now virtual keyboard is rendered
    expect(container.textContent).toContain('TV KEYBOARD · EDITING:');
    expect(container.textContent).toContain('Sonzra Host / Server URL');

    // Click again to close
    serverUrlInput.click();
    await new Promise((r) => setTimeout(r, 80));
    expect(container.textContent).not.toContain('TV KEYBOARD · EDITING:');
  });
});
