import { CosmoidTemplate, ElementType } from '@/types/baseGame';

export const SENTICLE: CosmoidTemplate = {
  id: 'senticle',
  name: 'Senticle',
  type: ElementType.WATER,
  baseStats: {
    hp: 20,
    attack: 10,
    defense: 5,
    specialAttack: 15,
    specialDefense: 10,
    speed: 30,
  },
  baseExperience: 62,
  iconImg: '/UI/Icons/senticle_icon.png',
  spriteUrl: '/eel-basic-normal-neutral-skin-1.png',
  battleSpriteUrl:
    '/battles/cosmoids/eel-basic-normal-neutral-skin-battle-ground-2.png',
  movementId: 'lizard',
  learnableAttacks: [{ level: 1, attackId: 'TACKLE' }],
};

export const MOUSE_1: CosmoidTemplate = {
  id: 'mouse_1',
  name: 'Knotia',
  type: ElementType.NORMAL,
  baseStats: {
    hp: 30,
    attack: 56,
    defense: 35,
    specialAttack: 25,
    specialDefense: 35,
    speed: 35,
  },
  baseExperience: 51,
  iconImg: '/UI/Icons/mouse_1_icon.png',
  journalImg: '/UI/Journal/knotia_journal.png',
  journalEntry:
    'While gnawing on mooring lines, it somehow twists them into incredibly complex knots. Even seasoned sailors study its knot making abilities.',
  spriteUrl: '/battles/cosmoids/mouse_1_down_1_25.png',
  battleSpriteUrl: '/battles/cosmoids/mouse_1_down_1_25.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'NIBBLE' },
    { level: 4, attackId: 'QUICK_ATTACK' },
    { level: 14, attackId: 'CHOMP' },
  ],
};

export const BIRD_1: CosmoidTemplate = {
  id: 'harlequill',
  name: 'Harlequill',
  type: ElementType.FLYING,
  baseStats: {
    hp: 38,
    attack: 42,
    defense: 36,
    specialAttack: 40,
    specialDefense: 35,
    speed: 30,
  },
  baseExperience: 50,
  iconImg: '/UI/Icons/bird_1_icon.png',
  journalImg: '/UI/Journal/harlequill_journal.png',
  journalEntry:
    'It brings cheer to coastal towns with loops, tumbles, and other aerial comedy. The bells on its feathers make every performance impossible to ignore.',
  spriteUrl: '/battles/cosmoids/bird_1_down_1_25.png',
  battleSpriteUrl: '/battles/cosmoids/bird_1_down_1_25.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'PECK' },
    { level: 5, attackId: 'WIND_GUST' },
    { level: 9, attackId: 'QUICK_ATTACK' },
  ],
};

export const MOPUP: CosmoidTemplate = {
  id: 'mopup',
  name: 'Mopup',
  type: ElementType.WATER,
  baseStats: {
    hp: 60,
    attack: 40,
    defense: 60,
    specialAttack: 55,
    specialDefense: 60,
    speed: 30,
  },
  baseExperience: 62,
  iconImg: '/UI/Icons/mopup_icon.png',
  journalImg: '/UI/Journal/mopup_journal.png',
  journalEntry:
    'This playful Cosmoid loves sliding across wet decks. Its highly absorbent coat soaks up seawater, leaving every plank cleaner after playtime.',
  spriteUrl: '/battles/cosmoids/mopup_down.png',
  battleSpriteUrl: '/battles/cosmoids/mopup_left.png',
  movementId: 'lizard',
  learnableAttacks: [{ level: 1, attackId: 'TACKLE' }],
};

export const CAFFIQUI: CosmoidTemplate = {
  id: 'caffiqui',
  name: 'Caffiqui',
  type: ElementType.GRASS,
  baseStats: {
    hp: 44,
    attack: 60,
    defense: 42,
    specialAttack: 38,
    specialDefense: 50,
    speed: 72,
  },
  baseExperience: 64,
  iconImg: '/UI/Icons/caffiqui_icon.png',
  spriteUrl: '/battles/cosmoids/caffiqui_down.png',
  battleSpriteUrl: '/battles/cosmoids/caffiqui_left.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 3, attackId: 'VINE_WHIP' },
    { level: 6, attackId: 'STRING_SHOT' },
  ],
};

