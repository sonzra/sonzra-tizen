import { Direction } from '../types/navigation';

// Samsung Tizen TV Remote Control Key Handling

export const TIZEN_KEYS = {
  // Navigation
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  ENTER: 13,
  RETURN: 10009, // Tizen TV hardware Return / Back key
  ESCAPE: 27,
  BACKSPACE: 8,

  // Alternative Tizen TV Remote Arrow codes
  TIZEN_UP: 29460,
  TIZEN_DOWN: 29461,
  TIZEN_LEFT: 4,
  TIZEN_RIGHT: 5,

  // Samsung TV Hardware Media Keys
  MEDIA_PLAY: 415,
  MEDIA_PAUSE: 19,
  MEDIA_PLAY_PAUSE: 10252,
  MEDIA_STOP: 413,
  MEDIA_TRACK_PREV: 10232,
  MEDIA_TRACK_NEXT: 10233,
  MEDIA_REWIND: 412,
  MEDIA_FAST_FORWARD: 417,

  // Volume & Channel
  VOLUME_UP: 447,
  VOLUME_DOWN: 448,
  VOLUME_MUTE: 449,

  // Samsung TV Color Keys
  COLOR_RED: 403,
  COLOR_GREEN: 404,
  COLOR_YELLOW: 405,
  COLOR_BLUE: 406,
} as const;

export function registerTizenKeys(): void {
  try {
    if (typeof window !== 'undefined' && window.tizen?.tvinputdevice?.registerKey) {
      const keysToRegister = [
        'MediaPlay',
        'MediaPause',
        'MediaPlayPause',
        'MediaStop',
        'MediaFastForward',
        'MediaRewind',
        'MediaTrackPrevious',
        'MediaTrackNext',
        'ColorF1Green',
        'ColorF0Red',
      ];

      keysToRegister.forEach((keyName) => {
        try {
          window.tizen?.tvinputdevice?.registerKey(keyName);
        } catch (err) {
          console.warn(`Could not register Tizen key "${keyName}":`, err);
        }
      });
    }
  } catch (e) {
    console.warn('Error during Tizen key registration:', e);
  }
}

export function isEnterKey(e: KeyboardEvent): boolean {
  return e.keyCode === TIZEN_KEYS.ENTER || e.key === 'Enter';
}

export function isBackKey(e: KeyboardEvent): boolean {
  return (
    e.keyCode === TIZEN_KEYS.RETURN ||
    e.keyCode === TIZEN_KEYS.ESCAPE ||
    e.key === 'Escape' ||
    e.key === 'GoBack' ||
    e.key === 'BrowserBack'
  );
}

export function getDirectionFromEvent(e: KeyboardEvent): Direction | null {
  if (
    e.keyCode === TIZEN_KEYS.UP ||
    e.keyCode === TIZEN_KEYS.TIZEN_UP ||
    e.key === 'ArrowUp' ||
    e.key === 'Up'
  ) {
    return 'up';
  }
  if (
    e.keyCode === TIZEN_KEYS.DOWN ||
    e.keyCode === TIZEN_KEYS.TIZEN_DOWN ||
    e.key === 'ArrowDown' ||
    e.key === 'Down'
  ) {
    return 'down';
  }
  if (
    e.keyCode === TIZEN_KEYS.LEFT ||
    e.keyCode === TIZEN_KEYS.TIZEN_LEFT ||
    e.key === 'ArrowLeft' ||
    e.key === 'Left'
  ) {
    return 'left';
  }
  if (
    e.keyCode === TIZEN_KEYS.RIGHT ||
    e.keyCode === TIZEN_KEYS.TIZEN_RIGHT ||
    e.key === 'ArrowRight' ||
    e.key === 'Right'
  ) {
    return 'right';
  }
  return null;
}

export function isMediaPlayPause(e: KeyboardEvent): boolean {
  return (
    e.keyCode === TIZEN_KEYS.MEDIA_PLAY_PAUSE ||
    e.key === 'MediaPlayPause' ||
    e.key === 'PlayPause'
  );
}

export function isMediaPlay(e: KeyboardEvent): boolean {
  return e.keyCode === TIZEN_KEYS.MEDIA_PLAY || e.key === 'MediaPlay';
}

export function isMediaPause(e: KeyboardEvent): boolean {
  return e.keyCode === TIZEN_KEYS.MEDIA_PAUSE || e.key === 'MediaPause';
}

export function isMediaStop(e: KeyboardEvent): boolean {
  return e.keyCode === TIZEN_KEYS.MEDIA_STOP || e.key === 'MediaStop';
}

export function isMediaNext(e: KeyboardEvent): boolean {
  return e.keyCode === TIZEN_KEYS.MEDIA_TRACK_NEXT || e.key === 'MediaTrackNext';
}

export function isMediaPrev(e: KeyboardEvent): boolean {
  return e.keyCode === TIZEN_KEYS.MEDIA_TRACK_PREV || e.key === 'MediaTrackPrevious';
}

export function isMediaFastForward(e: KeyboardEvent): boolean {
  return (
    e.keyCode === TIZEN_KEYS.MEDIA_FAST_FORWARD ||
    e.key === 'MediaFastForward' ||
    e.key === 'FastForward'
  );
}

export function isMediaRewind(e: KeyboardEvent): boolean {
  return (
    e.keyCode === TIZEN_KEYS.MEDIA_REWIND ||
    e.key === 'MediaRewind' ||
    e.key === 'Rewind'
  );
}

export function isPlayerShortcut(e: KeyboardEvent): boolean {
  return (
    e.keyCode === TIZEN_KEYS.COLOR_GREEN ||
    e.key === 'ColorF1Green' ||
    (e.key === 'p' && !e.ctrlKey && !e.metaKey && !e.altKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement))
  );
}
