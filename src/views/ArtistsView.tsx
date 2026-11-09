import React from 'react';
import { useServer } from '../context/ServerContext';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { FocusableCard } from '../components/FocusableCard';

export const ArtistsView: React.FC = () => {
  const { artists, loading } = useServer();
  const { openArtist } = useSpatialNav();

  if (loading) {
    return (
      <div className="tv-view-loading">
        <div className="tv-spinner" />
        <p>Loading Artists Library...</p>
      </div>
    );
  }

  return (
    <div className="tv-view-content" role="main" aria-label="Artists Library">
      <header className="tv-view-header">
        <div className="tv-header-info">
          <div className="tv-eyebrow">LIBRARY • ARTISTS</div>
          <h1 className="tv-page-title">Artists</h1>
          <p className="tv-header-meta">{artists.length} artists in your library</p>
        </div>
      </header>

      <section className="tv-grid-container tv-artists-grid" aria-label="Artists Grid">
        {artists.map((artist, index) => (
          <FocusableCard
            key={artist.id}
            focusId={`artist-card-${artist.id}`}
            group="artists-grid"
            title={artist.name}
            subtitle={`${artist.albumCount} ${artist.albumCount === 1 ? 'Album' : 'Albums'}`}
            badge={artist.genre}
            imageUrl={artist.artworkUrl}
            aspectRatio="circle"
            onEnter={() => openArtist(artist.id)}
            onClick={() => openArtist(artist.id)}
            autoFocus={index === 0}
          />
        ))}
      </section>
    </div>
  );
};
