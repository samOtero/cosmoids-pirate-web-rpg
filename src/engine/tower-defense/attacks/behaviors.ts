import { TowerDefenseEngine, TD_CREATURE_DEFS } from '../TowerDefenseEngine';
import { Tower } from '../types';
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
      const distance = Math.sqrt(dx * dx + dy * dy);
      let facingDirection: 'up' | 'down' | 'left' | 'right' = 'down';
      if (Math.abs(dx) > Math.abs(dy)) {
        facingDirection = dx > 0 ? 'right' : 'left';
      } else {
        facingDirection = dy > 0 ? 'down' : 'up';
      }

      const pattern = attackDef.projectilePattern;
      const projectileCount = pattern
        ? Math.min(3, Math.max(1, Math.floor(pattern.count)))
        : 1;
      const directionX = distance > 0 ? dx / distance : 0;
      const directionY = distance > 0 ? dy / distance : 0;

      for (let index = 0; index < projectileCount; index += 1) {
        const spacing = (pattern?.spacing ?? 0) * index;
        engine.projectiles.push({
          id: `proj_${Date.now()}_${index}_${Math.random()}`,
          attackDefinitionId: attackDef.id,
          sourceId: source.id,
          targetId: enemyTarget.id,
          position: {
            x: source.position.x - directionX * spacing,
            y: source.position.y - directionY * spacing,
          },
          speed: attackDef.projectileSpeed || 1,
          damage: attackDef.power,
          dealsDamage: pattern?.damageMode !== 'FIRST_ONLY' || index === 0,
          visualScale: pattern?.scales[index] ?? 1,
          target: { ...enemyTarget.position },
          facingDirection,
        });
      }
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
