import React, { useState } from 'react';
import { Focusable } from '../navigation/Focusable';

interface TvVirtualKeyboardProps {
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit?: () => void;
  activeFieldLabel?: string;
}

export const TvVirtualKeyboard: React.FC<TvVirtualKeyboardProps> = ({
  onKeyPress,
  onBackspace,
  onClear,
  onSubmit,
  activeFieldLabel = 'Input',
}) => {
  const [isUppercase, setIsUppercase] = useState<boolean>(false);

  const isServerField =
    activeFieldLabel.toLowerCase().includes('server') ||
    activeFieldLabel.toLowerCase().includes('url');

  const numberRow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ':', '.'];
  const row1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const row2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '@', '_'];
  const row3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm', '-', '/', ':', '.com'];

  const handleKeyClick = (char: string) => {
    const output = isUppercase ? char.toUpperCase() : char;
    onKeyPress(output);
  };

  const renderKey = (keyId: string, label: string, onClick: () => void, extraClass = '') => (
    <Focusable
      key={keyId}
      focusId={keyId}
      group="tv-keyboard"
      className={`rounded-xl cursor-pointer transition-all ${extraClass}`}
      onEnter={onClick}
      onClick={onClick}
    >
      {({ isFocused }) => (
        <div
          className={`h-12 flex items-center justify-center font-mono font-bold rounded-xl transition-all duration-150 select-none ${
            isFocused
              ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_24px_rgba(73,220,202,0.85)] scale-110 z-20'
              : 'bg-surface-container-high/90 text-on-surface hover:bg-surface-container-highest border border-white/[0.04]'
          } ${extraClass}`}
        >
          {label}
        </div>
      )}
    </Focusable>
  );

  return (
    <div
      className="flex flex-col gap-2 p-5 rounded-2xl bg-surface-container-lowest/90 backdrop-blur-xl border border-white/[0.06] shadow-2xl max-w-3xl w-full"
      role="region"
      aria-label={`On-Screen Keyboard for ${activeFieldLabel}`}
    >
      {/* Keyboard Header / Hints */}
      <div className="flex items-center justify-between px-2 mb-1 text-[12px] font-mono text-outline">
        <span className="text-secondary font-semibold uppercase tracking-wider">
          TV KEYBOARD · EDITING: {activeFieldLabel}
        </span>
        <span>Use Remote D-Pad & [ENTER] to Type</span>
      </div>

      {/* Row 0: Numbers + Colon + Dot */}
      <div className="grid grid-cols-12 gap-1.5 w-full">
        {numberRow.map((n, i) =>
          renderKey(`kb-num-${i}`, n, () => handleKeyClick(n), 'w-full text-[16px]')
        )}
      </div>

      {/* Row 1: Q-P */}
      <div className="grid grid-cols-10 gap-1.5 w-full">
        {row1.map((char) => {
          const display = isUppercase ? char.toUpperCase() : char;
          return renderKey(`kb-char-${char}`, display, () => handleKeyClick(display), 'w-full text-[16px]');
        })}
      </div>

      {/* Row 2: A-L + @ + _ */}
      <div className="grid grid-cols-11 gap-1.5 w-full">
        {row2.map((char) => {
          const display = isUppercase ? char.toUpperCase() : char;
          return renderKey(`kb-char-${char}`, display, () => handleKeyClick(display), 'w-full text-[16px]');
        })}
      </div>

      {/* Row 3: Z-M + - + / + : + .com */}
      <div className="grid grid-cols-11 gap-1.5 w-full">
        {row3.map((char) => {
          const display = isUppercase ? char.toUpperCase() : char;
          const isDomain = char.startsWith('.');
          const safeKeyId =
            char === '.'
              ? 'dot'
              : char === ':'
              ? 'colon'
              : char === '/'
              ? 'slash'
              : char === '-'
              ? 'dash'
              : char.replace('.', 'dot-');

          return renderKey(
            `kb-char-${safeKeyId}`,
            display,
            () => (isDomain ? onKeyPress(char) : handleKeyClick(display)),
            `w-full text-[15px] ${isDomain ? 'font-sans text-[13px] text-secondary font-semibold' : ''}`
          );
        })}
      </div>

      {/* Row 4: Action & Space Bar Controls */}
      <div className="flex items-center gap-2 mt-1.5 w-full">
        {/* Caps Lock Toggle */}
        <Focusable
          focusId="kb-btn-caps"
          group="tv-keyboard"
          className="flex-1 rounded-xl cursor-pointer"
          onEnter={() => setIsUppercase((prev) => !prev)}
          onClick={() => setIsUppercase((prev) => !prev)}
        >
          {({ isFocused }) => (
            <div
              className={`h-12 flex items-center justify-center gap-1.5 rounded-xl font-mono text-[13px] font-bold transition-all ${
                isFocused
                  ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.85)] scale-105'
                  : isUppercase
                  ? 'bg-secondary/20 text-secondary border border-secondary/40'
                  : 'bg-surface-container-high text-on-surface border border-white/[0.04]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isUppercase ? 'keyboard_capslock_badge' : 'keyboard_capslock'}
              </span>
              <span>{isUppercase ? 'CAPS ON' : 'CAPS'}</span>
            </div>
          )}
        </Focusable>

        {/* Spacebar */}
        <Focusable
          focusId="kb-btn-space"
          group="tv-keyboard"
          className="flex-[2] rounded-xl cursor-pointer"
          onEnter={() => onKeyPress(' ')}
          onClick={() => onKeyPress(' ')}
        >
          {({ isFocused }) => (
            <div
              className={`h-12 flex items-center justify-center rounded-xl font-mono text-[13px] font-bold transition-all ${
                isFocused
                  ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.85)] scale-105'
                  : 'bg-surface-container-high text-on-surface border border-white/[0.04]'
              }`}
            >
              SPACE
            </div>
          )}
        </Focusable>

        {/* Quick Helper Chip: @gmail.com for email OR http:// for server */}
        <Focusable
          focusId="kb-btn-gmail"
          group="tv-keyboard"
          className="flex-1 rounded-xl cursor-pointer"
          onEnter={() => onKeyPress(isServerField ? 'http://' : '@gmail.com')}
          onClick={() => onKeyPress(isServerField ? 'http://' : '@gmail.com')}
        >
          {({ isFocused }) => (
            <div
              className={`h-12 flex items-center justify-center rounded-xl font-mono text-[12px] font-bold text-secondary transition-all ${
                isFocused
                  ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.85)] scale-105'
                  : 'bg-surface-container-high border border-white/[0.04]'
              }`}
            >
              {isServerField ? 'http://' : '@gmail.com'}
            </div>
          )}
        </Focusable>

        {/* Quick Port 3000 Chip when in Server URL mode */}
        {isServerField && (
          <Focusable
            focusId="kb-btn-port"
            group="tv-keyboard"
            className="flex-1 rounded-xl cursor-pointer"
            onEnter={() => onKeyPress(':3000')}
            onClick={() => onKeyPress(':3000')}
          >
            {({ isFocused }) => (
              <div
                className={`h-12 flex items-center justify-center rounded-xl font-mono text-[12px] font-bold text-secondary transition-all ${
                  isFocused
                    ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.85)] scale-105'
                    : 'bg-surface-container-high border border-white/[0.04]'
                }`}
              >
                :3000
              </div>
            )}
          </Focusable>
        )}

        {/* Backspace */}
        <Focusable
          focusId="kb-btn-backspace"
          group="tv-keyboard"
          className="flex-1 rounded-xl cursor-pointer"
          onEnter={onBackspace}
          onClick={onBackspace}
        >
          {({ isFocused }) => (
            <div
              className={`h-12 flex items-center justify-center gap-1.5 rounded-xl font-mono text-[13px] font-bold transition-all ${
                isFocused
                  ? 'bg-secondary text-surface-container-lowest ring-2 ring-secondary shadow-[0_0_20px_rgba(73,220,202,0.85)] scale-105'
                  : 'bg-surface-container-high text-on-surface border border-white/[0.04]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">backspace</span>
              <span>DEL</span>
            </div>
          )}
        </Focusable>

        {/* Clear */}
        <Focusable
          focusId="kb-btn-clear"
          group="tv-keyboard"
          className="flex-1 rounded-xl cursor-pointer"
          onEnter={onClear}
          onClick={onClear}
        >
          {({ isFocused }) => (
            <div
              className={`h-12 flex items-center justify-center rounded-xl font-mono text-[13px] font-bold transition-all ${
                isFocused
                  ? 'bg-error text-on-error ring-2 ring-error shadow-[0_0_20px_rgba(255,100,100,0.8)] scale-105'
                  : 'bg-surface-container-high text-on-surface-variant border border-white/[0.04]'
              }`}
            >
              CLEAR
            </div>
          )}
        </Focusable>

        {/* Submit / Done */}
        {onSubmit && (
          <Focusable
            focusId="kb-btn-submit"
            group="tv-keyboard"
            className="flex-1 rounded-xl cursor-pointer"
            onEnter={onSubmit}
            onClick={onSubmit}
          >
            {({ isFocused }) => (
              <div
                className={`h-12 flex items-center justify-center gap-1.5 rounded-xl font-mono text-[13px] font-bold transition-all ${
                  isFocused
                    ? 'bg-primary-container text-on-primary-container ring-2 ring-secondary shadow-[0_0_24px_rgba(122,90,248,0.8)] scale-105'
                    : 'bg-primary-container/80 text-on-primary-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">done</span>
                <span>DONE</span>
              </div>
            )}
          </Focusable>
        )}
      </div>
    </div>
  );
};
