'use client';

import { useState } from 'react';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import type { AttackId } from '@/types/definitionIds';
import { AttackDetails } from './AttackDetails';

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
  const [viewingCurrent, setViewingCurrent] = useState(false);
  const selected = selectedIndex === null ? undefined : known[selectedIndex];
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-300">
        Choose a move to compare, then confirm its replacement.
      </p>
      <div className="grid h-40 min-h-0 grid-cols-[minmax(120px,30%)_minmax(0,1fr)] gap-2">
        <div className="flex min-h-0 flex-col gap-1" aria-label="Known moves">
          {known.map((attack, index) => (
            <button
              key={attack.id + '-' + index}
              type="button"
              aria-label={'Compare with ' + attack.name}
              aria-pressed={selectedIndex === index}
              onClick={() => {
                setSelectedIndex(index);
                setViewingCurrent(true);
              }}
              className={
                'flex min-h-0 flex-1 items-center justify-between gap-1 rounded border px-2 py-1 text-left text-sm ' +
                (selectedIndex === index
                  ? 'border-amber-400 bg-amber-950'
                  : 'border-slate-600 bg-slate-800 hover:border-cyan-400')
              }
            >
              <span>{attack.name}</span>
              {index === activeIndex && (
                <span
                  aria-label="Active"
                  title="Active"
                  className="text-xs text-cyan-200"
                >
                  ●
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex min-h-0 min-w-0 flex-col gap-1">
          {selected && (
            <div
              className="flex shrink-0 gap-1 text-xs"
              aria-label="Comparison view"
            >
              <button
                type="button"
                aria-pressed={viewingCurrent}
                onClick={() => setViewingCurrent(true)}
                className={
                  'min-h-7 min-w-0 flex-1 rounded border px-1 py-1 ' +
                  (viewingCurrent
                    ? 'border-amber-400 bg-amber-950'
                    : 'border-slate-600')
                }
              >
                Old: {selected.name}
              </button>
              <button
                type="button"
                aria-pressed={!viewingCurrent}
                onClick={() => setViewingCurrent(false)}
                className={
                  'min-h-7 min-w-0 flex-1 rounded border px-1 py-1 ' +
                  (!viewingCurrent
                    ? 'border-cyan-400 bg-cyan-950'
                    : 'border-slate-600')
                }
              >
                New: {next.name}
              </button>
            </div>
          )}
          <div className="grid min-h-0 flex-1">
            <AttackDetails
              attack={viewingCurrent && selected ? selected : next}
              badge={viewingCurrent && selected ? 'To replace' : 'New move'}
              compareWith={!viewingCurrent ? selected : undefined}
            />
          </div>
        </div>
      </div>
      {selected && selectedIndex !== null && (
        <p className="text-xs leading-snug text-slate-300">
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
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-9 shrink-0 rounded border border-slate-500 bg-slate-800 px-3 py-1 text-xs font-bold"
        >
          Do Not Learn
        </button>
        <button
          type="button"
          disabled={!selected || selectedIndex === null}
          onClick={() => {
            if (selectedIndex !== null) onReplace(selectedIndex);
          }}
          className="min-h-9 rounded bg-cyan-700 px-3 py-1 text-xs font-bold text-white disabled:bg-slate-700 disabled:text-slate-400"
        >
          {selected
            ? 'Replace ' + selected.name + ' with ' + next.name
            : 'Select a move to replace'}
        </button>
      </div>
    </div>
  );
}
