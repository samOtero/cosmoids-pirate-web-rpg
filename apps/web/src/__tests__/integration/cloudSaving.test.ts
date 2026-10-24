import { createJSONStorage } from 'zustand/middleware';
import { useGameStore } from '@/store/gameStore';
import {
  profileClient,
  ProfileApiError,
  hasCloudProfileChanges,
} from '@/lib/profile-client';
import { Screens, StoryProgression } from '@/types/baseGame';
import { resetStore } from '@/__tests__/utils/test-utils';
import {
  makeCloudProfile,
  makeCloudSummary,
  makePlayerCreature,
  makeProfile,
  testDefinitionId,
} from '@/__tests__/utils/dataBuilders';
import type {
  CloudProfile,
  CloudProfileSaveResult,
} from '@/types/cloudProfile';

const speciesId = testDefinitionId('manual-save');
const creature = (xp = 7) =>
  makePlayerCreature({
    id: 'creature-a',
    speciesId,
    xp,
    activeAttackIndex: 0,
    targetingMode: 'first',
  });
const serverCopy = () =>
  makeCloudProfile({
    id: 'profile-a',
    slot: 0,
    boxId: 'box-a',
    revision: 4,
    profile: {
      name: 'Cloud journey',
      storyProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
      creatures: [creature()],
      capturedSpeciesIds: [speciesId],
    },
  });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
async function open() {
  const saved = serverCopy();
  vi.spyOn(profileClient, 'list').mockResolvedValue({
    slots: [makeCloudSummary(saved), null, null],
  });
  vi.spyOn(profileClient, 'load').mockResolvedValue(saved);
  useGameStore.getState().setProfileAccount('account-a');
  await useGameStore.getState().loadAccountSlots();
  await useGameStore.getState().loadAccountProfile(0);
  return saved;
}
function edit(xp = 17) {
  useGameStore.getState().updateCreatures([creature(xp)]);
}
function confirmed(xp = 17): CloudProfileSaveResult {
  const state = useGameStore.getState();
  const previous = state.cloudProfiles[0]!;
  const baseline = structuredClone(previous.baseline);
  baseline.creatures[0].xp = xp;
  baseline.profileData.lastPlayed = state.profiles[0]!.lastPlayed;
  return {
    cloud: {
      ...previous.cloud,
      revision: previous.cloud.revision + 1,
      savedAt: '2026-10-22T12:00:00.000Z',
    },
    baseline,
  };
}
function savedAttempt(): CloudProfile {
  const a = useGameStore.getState().cloudSaveAttempt!;
  return makeCloudProfile({
    id: a.reference.id,
    slot: a.slot,
    boxId: 'box-a',
    revision: a.reference.revision + 1,
    profile: { ...a.submitted.profileData, creatures: [creature(17)] },
  });
}
beforeEach(() => {
  useGameStore.persist.setOptions({
    storage: createJSONStorage(() => localStorage),
  });
  resetStore();
});
afterEach(() => {
  useGameStore.getState().cancelProfileRequests();
  vi.restoreAllMocks();
});

it('treats a loaded profile as saved despite its updated last-played time', async () => {
  await open();
  const save = vi.spyOn(profileClient, 'save');
  const state = useGameStore.getState();
  expect(
    hasCloudProfileChanges(state.profiles[0]!, state.cloudProfiles[0]!.baseline)
  ).toBe(false);
  await state.saveAccountProfile();
  expect(save).not.toHaveBeenCalled();
});

it('waits for confirmation, serializes actions, and keeps edits made during the save dirty', async () => {
  await open();
  edit();
  const result = confirmed();
  const reply = deferred<CloudProfileSaveResult>();
  const save = vi.spyOn(profileClient, 'save').mockReturnValue(reply.promise);
  const create = vi.spyOn(profileClient, 'create');
  const before = useGameStore.getState();
  const pending = before.saveAccountProfile();
  await before.saveAccountProfile();
  await before.createAccountProfile(1);
  await before.loadAccountProfile(0);
  expect(save).toHaveBeenCalledTimes(1);
  expect(create).not.toHaveBeenCalled();
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'profile-a', revision: 4 }),
    expect.objectContaining({
      creatures: [expect.objectContaining({ xp: 17 })],
    }),
    before.cloudProfiles[0]!.baseline,
    expect.anything()
  );
  expect(useGameStore.getState().cloudProfiles[0]!.cloud.revision).toBe(4);
  edit(23);
  reply.resolve(result);
  await pending;
  const after = useGameStore.getState();
  expect(after.profiles[0]!.creatures[0].xp).toBe(23);
  expect(after.cloudProfiles[0]!.baseline.creatures[0].xp).toBe(17);
  expect(after.cloudSlots[0]!.revision).toBe(5);
  expect(after.cloudMutation).toBeNull();
  expect(
    hasCloudProfileChanges(after.profiles[0]!, after.cloudProfiles[0]!.baseline)
  ).toBe(true);
});

