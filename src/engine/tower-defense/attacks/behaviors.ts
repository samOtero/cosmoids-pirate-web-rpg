import { TowerDefenseEngine, TD_CREATURE_DEFS } from '../TowerDefenseEngine';
import { Tower, Enemy } from '../types';
import { AttackDefinition, AttackBehavior } from './types';
import { EffectProcessor } from './EffectProcessor';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';

export const ProjectileBehavior: AttackBehavior = {
  canExecute(
    engine: TowerDefenseEngine,
    source: Tower,
    attackDef: AttackDefinition
  ): boolean {
    return engine.enemies.some((enemy) => {
      const dx = enemy.position.x - source.position.x;
      const dy = enemy.position.y - source.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= attackDef.rangeIndex;
    });
  },

  execute(
    engine: TowerDefenseEngine,
    source: Tower,
    attackDef: AttackDefinition
  ): void {
    const targetEnemy = engine.getTargetForTower(
      source,
      attackDef.rangeIndex,
      source.targetingMode || 'first'
    );

    if (targetEnemy) {
      const enemyTarget = targetEnemy;

      const dx = enemyTarget.position.x - source.position.x;
      const dy = enemyTarget.position.y - source.position.y;
      let facingDirection: 'up' | 'down' | 'left' | 'right' = 'down';
      if (Math.abs(dx) > Math.abs(dy)) {
        facingDirection = dx > 0 ? 'right' : 'left';
      } else {
        facingDirection = dy > 0 ? 'down' : 'up';
      }

      engine.projectiles.push({
        id: `proj_${Date.now()}_${Math.random()}`,
        attackDefinitionId: attackDef.id,
        sourceId: source.id,
        targetId: enemyTarget.id,
        position: { ...source.position },
        speed: attackDef.projectileSpeed || 1,
        damage: attackDef.power,
        target: { ...enemyTarget.position },
        facingDirection,
      });
    }
  },
};

export const InstantMeleeBehavior: AttackBehavior = {
  canExecute(
    engine: TowerDefenseEngine,
    source: Tower,
    attackDef: AttackDefinition
  ): boolean {
    return engine.enemies.some((enemy) => {
      const dx = enemy.position.x - source.position.x;
      const dy = enemy.position.y - source.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= attackDef.rangeIndex;
    });
  },

  execute(
    engine: TowerDefenseEngine,
    source: Tower,
    attackDef: AttackDefinition
  ): void {
    const targetEnemy = engine.getTargetForTower(
      source,
      attackDef.rangeIndex,
      source.targetingMode || 'first'
    );

    if (targetEnemy) {
      const enemyTarget = targetEnemy;

      // Apply damage immediately
      EffectProcessor.applyDamageAndEffects(
        engine,
        source,
        enemyTarget,
        attackDef
      );

      // Check for death
      if (enemyTarget.hp <= 0) {
        // Record the killing blow tower as a participant
        enemyTarget.damagedByTowerIds.add(source.id);
        const meta = TD_CREATURE_DEFS[enemyTarget.definitionId];
        engine.events.emit({
          type: 'ENEMY_DIED',
          enemyId: enemyTarget.id,
          enemyDefinitionId: enemyTarget.definitionId,
          enemyLevel: meta ? meta.baseCreature.level : 1,
          participantTowerIds: Array.from(enemyTarget.damagedByTowerIds),
        });
      }

      // Add visual effect if configured
      if (attackDef.visualEffectConfigId) {
        const configMap = CREATURE_TD_CONFIGS[attackDef.visualEffectConfigId];
        const vfxConfig = configMap?.default?.vfxAnimation;
        const durationMs = vfxConfig?.durationMs ?? 500;
        engine.visualEffects.push({
          id: `vfx_${Date.now()}_${Math.random()}`,
          configId: attackDef.visualEffectConfigId,
          position: { ...enemyTarget.position },
          durationMs,
          elapsedMs: 0,
          targetId: enemyTarget.id,
        });
      }
    }
  },
};

export const AttackBehaviorRegistry: Record<string, AttackBehavior> = {
  PROJECTILE: ProjectileBehavior,
  INSTANT_MELEE: InstantMeleeBehavior,
};
