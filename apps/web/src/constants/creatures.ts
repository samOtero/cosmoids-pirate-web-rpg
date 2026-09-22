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
  spriteUrl: '/eel-basic-normal-neutral-skin-1.webp',
  battleSpriteUrl:
    '/battles/cosmoids/eel-basic-normal-neutral-skin-battle-ground-2.webp',
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
  journalImg: '/UI/Journal/knotia_journal.webp',
  journalEntry:
    'While gnawing on mooring lines, it somehow twists them into incredibly complex knots. Even seasoned sailors study its knot making abilities.',
  spriteUrl: '/battles/cosmoids/mouse_1_down_1_25.webp',
  battleSpriteUrl: '/battles/cosmoids/mouse_1_down_1_25.webp',
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
  journalImg: '/UI/Journal/harlequill_journal.webp',
  journalEntry:
    'It brings cheer to coastal towns with loops, tumbles, and other aerial comedy. The bells on its feathers make every performance impossible to ignore.',
  spriteUrl: '/battles/cosmoids/bird_1_down_1_25.webp',
  battleSpriteUrl: '/battles/cosmoids/bird_1_down_1_25.webp',
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
  journalImg: '/UI/Journal/mopup_journal.webp',
  journalEntry:
    'This playful Cosmoid loves sliding across wet decks. Its highly absorbent coat soaks up seawater, leaving every plank cleaner after playtime.',
  spriteUrl: '/battles/cosmoids/mopup_down.webp',
  battleSpriteUrl: '/battles/cosmoids/mopup_left.webp',
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
  spriteUrl: '/battles/cosmoids/caffiqui_down.webp',
  battleSpriteUrl: '/battles/cosmoids/caffiqui_left.webp',
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
  spriteUrl: '/battles/cosmoids/snoutasco_down.webp',
  battleSpriteUrl: '/battles/cosmoids/snoutasco_left.webp',
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
  spriteUrl: '/battles/cosmoids/zapybara_down.webp',
  battleSpriteUrl: '/battles/cosmoids/zapybara_left.webp',
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
  journalImg: '/UI/Journal/sonarion_journal.webp',
  journalEntry:
    "Ironbell's Razcall know no one dares chase them. They mimic market bells, snatch unattended meals, then loose a two-toned howl for Razound when cornered.",
  spriteUrl: '/battles/cosmoids/sonarion_down.webp',
  battleSpriteUrl: '/battles/cosmoids/sonarion_left.webp',
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
  journalImg: '/UI/Journal/resonarion_journal.webp',
  journalEntry:
    "At a Razcall's two-toned call, golden static races through its enlarged neck ruff and heavy tail tuft. Once charged, it barrels through the market to the rescue.",
  spriteUrl: '/battles/cosmoids/resonarion_down.webp',
  battleSpriteUrl: '/battles/cosmoids/resonarion_left.webp',
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
  journalImg: '/UI/Journal/tigrevel_journal.webp',
  journalEntry:
    'Deep in the eastern jungles, it sharpens its claws on stone. A focused swipe can split a boulder clean in half.',
  spriteUrl: '/battles/cosmoids/tigrevel_down.webp',
  battleSpriteUrl: '/battles/cosmoids/tigrevel_left.webp',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'SCRATCH' },
    { level: 4, attackId: 'NIBBLE' },
    { level: 7, attackId: 'QUICK_ATTACK' },
  ],
};

export const VOLTUSK: CosmoidTemplate = {
  id: 'voltusk',
  name: 'Voltusk',
  type: ElementType.STEEL,
  secondaryType: ElementType.ELECTRIC,
  baseStats: {
    hp: 90,
    attack: 74,
    defense: 88,
    specialAttack: 92,
    specialDefense: 78,
    speed: 24,
  },
  baseExperience: 96,
  iconImg: '/UI/Icons/voltusk_icon.png',
  journalEntry:
    'Its metallic whiskers tremble when a storm approaches, guiding it to the place where lightning will strike. The larger its steel tusks, the more electricity it can store—and the more confidently it challenges rivals.',
  journalImg: '/UI/Journal/voltusk_journal.webp',
  spriteUrl: '/battles/cosmoids/voltusk_down.webp',
  battleSpriteUrl: '/battles/cosmoids/voltusk_left.webp',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 1, attackId: 'SPARK' },
  ],
};

