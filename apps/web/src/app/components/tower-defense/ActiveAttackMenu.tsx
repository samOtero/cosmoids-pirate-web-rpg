'use client';

import { useId, useState } from 'react';
import Image from 'next/image';
import type { AttackId } from '@/types/definitionIds';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import type { PlayerCreature } from '@/types/baseGame';
import type { Tower, TowerTargetingMode } from '@/engine/tower-defense/types';
import {
  getAttackIntervalMs,
  getAttackRemainingMs,
  usesAttackSimulationCooldown,
} from '@/engine/tower-defense/attacks/timing';
import { attackSeconds, getAttackInformation } from '@/utils/attackInformation';
import { AttackDetails } from '@/app/components/attacks/AttackDetails';
import { AttackDialog } from '@/app/components/attacks/AttackDialog';
import { TypeBadge } from '@/app/components/ui/TypeBadge';

export function ActiveAttackMenu({
  name,
  spriteUrl,
  displayLevel,
  displayHp,
  displayMaxHp,
  equippedAttacks,
  activeAttackIndex,
  onSelectAttack,
  activeTargetingMode = 'first',
  onSelectTargetingMode,
  onClose,
  tower,
  elapsedTimeMs = 0,
  frameTimeMs = 0,
}: {
  creature: PlayerCreature;
  name: string;
  spriteUrl: string;
  isActive: boolean;
  displayLevel: number;
  displayXp: number;
  displayHp?: number;
  displayMaxHp?: number;
  equippedAttacks: AttackId[];
  activeAttackIndex: number;
  onSelectAttack: (index: number) => void;
  activeTargetingMode?: TowerTargetingMode;
  onSelectTargetingMode?: (mode: TowerTargetingMode) => void;
  onClose: () => void;
  tower?: Tower;
  elapsedTimeMs?: number;
  frameTimeMs?: number;
}) {
  const [inspectedIndex, setInspectedIndex] = useState(activeAttackIndex);
  const targetingId = useId();
  const inspected = ATTACK_DEFS[equippedAttacks[inspectedIndex]];
  const intervalMs =
    inspected && tower && !usesAttackSimulationCooldown(inspected)
      ? getAttackIntervalMs(inspected, tower, elapsedTimeMs)
      : undefined;
  const remainingMs =
    inspected && tower
      ? getAttackRemainingMs(
          inspected,
          tower.equippedAttacksRuntime[inspectedIndex],
          tower,
          elapsedTimeMs,
          frameTimeMs
        )
      : undefined;
  const busy =
    tower &&
    (tower.deepwaterGrip ||
      tower.palmSlam ||
      tower.shikoQuake ||
      tower.wakeWhip ||
      (tower.sharedSlumberUntilMs ?? 0) > elapsedTimeMs);
  const readiness = !tower
    ? 'Place this Cosmoid on the battlefield to use its moves.'
    : tower.hp <= 0
      ? 'This Cosmoid is knocked out.'
      : busy
        ? 'Finishing a committed action or sleeping. The selected move waits until it can act.'
        : remainingMs && remainingMs > 0
          ? 'Ready in ' +
            attackSeconds(Math.ceil(remainingMs / 100) * 100) +
            ((tower.paralysis?.expiresAtMs ?? 0) > elapsedTimeMs &&
            inspected &&
            usesAttackSimulationCooldown(inspected)
              ? ' · Paralysis may delay recovery.'
              : '')
          : 'Cooldown ready. Acts automatically when a valid target is available.';
  return (
    <AttackDialog title={'Moves · ' + name} onClose={onClose}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          {spriteUrl && (
            <Image
              src={spriteUrl}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
          )}
          <span>
            Lv {displayLevel}
            {displayHp !== undefined && displayMaxHp !== undefined
              ? ' · HP ' + Math.ceil(displayHp) + '/' + displayMaxHp
              : ''}
          </span>
        </div>
        <span className="rounded bg-amber-950 px-2 py-1 font-semibold text-amber-200">
          Battle paused
        </span>
      </div>
      <div
        className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
        aria-label="Known moves"
      >
        {equippedAttacks.map((id, index) => {
          const attack = ATTACK_DEFS[id];
          if (!attack) return null;
          return (
            <button
              key={id + '-' + index}
              type="button"
              aria-label={'Inspect ' + attack.name}
              aria-pressed={inspectedIndex === index}
              onClick={() => setInspectedIndex(index)}
              className={
                'flex min-h-16 flex-col items-start gap-1 rounded-lg border-2 p-2 text-left text-sm ' +
                (inspectedIndex === index
                  ? 'border-cyan-300 bg-cyan-950'
                  : 'border-slate-600 bg-slate-800 hover:border-cyan-500')
              }
            >
              <span className="font-bold">{attack.name}</span>
              <TypeBadge type={attack.type} />
              <span className="text-xs text-slate-300">
                {getAttackInformation(attack).category.split(' · ')[0]}
              </span>
              {activeAttackIndex === index && (
                <span className="text-xs font-bold text-cyan-200">Active</span>
              )}
            </button>
          );
        })}
      </div>
      {inspected && (
        <AttackDetails
          attack={inspected}
          badge={inspectedIndex === activeAttackIndex ? 'Active' : undefined}
          intervalMs={intervalMs}
          readiness={readiness}
        />
      )}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <label
          htmlFor={targetingId}
          className="text-sm font-bold text-cyan-100"
        >
          Targeting
          <select
            id={targetingId}
            value={activeTargetingMode}
            onChange={(event) =>
              onSelectTargetingMode?.(event.target.value as TowerTargetingMode)
            }
            className="ml-2 min-h-11 rounded border border-slate-500 bg-slate-800 px-2 text-sm text-white"
          >
            <option value="first">First</option>
            <option value="last">Last</option>
            <option value="closest">Closest</option>
            <option value="strongest">Strongest</option>
            <option value="weakest">Weakest</option>
            <option value="lowest-hp-percent">Lowest HP %</option>
            <option value="highest-hp-percent">Highest HP %</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!inspected || inspectedIndex === activeAttackIndex}
            onClick={() => onSelectAttack(inspectedIndex)}
            className="min-h-11 rounded-lg bg-cyan-700 px-4 py-2 font-bold text-white disabled:bg-slate-700 disabled:text-slate-400"
          >
            {inspectedIndex === activeAttackIndex
              ? 'Already Active'
              : 'Make Active'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-slate-500 bg-slate-800 px-4 py-2 font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </AttackDialog>
  );
}
