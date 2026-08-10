import { describe, expect, it } from 'vitest';

import {
  DAMAGE_FLASH_COLORS,
  DAMAGE_FLASH_DURATION_MS,
  startDamageFlash,
} from '@/engine/tower-defense/damageFlash';
import { BaseTDUnit } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

const createUnit = (): BaseTDUnit => ({
  id: 'target',
  position: { x: 0, y: 0 },
  facingDirection: 'down',
  hp: 10,
  maxHp: 10,
});

describe('elemental damage flashes', () => {
  it.each(Object.values(ElementType))(
    'uses a light %s impact color',
    (type) => {
      const unit = createUnit();

      startDamageFlash(unit, type);

      expect(unit.damageFlashTimerMs).toBe(DAMAGE_FLASH_DURATION_MS);
      expect(unit.damageFlashColor).toBe(DAMAGE_FLASH_COLORS[type]);

      const color = DAMAGE_FLASH_COLORS[type];
      const channels = [color >> 16, color >> 8, color].map(
        (channel) => channel & 0xff
      );
    expect(Math.min(...channels)).toBeGreaterThanOrEqual(0x90);
    }
  );

  it('keeps Normal hits pure white', () => {
    expect(DAMAGE_FLASH_COLORS[ElementType.NORMAL]).toBe(0xffffff);
  });
});
