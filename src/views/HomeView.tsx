import React from 'react';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { Focusable } from '../navigation/Focusable';
import { usePlayer } from '../context/PlayerContext';
import { MOCK_ALBUMS } from '../services/mockData';

export const HomeView: React.FC = () => {
  const { openAlbum, goToView } = useSpatialNav();
  const { playAlbum, addToQueue, playTrack, currentTrack, playbackStatus } = usePlayer();

  const heroAlbum = MOCK_ALBUMS.find((a) => a.id === 'album-echoes-in-violet') || MOCK_ALBUMS[0];
  const continueListeningAlbums = MOCK_ALBUMS.filter((a) => a.progressPercent !== undefined);
  const recentlyAddedAlbums = MOCK_ALBUMS.slice(0, 4);

  const handleResumePlayback = () => {
    if (heroAlbum.tracks && heroAlbum.tracks.length > 0) {
      const trackIndex = (heroAlbum.currentTrackIndex || 8) - 1;
      const targetTrack = heroAlbum.tracks[trackIndex] || heroAlbum.tracks[0];
      playTrack(targetTrack, heroAlbum.tracks);
    } else {
      playAlbum(heroAlbum);
    }
  };

  const handleAddHeroToQueue = () => {
    if (heroAlbum.tracks) {
      addToQueue(heroAlbum.tracks);
    }
  };

  return (
    <div className="flex flex-col w-full relative pb-32">
      {/* Top Context / Status Telemetry */}
      <div className="flex items-center justify-between w-full mb-8 pt-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-container-low/90 px-4 py-1.5 rounded-full shadow-md border border-white/[0.04]">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(73,220,202,0.8)]"></span>
            <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider text-[13px] font-semibold">
              IN PROGRESS · TRACK {heroAlbum.currentTrackIndex || 8} OF {heroAlbum.trackCount}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-high/60 px-4 py-1.5 rounded-full border border-white/[0.03]">
            <span className="material-symbols-outlined text-primary text-[18px]">graphic_eq</span>
            <span className="font-label-md text-label-md text-on-surface-variant text-[13px]">
              Hi-Res Audio 96kHz / 24-bit
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-label-md text-label-md text-outline uppercase tracking-widest text-[12px]">
            TIZEN AUDIOPHILE CORE v4.2
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-secondary-container/20 text-secondary text-[12px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_6px_#43d7c6]"></span>
            BIT-PERFECT DAC
          </div>
        </div>
      </div>

      {/* Hero Album Spotlight (Echoes in Violet) */}
      <section className="relative w-full rounded-2xl bg-gradient-to-r from-surface-container-lowest via-surface-container-low to-surface-container/60 p-10 overflow-hidden shadow-2xl mb-12 border border-white/[0.04]">
        {/* Atmospheric Ambient Glow Backlights */}
        <div className="absolute -right-16 -top-24 w-[540px] h-[540px] bg-primary-container/20 rounded-full blur-[110px] pointer-events-none"></div>
        <div className="absolute right-48 bottom-0 w-[420px] h-[420px] bg-secondary/15 rounded-full blur-[90px] pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-12 gap-8 items-center">
          {/* Left Column: Metadata & Actions */}
          <div className="col-span-12 lg:col-span-7 flex flex-col justify-center">
            {/* Badges & Format Meta */}
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-0.5 rounded bg-primary-container text-on-primary-container font-label-md text-[11px] font-bold tracking-wider">
                {heroAlbum.masterBadge || 'MASTER MQA'}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-surface-container-highest text-secondary font-label-md text-[11px] font-semibold tracking-wider">
                {heroAlbum.codecBadge || 'FLAC 96kHz / 24-bit'}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant text-[13px] ml-1">
                Stereo PCM Direct
              </span>
            </div>

            {/* Master Album Title */}
            <h1 className="font-serif-title text-[46px] leading-tight text-on-surface font-extrabold tracking-tight mb-2 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              {heroAlbum.title}
            </h1>

            {/* Artist and Metadata */}
            <p className="font-headline-sm text-headline-sm text-primary mb-5 font-medium">
              {heroAlbum.artist}{' '}
              <span className="text-outline-variant font-normal">·</span>{' '}
              <span className="text-on-surface-variant font-normal">{heroAlbum.year}</span>{' '}
              <span className="text-outline-variant font-normal">·</span>{' '}
              <span className="text-on-surface-variant font-normal text-body-md">
                {heroAlbum.trackCount} tracks, 56 mins
              </span>
            </p>

            {/* Playback Scrubbing & Time Left */}
            <div className="w-full max-w-xl bg-surface-container-lowest/80 p-5 rounded-xl mb-6 shadow-inner border border-white/[0.03]">
              <div className="flex items-center justify-between mb-2 font-label-md text-label-md">
                <span className="text-secondary font-semibold flex items-center gap-1.5 text-[14px]">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>{' '}
                  {heroAlbum.progressPercent || 68}% Finished
                </span>
                <span className="text-on-surface-variant font-mono text-[14px]">
                  {heroAlbum.remainingTime || '38:12 remaining'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-variant rounded-full overflow-hidden p-0.5 flex items-center">
                <div
                  className="h-full bg-gradient-to-r from-primary-container via-primary to-secondary rounded-full shadow-[0_0_12px_rgba(73,220,202,0.9)]"
                  style={{ width: `${heroAlbum.progressPercent || 68}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-2 text-[12px] font-mono text-outline">
                <span>
                  Track {heroAlbum.currentTrackIndex || 8}: {heroAlbum.currentTrackTitle || 'Celestial Reverie'}
                </span>
                <span>Total: 56:04</span>
              </div>
            </div>

            {/* TV Remote D-Pad Navigation Action Bar */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Primary Focused Button: Resume Playback */}
              <Focusable
                focusId="hero-resume"
                group="hero-actions"
                className="rounded-full cursor-pointer transition-all duration-200"
                onEnter={handleResumePlayback}
                onClick={handleResumePlayback}
              >
                {({ isFocused }) => (
                  <button
                    className={`flex items-center gap-2 font-label-lg text-label-lg px-6 py-3 rounded-full transition-all cursor-pointer ${
                      isFocused
                        ? 'bg-primary-container text-on-primary-container shadow-[0_0_28px_rgba(122,90,248,0.8)] ring-2 ring-secondary scale-105'
                        : 'bg-primary-container/90 text-on-primary-container shadow-md hover:bg-primary-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[26px]">play_arrow</span>
                    <span className="font-bold">Resume Playback</span>
                    <span className="text-[12px] opacity-80 font-mono ml-1">[SELECT]</span>
                  </button>
                )}
              </Focusable>

              {/* Secondary Pill: Add to Queue */}
              <Focusable
                focusId="hero-queue"
                group="hero-actions"
                className="rounded-full cursor-pointer transition-all duration-200"
                onEnter={handleAddHeroToQueue}
                onClick={handleAddHeroToQueue}
              >
                {({ isFocused }) => (
                  <button
                    className={`flex items-center gap-2 font-label-lg text-label-lg px-5 py-3 rounded-full transition-all cursor-pointer ${
                      isFocused
                        ? 'bg-surface-container-highest text-secondary ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.5)] scale-105'
                        : 'bg-surface-container-high text-on-surface hover:text-secondary shadow-md'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">queue_music</span>
                    <span>Add to Queue</span>
                  </button>
                )}
              </Focusable>

              {/* Tertiary Pill: Album Details */}
              <Focusable
                focusId="hero-details"
                group="hero-actions"
                className="rounded-full cursor-pointer transition-all duration-200"
                onEnter={() => openAlbum(heroAlbum.id)}
                onClick={() => openAlbum(heroAlbum.id)}
              >
                {({ isFocused }) => (
                  <button
                    className={`flex items-center gap-2 font-label-lg text-label-lg px-5 py-3 rounded-full transition-all cursor-pointer ${
                      isFocused
                        ? 'bg-surface-container-highest text-secondary ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.5)] scale-105'
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
                className="rounded-full cursor-pointer transition-all duration-200"
              >
                {({ isFocused }) => (
                  <button
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-error shadow-md transition-all cursor-pointer ${
                      isFocused
                        ? 'bg-surface-container-highest ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.5)] scale-105'
                        : 'bg-surface-container-high hover:bg-surface-container-highest'
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

          {/* Right Column: 3D Vinyl Sliding From Sleeve */}
          <div className="col-span-12 lg:col-span-5 relative flex items-center justify-center py-2">
            <div className="relative w-80 h-80 sm:w-88 sm:h-88 flex items-center justify-center">
              {/* Vinyl Record sliding horizontally outward */}
              <div className="absolute right-0 w-68 h-68 sm:w-76 sm:h-76 rounded-full bg-surface-container-lowest shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden transform translate-x-10 sm:translate-x-14 rotate-45 transition-transform duration-700 hover:translate-x-20">
                {/* Vinyl Grooves concentric rings SVG pattern */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-60 text-outline-variant/40"
                  viewBox="0 0 200 200"
                >
                  <circle cx="100" cy="100" fill="none" r="95" stroke="currentColor" strokeWidth="0.5"></circle>
                  <circle cx="100" cy="100" fill="none" r="90" stroke="currentColor" strokeWidth="0.5"></circle>
                  <circle cx="100" cy="100" fill="none" r="85" stroke="currentColor" strokeWidth="0.5"></circle>
                  <circle cx="100" cy="100" fill="none" r="80" stroke="currentColor" strokeWidth="0.75"></circle>
                  <circle cx="100" cy="100" fill="none" r="75" stroke="currentColor" strokeWidth="0.5"></circle>
                  <circle cx="100" cy="100" fill="none" r="70" stroke="currentColor" strokeWidth="0.5"></circle>
                  <circle cx="100" cy="100" fill="none" r="65" stroke="currentColor" strokeWidth="0.75"></circle>
                  <circle cx="100" cy="100" fill="none" r="60" stroke="currentColor" strokeWidth="0.5"></circle>
                  <circle cx="100" cy="100" fill="none" r="55" stroke="currentColor" strokeWidth="0.5"></circle>
                  <circle cx="100" cy="100" fill="none" r="50" stroke="currentColor" strokeWidth="0.75"></circle>
                </svg>

                {/* Center Vinyl Label */}
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary-container to-secondary flex flex-col items-center justify-center text-center p-2 shadow-inner">
                  <div className="w-5 h-5 rounded-full bg-surface-container-lowest mb-1"></div>
                  <span className="text-[8px] font-bold text-surface-container-lowest uppercase tracking-wider font-mono">
                    SIDE A · 33 RPM
                  </span>
                  <span className="text-[9px] font-extrabold text-surface-container-lowest truncate max-w-[80px]">
                    VIOLET
                  </span>
                </div>
              </div>

              {/* Physical Album Cover Sleeve */}
              <div
                className="relative z-20 w-72 h-72 sm:w-84 sm:h-84 rounded-xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] bg-surface-container-high transition-transform transform hover:scale-[1.02] cursor-pointer"
                onClick={() => openAlbum(heroAlbum.id)}
              >
                <img
                  className="w-full h-full object-cover"
                  src={heroAlbum.artworkUrl}
                  alt={heroAlbum.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-transparent to-transparent flex flex-col justify-end p-5">
                  <span className="font-serif-title text-[22px] text-on-surface font-bold drop-shadow">
                    {heroAlbum.title}
                  </span>
                  <span className="font-label-md text-label-md text-primary font-medium">
                    {heroAlbum.artist}
                  </span>
                </div>
                <div className="absolute top-3 left-3 bg-surface-container-lowest/80 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-mono font-bold text-secondary">
                  MQA MASTER
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SHELF 1: CONTINUE LISTENING */}
      <section className="flex flex-col w-full mb-12">
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <h2 className="font-serif-title text-[28px] text-on-surface font-bold tracking-tight">
              Continue Listening
            </h2>
            <span className="font-label-lg text-label-lg text-on-surface-variant font-medium">
              {continueListeningAlbums.length} albums in progress
            </span>
          </div>
          <div className="flex items-center gap-2 text-outline font-label-md text-label-md">
            <span>Shelf 1 of 2</span>
            <span>•</span>
            <span className="text-primary flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span> D-PAD RIGHT to browse
            </span>
          </div>
        </div>

        {/* Shelves Grid: 4 Rich Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {continueListeningAlbums.map((album, idx) => {
            const focusId = `continue-card-${album.id}`;
            const isPlayingThisAlbum = currentTrack?.albumId === album.id && playbackStatus === 'playing';

            return (
              <Focusable
                key={album.id}
                focusId={focusId}
                group="continue-shelf"
                className="rounded-xl cursor-pointer transition-all duration-200"
                onEnter={() => playAlbum(album)}
                onClick={() => playAlbum(album)}
              >
                {({ isFocused }) => (
                  <div
                    className={`flex flex-col rounded-xl p-3 transition-all duration-200 h-full ${
                      isFocused
                        ? 'bg-surface-container ring-2 ring-secondary shadow-[0_0_24px_rgba(73,220,202,0.4)] scale-[1.03] z-10'
                        : 'bg-surface-container-low hover:bg-surface-container shadow-md'
                    }`}
                  >
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-container-high mb-3 shadow-md">
                      <img
                        className="w-full h-full object-cover"
                        src={album.artworkUrl}
                        alt={album.title}
                      />
                      {idx === 0 && (
                        <div className="absolute top-2.5 left-2.5 bg-secondary text-surface-container-lowest px-2 py-0.5 rounded font-label-md text-[11px] font-bold tracking-wider flex items-center gap-1 shadow-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-surface-container-lowest animate-ping"></span>
                          ACTIVE
                        </div>
                      )}
                      {album.codecBadge && idx !== 0 && (
                        <div className="absolute top-2.5 right-2.5 bg-surface-container-lowest/80 backdrop-blur-md text-on-surface px-2 py-0.5 rounded font-label-md text-[11px] font-semibold">
                          {album.codecBadge}
                        </div>
                      )}

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
                    <span className="font-headline-sm text-[20px] leading-tight text-on-surface font-bold truncate">
                      {album.title}
                    </span>
                    <span className="font-label-md text-label-md text-primary truncate mb-2">
                      {album.artist}
                    </span>

                    {/* Progress details */}
                    <div className="w-full flex items-center justify-between text-[12px] font-mono text-outline mb-1 mt-auto">
                      <span>Track {album.currentTrackIndex || 1} of {album.trackCount}</span>
                      <span className="text-secondary font-bold">{album.progressPercent || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary rounded-full shadow-[0_0_8px_rgba(73,220,202,0.8)]"
                        style={{ width: `${album.progressPercent || 0}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </Focusable>
            );
          })}
        </div>
      </section>

      {/* SHELF 2: RECENTLY ADDED TO SERVER (LOSSLESS LIBRARY) */}
      <section className="flex flex-col w-full mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <h2 className="font-serif-title text-[28px] text-on-surface font-bold tracking-tight">
              Recently Added to Server
            </h2>
            <span className="px-2.5 py-0.5 rounded bg-surface-container-highest text-secondary font-label-md text-[12px] font-semibold uppercase tracking-wider">
              Lossless Library
            </span>
          </div>
          <button
            onClick={() => goToView('library')}
            className="font-label-lg text-label-lg text-primary hover:text-secondary flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Added this week · View All</span>
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>

        {/* 4 High Fidelity Server Album Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {recentlyAddedAlbums.map((album) => {
            const focusId = `recent-card-${album.id}`;

            return (
              <Focusable
                key={album.id}
                focusId={focusId}
                group="recent-shelf"
                className="rounded-xl cursor-pointer transition-all duration-200"
                onEnter={() => openAlbum(album.id)}
                onClick={() => openAlbum(album.id)}
              >
                {({ isFocused }) => (
                  <div
                    className={`flex flex-col rounded-xl p-3 transition-all duration-200 h-full ${
                      isFocused
                        ? 'bg-surface-container ring-2 ring-secondary shadow-[0_0_24px_rgba(73,220,202,0.4)] scale-[1.03] z-10'
                        : 'bg-surface-container-low hover:bg-surface-container shadow-md'
                    }`}
                  >
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-container-high mb-3 shadow-md">
                      <img
                        className="w-full h-full object-cover"
                        src={album.artworkUrl}
                        alt={album.title}
                      />
                      {album.isNew && (
                        <div className="absolute top-2.5 left-2.5 bg-primary-container text-on-primary-container px-2 py-0.5 rounded font-label-md text-[11px] font-bold">
                          NEW
                        </div>
                      )}
                      <div className="absolute bottom-2.5 right-2.5 bg-surface-container-lowest/90 px-2 py-0.5 rounded text-[11px] font-mono text-secondary font-semibold">
                        {album.codecBadge || 'FLAC 24b/96k'}
                      </div>
                    </div>

                    <span className="font-headline-sm text-[20px] leading-tight text-on-surface font-bold truncate">
                      {album.title}
                    </span>
                    <span className="font-label-md text-label-md text-on-surface-variant truncate">
                      {album.artist}
                    </span>
                    <span className="text-[12px] font-mono text-outline mt-1">
                      {album.trackCount} Tracks {album.fileSize ? `· ${album.fileSize}` : ''}
                    </span>
                  </div>
                )}
              </Focusable>
            );
          })}
        </div>
      </section>
    </div>
  );
};
