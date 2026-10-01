import type { TowerDefenseEngine } from '../TowerDefenseEngine';
import type { Enemy, Tower } from '../types';
import type { AttackBehavior, AttackDefinition } from './types';

export const SHARED_SLUMBER_DURATION_MS = 6000;
export const SHARED_SLUMBER_GUARANTEED_MS = 750;
export const SHARED_SLUMBER_WAKE_CHANCE = 0.2;
export const SHARED_SLUMBER_RESISTANCE_MS = 8000;
const SHARED_SLUMBER_CAST_VFX_MS = 800;
const SHARED_SLUMBER_WAKE_VFX_MS = 360;

export function isSleeping(enemy: Enemy): boolean {
  return enemy.statusConditions.some((status) => status.type === 'SLEEP');
}

function isEligible(
  engine: TowerDefenseEngine,
  source: Tower,
  attackDef: AttackDefinition,
  enemy: Enemy
): boolean {
  return (
    engine.isEnemyTargetable(enemy) &&
    enemy.kind !== 'structure' &&
    !enemy.immuneToStatusEffects &&
    !isSleeping(enemy) &&
    (enemy.sleepResistantUntilMs ?? 0) <= engine.elapsedTimeMs &&
    engine.isEnemyInTowerRange(source.position, enemy, attackDef.rangeIndex)
  );
}

export function wakeFromSharedSlumber(
  engine: TowerDefenseEngine,
  enemy: Enemy,
  showText = true
): boolean {
  const wasSleeping = isSleeping(enemy);
  if (!wasSleeping) return false;

  enemy.statusConditions = enemy.statusConditions.filter(
    (status) => status.type !== 'SLEEP'
  );
  enemy.sleepResistantUntilMs = Math.max(
    enemy.sleepResistantUntilMs ?? 0,
    engine.elapsedTimeMs + SHARED_SLUMBER_RESISTANCE_MS
  );

  if (showText && enemy.hp > 0) {
    engine.visualEffects.push({
      id: `vfx_shared_slumber_wake_${enemy.id}_${engine.elapsedTimeMs}_${Math.random()}`,
      configId: 'attack_shared_slumber_wake_1',
      position: { ...enemy.position },
      durationMs: SHARED_SLUMBER_WAKE_VFX_MS,
      elapsedMs: 0,
      targetId: enemy.id,
    });
    engine.floatingTexts.push({
      id: `ft_awake_${enemy.id}_${engine.elapsedTimeMs}_${Math.random()}`,
      text: 'Awake!',
      position: { ...enemy.position },
      color: 0xf0abfc,
      scale: 0.8,
      durationMs: 800,
      elapsedMs: 0,
    });
  }
  return true;
}

/** Direct damage gets one wake roll per resolved attack, never per DOT tick. */
export function tryWakeFromDirectDamage(
  engine: TowerDefenseEngine,
  enemy: Enemy
): boolean {
  const sleep = enemy.statusConditions.find(
    (status) => status.type === 'SLEEP'
  );
  if (
    !sleep ||
    engine.elapsedTimeMs < (sleep.wakeChecksAfterMs ?? 0) ||
    Math.random() >= SHARED_SLUMBER_WAKE_CHANCE
  ) {
    return false;
  }
  return wakeFromSharedSlumber(engine, enemy);
}

export const SharedSlumberBehavior: AttackBehavior = {
  canExecute(engine, source, attackDef): boolean {
    return engine.enemies.some((enemy) =>
      isEligible(engine, source, attackDef, enemy)
    );
  },

  execute(engine, source, attackDef): void {
    const targets = engine.enemies.filter((enemy) =>
      isEligible(engine, source, attackDef, enemy)
    );
    if (targets.length === 0) return;

    // This commitment belongs to the tower object. The engine retains that same
    // object while undeployed, so moving or removing Dormatee cannot cancel it.
    source.sharedSlumberUntilMs =
      engine.elapsedTimeMs + SHARED_SLUMBER_DURATION_MS;

    if (attackDef.visualEffectConfigId) {
      engine.visualEffects.push({
        id: `vfx_shared_slumber_${source.id}_${engine.elapsedTimeMs}_${Math.random()}`,
        configId: attackDef.visualEffectConfigId,
        position: { ...source.position },
        durationMs: SHARED_SLUMBER_CAST_VFX_MS,
        elapsedMs: 0,
        facingDirection: source.facingDirection,
        rangeIndex: engine.getTowerAttackRange(attackDef.rangeIndex),
        targetIds: targets.map((enemy) => enemy.id),
      });
    }

    for (const enemy of targets) {
      enemy.statusConditions.push({
        type: 'SLEEP',
        durationMs: SHARED_SLUMBER_DURATION_MS,
        wakeChecksAfterMs: engine.elapsedTimeMs + SHARED_SLUMBER_GUARANTEED_MS,
      });
      enemy.damagedByTowerIds.add(source.id);
      engine.floatingTexts.push({
        id: `ft_asleep_${enemy.id}_${engine.elapsedTimeMs}_${Math.random()}`,
        text: 'Asleep!',
        position: { ...enemy.position },
        color: 0xe879f9,
        scale: 0.85,
        durationMs: 900,
        elapsedMs: 0,
      });
    }
  },
};
