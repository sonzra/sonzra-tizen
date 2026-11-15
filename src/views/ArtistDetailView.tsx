import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Play, Radio, Disc, Music, Users } from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { usePlayer } from '../context/PlayerContext';
import { Artist } from '../types/music';
import { Focusable } from '../navigation/Focusable';

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const ArtistDetailView: React.FC = () => {
  const { viewParam, goBack, openAlbum, setFocus } = useSpatialNav();
  const { apiClient } = useServer();
  const { playTracks, currentTrack, playbackStatus, startRadio, toggleRadio } = usePlayer();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const initialFocusRef = useRef(false);
  // Automatically anchor focus on primary action button once artist loads
  useEffect(() => {
    if (!initialFocusRef.current && artist) {
      initialFocusRef.current = true;
      setFocus('artist-btn-play-top');
    }
  }, [artist, setFocus]);

  useEffect(() => {
    let active = true;
    if (viewParam) {
      setLoading(true);
      apiClient
        .fetchArtist(viewParam)
        .then((res) => {
          if (active) {
            setArtist(res);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) {
            setArtist(null);
            setLoading(false);
          }
        });
    } else {
      setArtist(null);
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [viewParam, apiClient]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-on-surface">
        <div className="w-12 h-12 rounded-full border-2 border-secondary border-t-transparent animate-spin mb-4" />
        <p className="text-on-surface-variant font-mono">Loading Artist Details...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center gap-6 my-12">
        <Users className="w-16 h-16 text-outline" />
        <h2 className="text-2xl font-bold text-on-surface">Artist Not Found</h2>
        <p className="text-on-surface-variant max-w-md text-sm">
          The requested artist could not be loaded from your Sonzra server.
        </p>
        <Focusable
          focusId="artist-detail-notfound-back"
          group="artist-hero"
          className="rounded-full cursor-pointer"
          onEnter={goBack}
          onClick={goBack}
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
              Return to Artists
            </button>
          )}
        </Focusable>
      </div>
    );
  }

  const topSongs = artist.topTracks || [];
  const albums = artist.albums || [];

  const handlePlayArtist = () => {
    if (topSongs.length > 0) {
      playTracks(topSongs);
    } else if (albums.length > 0) {
      openAlbum(albums[0].id);
    }
  };

  const handleStartRadio = () => {
    if (topSongs.length > 0) {
      startRadio(topSongs[0]);
    } else if (albums.length > 0) {
      startRadio(albums[0]);
    } else {
      toggleRadio();
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col pb-32" role="main">
      {/* Top Navigation */}
      <div className="flex items-center gap-4 mb-6 pt-2">
        <Focusable
          focusId="artist-detail-back"
          group="artist-hero"
          className="rounded-full cursor-pointer"
          onEnter={goBack}
          onClick={goBack}
        >
          {({ isFocused }) => (
            <button
              className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors ${
                isFocused
                  ? 'bg-secondary text-on-secondary shadow-[0_0_24px_rgba(73,220,202,0.6)]'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-bright border border-white/5'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Artists</span>
            </button>
          )}
        </Focusable>
      </div>

      {/* High-Fidelity Artist Hero Banner */}
      <section
        className="relative w-full rounded-3xl bg-gradient-to-r from-surface-container-lowest via-surface-container-low to-surface-container/60 p-8 sm:p-10 overflow-hidden shadow-2xl mb-10 border border-white/[0.05]"
        aria-label="Artist Information"
      >
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-10 relative z-10">
          {/* Avatar with Circular Border Glow */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] bg-surface-container-high border-2 border-white/10 ring-4 ring-secondary/20 shrink-0">
            <img
              src={artist.artworkUrl}
              alt={artist.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = './sonzra-mark.svg';
              }}
            />
          </div>

          {/* Artist Metadata & Playback Action Buttons */}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
              <span className="px-3 py-0.5 rounded-full bg-secondary/15 text-secondary text-xs font-mono font-bold tracking-wider uppercase border border-secondary/30">
                ARTIST
              </span>
              {artist.genre && (
                <span className="text-xs text-on-surface-variant font-mono font-medium">
                  • {artist.genre}
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-on-surface tracking-tight font-serif-title drop-shadow-md mb-3 leading-tight">
              {artist.name}
            </h1>

            {artist.bio && (
              <p className="text-sm sm:text-base text-on-surface-variant/90 max-w-3xl line-clamp-3 leading-relaxed mb-4 font-sans">
                {artist.bio}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs font-mono text-on-surface-variant font-medium mb-6">
              <span className="flex items-center gap-1.5">
                <Disc className="w-4 h-4 text-secondary" />
                {albums.length} {albums.length === 1 ? 'Release' : 'Releases'}
              </span>
              <span className="text-outline-variant">•</span>
              <span className="flex items-center gap-1.5">
                <Music className="w-4 h-4 text-primary" />
                {topSongs.length} Popular Tracks
              </span>
            </div>

            {/* TV Focus Action Buttons */}
            <div className="flex items-center gap-4 flex-wrap">
              <Focusable
                focusId="artist-btn-play-top"
                group="artist-actions"
                autoFocus={true}
                className="rounded-full cursor-pointer"
                onEnter={handlePlayArtist}
                onClick={handlePlayArtist}
              >
                {({ isFocused }) => (
                  <button
                    className={`flex items-center gap-2.5 px-6 py-3 rounded-full text-base font-bold cursor-pointer transition-colors ${
                      isFocused
                        ? 'bg-primary-container text-on-primary-container ring-2 ring-secondary shadow-[0_0_24px_rgba(73,220,202,0.6)]'
                        : 'bg-primary-container text-on-primary-container shadow-md hover:bg-tertiary-container'
                    }`}
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Play Top Tracks</span>
                    <span className="ml-1 px-1.5 py-0.5 rounded bg-black/30 text-[10px] font-mono uppercase">
                      SELECT
                    </span>
                  </button>
                )}
              </Focusable>

              <Focusable
                focusId="artist-btn-radio"
                group="artist-actions"
                className="rounded-full cursor-pointer"
                onEnter={handleStartRadio}
                onClick={handleStartRadio}
              >
                {({ isFocused }) => (
                  <button
                    className={`flex items-center gap-2 px-6 py-3 rounded-full text-base font-bold cursor-pointer transition-colors ${
                      isFocused
                        ? 'bg-surface-container-high text-secondary ring-2 ring-secondary shadow-[0_0_24px_rgba(73,220,202,0.6)]'
                        : 'bg-surface-container-high text-on-surface hover:bg-surface-bright border border-white/5 shadow-md'
                    }`}
                  >
                    <Radio className="w-5 h-5" />
                    <span>Artist Radio</span>
                  </button>
                )}
              </Focusable>
            </div>
          </div>
        </div>
      </section>

      {/* Top Songs Section */}
      {topSongs.length > 0 && (
        <section className="flex flex-col w-full mb-12" aria-label="Top Songs">
          <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-white/[0.06]">
            <div className="flex items-baseline gap-3">
              <h2 className="font-serif-title text-2xl font-bold text-on-surface tracking-tight">
                Top Songs
              </h2>
              <span className="text-xs font-mono text-outline font-medium">
                {topSongs.length} Popular Tracks
              </span>
            </div>
          </div>

          {/* Table Column Headers */}
          <div className="flex items-center justify-between pb-2 px-4 text-outline font-semibold uppercase tracking-wider text-[11px] shrink-0 mb-1">
            <div className="flex items-center gap-4">
              <span className="w-8 text-center">#</span>
              <span>Title &amp; Album</span>
            </div>
            <div className="flex items-center gap-12">
              <span>Fidelity</span>
              <span className="w-16 text-right">Time</span>
            </div>
          </div>

          {/* TV Interactive Track Rows Container */}
          <div className="flex flex-col gap-2 w-full" role="list">
            {topSongs.map((track, index) => {
              const isPlayingThisTrack = currentTrack?.id === track.id && playbackStatus === 'playing';
              const isCurrentTrack = currentTrack?.id === track.id;
              const focusId = `artist-track-${track.id}`;

              return (
                <Focusable
                  key={track.id}
                  focusId={focusId}
                  group="artist-top-tracks"
                  className="rounded-2xl cursor-pointer"
                  onEnter={() => playTracks(topSongs, index)}
                  onClick={() => playTracks(topSongs, index)}
                >
                  {({ isFocused }) => (
                    <div
                      className={`group w-full flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-colors ${
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
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 text-secondary border border-secondary/40 font-mono font-bold">
                                NOW PLAYING
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-on-surface-variant truncate">
                            {track.album || artist.name}
                          </span>
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
                          {track.fidelity || track.codec || 'FLAC'}
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
      )}

      {/* Discography / Albums Section */}
      {albums.length > 0 && (
        <section className="flex flex-col w-full mb-12" aria-label="Discography">
          <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-white/[0.06]">
            <div className="flex items-baseline gap-3">
              <h2 className="font-serif-title text-2xl font-bold text-on-surface tracking-tight">
                Discography
              </h2>
              <span className="text-xs font-mono text-outline font-medium">
                {albums.length} {albums.length === 1 ? 'Release' : 'Releases'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 w-full">
            {albums.map((album) => {
              const focusId = `artist-album-card-${album.id}`;
              const isPlayingThisAlbum = currentTrack?.albumId === album.id && playbackStatus === 'playing';

              return (
                <Focusable
                  key={album.id}
                  focusId={focusId}
                  group="artist-albums"
                  className="rounded-xl cursor-pointer relative"
                  onEnter={() => openAlbum(album.id)}
                  onClick={() => openAlbum(album.id)}
                >
                  {({ isFocused }) => (
                    <article
                      className={`group relative flex flex-col rounded-xl p-2.5 cursor-pointer h-full transition-colors ${
                        isFocused
                          ? 'bg-surface-container-high z-10'
                          : 'bg-surface-container-low hover:bg-surface-container-high'
                      }`}
                    >
                      {/* Album Cover Art */}
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

                        {/* Quick Play Overlay on Focus or When Playing */}
                        {(isFocused || isPlayingThisAlbum) && (
                          <div className="absolute inset-0 bg-surface-dim/40 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-[0_0_24px_rgba(73,220,202,0.9)]">
                              <Play className="w-7 h-7 fill-current ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="relative flex flex-col pt-1 px-1">
                        <h3
                          className={`text-[15px] font-bold truncate transition-colors ${
                            isFocused ? 'text-secondary' : 'text-on-surface'
                          }`}
                        >
                          {album.title}
                        </h3>
                        <div className="flex items-center justify-between text-outline text-[12px] mt-0.5">
                          <span className="text-on-surface-variant font-mono">
                            {album.year || 'Album'}
                          </span>
                          <span className="text-outline font-mono">
                            {album.trackCount} {album.trackCount === 1 ? 'track' : 'tracks'}
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
      )}
    </div>
  );
};
