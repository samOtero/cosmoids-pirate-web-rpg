'use client';

import { useState } from 'react';
import type { AttackId } from '@/types/definitionIds';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
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
import { ELEMENT_TEXT_COLORS } from '@/app/components/ui/elementTextColors';
import { TargetPriorityMenu } from './TargetPriorityMenu';

const getStoryAttack = (id: AttackId) => ATTACK_DEFS[id];

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
  getAttackDefinition = getStoryAttack,
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
  getAttackDefinition?: (id: AttackId) => AttackDefinition | undefined;
}) {
  const [choosingTarget, setChoosingTarget] = useState(false);
  const inspected = getAttackDefinition(equippedAttacks[activeAttackIndex]);
  const intervalMs =
    inspected && tower && !usesAttackSimulationCooldown(inspected)
      ? getAttackIntervalMs(inspected, tower, elapsedTimeMs)
      : undefined;
  const remainingMs =
    inspected && tower
      ? getAttackRemainingMs(
          inspected,
          tower.equippedAttacksRuntime[activeAttackIndex],
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
    <AttackDialog
      title={'Moves · ' + name}
      layout="tray"
      onClose={() => (choosingTarget ? setChoosingTarget(false) : onClose())}
      headerActions={
        <>
          <span className="text-xs text-amber-200">Battle paused</span>
          {choosingTarget && (
            <button
              type="button"
              onClick={() => setChoosingTarget(false)}
              className="min-h-11 rounded border border-slate-500 bg-slate-800 px-3 text-xs font-bold focus-visible:outline-2 focus-visible:outline-cyan-300 lg:hidden"
            >
              Back to moves
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`min-h-11 rounded border border-slate-500 bg-slate-800 px-3 text-xs font-bold hover:border-cyan-300 focus-visible:outline-2 focus-visible:outline-cyan-300 ${choosingTarget ? 'hidden lg:block' : ''}`}
          >
            Close
          </button>
        </>
      }
    >
      <p className="sr-only">
        Lv {displayLevel}
        {displayHp !== undefined && displayMaxHp !== undefined
          ? ' · HP ' + Math.ceil(displayHp) + '/' + displayMaxHp
          : ''}
      </p>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div
          className={`grid min-h-0 flex-1 grid-cols-[minmax(100px,22%)_minmax(0,1fr)] gap-2 ${choosingTarget ? 'hidden lg:grid' : ''}`}
        >
          <div className="flex min-h-0 flex-col gap-1" aria-label="Known moves">
            {equippedAttacks.map((id, index) => {
              const attack = getAttackDefinition(id);
              if (!attack) return null;
              return (
                <button
                  key={id + '-' + index}
                  type="button"
                  aria-label={'Select ' + attack.name}
                  title={attack.name + ' (' + attack.type + ')'}
                  aria-pressed={activeAttackIndex === index}
                  onClick={() => {
                    if (index !== activeAttackIndex) onSelectAttack(index);
                  }}
                  className={
                    'flex min-h-0 flex-1 items-center justify-between gap-1 rounded border px-2 py-1 text-left text-sm ' +
                    (activeAttackIndex === index
                      ? 'border-cyan-300 bg-cyan-950'
                      : 'border-slate-600 bg-slate-800 hover:border-cyan-500')
                  }
                >
                  <span
                    className={
                      'min-w-0 truncate font-medium ' +
                      ELEMENT_TEXT_COLORS[attack.type]
                    }
                  >
                    {attack.name}
                  </span>
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
              badge="Active"
              intervalMs={intervalMs}
              readiness={readiness}
            />
          )}
        </div>
        <TargetPriorityMenu
          value={activeTargetingMode}
          onChange={onSelectTargetingMode}
          open={choosingTarget}
          onOpenChange={setChoosingTarget}
        />
      </div>
    </AttackDialog>
  );
}
