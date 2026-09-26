import type { TowerDefenseEngine } from '../TowerDefenseEngine';
import type { Enemy, Projectile, Tower } from '../types';
import type { AttackBehavior, AttackDefinition } from './types';

function getFacingDirection(
  source: Tower,
  target: Enemy
): 'up' | 'down' | 'left' | 'right' {
  const dx = target.position.x - source.position.x;
  const dy = target.position.y - source.position.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

function getUniqueTargets(
  engine: TowerDefenseEngine,
  source: Tower,
  attackDef: AttackDefinition
): Enemy[] {
  const count = Math.max(
    1,
    Math.floor(attackDef.sailcutter?.projectileCount ?? 3)
  );
  const selectedIds = new Set<string>();
  const targets: Enemy[] = [];

  while (targets.length < count) {
    const target = engine.getTargetForTower(
      source,
      attackDef.rangeIndex,
      source.targetingMode ?? 'first',
      (enemy) => !selectedIds.has(enemy.id)
    );
    if (!target) break;
    selectedIds.add(target.id);
    targets.push(target);
  }

  return targets;
}

function createProjectile(
  source: Tower,
  target: Enemy,
  attackDef: AttackDefinition,
  index: number,
  count: number
): Projectile {
  const dx = target.position.x - source.position.x;
  const dy = target.position.y - source.position.y;
  const distance = Math.hypot(dx, dy);
  const directionX = distance > 0 ? dx / distance : 0;
  const directionY = distance > 0 ? dy / distance : 1;
  const fanOffset = (index - (count - 1) / 2) * 0.9;
  const facingDirection = getFacingDirection(source, target);

  return {
    id: `proj_sailcutter_${Date.now()}_${index}_${Math.random()}`,
    attackDefinitionId: attackDef.id,
    sourceId: source.id,
    targetId: target.id,
    position: {
      x: source.position.x - directionY * fanOffset,
      y: source.position.y + directionX * fanOffset,
    },
    origin: { ...source.position },
    launchFacingDirection: facingDirection,
    speed: attackDef.projectileSpeed ?? 1,
    damage: attackDef.power,
    target: { ...target.position },
    facingDirection,
  };
}

export const SailcutterBehavior: AttackBehavior = {
  canExecute(engine, source, attackDef): boolean {
    return getUniqueTargets(engine, source, attackDef).length > 0;
  },

  execute(engine, source, attackDef): void {
    const targets = getUniqueTargets(engine, source, attackDef);
    if (targets.length === 0) return;

    source.facingDirection = getFacingDirection(source, targets[0]);
    targets.forEach((target, index) => {
      engine.projectiles.push(
        createProjectile(source, target, attackDef, index, targets.length)
      );
    });
  },
};

export function applySailcutterMark(
  engine: TowerDefenseEngine,
  source: Tower,
  target: Enemy,
  attackDef: AttackDefinition
): void {
  const config = attackDef.sailcutter;
  if (!config || target.hp <= 0) return;

  const marks = (target.sailcutterMarks ??= {});
  const wasMarked = (marks[source.id] ?? 0) > engine.elapsedTimeMs;
  marks[source.id] = engine.elapsedTimeMs + config.markDurationMs;

  if (!wasMarked) {
    engine.floatingTexts.push({
      id: `ft_wind_mark_${target.id}_${source.id}_${engine.elapsedTimeMs}`,
      text: 'Wind-Marked!',
      position: { ...target.position },
      color: 0xbcecff,
      scale: 0.75,
      durationMs: 850,
      elapsedMs: 0,
    });
  }
}

export function isSailcutterMarkedBy(
  enemy: Enemy,
  towerId: string,
  elapsedTimeMs: number
): boolean {
  return (enemy.sailcutterMarks?.[towerId] ?? 0) > elapsedTimeMs;
}

export function hasActiveSailcutterMark(
  enemy: Enemy,
  elapsedTimeMs: number
): boolean {
  return Object.values(enemy.sailcutterMarks ?? {}).some(
    (expiresAtMs) => expiresAtMs > elapsedTimeMs
  );
}
