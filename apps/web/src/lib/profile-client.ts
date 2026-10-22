import { CURRENT_PROFILE_VERSION, MAX_PROFILES } from '@/constants/game';
import type { PlayerCreature, Profile } from '@/types/baseGame';
import type {
  CloudProfile,
  CloudProfileData,
  CloudProfileList,
  CloudProfileReference,
  CloudProfileSnapshot,
  CloudProfileWorkingCopy,
  CloudCreatureInput,
  CloudProfileChanges,
  CloudProfileMetadata,
  CloudProfileSaveResult,
  CloudProfileBaseline,
  CloudStorageBox,
} from '@/types/cloudProfile';

export class ProfileApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public latest?: CloudProfile
  ) {
    super(message);
    this.name = 'ProfileApiError';
  }
}

export interface ProfileRequestOptions {
  signal?: AbortSignal;
}
export interface ProfileSaveOptions extends ProfileRequestOptions {
  /** Editable box layout; omitted for the existing flat storage screen. */
  storageBoxes?: CloudStorageBox[];
}
const REQUEST_TIMEOUT_MS = 15000;
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown, min = 0): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= min;
const text = (value: unknown): value is string =>
  typeof value === 'string' && Boolean(value.trim());
const timestamp = (value: unknown): value is string =>
  text(value) && Number.isFinite(Date.parse(value));

// Validate the transport shape; species/move legality remains the API's job.
function metadata(value: unknown): value is Record<string, unknown> {
  return (
    record(value) &&
    text(value.id) &&
    integer(value.slot) &&
    value.slot < MAX_PROFILES &&
    integer(value.profileVersion, 1) &&
    integer(value.revision, 1) &&
    timestamp(value.savedAt)
  );
}
function creature(value: unknown): value is PlayerCreature {
  return (
    record(value) &&
    text(value.id) &&
    text(value.originalOwnerId) &&
    integer(value.speciesId, 1) &&
    ['male', 'female', 'genderless'].includes(value.gender as string) &&
    integer(value.level, 1) &&
    integer(value.xp) &&
    typeof value.isShiny === 'boolean' &&
    Array.isArray(value.equippedAttacks) &&
    value.equippedAttacks.every((id) => integer(id, 1)) &&
    (value.activeAttackIndex === undefined ||
      integer(value.activeAttackIndex)) &&
    (value.targetingMode === undefined || text(value.targetingMode))
  );
}
function profileData(value: unknown): value is CloudProfileData {
  if (
    !record(value) ||
    !text(value.name) ||
    !integer(value.lastPlayed) ||
    !integer(value.storyProgression) ||
    !Array.isArray(value.inventory) ||
    !Array.isArray(value.gameFlags) ||
    !value.gameFlags.every(text)
  )
    return false;
  if (
    !value.inventory.every(
      (item) =>
        record(item) &&
        text(item.id) &&
        text(item.name) &&
        typeof item.description === 'string' &&
        ['HEAL', 'CATCH'].includes(item.effect as string) &&
        typeof item.value === 'number' &&
        Number.isFinite(item.value) &&
        item.value >= 0 &&
        integer(item.count)
    )
  )
    return false;
  return (
    (value.capturedSpeciesIds === undefined ||
      (Array.isArray(value.capturedSpeciesIds) &&
        value.capturedSpeciesIds.every((id) => integer(id, 1)))) &&
    (value.journalUnlockShown === undefined ||
      typeof value.journalUnlockShown === 'boolean') &&
    (value.journalOpened === undefined ||
      typeof value.journalOpened === 'boolean')
  );
}
function storageBox(value: unknown): value is CloudStorageBox {
  return (
    record(value) &&
    text(value.id) &&
    text(value.name) &&
    integer(value.position) &&
    Array.isArray(value.creatureIds) &&
    value.creatureIds.every(text)
  );
}
function cloudProfile(value: unknown): value is CloudProfile {
  return (
    metadata(value) &&
    timestamp(value.createdAt) &&
    profileData(value.profileData) &&
    Array.isArray(value.creatures) &&
    value.creatures.every(creature) &&
    Array.isArray(value.storageCreatures) &&
    value.storageCreatures.every(creature) &&
    Array.isArray(value.storageBoxes) &&
    value.storageBoxes.length > 0 &&
    value.storageBoxes.every(storageBox) &&
    value.storageBoxes.flatMap((b) => b.creatureIds).join('\0') ===
      value.storageCreatures.map((c) => c.id).join('\0')
  );
}
function profileList(value: unknown): value is CloudProfileList {
  return (
    record(value) &&
    Array.isArray(value.slots) &&
    value.slots.length === MAX_PROFILES &&
    value.slots.every(
      (slot, index) =>
        slot === null ||
        (metadata(slot) &&
          slot.slot === index &&
          text(slot.name) &&
          integer(slot.lastPlayed) &&
          integer(slot.storyProgression) &&
          integer(slot.partyCount) &&
          integer(slot.storageCount))
    )
  );
}

