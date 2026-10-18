'use client';

import { useState } from 'react';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import type { AttackId } from '@/types/definitionIds';
import { ELEMENT_TEXT_COLORS } from '../ui/elementTextColors';
import { LearningMoveDetails } from './LearningMoveDetails';

export function AttackReplacement({
  next,
  known,
  activeIndex,
  canRelearn,
  onReplace,
  onCancel,
}: {
  next: AttackDefinition;
  known: AttackDefinition[];
  activeIndex: number;
  canRelearn: (id: AttackId) => boolean;
  onReplace: (index: number) => void;
  onCancel: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex === null ? undefined : known[selectedIndex];
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="shrink-0">
        <LearningMoveDetails attack={next} heading="New:" compact />
      </div>
      <div
        className="grid shrink-0 grid-cols-2 gap-1.5 min-[540px]:grid-cols-4"
        aria-label="Known moves"
      >
        {known.map((attack, index) => (
          <button
            key={attack.id + '-' + index}
            type="button"
            aria-label={'Compare with ' + attack.name}
            aria-pressed={selectedIndex === index}
            onClick={() => setSelectedIndex(index)}
            className={
              'min-h-11 min-w-0 rounded border px-2 py-1 text-left text-xs ' +
              (selectedIndex === index
                ? 'border-cyan-400 bg-cyan-950'
                : 'border-slate-600 bg-slate-800 hover:border-cyan-400')
            }
          >
            <span className="flex items-center justify-between gap-1">
              <span className={'font-bold ' + ELEMENT_TEXT_COLORS[attack.type]}>
                {attack.name}
              </span>
              {selectedIndex === index && (
                <span aria-label="Selected" className="text-cyan-300">
                  ✓
                </span>
              )}
              {index === activeIndex && (
                <span
                  aria-label="Active"
                  title="Active"
                  className="text-cyan-200"
                >
                  ●
                </span>
              )}
            </span>
            <span className="mt-0.5 block text-[11px] text-slate-300">
              {attack.type} ·{' '}
              {attack.category === 'physical' ? 'Physical' : 'Special'}
            </span>
          </button>
        ))}
      </div>
      <div
        aria-live="polite"
        className="min-h-0 overflow-y-auto overscroll-contain border-t border-slate-700 pt-2"
      >
        {selected ? (
          <LearningMoveDetails attack={selected} heading="Selected:" />
        ) : (
          <p className="py-2 text-xs text-slate-400">
            Select one of your moves to see its description.
          </p>
        )}
      </div>
      {selected && selectedIndex !== null && (
        <p className="sr-only">
          {selectedIndex === activeIndex
            ? next.name + ' will become active.'
            : (known[activeIndex]?.name ?? 'Your current move') +
              ' will stay active.'}{' '}
          {canRelearn(selected.id)
            ? 'You can relearn ' +
              selected.name +
              ' from this Cosmoid’s profile.'
            : selected.name + ' is not currently available to relearn.'}
        </p>
      )}
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-700 pt-2">
        {selected && (
          <p className="mr-auto text-xs">
            <span className={ELEMENT_TEXT_COLORS[selected.type]}>
              {selected.name}
            </span>
            <span className="px-1 text-cyan-300">→</span>
            <span className={ELEMENT_TEXT_COLORS[next.type]}>{next.name}</span>
          </p>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded border border-slate-500 bg-slate-800 px-3 py-1 text-xs font-bold hover:bg-slate-700"
        >
          Never Mind
        </button>
        <button
          type="button"
          disabled={!selected || selectedIndex === null}
          aria-label={
            selected
              ? 'Replace ' + selected.name + ' with ' + next.name
              : 'Select a move to replace'
          }
          onClick={() => {
            if (selected && selectedIndex !== null) onReplace(selectedIndex);
          }}
          className="min-h-11 rounded bg-cyan-700 px-3 py-1 text-xs font-bold text-white hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-400"
        >
          {selected ? 'Replace ' + selected.name : 'Select a Move'}
        </button>
      </div>
    </div>
  );
}