it.each([Screens.START, Screens.DIALOG, Screens.TOWER_DEFENSE])(
  'cannot save from %s',
  async (screen) => {
    await open();
    edit();
    const save = vi.spyOn(profileClient, 'save');
    useGameStore.setState({ currentScreen: screen });
    await useGameStore.getState().saveAccountProfile();
    expect(save).not.toHaveBeenCalled();
  }
);

it('leaves guest persistence untouched through a confirmed cloud save', async () => {
  useGameStore.setState({
    profiles: [makeProfile({ name: 'Local journey' }), null, null],
  });
  const disk = localStorage.getItem('cosmoids-game-state');
  await open();
  edit();
  vi.spyOn(profileClient, 'save').mockResolvedValue(confirmed());
  await useGameStore.getState().saveAccountProfile();
  expect(localStorage.getItem('cosmoids-game-state')).toBe(disk);
  expect(useGameStore.getState().guestProfiles[0]!.name).toBe('Local journey');
  const state = useGameStore.getState();
  expect(
    hasCloudProfileChanges(state.profiles[0]!, state.cloudProfiles[0]!.baseline)
  ).toBe(false);
});

it('retains an unconfirmed write and recognizes its server confirmation without losing later edits', async () => {
  await open();
  edit();
  const save = vi
    .spyOn(profileClient, 'save')
    .mockRejectedValue(new ProfileApiError(0, 'TIMEOUT', 'Unknown'));
  await useGameStore.getState().saveAccountProfile();
  const latest = savedAttempt();
  edit(23);
  await useGameStore.getState().saveAccountProfile();
  expect(save).toHaveBeenCalledTimes(1);
  vi.mocked(profileClient.load).mockResolvedValue(latest);
  await useGameStore.getState().checkAccountSave();
  const state = useGameStore.getState();
  expect(state.cloudSaveAttempt).toBeNull();
  expect(state.cloudSaveConflict).toBeNull();
  expect(state.cloudProfiles[0]!.cloud.revision).toBe(5);
  expect(state.cloudProfiles[0]!.baseline.creatures[0].xp).toBe(17);
  expect(state.profiles[0]!.creatures[0].xp).toBe(23);
});

it('allows an explicit retry only after checking that an unconfirmed save never committed', async () => {
  const original = await open();
  edit();
  const save = vi
    .spyOn(profileClient, 'save')
    .mockRejectedValue(new ProfileApiError(0, 'NETWORK_ERROR', 'Unknown'));
  await useGameStore.getState().saveAccountProfile();
  vi.mocked(profileClient.load).mockResolvedValue(original);
  await useGameStore.getState().checkAccountSave();
  expect(save).toHaveBeenCalledTimes(1);
  expect(useGameStore.getState().cloudSaveAttempt).toBeNull();
  expect(useGameStore.getState().cloudSaveError).toContain('Press Save');
  save.mockResolvedValue(confirmed());
  await useGameStore.getState().saveAccountProfile();
  expect(save).toHaveBeenCalledTimes(2);
  expect(useGameStore.getState().cloudSaveError).toBeNull();
});

it.each(['stale', 'unconfirmed'] as const)(
  'notifies before replacing %s progress with the latest cloud revision',
  async (scenario) => {
    await open();
    edit();
    const latest = serverCopy();
    latest.revision = 8;
    latest.profileData.name = 'Latest journey';
    latest.creatures[0].xp = 41;
    vi.spyOn(profileClient, 'save').mockRejectedValue(
      scenario === 'stale'
        ? new ProfileApiError(409, 'STALE_PROFILE', 'Changed', latest)
        : new ProfileApiError(0, 'TIMEOUT', 'Unknown')
    );
    await useGameStore.getState().saveAccountProfile();
    if (scenario === 'unconfirmed') {
      vi.mocked(profileClient.load).mockResolvedValue(latest);
      await useGameStore.getState().checkAccountSave();
    }
    expect(useGameStore.getState().profiles[0]!.creatures[0].xp).toBe(17);
    expect(useGameStore.getState().cloudSaveConflict?.kind).toBe('updated');
    useGameStore.setState({ eventQueue: [{ type: 'GO_TO_PARTY' }] });
    useGameStore.getState().acknowledgeSaveConflict();
    const state = useGameStore.getState();
    expect(state.profiles[0]!.creatures[0].xp).toBe(41);
    expect(state.cloudProfiles[0]!.cloud.revision).toBe(8);
    expect(state.profiles[0]!.name).toBe('Latest journey');
    expect(state.cloudSaveConflict).toBeNull();
    expect(state.currentScreen).toBe(Screens.MODE_SELECT);
    expect(state.eventQueue).toEqual([]);
  }
);