function copyCreature(value: CloudCreatureInput): CloudCreatureInput {
  return {
    id: value.id,
    speciesId: value.speciesId,
    gender: value.gender,
    level: value.level,
    xp: value.xp,
    isShiny: value.isShiny,
    equippedAttacks: [...value.equippedAttacks],
    activeAttackIndex: value.activeAttackIndex,
    targetingMode: value.targetingMode,
  };
}
function copyProfileData(value: CloudProfileData): CloudProfileData {
  return {
    name: value.name,
    lastPlayed: value.lastPlayed,
    storyProgression: value.storyProgression,
    inventory: value.inventory.map(
      ({ id, name, description, effect, value, count }) => ({
        id,
        name,
        description,
        effect,
        value,
        count,
      })
    ),
    gameFlags: [...value.gameFlags],
    ...(value.capturedSpeciesIds === undefined
      ? {}
      : { capturedSpeciesIds: [...value.capturedSpeciesIds] }),
    ...(value.journalUnlockShown === undefined
      ? {}
      : { journalUnlockShown: value.journalUnlockShown }),
    ...(value.journalOpened === undefined
      ? {}
      : { journalOpened: value.journalOpened }),
  };
}
function supportedVersion(version: unknown): asserts version is number {
  if (version !== CURRENT_PROFILE_VERSION)
    throw new ProfileApiError(
      0,
      'UNSUPPORTED_PROFILE_VERSION',
      'This save format is not supported. Update the game before using this profile.'
    );
}

/** Project only persisted fields; never upload owner/slot IDs or battle state. */
export function createCloudSnapshot(profile: Profile): CloudProfileSnapshot {
  supportedVersion(profile.version);
  return {
    profileVersion: profile.version,
    profileData: copyProfileData(profile),
    creatures: profile.creatures.map(copyCreature),
    storageCreatures: profile.storageCreatures.map(copyCreature),
  };
}

const copyBox = (box: CloudStorageBox): CloudStorageBox => ({
  id: box.id,
  name: box.name,
  position: box.position,
  creatureIds: [...box.creatureIds],
});

export function createCloudBaseline(
  profile: Profile,
  storageBoxes: CloudStorageBox[]
): CloudProfileBaseline {
  const snapshot = createCloudSnapshot(profile);
  const boxes = storageBoxes
    .map(copyBox)
    .sort((a, b) => a.position - b.position);
  const ids = boxes.flatMap((b) => b.creatureIds);
  const stored = new Set(snapshot.storageCreatures.map((c) => c.id));
  if (
    !boxes.length ||
    new Set(boxes.map((b) => b.id)).size !== boxes.length ||
    new Set(boxes.map((b) => b.position)).size !== boxes.length ||
    new Set(ids).size !== ids.length ||
    ids.length !== stored.size ||
    ids.some((id) => !stored.has(id))
  )
    throw new ProfileApiError(
      0,
      'INVALID_PROFILE',
      'Storage boxes must contain each stored creature exactly once.'
    );
  return { ...snapshot, storageBoxes: boxes };
}

