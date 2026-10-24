import { createJSONStorage } from 'zustand/middleware';
import { useGameStore } from '@/store/gameStore';
import { profileClient, ProfileApiError } from '@/lib/profile-client';
import { Screens, StoryProgression } from '@/types/baseGame';
import { resetStore } from '@/__tests__/utils/test-utils';
import {
  makeCloudProfile,
  makeCloudSummary,
  makeProfile,
} from '@/__tests__/utils/dataBuilders';

const saved = (slot = 0) =>
  makeCloudProfile({
    id: `cloud-${slot}`,
    slot,
    boxId: `box-${slot}`,
    revision: 4,
    profile: {
      name: `Voyage ${slot}`,
      storyProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
    },
  });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
async function openAccount(loaded = false) {
  const profile = saved();
  vi.spyOn(profileClient, 'list').mockResolvedValue({
    slots: [makeCloudSummary(profile), null, null],
  });
  vi.spyOn(profileClient, 'load').mockResolvedValue(profile);
  useGameStore.getState().setProfileAccount('account-a');
  await useGameStore.getState().loadAccountSlots();
  if (loaded) await useGameStore.getState().loadAccountProfile(0);
  useGameStore.getState().setScreen(Screens.PROFILES);
  return profile;
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

it('serializes writes and only enters a newly created profile after server confirmation', async () => {
  await openAccount();
  const reply = deferred<ReturnType<typeof saved>>();
  const create = vi
    .spyOn(profileClient, 'create')
    .mockReturnValue(reply.promise);
  const remove = vi.spyOn(profileClient, 'delete').mockResolvedValue();
  const state = useGameStore.getState();
  const pending = state.createAccountProfile(1);
  await state.createAccountProfile(1);
  await state.createAccountProfile(2);
  await state.deleteAccountProfile(0, { id: 'cloud-0', revision: 4 });
  await state.loadAccountProfile(0);
  await state.loadAccountSlots();
  expect(create).toHaveBeenCalledTimes(1);
  expect(remove).not.toHaveBeenCalled();
  expect(profileClient.load).not.toHaveBeenCalled();
  expect(profileClient.list).toHaveBeenCalledTimes(1);
  expect(useGameStore.getState().profiles[1]).toBeNull();
  expect(useGameStore.getState().currentScreen).toBe(Screens.PROFILES);
  const created = makeCloudProfile({
    id: 'new-id',
    slot: 1,
    boxId: 'new-box',
    profile: { name: 'Server name' },
  });
  reply.resolve(created);
  await pending;
  const after = useGameStore.getState();
  expect(after.cloudSlots[1]).toMatchObject({
    id: 'new-id',
    revision: 1,
    name: 'Server name',
  });
  expect(after.profiles[1]).toMatchObject({
    id: 1,
    ownerId: 'account-a',
    name: 'Server name',
  });
  expect(after.cloudProfiles[1]?.baseline.profileData.name).toBe('Server name');
  expect(after.currentScreen).toBe(Screens.DIALOG);
  expect(after.currentProfileId).toBe(1);
});

it('creates and deletes cloud profiles without touching the guest bank or its disk save', async () => {
  useGameStore.setState({
    profiles: [makeProfile({ name: 'Local voyage' }), null, null],
  });
  const disk = localStorage.getItem('cosmoids-game-state');
  await openAccount();
  vi.spyOn(profileClient, 'create').mockResolvedValue(saved(1));
  vi.spyOn(profileClient, 'delete').mockResolvedValue();
  await useGameStore.getState().createAccountProfile(1);
  await useGameStore
    .getState()
    .deleteAccountProfile(1, { id: 'cloud-1', revision: 4 });
  expect(localStorage.getItem('cosmoids-game-state')).toBe(disk);
  useGameStore.getState().setProfileAccount(null);
  expect(useGameStore.getState().profiles[0]?.name).toBe('Local voyage');
});

it('does not remove a loaded working copy before deletion is acknowledged, then clears its metadata and gameplay', async () => {
  await openAccount(true);
  const reply = deferred<void>();
  const remove = vi
    .spyOn(profileClient, 'delete')
    .mockReturnValue(reply.promise);
  useGameStore.setState({ eventQueue: [{ type: 'GO_TO_PARTY' }] });
  const before = useGameStore.getState();
  const pending = before.deleteAccountProfile(0, {
    id: 'cloud-0',
    revision: 4,
  });
  expect(useGameStore.getState().profiles[0]).toBe(before.profiles[0]);
  expect(useGameStore.getState().cloudSlots[0]).not.toBeNull();
  expect(remove).toHaveBeenCalledWith(
    { id: 'cloud-0', revision: 4 },
    expect.objectContaining({ signal: expect.any(AbortSignal) })
  );
  reply.resolve();
  await pending;
  const after = useGameStore.getState();
  expect(after.profiles[0]).toBeNull();
  expect(after.cloudProfiles[0]).toBeNull();
  expect(after.cloudSlots[0]).toBeNull();
  expect(after.currentProfileId).toBeNull();
  expect(after.eventQueue).toEqual([]);
  expect(after.dialogContext).toBeNull();
});

it.each(['create', 'delete'] as const)(
  'requires reconciliation after an unconfirmed %s instead of replaying the write',
  async (kind) => {
    await openAccount(true);
    const create = vi
      .spyOn(profileClient, 'create')
      .mockRejectedValue(new ProfileApiError(0, 'TIMEOUT', 'Unknown'));
    const remove = vi
      .spyOn(profileClient, 'delete')
      .mockRejectedValue(
        new ProfileApiError(503, 'SAVE_UNAVAILABLE', 'Unknown')
      );
    const before = useGameStore.getState();
    const run = () =>
      kind === 'create'
        ? before.createAccountProfile(1)
        : before.deleteAccountProfile(0, { id: 'cloud-0', revision: 4 });
    await run();
    await run();
    expect(kind === 'create' ? create : remove).toHaveBeenCalledTimes(1);
    expect(useGameStore.getState().cloudMutationNeedsRefresh).toBe(true);
    expect(useGameStore.getState().profiles[0]).toBe(before.profiles[0]);
    expect(useGameStore.getState().cloudMutationError).toContain(
      'Refresh saves'
    );
    await before.loadAccountSlots();
    expect(useGameStore.getState().cloudMutationNeedsRefresh).toBe(false);
    expect(useGameStore.getState().cloudMutationError).toBeNull();
  }
);

it('keeps a stale deletion intact and requires a new confirmation at the refreshed revision', async () => {
  const original = await openAccount(true);
  const latest = { ...original, revision: 5 };
  const remove = vi
    .spyOn(profileClient, 'delete')
    .mockRejectedValueOnce(
      new ProfileApiError(409, 'STALE_PROFILE', 'Changed', latest)
    )
    .mockResolvedValue();
  const before = useGameStore.getState();
  await before.deleteAccountProfile(0, { id: 'cloud-0', revision: 4 });
  expect(useGameStore.getState().profiles[0]).toBe(before.profiles[0]);
  expect(useGameStore.getState().cloudMutationError).toContain(
    'confirm deletion again'
  );
  vi.mocked(profileClient.list).mockResolvedValue({
    slots: [makeCloudSummary(latest), null, null],
  });
  await before.loadAccountSlots();
  await before.deleteAccountProfile(0, { id: 'cloud-0', revision: 4 });
  expect(remove).toHaveBeenCalledTimes(1);
  await before.loadAccountSlots();
  await before.deleteAccountProfile(0, { id: 'cloud-0', revision: 5 });
  expect(remove).toHaveBeenLastCalledWith(
    { id: 'cloud-0', revision: 5 },
    expect.anything()
  );
  expect(useGameStore.getState().cloudSlots[0]).toBeNull();
});

it('reconciles an occupied slot after a creation conflict without loading or overwriting it', async () => {
  await openAccount();
  const create = vi
    .spyOn(profileClient, 'create')
    .mockRejectedValue(new ProfileApiError(409, 'SLOT_OCCUPIED', 'Occupied'));
  await useGameStore.getState().createAccountProfile(1);
  expect(useGameStore.getState().profiles[1]).toBeNull();
  expect(useGameStore.getState().cloudMutationNeedsRefresh).toBe(true);
  const other = saved(1);
  vi.mocked(profileClient.list).mockResolvedValue({
    slots: [makeCloudSummary(saved()), makeCloudSummary(other), null],
  });
  await useGameStore.getState().loadAccountSlots();
  await useGameStore.getState().createAccountProfile(1);
  expect(create).toHaveBeenCalledTimes(1);
  expect(useGameStore.getState().cloudSlots[1]?.id).toBe(other.id);
  expect(useGameStore.getState().profiles[1]).toBeNull();
});

it.each(['create', 'delete'] as const)(
  'ignores a late %s result after switching accounts and aborts its request',
  async (kind) => {
    await openAccount(true);
    const createReply = deferred<ReturnType<typeof saved>>();
    const deleteReply = deferred<void>();
    const create = vi
      .spyOn(profileClient, 'create')
      .mockReturnValue(createReply.promise);
    const remove = vi
      .spyOn(profileClient, 'delete')
      .mockReturnValue(deleteReply.promise);
    const pending =
      kind === 'create'
        ? useGameStore.getState().createAccountProfile(1)
        : useGameStore
            .getState()
            .deleteAccountProfile(0, { id: 'cloud-0', revision: 4 });
    useGameStore.getState().setProfileAccount('account-b');
    createReply.resolve(saved(1));
    deleteReply.resolve();
    await pending;
    const signal =
      kind === 'create'
        ? create.mock.calls[0][2]?.signal
        : remove.mock.calls[0][1]?.signal;
    expect(signal?.aborted).toBe(true);
    expect(useGameStore.getState().profileAccountId).toBe('account-b');
    expect(useGameStore.getState().profiles).toEqual([null, null, null]);
    expect(useGameStore.getState().cloudSlots).toEqual([null, null, null]);
    expect(useGameStore.getState().cloudMutation).toBeNull();
  }
);

it('reconciles a canceled creation when returning to the same account', async () => {
  await openAccount();
  const reply = deferred<ReturnType<typeof saved>>();
  vi.spyOn(profileClient, 'create').mockReturnValue(reply.promise);
  const pending = useGameStore.getState().createAccountProfile(1);
  useGameStore.getState().cancelProfileRequests();
  expect(useGameStore.getState().cloudSlotsStatus).toBe('idle');
  expect(useGameStore.getState().cloudMutationNeedsRefresh).toBe(true);
  reply.resolve(saved(1));
  await pending;
  expect(useGameStore.getState().profiles[1]).toBeNull();
  vi.mocked(profileClient.list).mockResolvedValue({
    slots: [makeCloudSummary(saved()), makeCloudSummary(saved(1)), null],
  });
  await useGameStore.getState().loadAccountSlots();
  expect(useGameStore.getState().cloudSlots[1]?.id).toBe('cloud-1');
  expect(useGameStore.getState().cloudMutationNeedsRefresh).toBe(false);
});

it('clears deleted/replaced UUIDs on refresh so their working copies cannot be resurrected', async () => {
  await openAccount(true);
  const replacement = { ...saved(), id: 'replacement-id' };
  vi.mocked(profileClient.list)
    .mockResolvedValueOnce({
      slots: [makeCloudSummary(replacement), null, null],
    })
    .mockResolvedValueOnce({ slots: [null, null, null] });
  await useGameStore.getState().loadAccountSlots();
  expect(useGameStore.getState().profiles[0]).toBeNull();
  expect(useGameStore.getState().cloudProfiles[0]).toBeNull();
  expect(useGameStore.getState().currentProfileId).toBeNull();
  vi.mocked(profileClient.load).mockResolvedValue(replacement);
  await useGameStore.getState().loadAccountProfile(0);
  expect(useGameStore.getState().cloudProfiles[0]?.cloud.id).toBe(
    'replacement-id'
  );
  await useGameStore.getState().loadAccountSlots();
  expect(useGameStore.getState().profiles[0]).toBeNull();
});

it.each(['create', 'delete'] as const)(
  'requires reauthentication on a %s 401 without discarding other profiles',
  async (kind) => {
    await openAccount(true);
    const error = new ProfileApiError(401, 'UNAUTHENTICATED', 'Expired');
    vi.spyOn(profileClient, 'create').mockRejectedValue(error);
    vi.spyOn(profileClient, 'delete').mockRejectedValue(error);
    const before = useGameStore.getState();
    if (kind === 'create') await before.createAccountProfile(1);
    else await before.deleteAccountProfile(0, { id: 'cloud-0', revision: 4 });
    expect(useGameStore.getState().cloudAuthRequired).toBe(true);
    expect(useGameStore.getState().profiles[0]).toBe(before.profiles[0]);
    await before.loadAccountSlots();
    expect(useGameStore.getState().cloudAuthRequired).toBe(false);
  }
);

it('rejects invalid/local/occupied writes and stale confirmation identities without calling the API', async () => {
  const create = vi.spyOn(profileClient, 'create');
  const remove = vi.spyOn(profileClient, 'delete');
  await useGameStore.getState().createAccountProfile(0);
  await useGameStore
    .getState()
    .deleteAccountProfile(0, { id: 'local', revision: 1 });
  await openAccount();
  for (const slot of [-1, 3, 0.5])
    await useGameStore.getState().createAccountProfile(slot);
  await useGameStore.getState().createAccountProfile(0);
  await useGameStore
    .getState()
    .deleteAccountProfile(0, { id: 'another-profile', revision: 4 });
  expect(create).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
});
