import { CURRENT_PROFILE_VERSION, MAX_PROFILES } from '@/constants/game';
import {
  createCloudSnapshot,
  createCloudChanges,
  createCloudBaseline,
  createCloudWorkingCopy,
  ProfileApiError,
  profileClient,
} from '@/lib/profile-client';
import type { CloudProfile } from '@/types/cloudProfile';
import { GameFlag } from '@/types/baseGame';
import {
  makePlayerCreature,
  makeProfile,
  testDefinitionId,
} from './dataBuilders';

const cloudId = '00000000-0000-4000-8000-000000000001';
const boxId = '00000000-0000-4000-8000-000000000002';
const speciesId = testDefinitionId('cloud-client-species');
const attackId = testDefinitionId('cloud-client-attack');
const fetchMock = vi.fn<typeof fetch>();

function profile() {
  return makeProfile({
    id: 2,
    ownerId: 'working-account',
    name: 'Working voyage',
    creatures: [
      makePlayerCreature({
        id: 'party-instance',
        speciesId,
        originalOwnerId: 'original-account',
        equippedAttacks: [attackId],
        activeAttackIndex: 0,
        targetingMode: 'last',
        level: 3,
        xp: 19,
        isShiny: true,
      }),
    ],
    storageCreatures: [
      makePlayerCreature({
        id: 'storage-instance',
        speciesId,
        equippedAttacks: [attackId],
      }),
    ],
    inventory: [
      {
        id: 'controlled-item',
        name: 'Test ration',
        description: 'Controlled inventory',
        effect: 'HEAL',
        value: 12.5,
        count: 3,
      },
    ],
    capturedSpeciesIds: [speciesId],
    journalOpened: true,
  });
}
function confirmedBaseline(input = profile()) {
  return createCloudBaseline(input, [
    {
      id: boxId,
      name: 'Box 1',
      position: 0,
      creatureIds: input.storageCreatures.map((c) => c.id),
    },
  ]);
}
function saved(): CloudProfile {
  // A transport fixture, independent of the production serializer.
  const { id, ownerId, version, creatures, storageCreatures, ...profileData } =
    profile();
  void ownerId; // The account identity is not part of the server envelope.
  return {
    id: cloudId,
    slot: id,
    revision: 7,
    profileVersion: version!,
    createdAt: '2026-10-01T00:00:00.000Z',
    savedAt: '2026-10-02T00:00:00.000Z',
    profileData,
    creatures,
    storageCreatures,
    storageBoxes: [
      {
        id: boxId,
        name: 'Box 1',
        position: 0,
        creatureIds: storageCreatures.map((c) => c.id),
      },
    ],
  };
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
function confirmation(revision = 8) {
  const cloud = saved();
  return {
    id: cloud.id,
    slot: cloud.slot,
    revision,
    profileVersion: cloud.profileVersion,
    createdAt: cloud.createdAt,
    savedAt: cloud.savedAt,
  };
}
function requestBody(index = 0) {
  return JSON.parse(fetchMock.mock.calls[index][1]!.body as string);
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.test/');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test('lists account slots with cookies and no caching, without account IDs or passwords', async () => {
  const slots = Array(MAX_PROFILES).fill(null);
  slots[2] = {
    id: cloudId,
    slot: 2,
    revision: 7,
    profileVersion: CURRENT_PROFILE_VERSION,
    name: 'Saved voyage',
    lastPlayed: 0,
    storyProgression: 0,
    partyCount: 1,
    storageCount: 1,
    savedAt: '2026-10-02T00:00:00.000Z',
  };
  fetchMock.mockResolvedValue(json({ slots }));
  const result = await profileClient.list();
  expect(result.slots[2]?.name).toBe('Saved voyage');
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe('https://api.example.test/api/profiles');
  expect(options).toMatchObject({
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  expect(options?.body).toBeUndefined();
});

test('loads a profile and keeps its cloud UUID and revision separate from the local slot', async () => {
  const response = saved();
  fetchMock.mockResolvedValue(json(response));
  const result = await profileClient.load(cloudId);
  const working = createCloudWorkingCopy(result, 'authenticated-account');
  expect(fetchMock.mock.calls[0][0]).toBe(
    'https://api.example.test/api/profiles/' + cloudId
  );
  expect(working.profile.id).toBe(2);
  expect(working.profile.ownerId).toBe('authenticated-account');
  expect(working.cloud.id).toBe(cloudId);
  expect(working.cloud.revision).toBe(7);
  expect(working.profile.creatures[0].originalOwnerId).toBe('original-account');
  expect(working.profile.storageCreatures[0].id).toBe('storage-instance');
  working.profile.creatures[0].equippedAttacks.push(attackId + 1);
  working.profile.storageCreatures[0].xp = 77;
  working.profile.inventory[0].count = 44;
  working.profile.gameFlags.push(Object.values(GameFlag)[0]);
  working.profile.capturedSpeciesIds!.push(speciesId + 1);
  expect(result.creatures[0].equippedAttacks).toEqual([attackId]);
  expect(result.storageCreatures[0].xp).toBe(0);
  expect(result.profileData.inventory[0].count).toBe(3);
  expect(result.profileData.gameFlags).toEqual([]);
  expect(result.profileData.capturedSpeciesIds).toEqual([speciesId]);
});

test('create projects saved fields only and leaves the input and its collections untouched', async () => {
  const input = Object.assign(profile(), { battle: { wave: 8 } });
  Object.assign(input.creatures[0], { currentHp: 5, cooldown: 200 });
  Object.assign(input.inventory[0], { transient: true });
  const before = structuredClone(input);
  fetchMock.mockResolvedValue(json(saved(), 201));
  await profileClient.create(2, input);
  expect(fetchMock.mock.calls[0][1]).toMatchObject({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
  });
  const body = requestBody();
  expect(Object.keys(body).sort()).toEqual(
    [
      'slot',
      'profileVersion',
      'profileData',
      'creatures',
      'storageCreatures',
    ].sort()
  );
  expect(body.slot).toBe(2);
  expect(body.profileVersion).toBe(CURRENT_PROFILE_VERSION);
  expect(body.profileData.name).toBe('Working voyage');
  for (const key of [
    'id',
    'ownerId',
    'version',
    'creatures',
    'storageCreatures',
    'battle',
  ])
    expect(body.profileData).not.toHaveProperty(key);
  expect(body.creatures[0]).not.toHaveProperty('currentHp');
  expect(body.creatures[0]).not.toHaveProperty('cooldown');
  expect(body.creatures[0]).not.toHaveProperty('originalOwnerId');
  expect(body.storageCreatures[0].id).toBe('storage-instance');
  expect(body.profileData.inventory[0]).not.toHaveProperty('transient');
  expect(input).toEqual(before);
  const snapshot = createCloudSnapshot(input);
  snapshot.creatures[0].equippedAttacks.push(attackId + 1);
  snapshot.storageCreatures[0].xp = 99;
  snapshot.profileData.inventory[0].count = 90;
  snapshot.profileData.capturedSpeciesIds!.push(speciesId + 1);
  expect(input).toEqual(before);
});

test('save uses PUT with the expected revision; delete sends only the revision and accepts 204', async () => {
  fetchMock
    .mockResolvedValueOnce(json(confirmation()))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  const reference = { id: cloudId, revision: 7 };
  const result = await profileClient.save(
    reference,
    profile(),
    confirmedBaseline()
  );
  expect(result.cloud.revision).toBe(8);
  expect(fetchMock.mock.calls[0][1]?.method).toBe('PUT');
  expect(requestBody().expectedRevision).toBe(7);
  expect(requestBody()).not.toHaveProperty('slot');
  expect(requestBody()).not.toHaveProperty('creatures');
  expect(requestBody()).not.toHaveProperty('profileData');
  expect(requestBody().creatureChanges).toEqual({ added: [], updated: [] });
  expect(reference.revision).toBe(7);
  await expect(
    profileClient.delete({ id: cloudId, revision: 8 })
  ).resolves.toBeUndefined();
  expect(fetchMock.mock.calls[1][1]?.method).toBe('DELETE');
  expect(requestBody(1)).toEqual({ expectedRevision: 8 });
});

test('a large unchanged collection is omitted; only changed records and explicit additions are sent', () => {
  const input = profile();
  input.storageCreatures = Array.from({ length: 100 }, (_, index) =>
    makePlayerCreature({ id: 'stored-' + index, speciesId })
  );
  const baseline = confirmedBaseline(input);
  input.creatures[0].xp += 10;
  let changes = createCloudChanges(input, baseline);
  expect(changes.creatureChanges.updated.map((c) => c.id)).toEqual([
    'party-instance',
  ]);
  expect(changes.creatureChanges.added).toEqual([]);
  expect(changes.creatureChanges.order).toBeUndefined();
  expect(changes.profileData).toBeUndefined();
  expect(changes.creatureChanges.updated[0]).not.toHaveProperty(
    'originalOwnerId'
  );
  expect(baseline.creatures[0].xp).toBe(19);
  input.storageCreatures.push(
    makePlayerCreature({ id: 'new-capture', speciesId })
  );
  changes = createCloudChanges(input, baseline);
  expect(changes.creatureChanges.added.map((c) => c.id)).toEqual([
    'new-capture',
  ]);
  expect(changes.creatureChanges.order?.storage?.[0].creatureIds).toHaveLength(
    101
  );
  expect(changes.creatureChanges.added[0]).not.toHaveProperty(
    'originalOwnerId'
  );
});

test('reordering sends only ID lists; runtime and ownership fields do not count as saved changes', () => {
  const input = profile();
  const baseline = confirmedBaseline(input);
  Object.assign(input, { ownerId: 'changed-account', battle: { wave: 10 } });
  Object.assign(input.creatures[0], {
    originalOwnerId: 'changed-origin',
    currentHp: 1,
  });
  expect(createCloudChanges(input, baseline)).toEqual({
    profileVersion: CURRENT_PROFILE_VERSION,
    creatureChanges: { added: [], updated: [] },
  });
  [input.creatures[0], input.storageCreatures[0]] = [
    input.storageCreatures[0],
    input.creatures[0],
  ];
  expect(createCloudChanges(input, baseline).creatureChanges).toEqual({
    added: [],
    updated: [],
    order: {
      party: ['storage-instance'],
      storage: [
        {
          id: boxId,
          name: 'Box 1',
          position: 0,
          creatureIds: ['party-instance'],
        },
      ],
    },
  });
  input.name = 'Renamed';
  expect(createCloudChanges(input, baseline).profileData?.name).toBe('Renamed');
});

test('individual box changes omit other boxes and preserve creature data', () => {
  const input = profile();
  const boxes = [
    {
      id: boxId,
      name: 'Box 1',
      position: 0,
      creatureIds: ['storage-instance'],
    },
    {
      id: '00000000-0000-4000-8000-000000000003',
      name: 'Training',
      position: 1,
      creatureIds: [] as string[],
    },
  ];
  const baseline = createCloudBaseline(input, boxes);
  const edited = structuredClone(boxes);
  edited[1].name = 'Favorites';
  const changes = createCloudChanges(input, baseline, edited);
  expect(changes.creatureChanges).toEqual({
    added: [],
    updated: [],
    order: { storage: [edited[1]] },
  });
  expect(changes.creatureChanges.order?.party).toBeUndefined();
  edited[0].creatureIds = [];
  edited[1].creatureIds = ['storage-instance'];
  expect(
    createCloudChanges(input, baseline, edited).creatureChanges.order?.storage
  ).toHaveLength(2);
  expect(baseline.storageBoxes[0].creatureIds).toEqual(['storage-instance']);
  expect(() => createCloudChanges(input, baseline, [edited[1]])).toThrow(
    ProfileApiError
  );
});

test('box layouts are independently copied and invalid membership is rejected before sending', async () => {
  const response = saved();
  const working = createCloudWorkingCopy(response, 'authenticated-account');
  working.storageBoxes[0].name = 'Renamed';
  expect(working.baseline.storageBoxes[0].name).toBe('Box 1');
  expect(response.storageBoxes[0].name).toBe('Box 1');
  working.storageBoxes[0].creatureIds.push('unknown');
  await expect(
    profileClient.save(working.cloud, working.profile, working.baseline, {
      storageBoxes: working.storageBoxes,
    })
  ).rejects.toMatchObject({ code: 'INVALID_PROFILE' });
  expect(fetchMock).not.toHaveBeenCalled();
});

test('implicit removal and duplicate identities fail locally before saving', async () => {
  const input = profile();
  const baseline = confirmedBaseline(input);
  input.creatures = [];
  await expect(
    profileClient.save({ id: cloudId, revision: 7 }, input, baseline)
  ).rejects.toMatchObject({ code: 'UNSUPPORTED_CREATURE_REMOVAL' });
  input.creatures = [input.storageCreatures[0]];
  expect(() => createCloudChanges(input, baseline)).toThrow(ProfileApiError);
  expect(fetchMock).not.toHaveBeenCalled();
});

test('successful confirmation returns the submitted baseline, preserving changes made during the request', async () => {
  const working = createCloudWorkingCopy(saved(), 'authenticated-account');
  working.profile.creatures[0].xp = 40;
  let respond!: (response: Response) => void;
  fetchMock.mockImplementation(
    () =>
      new Promise((resolve) => {
        respond = resolve;
      })
  );
  const pending = profileClient.save(
    working.cloud,
    working.profile,
    working.baseline
  );
  working.profile.creatures[0].xp = 50;
  respond(json(confirmation()));
  const result = await pending;
  expect(result.baseline.creatures[0].xp).toBe(40);
  expect(working.baseline.creatures[0].xp).toBe(19);
  expect(working.cloud.revision).toBe(7);
  expect(
    createCloudChanges(working.profile, result.baseline).creatureChanges
      .updated[0].xp
  ).toBe(50);
});

test('failed or unrelated confirmations never advance the baseline or revision', async () => {
  const working = createCloudWorkingCopy(saved(), 'authenticated-account');
  working.profile.creatures[0].xp = 40;
  fetchMock
    .mockResolvedValueOnce(json({ ...confirmation(), id: 'different-profile' }))
    .mockResolvedValueOnce(
      json({ code: 'SAVE_UNAVAILABLE', error: 'Try later' }, 503)
    );
  for (let attempt = 0; attempt < 2; attempt++) {
    await expect(
      profileClient.save(working.cloud, working.profile, working.baseline)
    ).rejects.toBeInstanceOf(ProfileApiError);
    expect(working.baseline.creatures[0].xp).toBe(19);
    expect(working.cloud.revision).toBe(7);
  }
  expect(requestBody(0)).toEqual(requestBody(1));
});

test.each(['load', 'delete'] as const)(
  'encodes profile identities for %s requests',
  async (operation) => {
    fetchMock.mockResolvedValue(
      operation === 'load' ? json(saved()) : new Response(null, { status: 204 })
    );
    const id = 'untrusted/id?query=1';
    if (operation === 'load') await profileClient.load(id);
    else await profileClient.delete({ id, revision: 1 });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/profiles/untrusted%2Fid%3Fquery%3D1'
    );
  }
);

test.each([401, 403, 404, 413, 503])(
  'preserves HTTP %i and the server error code without altering a working copy',
  async (status) => {
    const input = profile();
    const before = structuredClone(input);
    fetchMock.mockResolvedValue(
      json({ code: 'CONTROLLED_ERROR', error: 'Controlled message' }, status)
    );
    await expect(
      profileClient.save(
        { id: cloudId, revision: 7 },
        input,
        confirmedBaseline(input)
      )
    ).rejects.toMatchObject({
      status,
      code: 'CONTROLLED_ERROR',
      message: 'Controlled message',
    });
    expect(input).toEqual(before);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }
);

test.each(['save', 'delete'] as const)(
  'exposes the latest cloud snapshot on a stale %s without choosing a resolution',
  async (operation) => {
    const latest = {
      ...saved(),
      revision: 8,
      profileData: { ...saved().profileData, name: 'Newer cloud progress' },
    };
    const input = profile();
    const reference = { id: cloudId, revision: 7 };
    fetchMock.mockResolvedValue(
      json({ code: 'STALE_PROFILE', error: 'Cloud changed', latest }, 409)
    );
    const failure = await (
      operation === 'save'
        ? profileClient.save(reference, input, confirmedBaseline(input))
        : profileClient.delete(reference)
    ).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ProfileApiError);
    expect(failure).toMatchObject({
      status: 409,
      code: 'STALE_PROFILE',
      latest: { revision: 8, profileData: { name: 'Newer cloud progress' } },
    });
    expect(input.name).toBe('Working voyage');
    expect(reference.revision).toBe(7);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }
);

