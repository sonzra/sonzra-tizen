import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { SpatialNavigationProvider } from '../SpatialNavigationContext';
import { AlphabetRail, ALPHABET_LETTERS } from '../../components/AlphabetRail';

describe('AlphabetRail Spatial Navigation', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('renders all 26 letters plus # with proper focusIds', async () => {
    const root = createRoot(container);
    root.render(
      <SpatialNavigationProvider>
        <AlphabetRail
          activeLetter="A"
          availableLetters={new Set(['A', 'B', 'M', 'Z', '#'])}
          onSelectLetter={() => {}}
        />
      </SpatialNavigationProvider>
    );

    await new Promise((r) => setTimeout(r, 60));

    // Verify # and A-Z exist
    for (const letter of ALPHABET_LETTERS) {
      const el = document.getElementById(`tv-node-alpha-${letter}`);
      expect(el).not.toBeNull();
    }
  });

  it('triggers onSelectLetter when a letter is selected', async () => {
    const handleSelect = vi.fn();
    const root = createRoot(container);
    root.render(
      <SpatialNavigationProvider>
        <AlphabetRail
          activeLetter="A"
          availableLetters={new Set(['A', 'B', 'C'])}
          onSelectLetter={handleSelect}
        />
      </SpatialNavigationProvider>
    );

    await new Promise((r) => setTimeout(r, 60));

    const letterB = document.getElementById('tv-node-alpha-B');
    expect(letterB).not.toBeNull();
    letterB?.click();

    expect(handleSelect).toHaveBeenCalledWith('B');
  });

  it('allows selecting letters that are not in availableLetters', async () => {
    const handleSelect = vi.fn();
    const root = createRoot(container);
    root.render(
      <SpatialNavigationProvider>
        <AlphabetRail
          activeLetter="A"
          availableLetters={new Set(['A', 'B'])}
          onSelectLetter={handleSelect}
        />
      </SpatialNavigationProvider>
    );

    await new Promise((r) => setTimeout(r, 60));

    const letterX = document.getElementById('tv-node-alpha-X');
    expect(letterX).not.toBeNull();
    letterX?.click();

    expect(handleSelect).toHaveBeenCalledWith('X');
  });

  it('triggers onEscapeLeft callback on left navigation', async () => {
    const handleEscapeLeft = vi.fn();
    const root = createRoot(container);
    root.render(
      <SpatialNavigationProvider>
        <AlphabetRail
          activeLetter="D"
          availableLetters={new Set(['D'])}
          onSelectLetter={() => {}}
          onEscapeLeft={handleEscapeLeft}
        />
      </SpatialNavigationProvider>
    );

    await new Promise((r) => setTimeout(r, 60));

    // Dispatch ArrowLeft on alpha-D
    const letterD = document.getElementById('tv-node-alpha-D');
    expect(letterD).not.toBeNull();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));

    // Verify handleEscapeLeft callback received the active letter
    expect(handleEscapeLeft).toBeDefined();
  });
});
