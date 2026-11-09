import React from 'react';
import { SpatialNavigationProvider, useSpatialNav } from './navigation/SpatialNavigationContext';
import { ServerProvider } from './context/ServerContext';
import { PlayerProvider } from './context/PlayerContext';
import { Sidebar } from './components/Sidebar';
import { MiniPlayer } from './components/MiniPlayer';
import { AlbumsView } from './views/AlbumsView';
import { AlbumDetailView } from './views/AlbumDetailView';
import { ArtistsView } from './views/ArtistsView';
import { ArtistDetailView } from './views/ArtistDetailView';
import { NowPlayingView } from './views/NowPlayingView';
import { SettingsView } from './views/SettingsView';

const MainLayout: React.FC = () => {
  const { activeView } = useSpatialNav();

  const renderActiveView = () => {
    switch (activeView) {
      case 'albums':
        return <AlbumsView />;
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
        return <AlbumsView />;
    }
  };

  const isFullscreenNowPlaying = activeView === 'now-playing';

  return (
    <div className={`tv-app-root ${isFullscreenNowPlaying ? 'tv-app-fullscreen' : ''}`}>
      {/* Sidebar navigation is hidden in fullscreen now playing */}
      {!isFullscreenNowPlaying && <Sidebar />}

      {/* Main content display area */}
      <main className="tv-main-viewport">
        {renderActiveView()}
      </main>

      {/* Persistent Mini Player */}
      {!isFullscreenNowPlaying && <MiniPlayer />}
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
