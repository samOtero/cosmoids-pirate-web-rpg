'use client';

import { Profile, StoryProgression } from '@/types/baseGame';
import { Button } from '@/app/components/ui/Button';

// Kip introduces the journal after Level 3, so keep it hidden until that
// story milestone has been reached.
const CODEX_PREVIEW_ENABLED = false;

interface ModeSelectScreenProps {
  profile: Profile;
  onSelectStory: () => void;
  onSelectChallenge: () => void;
  onSelectCodex: () => void;
  onBack: () => void;
}

export default function ModeSelectScreen({
  profile,
  onSelectStory,
  onSelectChallenge,
  onSelectCodex,
  onBack,
}: ModeSelectScreenProps) {
  const showCodex =
    CODEX_PREVIEW_ENABLED ||
    profile.storyProgression >= StoryProgression.DEFEAT_BUG_STAGE_2;
  const showJournalNewBadge = showCodex && !profile.journalOpened;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0a1628]">
      {/* Animated background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at 20% 50%, rgba(6, 78, 120, 0.6) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(120, 40, 15, 0.4) 0%, transparent 60%)',
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#f4e4bc 1px, transparent 1px), linear-gradient(90deg, #f4e4bc 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-1 lg:px-6 lg:pt-6 lg:pb-2">
        <div>
          <h1 className="text-lg font-bold tracking-wider text-sand uppercase lg:text-3xl">
            Choose Mode
          </h1>
          <p className="mt-0.5 text-xs text-sand/50 lg:mt-1 lg:text-sm">
            What awaits you?
          </p>
        </div>
        <Button variant="wood" onClick={onBack}>
          Back
        </Button>
      </div>

      {/* Mode Cards */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-4 lg:px-6 lg:pb-8">
        <div
          className={`grid w-full gap-3 lg:gap-6 ${
            showCodex ? 'max-w-5xl grid-cols-3' : 'max-w-3xl grid-cols-2'
          }`}
        >
          {/* Story Mode Card */}
          <button
            id="mode-story"
            onClick={onSelectStory}
            className="group relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-900/40 via-blue-900/30 to-indigo-900/40 p-3 transition-all duration-300 ease-out hover:-translate-y-2 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-500/20 active:translate-y-0 lg:min-h-[220px] lg:gap-4 lg:p-7"
          >
            {/* Glow effect */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/15 text-2xl ring-2 ring-cyan-400/30 transition-all duration-300 group-hover:bg-cyan-500/25 group-hover:ring-cyan-400/60 lg:h-20 lg:w-20 lg:text-4xl">
              ⚔️
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold tracking-wide text-sand uppercase lg:text-2xl">
              Story
            </h2>

            {/* Description */}
            <p className="max-w-[240px] text-center text-xs leading-relaxed text-sand/60 lg:text-sm">
              Follow Caleb&apos;s journey across the islands. Battle enemies,
              catch Cosmoids, and uncover mysteries.
            </p>

            {/* Play indicator */}
            <div className="text-xs font-semibold tracking-widest text-cyan-400/70 uppercase transition-colors group-hover:text-cyan-300 lg:mt-1">
              Play →
            </div>

            {/* Subtle pulse border */}
            <div className="pointer-events-none absolute inset-0 animate-pulse rounded-2xl border-2 border-cyan-400/20" />
          </button>

          {/* Challenge Mode Card */}
          <button
            id="mode-challenge"
            onClick={onSelectChallenge}
            className="group relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-purple-900/40 via-amber-900/30 to-orange-900/40 p-3 transition-all duration-300 ease-out hover:-translate-y-2 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-500/20 active:translate-y-0 lg:min-h-[220px] lg:gap-4 lg:p-7"
          >
            {/* Glow effect */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-2xl ring-2 ring-amber-400/30 transition-all duration-300 group-hover:bg-amber-500/25 group-hover:ring-amber-400/60 lg:h-20 lg:w-20 lg:text-4xl">
              🏆
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold tracking-wide text-amber-200 uppercase lg:text-2xl">
              Challenge
            </h2>

            {/* Description */}
            <p className="max-w-[240px] text-center text-xs leading-relaxed text-amber-200/60 lg:text-sm">
              Test your skills with unique challenges and earn special rewards.
            </p>

            {/* Play indicator */}
            <div className="text-xs font-semibold tracking-widest text-amber-400/70 uppercase transition-colors group-hover:text-amber-300 lg:mt-1">
              Play →
            </div>

            {/* Subtle pulse border */}
            <div className="pointer-events-none absolute inset-0 animate-pulse rounded-2xl border-2 border-amber-400/20" />
          </button>

          {showCodex && (
            <button
              id="mode-codex"
              onClick={onSelectCodex}
              className="group relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-900/40 via-teal-900/30 to-cyan-900/40 p-3 transition-all duration-300 ease-out hover:-translate-y-2 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/20 active:translate-y-0 lg:min-h-[220px] lg:gap-4 lg:p-7"
            >
              {showJournalNewBadge && (
                <div
                  role="status"
                  aria-label="Kip's Journal is new"
                  className="absolute top-3 right-3 z-20 animate-pulse rounded-full border border-emerald-100/80 bg-emerald-400 px-2.5 py-1 text-[10px] font-black tracking-[0.18em] text-emerald-950 uppercase shadow-lg shadow-emerald-500/30 lg:top-4 lg:right-4 lg:text-xs"
                >
                  New
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-2xl ring-2 ring-emerald-400/30 transition-all duration-300 group-hover:bg-emerald-500/25 group-hover:ring-emerald-400/60 lg:h-20 lg:w-20 lg:text-4xl">
                📖
              </div>

              <h2 className="text-lg font-bold tracking-wide text-emerald-100 uppercase lg:text-2xl">
                Kip&apos;s Journal
              </h2>

              <p className="max-w-[240px] text-center text-xs leading-relaxed text-emerald-100/60 lg:text-sm">
                Leaf through Kip&apos;s sketches and notes on the Cosmoids
                he&apos;s met—and the ones you&apos;ve caught.
              </p>

              <div className="text-xs font-semibold tracking-widest text-emerald-400/70 uppercase transition-colors group-hover:text-emerald-300 lg:mt-1">
                Read →
              </div>

              <div
                className={`pointer-events-none absolute inset-0 rounded-2xl border-2 border-emerald-400/20 ${showJournalNewBadge ? 'animate-pulse border-emerald-300/60' : ''}`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
