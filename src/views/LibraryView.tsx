import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Disc,
  User,
  ListMusic,
  BookOpen,
  Radio,
  Users,
  RefreshCw,
  Clock,
  ArrowUpDown,
  ChevronDown,
  Play,
  Pause,
  X,
  LucideIcon,
} from 'lucide-react';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { Focusable } from '../navigation/Focusable';
import { usePlayer } from '../context/PlayerContext';
import { useServer } from '../context/ServerContext';
import { AlphabetRail } from '../components/AlphabetRail';
import { Audiobook, AudiobookChapter, Playlist, PodcastEpisode, PodcastShow } from '../types/music';

type LibraryTab = 'albums' | 'artists' | 'playlists' | 'audiobooks' | 'podcasts';

function getInitialLetter(title: string): string {
  if (!title) return '#';
  const first = title.trim().charAt(0).toUpperCase();
  if (first >= 'A' && first <= 'Z') return first;
  return '#';
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const LibraryView: React.FC = () => {
  const { openAlbum, openArtist, goToView, setFocus } = useSpatialNav();
  const { playAlbum, playTrack, playTracks, currentTrack, playbackStatus } = usePlayer();
  const {
    albums: serverAlbums,
    artists: serverArtists,
    playlists: serverPlaylists,
    audiobooks: serverAudiobooks,
    podcasts: serverPodcasts,
    refreshPlaylists,
    config,
  } = useServer();

  const [activeTab, setActiveTab] = useState<LibraryTab>('albums');
  const [sortOption, setSortOption] = useState<string>('Title (A-Z)');
  const [activeLetter, setActiveLetter] = useState<string>('A');
  const [isSyncingPlaylists, setIsSyncingPlaylists] = useState<boolean>(false);
  const [selectedAudiobook, setSelectedAudiobook] = useState<Audiobook | null>(null);
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastShow | null>(null);

  const albums = serverAlbums || [];
  const artists = serverArtists || [];
  const playlists = serverPlaylists || [];
  const audiobooks = serverAudiobooks || [];
  const podcasts = serverPodcasts || [];

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

  // Compute available letters across all loaded albums
  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    for (const album of sortedAlbums) {
      const keyName = sortOption === 'Artist (A-Z)' ? album.artist : album.title;
      set.add(getInitialLetter(keyName));
    }
    return set;
  }, [sortedAlbums, sortOption]);

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

  // Primary filtering by letter for Albums collection
  const filteredAlbums = useMemo(() => {
    return sortedAlbums.filter((album) => {
      const keyName = sortOption === 'Artist (A-Z)' ? album.artist : album.title;
      return getInitialLetter(keyName) === activeLetter;
    });
  }, [sortedAlbums, sortOption, activeLetter]);

  const handleSelectLetter = useCallback((letter: string) => {
    setActiveLetter(letter);
  }, []);

  const handleEscapeLeftFromRail = useCallback(
    (_letter: string) => {
      if (filteredAlbums.length > 0) {
        setFocus(`library-card-${filteredAlbums[0].id}`);
        return;
      }
      if (sortedAlbums.length > 0) {
        setFocus(`library-card-${sortedAlbums[0].id}`);
        return;
      }
      setFocus('library-tab-albums');
    },
    [filteredAlbums, sortedAlbums, setFocus]
  );

  const tabs: Array<{ id: LibraryTab; label: string; icon: LucideIcon }> = [
    { id: 'albums', label: 'Albums', icon: Disc },
    { id: 'artists', label: 'Artists', icon: User },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'audiobooks', label: 'Audiobooks', icon: BookOpen },
    { id: 'podcasts', label: 'Podcasts', icon: Radio },
  ];

  const handleTabSelect = (tab: LibraryTab) => {
    setActiveTab(tab);
    if (tab === 'artists') {
      goToView('artists', undefined, true);
    }
    setSelectedAudiobook(null);
    setSelectedPodcast(null);
  };

  const handleSyncPlaylists = async () => {
    setIsSyncingPlaylists(true);
    try {
      await refreshPlaylists();
    } finally {
      setIsSyncingPlaylists(false);
    }
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      playTracks(playlist.tracks);
      return;
    }
    playTrack({
      id: `pl-${playlist.id}-t1`,
      title: playlist.name,
      artist: playlist.collaboratorName ? `Curated with ${playlist.collaboratorName}` : 'Playlist',
      album: playlist.name,
      duration: playlist.duration || 180,
      artworkUrl: playlist.artworkUrl,
    });
  };

  const handlePlayAudiobookChapter = (audiobook: Audiobook, chapter: AudiobookChapter) => {
    playTrack({
      id: `ab-${audiobook.id}-${chapter.id}`,
      title: chapter.title,
      artist: audiobook.author,
      album: audiobook.title,
      duration: chapter.duration,
      artworkUrl: audiobook.artworkUrl,
      audioUrl: audiobook.audioUrl,
    });
    setSelectedAudiobook(null);
  };

  const handlePlayPodcastEpisode = (podcast: PodcastShow, episode: PodcastEpisode) => {
    playTrack({
      id: `pod-${podcast.id}-${episode.id}`,
      title: episode.title,
      artist: podcast.author,
      album: podcast.title,
      duration: episode.duration,
      artworkUrl: episode.artworkUrl || podcast.artworkUrl,
      audioUrl: episode.audioUrl,
    });
    setSelectedPodcast(null);
  };

  return (
    <div className="w-full flex flex-col pb-28">
      {/* Library Title & Clean Host Subtitle (Misleading counter pill badges removed per Issue #35) */}
      <div className="w-full flex items-baseline justify-between gap-6 shrink-0 mb-4 pt-1">
        <div className="flex items-baseline gap-4">
          <h1 className="text-[38px] leading-tight font-sans font-bold text-on-surface tracking-tight">
            Your Library
          </h1>
          <span className="text-[14px] font-mono text-outline font-medium tracking-wider">
            {serverHost}
          </span>
        </div>
      </div>

      {/* TV Category Filter Bar & Actions */}
      <div className="w-full flex items-center justify-between gap-4 shrink-0 mb-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
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
                    <TabIcon className="w-4 h-4" />
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

        {/* Sort & Playlist Sync Actions */}
        <div className="flex items-center gap-3">
          {activeTab === 'playlists' && (
            <Focusable
              focusId="library-btn-sync-playlists"
              group="library-tabs"
              className="rounded-xl cursor-pointer"
              onEnter={handleSyncPlaylists}
              onClick={handleSyncPlaylists}
            >
              {({ isFocused }) => (
                <button
                  type="button"
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                    isFocused
                      ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_15px_rgba(73,220,202,0.5)] scale-105'
                      : 'bg-surface-container-high text-secondary border border-secondary/30 hover:bg-surface-container-highest'
                  }`}
                  title="Synchronize Playlists with Sonzra Server"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPlaylists ? 'animate-spin' : ''}`} />
                  <span>{isSyncingPlaylists ? 'Syncing...' : 'Sync Playlists'}</span>
                </button>
              )}
            </Focusable>
          )}

          {activeTab === 'albums' && (
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
                  <ArrowUpDown className="w-4 h-4 text-primary" />
                  <span className="text-on-surface-variant">Sort:</span>
                  <span className="font-bold">{sortOption}</span>
                  <ChevronDown className="w-4 h-4 text-outline" />
                </div>
              )}
            </Focusable>
          )}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: ALBUMS (CRITICAL BENCHMARK INVARIANT: 8-Column Layout Exactly Preserved)
         ========================================================================= */}
      {activeTab === 'albums' && (
        sortedAlbums.length === 0 ? (
          <section className="w-full" aria-label="Library Empty Grid">
            <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-surface-container-low/60 border border-white/[0.04] text-center gap-4 my-8">
              <Disc className="w-12 h-12 text-outline" />
              <h2 className="text-xl font-bold text-on-surface">No Albums Found</h2>
              <p className="text-sm text-on-surface-variant max-w-md">
                Your Sonzra server library does not contain any albums yet, or the server is still indexing.
              </p>
            </div>
          </section>
        ) : (
          <div className="w-full grid grid-cols-[minmax(0,1fr)_auto] gap-6 items-start">
            {/* Main Album Grid Section with Letter Filtering */}
            <section className="flex flex-col gap-8 min-w-0" aria-label="Library Media Grid">
              <div className="flex flex-col gap-3">
                {/* Section Letter Divider */}
                <div className="flex items-center gap-3 border-b border-white/[0.06] pb-2">
                  <span className="w-8 h-8 rounded-lg bg-surface-container-high text-secondary flex items-center justify-center font-bold text-lg font-mono">
                    {activeLetter}
                  </span>
                  <span className="text-xs font-mono text-outline">
                    {filteredAlbums.length} {filteredAlbums.length === 1 ? 'album' : 'albums'}
                  </span>
                </div>

                {filteredAlbums.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-surface-container-low/60 border border-white/[0.04] text-center gap-2 my-4">
                    <p className="text-sm text-on-surface-variant">No albums starting with '{activeLetter}'</p>
                  </div>
                ) : (
                  /* ~8-Column Widescreen TV Album Grid (Benchmark Invariant) */
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3.5 w-full">
                    {filteredAlbums.map((album, idx) => {
                      const focusId = `library-card-${album.id}`;
                      const isPlayingThisAlbum = currentTrack?.albumId === album.id && playbackStatus === 'playing';
                      const isRightEdge = (idx + 1) % 8 === 0 || idx === filteredAlbums.length - 1;

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
                              setFocus(`alpha-${activeLetter}`);
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
                                    <span className="font-mono text-secondary text-[10px] sm:text-[11px] font-bold tracking-wider">
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
                                      className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-[0_0_18px_rgba(73,220,202,0.9)] cursor-pointer"
                                      title="Play Album"
                                    >
                                      {isPlayingThisAlbum ? (
                                        <Pause className="w-6 h-6 fill-current" />
                                      ) : (
                                        <Play className="w-6 h-6 fill-current ml-0.5" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="relative flex flex-col pt-0.5 px-0.5 min-w-0">
                                <h2
                                  className={`text-[15px] font-bold leading-tight truncate transition-colors ${
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
        )
      )}

      {/* =========================================================================
          TAB 2: ARTISTS (Aligned to 8-Column Benchmark Grid Density)
         ========================================================================= */}
      {activeTab === 'artists' && (
        artists.length === 0 ? (
          <section className="w-full" aria-label="Artists Library Empty">
            <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-surface-container-low/60 border border-white/[0.04] text-center gap-4 my-8">
              <User className="w-12 h-12 text-outline" />
              <h2 className="text-xl font-bold text-on-surface">No Artists Found</h2>
              <p className="text-sm text-on-surface-variant max-w-md">
                Your Sonzra server library does not contain any artists yet, or the server is still indexing.
              </p>
            </div>
          </section>
        ) : (
          <section className="w-full" aria-label="Artists Library">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3.5 w-full">
              {artists.map((artist) => {
                const focusId = `library-artist-${artist.id}`;
                return (
                  <Focusable
                    key={artist.id}
                    focusId={focusId}
                    group="library-grid"
                    className="rounded-xl cursor-pointer relative"
                    onEnter={() => openArtist(artist.id)}
                    onClick={() => openArtist(artist.id)}
                  >
                    {({ isFocused }) => (
                      <article
                        className={`group relative flex flex-col rounded-xl p-2.5 cursor-pointer h-full ${
                          isFocused ? 'bg-surface-container-high z-10' : 'bg-surface-container-low hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="relative w-full aspect-square rounded-full overflow-hidden bg-surface-container-lowest mb-2 shadow-md border-2 border-white/[0.04]">
                          <img
                            alt={artist.name}
                            className="w-full h-full object-cover"
                            src={artist.artworkUrl}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                            }}
                          />
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
          </section>
        )
      )}

      {/* =========================================================================
          TAB 3: PLAYLISTS (Aligned to 8-Column Benchmark Grid Density)
         ========================================================================= */}
      {activeTab === 'playlists' && (
        playlists.length === 0 ? (
          <section className="w-full" aria-label="Playlists Empty Grid">
            <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-surface-container-low/60 border border-white/[0.04] text-center gap-4 my-8">
              <ListMusic className="w-12 h-12 text-outline" />
              <h2 className="text-xl font-bold text-on-surface">No Playlists Found</h2>
              <p className="text-sm text-on-surface-variant max-w-md">
                No playlists are available on your Sonzra server.
              </p>
            </div>
          </section>
        ) : (
          <section className="w-full flex flex-col gap-4" aria-label="Playlists Grid">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3.5 w-full">
              {playlists.map((playlist) => {
                const focusId = `library-playlist-${playlist.id}`;
                return (
                  <Focusable
                    key={playlist.id}
                    focusId={focusId}
                    group="library-grid"
                    className="rounded-xl cursor-pointer relative"
                    onEnter={() => handlePlayPlaylist(playlist)}
                    onClick={() => handlePlayPlaylist(playlist)}
                  >
                    {({ isFocused }) => (
                      <article
                        className={`group relative flex flex-col rounded-xl p-2.5 cursor-pointer h-full ${
                          isFocused ? 'bg-surface-container-high z-10' : 'bg-surface-container-low hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-container-lowest mb-2 shadow-md">
                          <img
                            alt={playlist.name}
                            className="w-full h-full object-cover"
                            src={playlist.artworkUrl || './sonzra-mark.svg'}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                            }}
                          />

                          {/* Quick Play Overlay */}
                          {isFocused && (
                            <div className="absolute inset-0 bg-surface-dim/40 backdrop-blur-[1px] flex items-center justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayPlaylist(playlist);
                                }}
                                className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-[0_0_18px_rgba(73,220,202,0.9)] cursor-pointer"
                                title="Play Playlist"
                              >
                                <Play className="w-6 h-6 fill-current ml-0.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="relative flex flex-col pt-0.5 px-0.5 min-w-0">
                          <h2
                            className={`text-[15px] font-bold leading-tight truncate transition-colors ${
                              isFocused ? 'text-secondary' : 'text-on-surface'
                            }`}
                          >
                            {playlist.name}
                          </h2>

                          <div className="flex items-center justify-between text-outline text-[12px] mt-0.5">
                            <span className="font-mono">{playlist.trackCount || 0} Tracks</span>
                            {playlist.duration && (
                              <span className="font-mono">{formatDuration(playlist.duration)}</span>
                            )}
                          </div>

                          {/* 10-Foot Collaborative Playlist Indicator Badge */}
                          {playlist.isCollaborative && (
                            <div
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/15 border border-secondary/35 text-secondary text-[10px] font-semibold tracking-wide w-fit mt-1 shadow-sm"
                              title={`Collaborative playlist with ${playlist.collaboratorName || 'curator'}`}
                            >
                              <Users className="w-3 h-3 stroke-[2.5]" />
                              <span className="truncate max-w-[120px]">
                                {playlist.collaboratorName ? `Curated with ${playlist.collaboratorName}` : 'Collaborative'}
                              </span>
                            </div>
                          )}
                        </div>
                      </article>
                    )}
                  </Focusable>
                );
              })}
            </div>
          </section>
        )
      )}

      {/* =========================================================================
          TAB 4: AUDIOBOOKS (Aligned to 8-Column Benchmark Grid Density)
         ========================================================================= */}
      {activeTab === 'audiobooks' && (
        audiobooks.length === 0 ? (
          <section className="w-full" aria-label="Audiobooks Empty Grid">
            <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-surface-container-low/60 border border-white/[0.04] text-center gap-4 my-8">
              <BookOpen className="w-12 h-12 text-outline" />
              <h2 className="text-xl font-bold text-on-surface">No Audiobooks Found</h2>
              <p className="text-sm text-on-surface-variant max-w-md">
                No audiobooks are available on your Sonzra server.
              </p>
            </div>
          </section>
        ) : (
          <section className="w-full flex flex-col gap-6" aria-label="Audiobooks Grid">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3.5 w-full">
              {audiobooks.map((book) => {
                const focusId = `library-audiobook-${book.id}`;
                const hasProgress = (book.progressPercent || 0) > 0;
                return (
                  <Focusable
                    key={book.id}
                    focusId={focusId}
                    group="library-grid"
                    className="rounded-xl cursor-pointer"
                    onEnter={() => setSelectedAudiobook(book)}
                    onClick={() => setSelectedAudiobook(book)}
                  >
                    {({ isFocused }) => (
                      <article
                        className={`group relative flex flex-col rounded-xl p-2.5 cursor-pointer h-full ${
                          isFocused ? 'bg-surface-container-high z-10' : 'bg-surface-container-low hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-container-lowest mb-2 shadow-md">
                          <img
                            alt={book.title}
                            className="w-full h-full object-cover"
                            src={book.artworkUrl}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                            }}
                          />

                          {/* Progress Bar Badge */}
                          {hasProgress && (
                            <div className="absolute bottom-0 inset-x-0 bg-surface-container-lowest/90 p-1.5 backdrop-blur-md">
                              <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                                <div
                                  className="bg-secondary h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(book.progressPercent || 0, 100)}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center text-[9px] font-mono text-secondary mt-0.5 font-bold">
                                <span>{book.progressPercent}% DONE</span>
                                <span>{formatDuration(book.playbackPositionSeconds)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="relative flex flex-col pt-0.5 px-0.5 min-w-0">
                          <h2
                            className={`text-[15px] font-bold leading-tight truncate transition-colors ${
                              isFocused ? 'text-secondary' : 'text-on-surface'
                            }`}
                          >
                            {book.title}
                          </h2>
                          <p className="text-[12px] text-on-surface-variant truncate mt-0.5">{book.author}</p>
                          <div className="flex items-center justify-between text-outline text-[11px] font-mono mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(book.duration)}
                            </span>
                            <span className="text-secondary font-bold">
                              {book.chapters?.length || 0} Ch
                            </span>
                          </div>
                        </div>
                      </article>
                    )}
                  </Focusable>
                );
              })}
            </div>

            {/* Chapter Navigation Modal / Overlay */}
            {selectedAudiobook && (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-8">
                <div className="w-full max-w-3xl rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-hidden">
                  <div className="flex items-start justify-between border-b border-white/[0.06] pb-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedAudiobook.artworkUrl}
                        alt={selectedAudiobook.title}
                        className="w-16 h-20 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                        }}
                      />
                      <div>
                        <h3 className="text-xl font-bold text-on-surface">{selectedAudiobook.title}</h3>
                        <p className="text-sm text-outline">{selectedAudiobook.author} • Chapter Navigation</p>
                      </div>
                    </div>
                    <Focusable
                      focusId="audiobook-modal-close"
                      group="chapter-list"
                      className="rounded-full p-2"
                      onEnter={() => setSelectedAudiobook(null)}
                      onClick={() => setSelectedAudiobook(null)}
                    >
                      {({ isFocused }) => (
                        <button
                          className={`p-2 rounded-full cursor-pointer transition-all ${
                            isFocused ? 'bg-secondary text-surface-container-lowest' : 'bg-surface-container-high text-on-surface'
                          }`}
                          title="Close Chapter Menu"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </Focusable>
                  </div>

                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[55vh] pr-2">
                    {(selectedAudiobook.chapters || []).map((chapter, idx) => {
                      const focusId = `audiobook-chapter-${chapter.id}`;
                      return (
                        <Focusable
                          key={chapter.id}
                          focusId={focusId}
                          group="chapter-list"
                          className="rounded-xl cursor-pointer"
                          onEnter={() => handlePlayAudiobookChapter(selectedAudiobook, chapter)}
                          onClick={() => handlePlayAudiobookChapter(selectedAudiobook, chapter)}
                        >
                          {({ isFocused }) => (
                            <div
                              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${
                                isFocused
                                  ? 'bg-surface-container-high ring-2 ring-secondary shadow-[0_0_15px_rgba(73,220,202,0.4)]'
                                  : 'bg-surface-container-high/40 hover:bg-surface-container-high'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 text-center font-mono text-xs text-outline font-bold">
                                  {idx + 1}
                                </span>
                                <span className={`text-[14px] font-bold ${isFocused ? 'text-secondary' : 'text-on-surface'}`}>
                                  {chapter.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-mono text-outline">
                                <span>Start: {formatDuration(chapter.startPositionSeconds)}</span>
                                <span>Len: {formatDuration(chapter.duration)}</span>
                              </div>
                            </div>
                          )}
                        </Focusable>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        )
      )}

      {/* =========================================================================
          TAB 5: PODCASTS (Aligned to 8-Column Benchmark Grid Density)
         ========================================================================= */}
      {activeTab === 'podcasts' && (
        podcasts.length === 0 ? (
          <section className="w-full" aria-label="Podcasts Empty Grid">
            <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-surface-container-low/60 border border-white/[0.04] text-center gap-4 my-8">
              <Radio className="w-12 h-12 text-outline" />
              <h2 className="text-xl font-bold text-on-surface">No Podcasts Found</h2>
              <p className="text-sm text-on-surface-variant max-w-md">
                No podcasts are available on your Sonzra server.
              </p>
            </div>
          </section>
        ) : (
          <section className="w-full flex flex-col gap-6" aria-label="Podcasts Grid">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3.5 w-full">
              {podcasts.map((show) => {
                const focusId = `library-podcast-${show.id}`;
                return (
                  <Focusable
                    key={show.id}
                    focusId={focusId}
                    group="library-grid"
                    className="rounded-xl cursor-pointer"
                    onEnter={() => setSelectedPodcast(show)}
                    onClick={() => setSelectedPodcast(show)}
                  >
                    {({ isFocused }) => (
                      <article
                        className={`group relative flex flex-col rounded-xl p-2.5 cursor-pointer h-full ${
                          isFocused ? 'bg-surface-container-high z-10' : 'bg-surface-container-low hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-container-lowest mb-2 shadow-md">
                          <img
                            alt={show.title}
                            className="w-full h-full object-cover"
                            src={show.artworkUrl}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                            }}
                          />
                        </div>
                        <div className="relative flex flex-col pt-0.5 px-0.5 min-w-0">
                          <h2
                            className={`text-[15px] font-bold leading-tight truncate transition-colors ${
                              isFocused ? 'text-secondary' : 'text-on-surface'
                            }`}
                          >
                            {show.title}
                          </h2>
                          <p className="text-[12px] text-on-surface-variant truncate mt-0.5">{show.author}</p>
                          <span className="text-[11px] font-mono text-secondary font-bold mt-0.5">
                            {show.episodeCount || show.episodes?.length || 0} Episodes
                          </span>
                        </div>
                      </article>
                    )}
                  </Focusable>
                );
              })}
            </div>

            {/* Podcast Episode Drawer / Modal */}
            {selectedPodcast && (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-8">
                <div className="w-full max-w-3xl rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-2xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-hidden">
                  <div className="flex items-start justify-between border-b border-white/[0.06] pb-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedPodcast.artworkUrl}
                        alt={selectedPodcast.title}
                        className="w-16 h-16 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                        }}
                      />
                      <div>
                        <h3 className="text-xl font-bold text-on-surface">{selectedPodcast.title}</h3>
                        <p className="text-sm text-outline">{selectedPodcast.author} • Episode Catalog</p>
                      </div>
                    </div>
                    <Focusable
                      focusId="podcast-modal-close"
                      group="podcast-episodes"
                      className="rounded-full p-2"
                      onEnter={() => setSelectedPodcast(null)}
                      onClick={() => setSelectedPodcast(null)}
                    >
                      {({ isFocused }) => (
                        <button
                          className={`p-2 rounded-full cursor-pointer transition-all ${
                            isFocused ? 'bg-secondary text-surface-container-lowest' : 'bg-surface-container-high text-on-surface'
                          }`}
                          title="Close Podcast Menu"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </Focusable>
                  </div>

                  <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[55vh] pr-2">
                    {(selectedPodcast.episodes || []).map((episode) => {
                      const focusId = `podcast-ep-${episode.id}`;
                      return (
                        <Focusable
                          key={episode.id}
                          focusId={focusId}
                          group="podcast-episodes"
                          className="rounded-xl cursor-pointer"
                          onEnter={() => handlePlayPodcastEpisode(selectedPodcast, episode)}
                          onClick={() => handlePlayPodcastEpisode(selectedPodcast, episode)}
                        >
                          {({ isFocused }) => (
                            <div
                              className={`flex flex-col gap-1 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                                isFocused
                                  ? 'bg-surface-container-high ring-2 ring-secondary shadow-[0_0_15px_rgba(73,220,202,0.4)]'
                                  : 'bg-surface-container-high/40 hover:bg-surface-container-high'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <h4 className={`text-[14px] font-bold ${isFocused ? 'text-secondary' : 'text-on-surface'}`}>
                                  {episode.title}
                                </h4>
                                <span className="text-xs font-mono text-outline">{formatDuration(episode.duration)}</span>
                              </div>
                              {episode.description && (
                                <p className="text-xs text-on-surface-variant line-clamp-2">{episode.description}</p>
                              )}
                              {episode.publishDate && (
                                <span className="text-[11px] font-mono text-outline/80 mt-0.5">Published {episode.publishDate}</span>
                              )}
                            </div>
                          )}
                        </Focusable>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        )
      )}
    </div>
  );
};