it('never recreates a deleted cloud profile', async () => {
  await open();
  edit();
  vi.spyOn(profileClient, 'save').mockRejectedValue(
    new ProfileApiError(404, 'PROFILE_NOT_FOUND', 'Deleted')
  );
  const create = vi.spyOn(profileClient, 'create');
  await useGameStore.getState().saveAccountProfile();
  expect(useGameStore.getState().profiles[0]).not.toBeNull();
  vi.mocked(profileClient.list).mockResolvedValue({
    slots: [null, null, null],
  });
  useGameStore.getState().acknowledgeSaveConflict();
  await Promise.resolve();
  expect(useGameStore.getState().profiles[0]).toBeNull();
  expect(useGameStore.getState().currentScreen).toBe(Screens.PROFILES);
  expect(create).not.toHaveBeenCalled();
});

it.each([401, 400, 503])(
  'keeps draft and baseline on a known failure %i',
  async (status) => {
    await open();
    edit();
    const before = useGameStore.getState();
    vi.spyOn(profileClient, 'save').mockRejectedValue(
      new ProfileApiError(
        status,
        status === 503 ? 'SAVE_UNAVAILABLE' : 'CONTROLLED',
        'Controlled error'
      )
    );
    await before.saveAccountProfile();
    expect(useGameStore.getState().profiles[0]).toBe(before.profiles[0]);
    expect(useGameStore.getState().cloudProfiles[0]).toBe(
      before.cloudProfiles[0]
    );
    expect(useGameStore.getState().cloudSaveAttempt).toBeNull();
    expect(useGameStore.getState().cloudAuthRequired).toBe(status === 401);
    expect(useGameStore.getState().cloudSaveError).toContain(
      'progress is still held'
    );
  }
);

it('ignores a late save after switching accounts', async () => {
  await open();
  edit();
  const reply = deferred<CloudProfileSaveResult>();
  const result = confirmed();
  const save = vi.spyOn(profileClient, 'save').mockReturnValue(reply.promise);
  const pending = useGameStore.getState().saveAccountProfile();
  useGameStore.getState().setProfileAccount('account-b');
  expect(save.mock.calls[0][3]?.signal?.aborted).toBe(true);
  reply.resolve(result);
  await pending;
  expect(useGameStore.getState().profiles).toEqual([null, null, null]);
  expect(useGameStore.getState().cloudSaveAttempt).toBeNull();
  expect(useGameStore.getState().profileAccountId).toBe('account-b');
});

it('can check a canceled save without being stuck waiting for a slot refresh', async () => {
  await open();
  edit();
  const reply = deferred<CloudProfileSaveResult>();
  const result = confirmed();
  vi.spyOn(profileClient, 'save').mockReturnValue(reply.promise);
  const pending = useGameStore.getState().saveAccountProfile();
  useGameStore.getState().cancelProfileRequests();
  expect(useGameStore.getState().cloudSlotsStatus).toBe('ready');
  expect(useGameStore.getState().cloudSaveAttempt).not.toBeNull();
  reply.resolve(result);
  await pending;
  vi.mocked(profileClient.load).mockResolvedValue(savedAttempt());
  await useGameStore.getState().checkAccountSave();
  expect(useGameStore.getState().cloudProfiles[0]!.cloud.revision).toBe(5);
  expect(useGameStore.getState().cloudMutationNeedsRefresh).toBe(false);
});

it('preserves the uncertain draft when a refresh discovers a deleted slot', async () => {
  await open();
  edit();
  vi.spyOn(profileClient, 'save').mockRejectedValue(
    new ProfileApiError(0, 'TIMEOUT', 'Unknown')
  );
  await useGameStore.getState().saveAccountProfile();
  vi.mocked(profileClient.list).mockResolvedValue({
    slots: [null, null, null],
  });
  await useGameStore.getState().loadAccountSlots();
  expect(useGameStore.getState().profiles[0]!.creatures[0].xp).toBe(17);
  expect(useGameStore.getState().cloudSaveAttempt).not.toBeNull();
});