export const POGUIN: CosmoidTemplate = {
  id: 'poguin',
  name: 'Poguin',
  type: ElementType.ELECTRIC,
  secondaryType: ElementType.WATER,
  baseStats: {
    hp: 58,
    attack: 52,
    defense: 48,
    specialAttack: 78,
    specialDefense: 62,
    speed: 76,
  },
  baseExperience: 76,
  iconImg: '/UI/Icons/poguin_icon.png',
  journalEntry:
    'It drums its oversized feet across rain-slick stone until nearby Poguin fall into step. A final stomp scatters a charged splash in every direction.',
  journalImg: '/UI/Journal/poguin_journal.webp',
  spriteUrl: '/battles/cosmoids/poguin_down.webp',
  battleSpriteUrl: '/battles/cosmoids/poguin_left.webp',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 4, attackId: 'WATER_GUN' },
    { level: 7, attackId: 'SPARK' },
  ],
};

export const DORMATEE: CosmoidTemplate = {
  id: 'dormatee',
  name: 'Dormatee',
  type: ElementType.PSYCHIC,
  baseStats: {
    hp: 86,
    attack: 42,
    defense: 70,
    specialAttack: 76,
    specialDefense: 90,
    speed: 18,
  },
  baseExperience: 82,
  iconImg: '/UI/Icons/dormatee_icon.png',
  journalEntry:
    'While it sleeps, its whiskers link the dreams of every creature resting nearby. It often wakes to find an entire lagoon napping beside it.',
  spriteUrl: '/battles/cosmoids/dormatee_down.webp',
  battleSpriteUrl: '/battles/cosmoids/dormatee_left.webp',
  movementId: 'lizard',
  // Existing placeholder attacks until Dormatee's custom dream techniques are selected.
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 4, attackId: 'STRING_SHOT' },
  ],
};

export const YOKODILLO: CosmoidTemplate = {
  id: 'yokodillo',
  name: 'Yokodillo',
  type: ElementType.FIGHTING,
  baseStats: {
    hp: 92,
    attack: 78,
    defense: 90,
    specialAttack: 30,
    specialDefense: 68,
    speed: 22,
  },
  baseExperience: 80,
  iconImg: '/UI/Icons/yokodillo_icon.png',
  journalImg: '/UI/Journal/yokodillo_journal.webp',
  journalEntry:
    'It braces with an eager grin and refuses to budge. Once a rival finally moves it, Yokodillo curls into a ball and rolls back much farther than intended.',
  spriteUrl: '/battles/cosmoids/yokodillo_down.webp',
  battleSpriteUrl: '/battles/cosmoids/yokodillo_left.webp',
  movementId: 'lizard',
  // Existing physical attacks until Yokodillo's custom sumo techniques are selected.
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 6, attackId: 'QUICK_ATTACK' },
  ],
};

export const AGUANA: CosmoidTemplate = {
  id: 'aguana',
  name: 'Aguana',
  type: ElementType.WATER,
  baseStats: {
    hp: 48,
    attack: 58,
    defense: 52,
    specialAttack: 55,
    specialDefense: 58,
    speed: 72,
  },
  baseExperience: 65,
  iconImg: '/UI/Icons/aguana_icon.webp',
  journalImg: '/UI/Journal/aguana_journal.webp',
  journalEntry:
    'It makes brief dives to graze on algae growing beneath the waves. Its hooked claws grip slippery rocks, keeping it from being swept away before it must return to shore and warm itself.',
  spriteUrl: '/battles/cosmoids/aguana_down.webp',
  battleSpriteUrl: '/battles/cosmoids/aguana_left.webp',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'SCRATCH' },
    { level: 5, attackId: 'WATER_GUN' },
    { level: 10, attackId: 'DEEPWATER_GRIP' },
  ],
  evolutionNodes: [{ level: 16, evolutionDefId: 'nautiguan' }],
};

export const NAUTIGUAN: CosmoidTemplate = {
  id: 'nautiguan',
  name: 'Nautiguan',
  type: ElementType.WATER,
  baseStats: {
    hp: 88,
    attack: 82,
    defense: 92,
    specialAttack: 72,
    specialDefense: 84,
    speed: 30,
  },
  baseExperience: 96,
  iconImg: '/UI/Icons/nautiguan_icon.webp',
  journalImg: '/UI/Journal/nautiguan_journal.webp',
  journalEntry:
    "Its greater strength and heat-retaining body allow it to graze in deeper water for much longer. It spits excess salt collected from seawater, so sailors often gather the crystals for the ship's salt reserves.",
  spriteUrl: '/battles/cosmoids/nautiguan_down.webp',
  battleSpriteUrl: '/battles/cosmoids/nautiguan_left.webp',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'SCRATCH' },
    { level: 5, attackId: 'WATER_GUN' },
    { level: 10, attackId: 'DEEPWATER_GRIP' },
    { level: 16, attackId: 'BUBBLE_BEAM' },
  ],
};

