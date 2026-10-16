import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import FullscreenControl from '@/app/components/FullscreenControl';
import StartScreen from '@/app/components/startScreen';
import { useGameStore } from '@/store/gameStore';
import { Screens } from '@/types/baseGame';

vi.mock('@/utils/analytics', () => ({ trackGameEvent: vi.fn() }));

function setFullscreenElement(element: Element | null) {
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    value: element,
  });
  document.dispatchEvent(new Event('fullscreenchange'));
}

describe('separate play and fullscreen controls', () => {
  beforeEach(() => {
    act(() => useGameStore.setState({ currentScreen: Screens.START }));
  });

  afterEach(() => {
    Reflect.deleteProperty(document.documentElement, 'requestFullscreen');
    Reflect.deleteProperty(document.documentElement, 'webkitRequestFullscreen');
    Reflect.deleteProperty(document, 'fullscreenElement');
    Reflect.deleteProperty(document, 'webkitFullscreenElement');
    Reflect.deleteProperty(document, 'fullscreenEnabled');
    Reflect.deleteProperty(document, 'exitFullscreen');
    Reflect.deleteProperty(document, 'webkitExitFullscreen');
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function mockRequest(implementation = async () => {}) {
    const request = vi.fn(implementation);
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: request,
    });
    return request;
  }

  it.each(Object.values(Screens))(
    'only offers fullscreen on supported menus: %s',
    (currentScreen) => {
      mockRequest();
      useGameStore.setState({ currentScreen });
      render(<FullscreenControl />);
      const button = screen.queryByRole('button', { name: 'Enter fullscreen' });
      if (
        [
          Screens.START,
          Screens.PROFILES,
          Screens.MODE_SELECT,
          Screens.LEVEL_SELECT,
          Screens.CHALLENGE_SELECT,
          Screens.PARTY,
        ].includes(currentScreen)
      ) {
        expect(button).toBeInTheDocument();
      } else {
        expect(button).not.toBeInTheDocument();
      }
    }
  );

  it('keeps fullscreen active while hidden and restores the exit toggle when returning to a menu', async () => {
    mockRequest(async () => setFullscreenElement(document.documentElement));
    const exit = vi.fn();
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exit,
    });
    render(<FullscreenControl />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }));
    await screen.findByRole('button', { name: 'Exit fullscreen' });
    act(() => useGameStore.setState({ currentScreen: Screens.DIALOG }));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    act(() => useGameStore.setState({ currentScreen: Screens.TOWER_DEFENSE }));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(exit).not.toHaveBeenCalled();
    expect(document.fullscreenElement).toBe(document.documentElement);
    act(() => useGameStore.setState({ currentScreen: Screens.PARTY }));
    expect(
      screen.getByRole('button', { name: 'Exit fullscreen' })
    ).toBeInTheDocument();
  });

  it('starts guest play without requesting fullscreen; fullscreen never starts play', async () => {
    const request = mockRequest();
    const onStart = vi.fn();
    render(
      <>
        <StartScreen onStart={onStart} />
        <FullscreenControl />
      </>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Play offline' }));
    expect(onStart).toHaveBeenCalledOnce();
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }));
    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('tracks entry, exits on click, and tracks exits from browser controls', async () => {
    mockRequest(async () => setFullscreenElement(document.documentElement));
    const exit = vi.fn(async () => setFullscreenElement(null));
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exit,
    });
    render(<FullscreenControl />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }));
    const exitButton = await screen.findByRole('button', {
      name: 'Exit fullscreen',
    });
    await waitFor(() => expect(exitButton).toBeEnabled());
    expect(exitButton).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(exitButton);
    await waitFor(() => expect(exit).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Enter fullscreen' })
      ).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }));
    await screen.findByRole('button', { name: 'Exit fullscreen' });
    act(() => setFullscreenElement(null));
    expect(
      screen.getByRole('button', { name: 'Enter fullscreen' })
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('lets the player retry after a browser rejects fullscreen', async () => {
    const request = mockRequest(async () => {
      throw new Error('blocked');
    });
    render(<FullscreenControl />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/keep playing/);
    const button = screen.getByRole('button', { name: 'Enter fullscreen' });
    expect(button).toBeEnabled();
    request.mockResolvedValueOnce(undefined);
    fireEvent.click(button);
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('offers iPhone installation separately, with keyboard dismissal and focus return', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'
    );
    render(<FullscreenControl />);
    const button = screen.getByRole('button', {
      name: 'Install for fullscreen',
    });
    fireEvent.click(button);
    expect(screen.getByRole('dialog')).toHaveTextContent('Add to Home Screen');
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('hides the toggle when fullscreen is unavailable or forbidden', () => {
    const { rerender } = render(<FullscreenControl />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    mockRequest();
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      value: false,
    });
    rerender(<FullscreenControl />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('hides it in installed apps but retains an exit button during DOM fullscreen', () => {
    mockRequest();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    );
    render(<FullscreenControl />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    act(() => setFullscreenElement(document.documentElement));
    expect(
      screen.getByRole('button', { name: 'Exit fullscreen' })
    ).toBeInTheDocument();
  });

  it('supports browsers with prefixed fullscreen methods and events', async () => {
    const request = vi.fn(async () => {
      Object.defineProperty(document, 'webkitFullscreenElement', {
        configurable: true,
        value: document.documentElement,
      });
      document.dispatchEvent(new Event('webkitfullscreenchange'));
    });
    const exit = vi.fn(async () => {
      Reflect.deleteProperty(document, 'webkitFullscreenElement');
      document.dispatchEvent(new Event('webkitfullscreenchange'));
    });
    Object.defineProperty(document.documentElement, 'webkitRequestFullscreen', {
      configurable: true,
      value: request,
    });
    Object.defineProperty(document, 'webkitExitFullscreen', {
      configurable: true,
      value: exit,
    });
    render(<FullscreenControl />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }));
    const button = await screen.findByRole('button', {
      name: 'Exit fullscreen',
    });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    await waitFor(() => expect(exit).toHaveBeenCalledOnce());
    expect(
      screen.getByRole('button', { name: 'Enter fullscreen' })
    ).toBeInTheDocument();
  });
});
