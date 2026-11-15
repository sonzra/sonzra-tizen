import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Users, Play } from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { Focusable } from '../navigation/Focusable';
import { AlphabetRail } from '../components/AlphabetRail';

function getInitialLetter(name: string): string {
  if (!name) return '#';
  const first = name.trim().charAt(0).toUpperCase();
  if (first >= 'A' && first <= 'Z') return first;
  return '#';
}

export const ArtistsView: React.FC = () => {
  const { artists: serverArtists } = useServer();
  const { openArtist, setFocus } = useSpatialNav();
  const [activeLetter, setActiveLetter] = useState<string>('A');

  const artists = useMemo(() => {
    return [...(serverArtists || [])].sort((a, b) => a.name.localeCompare(b.name));
  }, [serverArtists]);

  // Compute available letters across all artists
  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    for (const artist of artists) {
      set.add(getInitialLetter(artist.name));
    }
    return set;
  }, [artists]);

  // Default to 'A' or first available letter once on initial load
  const initialLetterSetRef = useRef(false);
  useEffect(() => {
    if (!initialLetterSetRef.current && availableLetters.size > 0) {
      initialLetterSetRef.current = true;
      const initial = availableLetters.has('A')
        ? 'A'
        : Array.from(availableLetters).sort()[0] || 'A';
      setActiveLetter(initial);
    }
  }, [availableLetters]);

  // Filter artists by active letter
  const filteredArtists = useMemo(() => {
    return artists.filter((artist) => getInitialLetter(artist.name) === activeLetter);
  }, [artists, activeLetter]);

  const handleSelectLetter = useCallback((letter: string) => {
    setActiveLetter(letter);
  }, []);

  const handleEscapeLeftFromRail = useCallback(
    (_letter: string) => {
      if (filteredArtists.length > 0) {
        setFocus(`artist-card-${filteredArtists[0].id}`);
        return;
      }
      if (artists.length > 0) {
        setFocus(`artist-card-${artists[0].id}`);
      }
    },
    [filteredArtists, artists, setFocus]
  );

  return (
    <div className="w-full flex flex-col pb-28">
      {/* Header */}
      <div className="w-full flex items-baseline justify-between gap-6 shrink-0 mb-6 pt-1">
        <div className="flex items-baseline gap-4">
          <h1 className="text-[38px] leading-tight font-sans font-bold text-on-surface tracking-tight">
            Artists
          </h1>
          <span className="text-[14px] font-mono text-outline font-medium tracking-wider">
            {artists.length} {artists.length === 1 ? 'ARTIST' : 'ARTISTS'}
          </span>
        </div>
      </div>

      {artists.length === 0 ? (
        <section className="w-full" aria-label="Empty Artists Grid">
          <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-surface-container-low/60 border border-white/[0.04] text-center gap-4 my-8">
            <Users className="w-12 h-12 text-outline" />
            <h2 className="text-xl font-bold text-on-surface">No Artists Found</h2>
            <p className="text-sm text-on-surface-variant max-w-md">
              Your Sonzra server library does not contain any artists yet, or the server is still indexing.
            </p>
          </div>
        </section>
      ) : (
        <div className="w-full grid grid-cols-[minmax(0,1fr)_auto] gap-6 items-start">
          {/* Main Content: Filtered Artists Grid (Aligned to 8-Column Benchmark) */}
          <section className="flex flex-col gap-8 min-w-0" aria-label="Artists Grid">
            <div className="flex flex-col gap-3">
              {/* Section Letter Divider */}
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-2">
                <span className="w-8 h-8 rounded-lg bg-surface-container-high text-secondary flex items-center justify-center font-bold text-lg font-mono">
                  {activeLetter}
                </span>
                <span className="text-xs font-mono text-outline">
                  {filteredArtists.length} {filteredArtists.length === 1 ? 'artist' : 'artists'}
                </span>
              </div>

              {filteredArtists.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-surface-container-low/60 border border-white/[0.04] text-center gap-2 my-4">
                  <p className="text-sm text-on-surface-variant">No artists starting with '{activeLetter}'</p>
                </div>
              ) : (
                /* ~8-Column Widescreen TV Artist Grid matching Albums Tab Density */
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3.5 w-full">
                  {filteredArtists.map((artist, idx) => {
                    const focusId = `artist-card-${artist.id}`;
                    const isRightEdge = (idx + 1) % 8 === 0 || idx === filteredArtists.length - 1;
                    const isFirstCard = idx === 0;

                    return (
                      <Focusable
                        key={artist.id}
                        focusId={focusId}
                        group="artists-grid"
                        autoFocus={isFirstCard}
                        className="rounded-xl cursor-pointer relative"
                        onEnter={() => openArtist(artist.id)}
                        onClick={() => openArtist(artist.id)}
                        onArrow={(direction) => {
                          if (direction === 'right' && isRightEdge) {
                            setFocus(`alpha-${activeLetter}`);
                            return true;
                          }
                          return false;
                        }}
                      >
                        {({ isFocused }) => (
                          <article
                            className={`group relative flex flex-col rounded-xl p-2.5 cursor-pointer h-full transition-colors ${
                              isFocused
                                ? 'bg-surface-container-high z-10'
                                : 'bg-surface-container-low/60 hover:bg-surface-container-high'
                            }`}
                          >
                            {/* Circular avatar with square aspect ratio matching album card density */}
                            <div className="relative w-full aspect-square rounded-full overflow-hidden bg-surface-container-lowest mb-2 shadow-md border-2 border-white/10">
                              <img
                                alt={artist.name}
                                className="w-full h-full object-cover"
                                src={artist.artworkUrl}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                                }}
                              />

                              {/* TV Quick Play Overlay on Focus */}
                              {isFocused && (
                                <div className="absolute inset-0 bg-surface-dim/30 backdrop-blur-[1px] flex items-center justify-center">
                                  <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-[0_0_18px_rgba(73,220,202,0.9)]">
                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="relative flex flex-col pt-0.5 px-0.5 min-w-0">
                              <h2
                                className={`text-[15px] font-bold leading-tight truncate transition-colors ${
                                  isFocused ? 'text-secondary' : 'text-on-surface group-hover:text-primary'
                                }`}
                              >
                                {artist.name}
                              </h2>
                              <div className="flex items-center justify-between text-outline text-[12px] mt-0.5">
                                <span className="text-on-surface-variant font-mono">
                                  {artist.albumCount} {artist.albumCount === 1 ? 'Album' : 'Albums'}
                                </span>
                              </div>
                            </div>
                          </article>
                        )}
                      </Focusable>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Right Alphabet Rail */}
          <aside className="sticky top-6">
            <AlphabetRail
              activeLetter={activeLetter}
              availableLetters={availableLetters}
              onSelectLetter={handleSelectLetter}
              onEscapeLeft={handleEscapeLeftFromRail}
            />
          </aside>
        </div>
      )}
    </div>
  );
};
