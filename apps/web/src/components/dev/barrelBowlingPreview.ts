import type { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Point } from '@/engine/tower-defense/types';

/** Temporary sandbox actors only; does not alter the player's roster or level data. */
export function configureBowlingPreview(
  engine: TowerDefenseEngine,
  direction: 'horizontal' | 'vertical' | 'bend'
) {
  const target = engine.enemies.find(
    (enemy) => enemy.id === 'attack-preview-primary-target'
  );
  if (!target || typeof target.definitionId !== 'number') return;
  const speciesId = target.definitionId;
  engine.projectiles = [];
  engine.enemies = engine.enemies.filter(
    (enemy) => !enemy.id.startsWith('attack-preview-bowling-')
  );
  const layouts: Record<
    typeof direction,
    { path: Point[]; positions: Point[]; waypoints: number[] }
  > = {
    horizontal: {
      path: [
        { x: 0, y: 50 },
        { x: 100, y: 50 },
      ],
      positions: [
        { x: 60, y: 50 },
        { x: 52, y: 50 },
        { x: 44, y: 50 },
        { x: 36, y: 50 },
      ],
      waypoints: [1, 1, 1, 1],
    },
    vertical: {
      path: [
        { x: 60, y: 5 },
        { x: 60, y: 95 },
      ],
      positions: [
        { x: 60, y: 55 },
        { x: 60, y: 45 },
        { x: 60, y: 35 },
        { x: 60, y: 25 },
      ],
      waypoints: [1, 1, 1, 1],
    },
    bend: {
      path: [
        { x: 10, y: 30 },
        { x: 60, y: 30 },
        { x: 60, y: 95 },
      ],
      positions: [
        { x: 60, y: 55 },
        { x: 60, y: 42 },
        { x: 53, y: 30 },
        { x: 43, y: 30 },
      ],
      waypoints: [2, 2, 1, 1],
    },
  };
  const layout = layouts[direction];
  engine.paths = [layout.path];
  target.position = { ...layout.positions[0] };
  target.currentWaypointIndex = layout.waypoints[0];
  target.pathIndex = 0;
  engine.setTowerTargetingMode('attack-preview-tower', 'first');
  layout.positions.slice(1).forEach((position, i) => {
    const enemy = engine.spawnPreviewEnemy({
      id: `attack-preview-bowling-${i}`,
      creatureId: speciesId,
      level: target.level,
      position,
      isInvulnerable: true,
    });
    if (enemy) enemy.currentWaypointIndex = layout.waypoints[i + 1];
  });
}
