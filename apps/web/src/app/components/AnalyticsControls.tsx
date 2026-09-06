'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Screens } from '@/types/baseGame';
import {
  ANALYTICS_PREFERENCE_KEY,
  AnalyticsPreference,
  getAnalyticsPreference,
  setAnalyticsPreference,
  trackGameEvent,
} from '@/utils/analytics';

export default function AnalyticsControls() {
  const screen = useGameStore((state) => state.currentScreen);
  const [preference, setPreference] = useState<AnalyticsPreference>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [feedback, setFeedback] = useState('confusing_controls');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const sync = () => {
      setPreference(getAnalyticsPreference());
      setReady(true);
    };
    const storage = (event: StorageEvent) => {
      if (event.key === ANALYTICS_PREFERENCE_KEY || event.key === null) {
        setAnalyticsPreference(
          event.newValue === 'allowed' ? 'allowed' : 'declined'
        );
      }
    };
    sync();
    window.addEventListener('cosmoids-analytics-preference', sync);
    window.addEventListener('storage', storage);
    let errors = 0;
    const onError = () => {
      if (errors++ < 5)
        void trackGameEvent('game_error', {
          kind: 'uncaught_error',
          screen: useGameStore.getState().currentScreen,
        });
    };
    const onRejection = () => {
      if (errors++ < 5)
        void trackGameEvent('game_error', {
          kind: 'unhandled_rejection',
          screen: useGameStore.getState().currentScreen,
        });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('cosmoids-analytics-preference', sync);
      window.removeEventListener('storage', storage);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  // Keep controls off the battlefield and dialogue so they never cover game actions.
  if (
    !ready ||
    screen === Screens.TOWER_DEFENSE ||
    screen === Screens.DIALOG ||
    screen === Screens.PARTY ||
    screen === Screens.COSMOID_CODEX
  )
    return null;

  const choose = (value: 'allowed' | 'declined') => {
    setAnalyticsPreference(value);
    setOpen(false);
  };
  const buttonClass =
    'rounded border border-cyan-600 px-3 py-2 text-sm hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-cyan-300';

  return (
    <aside
      className="fixed right-3 bottom-3 z-[10001] max-w-[calc(100vw-1.5rem)] text-slate-100"
      aria-label="Gameplay analytics and feedback"
    >
      {open || preference === null ? (
        <div className="max-h-[70dvh] w-80 max-w-full overflow-y-auto rounded-xl border border-slate-600 bg-slate-950 p-4 shadow-xl">
          <p className="font-bold">Help improve Cosmoids</p>
          <p className="mt-2 text-sm text-slate-300">
            Allow optional gameplay analytics? We send level attempts, results,
            creature choices, basic device information, and error counts to
            PostHog in the US. A random browser ID helps measure return visits.
            No player names or recordings.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            You can change this choice here anytime. Declining does not affect
            play.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={buttonClass} onClick={() => choose('allowed')}>
              {preference === 'allowed' ? 'Keep enabled' : 'Allow analytics'}
            </button>
            <button className={buttonClass} onClick={() => choose('declined')}>
              {preference === 'allowed' ? 'Turn off' : 'No thanks'}
            </button>
          </div>
          {preference === 'allowed' && (
            <form
              className="mt-4 border-t border-slate-700 pt-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (submitted) return;
                void trackGameEvent('feedback_submitted', {
                  category: feedback,
                  screen,
                });
                setSubmitted(true);
              }}
            >
              <label htmlFor="game-feedback" className="text-sm">
                How is the game feeling?
              </label>
              <select
                id="game-feedback"
                value={feedback}
                onChange={(event) => {
                  setFeedback(event.target.value);
                  setSubmitted(false);
                }}
                className="mt-2 w-full rounded bg-slate-800 p-2 text-sm"
              >
                <option value="confusing_controls">
                  Controls are confusing
                </option>
                <option value="too_difficult">Battles are too difficult</option>
                <option value="too_easy">Battles are too easy</option>
                <option value="performance">The game runs slowly</option>
                <option value="enjoying">I am enjoying it</option>
              </select>
              <button className={`${buttonClass} mt-2`} disabled={submitted}>
                {submitted ? 'Thanks! Feedback queued' : 'Send feedback'}
              </button>
            </form>
          )}
          {preference !== null && (
            <button
              className="mt-3 text-sm underline"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          )}
        </div>
      ) : (
        <button
          className="rounded bg-slate-950/90 px-3 py-2 text-xs text-slate-300 hover:text-white"
          onClick={() => setOpen(true)}
        >
          Privacy &amp; feedback
        </button>
      )}
    </aside>
  );
}
