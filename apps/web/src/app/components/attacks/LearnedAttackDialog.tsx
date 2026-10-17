'use client';

import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import { AttackDialog } from './AttackDialog';
import { AttackDetails, AttackComparison } from './AttackDetails';

export function LearnedAttackDialog({
  creatureName,
  attack,
  current,
  isActive,
  canActivate,
  onActivate,
  onClose,
}: {
  creatureName: string;
  attack: AttackDefinition;
  current?: AttackDefinition;
  isActive: boolean;
  canActivate: boolean;
  onActivate: () => void;
  onClose: () => void;
}) {
  return (
    <AttackDialog title="New Attack Learned!" onClose={onClose}>
      <p className="mb-3 text-sm text-slate-200">
        {creatureName} learned {attack.name}. It has been added to your known
        moves.
      </p>
      <AttackDetails attack={attack} badge={isActive ? 'Active' : 'Learned'} />
      {current && !isActive && (
        <details className="mt-3 rounded-lg border border-slate-600 p-3">
          <summary className="min-h-8 cursor-pointer font-semibold text-cyan-200">
            Compare with current active move: {current.name}
          </summary>
          <div className="mt-3 space-y-3">
            <AttackDetails attack={current} badge="Current active" />
            <AttackComparison previous={current} next={attack} />
          </div>
        </details>
      )}
      <p className="mt-3 text-sm text-slate-300">
        {isActive
          ? `${attack.name} is already active.`
          : current
            ? `${current.name} stays active unless you choose Make Active.`
            : 'You can choose an active move from the move menu.'}
      </p>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-lg border border-slate-500 bg-slate-800 px-4 py-2 font-bold"
        >
          {isActive ? 'Continue' : 'Keep Current Active'}
        </button>
        {!isActive && (
          <button
            type="button"
            disabled={!canActivate}
            onClick={onActivate}
            className="min-h-11 rounded-lg bg-cyan-700 px-4 py-2 font-bold disabled:bg-slate-700 disabled:text-slate-400"
          >
            Make Active
          </button>
        )}
      </div>
    </AttackDialog>
  );
}
