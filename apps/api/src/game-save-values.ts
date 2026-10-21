/** Permanent database values. Append new assignments; never renumber or reuse. */
export const CreatureGenderCode = {
  GENDERLESS: 0,
  MALE: 1,
  FEMALE: 2,
} as const;

export const CreatureLocationCode = {
  PARTY: 0,
  STORAGE: 1,
  TRADE_BOX: 2,
} as const;

export type CreatureGenderCode =
  (typeof CreatureGenderCode)[keyof typeof CreatureGenderCode];
export type CreatureLocationCode =
  (typeof CreatureLocationCode)[keyof typeof CreatureLocationCode];
