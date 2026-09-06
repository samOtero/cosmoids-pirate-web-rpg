'use client';

import { useState, useSyncExternalStore } from 'react';

import { Button } from './ui/Button';

type LaunchMode =
  | 'checking'
  | 'fullscreen'
  | 'install'
  | 'standalone'
  | 'browser';

type LegacyFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type OptionalStandardFullscreenElement = {
  requestFullscreen?: () => Promise<void>;
};

type StandaloneNavigator = Navigator & {
  standalone?: boolean;
};

const subscribeToDisplayMode = () => () => {};
const getServerLaunchMode = (): LaunchMode => 'checking';

function getLaunchMode(): LaunchMode {
  const root = document.documentElement as LegacyFullscreenElement;
  const standardRequest = (root as unknown as OptionalStandardFullscreenElement)
    .requestFullscreen;
  const matchesDisplayMode = (mode: 'standalone' | 'fullscreen') =>
    typeof window.matchMedia === 'function' &&
    window.matchMedia(`(display-mode: ${mode})`).matches;
  const isStandalone =
    matchesDisplayMode('standalone') ||
    matchesDisplayMode('fullscreen') ||
    Boolean((window.navigator as StandaloneNavigator).standalone);

  if (isStandalone) return 'standalone';

  if (standardRequest || root.webkitRequestFullscreen) {
    return 'fullscreen';
  }

  const isAppleMobile =
    /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
    (window.navigator.platform === 'MacIntel' &&
      window.navigator.maxTouchPoints > 1);

  return isAppleMobile ? 'install' : 'browser';
}

export default function FullscreenLauncher({
  onStart,
}: {
  onStart: () => void;
}) {
  const launchMode = useSyncExternalStore(
    subscribeToDisplayMode,
    getLaunchMode,
    getServerLaunchMode
  );
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);

  const startFullscreen = async () => {
    const root = document.documentElement as LegacyFullscreenElement;
    const standardRequest = (
      root as unknown as OptionalStandardFullscreenElement
    ).requestFullscreen;

    try {
      // Fullscreen must be requested directly from this button gesture.
      if (standardRequest) {
        await standardRequest.call(root);
      } else if (root.webkitRequestFullscreen) {
        await root.webkitRequestFullscreen();
      }

      onStart();
    } catch {
      setFullscreenError(true);
    }
  };

  if (launchMode === 'fullscreen' || launchMode === 'checking') {
    return (
      <div className="flex flex-col items-center gap-3">
        <Button
          variant="wood"
          onClick={startFullscreen}
          className="mt-8 px-12 py-4 text-xl"
        >
          Play Fullscreen
        </Button>
        <button
          type="button"
          onClick={onStart}
          className="rounded px-3 py-2 text-xs font-bold tracking-wider text-cyan-200/75 uppercase transition-colors hover:text-cyan-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          Play in Browser
        </button>
        {fullscreenError && (
          <p
            role="alert"
            className="max-w-sm text-center text-xs text-amber-200"
          >
            Fullscreen was blocked. Try again or continue in the browser.
          </p>
        )}
      </div>
    );
  }

  if (launchMode === 'install') {
    return (
      <>
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="wood"
            onClick={() => setShowInstallHelp(true)}
            className="mt-8 px-12 py-4 text-xl"
          >
            Install for Fullscreen
          </Button>
          <button
            type="button"
            onClick={onStart}
            className="rounded px-3 py-2 text-xs font-bold tracking-wider text-cyan-200/75 uppercase transition-colors hover:text-cyan-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            Play in Browser
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
                Play Fullscreen
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-sand/75">
                iPhone browsers cannot hide all browser controls for an
                interactive game tab. Install Cosmoids to open it like an app:
              </p>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-cyan-100">
                <li>Open your browser&apos;s Share menu.</li>
                <li>Choose Add to Home Screen.</li>
                <li>Open Cosmoids from its new Home Screen icon.</li>
              </ol>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowInstallHelp(false)}
                >
                  Close
                </Button>
                <Button variant="wood" onClick={onStart}>
                  Play in Browser
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <Button
      variant="wood"
      onClick={onStart}
      className="mt-8 px-12 py-4 text-xl"
    >
      Press Start
    </Button>
  );
}
