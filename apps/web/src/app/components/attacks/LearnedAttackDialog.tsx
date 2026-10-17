'use client';

import { useState } from 'react';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import { AttackDialog } from './AttackDialog';
import { AttackDetails } from './AttackDetails';

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
  const [viewingCurrent, setViewingCurrent] = useState(false);
  return (
    <AttackDialog title="New Attack Learned!" onClose={onClose}>
      <p className="mb-2 text-xs text-slate-200">
        {creatureName} learned {attack.name}.
      </p>
      {current && !isActive && (
        <div className="mb-1 flex gap-1 text-xs" aria-label="Comparison view">
          <button
            type="button"
            aria-pressed={!viewingCurrent}
            onClick={() => setViewingCurrent(false)}
            className={
              'min-h-7 flex-1 rounded border px-2 py-1 ' +
              (!viewingCurrent
                ? 'border-cyan-400 bg-cyan-950'
                : 'border-slate-600')
            }
          >
            New: {attack.name}
          </button>
          <button
            type="button"
            aria-label={'Compare with current active move: ' + current.name}
            aria-pressed={viewingCurrent}
            onClick={() => setViewingCurrent(true)}
            className={
              'min-h-7 flex-1 rounded border px-2 py-1 ' +
              (viewingCurrent
                ? 'border-cyan-400 bg-cyan-950'
                : 'border-slate-600')
            }
          >
            Active: {current.name}
          </button>
        </div>
      )}
      <div className="grid h-32 min-h-0">
        <AttackDetails
          attack={viewingCurrent && current ? current : attack}
          badge={viewingCurrent || isActive ? 'Active' : 'Learned'}
          compareWith={!viewingCurrent && !isActive ? current : undefined}
        />
      </div>
      <p className="mt-2 text-xs text-slate-300">
        {isActive
          ? attack.name + ' is already active.'
          : current
            ? current.name + ' stays active unless you choose Make Active.'
            : 'Choose an active move from the move menu.'}
      </p>
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="min-h-9 rounded border border-slate-500 bg-slate-800 px-3 py-1 text-xs font-bold"
        >
          {isActive ? 'Continue' : 'Keep Current Active'}
        </button>
        {!isActive && (
          <button
            type="button"
            disabled={!canActivate}
            onClick={onActivate}
            className="min-h-9 rounded bg-cyan-700 px-3 py-1 text-xs font-bold disabled:bg-slate-700 disabled:text-slate-400"
          >
            Make Active
          </button>
        )}
      </div>
    </AttackDialog>
  );
}
