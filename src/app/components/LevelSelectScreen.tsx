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
  if (context === TDLevelContext.FOREST_LEVEL_2) {
    return [
      COSMOID_TEMPLATES.starter_crab?.iconImg || '',
      COSMOID_TEMPLATES.starter_iguana?.iconImg || '',
      COSMOID_TEMPLATES.starter_monkey?.iconImg || '',
    ].filter(Boolean);
  }

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
      <div className="relative w-full h-full overflow-hidden bg-[#0a1628]">
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
        <div className="relative z-10 pt-6 pb-4 px-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-sand tracking-wider uppercase">
              Select Level
            </h1>
            <p className="text-sand/50 text-sm mt-1">
              Captain {profile.name} — Choose your next adventure
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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto mt-4">
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
                  className={`
                    relative group rounded-xl border-2 p-4 min-h-[140px] flex flex-col items-center justify-center gap-2
                    transition-all duration-300 ease-out
                    ${
                      completed
                        ? 'bg-gradient-to-br from-emerald-900/60 to-emerald-800/40 border-emerald-500/60 hover:border-emerald-400 hover:shadow-emerald-500/20 hover:shadow-lg'
                        : isUnlocked && hasTdConfig
                          ? 'bg-gradient-to-br from-cyan-900/50 to-blue-900/40 border-cyan-500/50 hover:border-cyan-400 hover:shadow-cyan-500/25 hover:shadow-lg cursor-pointer'
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
                        completed
                          ? 'bg-emerald-500/30 text-emerald-300 ring-2 ring-emerald-400/50'
                          : isUnlocked && hasTdConfig
                            ? 'bg-cyan-500/20 text-cyan-300 ring-2 ring-cyan-400/40'
                            : 'bg-gray-700/30 text-gray-500 ring-2 ring-gray-600/30'
                      }
                    `}
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
                    className={`text-sm font-semibold text-center leading-tight ${
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
                    <div className="flex gap-1 justify-center mt-1">
                      {getLevelCreatureIcons(level.context).map((iconSrc, iconIdx) => (
                        <div
                          key={iconIdx}
                          className="w-6 h-6 lg:w-7 lg:h-7 rounded-full overflow-hidden bg-black/35 border border-sand/20 flex items-center justify-center shadow-sm"
                        >
                          <img
                            src={iconSrc}
                            alt="Creature"
                            className="w-full h-full object-contain p-0.5"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hover tooltip with description */}
                  {isHover && isUnlocked && (
                    <div className="absolute -bottom-2 translate-y-full left-1/2 -translate-x-1/2 bg-black/95 text-sand/90 p-2 rounded-lg text-xs text-center whitespace-nowrap z-50 pointer-events-none border border-wood/30 shadow-xl">
                      {level.description}
                      {hasTdConfig && (
                        <div className="text-cyan-400 mt-1 text-[10px]">
                          Click to Play
                        </div>
                      )}
                    </div>
                  )}

                  {/* Unlocked pulse animation */}
                  {isUnlocked && !completed && hasTdConfig && (
                    <div className="absolute inset-0 rounded-xl border-2 border-cyan-400/30 animate-pulse pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/95 to-transparent pt-8 pb-4 px-6">
          <div className="flex justify-center gap-3 max-w-md mx-auto">
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
        <div className="absolute inset-0 z-50 pointer-events-auto">
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
