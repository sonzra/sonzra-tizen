import { ServerConfig } from '../types/music';
import { AuthSession } from '../types/auth';

const CONFIG_KEY = 'sonzra_tv_server_config';
const AUTH_SESSION_KEY = 'sonzra_tv_auth_session';

export const DEFAULT_SERVER_CONFIG: ServerConfig = {
  serverUrl: 'http://192.168.31.139:3000',
  serverConnectionId: '11',
  authToken: '',
  demoMode: false,
  serverName: 'Local Sonzra',
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

export function loadAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (raw) {
      return JSON.parse(raw) as AuthSession;
    }
  } catch (err) {
    console.warn('Failed to load auth session from localStorage:', err);
  }
  return null;
}

export function saveAuthSession(session: AuthSession): void {
  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('Failed to save auth session to localStorage:', err);
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch (err) {
    console.warn('Failed to clear auth session from localStorage:', err);
  }
}
