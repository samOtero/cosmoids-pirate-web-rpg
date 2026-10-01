import type { TowerDefenseEngine } from '../TowerDefenseEngine';
import type { Enemy, Tower } from '../types';
import type { AttackBehavior, AttackDefinition } from './types';
import { ATTACK_DEFS } from './definitions';
import { EffectProcessor } from './EffectProcessor';
import { getWarmthWaterDamageMultiplier } from '../warmth';

function eligible(engine: TowerDefenseEngine, enemy: Enemy) {
  return (
    enemy.hp > 0 &&
    enemy.kind !== 'structure' &&
    !enemy.immuneToStatusEffects &&
    !enemy.constrictedByTowerId &&
    (enemy.constrictionResistantUntilMs ?? 0) <= engine.elapsedTimeMs
  );
}

function targetFor(
  engine: TowerDefenseEngine,
  source: Tower,
  def: AttackDefinition
) {
  if (source.hp <= 0 || source.deepwaterGrip || !def.constriction) return null;
  // A body already in flight must return before it can coil around a target.
  if (
    engine.projectiles.some(
      (p) =>
        p.sourceId === source.id &&
        p.attackDefinitionId &&
        ATTACK_DEFS[p.attackDefinitionId]?.isDashAttack
    )
  )
    return null;
  return engine.getTargetForTower(
    source,
    def.rangeIndex,
    source.targetingMode ?? 'first',
    (enemy) => eligible(engine, enemy)
  );
}

export const ConstrictionBehavior: AttackBehavior = {
  canExecute: (engine, source, def) => Boolean(targetFor(engine, source, def)),
  execute(engine, source, def) {
    const target = targetFor(engine, source, def);
    const config = def.constriction;
    if (!target || !config) return;
    source.deepwaterGrip = {
      targetId: target.id,
      attackDefinitionId: def.id,
      origin: { ...source.position },
      startedAtMs: engine.elapsedTimeMs,
      expiresAtMs: engine.elapsedTimeMs + config.durationMs,
      nextPulseAtMs: engine.elapsedTimeMs + config.pulseIntervalMs,
      warmthDamageMultiplier: getWarmthWaterDamageMultiplier(source, def),
    };
    target.constrictedByTowerId = source.id;
    target.damagedByTowerIds.add(source.id);
  },
};

export function releaseDeepwaterGrip(
  engine: TowerDefenseEngine,
  source: Tower,
  enemies: Enemy[] = engine.enemies,
  releasedAtMs = engine.elapsedTimeMs
) {
  const grip = source.deepwaterGrip;
  if (!grip) return;
  const target = enemies.find((enemy) => enemy.id === grip.targetId);
  if (target?.constrictedByTowerId === source.id) {
    target.constrictedByTowerId = undefined;
    target.constrictionResistantUntilMs =
      releasedAtMs +
      (ATTACK_DEFS[grip.attackDefinitionId].constriction?.resistanceMs ?? 6000);
  }
  source.deepwaterGrip = undefined;
}

/** Simulation time governs pulses, occupation and shared resistance, even during lag. */
export function updateDeepwaterGrips(
  engine: TowerDefenseEngine,
  enemies: Enemy[],
  deltaMs: number
) {
  const heldMs = new Map<string, number>();
  for (const source of engine.towers) {
    const grip = source.deepwaterGrip;
    if (!grip) continue;
    const target = enemies.find((enemy) => enemy.id === grip.targetId);
    const def = ATTACK_DEFS[grip.attackDefinitionId];
    if (
      !target ||
      target.hp <= 0 ||
      source.hp <= 0 ||
      target.immuneToStatusEffects ||
      target.constrictedByTowerId !== source.id ||
      source.position.x !== grip.origin.x ||
      source.position.y !== grip.origin.y ||
      !engine.isEnemyInTowerRange(source.position, target, def.rangeIndex)
    ) {
      releaseDeepwaterGrip(engine, source, enemies);
      continue;
    }
    heldMs.set(
      target.id,
      Math.max(
        0,
        Math.min(engine.elapsedTimeMs, grip.expiresAtMs) -
          Math.max(engine.elapsedTimeMs - deltaMs, grip.startedAtMs)
      )
    );
    while (
      grip.nextPulseAtMs <= Math.min(engine.elapsedTimeMs, grip.expiresAtMs) &&
      target.hp > 0
    ) {
      EffectProcessor.applyDamageAndEffects(
        engine,
        source,
        target,
        def,
        1,
        1,
        grip.warmthDamageMultiplier
      );
      grip.nextPulseAtMs += def.constriction!.pulseIntervalMs;
    }
    if (target.hp <= 0 || engine.elapsedTimeMs >= grip.expiresAtMs) {
      releaseDeepwaterGrip(
        engine,
        source,
        enemies,
        Math.min(engine.elapsedTimeMs, grip.expiresAtMs)
      );
    }
  }
  return heldMs;
}
