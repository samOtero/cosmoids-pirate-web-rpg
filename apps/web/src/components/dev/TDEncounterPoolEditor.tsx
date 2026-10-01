import type {
  TDWaveEnemyDefinition,
  TDWeightedEncounter,
} from '@/engine/tower-defense/types';

interface Props {
  pool?: TDWeightedEncounter[];
  defaultEnemyId: string;
  definitions: TDWaveEnemyDefinition[];
  pathCount: number;
  onChange: (pool: TDWeightedEncounter[] | undefined) => void;
}

export function TDEncounterPoolEditor({
  pool,
  defaultEnemyId,
  definitions,
  pathCount,
  onChange,
}: Props) {
  const total = pool?.reduce((sum, entry) => sum + entry.weight, 0) ?? 0;
  const inputClass =
    'w-full rounded border border-slate-700 bg-slate-950 p-1 text-white';
  const update = (index: number, patch: Partial<TDWeightedEncounter>) => {
    onChange(
      pool?.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
    );
  };

  return (
    <div className="col-span-2 space-y-2 rounded border border-slate-700 p-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-300">Random encounters</span>
        <button
          type="button"
          disabled={definitions.length === 0}
          onClick={() =>
            onChange([
              ...(pool ?? []),
              { enemyDefinitionId: defaultEnemyId, weight: 1 },
            ])
          }
          className="rounded bg-slate-700 px-2 py-1 text-white hover:bg-slate-600"
        >
          + Encounter
        </button>
      </div>
      <p className="text-slate-400">
        {pool
          ? 'Each spawn rolls independently. Weights determine the displayed chance.'
          : 'Uses the group’s fixed enemy. Add encounters to randomize each spawn.'}
      </p>
      {pool?.map((entry, index) => (
        <div key={index} className="space-y-1 border-t border-slate-700 pt-2">
          <div className="flex items-center gap-2">
            <select
              aria-label={`Encounter ${index + 1} enemy`}
              value={entry.enemyDefinitionId}
              onChange={(event) =>
                update(index, { enemyDefinitionId: event.target.value })
              }
              className={inputClass}
            >
              {definitions.map((definition) => (
                <option key={definition.id} value={definition.id}>
                  {definition.id}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label={`Remove encounter ${index + 1}`}
              onClick={() => {
                const remaining = pool.filter((_, i) => i !== index);
                onChange(remaining.length ? remaining : undefined);
              }}
              className="text-red-400"
            >
              X
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-slate-400">
              Weight (
              {Number.isFinite(total) && total > 0
                ? ((entry.weight / total) * 100).toFixed(1)
                : '0.0'}
              %)
              <input
                type="number"
                min="0.01"
                step="any"
                value={entry.weight}
                onChange={(event) =>
                  update(index, { weight: Number(event.target.value) })
                }
                className={inputClass}
              />
            </label>
            <label className="text-slate-400">
              Route
              <select
                value={entry.pathIndex ?? ''}
                onChange={(event) =>
                  update(index, {
                    pathIndex:
                      event.target.value === ''
                        ? undefined
                        : Number(event.target.value),
                  })
                }
                className={inputClass}
              >
                <option value="">Group path</option>
                {Array.from({ length: pathCount }, (_, i) => (
                  <option key={i} value={i}>
                    Path {i}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
