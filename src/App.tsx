import React from 'react';
import { SpatialNavigationProvider, useSpatialNav } from './navigation/SpatialNavigationContext';
import { ServerProvider } from './context/ServerContext';
import { PlayerProvider } from './context/PlayerContext';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { BottomDock } from './components/BottomDock';
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
        className={`relative z-10 w-full h-full overflow-y-auto scroll-smooth ${
          isNowPlaying ? 'p-8 xl:p-12' : 'pl-24 pt-20 px-10 pb-44'
        }`}
        style={{ scrollPaddingBottom: '140px', scrollPaddingTop: '90px' }}
      >
        <main className="w-full h-full min-h-full">{renderActiveView()}</main>
      </div>

      {/* Persistent Bottom Player Dock */}
      {!isNowPlaying && <BottomDock />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SpatialNavigationProvider>
      <ServerProvider>
        <PlayerProvider>
          <MainLayout />
        </PlayerProvider>
      </ServerProvider>
    </SpatialNavigationProvider>
  );
};

export default App;
