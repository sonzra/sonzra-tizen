import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { SpatialNavigationProvider } from '../../navigation/SpatialNavigationContext';
import { TvVirtualKeyboard } from '../TvVirtualKeyboard';

describe('TvVirtualKeyboard Component', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('renders all key rows and handles key press events', async () => {
    const onKeyPress = vi.fn();
    const onBackspace = vi.fn();
    const onClear = vi.fn();
    const onSubmit = vi.fn();

    const root = createRoot(container);
    root.render(
      <SpatialNavigationProvider>
        <TvVirtualKeyboard
          onKeyPress={onKeyPress}
          onBackspace={onBackspace}
          onClear={onClear}
          onSubmit={onSubmit}
          activeFieldLabel="Email Address"
        />
      </SpatialNavigationProvider>
    );

    // Wait for React commit
    await new Promise((resolve) => setTimeout(resolve, 50));

    const charA = document.querySelector('[data-focus-id="kb-char-a"]');
    expect(charA).not.toBeNull();
    charA?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onKeyPress).toHaveBeenCalledWith('a');

    const delBtn = document.querySelector('[data-focus-id="kb-btn-backspace"]');
    expect(delBtn).not.toBeNull();
    delBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onBackspace).toHaveBeenCalled();

    const clearBtn = document.querySelector('[data-focus-id="kb-btn-clear"]');
    expect(clearBtn).not.toBeNull();
    clearBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClear).toHaveBeenCalled();

    const gmailBtn = document.querySelector('[data-focus-id="kb-btn-gmail"]');
    expect(gmailBtn).not.toBeNull();
    gmailBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onKeyPress).toHaveBeenCalledWith('@gmail.com');
  });
});
