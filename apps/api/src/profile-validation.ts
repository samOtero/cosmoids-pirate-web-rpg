import type { GameContent } from './game-content.js';

export class SaveError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public latest?: unknown
  ) {
    super(message);
  }
}
const invalid = (message: string): never => {
  throw new SaveError(400, 'INVALID_SAVE', message);
};
export function object(
  value: unknown,
  keys: string[],
  label: string
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return invalid(`${label} must be an object.`);
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !keys.includes(key)))
    invalid(`${label} contains unsupported fields.`);
  return record;
}
function integer(
  value: unknown,
  minimum: number,
  maximum: number,
  label: string
): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  )
    return invalid(`Invalid ${label}.`);
  return value;
}
function string(value: unknown, maximum: number, label: string): string {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > maximum ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
  )
    return invalid(`Invalid ${label}.`);
  return value;
}
function array(value: unknown, maximum: number, label: string): unknown[] {
  if (!Array.isArray(value) || value.length > maximum)
    return invalid(`Invalid ${label}.`);
  return value;
}
export function expectedRevision(value: unknown): number {
  return integer(value, 1, 2147483646, 'expected revision');
}
export function profileId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value)
  )
    return invalid('Invalid profile ID.');
  return value;
}

export interface SaveCreature {
  id: string;
  speciesId: number;
  gender: 'male' | 'female' | 'genderless';
  level: number;
  xp: number;
  isShiny: boolean;
  equippedAttacks: number[];
  activeAttackIndex: number;
  targetingMode: string;
}
export interface SaveSnapshot {
  profileVersion: number;
  profileData: Record<string, unknown>;
  creatures: SaveCreature[];
  storageCreatures: SaveCreature[];
}
const targetingModes = [
  'first',
  'last',
  'closest',
  'strongest',
  'weakest',
  'lowest-hp-percent',
  'highest-hp-percent',
];

export function validateSnapshot(
  body: Record<string, unknown>,
  content: GameContent
): SaveSnapshot {
  validateVersion(body.profileVersion, content);
  const ids = new Set<string>();
  return {
    profileVersion: content.profileVersion,
    profileData: validateProfileData(body.profileData, content),
    creatures: validateCreatures(
      body.creatures,
      content.maxPartySize,
      content,
      ids
    ),
    storageCreatures: validateCreatures(
      body.storageCreatures,
      10000,
      content,
      ids
    ),
  };
}

function validateVersion(version: unknown, content: GameContent) {
  if (version !== content.profileVersion)
    throw new SaveError(
      400,
      'UNSUPPORTED_PROFILE_VERSION',
      'This save format is not supported. Update the game before saving.'
    );
}

function validateProfileData(
  raw: unknown,
  content: GameContent
): Record<string, unknown> {
  const data = object(
    raw,
    [
      'name',
      'lastPlayed',
      'inventory',
      'gameFlags',
      'storyProgression',
      'capturedSpeciesIds',
      'journalUnlockShown',
      'journalOpened',
    ],
    'Profile data'
  );
  string(data.name, 80, 'profile name');
  integer(data.lastPlayed, 0, Number.MAX_SAFE_INTEGER, 'last played time');
  if (!content.storyProgressions.includes(data.storyProgression as number))
    invalid('Unknown story progression.');
  const flags = array(data.gameFlags, content.gameFlags.length, 'game flags');
  if (
    new Set(flags).size !== flags.length ||
    flags.some((flag) => !content.gameFlags.includes(flag as string))
  )
    invalid('Unknown or duplicate game flag.');
  for (const name of ['journalUnlockShown', 'journalOpened'])
    if (data[name] !== undefined && typeof data[name] !== 'boolean')
      invalid(`Invalid ${name}.`);
  const speciesIds = new Set(content.species.map((species) => species.id));
  if (data.capturedSpeciesIds !== undefined) {
    const captured = array(
      data.capturedSpeciesIds,
      speciesIds.size,
      'captured species'
    );
    if (
      new Set(captured).size !== captured.length ||
      captured.some((id) => !speciesIds.has(id as number))
    )
      invalid('Unknown or duplicate captured species.');
  }
  const inventory = array(data.inventory, 1000, 'inventory');
  const itemIds = new Set<string>();
  for (const raw of inventory) {
    const item = object(
      raw,
      ['id', 'name', 'description', 'effect', 'value', 'count'],
      'Inventory item'
    );
    const id = string(item.id, 128, 'item ID');
    if (itemIds.has(id)) invalid('Duplicate inventory item.');
    itemIds.add(id);
    string(item.name, 120, 'item name');
    if (typeof item.description !== 'string' || item.description.length > 2000)
      invalid('Invalid item description.');
    if (!['HEAL', 'CATCH'].includes(item.effect as string))
      invalid('Unknown item effect.');
    if (
      typeof item.value !== 'number' ||
      !Number.isFinite(item.value) ||
      item.value < 0 ||
      item.value > 2147483647
    )
      invalid('Invalid item value.');
    integer(item.count, 0, 2147483647, 'item count');
  }
  return data;
}

