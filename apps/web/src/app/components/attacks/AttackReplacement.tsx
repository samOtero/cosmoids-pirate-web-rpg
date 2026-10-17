'use client';

import { useState } from 'react';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import type { AttackId } from '@/types/definitionIds';
import { AttackDetails, AttackComparison } from './AttackDetails';

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
    <div className="space-y-3">
      <p className="text-sm text-slate-300">
        Already knows four moves. Select a move to compare before choosing what
        to replace.
      </p>
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        aria-label="Known moves"
      >
        {known.map((attack, index) => (
          <button
            key={`${attack.id}-${index}`}
            type="button"
            aria-label={`Compare with ${attack.name}`}
            aria-pressed={selectedIndex === index}
            onClick={() => setSelectedIndex(index)}
            className={`min-h-12 rounded-lg border-2 p-2 text-left text-sm ${selectedIndex === index ? 'border-amber-400 bg-amber-950' : 'border-slate-600 bg-slate-800 hover:border-cyan-400'}`}
          >
            <span className="block font-bold">{attack.name}</span>
            {index === activeIndex && (
              <span className="text-xs text-cyan-200">Active</span>
            )}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {selected && (
          <AttackDetails attack={selected} badge="Move to replace" />
        )}
        <AttackDetails attack={next} badge="New move" />
      </div>
      {selected && selectedIndex !== null && (
        <>
          <AttackComparison previous={selected} next={next} />
          <p className="text-sm text-slate-200">
            {selectedIndex === activeIndex
              ? `${next.name} will become active because it replaces your active move.`
              : `${known[activeIndex]?.name ?? 'Your current move'} will stay active.`}
          </p>
          <p className="text-xs text-slate-400">
            {canRelearn(selected.id)
              ? `You can relearn ${selected.name} from this Cosmoid’s profile.`
              : `${selected.name} is not currently available to relearn from this Cosmoid’s profile.`}
          </p>
        </>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-lg border border-slate-500 bg-slate-800 px-4 py-2 font-bold"
        >
          Do Not Learn
        </button>
        <button
          type="button"
          disabled={!selected || selectedIndex === null}
          onClick={() => {
            if (selectedIndex !== null) onReplace(selectedIndex);
          }}
          className="min-h-11 rounded-lg bg-cyan-700 px-4 py-2 font-bold text-white disabled:bg-slate-700 disabled:text-slate-400"
        >
          {selected
            ? `Replace ${selected.name} with ${next.name}`
            : 'Select a move to replace'}
        </button>
      </div>
    </div>
  );
}
