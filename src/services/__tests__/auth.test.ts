import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearAuthSession, loadAuthSession, saveAuthSession } from '../storage';
import { SonzraApiClient } from '../sonzraApi';
import { AuthSession } from '../../types/auth';

describe('Auth Services & Session Storage', () => {
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
    vi.restoreAllMocks();
  });

  it('saves, loads, and clears auth sessions correctly', () => {
    expect(loadAuthSession()).toBeNull();

    const mockSession: AuthSession = {
      token: 'jwt-test-token-12345',
      session_id: 42,
      user: {
        id: 7,
        email_address: 'audiophile@sonzra.org',
        name: 'Audiophile User',
      },
    };

    saveAuthSession(mockSession);
    const loaded = loadAuthSession();
    expect(loaded).toEqual(mockSession);
    expect(loaded?.token).toBe('jwt-test-token-12345');
    expect(loaded?.user.email_address).toBe('audiophile@sonzra.org');

    clearAuthSession();
    expect(loadAuthSession()).toBeNull();
  });

  it('authenticates against /api/v1/session and returns session data', async () => {
    const client = new SonzraApiClient({
      serverUrl: 'http://localhost:3000',
      serverConnectionId: '1',
      demoMode: false,
    });

    const mockResponse: AuthSession = {
      token: 'bearer-token-abc',
      session_id: 101,
      user: {
        id: 1,
        email_address: 'test@sonzra.org',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const session = await client.signIn('test@sonzra.org', 'password123');
    expect(session.token).toBe('bearer-token-abc');
    expect(session.user.email_address).toBe('test@sonzra.org');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/session',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email_address: 'test@sonzra.org', password: 'password123' }),
      })
    );
  });

  it('throws descriptive error on invalid credentials', async () => {
    const client = new SonzraApiClient({
      serverUrl: 'http://localhost:3000',
      serverConnectionId: '1',
      demoMode: false,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid email address or password' }),
    } as any);

    await expect(client.signIn('wrong@sonzra.org', 'badpass')).rejects.toThrow(
      'Invalid email address or password'
    );
  });
});
