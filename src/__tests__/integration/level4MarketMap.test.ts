import { describe, expect, it } from 'vitest';

import { LEVEL_4 } from '@/constants/tdLevels/level4';

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