test.each(['SLOT_OCCUPIED', 'CREATURE_CONFLICT'])(
  'does not mislabel %s as a stale-profile response',
  async (code) => {
    fetchMock.mockResolvedValue(
      json({ code, error: 'Conflict', latest: saved() }, 409)
    );
    await expect(profileClient.create(2, profile())).rejects.toMatchObject({
      status: 409,
      code,
      latest: undefined,
    });
  }
);

test('rejects malformed successful responses and ignores malformed conflict snapshots', async () => {
  fetchMock
    .mockResolvedValueOnce(json({ ...saved(), revision: '7' }))
    .mockResolvedValueOnce(json({ slots: [] }))
    .mockResolvedValueOnce(
      new Response('<html>proxy failure</html>', { status: 200 })
    )
    .mockResolvedValueOnce(
      json(
        {
          code: 'STALE_PROFILE',
          error: 'Cloud changed',
          latest: { id: cloudId },
        },
        409
      )
    );
  await expect(profileClient.load(cloudId)).rejects.toMatchObject({
    code: 'INVALID_RESPONSE',
  });
  await expect(profileClient.list()).rejects.toMatchObject({
    code: 'INVALID_RESPONSE',
  });
  await expect(profileClient.load(cloudId)).rejects.toMatchObject({
    code: 'INVALID_RESPONSE',
  });
  await expect(
    profileClient.save(
      { id: cloudId, revision: 7 },
      profile(),
      confirmedBaseline()
    )
  ).rejects.toMatchObject({ code: 'STALE_PROFILE', latest: undefined });
});

