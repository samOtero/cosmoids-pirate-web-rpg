import { TowerDefenseEngine } from '../TowerDefenseEngine';
import { Enemy, Tower } from '../types';
import { AttackDefinition, AttackBehavior } from './types';
import { EffectProcessor } from './EffectProcessor';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { hasActiveSpeedBoost, hasActiveSpeedSlow } from '../speedModifiers';
import { applyAttackSpeedBuff } from '../attackSpeedModifiers';
import { applySunbathe, canSunbathe } from '../warmth';
import { RollingBarrelBehavior } from './rollingBarrel';
import { ConstrictionBehavior } from './deepwaterGrip';
import { SharedSlumberBehavior } from './sharedSlumber';
import { ShikoQuakeBehavior } from './shikoQuake';
import { PalmSlamBehavior } from './palmSlam';
import { RiggingNestBehavior } from './riggingNest';
import { SailcutterBehavior } from './sailcutter';
import { WakeWhipBehavior } from './wakeWhip';
import { SaltSpitBehavior } from './saltSpit';
import { findPoison, hasAnyPoison, TOXIC_POLLEN_POISON_ID } from '../poison';

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
        !engine.isEnemyTargetable(enemy) ||
        !isEligibleProjectileTarget(engine, enemy, attackDef)
      ) {
        return false;
      }
      return engine.isEnemyInTowerRange(
        source.position,
        enemy,
        attackDef.rangeIndex
      );
    });
  },

  execute(
    engine: TowerDefenseEngine,
    source: Tower,
    attackDef: AttackDefinition
  ): void {
    const standardTarget = engine.getTargetForTower(
      source,
      attackDef.rangeIndex,
      source.targetingMode || 'first',
      (enemy) => isEligibleProjectileTarget(engine, enemy, attackDef)
    );
    const preservesFocusedStructure =
      standardTarget?.kind === 'structure' &&
      standardTarget.id === engine.focusedStructureId;
    const preferredPoisonedTarget =
      attackDef.poisonPayoff?.prioritizePoisonedTargets &&
      !preservesFocusedStructure
        ? engine.getTargetForTower(
            source,
            attackDef.rangeIndex,
            source.targetingMode || 'first',
            (enemy) =>
              isEligibleProjectileTarget(engine, enemy, attackDef) &&
              hasAnyPoison(enemy)
          )
        : null;
    const targetEnemy = preferredPoisonedTarget ?? standardTarget;

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
      const coirSnapScales = attackDef.coirSnapCombo?.projectileScales;
      const coirSnapScale = coirSnapScales
        ? (coirSnapScales[
            Math.min(source.coirSnapHits ?? 0, coirSnapScales.length - 1)
          ] ?? 1)
        : 1;

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
          visualScale: (pattern?.scales[index] ?? 1) * coirSnapScale,
          fireClawHeatStacks: attackDef.fireClawHeat
            ? (source.fireClawHeat?.stacks ?? 0)
            : undefined,
          flyingColorsHitIds: attackDef.flyingColors ? [] : undefined,
          flyingColorsHitPositions: attackDef.flyingColors ? [] : undefined,
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
    return engine.enemies.some(
      (enemy) =>
        engine.isEnemyTargetable(enemy) &&
        engine.isEnemyInTowerRange(source.position, enemy, attackDef.rangeIndex)
    );
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
        engine.isEnemyTargetable(enemy) &&
        engine.isEnemyInTowerRange(source.position, enemy, attackDef.rangeIndex)
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
  showVisualEffect = true,
  warmthDamageMultiplier?: number
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
      resolvedAttack,
      1,
      1,
      warmthDamageMultiplier
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

export const FunnyDanceBehavior: AttackBehavior = {
  canExecute(
    engine: TowerDefenseEngine,
    source: Tower,
    attackDef: AttackDefinition
  ): boolean {
    return engine.enemies.some(
      (enemy) =>
        engine.isEnemyTargetable(enemy) &&
        enemy.kind !== 'structure' &&
        engine.isEnemyInTowerRange(
          source.position,
          enemy,
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
    const danceDurationMs = 900;
    const reactionDurationMs = 650;
    const affectedEnemyIds: string[] = [];

    source.funnyDance = {
      startedAtMs: engine.elapsedTimeMs,
      endsAtMs: engine.elapsedTimeMs + danceDurationMs,
    };

    engine.enemies.forEach((enemy) => {
      if (
        !engine.isEnemyTargetable(enemy) ||
        enemy.kind === 'structure' ||
        !engine.isEnemyInTowerRange(
          source.position,
          enemy,
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
      if (
        !carriedUnit ||
        (carriedUnit.heldByEnemyId !== enemy.id && !carriedUnit.groupHauling)
      ) {
        return;
      }

      affectedEnemyIds.push(enemy.id);
      enemy.funnyDanceReaction = {
        startedAtMs: engine.elapsedTimeMs,
        endsAtMs: engine.elapsedTimeMs + reactionDurationMs,
      };

      engine.dropCaptureUnit(enemy);
      enemy.hasBeenWindDisarmed = true;
      if (!enemy.itemPickupBlockedUntilMs) {
        enemy.itemPickupBlockedUntilMs = engine.elapsedTimeMs + pickupLockMs;
      }
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
        rangeIndex: engine.getTowerAttackRange(attackDef.rangeIndex),
        targetIds: affectedEnemyIds,
      });
    }
  },
};

export const InstantAoeBehavior: AttackBehavior = {
  canExecute(
    engine: TowerDefenseEngine,
    source: Tower,
    attackDef: AttackDefinition
  ): boolean {
    return engine.enemies.some(
      (enemy) =>
        engine.isEnemyTargetable(enemy) &&
        engine.isEnemyInTowerRange(
          source.position,
          enemy,
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
        !engine.isEnemyTargetable(enemy) ||
        !engine.isEnemyInTowerRange(
          source.position,
          enemy,
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
      if (
        !carriedUnit ||
        (carriedUnit.heldByEnemyId !== enemy.id && !carriedUnit.groupHauling)
      ) {
        return;
      }

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
        rangeIndex: engine.getTowerAttackRange(attackDef.rangeIndex),
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
    engine.isEnemyTargetable(enemy) &&
    !enemy.immuneToStatusEffects &&
    !findPoison(enemy, TOXIC_POLLEN_POISON_ID) &&
    engine.isEnemyInTowerRange(source.position, enemy, attackDef.rangeIndex)
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
        rangeIndex: engine.getTowerAttackRange(attackDef.rangeIndex),
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
        (!buff.global &&
          !engine.isPositionInTowerRange(
            source.position,
            ally.position,
            attackDef.rangeIndex
          ))
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
        rangeIndex: engine.getTowerAttackRange(attackDef.rangeIndex),
      });
    }
  },
};

export const WarmthSupportBehavior: AttackBehavior = {
  canExecute(_engine, source) {
    return source.hp > 0 && canSunbathe(source);
  },
  execute(engine, source) {
    const result = applySunbathe(source);
    if (!result.grantedSunSoaked && result.warmthGained <= 0) return;
    engine.floatingTexts.push({
      id: `ft_sunbathe_${source.id}_${engine.elapsedTimeMs}_${Math.random()}`,
      text: 'Warmth 100% + Sun-Soaked!',
      position: { ...source.position },
      color: 0xfff0a6,
      scale: 1.05,
      durationMs: 1100,
      elapsedMs: 0,
    });
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
      engine.isPositionInTowerRange(
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
    const nextMultiplier = Math.max(
      previousMultiplier,
      repair.defenseMultiplier
    );
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
          CREATURE_TD_CONFIGS[configId]?.default?.vfxAnimation?.durationMs ??
          900,
        elapsedMs: 0,
      });
    }
  },
};

export const AttackBehaviorRegistry: Record<string, AttackBehavior> = {
  SHARED_SLUMBER: SharedSlumberBehavior,
  SHIKO_QUAKE: ShikoQuakeBehavior,
  PALM_SLAM: PalmSlamBehavior,
  CONSTRICTION: ConstrictionBehavior,
  ROLLING_BARREL: RollingBarrelBehavior,
  PROJECTILE: ProjectileBehavior,
  INSTANT_MELEE: InstantMeleeBehavior,
  INSTANT_AOE: InstantAoeBehavior,
  FUNNY_DANCE: FunnyDanceBehavior,
  ADAPTIVE_TARGETED_AOE: AdaptiveTargetedAoeBehavior,
  POISON_AOE: PoisonAoeBehavior,
  SUPPORT_AURA: SupportAuraBehavior,
  WARMTH_SUPPORT: WarmthSupportBehavior,
  REPAIR_SUPPORT: RepairSupportBehavior,
  RIGGING_NEST: RiggingNestBehavior,
  SAILCUTTER: SailcutterBehavior,
  WAKE_WHIP: WakeWhipBehavior,
  SALT_SPIT: SaltSpitBehavior,
};

export { RiggingNestBehavior, SailcutterBehavior, ShikoQuakeBehavior };
