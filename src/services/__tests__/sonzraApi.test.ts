import { describe, it, expect, vi, afterEach } from 'vitest';
import { SonzraApiClient } from '../sonzraApi';

describe('SonzraApiClient Media & Token URLs', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('appends token query param to audio and artwork URLs when authToken is present', () => {
    const client = new SonzraApiClient({
      serverUrl: 'http://192.168.31.10:3000',
      serverConnectionId: '11',
      authToken: 'test-secret-token-123',
      demoMode: false,
    });

    const artworkUrl = client.getArtworkUrl('item-456');
    expect(artworkUrl).toBe(
      'http://192.168.31.10:3000/server_connections/11/artwork/item-456?token=test-secret-token-123'
    );

    const audioUrl = client.getAudioUrl({
      id: 'track-789',
      title: 'Test Track',
      artist: 'Test Artist',
      album: 'Test Album',
      duration: 200,
    });
    expect(audioUrl).toBe(
      'http://192.168.31.10:3000/server_connections/11/audio/track-789?token=test-secret-token-123'
    );
  });

  it('preserves existing query parameters when appending token', () => {
    const client = new SonzraApiClient({
      serverUrl: 'http://192.168.31.10:3000',
      serverConnectionId: '11',
      authToken: 'test-token',
      demoMode: false,
    });

    const fallbackWithParam = client.getArtworkUrl('item-456', '/server_connections/11/artwork/item-456?tag=abc');
    expect(fallbackWithParam).toBe(
      'http://192.168.31.10:3000/server_connections/11/artwork/item-456?tag=abc&token=test-token'
    );
  });

  it('does not append token when demoMode is active', () => {
    const client = new SonzraApiClient({
      serverUrl: 'http://192.168.31.10:3000',
      serverConnectionId: '11',
      authToken: 'test-token',
      demoMode: true,
    });

    const artworkUrl = client.getArtworkUrl('item-456');
    expect(artworkUrl).toBe('./sonzra-mark.svg');
  });

  it('fetches synchronized lyrics from server endpoint', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        available: true,
        synchronized: true,
        lines: [
          { text: 'First line of lyrics', start: 0.5 },
          { text: 'Second line of lyrics', start: 4.2 },
        ],
      }),
    } as any);

    const client = new SonzraApiClient({
      serverUrl: 'http://192.168.31.10:3000',
      serverConnectionId: '11',
      authToken: 'test-token',
      demoMode: false,
    });

    const lyrics = await client.fetchLyrics('track-100');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://192.168.31.10:3000/server_connections/11/lyrics/track-100',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          Accept: 'application/json',
        }),
      })
    );
    expect(lyrics.available).toBe(true);
    expect(lyrics.synchronized).toBe(true);
    expect(lyrics.lines).toHaveLength(2);
    expect(lyrics.lines[0]).toEqual({ text: 'First line of lyrics', start: 0.5 });
  });

  it('handles lyrics 404 or network error gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as any);

    const client = new SonzraApiClient({
      serverUrl: 'http://192.168.31.10:3000',
      serverConnectionId: '11',
      authToken: 'test-token',
      demoMode: false,
    });

    const lyrics = await client.fetchLyrics('track-not-found');
    expect(lyrics.available).toBe(false);
    expect(lyrics.synchronized).toBe(false);
    expect(lyrics.lines).toEqual([]);
  });
});
