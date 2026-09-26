import type { TowerDefenseEngine } from '../TowerDefenseEngine';
import type {
  Enemy,
  Point,
  RiggingNest,
  RiggingThreadling,
  Tower,
} from '../types';
import { EffectProcessor } from './EffectProcessor';
import { ATTACK_DEFS } from './definitions';
import { isSailcutterMarkedBy } from './sailcutter';
import type { AttackBehavior, AttackDefinition } from './types';

function hasTargetInRange(
  engine: TowerDefenseEngine,
  source: Tower,
  attackDef: AttackDefinition
): boolean {
  return engine.enemies.some(
    (enemy) =>
      engine.isEnemyTargetable(enemy) &&
      engine.isPositionInTowerRange(
        source.position,
        enemy.position,
        attackDef.rangeIndex
      )
  );
}

function clampWorldCoordinate(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getNestPosition(source: Tower, attackDef: AttackDefinition): Point {
  const offset = attackDef.riggingNest?.offset ?? { x: 3.5, y: 2.5 };
  return {
    x: clampWorldCoordinate(source.position.x + offset.x),
    y: clampWorldCoordinate(source.position.y + offset.y),
  };
}

function ownerStayedAtOrigin(owner: Tower | undefined, origin: Point): boolean {
  return Boolean(
    owner &&
    owner.hp > 0 &&
    owner.position.x === origin.x &&
    owner.position.y === origin.y
  );
}

function getThreadlingTarget(
  engine: TowerDefenseEngine,
  source: Tower,
  origin: Point,
  rangeIndex: number,
  assignedMarkedTargetIds: Set<string> = new Set()
): Enemy | null {
  const virtualSource = { ...source, position: origin };
  const sailcutterRange = ATTACK_DEFS.SAILCUTTER.rangeIndex;
  const markedTarget = engine.getTargetForTower(
    virtualSource,
    sailcutterRange,
    source.targetingMode ?? 'first',
    (enemy) =>
      isSailcutterMarkedBy(enemy, source.id, engine.elapsedTimeMs) &&
      !assignedMarkedTargetIds.has(enemy.id)
  );
  if (markedTarget) return markedTarget;

  return engine.getTargetForTower(
    virtualSource,
    rangeIndex,
    source.targetingMode ?? 'first'
  );
}

function getFacingDirection(
  from: Point,
  to: Point,
  aspectRatio: number
): RiggingThreadling['facingDirection'] {
  const dx = (to.x - from.x) * aspectRatio;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'down' : 'up';
}

function spawnThreadling(
  engine: TowerDefenseEngine,
  nest: RiggingNest,
  source: Tower,
  attackDef: AttackDefinition
): void {
  const config = attackDef.riggingNest;
  if (!config) return;

  const target = getThreadlingTarget(
    engine,
    source,
    nest.position,
    attackDef.rangeIndex
  );
  const sideOffset = nest.spawnCount % 2 === 0 ? -0.45 : 0.45;
  const position = {
    x: clampWorldCoordinate(nest.position.x + sideOffset),
    y: nest.position.y,
  };
  const facingDirection = target
    ? getFacingDirection(position, target.position, engine.aspectRatio)
    : 'down';

  engine.riggingThreadlings.push({
    id: `${nest.id}_threadling_${nest.spawnCount}`,
    ownerTowerId: source.id,
    attackDefinitionId: attackDef.id,
    ownerOrigin: { ...nest.ownerOrigin },
    nestPosition: { ...nest.position },
    position,
    facingDirection,
    spawnedAtMs: engine.elapsedTimeMs,
    expiresAtMs: engine.elapsedTimeMs + config.threadlingLifetimeMs,
    nextAttackAtMs: engine.elapsedTimeMs,
    attacksRemaining: config.threadlingMaxAttacks,
    targetId: target?.id,
  });
  nest.spawnCount += 1;
  nest.nextSpawnAtMs += config.spawnIntervalMs;
}

export const RiggingNestBehavior: AttackBehavior = {
  canExecute(engine, source, attackDef): boolean {
    return Boolean(
      attackDef.riggingNest && hasTargetInRange(engine, source, attackDef)
    );
  },

  execute(engine, source, attackDef): void {
    const config = attackDef.riggingNest;
    if (!config || !hasTargetInRange(engine, source, attackDef)) return;

    // A recast relocates the family setup instead of leaving stale nests behind.
    engine.riggingNests = engine.riggingNests.filter(
      (nest) => nest.ownerTowerId !== source.id
    );
    engine.riggingThreadlings = engine.riggingThreadlings.filter(
      (threadling) => threadling.ownerTowerId !== source.id
    );

    const createdAtMs = engine.elapsedTimeMs;
    engine.riggingNests.push({
      id: `rigging_nest_${source.id}_${createdAtMs}`,
      ownerTowerId: source.id,
      position: getNestPosition(source, attackDef),
      ownerOrigin: { ...source.position },
      createdAtMs,
      expiresAtMs: createdAtMs + config.durationMs,
      nextSpawnAtMs: createdAtMs + config.firstSpawnDelayMs,
      spawnCount: 0,
    });
  },
};

/** Advances nest production and the short-lived attackers it releases. */
export function updateRiggingNests(
  engine: TowerDefenseEngine,
  towers: Tower[],
  deltaMs: number
): void {
  const ownersById = new Map(towers.map((tower) => [tower.id, tower]));

  engine.riggingNests = engine.riggingNests.filter((nest) => {
    const owner = ownersById.get(nest.ownerTowerId);
    return (
      nest.expiresAtMs > engine.elapsedTimeMs &&
      ownerStayedAtOrigin(owner, nest.ownerOrigin)
    );
  });
  engine.riggingThreadlings = engine.riggingThreadlings.filter((threadling) => {
    const owner = ownersById.get(threadling.ownerTowerId);
    return (
      threadling.expiresAtMs > engine.elapsedTimeMs &&
      threadling.attacksRemaining > 0 &&
      ownerStayedAtOrigin(owner, threadling.ownerOrigin)
    );
  });

  for (const nest of engine.riggingNests) {
    const source = ownersById.get(nest.ownerTowerId);
    if (!source) continue;
    const attackDef = ATTACK_DEFS.RIGGING_NEST;
    const config = attackDef?.riggingNest;
    if (!attackDef || !config) continue;

    while (
      nest.spawnCount < config.maxSpawns &&
      engine.elapsedTimeMs >= nest.nextSpawnAtMs
    ) {
      const activeCount = engine.riggingThreadlings.filter(
        (threadling) => threadling.ownerTowerId === nest.ownerTowerId
      ).length;
      if (activeCount >= config.maxActiveThreadlings) break;
      spawnThreadling(engine, nest, source, attackDef);
    }
  }

  const assignedMarkedTargetIds = new Set<string>();
  for (const threadling of engine.riggingThreadlings) {
    const source = ownersById.get(threadling.ownerTowerId);
    const attackDef = ATTACK_DEFS[threadling.attackDefinitionId];
    const config = attackDef?.riggingNest;
    if (!source || !attackDef || !config) {
      threadling.attacksRemaining = 0;
      continue;
    }

    const target =
      getThreadlingTarget(
        engine,
        source,
        threadling.nestPosition,
        attackDef.rangeIndex,
        assignedMarkedTargetIds
      ) ?? undefined;
    threadling.targetId = target?.id;
    if (!target) continue;

    const sailcutterConfig = ATTACK_DEFS.SAILCUTTER.sailcutter;
    const isWindMarked = isSailcutterMarkedBy(
      target,
      source.id,
      engine.elapsedTimeMs
    );
    if (isWindMarked) assignedMarkedTargetIds.add(target.id);

    threadling.facingDirection = getFacingDirection(
      threadling.position,
      target.position,
      engine.aspectRatio
    );
    let distance = engine.getAttackDistance(
      threadling.position,
      target.position
    );
    if (distance > config.threadlingBiteRange) {
      const moveSpeedMultiplier = isWindMarked
        ? (sailcutterConfig?.threadlingMoveSpeedMultiplier ?? 1)
        : 1;
      const travel =
        (config.threadlingMoveSpeed *
          moveSpeedMultiplier *
          Math.max(0, deltaMs)) /
        1000;
      const ratio = distance > 0 ? Math.min(1, travel / distance) : 1;
      threadling.position.x +=
        (target.position.x - threadling.position.x) * ratio;
      threadling.position.y +=
        (target.position.y - threadling.position.y) * ratio;
      distance = engine.getAttackDistance(threadling.position, target.position);
    }

    if (
      distance <= config.threadlingBiteRange &&
      engine.elapsedTimeMs >= threadling.nextAttackAtMs &&
      target.hp > 0
    ) {
      const targetWasAlive = target.hp > 0;
      EffectProcessor.applyDamageAndEffects(
        engine,
        source,
        target,
        attackDef,
        1,
        isWindMarked
          ? (sailcutterConfig?.threadlingDamageMultiplier ?? 1)
          : 1
      );
      threadling.attacksRemaining -= 1;
      threadling.nextAttackAtMs =
        engine.elapsedTimeMs + config.threadlingAttackIntervalMs;
      threadling.attackVisualUntilMs = engine.elapsedTimeMs + 180;
      if (targetWasAlive && target.hp <= 0) {
        engine.emitEnemyDefeated(target, source);
        threadling.targetId = undefined;
      }
    }
  }

  engine.riggingThreadlings = engine.riggingThreadlings.filter(
    (threadling) =>
      threadling.expiresAtMs > engine.elapsedTimeMs &&
      threadling.attacksRemaining > 0
  );
}
