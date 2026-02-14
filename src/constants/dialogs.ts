import { Creature, ElementType } from '@/types/baseGame';

/**
 * DIALOG LINE JUMPING FEATURE:
 *
 * You can now add buttons that jump to specific lines within a dialog using the `jumpToLineId` property.
 * This enables branching dialogs where choices can repeat lines, skip ahead, or loop back.
 *
 * LINE NAMING:
 * - Add an optional `id` property to any DialogLine to name that line
 * - Line IDs must be unique within the same dialog
 * - IDs are validated when the dialog loads; duplicates throw an error
 *
 * BUTTON JUMPING:
 * - Add a `jumpToLineId` property to any DialogButton with a target line ID
 * - Jump executes immediately when the button is clicked (before any action handler)
 * - Supports jumping backwards (for retries), forwards (to skip), or in any direction
 * - If both `jumpToLineId` and `action` are present, jump happens first, then action is executed
 *
 * Example usage:
 * {
 *   id: "confirm_choice",
 *   portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
 *   text: "Are you sure about your choice?",
 *   buttons: [
 *     {
 *       label: "Yes, I'm sure",
 *       type: "confirm",
 *       jumpToLineId: "choice_confirmed"
 *     },
 *     {
 *       label: "No, choose again",
 *       type: "cancel",
 *       jumpToLineId: "choice_start"
 *     }
 *   ]
 * }
 */

// Starter Cosmoid Definitions
export const STARTER_CRAB: Creature = {
  id: 'starter_crab',
  name: 'Crabby',
  type: ElementType.GRASS,
  maxHp: 35,
  currentHp: 35,
  attack: 40,
  defense: 45,
  speed: 35,
  level: 1,
  xp: 0,
  moves: ['Vine Whip', 'Scratch'],
  spriteUrl: '/crab-starter-grass-neutral-skin-1.png',
  battleSpriteUrl: '/crab-starter-grass-neutral-skin-1.png',
  startingEnergy: 100,
  currentEnergy: 100,
};

export const STARTER_IGUANA: Creature = {
  id: 'starter_iguana',
  name: 'Blazy',
  type: ElementType.FIRE,
  maxHp: 35,
  currentHp: 35,
  attack: 45,
  defense: 40,
  speed: 40,
  level: 1,
  xp: 0,
  moves: ['Ember', 'Scratch'],
  spriteUrl: '/iguana_starter_fire_neutral_skin_1.png',
  battleSpriteUrl:
    '/battles/cosmoids/iguana_starter_fire_neutral_skin_1_transparent_actual.png',
  movementId: 'lizard',
  startingEnergy: 100,
  currentEnergy: 100,
};

export const STARTER_MONKEY: Creature = {
  id: 'starter_monkey',
  name: 'Bubbles',
  type: ElementType.WATER,
  maxHp: 40,
  currentHp: 40,
  attack: 40,
  defense: 40,
  speed: 45,
  level: 1,
  xp: 0,
  moves: ['Bubble Beam', 'Scratch'],
  spriteUrl: '/monkey_starter_water_neutral_skin_1.png',
  battleSpriteUrl: '/monkey_starter_water_battle_skin_1_actual.png',
  startingEnergy: 100,
  currentEnergy: 100,
};

// Export all dialogs from their individual files
export * from './dialogs/newPlayerWelcome';
export * from './dialogs/afterStarterChoiceDialog';
export * from './dialogs/islandIntro';
export * from './dialogs/islandVictory';
export * from './dialogs/islandDefeat';
export * from './dialogs/starterBattleLose';
export * from './dialogs/level1TheMessage';
export * from './dialogs/level1Win';

export * from './dialogs/level1Intro';

export * from './dialogs/level1Instruction1';
export * from './dialogs/level1Instruction2';
export * from './dialogs/level1Instruction3';
export * from './dialogs/level2IslandMapIntro';
