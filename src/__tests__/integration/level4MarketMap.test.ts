import { describe, expect, it } from 'vitest';

import { LEVEL_4 } from '@/constants/tdLevels/level4';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

const distanceToSegment = (
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number }
) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared
    )
  );

  return Math.hypot(
    point.x - (start.x + projection * dx),
    point.y - (start.y + projection * dy)
  );
};

const distanceToPath = (
  point: { x: number; y: number },
  path: { x: number; y: number }[]
) =>
  Math.min(
    ...path
      .slice(1)
      .map((end, index) => distanceToSegment(point, path[index], end))
  );

describe('Level 4 market map', () => {
  it('uses six strictly orthogonal paths in escalating wave pairs', () => {
    expect(LEVEL_4.paths).toHaveLength(6);

    LEVEL_4.paths.forEach((path) => {
      for (let index = 1; index < path.length; index++) {
        const previous = path[index - 1];
        const current = path[index];
        const horizontal = previous.y === current.y;
        const vertical = previous.x === current.x;

        expect(horizontal || vertical).toBe(true);
        expect(horizontal && vertical).toBe(false);
      }
    });

    expect(
      LEVEL_4.waves.map((wave) => [
        ...new Set(wave.groups.map((group) => group.pathIndex)),
      ].sort((a, b) => a - b))
    ).toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
    ]);
  });

  it('moves Mari between the three paired path destinations', () => {
    const mari = LEVEL_4.captureUnits?.[0];
    expect(mari).toBeDefined();

    const destinations = [
      LEVEL_4.paths[0].at(-1),
      LEVEL_4.paths[2].at(-1),
      LEVEL_4.paths[4].at(-1),
    ];

    expect(LEVEL_4.paths[1].at(-1)).toEqual(destinations[0]);
    expect(LEVEL_4.paths[3].at(-1)).toEqual(destinations[1]);
    expect(LEVEL_4.paths[5].at(-1)).toEqual(destinations[2]);
    expect(mari?.position).toEqual(destinations[0]);
    expect(
      mari?.waveRelocations?.map((relocation) => relocation.path.at(-1))
    ).toEqual(destinations.slice(1));
    expect(
      mari?.waveRelocations?.map((relocation) => relocation.path.at(0))
    ).toEqual(destinations.slice(0, -1));
  });

  it('starts Kip’s Mopup beside Mari as a fixed defender without Tigrevel', () => {
    const tigrevel = LEVEL_4.startingTowers?.find(
      (tower) => tower.creature.speciesId === 'tigrevel'
    );
    expect(tigrevel).toBeUndefined();

    const mopup = LEVEL_4.startingTowers?.find(
      (tower) => tower.creature.speciesId === 'mopup'
    );

    expect(mopup).toMatchObject({
      position: { x: 40, y: 55 },
      facingDirection: 'right',
      isFixed: true,
      receivesExperience: false,
      creature: {
        id: 'kip_mopup',
        level: 5,
        equippedAttacks: ['TACKLE'],
      },
    });

    const engine = new TowerDefenseEngine(LEVEL_4);
    const runtimeMopup = engine.towers.find(
      (tower) => tower.creature.id === 'kip_mopup'
    );

    expect(runtimeMopup).toMatchObject({
      position: { x: 40, y: 55 },
      facingDirection: 'right',
      isFixed: true,
      selectedAttackIndex: 0,
      creature: {
        speciesId: 'mopup',
        level: 5,
        equippedAttacks: ['TACKLE'],
      },
    });
    expect(engine.removeTower('kip_mopup')).toBe(false);
    engine.destroy();
  });

  it('teaches the Razcall buff with delayed groups behind a durable Razound', () => {
    expect(LEVEL_4.waveEnemyDefinitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'ironbell_resonarion',
          level: 18,
          speedMultiplier: 0.45,
          hpMultiplier: 10,
        }),
      ])
    );

    expect(LEVEL_4.waves[0].groups).toEqual([
      expect.objectContaining({
        enemyDefinitionId: 'ironbell_resonarion',
        count: 1,
        pathIndex: 1,
        delayBeforeGroupMs: 100,
      }),
      expect.objectContaining({
        enemyDefinitionId: 'ironbell_sonarion',
        count: 3,
        pathIndex: 0,
        delayBeforeGroupMs: 3500,
        concurrentWithPrevious: true,
      }),
    ]);

    expect(LEVEL_4.waves[1].groups).toEqual([
      expect.objectContaining({
        enemyDefinitionId: 'ironbell_resonarion',
        count: 1,
        pathIndex: 3,
        delayBeforeGroupMs: 100,
      }),
      expect.objectContaining({
        enemyDefinitionId: 'ironbell_sonarion',
        count: 3,
        pathIndex: 2,
        delayBeforeGroupMs: 3500,
        concurrentWithPrevious: true,
      }),
      expect.objectContaining({
        enemyDefinitionId: 'ironbell_sonarion',
        count: 3,
        pathIndex: 2,
        delayBeforeGroupMs: 6000,
        concurrentWithPrevious: true,
      }),
    ]);
  });

  it('gives the first Razound a head start before Razcalls reach Mari and buff it', () => {
    const engine = new TowerDefenseEngine({
      ...LEVEL_4,
      startingTowers: [],
      waves: [LEVEL_4.waves[0]],
    });
    let elapsedMs = 0;

    // Load the wave and advance through the Razound-only opening window.
    engine.tick(elapsedMs, 16);
    for (let index = 0; index < 30; index += 1) {
      elapsedMs += 100;
      engine.tick(elapsedMs, 100);
    }

    expect(
      engine.enemies.filter((enemy) => enemy.definitionId === 'resonarion')
    ).toHaveLength(1);
    expect(
      engine.enemies.filter((enemy) => enemy.definitionId === 'sonarion')
    ).toHaveLength(0);

    for (let index = 0; index < 100; index += 1) {
      elapsedMs += 100;
      engine.tick(elapsedMs, 100);
      const razound = engine.enemies.find(
        (enemy) => enemy.definitionId === 'resonarion'
      );
      if ((razound?.persistentSpeedBoostMultiplier ?? 1) > 1) break;
    }

    expect(
      engine.enemies.find((enemy) => enemy.definitionId === 'resonarion')
        ?.persistentSpeedBoostMultiplier
    ).toBeGreaterThan(1);
    engine.destroy();
  });

  it('provides at least three nearby tower spots for every path', () => {
    LEVEL_4.paths.forEach((path) => {
      const nearbySpots = LEVEL_4.placementSpots.filter(
        (spot) => distanceToPath(spot, path) <= 10
      );

      expect(nearbySpots.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('uses the dedicated painted market background and tours it bottom-right to top-left', () => {
    expect(LEVEL_4.backgroundUrl).toBe('/battles/bg/bg_market_level_4.png');
    expect(LEVEL_4.backgroundScale).toBe(3);
    expect(LEVEL_4.initialView).toEqual({
      offsetX: 0,
      offsetY: 0,
      zoom: 0.62,
    });
    expect(LEVEL_4.openingPan).toEqual({
      fromOffsetX: 100,
      fromOffsetY: 100,
      durationMs: 2000,
    });
    expect(LEVEL_4.introMessage).toBe('Protect the girl!');
  });
});
