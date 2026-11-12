import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { SpatialNavigationProvider, useSpatialNav } from '../SpatialNavigationContext';
import { Focusable } from '../Focusable';

const TestApp: React.FC = () => {
  const { setFocus } = useSpatialNav();
  return (
    <div id="wrapper">
      <div id="tv-main-scroll-container" style={{ height: '500px', overflowY: 'auto' }}>
        <Focusable focusId="hero-resume" group="hero-actions">
          {({ isFocused }) => <button id="btn-hero">{isFocused ? 'Focused Hero' : 'Hero'}</button>}
        </Focusable>
        <Focusable focusId="shelf-item-1" group="recent-shelf" autoFocus={true}>
          {({ isFocused }) => <button id="btn-shelf">{isFocused ? 'Focused Shelf' : 'Shelf'}</button>}
        </Focusable>
      </div>
      <button id="btn-trigger" onClick={() => setFocus('hero-resume')}>
        Focus Hero
      </button>
    </div>
  );
};

describe('Dashboard Top Header Scroll Restoration', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('resets container scrollTop to 0 when top-anchor node is focused', async () => {
    const root = createRoot(container);
    root.render(
      <SpatialNavigationProvider>
        <TestApp />
      </SpatialNavigationProvider>
    );

    await new Promise((r) => setTimeout(r, 80));

    const scrollContainer = document.getElementById('tv-main-scroll-container')!;
    scrollContainer.scrollTop = 320;
    const scrollToSpy = vi.fn((options: any) => {
      if (typeof options === 'object' && options.top !== undefined) {
        scrollContainer.scrollTop = options.top;
      }
    });
    scrollContainer.scrollTo = scrollToSpy;

    const btn = document.getElementById('btn-trigger') as HTMLButtonElement;
    btn.click();

    await new Promise((r) => setTimeout(r, 50));

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    expect(scrollContainer.scrollTop).toBe(0);
  });
});
