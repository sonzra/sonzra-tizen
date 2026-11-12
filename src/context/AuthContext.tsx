import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthSession } from '../types/auth';
import { clearAuthSession, loadAuthSession, saveAuthSession } from '../services/storage';
import { useServer } from './ServerContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isDemoUser: boolean;
  initialLoading: boolean;
  loading: boolean;
  signIn: (email: string, password: string, serverUrl?: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config, updateConfig, apiClient, refreshLibrary } = useServer();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Restore existing session on mount
  useEffect(() => {
    try {
      const savedSession = loadAuthSession();
      if (savedSession && savedSession.token) {
        setUser(savedSession.user);
        setToken(savedSession.token);
        setIsAuthenticated(true);
        setIsDemoUser(false);
        updateConfig({ authToken: savedSession.token, demoMode: false });
      } else if (config.demoMode) {
        // If explicitly set in demo mode previously
        setUser({ id: 'demo', email_address: 'demo@sonzra.org', name: 'Demo Listener' });
        setIsAuthenticated(true);
        setIsDemoUser(true);
      }
    } catch (e) {
      console.warn('Error initializing auth state:', e);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, serverUrl?: string) => {
      setLoading(true);
      try {
        if (serverUrl && serverUrl !== config.serverUrl) {
          updateConfig({ serverUrl });
          apiClient.updateConfig({ ...config, serverUrl });
        }

        const session: AuthSession = await apiClient.signIn(email, password);
        saveAuthSession(session);
        setUser(session.user);
        setToken(session.token);
        setIsAuthenticated(true);
        setIsDemoUser(false);
        updateConfig({ authToken: session.token, demoMode: false });
        await refreshLibrary();
      } finally {
        setLoading(false);
      }
    },
    [apiClient, config, refreshLibrary, updateConfig]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await apiClient.signOut();
    } catch (err) {
      console.warn('Sign out call failed:', err);
    } finally {
      clearAuthSession();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setIsDemoUser(false);
      updateConfig({ authToken: '', demoMode: false });
      setLoading(false);
    }
  }, [apiClient, updateConfig]);

  const enterDemoMode = useCallback(async () => {
    setLoading(true);
    try {
      await signIn('demo@sonzra.com', 'password');
    } catch (err) {
      console.warn('Auto demo sign-in failed, fallback to local session:', err);
      setUser({ id: 'demo', email_address: 'demo@sonzra.com', name: 'Demo Listener' });
      setIsAuthenticated(true);
      setIsDemoUser(true);
      refreshLibrary();
    } finally {
      setLoading(false);
    }
  }, [signIn, refreshLibrary]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isDemoUser,
        initialLoading,
        loading,
        signIn,
        signOut,
        enterDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
