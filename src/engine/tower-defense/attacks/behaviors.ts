import { TowerDefenseEngine } from '../TowerDefenseEngine';
import { Enemy, Tower } from '../types';
import { AttackDefinition, AttackBehavior } from './types';
import { EffectProcessor } from './EffectProcessor';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { hasActiveSpeedBoost, hasActiveSpeedSlow } from '../speedModifiers';
import { applyAttackSpeedBuff } from '../attackSpeedModifiers';
import { RollingBarrelBehavior } from './rollingBarrel';

const MAX_PROJECTILES_PER_PATTERN = 12;

function isEligibleProjectileTarget(
  engine: TowerDefenseEngine,
  enemy: Enemy,
  attackDef: AttackDefinition
): boolean {
  const appliesSpeedSlow = attackDef.effects?.some(
    (effect) => effect.type === 'SPEED_SLOW'
  );
  if (!appliesSpeedSlow) return true;

  // Persistent slows do not stack. A target becomes ineligible only after the
  // effect lands; multiple String Shots may still be in flight toward it.
  return (
    !hasActiveSpeedSlow(enemy, engine.elapsedTimeMs) &&
    !hasActiveSpeedBoost(enemy, engine.elapsedTimeMs)
  );
}

export const ProjectileBehavior: AttackBehavior = {
  canExecute(
    engine: TowerDefenseEngine,
    source: Tower,
    attackDef: AttackDefinition
  ): boolean {
    return engine.enemies.some((enemy) => {
      if (
        enemy.hp <= 0 ||
        !isEligibleProjectileTarget(engine, enemy, attackDef)
      ) {
        return false;
      }
      return engine.isPositionInAttackRange(
        source.position,
        enemy.position,
        attackDef.rangeIndex
      );
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
      source.targetingMode || 'first',
      (enemy) => isEligibleProjectileTarget(engine, enemy, attackDef)
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
      source.facingDirection = facingDirection;

      if (attackDef.launchVisualEffectConfigId) {
        const configId = attackDef.launchVisualEffectConfigId;
        engine.visualEffects.push({
          id: `vfx_launch_${Date.now()}_${Math.random()}`,
          configId,
          position: { ...source.position },
          durationMs:
            CREATURE_TD_CONFIGS[configId]?.default?.vfxAnimation?.durationMs ??
            160,
          elapsedMs: 0,
          targetId: source.id,
          facingDirection,
        });
      }

      const pattern = attackDef.projectilePattern;
      const projectileCount = pattern
        ? Math.min(
            MAX_PROJECTILES_PER_PATTERN,
            Math.max(1, Math.floor(pattern.count))
          )
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
          origin: { ...source.position },
          launchFacingDirection: facingDirection,
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
      return engine.isPositionInAttackRange(
        source.position,
        enemy.position,
        attackDef.rangeIndex
      );
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
        engine.emitEnemyDefeated(enemyTarget, source);
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

export const AdaptiveTargetedAoeBehavior: AttackBehavior = {
  canExecute(engine, source, attackDef): boolean {
    return engine.enemies.some(
      (enemy) =>
        enemy.hp > 0 &&
        engine.isPositionInAttackRange(
          source.position,
          enemy.position,
          attackDef.rangeIndex
        )
    );
  },

  execute(engine, source, attackDef): void {
    const primaryTarget = engine.getTargetForTower(
      source,
      attackDef.rangeIndex,
      source.targetingMode || 'first'
    );
    if (!primaryTarget) return;

    const dx = primaryTarget.position.x - source.position.x;
    const dy = primaryTarget.position.y - source.position.y;
    let facingDirection: 'up' | 'down' | 'left' | 'right' = 'down';
    if (Math.abs(dx) > Math.abs(dy)) {
      facingDirection = dx > 0 ? 'right' : 'left';
    } else {
      facingDirection = dy > 0 ? 'down' : 'up';
    }
    source.facingDirection = facingDirection;

    engine.projectiles.push({
      id: `proj_adaptive_aoe_${source.id}_${engine.elapsedTimeMs}_${Math.random()}`,
      attackDefinitionId: attackDef.id,
      sourceId: source.id,
      targetId: primaryTarget.id,
      position: { ...source.position },
      origin: { ...source.position },
      launchFacingDirection: facingDirection,
      speed: attackDef.projectileSpeed ?? 1,
      damage: attackDef.power,
      target: { ...primaryTarget.position },
      facingDirection,
    });
  },
};

export function resolveAdaptiveTargetedAoeImpact(
  engine: TowerDefenseEngine,
  source: Tower,
  attackDef: AttackDefinition,
  primaryTarget: Enemy,
  showVisualEffect = true
): void {
  const config = attackDef.adaptiveTargetedAoe;
  if (!config) return;

  const targets = engine.enemies.filter(
    (enemy) =>
      enemy.hp > 0 &&
      engine.isPositionInAttackRange(
        primaryTarget.position,
        enemy.position,
        config.radiusIndex
      )
  );
  const resolvedAttack =
    targets.length === 1
      ? {
          ...attackDef,
          power: config.singleTargetPower,
          effects: config.singleTargetEffects,
        }
      : attackDef;

  targets.forEach((enemy) => {
    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      enemy,
      resolvedAttack
    );
    if (enemy.hp <= 0) {
      engine.emitEnemyDefeated(enemy, source);
    }
  });

  if (showVisualEffect && attackDef.visualEffectConfigId) {
    const configId = attackDef.visualEffectConfigId;
    const vfxConfig = CREATURE_TD_CONFIGS[configId]?.default?.vfxAnimation;
    engine.visualEffects.push({
      id: `vfx_adaptive_aoe_${source.id}_${engine.elapsedTimeMs}_${Math.random()}`,
      configId,
      position: { ...primaryTarget.position },
      durationMs: vfxConfig?.durationMs ?? 520,
      elapsedMs: 0,
      facingDirection: source.facingDirection,
      targetId: primaryTarget.id,
      rangeIndex: config.radiusIndex,
    });
  }
}

export const InstantAoeBehavior: AttackBehavior = {
  canExecute(
    engine: TowerDefenseEngine,
    source: Tower,
    attackDef: AttackDefinition
  ): boolean {
    return engine.enemies.some(
      (enemy) =>
        engine.isPositionInAttackRange(
          source.position,
          enemy.position,
          attackDef.rangeIndex
        ) &&
        Boolean(enemy.heldCaptureUnitId) &&
        !enemy.hasBeenWindDisarmed
    );
  },

  execute(
    engine: TowerDefenseEngine,
    source: Tower,
    attackDef: AttackDefinition
  ): void {
    const pickupLockMs = attackDef.itemPickupLockMs ?? 2000;

    engine.enemies.forEach((enemy) => {
      if (
        !engine.isPositionInAttackRange(
          source.position,
          enemy.position,
          attackDef.rangeIndex
        ) ||
        !enemy.heldCaptureUnitId ||
        enemy.hasBeenWindDisarmed
      ) {
        return;
      }

      const carriedUnit = engine.captureUnits.find(
        (unit) => unit.id === enemy.heldCaptureUnitId
      );
      if (!carriedUnit || carriedUnit.heldByEnemyId !== enemy.id) return;

      engine.dropCaptureUnit(enemy);
      enemy.hasBeenWindDisarmed = true;
      enemy.itemPickupBlockedUntilMs = engine.elapsedTimeMs + pickupLockMs;
      enemy.damagedByTowerIds.add(source.id);

      engine.floatingTexts.push({
        id: `ft_drop_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        text: 'Dropped!',
        position: { ...enemy.position },
        color: 0xf4c76b,
        scale: 0.85,
        durationMs: 900,
        elapsedMs: 0,
      });
    });

    if (attackDef.visualEffectConfigId) {
      const configMap = CREATURE_TD_CONFIGS[attackDef.visualEffectConfigId];
      const vfxConfig = configMap?.default?.vfxAnimation;
      engine.visualEffects.push({
        id: `vfx_${Date.now()}_${Math.random()}`,
        configId: attackDef.visualEffectConfigId,
        position: { ...source.position },
        durationMs: vfxConfig?.durationMs ?? 750,
        elapsedMs: 0,
        facingDirection: source.facingDirection,
        rangeIndex: attackDef.rangeIndex,
      });
    }
  },
};

function isEligiblePoisonAoeTarget(
  engine: TowerDefenseEngine,
  source: Tower,
  attackDef: AttackDefinition,
  enemy: Enemy
): boolean {
  return (
    enemy.hp > 0 &&
    !enemy.immuneToStatusEffects &&
    !enemy.statusConditions.some((status) => status.type === 'POISON') &&
    engine.isPositionInAttackRange(
      source.position,
      enemy.position,
      attackDef.rangeIndex
    )
  );
}

export const PoisonAoeBehavior: AttackBehavior = {
  canExecute(engine, source, attackDef): boolean {
    return engine.enemies.some((enemy) =>
      isEligiblePoisonAoeTarget(engine, source, attackDef, enemy)
    );
  },

  execute(engine, source, attackDef): void {
    const targets = engine.enemies.filter((enemy) =>
      isEligiblePoisonAoeTarget(engine, source, attackDef, enemy)
    );
    if (targets.length === 0) return;

    targets.forEach((enemy) => {
      EffectProcessor.applyDamageAndEffects(engine, source, enemy, attackDef);
    });

    if (attackDef.visualEffectConfigId) {
      const configId = attackDef.visualEffectConfigId;
      const vfxConfig = CREATURE_TD_CONFIGS[configId]?.default?.vfxAnimation;
      engine.visualEffects.push({
        id: `vfx_toxic_pollen_${source.id}_${engine.elapsedTimeMs}_${Math.random()}`,
        configId,
        position: { ...source.position },
        durationMs: vfxConfig?.durationMs ?? 900,
        elapsedMs: 0,
        facingDirection: source.facingDirection,
        rangeIndex: attackDef.rangeIndex,
      });
    }
  },
};

export const SupportAuraBehavior: AttackBehavior = {
  canExecute(engine, source, attackDef) {
    // Open with the howl as soon as enemies arrive, without wasting it between waves.
    return (
      source.hp > 0 &&
      Boolean(attackDef.supportBuff) &&
      engine.enemies.some((enemy) => enemy.hp > 0)
    );
  },
  execute(engine, source, attackDef) {
    const buff = attackDef.supportBuff;
    if (!buff || source.hp <= 0) return;
    for (const ally of engine.towers) {
      if (
        ally.hp <= 0 ||
        !engine.isPositionInAttackRange(
          source.position,
          ally.position,
          attackDef.rangeIndex
        )
      )
        continue;
      applyAttackSpeedBuff(
        ally,
        buff.attackSpeedMultiplier,
        buff.durationMs,
        engine.elapsedTimeMs
      );
    }
    if (attackDef.visualEffectConfigId) {
      const configId = attackDef.visualEffectConfigId;
      engine.visualEffects.push({
        id: `vfx_rally_${source.id}_${engine.elapsedTimeMs}_${Math.random()}`,
        configId,
        position: { ...source.position },
        durationMs:
          CREATURE_TD_CONFIGS[configId]?.default?.vfxAnimation?.durationMs ??
          800,
        elapsedMs: 0,
        facingDirection: source.facingDirection,
        rangeIndex: attackDef.rangeIndex,
      });
    }
  },
};

export function getShipshapeTarget(
  engine: TowerDefenseEngine,
  source: Tower,
  attackDef: AttackDefinition
): Tower | undefined {
  if (source.hp <= 0 || !attackDef.repairSupport) return undefined;
  const candidates = engine.towers.filter(
    (ally) =>
      ally.hp > 0 &&
      ally.maxHp > 0 &&
      engine.isPositionInAttackRange(
        source.position,
        ally.position,
        attackDef.rangeIndex
      )
  );
  const injured = candidates.filter((ally) => ally.hp < ally.maxHp);
  // Stable ordering breaks equal-health ties in favor of the crew over self.
  injured.sort(
    (a, b) =>
      a.hp / a.maxHp - b.hp / b.maxHp ||
      Number(a.id === source.id) - Number(b.id === source.id)
  );
  if (injured.length) return injured[0];
  return (
    candidates.find(
      (ally) => ally.id !== source.id && (ally.defenseBoostMultiplier ?? 1) <= 1
    ) ?? candidates.find((ally) => (ally.defenseBoostMultiplier ?? 1) <= 1)
  );
}

export const RepairSupportBehavior: AttackBehavior = {
  canExecute(engine, source, attackDef) {
    return Boolean(getShipshapeTarget(engine, source, attackDef));
  },
  execute(engine, source, attackDef) {
    const recipient = getShipshapeTarget(engine, source, attackDef);
    const repair = attackDef.repairSupport;
    if (!recipient || !repair) return;

    const healed = Math.min(
      recipient.maxHp - recipient.hp,
      recipient.maxHp * repair.healFraction
    );
    recipient.hp += healed;
    const previousMultiplier = recipient.defenseBoostMultiplier ?? 1;
    const nextMultiplier = Math.max(previousMultiplier, repair.defenseMultiplier);
    // currentDefense is the combat stat; the multiplier also drives its badge.
    recipient.currentDefense *= nextMultiplier / previousMultiplier;
    recipient.defenseBoostMultiplier = nextMultiplier;

    const effects = [attackDef.visualEffectConfigId];
    if (healed > 0) effects.push('attack_shipshape_heal');
    if (previousMultiplier <= 1) effects.push('attack_shipshape_brace');
    for (const configId of effects) {
      if (!configId) continue;
      engine.visualEffects.push({
        id: `vfx_shipshape_${configId}_${recipient.id}_${engine.elapsedTimeMs}_${Math.random()}`,
        configId,
        position: { ...recipient.position },
        targetId: recipient.id,
        durationMs:
          CREATURE_TD_CONFIGS[configId]?.default?.vfxAnimation?.durationMs ?? 900,
        elapsedMs: 0,
      });
    }
  },
};

export const AttackBehaviorRegistry: Record<string, AttackBehavior> = {
  ROLLING_BARREL: RollingBarrelBehavior,
  PROJECTILE: ProjectileBehavior,
  INSTANT_MELEE: InstantMeleeBehavior,
  INSTANT_AOE: InstantAoeBehavior,
  ADAPTIVE_TARGETED_AOE: AdaptiveTargetedAoeBehavior,
  POISON_AOE: PoisonAoeBehavior,
  SUPPORT_AURA: SupportAuraBehavior,
  REPAIR_SUPPORT: RepairSupportBehavior,
};
