import React, { useEffect, useState } from 'react';
import { useServer } from '../context/ServerContext';
import { useSpatialNav } from '../navigation/SpatialNavigationContext';
import { usePlayer } from '../context/PlayerContext';
import { Album } from '../types/music';
import { Focusable } from '../navigation/Focusable';
import { FocusableButton } from '../components/FocusableButton';
import { Play, Shuffle, Plus, ArrowLeft, Clock } from 'lucide-react';
import { EqualizerBars } from '../components/EqualizerBars';

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const AlbumDetailView: React.FC = () => {
  const { viewParam, goBack } = useSpatialNav();
  const { apiClient } = useServer();
  const { playAlbum, addToQueue, currentTrack, playbackStatus } = usePlayer();

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    if (viewParam) {
      setLoading(true);
      apiClient.fetchAlbum(viewParam).then((res) => {
        if (active) {
          setAlbum(res);
          setLoading(false);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [viewParam, apiClient]);

  if (loading || !album) {
    return (
      <div className="tv-view-loading">
        <div className="tv-spinner" />
        <p>Loading Album Details...</p>
      </div>
    );
  }

  const tracks = album.tracks || [];
  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  return (
    <div className="tv-view-content tv-detail-view" role="main">
      {/* Back button */}
      <div className="tv-detail-top-nav">
        <FocusableButton
          focusId="album-detail-back"
          group="album-hero"
          label="Back to Library"
          icon={<ArrowLeft size={20} />}
          variant="ghost"
          size="sm"
          onEnter={goBack}
          onClick={goBack}
        />
      </div>

      {/* Hero Header */}
      <section className="tv-detail-hero" aria-label="Album Information">
        <div className="tv-detail-cover-wrapper">
          <img
            src={album.artworkUrl}
            alt={album.title}
            className="tv-detail-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = './sonzra-mark.svg';
            }}
          />
        </div>

        <div className="tv-detail-meta">
          <div className="tv-eyebrow">ALBUM • {album.genre || 'Music'}</div>
          <h1 className="tv-detail-title">{album.title}</h1>
          <div className="tv-detail-artist">{album.artist}</div>

          <div className="tv-detail-chips">
            <span className="tv-chip">{album.year}</span>
            <span className="tv-chip-dot">•</span>
            <span className="tv-chip">{tracks.length} Tracks</span>
            <span className="tv-chip-dot">•</span>
            <span className="tv-chip">{formatDuration(totalDuration)} Total</span>
          </div>

          <div className="tv-detail-actions">
            <FocusableButton
              focusId="album-btn-play"
              group="album-actions"
              label="Play Album"
              icon={<Play size={22} />}
              variant="primary"
              size="lg"
              autoFocus={true}
              onEnter={() => playAlbum(album)}
              onClick={() => playAlbum(album)}
            />

            <FocusableButton
              focusId="album-btn-shuffle"
              group="album-actions"
              label="Shuffle"
              icon={<Shuffle size={20} />}
              variant="secondary"
              size="lg"
              onEnter={() => playAlbum(album, undefined, true)}
              onClick={() => playAlbum(album, undefined, true)}
            />

            <FocusableButton
              focusId="album-btn-queue-all"
              group="album-actions"
              label="Add to Queue"
              icon={<Plus size={20} />}
              variant="secondary"
              size="lg"
              onEnter={() => addToQueue(tracks)}
              onClick={() => addToQueue(tracks)}
            />
          </div>
        </div>
      </section>

      {/* Tracklist */}
      <section className="tv-detail-tracklist-section" aria-label="Track List">
        <div className="tv-tracklist-header">
          <span className="tv-th-num">#</span>
          <span className="tv-th-title">TITLE</span>
          <span className="tv-th-codec">QUALITY</span>
          <span className="tv-th-duration">
            <Clock size={16} />
          </span>
        </div>

        <div className="tv-tracklist-rows">
          {tracks.map((track, idx) => {
            const isCurrentPlaying = currentTrack?.id === track.id;
            const isPlaying = isCurrentPlaying && playbackStatus === 'playing';

            return (
              <Focusable
                key={track.id}
                focusId={`track-row-${track.id}`}
                group="album-tracks"
                className={`tv-track-row ${isCurrentPlaying ? 'tv-track-playing' : ''}`}
                onEnter={() => playAlbum(album, track.id)}
                onClick={() => playAlbum(album, track.id)}
              >
                {({ isFocused }) => (
                  <div className={`tv-track-row-inner ${isFocused ? 'tv-track-focused' : ''}`}>
                    <span className="tv-td-num">
                      {isCurrentPlaying ? (
                        <EqualizerBars isPlaying={isPlaying} size="sm" />
                      ) : (
                        track.trackNumber || idx + 1
                      )}
                    </span>
                    <div className="tv-td-title-wrap">
                      <span className="tv-track-name">{track.title}</span>
                      <span className="tv-track-artist">{track.artist}</span>
                    </div>
                    <span className="tv-td-codec">
                      {track.codec || 'FLAC'} {track.bitrate ? `• ${track.bitrate}` : ''}
                    </span>
                    <span className="tv-td-duration">{formatDuration(track.duration)}</span>
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
