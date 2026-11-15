import { describe, it, expect, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { SpatialNavigationProvider } from '../../navigation/SpatialNavigationContext';
import { Sidebar } from '../Sidebar';

describe('Sidebar Component - Brand Logo & Spatial Navigation (Issue #31)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('renders official Sonzra logo in sidebar-brand instead of placeholder Activity icon', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <SpatialNavigationProvider>
          <Sidebar />
        </SpatialNavigationProvider>
      );
    });

    const brandFocusable = container.querySelector('[data-focus-id="sidebar-brand"]');
    expect(brandFocusable).not.toBeNull();

    const brandImg = brandFocusable?.querySelector('img');
    expect(brandImg).not.toBeNull();
    expect(brandImg?.getAttribute('src')).toBe('./sonzra-mark.svg');
    expect(brandImg?.getAttribute('alt')).toBe('Sonzra');

    // Ensure no placeholder lucide Activity icon (which renders SVG with lucide-activity class) is inside sidebar-brand
    const activitySvg = brandFocusable?.querySelector('svg.lucide-activity');
    expect(activitySvg).toBeNull();
  });
});
