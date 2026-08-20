import { TDLevelData } from '@/engine/tower-defense/types';
import { VANE_LEVEL } from './vaneLevel';

/**
 * Level 4 currently reuses the Level 3 battlefield while introducing a
 * self-returning capture objective. Enemies carry the map back toward their
 * spawn; whenever it is dropped, it slowly follows the route home.
 */
export const LEVEL_4: TDLevelData = {
  ...VANE_LEVEL,
  captureUnits: [
    {
      position: { ...VANE_LEVEL.paths[0][VANE_LEVEL.paths[0].length - 1] },
      tdConfigId: 'map_1',
      returnHome: {
        pathIndex: 0,
        speed: 2,
        delayMs: 500,
      },
    },
  ],
  waves: VANE_LEVEL.waves.map((wave) => ({
    ...wave,
    groups: wave.groups.map((group) => ({
      ...group,
      turnAroundAtEnd: true,
    })),
  })),
};
