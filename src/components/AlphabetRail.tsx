import React from 'react';
import { Focusable } from '../navigation/Focusable';

export const ALPHABET_LETTERS = [
  '#',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

interface AlphabetRailProps {
  activeLetter?: string;
  availableLetters?: Set<string>;
  onSelectLetter: (letter: string) => void;
  onEscapeLeft?: (letter: string) => void;
}

export const AlphabetRail: React.FC<AlphabetRailProps> = ({
  activeLetter,
  availableLetters,
  onSelectLetter,
  onEscapeLeft,
}) => {
  return (
    <nav
      className="sticky top-6 flex flex-col items-center gap-0.5 py-2 px-1.5 rounded-2xl bg-surface-container-low/80 backdrop-blur-md border border-white/[0.04] shadow-lg select-none z-20 shrink-0"
      aria-label="Alphabet Jump Navigation"
    >
      {ALPHABET_LETTERS.map((letter) => {
        const isAvailable = !availableLetters || availableLetters.has(letter);
        const isActive = activeLetter === letter;
        const focusId = `alpha-${letter}`;

        return (
          <Focusable
            key={letter}
            focusId={focusId}
            group="alphabet-rail"
            className="rounded-md"
            onFocus={() => {
              onSelectLetter(letter);
            }}
            onEnter={() => {
              onSelectLetter(letter);
            }}
            onArrow={(direction) => {
              if (direction === 'left') {
                if (onEscapeLeft) {
                  onEscapeLeft(letter);
                  return true;
                }
              }
              if (direction === 'right') {
                // Right barrier: stay in alphabet rail
                return true;
              }
              return false;
            }}
          >
            {({ isFocused }) => (
              <button
                type="button"
                className={`w-7 h-5.5 flex items-center justify-center rounded text-[11px] font-mono font-bold transition-all duration-75 cursor-pointer ${
                  isFocused
                    ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_12px_rgba(73,220,202,0.9)] scale-125 z-10'
                    : isActive
                    ? 'bg-primary-container text-on-primary-container font-extrabold shadow-sm'
                    : isAvailable
                    ? 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                    : 'text-outline/40 opacity-40'
                }`}
                title={`Jump to ${letter}`}
              >
                {letter}
              </button>
            )}
          </Focusable>
        );
      })}
    </nav>
  );
};
