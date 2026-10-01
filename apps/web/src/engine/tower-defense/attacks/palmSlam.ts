import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import type { TowerDefenseEngine } from '../TowerDefenseEngine';
import type { Enemy, Tower } from '../types';
import { EffectProcessor } from './EffectProcessor';
import { ATTACK_DEFS } from './definitions';
import type { AttackBehavior } from './types';

export const PALM_SLAM_IMPACT_MS = 600;
export const PALM_SLAM_TOTAL_MS = 900;

export const PalmSlamBehavior: AttackBehavior = {
  canExecute(engine, source, attackDef): boolean {
    return (
      !source.palmSlam &&
      !source.shikoQuake &&
      engine.getTargetForTower(
        source,
        attackDef.rangeIndex,
        source.targetingMode || 'first'
      ) !== null
    );
  },

  execute(engine, source, attackDef): void {
    if (source.palmSlam || source.shikoQuake) return;
    const target = engine.getTargetForTower(
      source,
      attackDef.rangeIndex,
      source.targetingMode || 'first'
    );
    if (!target) return;
    source.palmSlam = {
      attackDefinitionId: attackDef.id,
      targetId: target.id,
      startedAtMs: engine.elapsedTimeMs,
      impactAtMs: engine.elapsedTimeMs + PALM_SLAM_IMPACT_MS,
      endsAtMs: engine.elapsedTimeMs + PALM_SLAM_TOTAL_MS,
      origin: { ...source.position },
      hasImpacted: false,
    };
  },
};

export function cancelPalmSlam(source: Tower): void {
  source.palmSlam = undefined;
}

/** Resolve exactly one target on contact; a lost target can be replaced. */
export function updatePalmSlams(
  engine: TowerDefenseEngine,
  towers: Tower[],
  enemies: Enemy[]
): void {
  for (const source of towers) {
    const state = source.palmSlam;
    if (!state) continue;
    if (
      source.hp <= 0 ||
      source.position.x !== state.origin.x ||
      source.position.y !== state.origin.y
    ) {
      cancelPalmSlam(source);
      continue;
    }

    const attackDef = ATTACK_DEFS[state.attackDefinitionId];
    if (!attackDef) {
      cancelPalmSlam(source);
      continue;
    }

    if (!state.hasImpacted && engine.elapsedTimeMs >= state.impactAtMs) {
      state.hasImpacted = true;
      const original = enemies.find((enemy) => enemy.id === state.targetId);
      const originalInRange =
        original &&
        engine.isEnemyTargetable(original) &&
        engine.isEnemyInTowerRange(
          source.position,
          original,
          attackDef.rangeIndex
        );
      const target = originalInRange
        ? original
        : engine.getTargetForTower(
            source,
            attackDef.rangeIndex,
            source.targetingMode || 'first'
          );

      if (target) {
        const dx = target.position.x - source.position.x;
        const dy = target.position.y - source.position.y;
        source.facingDirection =
          Math.abs(dx) > Math.abs(dy)
            ? dx >= 0
              ? 'right'
              : 'left'
            : dy >= 0
              ? 'down'
              : 'up';
        EffectProcessor.applyDamageAndEffects(
          engine,
          source,
          target,
          attackDef
        );
        if (target.hp <= 0) engine.emitEnemyDefeated(target, source);

        if (attackDef.visualEffectConfigId) {
          const configId = attackDef.visualEffectConfigId;
          const vfxConfig =
            CREATURE_TD_CONFIGS[configId]?.default?.vfxAnimation;
          engine.visualEffects.push({
            id: `vfx_palm_slam_${source.id}_${engine.elapsedTimeMs}_${Math.random()}`,
            configId,
            position: { ...target.position },
            durationMs: vfxConfig?.durationMs ?? 360,
            elapsedMs: 0,
            targetId: target.id,
            facingDirection: source.facingDirection,
          });
        }
      }
    }

    if (engine.elapsedTimeMs >= state.endsAtMs) cancelPalmSlam(source);
  }
}
