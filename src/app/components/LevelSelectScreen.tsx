'use client';

import { useState } from 'react';
import {
  Profile,
  DialogContext,
  DialogContextData,
  DialogAction,
  TDLevelContext,
} from '@/types/baseGame';
import { LEVEL_ORDER, TD_LEVELS } from '@/constants/tdLevels';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import Panel from '@/app/components/ui/Panel';
import { Button } from '@/app/components/ui/Button';
import { resolveDialog } from '@/utils/dialogResolver';
import DialogContent from '@/app/components/ui/DialogContent';
import InventoryModal from '@/app/components/inventory/InventoryModal';
import { useGameStore } from '@/store/gameStore';

function getLevelCreatureIcons(context: TDLevelContext): string[] {
  const levelConfig = TD_LEVELS[context];
  if (!levelConfig || !levelConfig.levelData) return [];

  const uniqueIds = new Set<string>();
  levelConfig.levelData.waves.forEach((wave) => {
    wave.groups.forEach((group) => {
      uniqueIds.add(group.definitionId);
    });
  });

  const icons: string[] = [];
  uniqueIds.forEach((defId) => {
    const template = COSMOID_TEMPLATES[defId];
    if (template) {
      const icon = template.iconImg || template.spriteUrl;
      if (icon) {
        icons.push(icon);
      }
    }
  });

  return icons;
}

interface LevelSelectScreenProps {
  profile: Profile;
  onLevelSelect: (context: TDLevelContext) => void;
  onBack: () => void;
  // Dialog Support
  dialogContext?: DialogContext | null;
  dialogContextData?: DialogContextData | null;
  onDialogContinue?: () => void;
  onDialogAction?: (action: DialogAction) => void;
}

export default function LevelSelectScreen({
  profile,
  onLevelSelect,
  onBack,
  dialogContext,
  dialogContextData,
  onDialogContinue,
  onDialogAction,
}: LevelSelectScreenProps) {
  const [showInventory, setShowInventory] = useState(false);
  const [hoverLevel, setHoverLevel] = useState<number | null>(null);

  const enqueueAndProcessEvents = useGameStore(
    (state) => state.enqueueAndProcessEvents
  );

  // Resolve dialog if active
  const resolvedDialog = dialogContext
    ? resolveDialog(dialogContext, dialogContextData || null)
    : null;
  const sequence = resolvedDialog?.sequence || null;
  const dialogStartIndex = dialogContextData?.dialogStartIndex || 0;

  return (
    <>
      <div className="relative h-full w-full overflow-hidden bg-[#0a1628]">
        {/* Animated background gradient */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(6, 78, 120, 0.5) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(100, 40, 15, 0.3) 0%, transparent 50%)',
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
        <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-sand uppercase lg:text-3xl">
              Select Level
            </h1>
            <p className="mt-1 text-sm text-sand/50">
              Choose your next adventure
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="wood" onClick={onBack}>
              Back
            </Button>
          </div>
        </div>

        {/* Level Grid */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-24">
          <div className="mx-auto mt-4 grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-5">
            {LEVEL_ORDER.map((level, idx) => {
              const levelNum = idx + 1;
              const isUnlocked =
                level.requiredProgression === undefined ||
                profile.storyProgression >= level.requiredProgression;
              const isCompleted =
                isUnlocked &&
                level.requiredProgression !== undefined &&
                profile.storyProgression > level.requiredProgression;
              const isFirstCompleted =
                idx === 0 && profile.storyProgression >= 2; // DEFEAT_FIRST_BATTLE
              const completed = isCompleted || isFirstCompleted;
              const isHover = hoverLevel === idx;
              const hasTdConfig = level.context in TD_LEVELS;

              return (
                <button
                  key={level.context}
                  id={`level-${levelNum}`}
                  className={`group relative flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all duration-300 ease-out ${
                    completed
                      ? 'border-emerald-500/60 bg-gradient-to-br from-emerald-900/60 to-emerald-800/40 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20'
                      : isUnlocked && hasTdConfig
                        ? 'cursor-pointer border-cyan-500/50 bg-gradient-to-br from-cyan-900/50 to-blue-900/40 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/25'
                        : 'cursor-not-allowed border-gray-700/40 bg-gradient-to-br from-gray-900/40 to-gray-800/30 opacity-50'
                  } ${isUnlocked && hasTdConfig ? 'hover:-translate-y-1 active:translate-y-0' : ''} `}
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
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold transition-all duration-300 ${
                      completed
                        ? 'bg-emerald-500/30 text-emerald-300 ring-2 ring-emerald-400/50'
                        : isUnlocked && hasTdConfig
                          ? 'bg-cyan-500/20 text-cyan-300 ring-2 ring-cyan-400/40'
                          : 'bg-gray-700/30 text-gray-500 ring-2 ring-gray-600/30'
                    } `}
                  >
                    {!isUnlocked ? (
                      <span className="text-lg">🔒</span>
                    ) : completed ? (
                      <span className="text-lg">⭐</span>
                    ) : (
                      levelNum
                    )}
                  </div>

                  {/* Level Name */}
                  <span
                    className={`text-center text-sm leading-tight font-semibold ${
                      completed
                        ? 'text-emerald-200'
                        : isUnlocked
                          ? 'text-sand'
                          : 'text-gray-500'
                    }`}
                  >
                    {level.name}
                  </span>

                  {/* Creature Icons */}
                  {isUnlocked && hasTdConfig && (
                    <div className="mt-1 flex justify-center gap-1">
                      {getLevelCreatureIcons(level.context).map(
                        (iconSrc, iconIdx) => (
                          <div
                            key={iconIdx}
                            className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-sand/20 bg-black/35 shadow-sm lg:h-7 lg:w-7"
                          >
                            <img
                              src={iconSrc}
                              alt="Creature"
                              className="h-full w-full object-contain p-0.5"
                            />
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Hover tooltip with description */}
                  {isHover && isUnlocked && (
                    <div className="pointer-events-none absolute -bottom-2 left-1/2 z-50 -translate-x-1/2 translate-y-full rounded-lg border border-wood/30 bg-black/95 p-2 text-center text-xs whitespace-nowrap text-sand/90 shadow-xl">
                      {level.description}
                      {hasTdConfig && (
                        <div className="mt-1 text-[10px] text-cyan-400">
                          Click to Play
                        </div>
                      )}
                    </div>
                  )}

                  {/* Unlocked pulse animation */}
                  {isUnlocked && !completed && hasTdConfig && (
                    <div className="pointer-events-none absolute inset-0 animate-pulse rounded-xl border-2 border-cyan-400/30" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="absolute right-0 bottom-0 left-0 z-20 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/95 to-transparent px-6 pt-8 pb-4">
          <div className="mx-auto flex max-w-md justify-center gap-3">
            <Button
              variant="wood"
              onClick={() => enqueueAndProcessEvents([{ type: 'GO_TO_PARTY' }])}
            >
              Team
            </Button>
            <Button variant="wood" onClick={() => setShowInventory(true)}>
              Bag
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog Overlay */}
      {sequence && onDialogContinue && (
        <div className="pointer-events-auto absolute inset-0 z-50">
          <DialogContent
            sequence={sequence}
            onContinue={onDialogContinue}
            onDialogAction={onDialogAction || (() => {})}
            initialLineIndex={dialogStartIndex || 0}
          />
        </div>
      )}

      {showInventory && (
        <InventoryModal
          inventory={profile.inventory}
          onClose={() => setShowInventory(false)}
        />
      )}
    </>
  );
}
