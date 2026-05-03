'use client';

import { useState } from 'react';
import { Profile, TDLevelContext } from '@/types/baseGame';
import { CHALLENGE_LEVEL_ORDER, TD_LEVELS } from '@/constants/tdLevels';
import { Button } from '@/app/components/ui/Button';

interface ChallengeSelectScreenProps {
  profile: Profile;
  onLevelSelect: (context: TDLevelContext) => void;
  onBack: () => void;
}

export default function ChallengeSelectScreen({
  profile,
  onLevelSelect,
  onBack,
}: ChallengeSelectScreenProps) {
  const [hoverLevel, setHoverLevel] = useState<number | null>(null);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1a0a28]">
      {/* Animated background gradient — purple/gold theme for challenge */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(120, 40, 120, 0.5) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(180, 120, 30, 0.3) 0%, transparent 50%)',
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#f4e4bc 1px, transparent 1px), linear-gradient(90deg, #f4e4bc 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Header */}
      <div className="relative z-10 pt-6 pb-4 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-amber-200 tracking-wider uppercase">
            🏆 Challenge Mode
          </h1>
          <p className="text-amber-200/50 text-sm mt-1">
            Captain {profile.name} — Prove your worth
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="wood" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>

      {/* Challenge Level Grid */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-5xl mx-auto mt-4">
          {CHALLENGE_LEVEL_ORDER.map((level, idx) => {
            const levelNum = idx + 1;
            const isUnlocked =
              level.requiredProgression === undefined ||
              profile.storyProgression >= level.requiredProgression;
            const hasTdConfig = level.context in TD_LEVELS;
            const isHover = hoverLevel === idx;

            return (
              <button
                key={level.context}
                id={`challenge-level-${levelNum}`}
                className={`
                  relative group rounded-xl border-2 p-4 min-h-[140px] flex flex-col items-center justify-center gap-2
                  transition-all duration-300 ease-out
                  ${
                    isUnlocked && hasTdConfig
                      ? 'bg-gradient-to-br from-purple-900/50 to-amber-900/40 border-amber-500/50 hover:border-amber-400 hover:shadow-amber-500/25 hover:shadow-lg cursor-pointer'
                      : 'bg-gradient-to-br from-gray-900/40 to-gray-800/30 border-gray-700/40 cursor-not-allowed opacity-50'
                  }
                  ${isUnlocked && hasTdConfig ? 'hover:-translate-y-1 active:translate-y-0' : ''}
                `}
                onClick={() => {
                  if (isUnlocked && hasTdConfig) {
                    onLevelSelect(level.context);
                  }
                }}
                onMouseEnter={() => setHoverLevel(idx)}
                onMouseLeave={() => setHoverLevel(null)}
                disabled={!isUnlocked || !hasTdConfig}
              >
                {/* Level Number Badge */}
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                    transition-all duration-300
                    ${
                      isUnlocked && hasTdConfig
                        ? 'bg-amber-500/20 text-amber-300 ring-2 ring-amber-400/40'
                        : 'bg-gray-700/30 text-gray-500 ring-2 ring-gray-600/30'
                    }
                  `}
                >
                  {!isUnlocked ? (
                    <span className="text-lg">🔒</span>
                  ) : (
                    <span className="text-lg">🏆</span>
                  )}
                </div>

                {/* Level Name */}
                <span
                  className={`text-sm font-semibold text-center leading-tight ${
                    isUnlocked ? 'text-amber-200' : 'text-gray-500'
                  }`}
                >
                  {level.name}
                </span>

                {/* Hover tooltip */}
                {isHover && isUnlocked && (
                  <div className="absolute -bottom-2 translate-y-full left-1/2 -translate-x-1/2 bg-black/95 text-amber-200/90 p-2 rounded-lg text-xs text-center whitespace-nowrap z-50 pointer-events-none border border-amber-600/30 shadow-xl">
                    {level.description}
                    {hasTdConfig && (
                      <div className="text-amber-400 mt-1 text-[10px]">
                        Click to Play
                      </div>
                    )}
                  </div>
                )}

                {/* Pulse animation for available levels */}
                {isUnlocked && hasTdConfig && (
                  <div className="absolute inset-0 rounded-xl border-2 border-amber-400/30 animate-pulse pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
