import { describe, it, expect } from 'vitest';
import { SonzraApiClient } from '../sonzraApi';

describe('SonzraApiClient Media & Token URLs', () => {
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
});