export const BRAMFRIT: CosmoidTemplate = {
  id: 'bramfrit',
  name: 'Bramfrit',
  type: ElementType.FIRE,
  baseStats: {
    hp: 76,
    attack: 84,
    defense: 74,
    specialAttack: 48,
    specialDefense: 58,
    speed: 28,
  },
  baseExperience: 76,
  iconImg: '/UI/Icons/bramfrit_icon.png',
  journalImg: '/UI/Journal/bramfrit_journal.webp',
  journalEntry:
    'A fiery spirit burns beneath its dense fleece. Before charging a wall, it bows, retreats exactly three paces, and waits as if expecting the obstacle to answer.',
  spriteUrl: '/battles/cosmoids/bramfrit_down.webp',
  battleSpriteUrl: '/battles/cosmoids/bramfrit_left.webp',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 4, attackId: 'EMBER' },
  ],
};

export const SEPIPPET: CosmoidTemplate = {
  id: 'sepippet',
  name: 'Sepippet',
  type: ElementType.DARK,
  baseStats: {
    hp: 52,
    attack: 66,
    defense: 48,
    specialAttack: 72,
    specialDefense: 70,
    speed: 68,
  },
  baseExperience: 75,
  iconImg: '/UI/Icons/sepippet_icon.png',
  journalImg: '/UI/Journal/sepippet_journal.webp',
  journalEntry:
    'Its mantle projects convincing silhouettes while its ribbonlike arms slip through narrow gaps. It often ruins the illusion by waving proudly before the trick is finished.',
  spriteUrl: '/battles/cosmoids/sepippet_down.webp',
  battleSpriteUrl: '/battles/cosmoids/sepippet_left.webp',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 4, attackId: 'QUICK_ATTACK' },
  ],
};

export const PARLET: CosmoidTemplate = {
  id: 'parlet',
  name: 'Parlet',
  type: ElementType.WATER,
  baseStats: {
    hp: 62,
    attack: 44,
    defense: 66,
    specialAttack: 72,
    specialDefense: 68,
    speed: 46,
  },
  baseExperience: 72,
  iconImg: '/UI/Icons/parlet_icon.png',
  journalImg: '/UI/Journal/parlet_journal.webp',
  journalEntry:
    'It rearranges the colors across its broad scales like a living palette. The moment it notices one imperfect patch, it starts the entire design again.',
  spriteUrl: '/battles/cosmoids/parlet_down.webp',
  battleSpriteUrl: '/battles/cosmoids/parlet_left.webp',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 4, attackId: 'WATER_GUN' },
  ],
};

export const CORROGOON: CosmoidTemplate = {
  id: 'corrogoon',
  name: 'Corrogoon',
  type: ElementType.POISON,
  secondaryType: ElementType.GROUND,
  baseStats: {
    hp: 78,
    attack: 72,
    defense: 82,
    specialAttack: 62,
    specialDefense: 64,
    speed: 24,
  },
  baseExperience: 78,
  iconImg: '/UI/Icons/corrogoon_icon.png',
  journalImg: '/UI/Journal/corrogoon_journal.webp',
  journalEntry:
    'It gathers mineral grit with its shovel-like pedipalps, saturates it with acidic spray, and lashes the abrasive mixture from its tail fan.',
  spriteUrl: '/battles/cosmoids/corrogoon_down.webp',
  battleSpriteUrl: '/battles/cosmoids/corrogoon_left.webp',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'PINCH' },
    { level: 4, attackId: 'TACKLE' },
    { level: 7, attackId: 'NIBBLE' },
  ],
};

