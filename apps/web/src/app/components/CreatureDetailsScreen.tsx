'use client';

import { AttackId } from '@/types/definitionIds';
import { AttackDetails } from './attacks/AttackDetails';
import { AttackDialog } from './attacks/AttackDialog';
import { AttackReplacement } from './attacks/AttackReplacement';

import { useState } from 'react';
import { Creature } from '@/types/baseGame';
import { MAX_COSMOID_LEVEL } from '@/constants/game';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { Button } from '@/app/components/ui/Button';
import Panel from '@/app/components/ui/Panel';
import { TypeBadge } from '@/app/components/ui/TypeBadge';
import { GenderBadge } from '@/app/components/ui/GenderBadge';

interface CreatureDetailsScreenProps {
  creature: Creature;
  activeAttackIndex: number;
  onBack: () => void;
  onUpdateAttacks: (
    equippedAttacks: AttackId[],
    activeAttackIndex: number
  ) => void;
}

export default function CreatureDetailsScreen({
  creature,
  activeAttackIndex,
  onBack,
  onUpdateAttacks,
}: CreatureDetailsScreenProps) {
  // Local state to manage equipped moves list and active index for real-time preview before saving
  const [currentMoves, setCurrentMoves] = useState<AttackId[]>(creature.moves);
  const [selectedActiveIdx, setSelectedActiveIdx] =
    useState<number>(activeAttackIndex);

  // State for move replacement mode: stores the attack ID of the learnable attack the user wants to learn
  const [replacingMoveId, setReplacingMoveId] = useState<AttackId | null>(null);

  const [inspectedMoveId, setInspectedMoveId] = useState<AttackId | undefined>(
    creature.moves[activeAttackIndex] ?? creature.moves[0]
  );
  const inspectedMove =
    inspectedMoveId === undefined ? undefined : ATTACK_DEFS[inspectedMoveId];
  const template = COSMOID_TEMPLATES[creature.speciesId];
  if (!template) return null;

  // Calculate XP threshold for current level
  const maxLevel = MAX_COSMOID_LEVEL;
  const isMaxLevel = creature.level >= maxLevel;
  const xpNeeded = isMaxLevel
    ? 0
    : Math.pow(creature.level + 1, 3) - Math.pow(creature.level, 3);
  const xpPercentage = isMaxLevel
    ? 100
    : Math.min(100, (creature.xp / xpNeeded) * 100);

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
  const handleLearnAttack = (newAttackId: AttackId) => {
    if (currentMoves.length < 4) {
      // If we have less than 4 moves, we can append it directly
      const newMoves = [...currentMoves, newAttackId];
      setCurrentMoves(newMoves);
      setInspectedMoveId(newAttackId);
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

    // Keep the active slot: replacing its move makes the new move active.
    setCurrentMoves(newMoves);
    setInspectedMoveId(replacingMoveId);
    setReplacingMoveId(null);
    onUpdateAttacks(newMoves, selectedActiveIdx);
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-[fadeIn_0.2s_ease-out] flex-col overflow-hidden bg-[#0b1520] p-3 text-sand lg:p-6">
      {/* Top Header Bar */}
      <div className="mb-2 flex shrink-0 items-center justify-between border-b border-wood/30 pb-2 lg:mb-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2 lg:gap-3">
          <h2 className="text-xl font-black tracking-wide text-sand uppercase drop-shadow lg:text-3xl">
            {creature.name}
          </h2>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-900/60 px-2 py-0.5 text-xs font-extrabold text-cyan-400 lg:text-sm">
            Lv {creature.level}
          </span>
          <GenderBadge
            gender={creature.gender}
            className="text-xs lg:text-sm"
          />
          <TypeBadge type={creature.type} />
          {creature.secondaryType && (
            <TypeBadge type={creature.secondaryType} />
          )}
          {creature.isShiny && (
            <span className="rounded-full border border-amber-400 bg-amber-500/20 px-2.5 py-0.5 text-xs font-black text-amber-300 lg:text-sm">
              Shiny ✨
            </span>
          )}
        </div>
        <Button
          variant="wood"
          onClick={onBack}
          className="cursor-pointer px-4 py-1 text-xs font-bold lg:px-6 lg:py-2 lg:text-base"
        >
          Back to Team
        </Button>
      </div>

      {/* Main Content Layout (Landscape double column) */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto sm:flex-row sm:overflow-hidden lg:gap-6">
        {/* Left Column: Visuals & Stats Panel */}
        <div className="flex min-h-0 w-full shrink-0 flex-col gap-2 sm:w-[32%]">
          <Panel
            className={`flex min-h-0 flex-1 flex-col bg-ocean-dark/70 p-3 transition-all duration-300 ${
              creature.isShiny
                ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'border-wood/80'
            }`}
          >
            {/* Creature Sprite */}
            <div
              className={`relative flex min-h-0 flex-1 items-center justify-center rounded border bg-black/45 p-2 ${
                creature.isShiny ? 'border-amber-500/40' : 'border-wood/20'
              }`}
            >
              <div
                className={`pointer-events-none absolute inset-0 rounded bg-radial ${
                  creature.isShiny
                    ? 'from-amber-500/15 to-transparent'
                    : 'from-cyan-500/10 to-transparent'
                }`}
              />
              <img
                src={creature.iconImg || creature.spriteUrl}
                alt={creature.name}
                className={`h-full max-h-[14vh] object-contain transition-all duration-300 lg:max-h-[22vh] ${
                  creature.isShiny
                    ? 'scale-105 drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]'
                    : 'drop-shadow-[0_4px_12px_rgba(34,211,238,0.2)]'
                }`}
              />
            </div>

            {/* Experience Points Progress */}
            <div className="mt-2 shrink-0">
              <div className="mb-0.5 flex items-center justify-between text-[10px] font-bold text-sand/80 lg:text-xs">
                <span>Experience Points</span>
                <span>
                  {isMaxLevel ? 'MAX LEVEL' : `${creature.xp} / ${xpNeeded} XP`}
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
              <h3 className="mb-1 border-b border-wood/20 pb-0.5 text-xs font-extrabold tracking-wider text-sand/90 uppercase lg:text-sm">
                Attributes
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'HP', val: creature.maxHp },
                  { label: 'Speed', val: creature.speed },
                  { label: 'Attack', val: creature.attack },
                  { label: 'Defense', val: creature.defense },
                  { label: 'Sp. Atk', val: creature.specialAttack },
                  { label: 'Sp. Def', val: creature.specialDefense },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded border border-wood/10 bg-black/35 px-2 py-0.5 lg:py-1"
                  >
                    <span className="text-[10px] font-bold text-sand/70 uppercase lg:text-[11px]">
                      {stat.label}
                    </span>
                    <span className="text-xs font-black text-cyan-400 lg:text-sm">
                      {stat.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <Panel className="grid min-h-0 flex-1 grid-cols-[minmax(120px,32%)_minmax(0,1fr)] gap-2 border-wood/80 bg-ocean-dark/70 p-2">
            <div className="min-h-0 overflow-y-auto" aria-label="Move list">
              <h3 className="mb-1 text-xs font-bold text-sand">Known moves</h3>
              <div className="flex flex-col gap-1">
                {currentMoves.map((moveId, index) => {
                  const move = ATTACK_DEFS[moveId];
                  if (!move) return null;
                  return (
                    <button
                      key={moveId}
                      type="button"
                      aria-label={'Inspect ' + move.name}
                      aria-pressed={inspectedMoveId === moveId}
                      onClick={() => setInspectedMoveId(moveId)}
                      className={
                        'flex min-h-9 items-center justify-between gap-1 rounded border px-2 py-1 text-left text-sm ' +
                        (inspectedMoveId === moveId
                          ? 'border-cyan-400 bg-cyan-950'
                          : 'border-slate-600 bg-slate-900')
                      }
                    >
                      <span>{move.name}</span>
                      {index === selectedActiveIdx && (
                        <span
                          aria-label="Active"
                          title="Active"
                          className="shrink-0 text-xs text-cyan-200"
                        >
                          ●
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <h3 className="mt-3 mb-1 text-xs font-bold text-sand">
                Forgotten moves
              </h3>
              {relearnableAttacks.length === 0 ? (
                <p className="text-xs text-sand/70">
                  None available at this level.
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {relearnableAttacks.map((moveId) => {
                    const move = ATTACK_DEFS[moveId];
                    if (!move) return null;
                    return (
                      <button
                        key={moveId}
                        type="button"
                        aria-label={'Inspect forgotten move ' + move.name}
                        aria-pressed={inspectedMoveId === moveId}
                        onClick={() => setInspectedMoveId(moveId)}
                        className={
                          'min-h-9 rounded border px-2 py-1 text-left text-sm ' +
                          (inspectedMoveId === moveId
                            ? 'border-cyan-400 bg-cyan-950'
                            : 'border-slate-600 bg-slate-900')
                        }
                      >
                        {move.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex max-h-full min-h-0 min-w-0 flex-col gap-2 self-start">
              {inspectedMove && (
                <>
                  <div className="grid min-h-0 flex-1">
                    <AttackDetails
                      attack={inspectedMove}
                      badge={
                        currentMoves[selectedActiveIdx] === inspectedMove.id
                          ? 'Active'
                          : undefined
                      }
                    />
                  </div>
                  {currentMoves.includes(inspectedMove.id) ? (
                    <Button
                      variant="wood"
                      disabled={
                        currentMoves[selectedActiveIdx] === inspectedMove.id
                      }
                      onClick={() =>
                        handleSetActiveAttack(
                          currentMoves.indexOf(inspectedMove.id)
                        )
                      }
                      className="min-h-9 shrink-0 px-3 py-1 text-xs font-bold"
                    >
                      {currentMoves[selectedActiveIdx] === inspectedMove.id
                        ? 'Already Active'
                        : 'Make Active'}
                    </Button>
                  ) : (
                    <Button
                      variant="wood"
                      onClick={() => handleLearnAttack(inspectedMove.id)}
                      className="min-h-9 shrink-0 px-3 py-1 text-xs font-bold"
                    >
                      Relearn {inspectedMove.name}
                    </Button>
                  )}
                </>
              )}
            </div>
          </Panel>
        </div>
      </div>
      {replacingMoveId !== null && ATTACK_DEFS[replacingMoveId] && (
        <AttackDialog
          title="Choose an attack to replace"
          onClose={() => setReplacingMoveId(null)}
        >
          <AttackReplacement
            key={replacingMoveId}
            next={ATTACK_DEFS[replacingMoveId]}
            known={currentMoves.map((id) => ATTACK_DEFS[id])}
            activeIndex={selectedActiveIdx}
            canRelearn={(id) => uniqueLearnable.includes(id)}
            onReplace={handleReplaceAttack}
            onCancel={() => setReplacingMoveId(null)}
          />
        </AttackDialog>
      )}
    </div>
  );
}
