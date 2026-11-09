import React from 'react';
import { useServer } from '../context/ServerContext';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { FocusableCard } from '../components/FocusableCard';
import { usePlayer } from '../context/PlayerContext';
import { Play } from 'lucide-react';
import { FocusableButton } from '../components/FocusableButton';

export const AlbumsView: React.FC = () => {
  const { albums, loading } = useServer();
  const { openAlbum } = useSpatialNav();
  const { playAlbum } = usePlayer();

  if (loading) {
    return (
      <div className="tv-view-loading">
        <div className="tv-spinner" />
        <p>Loading Albums Library...</p>
      </div>
    );
  }

  return (
    <div className="tv-view-content" role="main" aria-label="Albums Library">
      <header className="tv-view-header">
        <div className="tv-header-info">
          <div className="tv-eyebrow">LIBRARY • ALBUMS</div>
          <h1 className="tv-page-title">Albums</h1>
          <p className="tv-header-meta">{albums.length} albums available</p>
        </div>
        {albums.length > 0 && (
          <div className="tv-header-actions">
            <FocusableButton
              focusId="albums-quick-play-first"
              group="albums-header"
              label="Play First Album"
              icon={<Play size={20} />}
              variant="primary"
              onEnter={() => playAlbum(albums[0])}
              onClick={() => playAlbum(albums[0])}
            />
          </div>
        )}
      </header>

      <section className="tv-grid-container" aria-label="Albums Grid">
        {albums.map((album, index) => (
          <FocusableCard
            key={album.id}
            focusId={`album-card-${album.id}`}
            group="albums-grid"
            title={album.title}
            subtitle={`${album.artist} • ${album.year || 'Unknown'}`}
            badge={album.genre}
            imageUrl={album.artworkUrl}
            onEnter={() => openAlbum(album.id)}
            onClick={() => openAlbum(album.id)}
            autoFocus={index === 0}
          />
        ))}
      </section>
    </div>
  );
};