function prepareBaseline(
  profile: Profile,
  baseline: CloudProfileBaseline,
  boxes?: CloudStorageBox[]
): CloudProfileBaseline {
  if (boxes) return createCloudBaseline(profile, boxes);
  const layout = baseline.storageBoxes.map((box) => ({
    ...copyBox(box),
    creatureIds: [] as string[],
  }));
  const originalBox = new Map(
    baseline.storageBoxes.flatMap((box) =>
      box.creatureIds.map((id) => [id, box.id] as const)
    )
  );
  for (const creature of profile.storageCreatures) {
    const box =
      layout.find((b) => b.id === originalBox.get(creature.id)) ?? layout[0];
    if (!box)
      throw new ProfileApiError(
        0,
        'INVALID_PROFILE',
        'This profile has no storage box.'
      );
    box.creatureIds.push(creature.id);
  }
  return createCloudBaseline(profile, layout);
}

function changesBetween(
  snapshot: CloudProfileBaseline,
  baseline: CloudProfileBaseline
): CloudProfileChanges {
  supportedVersion(baseline.profileVersion);
  const previous = new Map(
    [...baseline.creatures, ...baseline.storageCreatures].map((c) => [c.id, c])
  );
  const current = [...snapshot.creatures, ...snapshot.storageCreatures];
  const currentIds = new Set(current.map((c) => c.id));
  if (currentIds.size !== current.length)
    throw new ProfileApiError(
      0,
      'INVALID_PROFILE',
      'A creature appears more than once in this profile.'
    );
  if ([...previous.keys()].some((id) => !currentIds.has(id)))
    throw new ProfileApiError(
      0,
      'UNSUPPORTED_CREATURE_REMOVAL',
      'Releasing or transferring creatures requires a separate explicit action.'
    );
  if (
    baseline.storageBoxes.some(
      (b) => !snapshot.storageBoxes.some((next) => next.id === b.id)
    )
  )
    throw new ProfileApiError(
      0,
      'UNSUPPORTED_BOX_REMOVAL',
      'Removing storage boxes requires a separate explicit action.'
    );
  const same = (a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);
  const changedBoxes = snapshot.storageBoxes.filter(
    (box) =>
      !same(
        box,
        baseline.storageBoxes.find((b) => b.id === box.id)
      )
  );
  const partyIds = snapshot.creatures.map((c) => c.id);
  const order = {
    ...(same(
      partyIds,
      baseline.creatures.map((c) => c.id)
    )
      ? {}
      : { party: partyIds }),
    ...(changedBoxes.length ? { storage: changedBoxes } : {}),
  };
  return {
    profileVersion: snapshot.profileVersion,
    ...(same(snapshot.profileData, baseline.profileData)
      ? {}
      : { profileData: snapshot.profileData }),
    creatureChanges: {
      added: current.filter((c) => !previous.has(c.id)),
      updated: current.filter(
        (c) => previous.has(c.id) && !same(c, previous.get(c.id))
      ),
      ...(Object.keys(order).length ? { order } : {}),
    },
  };
}

/** Compare saved fields and individual boxes with the last confirmed baseline. */
export function createCloudChanges(
  profile: Profile,
  baseline: CloudProfileBaseline,
  storageBoxes?: CloudStorageBox[]
): CloudProfileChanges {
  return changesBetween(
    prepareBaseline(profile, baseline, storageBoxes),
    baseline
  );
}

