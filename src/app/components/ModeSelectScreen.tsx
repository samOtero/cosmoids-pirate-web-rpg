'use client';

import { Profile } from '@/types/baseGame';
import { Button } from '@/app/components/ui/Button';

interface ModeSelectScreenProps {
  profile: Profile;
  onSelectStory: () => void;
  onSelectChallenge: () => void;
  onBack: () => void;
}

export default function ModeSelectScreen({
  profile,
  onSelectStory,
  onSelectChallenge,
  onBack,
}: ModeSelectScreenProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a1628] flex flex-col">
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
      <div className="relative z-10 pt-4 pb-1 px-4 lg:pt-6 lg:pb-2 lg:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg lg:text-3xl font-bold text-sand tracking-wider uppercase">
            Choose Mode
          </h1>
          <p className="text-sand/50 text-xs lg:text-sm mt-0.5 lg:mt-1">
            Captain {profile.name} — What awaits you?
          </p>
        </div>
        <Button variant="wood" onClick={onBack}>
          Back
        </Button>
      </div>

      {/* Mode Cards */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-4 lg:px-6 lg:pb-8">
        <div className="grid grid-cols-2 gap-4 lg:gap-6 max-w-3xl w-full">
          {/* Story Mode Card */}
          <button
            id="mode-story"
            onClick={onSelectStory}
            className="group relative rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-900/40 via-blue-900/30 to-indigo-900/40 p-4 lg:p-8 min-h-[160px] lg:min-h-[220px] flex flex-col items-center justify-center gap-2 lg:gap-4
              transition-all duration-300 ease-out
              hover:border-cyan-400 hover:shadow-cyan-500/20 hover:shadow-2xl hover:-translate-y-2 active:translate-y-0
              cursor-pointer overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" />

            {/* Icon */}
            <div className="w-12 h-12 lg:w-20 lg:h-20 rounded-full bg-cyan-500/15 ring-2 ring-cyan-400/30 flex items-center justify-center text-2xl lg:text-4xl group-hover:ring-cyan-400/60 group-hover:bg-cyan-500/25 transition-all duration-300">
              ⚔️
            </div>

            {/* Title */}
            <h2 className="text-lg lg:text-2xl font-bold text-sand tracking-wide uppercase">
              Story
            </h2>

            {/* Description */}
            <p className="text-sand/60 text-xs lg:text-sm text-center leading-relaxed max-w-[240px]">
              Follow Caleb&apos;s journey across the islands. Battle enemies,
              catch Cosmoids, and uncover the mystery.
            </p>

            {/* Play indicator */}
            <div className="text-cyan-400/70 text-xs uppercase tracking-widest font-semibold lg:mt-1 group-hover:text-cyan-300 transition-colors">
              Play →
            </div>

            {/* Subtle pulse border */}
            <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/20 animate-pulse pointer-events-none" />
          </button>

          {/* Challenge Mode Card */}
          <button
            id="mode-challenge"
            onClick={onSelectChallenge}
            className="group relative rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-purple-900/40 via-amber-900/30 to-orange-900/40 p-4 lg:p-8 min-h-[160px] lg:min-h-[220px] flex flex-col items-center justify-center gap-2 lg:gap-4
              transition-all duration-300 ease-out
              hover:border-amber-400 hover:shadow-amber-500/20 hover:shadow-2xl hover:-translate-y-2 active:translate-y-0
              cursor-pointer overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />

            {/* Icon */}
            <div className="w-12 h-12 lg:w-20 lg:h-20 rounded-full bg-amber-500/15 ring-2 ring-amber-400/30 flex items-center justify-center text-2xl lg:text-4xl group-hover:ring-amber-400/60 group-hover:bg-amber-500/25 transition-all duration-300">
              🏆
            </div>

            {/* Title */}
            <h2 className="text-lg lg:text-2xl font-bold text-amber-200 tracking-wide uppercase">
              Challenge
            </h2>

            {/* Description */}
            <p className="text-amber-200/60 text-xs lg:text-sm text-center leading-relaxed max-w-[240px]">
              Test your skills with unique challenges and earn special rewards.
            </p>

            {/* Play indicator */}
            <div className="text-amber-400/70 text-xs uppercase tracking-widest font-semibold lg:mt-1 group-hover:text-amber-300 transition-colors">
              Play →
            </div>

            {/* Subtle pulse border */}
            <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/20 animate-pulse pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );
}
