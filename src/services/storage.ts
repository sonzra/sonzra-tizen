import { ServerConfig } from '../types/music';

const CONFIG_KEY = 'sonzra_tv_server_config';

export const DEFAULT_SERVER_CONFIG: ServerConfig = {
  serverUrl: 'http://localhost:3000',
  serverConnectionId: '1',
  authToken: '',
  demoMode: true,
  serverName: 'Local Sonzra Demo',
};

export function loadServerConfig(): ServerConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_SERVER_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Failed to load server config from localStorage:', err);
  }
  return DEFAULT_SERVER_CONFIG;
}

export function saveServerConfig(config: ServerConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to save server config to localStorage:', err);
  }
}
