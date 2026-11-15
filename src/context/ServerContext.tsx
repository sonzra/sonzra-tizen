import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Album, Artist, Audiobook, PodcastShow, Playlist, ServerConfig } from '../types/music';
import { loadServerConfig, saveServerConfig } from '../services/storage';
import { SonzraApiClient } from '../services/sonzraApi';

interface ServerContextType {
  config: ServerConfig;
  updateConfig: (newConfig: Partial<ServerConfig>) => void;
  apiClient: SonzraApiClient;
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  audiobooks: Audiobook[];
  podcasts: PodcastShow[];
  loading: boolean;
  refreshLibrary: () => Promise<void>;
  refreshPlaylists: () => Promise<void>;
  refreshAudiobooks: () => Promise<void>;
  refreshPodcasts: () => Promise<void>;
  testConnection: (url: string, id: string) => Promise<{ success: boolean; message: string; latency?: number }>;
}

const ServerContext = createContext<ServerContextType | null>(null);

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ServerConfig>(() => loadServerConfig());
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [podcasts, setPodcasts] = useState<PodcastShow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const apiClient = useMemo(() => new SonzraApiClient(config), [config]);

  const updateConfig = useCallback((newConfig: Partial<ServerConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      saveServerConfig(updated);
      return updated;
    });
  }, []);

  const refreshPlaylists = useCallback(async () => {
    try {
      const fetched = await apiClient.fetchPlaylists();
      setPlaylists(fetched);
    } catch (err) {
      console.warn('Failed to refresh playlists:', err);
    }
  }, [apiClient]);

  const refreshAudiobooks = useCallback(async () => {
    try {
      const fetched = await apiClient.fetchAudiobooks();
      setAudiobooks(fetched);
    } catch (err) {
      console.warn('Failed to refresh audiobooks:', err);
    }
  }, [apiClient]);

  const refreshPodcasts = useCallback(async () => {
    try {
      const fetched = await apiClient.fetchPodcasts();
      setPodcasts(fetched);
    } catch (err) {
      console.warn('Failed to refresh podcasts:', err);
    }
  }, [apiClient]);

  const refreshLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        apiClient.fetchAlbums(),
        apiClient.fetchArtists(),
        apiClient.fetchPlaylists(),
        apiClient.fetchAudiobooks(),
        apiClient.fetchPodcasts(),
      ]);
      if (results[0].status === 'fulfilled') setAlbums(results[0].value);
      if (results[1].status === 'fulfilled') setArtists(results[1].value);
      if (results[2].status === 'fulfilled') setPlaylists(results[2].value);
      if (results[3].status === 'fulfilled') setAudiobooks(results[3].value);
      if (results[4].status === 'fulfilled') setPodcasts(results[4].value);
    } catch (err) {
      console.warn('Failed to refresh library:', err);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  const testConnection = useCallback(
    async (url: string, id: string) => {
      return apiClient.testConnection(url, id);
    },
    [apiClient]
  );

  return (
    <ServerContext.Provider
      value={{
        config,
        updateConfig,
        apiClient,
        albums,
        artists,
        playlists,
        audiobooks,
        podcasts,
        loading,
        refreshLibrary,
        refreshPlaylists,
        refreshAudiobooks,
        refreshPodcasts,
        testConnection,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
};

export const useServer = () => {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
};
