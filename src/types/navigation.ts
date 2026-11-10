export type Direction = 'up' | 'down' | 'left' | 'right';

export interface FocusableNode {
  id: string;
  group?: string;
  element: HTMLElement;
  onEnter?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onArrow?: (direction: Direction) => boolean | void; // return true if handled
  priority?: number;
}

export type ActiveView = 
  | 'home'
  | 'library'
  | 'albums'
  | 'album-detail'
  | 'artists'
  | 'artist-detail'
  | 'now-playing'
  | 'settings'
  | 'search';