export const SNOUTASCO: CosmoidTemplate = {
  id: 'snoutasco',
  name: 'Snoutasco',
  type: ElementType.POISON,
  baseStats: {
    hp: 48,
    attack: 62,
    defense: 44,
    specialAttack: 35,
    specialDefense: 50,
    speed: 58,
  },
  baseExperience: 63,
  iconImg: '/UI/Icons/snoutasco_icon.png',
  spriteUrl: '/battles/cosmoids/snoutasco_down.png',
  battleSpriteUrl: '/battles/cosmoids/snoutasco_left.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'NIBBLE' },
    { level: 3, attackId: 'VINE_WHIP' },
    { level: 6, attackId: 'STRING_SHOT' },
  ],
};

export const ZAPYBARA: CosmoidTemplate = {
  id: 'zapybara',
  name: 'Zapybara',
  type: ElementType.ELECTRIC,
  baseStats: {
    hp: 65,
    attack: 68,
    defense: 72,
    specialAttack: 36,
    specialDefense: 58,
    speed: 45,
  },
  baseExperience: 65,
  iconImg: '/UI/Icons/zapybara_icon.png',
  spriteUrl: '/battles/cosmoids/zapybara_down.png',
  battleSpriteUrl: '/battles/cosmoids/zapybara_left.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'NIBBLE' },
    { level: 3, attackId: 'TACKLE' },
    { level: 6, attackId: 'STRING_SHOT' },
  ],
};

export const SONARION: CosmoidTemplate = {
  id: 'sonarion',
  name: 'Razcall',
  type: ElementType.NORMAL,
  secondaryType: ElementType.ELECTRIC,
  baseStats: {
    hp: 40,
    attack: 45,
    defense: 40,
    specialAttack: 65,
    specialDefense: 40,
    speed: 65,
  },
  baseExperience: 58,
  iconImg: '/UI/Icons/sonarion_icon.png',
  journalImg: '/UI/Journal/sonarion_journal.png',
  journalEntry:
    "Ironbell's Razcall know no one dares chase them. They mimic market bells, snatch unattended meals, then loose a two-toned howl for Razound when cornered.",
  spriteUrl: '/battles/cosmoids/sonarion_down.png',
  battleSpriteUrl: '/battles/cosmoids/sonarion_left.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'NIBBLE' },
    { level: 4, attackId: 'QUICK_ATTACK' },
    { level: 10, attackId: 'STATIC_YIP' },
    { level: 14, attackId: 'RALLY_HOWL' },
  ],
  evolutionNodes: [{ level: 26, evolutionDefId: 'resonarion' }],
};

export const RESONARION: CosmoidTemplate = {
  id: 'resonarion',
  name: 'Razound',
  type: ElementType.NORMAL,
  secondaryType: ElementType.ELECTRIC,
  baseStats: {
    hp: 70,
    attack: 75,
    defense: 60,
    specialAttack: 100,
    specialDefense: 65,
    speed: 65,
  },
  baseExperience: 90,
  iconImg: '/UI/Icons/resonarion_icon.png',
  journalImg: '/UI/Journal/resonarion_journal.png',
  journalEntry:
    "At a Razcall's two-toned call, golden static races through its enlarged neck ruff and heavy tail tuft. Once charged, it barrels through the market to the rescue.",
  spriteUrl: '/battles/cosmoids/resonarion_down.png',
  battleSpriteUrl: '/battles/cosmoids/resonarion_left.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'NIBBLE' },
    { level: 4, attackId: 'QUICK_ATTACK' },
    { level: 8, attackId: 'TACKLE' },
    { level: 10, attackId: 'STATIC_YIP' },
    { level: 14, attackId: 'RALLY_HOWL' },
  ],
};

