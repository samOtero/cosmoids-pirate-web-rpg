import type { TowerDefenseEngine } from '../TowerDefenseEngine';
import type { Enemy, Point, Tower } from '../types';
import { getWarmthWaterDamageMultiplier } from '../warmth';
import type { AttackBehavior, AttackDefinition } from './types';
import { ATTACK_DEFS } from './definitions';

type FacingDirection = 'up' | 'down' | 'left' | 'right';

function getFacingDirection(from: Point, to: Point): FacingDirection {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

function getTarget(
  engine: TowerDefenseEngine,
  source: Tower,
  attackDef: AttackDefinition
): Enemy | null {
  if (source.hp <= 0 || source.wakeWhip || !attackDef.wakeWhip) return null;
  return engine.getTargetForTower(
    source,
    attackDef.rangeIndex,
    source.targetingMode ?? 'first'
  );
}

export const WakeWhipBehavior: AttackBehavior = {
  canExecute: (engine, source, attackDef) =>
    Boolean(getTarget(engine, source, attackDef)),
  execute(engine, source, attackDef) {
    const target = getTarget(engine, source, attackDef);
    const config = attackDef.wakeWhip;
    if (!target || !config) return;

    const attackFacingDirection = getFacingDirection(
      source.position,
      target.position
    );
    source.facingDirection = attackFacingDirection;
    source.wakeWhip = {
      attackDefinitionId: attackDef.id,
      targetId: target.id,
      targetPosition: { ...target.position },
      attackFacingDirection,
      startedAtMs: engine.elapsedTimeMs,
      launchAtMs: engine.elapsedTimeMs + config.windupMs,
      endsAtMs: engine.elapsedTimeMs + config.windupMs + config.recoveryMs,
      warmthDamageMultiplier: getWarmthWaterDamageMultiplier(source, attackDef),
      launched: false,
    };
  },
};

export function cancelWakeWhip(tower: Tower): void {
  const wakeWhip = tower.wakeWhip;
  if (!wakeWhip) return;
  tower.facingDirection = wakeWhip.attackFacingDirection;
  tower.wakeWhip = undefined;
}

/** Advances the facing-forward tail windup and launches exactly one wake projectile. */
export function updateWakeWhips(
  engine: TowerDefenseEngine,
  towers: Tower[] = engine.towers
): void {
  for (const source of towers) {
    const wakeWhip = source.wakeWhip;
    if (!wakeWhip) continue;
    if (source.hp <= 0) {
      cancelWakeWhip(source);
      continue;
    }

    const attackDef = ATTACK_DEFS[wakeWhip.attackDefinitionId];
    if (!attackDef?.wakeWhip) {
      cancelWakeWhip(source);
      continue;
    }

    if (!wakeWhip.launched && engine.elapsedTimeMs >= wakeWhip.launchAtMs) {
      const target = engine.enemies.find(
        (enemy) => enemy.id === wakeWhip.targetId && enemy.hp > 0
      );
      const targetPosition = target
        ? { ...target.position }
        : { ...wakeWhip.targetPosition };
      engine.projectiles.push({
        id: `wake_whip_${source.id}_${engine.elapsedTimeMs}_${Math.random()}`,
        attackDefinitionId: attackDef.id,
        sourceId: source.id,
        targetId: wakeWhip.targetId,
        position: { ...source.position },
        origin: { ...source.position },
        launchFacingDirection: wakeWhip.attackFacingDirection,
        speed: attackDef.projectileSpeed ?? 1,
        damage: attackDef.power,
        warmthDamageMultiplier: wakeWhip.warmthDamageMultiplier,
        target: targetPosition,
        facingDirection: wakeWhip.attackFacingDirection,
      });
      wakeWhip.launched = true;
    }

    if (engine.elapsedTimeMs >= wakeWhip.endsAtMs) {
      source.facingDirection = wakeWhip.attackFacingDirection;
      source.wakeWhip = undefined;
    }
  }
}

export function pushWakeWhipTarget(
  engine: TowerDefenseEngine,
  target: Enemy,
  attackDef: AttackDefinition,
  warmthDamageMultiplier = 1
): void {
  const config = attackDef.wakeWhip;
  if (!config || target.hp <= 0) return;
  engine.pushEnemyAgainstMovement(
    target,
    warmthDamageMultiplier > 1 ? config.warmPushDistance : config.pushDistance
  );
}
