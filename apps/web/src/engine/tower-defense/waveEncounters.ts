import type { TDWaveGroup, TDWeightedEncounter } from './types';

/** The pool replaces the fixed encounter; weights need not add up to 100. */
export function getWaveGroupEncounters(
  group: TDWaveGroup
): TDWeightedEncounter[] {
  return (
    group.encounterPool ?? [
      { enemyDefinitionId: group.enemyDefinitionId, weight: 1 },
    ]
  );
}

export function rollWaveEncounter(
  group: TDWaveGroup,
  random: () => number = Math.random
): { enemyDefinitionId: string; pathIndex: number } {
  const fallback = {
    enemyDefinitionId: group.enemyDefinitionId,
    pathIndex: group.pathIndex,
  };
  if (!group.encounterPool) return fallback;

  const pool = group.encounterPool.filter(
    (entry) => Number.isFinite(entry.weight) && entry.weight > 0
  );
  const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
  if (!Number.isFinite(total) || total <= 0) return fallback;

  let remaining = random() * total;
  const selected =
    pool.find((entry) => {
      remaining -= entry.weight;
      return remaining < 0;
    }) ?? pool[pool.length - 1];
  return {
    enemyDefinitionId: selected.enemyDefinitionId,
    pathIndex: selected.pathIndex ?? group.pathIndex,
  };
}
