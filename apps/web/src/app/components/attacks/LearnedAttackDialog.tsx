'use client';

import { useState, type ComponentProps } from 'react';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import { AttackDialog } from './AttackDialog';
import { AttackReplacement } from './AttackReplacement';
import { LearningMoveDetails } from './LearningMoveDetails';
import { ELEMENT_TEXT_COLORS } from '../ui/elementTextColors';

type LearningProps = {
  creatureName: string;
  creatureIcon?: string;
  attack: AttackDefinition;
  onClose: () => void;
} & (
  | {
      replacement?: undefined;
      isActive: boolean;
      canActivate: boolean;
      onActivate: () => void;
    }
  | {
      replacement: Omit<
        ComponentProps<typeof AttackReplacement>,
        'next' | 'onCancel'
      >;
    }
);

export function LearnedAttackDialog(props: LearningProps) {
  const [choosingReplacement, setChoosingReplacement] = useState(false);
  const { attack, creatureName, creatureIcon, onClose, replacement } = props;
  const title = choosingReplacement ? (
    'Choose a move to replace'
  ) : (
    <>
      {creatureName} {replacement ? 'is trying to learn' : 'learned'}{' '}
      <span className={ELEMENT_TEXT_COLORS[attack.type]}>{attack.name}</span>!
    </>
  );
  return (
    <AttackDialog
      key={choosingReplacement ? 'replacement' : 'notification'}
      title={title}
      creatureIcon={creatureIcon}
      creatureName={choosingReplacement ? creatureName : undefined}
      layout="learning"
      onClose={onClose}
    >
      {choosingReplacement && replacement ? (
        <AttackReplacement next={attack} {...replacement} onCancel={onClose} />
      ) : (
        <div className="flex min-h-0 flex-col gap-3">
          <div className="min-h-0 overflow-y-auto overscroll-contain">
            <LearningMoveDetails attack={attack} />
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-700 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded border border-slate-500 bg-slate-800 px-3 py-1 text-xs font-bold hover:bg-slate-700"
            >
              {replacement ? "Don't Learn" : 'Continue'}
            </button>
            {replacement ? (
              <button
                type="button"
                onClick={() => setChoosingReplacement(true)}
                className="min-h-11 rounded bg-cyan-700 px-3 py-1 text-xs font-bold hover:bg-cyan-600"
              >
                Replace a Move
              </button>
            ) : (
              !props.isActive && (
                <button
                  type="button"
                  disabled={!props.canActivate}
                  onClick={props.onActivate}
                  className="min-h-11 rounded bg-cyan-700 px-3 py-1 text-xs font-bold hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-400"
                >
                  Make Active
                </button>
              )
            )}
          </div>
        </div>
      )}
    </AttackDialog>
  );
}