export const BUFFLORA: CosmoidTemplate = {
  id: 'bufflora',
  name: 'Bufflora',
  type: ElementType.POISON,
  secondaryType: ElementType.GRASS,
  baseStats: {
    hp: 40,
    attack: 45,
    defense: 35,
    specialAttack: 45,
    specialDefense: 35,
    speed: 60,
  },
  baseExperience: 70,
  iconImg: '/UI/Icons/bufflora_icon.png',
  journalImg: '/UI/Journal/bufflora_journal.webp',
  journalEntry:
    'Nicknamed cave flowers, they sleep in damp caverns by day and emerge after dark to drink from blossoms. They especially favor poisonous species avoided by other pollinators.',
  spriteUrl: '/battles/cosmoids/bufflora_down.webp',
  battleSpriteUrl: '/battles/cosmoids/bufflora_left.webp',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 4, attackId: 'WIND_GUST' },
    { level: 8, attackId: 'TOXIC_POLLEN' },
    { level: 12, attackId: 'NECTAR_SIPHON' },
  ],
};

export const MAROPHIS: CosmoidTemplate = {
  id: 'marophis',
  name: 'Marophis',
  type: ElementType.POISON,
  secondaryType: ElementType.WATER,
  baseStats: {
    hp: 40,
    attack: 40,
    defense: 44,
    specialAttack: 60,
    specialDefense: 54,
    speed: 55,
  },
  baseExperience: 74,
  iconImg: '/UI/Icons/marophis_icon.png',
  journalImg: '/UI/Journal/marophis_journal.webp',
  journalEntry:
    'It waits deep underwater in a loose hook-shaped coil. A precise body feint startles prey toward its mouth while the colors across its crown slowly cool as its stored breath runs low.',
  spriteUrl: '/battles/cosmoids/marophis_down.webp',
  battleSpriteUrl: '/battles/cosmoids/marophis_left.webp',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'NIBBLE' },
    { level: 4, attackId: 'WATER_GUN' },
    { level: 8, attackId: 'VENOM_SPRAY' },
    { level: 12, attackId: 'DEEPWATER_GRIP' },
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
  journalImg: '/UI/Journal/bettle_journal.webp',
  journalEntry:
    'It allows rivals one free strike against its ironclad back. If the blow leaves no mark, Beetadel drums its mandibles in triumph.',
  spriteUrl: '/battles/cosmoids/bettle_down.webp',
  battleSpriteUrl: '/battles/cosmoids/bettle_left.webp',
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
  journalImg: '/UI/Journal/buglet_journal.webp',
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
  spriteUrl: '/battles/cosmoids/bug_1_left_1.webp',
  battleSpriteUrl: '/battles/cosmoids/bug_1_left_1.webp',
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
  journalImg: '/UI/Journal/bugitor_journal.webp',
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
  spriteUrl: '/bug-2-basic-normal-neutral-skin-1.webp',
  battleSpriteUrl: '/battles/cosmoids/bug-2-basic-normal-neutral-skin-1.webp',
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
  journalImg: '/UI/Journal/moth_journal.webp',
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
  spriteUrl: '/bug-2-basic-normal-neutral-skin-1.webp',
  battleSpriteUrl: '/battles/cosmoids/moth-basic-normal-neutral-skin-1.webp',
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
  journalImg: '/UI/Journal/palmit_journal.webp',
  journalEntry:
    'A freshwater crab that uses a hollow coconut as a boat. Its shell keeps the salty sea away while it drifts between islands.',
  spriteUrl: '/battles/cosmoids/palmit_down_1.webp',
  battleSpriteUrl: '/battles/cosmoids/palmit_down_1.webp',
  learnableAttacks: [
    { level: 1, attackId: 'PINCH' },
    { level: 6, attackId: 'COIR_SNARE' },
    { level: 16, attackId: 'SHIPSHAPE' },
    { level: 16, attackId: 'MALLET_SMASH' },
  ],
  evolutionNodes: [{ level: 16, evolutionDefId: 'carapenter' }],
};

export const CARAPENTER: CosmoidTemplate = {
  id: 'carapenter',
  name: 'Carapenter',
  type: ElementType.GRASS,
  baseStats: {
    hp: 65,
    attack: 75,
    defense: 80,
    specialAttack: 55,
    specialDefense: 75,
    speed: 50,
  },
  baseExperience: 90,
  iconImg: '/UI/Icons/carapenter_icon.png',
  journalImg: '/UI/Journal/carapenter_journal.webp',
  journalEntry:
    'After outgrowing its coconut, it shapes driftwood into a sturdy mallet. Its layered husk-like shell lets it brave short swims in seawater while repairing damaged ships.',
  spriteUrl: '/battles/cosmoids/carapenter_down.webp',
  battleSpriteUrl: '/battles/cosmoids/carapenter_left.webp',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'PINCH' },
    { level: 6, attackId: 'COIR_SNARE' },
    { level: 16, attackId: 'SHIPSHAPE' },
    { level: 16, attackId: 'MALLET_SMASH' },
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
  spriteUrl: '/battles/cosmoids/fueguana_left_1_v3.webp',
  iconImg: '/UI/Icons/fueguana_icon.png',
  journalImg: '/UI/Journal/fueguana_journal.webp',
  journalEntry:
    'It sneaks aboard pirate ships to devour gunpowder and set the decks ablaze. If grabbed by the tail, it leaves it behind as a surprise that explodes moments later!',
  battleSpriteUrl: '/battles/cosmoids/fueguana_left_1_v3.webp',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'SCRATCH' },
    { level: 9, attackId: 'EMBER' },
    { level: 16, attackId: 'FUSE_RUSH' },
  ],
  evolutionNodes: [{ level: 16, evolutionDefId: 'velocinder' }],
};

