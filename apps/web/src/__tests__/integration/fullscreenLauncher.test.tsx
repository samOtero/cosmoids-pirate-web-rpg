import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import FullscreenLauncher from '@/app/components/FullscreenLauncher';

describe('FullscreenLauncher', () => {
  afterEach(() => {
    Reflect.deleteProperty(document.documentElement, 'requestFullscreen');
    vi.restoreAllMocks();
  });

  it('enters fullscreen before starting on supported browsers', async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const onStart = vi.fn();
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    });

    render(<FullscreenLauncher onStart={onStart} />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Play Fullscreen' })
    );

    await waitFor(() => {
      expect(requestFullscreen).toHaveBeenCalledOnce();
      expect(onStart).toHaveBeenCalledOnce();
    });
  });

  it('offers Home Screen installation when iPhone fullscreen is unavailable', async () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'
    );

    render(<FullscreenLauncher onStart={() => {}} />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Install for Fullscreen' })
    );

    expect(
      screen.getByRole('dialog', { name: 'Play Fullscreen' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument();
  });

  it('always allows starting without fullscreen', async () => {
    const onStart = vi.fn();
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });

    render(<FullscreenLauncher onStart={onStart} />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Play in Browser' })
    );

    expect(onStart).toHaveBeenCalledOnce();
  });
});
