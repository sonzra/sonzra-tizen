import React, { useEffect, useState } from 'react';
import {
  Disc,
  ArrowLeft,
  Music,
  Clock,
  Play,
  Shuffle,
  ListPlus,
  ListMusic,
  Heart,
  Radio,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { usePlayer } from '../context/PlayerContext';
import { Album, Track } from '../types/music';
import { Focusable } from '../navigation/Focusable';
import { showOsdToast } from '../components/MediaOsdToast';

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const AlbumDetailView: React.FC = () => {
  const { viewParam, goToView, setFocus } = useSpatialNav();
  const { apiClient } = useServer();
  const { playAlbum, playTrack, playNext, addToQueue, currentTrack, playbackStatus, startRadio } = usePlayer();

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [trackFavorites, setTrackFavorites] = useState<Record<string, boolean>>({});
  const [selectedTrackForModal, setSelectedTrackForModal] = useState<Track | null>(null);

  useEffect(() => {
    let active = true;
    const albumId = viewParam;

    if (!albumId) {
      setAlbum(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    apiClient
      .fetchAlbum(albumId)
      .then((res) => {
        if (active) {
          setAlbum(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setAlbum(null);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [viewParam, apiClient]);

  useEffect(() => {
    if (!selectedTrackForModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Tizen Back key is 10009, Escape is 'Escape'
      if (e.key === 'Escape' || e.keyCode === 10009) {
        e.stopPropagation();
        e.preventDefault();
        const closedTrack = selectedTrackForModal;
        setSelectedTrackForModal(null);
        if (closedTrack) {
          setTimeout(() => setFocus(`track-action-menu-${closedTrack.id}`), 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [selectedTrackForModal, setFocus]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-on-surface">
        <div className="w-12 h-12 rounded-full border-2 border-secondary border-t-transparent animate-spin mb-4" />
        <p className="text-on-surface-variant font-mono">Loading Album Details...</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center gap-6 my-12">
        <Disc className="w-16 h-16 text-outline" />
        <h2 className="text-2xl font-bold text-on-surface">Album Not Found</h2>
        <p className="text-on-surface-variant max-w-md text-sm">
          The requested album could not be loaded from your Sonzra server.
        </p>
        <Focusable
          focusId="album-detail-back-btn"
          group="album-detail-actions"
          className="rounded-full cursor-pointer"
          onEnter={() => goToView('library')}
          onClick={() => goToView('library')}
        >
          {({ isFocused }) => (
            <button
              className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 cursor-pointer transition-all ${
                isFocused
                  ? 'bg-secondary text-on-secondary shadow-[0_0_24px_rgba(73,220,202,0.6)]'
                  : 'bg-surface-container-high text-on-surface'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              Return to Library
            </button>
          )}
        </Focusable>
      </div>
    );
  }

  const tracks: Track[] = album.tracks || [];
  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0) || album.duration || 3360;

  const handlePlayAlbum = (shuffle = false) => {
    playAlbum(album, undefined, shuffle);
  };

  const handleAddQueue = () => {
    if (tracks.length > 0) {
      addToQueue(tracks, { albumTitle: album.title });
    }
  };

  const handlePlaySingleTrack = (track: Track) => {
    playTrack(track);
    showOsdToast({
      label: 'PLAYING',
      title: track.title,
      icon: 'play',
    });
  };

  const handlePlayNext = (track: Track) => {
    playNext(track);
    showOsdToast({
      label: 'PLAYING NEXT',
      title: track.title,
      icon: 'play-next',
    });
  };

  const handleAddTrackToQueue = (track: Track) => {
    addToQueue(track);
  };

  const handleToggleTrackFavorite = async (track: Track) => {
    const currentFav = trackFavorites[track.id] ?? !!track.isFavorite;
    const newFav = !currentFav;
    setTrackFavorites((prev) => ({ ...prev, [track.id]: newFav }));
    showOsdToast({
      label: newFav ? 'FAVORITED' : 'REMOVED FAVORITE',
      title: track.title,
      icon: 'heart',
    });
    try {
      const res = await apiClient.toggleFavorite(track.id, newFav);
      setTrackFavorites((prev) => ({ ...prev, [track.id]: res }));
    } catch (err) {
      console.warn('Failed to toggle track favorite:', err);
    }
  };

  const handleToggleAlbumFavorite = async () => {
    const newFav = !isFavorite;
    setIsFavorite(newFav);
    showOsdToast({
      label: newFav ? 'FAVORITED ALBUM' : 'REMOVED FAVORITE',
      title: album.title,
      icon: 'heart',
    });
    try {
      const res = await apiClient.toggleFavorite(album.id, newFav);
      setIsFavorite(res);
    } catch (err) {
      console.warn('Failed to toggle album favorite:', err);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col pb-28">
      {/* TV Main Widescreen Landscape 2-Column Split */}
      <main className="flex-1 grid grid-cols-12 gap-8 items-start pt-2">
        {/* LEFT COLUMN: Clean Album Sleeve & Album Meta & Action Buttons */}
        <section className="col-span-12 lg:col-span-5 flex flex-col justify-start gap-5 pr-2">
          {/* Clean Album Sleeve Stage */}
          <div className="relative w-full max-w-[360px] aspect-square rounded-2xl overflow-hidden shadow-2xl bg-surface-container-high border border-white/10">
            <img
              src={album.artworkUrl}
              alt={album.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = './sonzra-mark.svg';
              }}
            />
          </div>

          {/* Album Metadata */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              {album.codecBadge && (
                <span className="px-2.5 py-0.5 rounded bg-surface-container-highest text-secondary text-xs font-mono font-bold tracking-wider uppercase border border-secondary/30">
                  {album.codecBadge}
                </span>
              )}
              {album.year && (
                <span className="text-xs text-on-surface-variant font-mono">{album.year}</span>
              )}
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold text-on-surface tracking-tight font-serif-title drop-shadow-md">
              {album.title}
            </h1>

            <div className="flex items-center gap-2 text-base">
              <span className="font-bold text-surface-tint">{album.artist}</span>
              {album.genre && (
                <>
                  <span className="text-outline">•</span>
                  <span className="text-sm font-medium text-outline">{album.genre}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-on-surface-variant font-medium mt-0.5">
              <span className="flex items-center gap-1.5">
                <Music className="w-4 h-4 text-secondary" />
                {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
              </span>
              {totalDuration > 0 && (
                <>
                  <span className="text-outline-variant">•</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    {Math.round(totalDuration / 60)} minutes
                  </span>
                </>
              )}
            </div>
          </div>

          {/* TV Focus Action Control Bar */}
          <div className="flex items-center gap-3.5 mt-2">
            {/* Play Album */}
            <Focusable
              focusId="album-btn-play"
              group="album-actions"
              autoFocus={true}
              className="rounded-full cursor-pointer"
              onEnter={() => handlePlayAlbum(false)}
              onClick={() => handlePlayAlbum(false)}
            >
              {({ isFocused }) => (
                <button
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-base font-bold cursor-pointer ${
                    isFocused
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-primary-container text-on-primary-container shadow-md hover:bg-tertiary-container'
                  }`}
                >
                  <Play className="w-6 h-6 fill-current" />
                  <span>Play Album</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-black/30 text-[10px] font-mono uppercase">
                    SELECT
                  </span>
                </button>
              )}
            </Focusable>

            {/* Shuffle */}
            <Focusable
              focusId="album-btn-shuffle"
              group="album-actions"
              className="rounded-full cursor-pointer"
              onEnter={() => handlePlayAlbum(true)}
              onClick={() => handlePlayAlbum(true)}
            >
              {({ isFocused }) => (
                <button
                  className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer shadow-md ${
                    isFocused
                      ? 'bg-surface-container-high text-secondary ring-2 ring-secondary'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-bright border border-white/5'
                  }`}
                  title="Shuffle Album"
                >
                  <Shuffle className="w-5 h-5" />
                </button>
              )}
            </Focusable>

            {/* Start Radio */}
            <Focusable
              focusId="album-btn-radio"
              group="album-actions"
              className="rounded-full cursor-pointer"
              onEnter={() => startRadio(album)}
              onClick={() => startRadio(album)}
            >
              {({ isFocused }) => (
                <button
                  className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer shadow-md ${
                    isFocused
                      ? 'bg-surface-container-high text-secondary ring-2 ring-secondary'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-bright border border-white/5'
                  }`}
                  title="Start Radio"
                >
                  <Radio className="w-5 h-5" />
                </button>
              )}
            </Focusable>

            {/* Add to Queue */}
            <Focusable
              focusId="album-btn-queue"
              group="album-actions"
              className="rounded-full cursor-pointer"
              onEnter={handleAddQueue}
              onClick={handleAddQueue}
            >
              {({ isFocused }) => (
                <button
                  className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer shadow-md ${
                    isFocused
                      ? 'bg-surface-container-high text-secondary'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-bright border border-white/5'
                  }`}
                  title="Add to Queue"
                >
                  <ListPlus className="w-5 h-5" />
                </button>
              )}
            </Focusable>

            {/* Add to Favorites */}
            <Focusable
              focusId="album-btn-fav"
              group="album-actions"
              className="rounded-full cursor-pointer"
              onEnter={handleToggleAlbumFavorite}
              onClick={handleToggleAlbumFavorite}
            >
              {({ isFocused }) => (
                <button
                  className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer shadow-md ${
                    isFocused
                      ? 'bg-surface-container-high text-error'
                      : isFavorite
                      ? 'bg-surface-container-high text-error border border-white/5'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-bright border border-white/5'
                  }`}
                  title="Favorite Album"
                >
                  <Heart
                    className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`}
                  />
                </button>
              )}
            </Focusable>
          </div>
        </section>

        {/* RIGHT COLUMN: Expansive Widescreen 10-foot Tracklist Table */}
        <section className="col-span-12 lg:col-span-7 flex flex-col justify-start pl-2">
          {/* Table Column Headers */}
          <div className="flex items-center justify-between pb-2.5 px-4 text-outline font-semibold uppercase tracking-wider text-[11px] border-b border-white/[0.06] shrink-0 mb-2">
            <div className="flex items-center gap-4">
              <span className="w-8 text-center">#</span>
              <span>Title &amp; Artist</span>
            </div>
            <div className="flex items-center gap-12">
              <span>Fidelity</span>
              <span className="w-16 text-right">Time</span>
            </div>
          </div>

          {/* TV Interactive Track Rows Container */}
          <div className="flex flex-col gap-2 w-full" role="list">
            {tracks.map((track, index) => {
              const isPlayingThisTrack = currentTrack?.id === track.id && playbackStatus === 'playing';
              const isCurrentTrack = currentTrack?.id === track.id;
              const focusId = `track-row-${track.id}`;
              const isFav = trackFavorites[track.id] ?? !!track.isFavorite;

              return (
                <div key={track.id} className="w-full flex items-center gap-2">
                  <Focusable
                    focusId={focusId}
                    group="album-tracks"
                    className="flex-1 min-w-0 rounded-2xl cursor-pointer"
                    rightId={`track-action-play-next-${track.id}`}
                    upId={index > 0 ? `track-row-${tracks[index - 1].id}` : 'album-btn-play'}
                    downId={index < tracks.length - 1 ? `track-row-${tracks[index + 1].id}` : 'dock-btn-play'}
                    onEnter={() => handlePlaySingleTrack(track)}
                  >
                    {({ isFocused }) => (
                      <div
                        className={`group w-full flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer ${
                          isFocused
                            ? 'bg-surface-container-high text-on-surface ring-2 ring-secondary shadow-[0_0_24px_rgba(73,220,202,0.4)] scale-[1.01] z-10'
                            : isCurrentTrack
                            ? 'bg-surface-container-high/90 text-on-surface border border-secondary/30'
                            : 'bg-surface-container-low/70 hover:bg-surface-container text-on-surface border border-transparent hover:border-white/10'
                        }`}
                        role="listitem"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {isPlayingThisTrack ? (
                            /* Animated Equalizer Bars */
                            <div className="w-8 flex items-end justify-center gap-1 h-5">
                              <span className="w-1 bg-secondary rounded-full animate-bounce h-full shadow-[0_0_8px_rgba(73,220,202,0.8)]"></span>
                              <span className="w-1 bg-secondary rounded-full animate-bounce [animation-delay:150ms] h-4/5 shadow-[0_0_8px_rgba(73,220,202,0.8)]"></span>
                              <span className="w-1 bg-secondary rounded-full animate-bounce [animation-delay:300ms] h-full shadow-[0_0_8px_rgba(73,220,202,0.8)]"></span>
                              <span className="w-1 bg-secondary rounded-full animate-bounce [animation-delay:75ms] h-3/5 shadow-[0_0_8px_rgba(73,220,202,0.8)]"></span>
                            </div>
                          ) : (
                            <span className="w-8 text-center font-mono font-bold text-outline group-hover:text-on-surface text-sm">
                              {String(track.trackNumber || index + 1).padStart(2, '0')}
                            </span>
                          )}

                          <div className="flex flex-col min-w-0">
                            <span
                              className={`text-base font-bold truncate flex items-center gap-2 ${
                                isCurrentTrack ? 'text-secondary' : 'text-on-surface'
                              }`}
                            >
                              {track.title}
                              {isCurrentTrack && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 text-secondary border border-secondary/40">
                                  NOW PLAYING
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-on-surface-variant truncate">{track.artist}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 pr-1">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                              isCurrentTrack
                                ? 'bg-secondary-container/20 text-secondary font-bold border border-secondary/30'
                                : 'bg-surface-container text-outline'
                            }`}
                          >
                            {track.fidelity || '96k / 24-bit'}
                          </span>
                          <span
                            className={`w-14 text-right font-mono text-sm ${
                              isCurrentTrack ? 'text-secondary font-bold' : 'text-on-surface-variant'
                            }`}
                          >
                            {formatDuration(track.duration)}
                          </span>
                        </div>
                      </div>
                    )}
                  </Focusable>

                  {/* Contextual Track Actions Cluster */}
                  <div className="flex items-center gap-1.5 shrink-0" role="toolbar" aria-label="Track actions">
                    {/* Play Next */}
                    <Focusable
                      focusId={`track-action-play-next-${track.id}`}
                      group="album-tracks"
                      className="rounded-xl cursor-pointer"
                      leftId={`track-row-${track.id}`}
                      rightId={`track-action-add-queue-${track.id}`}
                      upId={index > 0 ? `track-action-play-next-${tracks[index - 1].id}` : 'album-btn-play'}
                      downId={index < tracks.length - 1 ? `track-action-play-next-${tracks[index + 1].id}` : 'dock-btn-play'}
                      onEnter={() => handlePlayNext(track)}
                    >
                      {({ isFocused }) => (
                        <button
                          type="button"
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            isFocused
                              ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_15px_rgba(73,220,202,0.5)] scale-105'
                              : 'bg-surface-container-low/70 hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                          }`}
                          title="Play Next"
                          aria-label={`Play ${track.title} Next`}
                        >
                          <ListPlus className="w-4 h-4" />
                        </button>
                      )}
                    </Focusable>

                    {/* Add to Queue */}
                    <Focusable
                      focusId={`track-action-add-queue-${track.id}`}
                      group="album-tracks"
                      className="rounded-xl cursor-pointer"
                      leftId={`track-action-play-next-${track.id}`}
                      rightId={`track-action-fav-${track.id}`}
                      upId={index > 0 ? `track-action-add-queue-${tracks[index - 1].id}` : 'album-btn-play'}
                      downId={index < tracks.length - 1 ? `track-action-add-queue-${tracks[index + 1].id}` : 'dock-btn-play'}
                      onEnter={() => handleAddTrackToQueue(track)}
                    >
                      {({ isFocused }) => (
                        <button
                          type="button"
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            isFocused
                              ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_15px_rgba(73,220,202,0.5)] scale-105'
                              : 'bg-surface-container-low/70 hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                          }`}
                          title="Add to Queue"
                          aria-label={`Add ${track.title} to Queue`}
                        >
                          <ListMusic className="w-4 h-4" />
                        </button>
                      )}
                    </Focusable>

                    {/* Favorite */}
                    <Focusable
                      focusId={`track-action-fav-${track.id}`}
                      group="album-tracks"
                      className="rounded-xl cursor-pointer"
                      leftId={`track-action-add-queue-${track.id}`}
                      rightId={`track-action-menu-${track.id}`}
                      upId={index > 0 ? `track-action-fav-${tracks[index - 1].id}` : 'album-btn-play'}
                      downId={index < tracks.length - 1 ? `track-action-fav-${tracks[index + 1].id}` : 'dock-btn-play'}
                      onEnter={() => handleToggleTrackFavorite(track)}
                    >
                      {({ isFocused }) => (
                        <button
                          type="button"
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            isFocused
                              ? 'bg-surface-container-high text-error ring-2 ring-secondary shadow-[0_0_15px_rgba(73,220,202,0.5)] scale-105'
                              : isFav
                              ? 'bg-surface-container-low/70 text-error'
                              : 'bg-surface-container-low/70 hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                          }`}
                          title={isFav ? 'Favorited' : 'Favorite'}
                          aria-label={`Favorite ${track.title}`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      )}
                    </Focusable>

                    {/* More / Menu */}
                    <Focusable
                      focusId={`track-action-menu-${track.id}`}
                      group="album-tracks"
                      className="rounded-xl cursor-pointer"
                      leftId={`track-action-fav-${track.id}`}
                      upId={index > 0 ? `track-action-menu-${tracks[index - 1].id}` : 'album-btn-play'}
                      downId={index < tracks.length - 1 ? `track-action-menu-${tracks[index + 1].id}` : 'dock-btn-play'}
                      onEnter={() => setSelectedTrackForModal(track)}
                    >
                      {({ isFocused }) => (
                        <button
                          type="button"
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            isFocused
                              ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_15px_rgba(73,220,202,0.5)] scale-105'
                              : 'bg-surface-container-low/70 hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                          }`}
                          title="More Track Actions"
                          aria-label={`More actions for ${track.title}`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      )}
                    </Focusable>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Contextual Track Action Modal */}
      {selectedTrackForModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Track Actions Menu"
        >
          <div className="w-full max-w-lg rounded-3xl bg-surface-container-low border border-white/10 shadow-2xl p-6 flex flex-col gap-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high overflow-hidden shrink-0">
                  <img
                    src={selectedTrackForModal.artworkUrl || album.artworkUrl}
                    alt={selectedTrackForModal.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                    }}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-lg font-bold text-on-surface truncate">
                    {selectedTrackForModal.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant truncate">
                    {selectedTrackForModal.artist} • {formatDuration(selectedTrackForModal.duration)}
                  </p>
                </div>
              </div>

              <Focusable
                focusId="track-modal-close"
                group="track-actions-modal"
                className="rounded-full"
                upId="track-modal-fav"
                downId="track-modal-play"
                onEnter={() => {
                  const closed = selectedTrackForModal;
                  setSelectedTrackForModal(null);
                  if (closed) {
                    setTimeout(() => setFocus(`track-action-menu-${closed.id}`), 0);
                  }
                }}
                onClick={() => {
                  const closed = selectedTrackForModal;
                  setSelectedTrackForModal(null);
                  if (closed) {
                    setTimeout(() => setFocus(`track-action-menu-${closed.id}`), 0);
                  }
                }}
              >
                {({ isFocused }) => (
                  <button
                    type="button"
                    className={`p-2 rounded-full cursor-pointer transition-all ${
                      isFocused
                        ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary'
                        : 'bg-surface-container-high text-on-surface'
                    }`}
                    title="Close Menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </Focusable>
            </div>

            {/* Modal Actions List */}
            <div className="flex flex-col gap-2.5">
              {/* Play Now */}
              <Focusable
                focusId="track-modal-play"
                group="track-actions-modal"
                autoFocus={true}
                className="rounded-xl cursor-pointer"
                upId="track-modal-close"
                downId="track-modal-play-next"
                onEnter={() => {
                  handlePlaySingleTrack(selectedTrackForModal);
                  setSelectedTrackForModal(null);
                }}
              >
                {({ isFocused }) => (
                  <div
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                      isFocused
                        ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_18px_rgba(73,220,202,0.5)] font-bold'
                        : 'bg-surface-container-high/60 text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span className="text-[15px]">Play Track</span>
                  </div>
                )}
              </Focusable>

              {/* Play Next */}
              <Focusable
                focusId="track-modal-play-next"
                group="track-actions-modal"
                className="rounded-xl cursor-pointer"
                upId="track-modal-play"
                downId="track-modal-add-queue"
                onEnter={() => {
                  handlePlayNext(selectedTrackForModal);
                  setSelectedTrackForModal(null);
                }}
              >
                {({ isFocused }) => (
                  <div
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                      isFocused
                        ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_18px_rgba(73,220,202,0.5)] font-bold'
                        : 'bg-surface-container-high/60 text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <ListPlus className="w-5 h-5" />
                    <span className="text-[15px]">Play Next</span>
                  </div>
                )}
              </Focusable>

              {/* Add to Queue */}
              <Focusable
                focusId="track-modal-add-queue"
                group="track-actions-modal"
                className="rounded-xl cursor-pointer"
                upId="track-modal-play-next"
                downId="track-modal-fav"
                onEnter={() => {
                  handleAddTrackToQueue(selectedTrackForModal);
                  setSelectedTrackForModal(null);
                }}
              >
                {({ isFocused }) => (
                  <div
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                      isFocused
                        ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_18px_rgba(73,220,202,0.5)] font-bold'
                        : 'bg-surface-container-high/60 text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <ListMusic className="w-5 h-5" />
                    <span className="text-[15px]">Add to Queue</span>
                  </div>
                )}
              </Focusable>

              {/* Favorite */}
              <Focusable
                focusId="track-modal-fav"
                group="track-actions-modal"
                className="rounded-xl cursor-pointer"
                upId="track-modal-add-queue"
                downId="track-modal-close"
                onEnter={() => {
                  handleToggleTrackFavorite(selectedTrackForModal);
                }}
              >
                {({ isFocused }) => {
                  const isFav = trackFavorites[selectedTrackForModal.id] ?? !!selectedTrackForModal.isFavorite;
                  return (
                    <div
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                        isFocused
                          ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_18px_rgba(73,220,202,0.5)] font-bold'
                          : 'bg-surface-container-high/60 text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isFav ? 'fill-current text-error' : ''}`} />
                      <span className="text-[15px]">{isFav ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                    </div>
                  );
                }}
              </Focusable>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
