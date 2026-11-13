import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
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
  let root: Root | null = null;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (root) {
      root.unmount();
      root = null;
    }
    document.body.innerHTML = '';
  });

  it('resets container scrollTop to 0 when top-anchor node is focused', async () => {
    root = createRoot(container);
    root.render(
      <SpatialNavigationProvider>
        <TestApp />
      </SpatialNavigationProvider>
    );

    // Wait until shelf-item-1 is registered and autoFocus has focused it
    for (let i = 0; i < 50; i++) {
      const shelfNode = document.getElementById('tv-node-shelf-item-1');
      const heroNode = document.getElementById('tv-node-hero-resume');
      if (shelfNode?.classList.contains('tv-focused') && heroNode) {
        break;
      }
      await new Promise((r) => setTimeout(r, 20));
    }

    const scrollContainer = document.getElementById('tv-main-scroll-container')!;
    expect(scrollContainer).not.toBeNull();

    let currentScrollTop = 320;
    Object.defineProperty(scrollContainer, 'scrollTop', {
      get: () => currentScrollTop,
      set: (val) => {
        currentScrollTop = val;
      },
      configurable: true,
    });

    const scrollToSpy = vi.fn((options: any) => {
      if (typeof options === 'object' && options.top !== undefined) {
        currentScrollTop = options.top;
      }
    });
    scrollContainer.scrollTo = scrollToSpy;

    const btn = document.getElementById('btn-trigger') as HTMLButtonElement;
    btn.click();

    for (let i = 0; i < 50; i++) {
      if (scrollToSpy.mock.calls.length > 0) break;
      await new Promise((r) => setTimeout(r, 20));
    }

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    expect(scrollContainer.scrollTop).toBe(0);
  });
});
