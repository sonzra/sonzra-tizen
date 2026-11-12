import React from 'react';
import { SpatialNavigationProvider, useSpatialNav } from './navigation/SpatialNavigationContext';
import { ServerProvider } from './context/ServerContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { BottomDock } from './components/BottomDock';
import { MediaOsdToast } from './components/MediaOsdToast';
import { TvRemoteSimulator } from './components/TvRemoteSimulator';
import { SignInView } from './views/SignInView';
import { HomeView } from './views/HomeView';
import { LibraryView } from './views/LibraryView';
import { AlbumDetailView } from './views/AlbumDetailView';
import { ArtistsView } from './views/ArtistsView';
import { ArtistDetailView } from './views/ArtistDetailView';
import { NowPlayingView } from './views/NowPlayingView';
import { SettingsView } from './views/SettingsView';

const MainLayout: React.FC = () => {
  const { activeView } = useSpatialNav();

  const renderActiveView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView />;
      case 'library':
      case 'albums':
      case 'search':
        return <LibraryView />;
      case 'album-detail':
        return <AlbumDetailView />;
      case 'artists':
        return <ArtistsView />;
      case 'artist-detail':
        return <ArtistDetailView />;
      case 'now-playing':
        return <NowPlayingView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeView />;
    }
  };

  const isNowPlaying = activeView === 'now-playing';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background text-on-surface antialiased select-none">
      {/* Atmospheric TV Ambient Glow Backdrops */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_15%_20%,rgba(122,90,248,0.18)_0%,transparent_50%),radial-gradient(circle_at_85%_75%,rgba(73,220,202,0.12)_0%,transparent_45%)]"></div>

      {/* Persistent Left Navigation Rail (Hidden only in full cinema mode) */}
      {!isNowPlaying && <Sidebar />}

      {/* Persistent Top Header (Hidden in full cinema mode) */}
      {!isNowPlaying && (
        <TopHeader
          zoneName="Living Room"
          subhead="TIZEN MASTER HUB • 10FT MODE"
          showBitPerfect={false}
        />
      )}

      {/* Main Viewport Container */}
      <div
        id="tv-main-scroll-container"
        className={`relative z-10 w-full h-full overflow-y-auto ${
          isNowPlaying ? 'p-8 xl:p-12' : 'pl-24 pt-20 px-10 pb-64'
        }`}
        style={{ scrollPaddingBottom: '180px', scrollPaddingTop: '90px' }}
      >
        <main className="w-full min-h-full">{renderActiveView()}</main>
      </div>

      {/* Persistent Bottom Player Dock */}
      {!isNowPlaying && <BottomDock />}

      {/* Ambient Remote Media Control Feedback Toast */}
      <MediaOsdToast />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, initialLoading } = useAuth();

  return (
    <>
      {initialLoading ? (
        <div className="w-screen h-screen bg-background flex flex-col items-center justify-center gap-4 text-on-surface">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-container to-secondary flex items-center justify-center shadow-[0_0_32px_rgba(122,90,248,0.7)] animate-pulse">
            <span className="material-symbols-outlined text-[36px] text-surface-container-lowest font-bold">
              graphic_eq
            </span>
          </div>
          <div className="flex items-center gap-2 text-secondary text-[13px] font-mono uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
            <span>CONNECTING TO SONZRA...</span>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <SignInView />
      ) : (
        <MainLayout />
      )}
      <TvRemoteSimulator />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <SpatialNavigationProvider>
      <ServerProvider>
        <AuthProvider>
          <PlayerProvider>
            <AppContent />
          </PlayerProvider>
        </AuthProvider>
      </ServerProvider>
    </SpatialNavigationProvider>
  );
};

export default App;
