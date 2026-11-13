import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SonzraApiClient } from '../../services/sonzraApi';
import { ServerConfig } from '../../types/music';

describe('Radio Feature API & Extension', () => {
  const mockConfig: ServerConfig = {
    serverUrl: 'http://localhost:3000',
    serverConnectionId: '11',
    authToken: 'mock-token',
    demoMode: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches radio tracks from the server endpoint and maps to Track model', async () => {
    const mockResponse = {
      items: [
        {
          source: '/server_connections/11/audio/track-101',
          item_id: 'track-101',
          title: 'Celestial Ambient',
          artist: 'Stellar Drifter',
          duration: '4:20',
          artwork: '/server_connections/11/artwork/track-101',
          favorite: true,
          radio_eligible: true,
        },
        {
          source: '/server_connections/11/audio/track-102',
          item_id: 'track-102',
          title: 'Deep Horizon',
          artist: 'Nebula',
          duration: '5:15',
          artwork: '/server_connections/11/artwork/track-102',
          favorite: false,
          radio_eligible: true,
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const client = new SonzraApiClient(mockConfig);
    const tracks = await client.fetchRadioTracks('seed-track-1', 4);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/server_connections/11/radio_tracks/seed-track-1?limit=4',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
          Accept: 'application/json',
        }),
      })
    );

    expect(tracks).toHaveLength(2);
    expect(tracks[0].id).toBe('track-101');
    expect(tracks[0].title).toBe('Celestial Ambient');
    expect(tracks[0].artist).toBe('Stellar Drifter');
    expect(tracks[0].duration).toBe(260); // 4 * 60 + 20
    expect(tracks[0].isFavorite).toBe(true);
    expect(tracks[1].id).toBe('track-102');
    expect(tracks[1].duration).toBe(315); // 5 * 60 + 15
  });

  it('handles empty or error response gracefully without crashing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
    } as any);

    const client = new SonzraApiClient(mockConfig);
    const tracks = await client.fetchRadioTracks('seed-track-invalid');
    expect(tracks).toEqual([]);
  });
});
