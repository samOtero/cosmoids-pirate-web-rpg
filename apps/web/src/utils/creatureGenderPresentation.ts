import type { CreatureGender } from '@/types/baseGame';

/** Light gender colors remain readable on the game's dark badge backing. */
export const CREATURE_GENDER_PRESENTATION: Record<
  CreatureGender,
  { symbol: string; color: number; textClass: string }
> = {
  female: { symbol: '♀', color: 0xf9a8d4, textClass: 'text-pink-300' },
  male: { symbol: '♂', color: 0x93c5fd, textClass: 'text-blue-300' },
  genderless: { symbol: '—', color: 0xcbd5e1, textClass: 'text-slate-300' },
};
