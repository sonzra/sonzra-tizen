import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { SpatialNavigationProvider } from '../../navigation/SpatialNavigationContext';
import { ServerProvider } from '../../context/ServerContext';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { SignInView } from '../SignInView';

const TestApp: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <div id="test-app-root">
      {isAuthenticated ? <div id="authenticated-view">Main Content</div> : <SignInView />}
    </div>
  );
};

describe('SignInView & Auth Flow Integration', () => {
  let container: HTMLDivElement;
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    const mockLocalStorage = {
      getItem: (key: string) => mockStore[key] || null,
      setItem: (key: string, value: string) => {
        mockStore[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/session')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            token: 'mock-jwt-token',
            user: { id: 1, email_address: 'demo@sonzra.com' },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [],
      });
    });

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('renders SignInView when unauthenticated', async () => {
    const root = createRoot(container);
    root.render(
      <SpatialNavigationProvider>
        <ServerProvider>
          <AuthProvider>
            <TestApp />
          </AuthProvider>
        </ServerProvider>
      </SpatialNavigationProvider>
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const signInTitle = document.querySelector('h1');
    expect(signInTitle?.textContent).toContain('Sonzra Audio');

    const emailField = document.querySelector('[data-focus-id="signin-field-email"]');
    expect(emailField).not.toBeNull();

    const pwField = document.querySelector('[data-focus-id="signin-field-password"]');
    expect(pwField).not.toBeNull();

    const submitBtn = document.querySelector('[data-focus-id="signin-btn-submit"]');
    expect(submitBtn).not.toBeNull();
  });

  it('transitions to authenticated state on entering demo mode', async () => {
    const root = createRoot(container);
    root.render(
      <SpatialNavigationProvider>
        <ServerProvider>
          <AuthProvider>
            <TestApp />
          </AuthProvider>
        </ServerProvider>
      </SpatialNavigationProvider>
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const demoBtn = document.querySelector('[data-focus-id="signin-btn-demo"]');
    expect(demoBtn).not.toBeNull();
    demoBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 100));

    const authView = document.getElementById('authenticated-view');
    expect(authView).not.toBeNull();
    expect(authView?.textContent).toBe('Main Content');
  });
});
