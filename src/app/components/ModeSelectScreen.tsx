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
      <div className="relative z-10 pt-6 pb-2 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-sand tracking-wider uppercase">
            Choose Mode
          </h1>
          <p className="text-sand/50 text-sm mt-1">
            Captain {profile.name} — What awaits you?
          </p>
        </div>
        <Button variant="wood" onClick={onBack}>
          Back
        </Button>
      </div>

      {/* Mode Cards */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl w-full">
          {/* Story Mode Card */}
          <button
            id="mode-story"
            onClick={onSelectStory}
            className="group relative rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-900/40 via-blue-900/30 to-indigo-900/40 p-6 md:p-8 min-h-[220px] flex flex-col items-center justify-center gap-4
              transition-all duration-300 ease-out
              hover:border-cyan-400 hover:shadow-cyan-500/20 hover:shadow-2xl hover:-translate-y-2 active:translate-y-0
              cursor-pointer overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" />

            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-cyan-500/15 ring-2 ring-cyan-400/30 flex items-center justify-center text-4xl group-hover:ring-cyan-400/60 group-hover:bg-cyan-500/25 transition-all duration-300">
              ⚔️
            </div>

            {/* Title */}
            <h2 className="text-xl md:text-2xl font-bold text-sand tracking-wide uppercase">
              Story
            </h2>

            {/* Description */}
            <p className="text-sand/60 text-sm text-center leading-relaxed max-w-[240px]">
              Follow Caleb&apos;s journey across the islands. Battle enemies,
              catch Cosmoids, and uncover the mystery.
            </p>

            {/* Play indicator */}
            <div className="text-cyan-400/70 text-xs uppercase tracking-widest font-semibold mt-1 group-hover:text-cyan-300 transition-colors">
              Play →
            </div>

            {/* Subtle pulse border */}
            <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/20 animate-pulse pointer-events-none" />
          </button>

          {/* Challenge Mode Card */}
          <button
            id="mode-challenge"
            onClick={onSelectChallenge}
            disabled
            className="group relative rounded-2xl border-2 border-gray-600/30 bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-gray-900/50 p-6 md:p-8 min-h-[220px] flex flex-col items-center justify-center gap-4
              transition-all duration-300 ease-out
              cursor-not-allowed opacity-60 overflow-hidden"
          >
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-gray-700/20 ring-2 ring-gray-600/30 flex items-center justify-center text-4xl">
              🏆
            </div>

            {/* Title */}
            <h2 className="text-xl md:text-2xl font-bold text-gray-400 tracking-wide uppercase">
              Challenge
            </h2>

            {/* Description */}
            <p className="text-gray-500 text-sm text-center leading-relaxed max-w-[240px]">
              Test your skills with unique challenges and earn special rewards.
            </p>

            {/* Coming Soon badge */}
            <div className="bg-gray-700/50 text-gray-400 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-gray-600/30">
              Coming Soon
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