function validateCreatures(
  raw: unknown,
  maximum: number,
  content: GameContent,
  ids: Set<string>
): SaveCreature[] {
  const parseCreature = (raw: unknown): SaveCreature => {
    const c = object(
      raw,
      [
        'id',
        'speciesId',
        'gender',
        'level',
        'xp',
        'isShiny',
        'equippedAttacks',
        'activeAttackIndex',
        'targetingMode',
      ],
      'Creature'
    );
    const id = string(c.id, 200, 'creature ID');
    if (ids.has(id)) invalid('Duplicate creature instance.');
    ids.add(id);
    const species = content.species.find((entry) => entry.id === c.speciesId);
    if (!species) return invalid('Unknown species ID.');
    const level = integer(c.level, 1, content.maxLevel, 'creature level');
    const gender = c.gender;
    if (
      species.genderRatio === 'genderless'
        ? gender !== 'genderless'
        : !(
            (gender === 'female' && species.genderRatio.female > 0) ||
            (gender === 'male' && species.genderRatio.female < 1)
          )
    )
      invalid('Invalid gender for this species.');
    if (typeof c.isShiny !== 'boolean') invalid('Invalid shiny value.');
    const attacks = array(c.equippedAttacks, 4, 'equipped attacks');
    if (!attacks.length || new Set(attacks).size !== attacks.length)
      invalid('Equipped attacks must contain one to four distinct moves.');
    // Evolution retains moves from earlier family stages, including after trades.
    const family = new Set([species.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const ancestor of content.species)
        if (
          !family.has(ancestor.id) &&
          ancestor.evolutionNodes.some((node) =>
            family.has(node.evolutionDefId)
          )
        ) {
          family.add(ancestor.id);
          changed = true;
        }
    }
    const learnable = new Set(
      content.species
        .filter((entry) => family.has(entry.id))
        .flatMap((entry) =>
          entry.learnableAttacks
            .filter((move) => move.level <= level)
            .map((move) => move.attackId)
        )
    );
    if (
      attacks.some(
        (attack) =>
          !content.attackIds.includes(attack as number) ||
          !learnable.has(attack as number)
      )
    )
      invalid('Unknown or unavailable equipped attack.');
    const active = integer(
      c.activeAttackIndex ?? 0,
      0,
      attacks.length - 1,
      'active attack index'
    );
    const targeting = c.targetingMode ?? 'first';
    if (!targetingModes.includes(targeting as string))
      invalid('Unknown targeting mode.');
    return {
      id,
      speciesId: species.id,
      gender: gender as SaveCreature['gender'],
      level,
      xp: integer(c.xp, 0, 2147483647, 'creature XP'),
      isShiny: c.isShiny as boolean,
      equippedAttacks: attacks as number[],
      activeAttackIndex: active,
      targetingMode: targeting as string,
    };
  };
  return array(raw, maximum, 'creatures').map(parseCreature);
}

export interface StorageBox {
  id: string;
  name: string;
  position: number;
  creatureIds: string[];
}
export interface CreatureOrder {
  party?: string[];
  /** Only the boxes that changed; new UUIDs create boxes. */
  storage?: StorageBox[];
}
export interface SaveChanges {
  profileVersion: number;
  profileData?: Record<string, unknown>;
  added: SaveCreature[];
  updated: SaveCreature[];
  order?: CreatureOrder;
}

export function validateChanges(
  body: Record<string, unknown>,
  content: GameContent
): SaveChanges {
  validateVersion(body.profileVersion, content);
  const changes = object(
    body.creatureChanges,
    ['added', 'updated', 'order'],
    'Creature changes'
  );
  const ids = new Set<string>();
  const added = validateCreatures(
    changes.added,
    10000 + content.maxPartySize,
    content,
    ids
  );
  const updated = validateCreatures(
    changes.updated,
    10000 + content.maxPartySize,
    content,
    ids
  );
  let order: CreatureOrder | undefined;
  if (changes.order !== undefined) {
    const raw = object(changes.order, ['party', 'storage'], 'Creature order');
    const orderedIds = new Set<string>();
    const parseIds = (value: unknown, max: number) =>
      array(value, max, 'creature order').map((value) => {
        const id = string(value, 200, 'creature ID');
        if (orderedIds.has(id))
          invalid('Duplicate creature in changed order lists.');
        orderedIds.add(id);
        return id;
      });
    const boxIds = new Set<string>();
    order = {
      ...(raw.party === undefined
        ? {}
        : { party: parseIds(raw.party, content.maxPartySize) }),
      ...(raw.storage === undefined
        ? {}
        : {
            storage: array(raw.storage, 1000, 'storage boxes').map((value) => {
              const box = object(
                value,
                ['id', 'name', 'position', 'creatureIds'],
                'Storage box'
              );
              const id = profileId(box.id);
              if (boxIds.has(id)) invalid('Duplicate storage box.');
              boxIds.add(id);
              return {
                id,
                name: string(box.name, 80, 'box name'),
                position: integer(box.position, 0, 2147483647, 'box position'),
                creatureIds: parseIds(box.creatureIds, 10000),
              };
            }),
          }),
    };
    if (added.some((c) => !orderedIds.has(c.id)))
      invalid('Every new creature must appear in a changed order list.');
  } else if (added.length)
    invalid('New creatures require their party/storage order.');
  return {
    profileVersion: content.profileVersion,
    ...(body.profileData === undefined
      ? {}
      : { profileData: validateProfileData(body.profileData, content) }),
    added,
    updated,
    order,
  };
}
