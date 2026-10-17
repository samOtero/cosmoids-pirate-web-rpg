import { getDefinitionVisuals } from '@/utils/definitionVisuals';

import type { TowerDefenseEngine } from '../TowerDefenseEngine';
import type { Enemy, Tower } from '../types';
import { EffectProcessor } from './EffectProcessor';
import { ATTACK_DEFS } from './definitions';
import type { AttackBehavior, AttackDefinition } from './types';

export const SHIKO_QUAKE_IMPACT_MS = 360;
export const SHIKO_QUAKE_TOTAL_MS = 700;
export const SHIKO_STOMP_MAX_TARGETS = 3;
const SHIKO_STOMP_HIT_VFX_ID = 'attack_shiko_quake_hit_1';

function hasTargetInRange(
  engine: TowerDefenseEngine,
  source: Tower,
  attackDef: AttackDefinition
): boolean {
  return engine.enemies.some(
    (enemy) =>
      engine.isEnemyTargetable(enemy) &&
      engine.isEnemyInTowerRange(source.position, enemy, attackDef.rangeIndex)
  );
}

export const ShikoQuakeBehavior: AttackBehavior = {
  canExecute(engine, source, attackDef): boolean {
    return !source.shikoQuake && hasTargetInRange(engine, source, attackDef);
  },

  execute(engine, source, attackDef): void {
    if (source.shikoQuake || !hasTargetInRange(engine, source, attackDef)) {
      return;
    }
    source.shikoQuake = {
      attackDefinitionId: attackDef.id,
      startedAtMs: engine.elapsedTimeMs,
      impactAtMs: engine.elapsedTimeMs + SHIKO_QUAKE_IMPACT_MS,
      endsAtMs: engine.elapsedTimeMs + SHIKO_QUAKE_TOTAL_MS,
      origin: { ...source.position },
      hasImpacted: false,
    };
  },
};

export function cancelShikoQuake(source: Tower): void {
  source.shikoQuake = undefined;
}

/** Resolves at most three prioritized hits on the slam frame. */
export function updateShikoQuakes(
  engine: TowerDefenseEngine,
  towers: Tower[]
): void {
  for (const source of towers) {
    const state = source.shikoQuake;
    if (!state) continue;
    if (
      source.hp <= 0 ||
      source.position.x !== state.origin.x ||
      source.position.y !== state.origin.y
    ) {
      cancelShikoQuake(source);
      continue;
    }

    const attackDef = ATTACK_DEFS[state.attackDefinitionId];
    if (!attackDef) {
      cancelShikoQuake(source);
      continue;
    }

    if (!state.hasImpacted && engine.elapsedTimeMs >= state.impactAtMs) {
      state.hasImpacted = true;
      const targets: Enemy[] = [];
      const selectedIds = new Set<string>();
      while (targets.length < SHIKO_STOMP_MAX_TARGETS) {
        const target = engine.getTargetForTower(
          source,
          attackDef.rangeIndex,
          source.targetingMode || 'first',
          (enemy) => !selectedIds.has(enemy.id)
        );
        if (!target) break;
        targets.push(target);
        selectedIds.add(target.id);
      }

      for (const enemy of targets) {
        EffectProcessor.applyDamageAndEffects(engine, source, enemy, attackDef);
        if (enemy.hp <= 0) engine.emitEnemyDefeated(enemy, source);
        const hitConfig = getDefinitionVisuals(SHIKO_STOMP_HIT_VFX_ID)?.default
          ?.vfxAnimation;
        engine.visualEffects.push({
          id: `vfx_shiko_hit_${source.id}_${enemy.id}_${engine.elapsedTimeMs}_${Math.random()}`,
          configId: SHIKO_STOMP_HIT_VFX_ID,
          position: { ...enemy.position },
          durationMs: hitConfig?.durationMs ?? 300,
          elapsedMs: 0,
          targetId: enemy.id,
        });
      }

      if (attackDef.visualEffectConfigId) {
        const configId = attackDef.visualEffectConfigId;
        const vfxConfig = getDefinitionVisuals(configId)?.default?.vfxAnimation;
        engine.visualEffects.push({
          id: `vfx_shiko_quake_${source.id}_${engine.elapsedTimeMs}_${Math.random()}`,
          configId,
          position: { ...source.position },
          durationMs: vfxConfig?.durationMs ?? 420,
          elapsedMs: 0,
          facingDirection: source.facingDirection,
          rangeIndex: engine.getTowerAttackRange(attackDef.rangeIndex),
        });
      }
    }

    if (engine.elapsedTimeMs >= state.endsAtMs) {
      cancelShikoQuake(source);
    }
  }
}
