import { TDLevelData } from '@/engine/tower-defense/types';
import { FIRST_LEVEL } from './firstLevel';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

/**
 * Challenge version of Level 1: same layout/waves but with only 1 life
 * and a premade roster of a single Fueguana (starter_iguana) at level 1.
 *
 * Lives are derived from captureUnits.length by the engine, so we keep
 * only a single coin to get exactly 1 life.
 */
export const CHALLENGE_FIRST_LEVEL: TDLevelData = {
  ...FIRST_LEVEL,
  captureUnits: [FIRST_LEVEL.captureUnits![0]],
  isChallengeLevel: true,
  premadeRoster: [
    {
      id: 'challenge_fueguana_1',
      speciesId: 'starter_iguana',
      level: 1,
      xp: 0,
      equippedAttacks: TowerDefenseEngine.getDefaultAttacks('starter_iguana'),
    },
  ],
};

/**
 * Challenge version of Level 1 with no capture ability.
 * Same as CHALLENGE_FIRST_LEVEL but capturing is disabled.
 */
export const CHALLENGE_FIRST_LEVEL_NO_CAPTURE: TDLevelData = {
  ...CHALLENGE_FIRST_LEVEL,
  disableCapture: true,
};
