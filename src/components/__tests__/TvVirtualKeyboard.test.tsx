import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { SpatialNavigationProvider } from '../../navigation/SpatialNavigationContext';
import { TvVirtualKeyboard } from '../TvVirtualKeyboard';

describe('TvVirtualKeyboard Component', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
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

  it('provides colon (:) and slash (/) keys for typing URL and IP address with port', async () => {
    const onKeyPress = vi.fn();
    const root = createRoot(container);
    root.render(
      <SpatialNavigationProvider>
        <TvVirtualKeyboard
          onKeyPress={onKeyPress}
          onBackspace={() => {}}
          onClear={() => {}}
          activeFieldLabel="Server URL"
        />
      </SpatialNavigationProvider>
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Colon in numbers row (kb-num-10)
    const colonInNum = document.querySelector('[data-focus-id="kb-num-10"]');
    expect(colonInNum).not.toBeNull();
    colonInNum?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onKeyPress).toHaveBeenCalledWith(':');

    // Colon in row 3 (kb-char-colon)
    const colonInRow3 = document.querySelector('[data-focus-id="kb-char-colon"]');
    expect(colonInRow3).not.toBeNull();
    colonInRow3?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onKeyPress).toHaveBeenCalledWith(':');

    // Slash in row 3 (kb-char-slash)
    const slashInRow3 = document.querySelector('[data-focus-id="kb-char-slash"]');
    expect(slashInRow3).not.toBeNull();
    slashInRow3?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onKeyPress).toHaveBeenCalledWith('/');

    // Quick port helper :3000 (kb-btn-port)
    const portBtn = document.querySelector('[data-focus-id="kb-btn-port"]');
    expect(portBtn).not.toBeNull();
    portBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onKeyPress).toHaveBeenCalledWith(':3000');

    // Quick http:// helper (kb-btn-gmail in server mode)
    const httpBtn = document.querySelector('[data-focus-id="kb-btn-gmail"]');
    expect(httpBtn).not.toBeNull();
    httpBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onKeyPress).toHaveBeenCalledWith('http://');
  });
});
