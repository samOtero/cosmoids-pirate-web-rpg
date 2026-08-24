import { ElementType } from '@/types/baseGame';
import { BaseTDUnit } from './types';

export const DAMAGE_FLASH_DURATION_MS = 150;

/** Near-white impact colors that preserve the attack's elemental identity. */
export const DAMAGE_FLASH_COLORS: Record<ElementType, number> = {
  [ElementType.NORMAL]: 0xffffff,
  [ElementType.FIRE]: 0xffc0ad,
  [ElementType.WATER]: 0xb8e5ff,
  [ElementType.GRASS]: 0xc7edbc,
  [ElementType.BUG]: 0xddf2af,
  [ElementType.ROCK]: 0xe7d3b2,
  [ElementType.STEEL]: 0xd2dde5,
  [ElementType.POISON]: 0xe7bdf3,
  [ElementType.ELECTRIC]: 0xffeb91,
  [ElementType.FLYING]: 0xd2daff,
};

export function startDamageFlash(
  unit: BaseTDUnit,
  type: ElementType = ElementType.NORMAL
) {
  unit.damageFlashColor = DAMAGE_FLASH_COLORS[type];
  unit.damageFlashTimerMs = DAMAGE_FLASH_DURATION_MS;
}
