import { describe, expect, it } from 'vitest';

import { LEVEL_4 } from '@/constants/tdLevels/level4';

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
      ])
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

  it('provides at least three nearby tower spots for every path', () => {
    LEVEL_4.paths.forEach((path) => {
      const nearbySpots = LEVEL_4.placementSpots.filter(
        (spot) => distanceToPath(spot, path) <= 10
      );

      expect(nearbySpots.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('uses the dedicated painted market background', () => {
    expect(LEVEL_4.backgroundUrl).toBe('/battles/bg/bg_market_level_4.png');
    expect(LEVEL_4.backgroundScale).toBe(3);
    expect(LEVEL_4.initialView).toEqual({
      offsetX: 0,
      offsetY: 50,
      zoom: 0.72,
    });
  });
});