export const VELOCINDER: CosmoidTemplate = {
  id: 'velocinder',
  name: 'Velocinder',
  type: ElementType.FIRE,
  baseStats: {
    hp: 58,
    attack: 90,
    defense: 46,
    specialAttack: 60,
    specialDefense: 54,
    speed: 90,
  },
  baseExperience: 90,
  spriteUrl: '/battles/cosmoids/velocinder_down.webp',
  iconImg: '/UI/Icons/velocinder_icon.png',
  journalImg: '/UI/Journal/velocinder_journal.webp',
  journalEntry:
    'Once it learns to balance on its hind legs, it becomes fast enough to race a lit cannon fuse. Its thorny tail sprays sparks around every sharp turn.',
  battleSpriteUrl: '/battles/cosmoids/velocinder_left.webp',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'SCRATCH' },
    { level: 9, attackId: 'EMBER' },
    { level: 16, attackId: 'FUSE_RUSH' },
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
  journalImg: '/UI/Journal/monkeg_journal.webp',
  journalEntry:
    'A shy Cosmoid that hides inside barrels to travel unseen. Its long tail trails in the water like a rudder, steering it safely across the sea.',
  spriteUrl: '/battles/cosmoids/monkeg_down_1_v2.webp',
  battleSpriteUrl: '/battles/cosmoids/monkeg_down_1_v2.webp',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 8, attackId: 'BARREL_BASH' },
    { level: 16, attackId: 'BARREL_BOWLING' },
  ],
  evolutionNodes: [{ level: 16, evolutionDefId: 'macask' }],
};

export const MACASK: CosmoidTemplate = {
  id: 'macask',
  name: 'Macask',
  type: ElementType.WATER,
  baseStats: {
    hp: 82,
    attack: 80,
    defense: 76,
    specialAttack: 60,
    specialDefense: 70,
    speed: 35,
  },
  baseExperience: 90,
  iconImg: '/UI/Icons/macask_icon.png',
  journalImg: '/UI/Journal/macask_journal.webp',
  journalEntry:
    'It carries the heaviest supplies in the barrel on its back. The shifting load strengthens its body and teaches it to keep its footing on even the roughest seas.',
  spriteUrl: '/battles/cosmoids/macask_down.webp',
  battleSpriteUrl: '/battles/cosmoids/macask_left.webp',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 8, attackId: 'BARREL_BASH' },
    { level: 16, attackId: 'BARREL_BOWLING' },
  ],
};

/** All known species definitions, keyed by species ID. */
export const COSMOID_TEMPLATES: Record<string, CosmoidTemplate> = {
  [STARTER_CRAB.id]: STARTER_CRAB,
  [CARAPENTER.id]: CARAPENTER,
  [STARTER_IGUANA.id]: STARTER_IGUANA,
  [VELOCINDER.id]: VELOCINDER,
  [STARTER_MONKEY.id]: STARTER_MONKEY,
  [MACASK.id]: MACASK,
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
  [VOLTUSK.id]: VOLTUSK,
  [POGUIN.id]: POGUIN,
  [DORMATEE.id]: DORMATEE,
  [YOKODILLO.id]: YOKODILLO,
  [AGUANA.id]: AGUANA,
  [NAUTIGUAN.id]: NAUTIGUAN,
  [BRAMFRIT.id]: BRAMFRIT,
  [SEPIPPET.id]: SEPIPPET,
  [PARLET.id]: PARLET,
  [CORROGOON.id]: CORROGOON,
  [BUFFLORA.id]: BUFFLORA,
  [MAROPHIS.id]: MAROPHIS,
  [BETTLE.id]: BETTLE,
};