export const TIGREVEL: CosmoidTemplate = {
  id: 'tigrevel',
  name: 'Tigrevel',
  type: ElementType.ROCK,
  baseStats: {
    hp: 72,
    attack: 82,
    defense: 76,
    specialAttack: 38,
    specialDefense: 62,
    speed: 58,
  },
  baseExperience: 78,
  iconImg: '/UI/Icons/tigrevel_icon.png',
  journalImg: '/UI/Journal/tigrevel_journal.png',
  journalEntry:
    'Deep in the eastern jungles, it sharpens its claws on stone. A focused swipe can split a boulder clean in half.',
  spriteUrl: '/battles/cosmoids/tigrevel_down.png',
  battleSpriteUrl: '/battles/cosmoids/tigrevel_left.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'SCRATCH' },
    { level: 4, attackId: 'NIBBLE' },
    { level: 7, attackId: 'QUICK_ATTACK' },
  ],
};

export const BETTLE: CosmoidTemplate = {
  id: 'bettle',
  name: 'Beetadel',
  type: ElementType.BUG,
  secondaryType: ElementType.STEEL,
  baseStats: {
    hp: 72,
    attack: 70,
    defense: 88,
    specialAttack: 28,
    specialDefense: 72,
    speed: 24,
  },
  baseExperience: 68,
  iconImg: '/UI/Icons/bettle_icon.png',
  journalImg: '/UI/Journal/bettle_journal.png',
  journalEntry:
    'It allows rivals one free strike against its ironclad back. If the blow leaves no mark, Beetadel drums its mandibles in triumph.',
  spriteUrl: '/battles/cosmoids/bettle_down.png',
  battleSpriteUrl: '/battles/cosmoids/bettle_left.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'PINCH' },
    { level: 3, attackId: 'TACKLE' },
    { level: 6, attackId: 'STRING_SHOT' },
  ],
};

export const BUG_STAGE_1: CosmoidTemplate = {
  id: 'bug_stage_1',
  name: 'Sailkworm',
  type: ElementType.GRASS,
  iconImg: '/UI/Icons/buglet_icon.png',
  journalImg: '/UI/Journal/buglet_journal.png',
  journalEntry:
    'It disguises itself as a scrap of stitched sailcloth, then quietly eats the real sails around it.',
  baseStats: {
    hp: 25,
    attack: 30,
    defense: 35,
    specialAttack: 20,
    specialDefense: 20,
    speed: 10,
  },
  baseExperience: 53,
  spriteUrl: '/battles/cosmoids/bug_1_left_1.png',
  battleSpriteUrl: '/battles/cosmoids/bug_1_left_1.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 1, attackId: 'STRING_SHOT' },
  ],
  evolutionNodes: [{ level: 7, evolutionDefId: 'bug_stage_2' }],
};

export const BUG_STAGE_2: CosmoidTemplate = {
  id: 'bug_stage_2',
  name: 'Cocoonot',
  type: ElementType.GRASS,
  iconImg: '/UI/Icons/bugitor_icon.png',
  journalImg: '/UI/Journal/bugitor_journal.png',
  journalEntry:
    'It spins coconut-husk thread into a knot so tight that hurricane winds cannot tear it from a mast. No sailor has ever managed to untie one.',
  baseStats: {
    hp: 50,
    attack: 35,
    defense: 55,
    specialAttack: 25,
    specialDefense: 25,
    speed: 10,
  },
  baseExperience: 85,
  spriteUrl: '/bug-2-basic-normal-neutral-skin-1.png',
  battleSpriteUrl: '/battles/cosmoids/bug-2-basic-normal-neutral-skin-1.png',
  battleScale: 1.25,
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' }, // Replace Bug Bite with TACKLE since BUG_BITE is not in ATTACK_DEFS
    { level: 1, attackId: 'STRING_SHOT' },
  ],
  evolutionNodes: [{ level: 10, evolutionDefId: 'bug_stage_3' }],
};

export const BUG_STAGE_3: CosmoidTemplate = {
  id: 'bug_stage_3',
  name: 'Mainscale',
  type: ElementType.GRASS,
  iconImg: '/UI/Icons/moth_icon.png',
  journalImg: '/UI/Journal/moth_journal.png',
  journalEntry:
    'Its enormous sail-like wings catch and command the wind. A single powerful flap can generate enough force to move a ship.',
  baseStats: {
    hp: 60,
    attack: 45,
    defense: 70,
    specialAttack: 90,
    specialDefense: 50,
    speed: 20,
  },
  baseExperience: 140,
  spriteUrl: '/bug-2-basic-normal-neutral-skin-1.png',
  battleSpriteUrl: '/battles/cosmoids/moth-basic-normal-neutral-skin-1.png',
  battleScale: 0.85,
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 1, attackId: 'STRING_SHOT' },
    { level: 10, attackId: 'SAILCUTTER' },
  ],
};

