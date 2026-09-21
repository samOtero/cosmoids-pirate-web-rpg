import { describe, expect, it } from 'vitest';

import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { LEVEL_5 } from '@/constants/tdLevels/level5';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

describe('Level 5 human capture visuals', () => {
  it('uses capture-specific configs for Caleb, Kip, and Mari', () => {
    expect(LEVEL_5.captureUnits?.map((unit) => unit.tdConfigId)).toEqual([
      'caleb_capture',
      'kip_capture',
      'maribel_capture',
    ]);

    const engine = new TowerDefenseEngine(LEVEL_5);
    expect(engine.environmentUnits).toHaveLength(1);
    expect(engine.hasCaptureUnitsGoal).toBe(true);
    expect(engine.captureUnits).toHaveLength(3);
    expect(engine.lives).toBe(3);
    engine.destroy();
  });

  it('renders the Navy guard as a stationary battlefield character', () => {
    expect(CREATURE_TD_CONFIGS.navy_guard_battle).toEqual({
      default: {
        url: '/battles/characters/navy_guard_battle.webp',
        scale: 0.16,
        flipX: true,
        shadowScaleX: 3.2,
        shadowScaleY: 0.9,
        shadowOffsetY: 13,
        offsetY: -94,
        healthBarOffsetY: -5,
      },
    });
  });

  it.each([
    [
      'caleb_capture',
      '/battles/characters/caleb_battle.webp',
      '/battles/characters/caleb_carried_1.webp',
      '/battles/characters/caleb_left_1.webp',
      '/battles/characters/caleb_up_1.webp',
      '/battles/characters/caleb_down_1.webp',
    ],
    [
      'kip_capture',
      '/battles/characters/kip_battle.webp',
      '/battles/characters/kip_carried_1.webp',
      '/battles/characters/kip_left_1.webp',
      '/battles/characters/kip_up_1.webp',
      '/battles/characters/kip_down_1.webp',
    ],
  ] as const)(
    '%s has distinct idle, carried, and directional states',
    (configId, idleUrl, carriedUrl, leftUrl, upUrl, downUrl) => {
      expect(CREATURE_TD_CONFIGS[configId]).toMatchObject({
        default: { url: idleUrl },
        idle: { url: idleUrl },
        carried: {
          url: carriedUrl,
          offsetY: 0,
          shadowScaleX: 0,
          shadowScaleY: 0,
        },
        left: { url: leftUrl },
        right: { url: leftUrl, flipX: true },
        up: { url: upUrl },
        down: { url: downUrl },
      });
    }
  );

  it('does not change the shared battle configs', () => {
    expect(CREATURE_TD_CONFIGS.caleb_battle).toEqual({
      default: {
        url: '/battles/characters/caleb_battle.webp',
        scale: 0.68,
        shadowScaleX: 3.05,
        shadowOffsetY: -32,
        offsetY: -95,
        healthBarOffsetY: -5,
        shadowScaleY: 0.7,
      },
    });
    expect(CREATURE_TD_CONFIGS.kip_battle).toEqual({
      default: {
        url: '/battles/characters/kip_battle.webp',
        scale: 0.13,
        shadowScaleX: 2.8,
        shadowScaleY: 0.7,
        shadowOffsetX: -3,
        shadowOffsetY: -19,
        offsetY: -87,
        healthBarOffsetY: -5,
      },
    });
  });
});