/** The account ID must come from the caller's confirmed session, never user input. */
export function createCloudWorkingCopy(
  saved: CloudProfile,
  accountId: string
): CloudProfileWorkingCopy {
  supportedVersion(saved.profileVersion);
  const profile: Profile = {
    ...copyProfileData(saved.profileData),
    id: saved.slot,
    ownerId: accountId,
    version: saved.profileVersion,
    creatures: saved.creatures.map((c) => ({
      ...copyCreature(c),
      originalOwnerId: c.originalOwnerId,
    })),
    storageCreatures: saved.storageCreatures.map((c) => ({
      ...copyCreature(c),
      originalOwnerId: c.originalOwnerId,
    })),
  };
  return {
    profile,
    storageBoxes: saved.storageBoxes.map(copyBox),
    baseline: createCloudBaseline(profile, saved.storageBoxes),
    cloud: {
      id: saved.id,
      slot: saved.slot,
      profileVersion: saved.profileVersion,
      revision: saved.revision,
      createdAt: saved.createdAt,
      savedAt: saved.savedAt,
    },
  };
}

async function request<T>(
  method: string,
  path: string,
  body: unknown,
  valid: (value: unknown) => value is T,
  { signal }: ProfileRequestOptions = {}
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base)
    throw new ProfileApiError(
      0,
      'NOT_CONFIGURED',
      'The account save service is not configured.'
    );
  signal?.throwIfAborted();
  const controller = new AbortController();
  const cancel = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', cancel, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${base.replace(/\/+$/, '')}/api/profiles${path}`,
      {
        method,
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }
    );
    if (method === 'DELETE' && response.status === 204) return undefined as T;
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) {
      const code = record(data) && text(data.code) ? data.code : 'HTTP_ERROR';
      const message =
        record(data) && text(data.error)
          ? data.error
          : 'The save service could not complete this request. Keep your progress and try again.';
      const latest =
        response.status === 409 &&
        code === 'STALE_PROFILE' &&
        record(data) &&
        cloudProfile(data.latest)
          ? data.latest
          : undefined;
      throw new ProfileApiError(response.status, code, message, latest);
    }
    if (!valid(data))
      throw new ProfileApiError(
        response.status,
        'INVALID_RESPONSE',
        'The save service returned an unexpected response. Keep your progress and try again.'
      );
    return data;
  } catch (error) {
    if (timedOut)
      throw new ProfileApiError(
        0,
        'TIMEOUT',
        'The save request timed out. Its result is unconfirmed; keep your progress and check the cloud save before retrying.'
      );
    if (signal?.aborted) signal.throwIfAborted();
    if (error instanceof ProfileApiError) throw error;
    throw new ProfileApiError(
      0,
      'NETWORK_ERROR',
      'Could not reach the save service. Keep your progress and try again.'
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

/** No retries, storage writes or game-state changes happen inside this client. */
export const profileClient = {
  list: (options?: ProfileRequestOptions) =>
    request('GET', '', undefined, profileList, options),
  load: (id: string, options?: ProfileRequestOptions) =>
    request(
      'GET',
      '/' + encodeURIComponent(id),
      undefined,
      cloudProfile,
      options
    ),
  create: (slot: number, profile: Profile, options?: ProfileRequestOptions) =>
    request(
      'POST',
      '',
      { slot, ...createCloudSnapshot(profile) },
      cloudProfile,
      options
    ),
  save: async (
    cloud: CloudProfileReference,
    profile: Profile,
    baseline: CloudProfileBaseline,
    options?: ProfileSaveOptions
  ): Promise<CloudProfileSaveResult> => {
    const snapshot = prepareBaseline(profile, baseline, options?.storageBoxes);
    const confirmed = await request(
      'PUT',
      '/' + encodeURIComponent(cloud.id),
      {
        expectedRevision: cloud.revision,
        ...changesBetween(snapshot, baseline),
      },
      (value): value is CloudProfileMetadata =>
        metadata(value) &&
        timestamp(value.createdAt) &&
        value.id === cloud.id &&
        value.revision === cloud.revision + 1 &&
        value.profileVersion === snapshot.profileVersion,
      options
    );
    return { cloud: confirmed, baseline: snapshot };
  },
  delete: (cloud: CloudProfileReference, options?: ProfileRequestOptions) =>
    request(
      'DELETE',
      '/' + encodeURIComponent(cloud.id),
      { expectedRevision: cloud.revision },
      (value): value is void => value === undefined,
      options
    ),
};