// Starter Cosmoid Definitions
export const STARTER_CRAB: CosmoidTemplate = {
  id: 'starter_crab',
  name: 'Palmit',
  type: ElementType.GRASS,
  baseStats: {
    hp: 55,
    attack: 55,
    defense: 65,
    specialAttack: 45,
    specialDefense: 58,
    speed: 40,
  },
  baseExperience: 64,
  iconImg: '/UI/Icons/palmit_icon.png',
  journalImg: '/UI/Journal/palmit_journal.png',
  journalEntry:
    'A freshwater crab that uses a hollow coconut as a boat. Its shell keeps the salty sea away while it drifts between islands.',
  spriteUrl: '/battles/cosmoids/palmit_down_1.png',
  battleSpriteUrl: '/battles/cosmoids/palmit_down_1.png',
  learnableAttacks: [
    { level: 1, attackId: 'PINCH' },
    { level: 6, attackId: 'COIR_SNARE' },
  ],
};

export const STARTER_IGUANA: CosmoidTemplate = {
  id: 'starter_iguana',
  name: 'Fueguana',
  type: ElementType.FIRE,
  baseStats: {
    hp: 38,
    attack: 70,
    defense: 35,
    specialAttack: 46,
    specialDefense: 44,
    speed: 75,
  },
  baseExperience: 62,
  spriteUrl: '/battles/cosmoids/fueguana_left_1_v3.png',
  iconImg: '/UI/Icons/fueguana_icon.png',
  journalImg: '/UI/Journal/fueguana_journal.png',
  journalEntry:
    'It sneaks aboard pirate ships to devour gunpowder and set the decks ablaze. If grabbed by the tail, it leaves it behind as a surprise that explodes moments later!',
  battleSpriteUrl: '/battles/cosmoids/fueguana_left_1_v3.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'SCRATCH' },
    { level: 9, attackId: 'EMBER' },
  ],
};

export const STARTER_MONKEY: CosmoidTemplate = {
  id: 'starter_monkey',
  name: 'Monkeg',
  type: ElementType.WATER,
  baseStats: {
    hp: 62,
    attack: 65,
    defense: 58,
    specialAttack: 44,
    specialDefense: 55,
    speed: 30,
  },
  baseExperience: 63,
  iconImg: '/UI/Icons/monkeg_icon.png',
  journalImg: '/UI/Journal/monkeg_journal.png',
  journalEntry:
    'A shy Cosmoid that hides inside barrels to travel unseen. Its long tail trails in the water like a rudder, steering it safely across the sea.',
  spriteUrl: '/battles/cosmoids/monkeg_down_1_v2.png',
  battleSpriteUrl: '/battles/cosmoids/monkeg_down_1_v2.png',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 8, attackId: 'BARREL_BASH' },
  ],
};

/** All known species definitions, keyed by species ID. */
export const COSMOID_TEMPLATES: Record<string, CosmoidTemplate> = {
  [STARTER_CRAB.id]: STARTER_CRAB,
  [STARTER_IGUANA.id]: STARTER_IGUANA,
  [STARTER_MONKEY.id]: STARTER_MONKEY,
  [BUG_STAGE_1.id]: BUG_STAGE_1,
  [BUG_STAGE_2.id]: BUG_STAGE_2,
  [BUG_STAGE_3.id]: BUG_STAGE_3,
  [SENTICLE.id]: SENTICLE,
  [MOUSE_1.id]: MOUSE_1,
  [BIRD_1.id]: BIRD_1,
  [MOPUP.id]: MOPUP,
  [CAFFIQUI.id]: CAFFIQUI,
  [SNOUTASCO.id]: SNOUTASCO,
  [ZAPYBARA.id]: ZAPYBARA,
  [SONARION.id]: SONARION,
  [RESONARION.id]: RESONARION,
  [TIGREVEL.id]: TIGREVEL,
  [BETTLE.id]: BETTLE,
};
