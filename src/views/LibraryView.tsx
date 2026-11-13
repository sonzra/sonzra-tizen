import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { Focusable } from '../navigation/Focusable';
import { usePlayer } from '../context/PlayerContext';
import { useServer } from '../context/ServerContext';
import { AlphabetRail } from '../components/AlphabetRail';

type LibraryTab = 'albums' | 'artists' | 'tracks' | 'playlists' | 'podcasts';

function getInitialLetter(title: string): string {
  if (!title) return '#';
  const first = title.trim().charAt(0).toUpperCase();
  if (first >= 'A' && first <= 'Z') return first;
  return '#';
}

export const LibraryView: React.FC = () => {
  const { openAlbum, goToView, setFocus } = useSpatialNav();
  const { playAlbum, currentTrack, playbackStatus } = usePlayer();
  const { albums: serverAlbums, artists: serverArtists, config } = useServer();

  const [activeTab, setActiveTab] = useState<LibraryTab>('albums');
  const [sortOption, setSortOption] = useState<string>('Title (A-Z)');
  const [activeLetter, setActiveLetter] = useState<string>('A');
  const albumSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const albums = serverAlbums || [];
  const artists = serverArtists || [];
  const totalTracks = useMemo(
    () => albums.reduce((acc, a) => acc + (a.trackCount || 0), 0),
    [albums]
  );

  const serverHost = useMemo(() => {
    try {
      if (config.serverUrl) return new URL(config.serverUrl).host;
    } catch {}
    return 'Sonzra Media Server';
  }, [config.serverUrl]);

  const sortedAlbums = useMemo(() => {
    const list = [...albums];
    if (sortOption === 'Title (A-Z)') {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortOption === 'Artist (A-Z)') {
      return list.sort((a, b) => a.artist.localeCompare(b.artist));
    }
    if (sortOption === 'Year') {
      return list.sort((a, b) => (b.year || 0) - (a.year || 0));
    }
    return list;
  }, [albums, sortOption]);

  // Group albums by initial letter based on current sort
  const groupedAlbums = useMemo(() => {
    const groups: Record<string, typeof sortedAlbums> = {};
    for (const album of sortedAlbums) {
      const keyName = sortOption === 'Artist (A-Z)' ? album.artist : album.title;
      const letter = getInitialLetter(keyName);
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(album);
    }
    return groups;
  }, [sortedAlbums, sortOption]);

  const availableLetters = useMemo(() => {
    return new Set(Object.keys(groupedAlbums));
  }, [groupedAlbums]);

  const handleSelectLetter = useCallback((letter: string) => {
    setActiveLetter(letter);
    const targetElement = albumSectionRefs.current[letter];
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleEscapeLeftFromRail = useCallback(
    (letter: string) => {
      const targetGroup = groupedAlbums[letter];
      if (targetGroup && targetGroup.length > 0) {
        setFocus(`library-card-${targetGroup[0].id}`);
        return;
      }
      if (sortedAlbums.length > 0) {
        setFocus(`library-card-${sortedAlbums[0].id}`);
      }
    },
    [groupedAlbums, sortedAlbums, setFocus]
  );

  const tabs: Array<{ id: LibraryTab; label: string; icon: string }> = [
    { id: 'albums', label: 'Albums', icon: 'album' },
    { id: 'artists', label: 'Artists', icon: 'person' },
    { id: 'tracks', label: 'Tracks', icon: 'music_note' },
    { id: 'playlists', label: 'Playlists', icon: 'queue_music' },
    { id: 'podcasts', label: 'Podcasts', icon: 'podcasts' },
  ];

  const handleTabSelect = (tab: LibraryTab) => {
    setActiveTab(tab);
    if (tab === 'artists') {
      goToView('artists');
    }
  };

  return (
    <div className="w-full flex flex-col pb-28">
      {/* Library Title & Server Stats Banner */}
      <div className="w-full flex items-baseline justify-between gap-6 shrink-0 mb-4 pt-1">
        <div className="flex items-baseline gap-4">
          <h1 className="text-[38px] leading-tight font-serif-title font-bold text-on-surface tracking-tight">
            Your Library
          </h1>
          <span className="text-[14px] font-mono text-outline font-medium tracking-wider">
            {serverHost}
          </span>
        </div>

        {/* Server Stats Pill Badges (Authentic server metadata only) */}
        <div className="flex items-center gap-2 bg-surface-container-low/90 px-3 py-1.5 rounded-xl border border-white/[0.04] text-[13px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high/60">
            <span className="material-symbols-outlined text-[16px] text-primary">album</span>
            <span className="font-bold text-on-surface">{albums.length}</span>
            <span className="text-outline">Albums</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high/60">
            <span className="material-symbols-outlined text-[16px] text-tertiary">person</span>
            <span className="font-bold text-on-surface">{artists.length}</span>
            <span className="text-outline">Artists</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high/60">
            <span className="material-symbols-outlined text-[16px] text-secondary">audiotrack</span>
            <span className="font-bold text-on-surface">{totalTracks.toLocaleString()}</span>
            <span className="text-outline">Tracks</span>
          </div>
        </div>
      </div>

      {/* TV Category Filter Bar & Quick Sort */}
      <div className="w-full flex items-center justify-between gap-4 shrink-0 mb-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Focusable
                key={tab.id}
                focusId={`library-tab-${tab.id}`}
                group="library-tabs"
                className="rounded-full cursor-pointer transition-all duration-200"
                onEnter={() => handleTabSelect(tab.id)}
                onClick={() => handleTabSelect(tab.id)}
              >
                {({ isFocused }) => (
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[14px] transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container shadow-[0_0_22px_rgba(122,90,248,0.7)] font-bold'
                        : isFocused
                        ? 'bg-surface-container-high text-on-surface ring-2 ring-secondary shadow-[0_0_18px_rgba(73,220,202,0.4)] font-medium scale-105'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: isActive ? '"FILL" 1' : undefined }}
                    >
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed shadow-[0_0_6px_rgba(108,248,230,0.9)]"></span>
                    )}
                  </button>
                )}
              </Focusable>
            );
          })}
        </div>

        {/* Sort Indicator */}
        <div className="flex items-center gap-2">
          <Focusable
            focusId="library-sort-selector"
            group="library-tabs"
            className="rounded-xl cursor-pointer"
            onEnter={() => {
              const options = ['Title (A-Z)', 'Artist (A-Z)', 'Recently Added', 'Year'];
              const curIdx = options.indexOf(sortOption);
              const nextIdx = (curIdx + 1) % options.length;
              setSortOption(options[nextIdx]);
            }}
          >
            {({ isFocused }) => (
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[13px] transition-all ${
                  isFocused
                    ? 'bg-surface-container-high ring-2 ring-secondary shadow-[0_0_15px_rgba(73,220,202,0.4)] scale-105 text-on-surface'
                    : 'bg-surface-container-high/80 text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] text-primary">swap_vert</span>
                <span className="text-on-surface-variant">Sort:</span>
                <span className="font-bold">{sortOption}</span>
                <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
              </div>
            )}
          </Focusable>
        </div>
      </div>

      {/* Main Content Layout with Alphabet Rail */}
      {sortedAlbums.length === 0 ? (
        <section className="w-full" aria-label="Library Empty Grid">
          <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-surface-container-low/60 border border-white/[0.04] text-center gap-4 my-8">
            <span className="material-symbols-outlined text-[48px] text-outline">album</span>
            <h2 className="text-xl font-bold text-on-surface">No Albums Found</h2>
            <p className="text-sm text-on-surface-variant max-w-md">
              Your Sonzra server library does not contain any albums yet, or the server is still indexing.
            </p>
          </div>
        </section>
      ) : (
        <div className="w-full grid grid-cols-[minmax(0,1fr)_auto] gap-6 items-start">
          {/* Main Album Grid Sections */}
          <section className="flex flex-col gap-8 min-w-0" aria-label="Library Media Grid">
            {Object.entries(groupedAlbums).map(([letter, letterAlbums]) => (
              <div
                key={letter}
                ref={(el) => {
                  albumSectionRefs.current[letter] = el;
                }}
                className="flex flex-col gap-3"
              >
                {/* Section Letter Divider */}
                <div className="flex items-center gap-3 border-b border-white/[0.06] pb-2">
                  <span className="w-8 h-8 rounded-lg bg-surface-container-high text-secondary flex items-center justify-center font-bold text-lg font-mono">
                    {letter}
                  </span>
                  <span className="text-xs font-mono text-outline">
                    {letterAlbums.length} {letterAlbums.length === 1 ? 'album' : 'albums'}
                  </span>
                </div>

                {/* 5-Column Widescreen Album Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
                  {letterAlbums.map((album, idx) => {
                    const focusId = `library-card-${album.id}`;
                    const isPlayingThisAlbum = currentTrack?.albumId === album.id && playbackStatus === 'playing';
                    const isRightEdge = (idx + 1) % 5 === 0 || idx === letterAlbums.length - 1;

                    return (
                      <Focusable
                        key={album.id}
                        focusId={focusId}
                        group="library-grid"
                        className="rounded-xl cursor-pointer relative"
                        onEnter={() => openAlbum(album.id)}
                        onClick={() => openAlbum(album.id)}
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
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-container-lowest mb-2 shadow-md">
                              <img
                                alt={album.title}
                                className="w-full h-full object-cover"
                                src={album.artworkUrl}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                                }}
                              />
                              {album.codecBadge && (
                                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-surface-container-lowest/85 backdrop-blur-md">
                                  <span className="font-mono text-secondary text-[11px] font-bold tracking-wider">
                                    {album.codecBadge}
                                  </span>
                                </div>
                              )}

                              {/* TV Quick Play Overlay on Focus or When Playing */}
                              {(isFocused || isPlayingThisAlbum) && (
                                <div className="absolute inset-0 bg-surface-dim/40 backdrop-blur-[1px] flex items-center justify-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playAlbum(album);
                                    }}
                                    className="w-12 h-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-[0_0_24px_rgba(73,220,202,0.9)] cursor-pointer"
                                    title="Play Album"
                                  >
                                    <span
                                      className="material-symbols-outlined text-[28px]"
                                      style={{ fontVariationSettings: '"FILL" 1' }}
                                    >
                                      {isPlayingThisAlbum ? 'pause' : 'play_arrow'}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="relative flex flex-col pt-1 px-1">
                              <h2
                                className={`text-[15px] font-bold truncate transition-colors ${
                                  isFocused ? 'text-secondary' : 'text-on-surface group-hover:text-primary'
                                }`}
                              >
                                {album.title}
                              </h2>
                              <div className="flex items-center justify-between text-outline text-[12px] mt-0.5">
                                <span className="text-on-surface-variant truncate mr-1">{album.artist}</span>
                                {album.year && (
                                  <span className="font-mono font-semibold">{album.year}</span>
                                )}
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
