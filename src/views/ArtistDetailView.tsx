import React, { useEffect, useState } from 'react';
import { useServer } from '../context/ServerContext';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { usePlayer } from '../context/PlayerContext';
import { Artist } from '../types/music';
import { Focusable } from '../navigation/Focusable';
import { FocusableButton } from '../components/FocusableButton';
import { FocusableCard } from '../components/FocusableCard';
import { ArrowLeft, Play, Radio } from 'lucide-react';
import { EqualizerBars } from '../components/EqualizerBars';

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const ArtistDetailView: React.FC = () => {
  const { viewParam, goBack, openAlbum } = useSpatialNav();
  const { apiClient } = useServer();
  const { playTracks, currentTrack, playbackStatus } = usePlayer();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    if (viewParam) {
      setLoading(true);
      apiClient.fetchArtist(viewParam).then((res) => {
        if (active) {
          setArtist(res);
          setLoading(false);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [viewParam, apiClient]);

  if (loading || !artist) {
    return (
      <div className="tv-view-loading">
        <div className="tv-spinner" />
        <p>Loading Artist Details...</p>
      </div>
    );
  }

  const topSongs = artist.topTracks || [];
  const albums = artist.albums || [];

  return (
    <div className="tv-view-content tv-detail-view" role="main">
      {/* Back button */}
      <div className="tv-detail-top-nav">
        <FocusableButton
          focusId="artist-detail-back"
          group="artist-hero"
          label="Back to Artists"
          icon={<ArrowLeft size={20} />}
          variant="ghost"
          size="sm"
          onEnter={goBack}
          onClick={goBack}
        />
      </div>

      {/* Hero Header */}
      <section className="tv-detail-hero" aria-label="Artist Information">
        <div className="tv-artist-hero-avatar-wrap">
          <img
            src={artist.artworkUrl}
            alt={artist.name}
            className="tv-artist-hero-avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).src = './sonzra-mark.svg';
            }}
          />
        </div>

        <div className="tv-detail-meta">
          <div className="tv-eyebrow">ARTIST • {artist.genre || 'Music'}</div>
          <h1 className="tv-detail-title">{artist.name}</h1>
          {artist.bio && <p className="tv-artist-bio">{artist.bio}</p>}

          <div className="tv-detail-chips">
            <span className="tv-chip">{albums.length} Releases</span>
            <span className="tv-chip-dot">•</span>
            <span className="tv-chip">{topSongs.length} Popular Tracks</span>
          </div>

          <div className="tv-detail-actions">
            {topSongs.length > 0 && (
              <FocusableButton
                focusId="artist-btn-play-top"
                group="artist-actions"
                label="Play Top Tracks"
                icon={<Play size={22} />}
                variant="primary"
                size="lg"
                autoFocus={true}
                onEnter={() => playTracks(topSongs)}
                onClick={() => playTracks(topSongs)}
              />
            )}
            <FocusableButton
              focusId="artist-btn-radio"
              group="artist-actions"
              label="Artist Radio"
              icon={<Radio size={20} />}
              variant="secondary"
              size="lg"
              onEnter={() => playTracks(topSongs, 0, true)}
              onClick={() => playTracks(topSongs, 0, true)}
            />
          </div>
        </div>
      </section>

      {/* Top Tracks */}
      {topSongs.length > 0 && (
        <section className="tv-artist-section" aria-label="Top Songs">
          <h2 className="tv-section-heading">Top Songs</h2>
          <div className="tv-tracklist-rows">
            {topSongs.map((track, idx) => {
              const isCurrentPlaying = currentTrack?.id === track.id;
              const isPlaying = isCurrentPlaying && playbackStatus === 'playing';

              return (
                <Focusable
                  key={track.id}
                  focusId={`artist-track-${track.id}`}
                  group="artist-top-tracks"
                  className={`tv-track-row ${isCurrentPlaying ? 'tv-track-playing' : ''}`}
                  onEnter={() => playTracks(topSongs, idx)}
                  onClick={() => playTracks(topSongs, idx)}
                >
                  {({ isFocused }) => (
                    <div className={`tv-track-row-inner ${isFocused ? 'tv-track-focused' : ''}`}>
                      <span className="tv-td-num">
                        {isCurrentPlaying ? (
                          <EqualizerBars isPlaying={isPlaying} size="sm" />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <div className="tv-td-title-wrap">
                        <span className="tv-track-name">{track.title}</span>
                        <span className="tv-track-artist">{track.album}</span>
                      </div>
                      <span className="tv-td-codec">{track.codec || 'FLAC'}</span>
                      <span className="tv-td-duration">{formatDuration(track.duration)}</span>
                    </div>
                  )}
                </Focusable>
              );
            })}
          </div>
        </section>
      )}

      {/* Discography / Albums */}
      {albums.length > 0 && (
        <section className="tv-artist-section" aria-label="Discography">
          <h2 className="tv-section-heading">Discography</h2>
          <div className="tv-grid-container tv-shelf-grid">
            {albums.map((album) => (
              <FocusableCard
                key={album.id}
                focusId={`artist-album-card-${album.id}`}
                group="artist-albums"
                title={album.title}
                subtitle={`${album.year || 'Album'} • ${album.trackCount} tracks`}
                imageUrl={album.artworkUrl}
                onEnter={() => openAlbum(album.id)}
                onClick={() => openAlbum(album.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
