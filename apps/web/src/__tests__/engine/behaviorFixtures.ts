import { afterEach } from 'vitest';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import {
  ENEMY_ABILITY_DEFS,
  type EnemyAbilityDefinition,
} from '@/engine/tower-defense/enemyAbilities';
import {
  TD_CREATURE_DEFS,
  TowerDefenseEngine,
} from '@/engine/tower-defense/TowerDefenseEngine';
import { createWildCreature } from '@/utils/resolvePlayerCreature';
import {
  ElementType,
  type CosmoidTemplate,
  type PlayerCreature,
} from '@/types/baseGame';
import type {
  TDCreatureMetadata,
  TDLevelData,
} from '@/engine/tower-defense/types';

const engines: TowerDefenseEngine[] = [];
const speciesOriginals = new Map<string, CosmoidTemplate | undefined>();
const abilityOriginals = new Map<string, EnemyAbilityDefinition | undefined>();
const metadataOriginals = new Map<string, TDCreatureMetadata | undefined>();
afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
  for (const [id, original] of speciesOriginals) {
    if (original) COSMOID_TEMPLATES[id] = original;
    else delete COSMOID_TEMPLATES[id];
  }
  for (const [id, original] of abilityOriginals) {
    if (original) ENEMY_ABILITY_DEFS[id] = original;
    else delete ENEMY_ABILITY_DEFS[id];
  }
  speciesOriginals.clear();
  abilityOriginals.clear();
  for (const [id, original] of metadataOriginals) {
    if (original) TD_CREATURE_DEFS[id] = original;
    else delete TD_CREATURE_DEFS[id];
  }
  metadataOriginals.clear();
});

// Controlled inputs for engine mechanics. These are not copies of authored data.
export function species(
  id: string,
  overrides: Partial<CosmoidTemplate> = {}
): CosmoidTemplate {
  const fixture: CosmoidTemplate = {
    id,
    name: 'Behavior test creature',
    type: ElementType.NORMAL,
    baseStats: {
      hp: 60,
      attack: 60,
      specialAttack: 60,
      defense: 60,
      specialDefense: 60,
      speed: 60,
    },
    baseExperience: 0,
    spriteUrl: '/test-creature.webp',
    learnableAttacks: [],
    evolutionNodes: [],
    ...overrides,
  };
  if (!speciesOriginals.has(id))
    speciesOriginals.set(id, COSMOID_TEMPLATES[id]);
  COSMOID_TEMPLATES[id] = fixture;
  return fixture;
}

export function ability<T extends EnemyAbilityDefinition>(fixture: T): T {
  if (!abilityOriginals.has(fixture.id))
    abilityOriginals.set(fixture.id, ENEMY_ABILITY_DEFS[fixture.id]);
  ENEMY_ABILITY_DEFS[fixture.id] = fixture;
  return fixture;
}

export function battleSpecies(
  id: string,
  overrides: Partial<CosmoidTemplate> = {}
) {
  const fixture = species(id, overrides);
  if (!metadataOriginals.has(id))
    metadataOriginals.set(id, TD_CREATURE_DEFS[id]);
  TD_CREATURE_DEFS[id] = {
    baseCreature: createWildCreature(id, 1),
    evolutionNodes: fixture.evolutionNodes,
    attackUnlocks: fixture.learnableAttacks.map(({ level, attackId }) => ({
      level,
      attackDefId: attackId,
    })),
  };
  return fixture;
}

export function battle(
  overrides: Partial<TDLevelData> = {},
  roster: PlayerCreature[] = []
) {
  const engine = new TowerDefenseEngine(
    {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 1000, y: 50 },
        ],
      ],
      placementSpots: [],
      waves: [{ id: 'test_empty_wave', groups: [] }],
      ...overrides,
    },
    roster
  );
  engines.push(engine);
  return engine;
}

export function actor(
  engine: TowerDefenseEngine,
  id: string,
  speciesId: string,
  x: number,
  abilityId?: string
) {
  const enemy = engine.spawnPreviewEnemy({
    id,
    creatureId: speciesId,
    level: 5,
    position: { x, y: 50 },
    abilityId,
    manualAbilityOnly: false,
  });
  if (!enemy) throw new Error(`Unregistered test species ${speciesId}`);
  return enemy;
}
