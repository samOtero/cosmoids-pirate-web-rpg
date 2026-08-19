"use client";

import { useState } from "react";
import { Creature, ElementType } from "@/types/baseGame";
import { MAX_COSMOID_LEVEL } from '@/constants/game';
import { COSMOID_TEMPLATES } from "@/constants/creatures";
import { ATTACK_DEFS } from "@/engine/tower-defense/attacks/definitions";
import { Button } from "@/app/components/ui/Button";
import Panel from "@/app/components/ui/Panel";
import { TypeBadge } from "@/app/components/ui/TypeBadge";

interface CreatureDetailsScreenProps {
  creature: Creature;
  activeAttackIndex: number;
  onBack: () => void;
  onUpdateAttacks: (equippedAttacks: string[], activeAttackIndex: number) => void;
}

export default function CreatureDetailsScreen({
  creature,
  activeAttackIndex,
  onBack,
  onUpdateAttacks,
}: CreatureDetailsScreenProps) {
  // Local state to manage equipped moves list and active index for real-time preview before saving
  const [currentMoves, setCurrentMoves] = useState<string[]>(creature.moves);
  const [selectedActiveIdx, setSelectedActiveIdx] = useState<number>(activeAttackIndex);
  
  // State for move replacement mode: stores the attack ID of the learnable attack the user wants to learn
  const [replacingMoveId, setReplacingMoveId] = useState<string | null>(null);

  const template = COSMOID_TEMPLATES[creature.speciesId];
  if (!template) return null;

  // Calculate XP threshold for current level
  const maxLevel = MAX_COSMOID_LEVEL;
  const isMaxLevel = creature.level >= maxLevel;
  const xpNeeded = isMaxLevel
    ? 0
    : Math.pow(creature.level + 1, 3) - Math.pow(creature.level, 3);
  const xpPercentage = isMaxLevel ? 100 : Math.min(100, (creature.xp / xpNeeded) * 100);

  // Resolve learnable moves for this creature's level
  const learnableMovesAtLevel = template.learnableAttacks
    .filter((a) => a.level <= creature.level)
    .map((a) => a.attackId);

  // Filter out duplicates (just in case) and identify moves not currently equipped
  const uniqueLearnable = Array.from(new Set(learnableMovesAtLevel));
  const relearnableAttacks = uniqueLearnable.filter(
    (attackId) => !currentMoves.includes(attackId)
  );

  // Set active attack handler
  const handleSetActiveAttack = (index: number) => {
    if (index === selectedActiveIdx) return;
    setSelectedActiveIdx(index);
    onUpdateAttacks(currentMoves, index);
  };

  // Relearn/Learn new attack handler
  const handleLearnAttack = (newAttackId: string) => {
    if (currentMoves.length < 4) {
      // If we have less than 4 moves, we can append it directly
      const newMoves = [...currentMoves, newAttackId];
      setCurrentMoves(newMoves);
      onUpdateAttacks(newMoves, selectedActiveIdx);
    } else {
      // Enter replacement mode
      setReplacingMoveId(newAttackId);
    }
  };

  // Replace equipped attack handler
  const handleReplaceAttack = (indexToReplace: number) => {
    if (!replacingMoveId) return;

    const newMoves = [...currentMoves];
    newMoves[indexToReplace] = replacingMoveId;

    // Reset active index if the replaced move was active
    let newActiveIdx = selectedActiveIdx;
    if (selectedActiveIdx === indexToReplace) {
      newActiveIdx = 0; // fallback to first move
    }

    setCurrentMoves(newMoves);
    setSelectedActiveIdx(newActiveIdx);
    setReplacingMoveId(null);
    onUpdateAttacks(newMoves, newActiveIdx);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b1520] text-sand p-3 lg:p-6 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-2 lg:mb-4 shrink-0 border-b border-wood/30 pb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl lg:text-3xl font-black text-sand tracking-wide uppercase drop-shadow">
            {creature.name}
          </h2>
          <span className="text-xs lg:text-sm font-extrabold bg-cyan-900/60 px-2 py-0.5 rounded-full border border-cyan-500/30 text-cyan-400">
            Lv {creature.level}
          </span>
          <TypeBadge type={creature.type} />
          {creature.secondaryType && (
            <TypeBadge type={creature.secondaryType} />
          )}
          {creature.isShiny && (
            <span className="text-xs lg:text-sm font-black bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400 text-amber-300">
              Shiny ✨
            </span>
          )}
        </div>
        <Button
          variant="wood"
          onClick={onBack}
          className="px-4 py-1 text-xs font-bold lg:px-6 lg:py-2 lg:text-base cursor-pointer"
        >
          Back
        </Button>
      </div>

      {/* Main Content Layout (Landscape double column) */}
      <div className="flex flex-1 min-h-0 gap-3 lg:gap-6 flex-row">
        {/* Left Column: Visuals & Stats Panel */}
        <div className="w-[38%] shrink-0 flex flex-col gap-2 min-h-0">
          <Panel className={`flex flex-col flex-1 min-h-0 p-3 bg-ocean-dark/70 transition-all duration-300 ${
            creature.isShiny ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]' : 'border-wood/80'
          }`}>
            {/* Creature Sprite */}
            <div className={`relative flex flex-1 items-center justify-center bg-black/45 rounded p-2 min-h-0 border ${
              creature.isShiny ? 'border-amber-500/40' : 'border-wood/20'
            }`}>
              <div className={`absolute inset-0 bg-radial pointer-events-none rounded ${
                creature.isShiny ? 'from-amber-500/15 to-transparent' : 'from-cyan-500/10 to-transparent'
              }`} />
              <img
                src={creature.iconImg || creature.spriteUrl}
                alt={creature.name}
                className={`h-full max-h-[14vh] lg:max-h-[22vh] object-contain transition-all duration-300 ${
                  creature.isShiny
                    ? 'drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)] scale-105'
                    : 'drop-shadow-[0_4px_12px_rgba(34,211,238,0.2)]'
                }`}
              />
            </div>

            {/* Experience Points Progress */}
            <div className="mt-2 shrink-0">
              <div className="flex justify-between items-center text-[10px] lg:text-xs font-bold text-sand/80 mb-0.5">
                <span>Experience Points</span>
                <span>
                  {isMaxLevel ? "MAX LEVEL" : `${creature.xp} / ${xpNeeded} XP`}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full border border-black/50 bg-black/60">
                <div
                  className="h-full bg-cyan-500 shadow-[0_0_8px_#22d3ee] transition-all duration-300"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mt-2 shrink-0">
              <h3 className="text-xs lg:text-sm font-extrabold text-sand/90 mb-1 border-b border-wood/20 pb-0.5 uppercase tracking-wider">
                Attributes
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "HP", val: creature.maxHp },
                  { label: "Speed", val: creature.speed },
                  { label: "Attack", val: creature.attack },
                  { label: "Defense", val: creature.defense },
                  { label: "Sp. Atk", val: creature.specialAttack },
                  { label: "Sp. Def", val: creature.specialDefense },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-black/35 px-2 py-0.5 lg:py-1 rounded border border-wood/10"
                  >
                    <span className="text-[10px] lg:text-[11px] font-bold text-sand/70 uppercase">
                      {stat.label}
                    </span>
                    <span className="text-xs lg:text-sm font-black text-cyan-400">
                      {stat.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        {/* Right Column: Attacks Management & Relearner */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <Panel className="flex flex-col flex-1 min-h-0 p-3 bg-ocean-dark/70 border-wood/80">
            {/* Header / Mode Indicator */}
            <div className="shrink-0 flex items-center justify-between border-b border-wood/20 pb-1 mb-2">
              <h3 className="text-xs lg:text-sm font-black text-sand uppercase tracking-wider">
                {replacingMoveId ? "⚠️ Select Move to Forget" : "Equipped Attacks (Tap to Set Active)"}
              </h3>
              {replacingMoveId && (
                <Button
                  variant="secondary"
                  className="px-2 py-0.5 text-[9px] lg:text-[10px] font-extrabold cursor-pointer hover:bg-gray-500/80"
                  onClick={() => setReplacingMoveId(null)}
                >
                  Cancel Relearn
                </Button>
              )}
            </div>

            {/* Equipped Move List */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
              {currentMoves.map((moveId, index) => {
                const moveDef = ATTACK_DEFS[moveId];
                if (!moveDef) return null;

                const isActive = selectedActiveIdx === index;
                const isReplacingTarget = replacingMoveId !== null;

                return (
                  <div
                    key={`${moveId}-${index}`}
                    onClick={() =>
                      isReplacingTarget ? handleReplaceAttack(index) : handleSetActiveAttack(index)
                    }
                    className={`relative p-2 rounded border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between h-[65px] lg:h-[80px] ${
                      isReplacingTarget
                        ? "border-amber-500/60 bg-amber-950/20 hover:bg-amber-900/40 animate-pulse"
                        : isActive
                        ? "border-cyan-400 bg-cyan-950/30 shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                        : "border-wood/40 bg-black/40 hover:bg-black/20 hover:border-wood/60"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xs lg:text-sm font-bold text-sand truncate">
                        {moveDef.name}
                      </span>
                      <TypeBadge type={moveDef.type} />
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="flex gap-2 text-[9px] lg:text-[11px] font-extrabold text-sand/65">
                        <span>Pwr: <strong className="text-cyan-400">{moveDef.power}</strong></span>
                        <span className="capitalize">{moveDef.category}</span>
                      </div>
                      {isReplacingTarget ? (
                        <span className="text-[9px] lg:text-[10px] font-black text-amber-400 animate-pulse border border-amber-400/40 px-1 rounded bg-amber-900/40">
                          REPLACE
                        </span>
                      ) : isActive ? (
                        <span className="text-[9px] lg:text-[10px] font-black text-cyan-400 border border-cyan-400/40 px-1 rounded bg-cyan-900/40">
                          ACTIVE
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Relearn Move List */}
            <div className="flex-1 flex flex-col min-h-0 mt-3">
              <h3 className="shrink-0 text-xs lg:text-sm font-black text-sand border-b border-wood/20 pb-0.5 mb-1.5 uppercase tracking-wider">
                Relearn Forgotten Attacks
              </h3>
              
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-wood/40">
                {relearnableAttacks.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center py-4 text-xs font-semibold text-sand/40">
                    No forgotten moves available to relearn at this level.
                  </div>
                ) : (
                  relearnableAttacks.map((moveId) => {
                    const moveDef = ATTACK_DEFS[moveId];
                    if (!moveDef) return null;

                    return (
                      <div
                        key={moveId}
                        className="flex items-center justify-between bg-black/45 hover:bg-black/20 border border-wood/30 rounded p-1.5 lg:p-2 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <TypeBadge type={moveDef.type} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs lg:text-sm font-bold text-sand truncate">
                              {moveDef.name}
                            </span>
                            <div className="flex gap-2 text-[9px] lg:text-[10px] font-bold text-sand/55">
                              <span>Pwr: <strong className="text-cyan-400">{moveDef.power}</strong></span>
                              <span className="capitalize">{moveDef.category}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="wood"
                          disabled={replacingMoveId !== null}
                          className="px-2 py-0.5 text-[10px] lg:text-xs font-extrabold cursor-pointer hover:scale-105"
                          onClick={() => handleLearnAttack(moveId)}
                        >
                          Relearn
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
