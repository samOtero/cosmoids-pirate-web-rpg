import type { PlayerCreature } from '@/types/baseGame';

export const GUEST_OWNER_ID = 'guest';

/** New acquisitions may come from an unowned encounter. */
export type AcquiredCreature = Omit<PlayerCreature, 'originalOwnerId'> & {
  readonly originalOwnerId?: string;
};

/** Record first account ownership without replacing an established origin. */
export function recordCreatureOwnership(
  creature: AcquiredCreature,
  ownerId: string
): PlayerCreature {
  return {
    ...creature,
    originalOwnerId:
      creature.originalOwnerId && creature.originalOwnerId !== GUEST_OWNER_ID
        ? creature.originalOwnerId
        : ownerId,
  };
}
