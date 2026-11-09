import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Album, Artist, ServerConfig } from '../types/music';
import { loadServerConfig, saveServerConfig } from '../services/storage';
import { SonzraApiClient } from '../services/sonzraApi';

interface ServerContextType {
  config: ServerConfig;
  updateConfig: (newConfig: Partial<ServerConfig>) => void;
  apiClient: SonzraApiClient;
  albums: Album[];
  artists: Artist[];
  loading: boolean;
  refreshLibrary: () => Promise<void>;
  testConnection: (url: string, id: string) => Promise<{ success: boolean; message: string; latency?: number }>;
}

const ServerContext = createContext<ServerContextType | null>(null);

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ServerConfig>(() => loadServerConfig());
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const apiClient = useMemo(() => new SonzraApiClient(config), [config]);

  const updateConfig = useCallback((newConfig: Partial<ServerConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      saveServerConfig(updated);
      return updated;
    });
  }, []);

  const refreshLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedAlbums, fetchedArtists] = await Promise.all([
        apiClient.fetchAlbums(),
        apiClient.fetchArtists(),
      ]);
      setAlbums(fetchedAlbums);
      setArtists(fetchedArtists);
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
        loading,
        refreshLibrary,
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
