import React, { useEffect, useState } from 'react';
import { useServer } from '../context/ServerContext';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { usePlayer } from '../context/PlayerContext';
import { Album, Track } from '../types/music';
import { Focusable } from '../navigation/Focusable';

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const AlbumDetailView: React.FC = () => {
  const { viewParam, goToView } = useSpatialNav();
  const { apiClient } = useServer();
  const { playAlbum, playTrack, addToQueue, currentTrack, playbackStatus, startRadio } = usePlayer();

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

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
        <span className="material-symbols-outlined text-[64px] text-outline">album</span>
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
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
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
      addToQueue(tracks);
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
                <span className="material-symbols-outlined text-[18px] text-secondary">library_music</span>
                {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
              </span>
              {totalDuration > 0 && (
                <>
                  <span className="text-outline-variant">•</span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
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
                  <span className="material-symbols-outlined text-[26px]">play_arrow</span>
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
                  <span className="material-symbols-outlined text-[24px]">shuffle</span>
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
                  <span className="material-symbols-outlined text-[24px]">radio</span>
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
                  <span className="material-symbols-outlined text-[24px]">playlist_add</span>
                </button>
              )}
            </Focusable>

            {/* Add to Favorites */}
            <Focusable
              focusId="album-btn-fav"
              group="album-actions"
              className="rounded-full cursor-pointer"
              onEnter={() => setIsFavorite(!isFavorite)}
              onClick={() => setIsFavorite(!isFavorite)}
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
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: isFavorite ? '"FILL" 1' : undefined }}
                  >
                    {isFavorite ? 'favorite' : 'favorite_border'}
                  </span>
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

              return (
                <Focusable
                  key={track.id}
                  focusId={focusId}
                  group="album-tracks"
                  className="rounded-2xl cursor-pointer"
                  onEnter={() => playTrack(track, tracks)}
                  onClick={() => playTrack(track, tracks)}
                >
                  {({ isFocused }) => (
                    <div
                      className={`group w-full flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer ${
                        isFocused
                          ? 'bg-surface-container-high text-on-surface z-10'
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

                      <div className="flex items-center gap-12 shrink-0">
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
                          className={`w-16 text-right font-mono text-sm ${
                            isCurrentTrack ? 'text-secondary font-bold' : 'text-on-surface-variant'
                          }`}
                        >
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    </div>
                  )}
                </Focusable>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};
