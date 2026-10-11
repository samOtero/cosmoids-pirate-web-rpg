'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Screens } from '@/types/baseGame';

type FullscreenMode =
  | 'checking'
  | 'windowed'
  | 'fullscreen'
  | 'install'
  | 'hidden';
type FullscreenRoot = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void> | void;
};

function subscribeToFullscreen(onChange: () => void) {
  document.addEventListener('fullscreenchange', onChange);
  document.addEventListener('webkitfullscreenchange', onChange);
  const displayModes = ['standalone', 'fullscreen'].map((mode) =>
    window.matchMedia?.(`(display-mode: ${mode})`)
  );
  displayModes.forEach((query) => query?.addEventListener('change', onChange));
  return () => {
    document.removeEventListener('fullscreenchange', onChange);
    document.removeEventListener('webkitfullscreenchange', onChange);
    displayModes.forEach((query) =>
      query?.removeEventListener('change', onChange)
    );
  };
}

function getFullscreenMode(): FullscreenMode {
  const root = document.documentElement as FullscreenRoot;
  const fullscreenDocument = document as FullscreenDocument;
  // Check the element first: display-mode can also change during DOM fullscreen.
  if (
    document.fullscreenElement ||
    fullscreenDocument.webkitFullscreenElement
  ) {
    return 'fullscreen';
  }
  if (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone
  ) {
    return 'hidden';
  }
  if (
    document.fullscreenEnabled !== false &&
    (typeof root.requestFullscreen === 'function' ||
      typeof root.webkitRequestFullscreen === 'function')
  ) {
    return 'windowed';
  }
  const isAppleMobile =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return isAppleMobile ? 'install' : 'hidden';
}

const getServerFullscreenMode = (): FullscreenMode => 'checking';

export default function FullscreenControl() {
  const screen = useGameStore((state) => state.currentScreen);
  if (
    screen !== Screens.START &&
    screen !== Screens.PROFILES &&
    screen !== Screens.MODE_SELECT &&
    screen !== Screens.LEVEL_SELECT &&
    screen !== Screens.CHALLENGE_SELECT &&
    screen !== Screens.PARTY
  ) {
    return null;
  }
  return <FullscreenToggle />;
}

function FullscreenToggle() {
  const mode = useSyncExternalStore(
    subscribeToFullscreen,
    getFullscreenMode,
    getServerFullscreenMode
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showInstallHelp) return;
    const toggleButton = toggleRef.current;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowInstallHelp(false);
      }
      // This dialog has one focusable control; keep keyboard focus inside it.
      if (event.key === 'Tab') {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      toggleButton?.focus();
    };
  }, [showInstallHelp]);

  const toggleFullscreen = async () => {
    if (mode === 'install') {
      setShowInstallHelp(true);
      return;
    }
    setBusy(true);
    setError(false);
    try {
      const root = document.documentElement as FullscreenRoot;
      const fullscreenDocument = document as FullscreenDocument;
      // Keep the request directly inside the click gesture for browser permission.
      if (mode === 'fullscreen') {
        if (typeof document.exitFullscreen === 'function')
          await document.exitFullscreen();
        else await fullscreenDocument.webkitExitFullscreen?.();
      } else if (typeof root.requestFullscreen === 'function') {
        await root.requestFullscreen();
      } else {
        await root.webkitRequestFullscreen?.();
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'checking' || mode === 'hidden') return null;
  const isFullscreen = mode === 'fullscreen';
  const label =
    mode === 'install'
      ? 'Install for fullscreen'
      : isFullscreen
        ? 'Exit fullscreen'
        : 'Enter fullscreen';

  return (
    <>
      <div className="fixed right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40">
        {error && (
          <div className="absolute right-0 bottom-14 w-64 rounded-lg border border-amber-300/40 bg-slate-950 p-3 text-sm text-amber-100 shadow-lg">
            <p role="alert">
              Couldn&apos;t change fullscreen. You can keep playing or try
              again.
            </p>
            <button
              type="button"
              onClick={() => setError(false)}
              className="mt-2 min-h-11 underline"
            >
              Dismiss
            </button>
          </div>
        )}
        <button
          ref={toggleRef}
          type="button"
          onClick={toggleFullscreen}
          disabled={busy}
          aria-label={label}
          aria-pressed={isFullscreen}
          title={label}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-200/30 bg-slate-950/85 text-cyan-100 shadow-lg transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:opacity-50"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path
              d={
                isFullscreen
                  ? 'M9 3v6H3m12-6v6h6M3 15h6v6m6 0v-6h6'
                  : 'M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6'
              }
            />
          </svg>
        </button>
      </div>
      {showInstallHelp && (
        <div
          className="fullscreen-install-overlay fixed inset-0 z-[2147483646] flex items-center justify-center bg-black/80"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fullscreen-install-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-cyan-200/25 bg-[#0a1628] p-6 text-left shadow-2xl">
            <h2
              id="fullscreen-install-title"
              className="text-2xl font-black tracking-wide text-sand uppercase"
            >
              Install for fullscreen
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-sand/75">
              This browser doesn&apos;t support game fullscreen. Install
              Cosmoids to open it like an app:
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-cyan-100">
              <li>Open your browser&apos;s Share menu.</li>
              <li>Choose Add to Home Screen.</li>
              <li>Open Cosmoids from its new Home Screen icon.</li>
            </ol>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setShowInstallHelp(false)}
              className="mt-6 min-h-11 rounded border border-cyan-200/40 px-4 py-2 text-cyan-100 hover:bg-cyan-200/10 focus-visible:outline-2 focus-visible:outline-cyan-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
