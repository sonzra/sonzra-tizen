import React from 'react';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { Focusable } from '../navigation/Focusable';
import { usePlayer } from '../context/PlayerContext';
import { useServer } from '../context/ServerContext';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const HomeView: React.FC = () => {
  const { openAlbum, goToView } = useSpatialNav();
  const { playAlbum, addToQueue, currentTrack, playbackStatus, currentTime, duration } = usePlayer();
  const { albums: serverAlbums, apiClient } = useServer();

  const hasLiveAlbums = Boolean(serverAlbums && serverAlbums.length > 0);
  const heroAlbum = hasLiveAlbums ? serverAlbums[0] : null;

  const isHeroPlaying = Boolean(
    heroAlbum && currentTrack && currentTrack.albumId === heroAlbum.id
  );

  const continueListeningAlbums = hasLiveAlbums
    ? (serverAlbums.filter((a) => a.progressPercent !== undefined && a.progressPercent > 0).length > 0
        ? serverAlbums.filter((a) => a.progressPercent !== undefined && a.progressPercent > 0)
        : serverAlbums.slice(1, 5))
    : [];

  const recentlyAddedAlbums = hasLiveAlbums ? serverAlbums.slice(0, 8) : [];

  const handleResumePlayback = () => {
    if (heroAlbum) {
      playAlbum(heroAlbum);
    } else {
      goToView('library');
    }
  };

  const handleAddHeroToQueue = async () => {
    if (!heroAlbum) return;
    if (heroAlbum.tracks && heroAlbum.tracks.length > 0) {
      addToQueue(heroAlbum.tracks);
    } else {
      try {
        const full = await apiClient.fetchAlbum(heroAlbum.id);
        if (full?.tracks && full.tracks.length > 0) {
          addToQueue(full.tracks);
        }
      } catch (e) {
        console.warn('Failed to load hero album tracks for queue:', e);
      }
    }
  };

  return (
    <div className="flex flex-col w-full relative pb-32">
      {/* Clean Dashboard Header */}
      <div className="flex items-baseline justify-between w-full mb-6 pt-2">
        <h1 className="text-[34px] font-serif-title font-bold text-on-surface tracking-tight">
          Home
        </h1>
        {isHeroPlaying && (
          <div className="flex items-center gap-2 bg-surface-container-high/60 px-3.5 py-1 rounded-full border border-white/[0.04]">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(73,220,202,0.8)]"></span>
            <span className="text-xs font-mono text-secondary font-semibold uppercase tracking-wider">
              Now Playing
            </span>
          </div>
        )}
      </div>

      {/* Hero Album Spotlight */}
      {!heroAlbum ? (
        <section className="relative w-full rounded-2xl bg-gradient-to-r from-surface-container-lowest via-surface-container-low to-surface-container/60 p-10 overflow-hidden shadow-2xl mb-12 border border-white/[0.04]">
          <div className="flex flex-col items-center justify-center text-center py-12 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[36px]">library_music</span>
            </div>
            <h2 className="text-2xl font-bold text-on-surface">No Albums in Library Yet</h2>
            <p className="text-on-surface-variant max-w-md text-sm">
              Connect your Sonzra music server or sync your library in Settings to begin streaming.
            </p>
            <Focusable
              focusId="hero-resume"
              group="hero-actions"
              autoFocus={true}
              className="rounded-full cursor-pointer mt-2"
              onEnter={() => goToView('library')}
              onClick={() => goToView('library')}
            >
              {({ isFocused }) => (
                <button
                  className={`px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 ${
                    isFocused
                      ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary'
                      : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined">grid_view</span>
                  <span>Open Library</span>
                </button>
              )}
            </Focusable>
          </div>
        </section>
      ) : (
        <section className="relative w-full rounded-2xl bg-gradient-to-r from-surface-container-lowest via-surface-container-low to-surface-container/60 p-8 sm:p-10 overflow-hidden shadow-2xl mb-12 border border-white/[0.04]">
          {/* Subtle Ambient Backlight */}
          <div className="absolute right-0 top-0 w-[420px] h-[420px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-12 gap-8 items-center">
            {/* Left Column: Metadata & Actions */}
            <div className="col-span-12 lg:col-span-7 flex flex-col justify-center">
              {/* Authentic Badges if present */}
              {heroAlbum.codecBadge && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded bg-surface-container-highest text-secondary font-mono text-[11px] font-semibold tracking-wider">
                    {heroAlbum.codecBadge}
                  </span>
                </div>
              )}

              {/* Master Album Title */}
              <h2 className="font-serif-title text-[40px] sm:text-[46px] leading-tight text-on-surface font-extrabold tracking-tight mb-2 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                {heroAlbum.title}
              </h2>

              {/* Artist and Metadata */}
              <p className="font-headline-sm text-headline-sm text-primary mb-5 font-medium">
                {heroAlbum.artist}{' '}
                {heroAlbum.year && (
                  <>
                    <span className="text-outline-variant font-normal">·</span>{' '}
                    <span className="text-on-surface-variant font-normal">{heroAlbum.year}</span>
                  </>
                )}{' '}
                {heroAlbum.trackCount > 0 && (
                  <>
                    <span className="text-outline-variant font-normal">·</span>{' '}
                    <span className="text-on-surface-variant font-normal text-body-md">
                      {heroAlbum.trackCount} {heroAlbum.trackCount === 1 ? 'track' : 'tracks'}
                    </span>
                  </>
                )}
              </p>

              {/* Real Playback Progress (Only when currently playing or real progress recorded) */}
              {isHeroPlaying && currentTrack && (
                <div className="w-full max-w-xl bg-surface-container-lowest/80 p-4 rounded-xl mb-6 shadow-inner border border-white/[0.03]">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-secondary font-semibold flex items-center gap-1.5 font-mono text-[13px]">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      {currentTrack.title}
                    </span>
                    <span className="text-on-surface-variant font-mono text-[13px]">
                      {formatTime(currentTime)} / {formatTime(duration || currentTrack.duration)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden flex items-center">
                    <div
                      className="h-full bg-secondary rounded-full shadow-[0_0_10px_rgba(73,220,202,0.9)]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, duration > 0 ? (currentTime / duration) * 100 : 0)
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* TV Remote D-Pad Navigation Action Bar */}
              <div className="flex items-center gap-4 flex-wrap mt-2">
                {/* Resume / Play Button */}
                <Focusable
                  focusId="hero-resume"
                  group="hero-actions"
                  autoFocus={true}
                  className="rounded-full cursor-pointer"
                  onEnter={handleResumePlayback}
                  onClick={handleResumePlayback}
                >
                  {({ isFocused }) => (
                    <button
                      className={`flex items-center gap-2 font-label-lg text-label-lg px-6 py-3 rounded-full transition-colors duration-75 cursor-pointer ${
                        isFocused
                          ? 'bg-primary-container text-on-primary-container font-bold'
                          : 'bg-primary-container/90 text-on-primary-container shadow-md'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[26px]">play_arrow</span>
                      <span className="font-bold">Resume Playback</span>
                    </button>
                  )}
                </Focusable>

                {/* Add to Queue */}
                <Focusable
                  focusId="hero-queue"
                  group="hero-actions"
                  className="rounded-full cursor-pointer"
                  onEnter={handleAddHeroToQueue}
                  onClick={handleAddHeroToQueue}
                >
                  {({ isFocused }) => (
                    <button
                      className={`flex items-center gap-2 font-label-lg text-label-lg px-5 py-3 rounded-full transition-colors duration-75 cursor-pointer ${
                        isFocused
                          ? 'bg-surface-container-highest text-secondary'
                          : 'bg-surface-container-high text-on-surface shadow-md'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">queue_music</span>
                      <span>Add to Queue</span>
                    </button>
                  )}
                </Focusable>

                {/* Album Details */}
                <Focusable
                  focusId="hero-details"
                  group="hero-actions"
                  className="rounded-full cursor-pointer"
                  onEnter={() => openAlbum(heroAlbum.id)}
                  onClick={() => openAlbum(heroAlbum.id)}
                >
                  {({ isFocused }) => (
                    <button
                      className={`flex items-center gap-2 font-label-lg text-label-lg px-5 py-3 rounded-full transition-colors duration-75 cursor-pointer ${
                        isFocused
                          ? 'bg-surface-container-highest text-secondary'
                          : 'bg-surface-container-high text-on-surface shadow-md'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">info</span>
                      <span>Album Details</span>
                    </button>
                  )}
                </Focusable>

                {/* Favorite Heart Button */}
                <Focusable
                  focusId="hero-favorite"
                  group="hero-actions"
                  className="rounded-full cursor-pointer"
                >
                  {({ isFocused }) => (
                    <button
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-error shadow-md transition-colors duration-75 cursor-pointer ${
                        isFocused ? 'bg-surface-container-highest ring-2 ring-secondary' : 'bg-surface-container-high'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[24px]"
                        style={{ fontVariationSettings: '"FILL" 1' }}
                      >
                        favorite
                      </span>
                    </button>
                  )}
                </Focusable>
              </div>
            </div>

            {/* Right Column: Clean Album Cover Art (No fake vinyl record) */}
            <div className="col-span-12 lg:col-span-5 relative flex items-center justify-center py-2">
              <div
                className="relative z-10 w-72 h-72 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] bg-surface-container-high border border-white/10 transition-transform transform hover:scale-[1.02] cursor-pointer"
                onClick={() => openAlbum(heroAlbum.id)}
              >
                <img
                  className="w-full h-full object-cover"
                  src={heroAlbum.artworkUrl}
                  alt={heroAlbum.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SHELF 1: CONTINUE LISTENING */}
      {continueListeningAlbums.length > 0 && (
        <section className="flex flex-col w-full mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <div className="flex items-baseline gap-3">
              <h2 className="font-serif-title text-[28px] text-on-surface font-bold tracking-tight">
                Continue Listening
              </h2>
              <span className="font-label-lg text-label-lg text-on-surface-variant font-medium">
                {continueListeningAlbums.length} albums
              </span>
            </div>
          </div>

          {/* Shelves Grid: 4 Rich Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {continueListeningAlbums.map((album) => {
              const focusId = `continue-card-${album.id}`;
              const isPlayingThisAlbum = currentTrack?.albumId === album.id && playbackStatus === 'playing';

              return (
                <Focusable
                  key={album.id}
                  focusId={focusId}
                  group="continue-shelf"
                  className="rounded-xl cursor-pointer"
                  onEnter={() => playAlbum(album)}
                  onClick={() => playAlbum(album)}
                >
                  {({ isFocused }) => (
                    <div
                      className={`flex flex-col rounded-xl p-3 h-full transition-colors duration-75 ${
                        isFocused
                          ? 'bg-surface-container z-10'
                          : 'bg-surface-container-low shadow-md'
                      }`}
                    >
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-container-high mb-3 shadow-md">
                        <img
                          className="w-full h-full object-cover"
                          src={album.artworkUrl}
                          alt={album.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                          }}
                        />

                        {/* Play overlay on focus or when playing */}
                        {(isFocused || isPlayingThisAlbum) && (
                          <div className="absolute inset-0 bg-surface-dim/40 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="w-13 h-13 p-3 rounded-full bg-secondary text-surface-container-lowest flex items-center justify-center shadow-[0_0_20px_rgba(73,220,202,0.9)]">
                              <span
                                className="material-symbols-outlined text-[32px]"
                                style={{ fontVariationSettings: '"FILL" 1' }}
                              >
                                {isPlayingThisAlbum ? 'pause' : 'play_arrow'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Album and Artist Info */}
                      <span className="font-headline-sm text-[18px] leading-tight text-on-surface font-bold truncate">
                        {album.title}
                      </span>
                      <span className="font-label-md text-label-md text-primary truncate mb-2">
                        {album.artist}
                      </span>

                      {/* Real progress details if present */}
                      {album.progressPercent !== undefined && album.progressPercent > 0 && (
                        <div className="w-full mt-auto">
                          <div className="w-full flex items-center justify-between text-[12px] font-mono text-outline mb-1">
                            <span>Track {album.currentTrackIndex || 1} of {album.trackCount}</span>
                            <span className="text-secondary font-bold">{album.progressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary rounded-full shadow-[0_0_8px_rgba(73,220,202,0.8)]"
                              style={{ width: `${album.progressPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Focusable>
              );
            })}
          </div>
        </section>
      )}

      {/* SHELF 2: RECENTLY ADDED */}
      {recentlyAddedAlbums.length > 0 && (
        <section className="flex flex-col w-full mb-10">
          <div className="flex items-baseline justify-between mb-4">
            <div className="flex items-baseline gap-3">
              <h2 className="font-serif-title text-[28px] text-on-surface font-bold tracking-tight">
                Recently Added
              </h2>
              <span className="text-xs font-mono text-outline">
                {recentlyAddedAlbums.length} albums
              </span>
            </div>
            <button
              onClick={() => goToView('library')}
              className="font-label-lg text-label-lg text-primary hover:text-secondary flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {recentlyAddedAlbums.map((album) => {
              const focusId = `recent-card-${album.id}`;

              return (
                <Focusable
                  key={album.id}
                  focusId={focusId}
                  group="recent-shelf"
                  className="rounded-xl cursor-pointer"
                  onEnter={() => openAlbum(album.id)}
                  onClick={() => openAlbum(album.id)}
                >
                  {({ isFocused }) => (
                    <div
                      className={`flex flex-col rounded-xl p-3 h-full transition-colors duration-75 ${
                        isFocused
                          ? 'bg-surface-container z-10'
                          : 'bg-surface-container-low shadow-md'
                      }`}
                    >
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-container-high mb-3 shadow-md">
                        <img
                          className="w-full h-full object-cover"
                          src={album.artworkUrl}
                          alt={album.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = './sonzra-mark.svg';
                          }}
                        />
                        {album.codecBadge && (
                          <div className="absolute bottom-2.5 right-2.5 bg-surface-container-lowest/90 px-2 py-0.5 rounded text-[11px] font-mono text-secondary font-semibold">
                            {album.codecBadge}
                          </div>
                        )}
                      </div>

                      <span className="font-headline-sm text-[18px] leading-tight text-on-surface font-bold truncate">
                        {album.title}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant truncate">
                        {album.artist}
                      </span>
                      <span className="text-[12px] font-mono text-outline mt-1">
                        {album.trackCount} {album.trackCount === 1 ? 'Track' : 'Tracks'}
                      </span>
                    </div>
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
