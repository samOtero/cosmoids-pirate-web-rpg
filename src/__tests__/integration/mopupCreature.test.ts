import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { MOPUP, COSMOID_TEMPLATES } from '@/constants/creatures';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { FOREST_LEVEL } from '@/constants/tdLevels/forestLevel';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';

describe('Mopup creature integration', () => {
  it('registers the species with valid attacks and battlefield visuals', () => {
    expect(COSMOID_TEMPLATES[MOPUP.id]).toBe(MOPUP);
    expect(MOPUP.learnableAttacks.length).toBeGreaterThan(0);

    for (const attack of MOPUP.learnableAttacks) {
      expect(ATTACK_DEFS[attack.attackId]).toBeDefined();
    }

    const config = CREATURE_TD_CONFIGS[MOPUP.id];
    expect(config).toBeDefined();
    expect(config.left?.url).toBe('/battles/cosmoids/mopup_left.png');
    expect(config.right?.flipX).toBe(true);
    expect(config.up?.url).toBe('/battles/cosmoids/mopup_up.png');
    expect(config.down?.url).toBe('/battles/cosmoids/mopup_down.png');
  });

  it('ships every referenced asset', () => {
    const urls = [
      MOPUP.iconImg,
      MOPUP.spriteUrl,
      MOPUP.battleSpriteUrl,
      CREATURE_TD_CONFIGS[MOPUP.id].up?.url,
    ];

    for (const url of urls) {
      expect(url).toBeTruthy();
      expect(
        existsSync(join(process.cwd(), 'public', url!.replace(/^\/+/, '')))
      ).toBe(true);
    }
  });

  it('appears as a capturable enemy in every Coconut Grove wave', () => {
    for (const wave of FOREST_LEVEL.waves) {
      const group = wave.groups.find(
        ({ definitionId }) => definitionId === MOPUP.id
      );
      expect(group).toBeDefined();
      expect(group?.uncapturable).not.toBe(true);
    }
  });
});
