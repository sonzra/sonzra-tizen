import React, { useMemo, useState, useRef, useCallback } from 'react';
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
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const artists = useMemo(() => {
    return [...(serverArtists || [])].sort((a, b) => a.name.localeCompare(b.name));
  }, [serverArtists]);

  // Group artists by first letter
  const groupedArtists = useMemo(() => {
    const groups: Record<string, typeof artists> = {};
    for (const artist of artists) {
      const letter = getInitialLetter(artist.name);
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(artist);
    }
    return groups;
  }, [artists]);

  const availableLetters = useMemo(() => {
    return new Set(Object.keys(groupedArtists));
  }, [groupedArtists]);

  const handleSelectLetter = useCallback((letter: string) => {
    setActiveLetter(letter);
    const targetElement = sectionRefs.current[letter];
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleEscapeLeftFromRail = useCallback(
    (letter: string) => {
      // Find artists for this letter or nearest available
      const targetGroup = groupedArtists[letter];
      if (targetGroup && targetGroup.length > 0) {
        setFocus(`artist-card-${targetGroup[0].id}`);
        return;
      }
      // Fallback: first available artist
      if (artists.length > 0) {
        setFocus(`artist-card-${artists[0].id}`);
      }
    },
    [groupedArtists, artists, setFocus]
  );

  return (
    <div className="w-full flex flex-col pb-28">
      {/* Header */}
      <div className="w-full flex items-baseline justify-between gap-6 shrink-0 mb-6 pt-1">
        <div className="flex items-baseline gap-4">
          <h1 className="text-[38px] leading-tight font-serif-title font-bold text-on-surface tracking-tight">
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
            <span className="material-symbols-outlined text-[48px] text-outline">group</span>
            <h2 className="text-xl font-bold text-on-surface">No Artists Found</h2>
            <p className="text-sm text-on-surface-variant max-w-md">
              Your Sonzra server library does not contain any artists yet, or the server is still indexing.
            </p>
          </div>
        </section>
      ) : (
        <div className="w-full grid grid-cols-[minmax(0,1fr)_auto] gap-6 items-start">
          {/* Main Content: Grouped Artists Grid */}
          <section className="flex flex-col gap-8 min-w-0" aria-label="Artists Grid">
            {Object.entries(groupedArtists).map(([letter, letterArtists]) => (
              <div
                key={letter}
                ref={(el) => {
                  sectionRefs.current[letter] = el;
                }}
                className="flex flex-col gap-3"
              >
                {/* Section Letter Divider */}
                <div className="flex items-center gap-3 border-b border-white/[0.06] pb-2">
                  <span className="w-8 h-8 rounded-lg bg-surface-container-high text-secondary flex items-center justify-center font-bold text-lg font-mono">
                    {letter}
                  </span>
                  <span className="text-xs font-mono text-outline">
                    {letterArtists.length} {letterArtists.length === 1 ? 'artist' : 'artists'}
                  </span>
                </div>

                {/* Unified Square Card Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
                  {letterArtists.map((artist, idx) => {
                    const focusId = `artist-card-${artist.id}`;
                    const isRightEdge = (idx + 1) % 5 === 0 || idx === letterArtists.length - 1;

                    return (
                      <Focusable
                        key={artist.id}
                        focusId={focusId}
                        group="artists-grid"
                        className="rounded-xl cursor-pointer relative"
                        onEnter={() => openArtist(artist.id)}
                        onClick={() => openArtist(artist.id)}
                        onArrow={(direction) => {
                          if (direction === 'right' && isRightEdge) {
                            setFocus(`alpha-${letter}`);
                            return true;
                          }
                          return false;
                        }}
                      >
                        {({ isFocused }) => (
                          <article
                            className={`group relative flex flex-col rounded-xl p-2.5 cursor-pointer h-full ${
                              isFocused
                                ? 'bg-surface-container-high z-10'
                                : 'bg-surface-container-low hover:bg-surface-container-high'
                            }`}
                          >
                            {/* Square aspect ratio cover */}
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-container-lowest mb-2 shadow-md">
                              <img
                                alt={artist.name}
                                className="w-full h-full object-cover"
                                src={artist.artworkUrl}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                                }}
                              />
                            </div>

                            <div className="relative flex flex-col pt-1 px-1">
                              <h2
                                className={`text-[15px] font-bold truncate transition-colors ${
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
              </div>
            ))}
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
