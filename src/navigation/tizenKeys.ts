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
      ];

      keysToRegister.forEach((keyName) => {
        try {
          window.tizen?.tvinputdevice?.registerKey(keyName);
          // console.log(`Registered Tizen TV key: ${keyName}`);
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

export function isMediaNext(e: KeyboardEvent): boolean {
  return e.keyCode === TIZEN_KEYS.MEDIA_TRACK_NEXT || e.key === 'MediaTrackNext';
}

export function isMediaPrev(e: KeyboardEvent): boolean {
  return e.keyCode === TIZEN_KEYS.MEDIA_TRACK_PREV || e.key === 'MediaTrackPrevious';
}
