'use client';

import { useId, useState } from 'react';
import type { AttackId } from '@/types/definitionIds';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import type { PlayerCreature } from '@/types/baseGame';
import type { Tower, TowerTargetingMode } from '@/engine/tower-defense/types';
import {
  getAttackIntervalMs,
  getAttackRemainingMs,
  usesAttackSimulationCooldown,
} from '@/engine/tower-defense/attacks/timing';
import { attackSeconds } from '@/utils/attackInformation';
import { AttackDetails } from '@/app/components/attacks/AttackDetails';
import { AttackDialog } from '@/app/components/attacks/AttackDialog';

export function ActiveAttackMenu({
  name,
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
    ? 'Not placed'
    : tower.hp <= 0
      ? 'Knocked out'
      : busy
        ? 'Busy · waiting for the current action'
        : remainingMs && remainingMs > 0
          ? 'Ready in ' +
            attackSeconds(Math.ceil(remainingMs / 100) * 100) +
            ((tower.paralysis?.expiresAtMs ?? 0) > elapsedTimeMs &&
            inspected &&
            usesAttackSimulationCooldown(inspected)
              ? ' · Slowed by paralysis'
              : '')
          : 'Cooldown ready';
  return (
    <AttackDialog title={'Moves · ' + name} layout="tray" onClose={onClose}>
      <p className="sr-only">
        Lv {displayLevel}
        {displayHp !== undefined && displayMaxHp !== undefined
          ? ' · HP ' + Math.ceil(displayHp) + '/' + displayMaxHp
          : ''}
      </p>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(110px,22%)_minmax(0,1fr)_126px] gap-2">
        <div className="flex min-h-0 flex-col gap-1" aria-label="Known moves">
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
                  'flex min-h-0 flex-1 items-center justify-between gap-1 rounded border px-2 py-1 text-left text-sm ' +
                  (inspectedIndex === index
                    ? 'border-cyan-300 bg-cyan-950'
                    : 'border-slate-600 bg-slate-800 hover:border-cyan-500')
                }
              >
                <span className="truncate">{attack.name}</span>
                {activeAttackIndex === index && (
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
        {inspected && (
          <AttackDetails
            attack={inspected}
            badge={inspectedIndex === activeAttackIndex ? 'Active' : undefined}
            intervalMs={intervalMs}
            readiness={readiness}
          />
        )}
        <div className="flex min-h-0 flex-col gap-1">
          <label htmlFor={targetingId} className="sr-only">
            Targeting
          </label>
          <select
            id={targetingId}
            value={activeTargetingMode}
            onChange={(event) =>
              onSelectTargetingMode?.(event.target.value as TowerTargetingMode)
            }
            className="min-h-8 w-full rounded border border-slate-500 bg-slate-800 px-1 text-xs text-white"
          >
            <option value="first">First</option>
            <option value="last">Last</option>
            <option value="closest">Closest</option>
            <option value="strongest">Strongest</option>
            <option value="weakest">Weakest</option>
            <option value="lowest-hp-percent">Lowest HP %</option>
            <option value="highest-hp-percent">Highest HP %</option>
          </select>
          <button
            type="button"
            disabled={!inspected || inspectedIndex === activeAttackIndex}
            onClick={() => onSelectAttack(inspectedIndex)}
            className="min-h-9 rounded bg-cyan-700 px-2 text-xs font-bold text-white disabled:bg-slate-700 disabled:text-slate-400"
          >
            {inspectedIndex === activeAttackIndex
              ? 'Already Active'
              : 'Make Active'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-8 rounded border border-slate-500 bg-slate-800 px-2 text-xs font-bold"
          >
            Close
          </button>
          <span className="text-center text-xs text-amber-200">
            Battle paused
          </span>
        </div>
      </div>
    </AttackDialog>
  );
}
