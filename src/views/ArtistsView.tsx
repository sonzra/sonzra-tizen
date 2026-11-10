import React from 'react';
import { useServer } from '../context/ServerContext';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { Focusable } from '../navigation/Focusable';
import { MOCK_ARTISTS } from '../services/mockData';

export const ArtistsView: React.FC = () => {
  const { artists: serverArtists } = useServer();
  const { openArtist } = useSpatialNav();

  const artists = serverArtists.length > 0 ? serverArtists : MOCK_ARTISTS;

  return (
    <div className="w-full flex flex-col pb-28">
      {/* Header */}
      <div className="w-full flex items-baseline justify-between gap-6 shrink-0 mb-6 pt-1">
        <div className="flex items-baseline gap-4">
          <h1 className="text-[38px] leading-tight font-serif-title font-bold text-on-surface tracking-tight">
            Artists
          </h1>
          <span className="text-[14px] font-mono text-outline font-medium tracking-wider">
            {artists.length} ARTISTS IN VAULT
          </span>
        </div>
      </div>

      {/* Artists Circular Grid */}
      <section className="w-full" aria-label="Artists Grid">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full">
          {artists.map((artist) => {
            const focusId = `artist-card-${artist.id}`;

            return (
              <Focusable
                key={artist.id}
                focusId={focusId}
                group="artists-grid"
                className="rounded-2xl cursor-pointer transition-all duration-300 relative"
                onEnter={() => openArtist(artist.id)}
                onClick={() => openArtist(artist.id)}
              >
                {({ isFocused }) => (
                  <article
                    className={`flex flex-col items-center text-center rounded-2xl p-4 transition-all duration-300 cursor-pointer ${
                      isFocused
                        ? 'bg-surface-container-high transform scale-[1.05] shadow-[0_0_35px_rgba(73,220,202,0.4)] z-20'
                        : 'bg-surface-container-low hover:bg-surface-container-high'
                    }`}
                  >
                    {isFocused && (
                      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-secondary via-primary to-secondary opacity-95 blur-sm pointer-events-none"></div>
                    )}

                    <div className="relative w-36 h-36 rounded-full overflow-hidden bg-surface-container-lowest mb-3 shadow-lg border-2 border-white/10">
                      <img
                        alt={artist.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        src={artist.artworkUrl}
                      />
                    </div>

                    <h2
                      className={`text-[16px] font-bold truncate max-w-full transition-colors ${
                        isFocused ? 'text-secondary' : 'text-on-surface'
                      }`}
                    >
                      {artist.name}
                    </h2>
                    <span className="text-xs text-on-surface-variant font-mono mt-1">
                      {artist.albumCount} {artist.albumCount === 1 ? 'Album' : 'Albums'}
                    </span>
                  </article>
                )}
              </Focusable>
            );
          })}
        </div>
      </section>
    </div>
  );
};