test('handles non-JSON errors and network failures without exposing HTML or retrying writes', async () => {
  fetchMock
    .mockResolvedValueOnce(
      new Response('<html>private proxy detail</html>', { status: 502 })
    )
    .mockRejectedValueOnce(new TypeError('Failed to fetch'));
  await expect(profileClient.load(cloudId)).rejects.toMatchObject({
    status: 502,
    code: 'HTTP_ERROR',
    message: expect.not.stringContaining('private proxy detail'),
  });
  await expect(
    profileClient.save(
      { id: cloudId, revision: 7 },
      profile(),
      confirmedBaseline()
    )
  ).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('supports caller cancellation, including cancellation before a request starts', async () => {
  const controller = new AbortController();
  fetchMock.mockImplementation(
    (_url, options) =>
      new Promise((_resolve, reject) =>
        options!.signal!.addEventListener(
          'abort',
          () => reject(options!.signal!.reason),
          { once: true }
        )
      )
  );
  const pending = profileClient.load(cloudId, { signal: controller.signal });
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  await expect(
    profileClient.list({ signal: controller.signal })
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('times out requests and does not automatically replay an unconfirmed save', async () => {
  vi.useFakeTimers();
  fetchMock.mockImplementation(
    (_url, options) =>
      new Promise((_resolve, reject) =>
        options!.signal!.addEventListener(
          'abort',
          () => reject(options!.signal!.reason),
          { once: true }
        )
      )
  );
  const pending = profileClient.save(
    { id: cloudId, revision: 7 },
    profile(),
    confirmedBaseline()
  );
  const assertion = expect(pending).rejects.toMatchObject({
    status: 0,
    code: 'TIMEOUT',
  });
  await vi.advanceTimersByTimeAsync(15000);
  await assertion;
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

test('fails clearly without an API URL and never upgrades an unsupported profile format silently', async () => {
  vi.stubEnv('NEXT_PUBLIC_API_URL', '');
  await expect(profileClient.list()).rejects.toMatchObject({
    code: 'NOT_CONFIGURED',
  });
  expect(fetchMock).not.toHaveBeenCalled();
  const old = makeProfile({ version: CURRENT_PROFILE_VERSION - 1 });
  expect(() => createCloudSnapshot(old)).toThrow(ProfileApiError);
  expect(() =>
    createCloudSnapshot(makeProfile({ version: undefined }))
  ).toThrow(ProfileApiError);
  expect(() =>
    createCloudWorkingCopy(
      { ...saved(), profileVersion: CURRENT_PROFILE_VERSION + 1 },
      'current-account'
    )
  ).toThrow(ProfileApiError);
  expect(old.version).toBe(CURRENT_PROFILE_VERSION - 1);
});
