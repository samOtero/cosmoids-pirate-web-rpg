import {
  GameFlag,
  GameFlagValue,
  PlayerCreature,
  Profile,
  StoryProgression,
} from '@/types/baseGame';
import { CURRENT_PROFILE_VERSION } from '@/constants/game';
import {
  COSMOID_TEMPLATES,
  BIRD_1,
  BUG_STAGE_1,
  MOUSE_1,
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
} from '@/constants/creatures';
import { getDefaultAttacksForLevel } from '@/utils/resolvePlayerCreature';

const TEST_LEVELS = [
  {
    level: 1,
    storyProgression: StoryProgression.PICK_STARTER,
    creatureLevel: 5,
  },
  {
    level: 2,
    storyProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
    creatureLevel: 7,
  },
  {
    level: 3,
    storyProgression: StoryProgression.DEFEAT_BUG_STAGE_1,
    creatureLevel: 10,
  },
  {
    level: 4,
    storyProgression: StoryProgression.DEFEAT_BUG_STAGE_2,
    creatureLevel: 12,
  },
] as const;

const TEST_STARTERS = [
  {
    speciesId: STARTER_CRAB.id,
    name: STARTER_CRAB.name,
    flag: GameFlag.STARTER_PALMIT,
  },
  {
    speciesId: STARTER_IGUANA.id,
    name: STARTER_IGUANA.name,
    flag: GameFlag.STARTER_FUEGUANA,
  },
  {
    speciesId: STARTER_MONKEY.id,
    name: STARTER_MONKEY.name,
    flag: GameFlag.STARTER_MONKEG,
  },
] as const;

const PRIOR_LEVEL_CATCHES: Record<
  number,
  { speciesId: string; level: number }[]
> = {
  1: [],
  2: [{ speciesId: MOUSE_1.id, level: 3 }],
  3: [
    { speciesId: MOUSE_1.id, level: 3 },
    { speciesId: BIRD_1.id, level: 5 },
  ],
  4: [
    { speciesId: MOUSE_1.id, level: 3 },
    { speciesId: BIRD_1.id, level: 5 },
    { speciesId: BUG_STAGE_1.id, level: 5 },
  ],
};

export interface TestProfileTemplateOption {
  id: string;
  label: string;
  level: number;
  creatureLevel: number;
  starterName: string;
  starterSpeciesId: string;
  starterIcon: string;
}

interface TestProfileTemplateDefinition extends TestProfileTemplateOption {
  storyProgression: number;
  starterFlag: GameFlagValue;
}

function createTemplateCreature(
  speciesId: string,
  level: number,
  idPrefix: 'starter' | 'caught'
): PlayerCreature {
  const speciesTemplate = COSMOID_TEMPLATES[speciesId];

  return {
    id: `test-profile-3-${idPrefix}-${speciesId}`,
    speciesId,
    level,
    xp: 0,
    equippedAttacks: getDefaultAttacksForLevel(speciesTemplate, level),
    activeAttackIndex: 0,
    targetingMode: 'first',
    isShiny: false,
  };
}

const TEST_PROFILE_TEMPLATE_DEFINITIONS: TestProfileTemplateDefinition[] =
  TEST_LEVELS.flatMap((levelDefinition) =>
    TEST_STARTERS.map((starter) => ({
      id: `level-${levelDefinition.level}-${starter.speciesId}`,
      label: `Level ${levelDefinition.level} · ${starter.name}`,
      level: levelDefinition.level,
      creatureLevel: levelDefinition.creatureLevel,
      storyProgression: levelDefinition.storyProgression,
      starterName: starter.name,
      starterSpeciesId: starter.speciesId,
      starterFlag: starter.flag,
      starterIcon:
        COSMOID_TEMPLATES[starter.speciesId].iconImg ??
        COSMOID_TEMPLATES[starter.speciesId].spriteUrl,
    }))
  );

export const TEST_PROFILE_TEMPLATE_OPTIONS: TestProfileTemplateOption[] =
  TEST_PROFILE_TEMPLATE_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: definition.label,
    level: definition.level,
    creatureLevel: definition.creatureLevel,
    starterName: definition.starterName,
    starterSpeciesId: definition.starterSpeciesId,
    starterIcon: definition.starterIcon,
  }));

/** Builds a fresh save for the third profile slot from one of the test presets. */
export function createTestProfileFromTemplate(
  templateId: string,
  now = Date.now()
): Profile {
  const template = TEST_PROFILE_TEMPLATE_DEFINITIONS.find(
    (candidate) => candidate.id === templateId
  );

  if (!template) {
    throw new Error(`Unknown test profile template: ${templateId}`);
  }

  const priorLevelCatches = PRIOR_LEVEL_CATCHES[template.level] ?? [];
  const capturedSpeciesIds = [
    template.starterSpeciesId,
    ...priorLevelCatches.map((catchDefinition) => catchDefinition.speciesId),
  ];

  return {
    id: 2,
    name: `Test L${template.level} · ${template.starterName}`,
    lastPlayed: now,
    creatures: [
      createTemplateCreature(
        template.starterSpeciesId,
        template.creatureLevel,
        'starter'
      ),
      ...priorLevelCatches.map((catchDefinition) =>
        createTemplateCreature(
          catchDefinition.speciesId,
          catchDefinition.level,
          'caught'
        )
      ),
    ],
    storageCreatures: [],
    capturedSpeciesIds,
    inventory: [],
    gameFlags: [template.starterFlag],
    storyProgression: template.storyProgression,
    journalUnlockShown:
      template.storyProgression >= StoryProgression.DEFEAT_BUG_STAGE_2,
    journalOpened: false,
    version: CURRENT_PROFILE_VERSION,
  };
}
