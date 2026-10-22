import { useGameStore } from '@/store/gameStore';
import { createJSONStorage } from 'zustand/middleware';
import { profileClient, ProfileApiError } from '@/lib/profile-client';
import { CURRENT_PROFILE_VERSION } from '@/constants/game';
import { Screens, StoryProgression } from '@/types/baseGame';
import { resetStore } from '@/__tests__/utils/test-utils';
import {
  makeCloudProfile,
  makeCloudSummary,
  makeProfile,
  makePlayerCreature,
  testDefinitionId,
} from '@/__tests__/utils/dataBuilders';

const speciesId = testDefinitionId('loaded-cloud-creature');
function cloud(slot = 0) {
  return makeCloudProfile({
    id: `cloud-${slot}`,
    slot,
    boxId: `box-${slot}`,
    revision: 4,
    profile: {
      name: `Cloud ${slot}`,
      storyProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
      creatures: [
        makePlayerCreature({
          id: `creature-${slot}`,
          speciesId,
          originalOwnerId: 'historical-owner',
          xp: 7,
        }),
      ],
    },
  });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const persisted = () =>
  JSON.parse(localStorage.getItem('cosmoids-game-state')!);
beforeEach(() => {
  useGameStore.persist.setOptions({storage: createJSONStorage(() => localStorage)});
  resetStore();
});
afterEach(() => {
  useGameStore.getState().cancelProfileRequests();
  vi.restoreAllMocks();
});

async function openAccount() {
  const saved = cloud();
  vi.spyOn(profileClient, 'list').mockResolvedValue({
    slots: [makeCloudSummary(saved), null, null],
  });
  vi.spyOn(profileClient, 'load').mockResolvedValue(structuredClone(saved));
  useGameStore.getState().setProfileAccount('account-a');
  await useGameStore.getState().loadAccountSlots();
  await useGameStore.getState().loadAccountProfile(0);
  return saved;
}

it('persists only the guest bank while account data and gameplay changes stay in memory', async () => {
  const guest = makeProfile({ name: 'Local voyage' });
  useGameStore.setState({ profiles: [guest, null, null] });
  const before = persisted();
  await openAccount();
  const state = useGameStore.getState();
  state.updateCreatures([{ ...state.profiles[0]!.creatures[0], xp: 99 }]);
  state.setStoryProgression(StoryProgression.PICK_STARTER);
  expect(persisted()).toEqual(before);
  expect(Object.keys(persisted().state)).toEqual(['profiles']);
  expect(useGameStore.getState().profiles[0]?.creatures[0].xp).toBe(99);
  expect(
    useGameStore.getState().cloudProfiles[0]?.baseline.creatures[0].xp
  ).toBe(7);
  state.setProfileAccount(null);
  expect(useGameStore.getState().profiles[0]?.name).toBe('Local voyage');
  expect(useGameStore.getState().cloudProfiles.every((p) => p === null)).toBe(
    true
  );
  expect(useGameStore.getState().currentProfileId).toBeNull();
});

it('rehydrates only local profiles, ignoring any persisted account/session fields', async () => {
  await openAccount();
  const guest = makeProfile({ name: 'Disk guest' });
  localStorage.setItem(
    'cosmoids-game-state',
    JSON.stringify({
      version: 0,
      state: {
        profiles: [guest, null, null],
        profileAccountId: 'forged-account',
        cloudSlots: [],
      },
    })
  );
  await useGameStore.persist.rehydrate();
  expect(useGameStore.getState().profileAccountId).toBe('account-a');
  expect(useGameStore.getState().profiles[0]?.name).toBe('Cloud 0');
  expect(useGameStore.getState().guestProfiles[0]?.name).toBe('Disk guest');
  useGameStore.getState().setProfileAccount(null);
  expect(useGameStore.getState().profiles[0]?.name).toBe('Disk guest');
});

it('reloads the server copy after a fresh tab, rather than restoring unsaved account progress', async () => {
  await openAccount();
  let state = useGameStore.getState();
  state.updateCreatures([{ ...state.profiles[0]!.creatures[0], xp: 99 }]);
  const disk = localStorage.getItem('cosmoids-game-state')!;
  state.cancelProfileRequests();
  useGameStore.setState(useGameStore.getInitialState(), true);
  localStorage.setItem('cosmoids-game-state', disk);
  await useGameStore.persist.rehydrate();
  state = useGameStore.getState();
  expect(state.profileAccountId).toBeNull();
  expect(state.profiles.every((p) => p === null)).toBe(true);
  state.setProfileAccount('account-a');
  await useGameStore.getState().loadAccountSlots();
  await useGameStore.getState().loadAccountProfile(0);
  expect(useGameStore.getState().profiles[0]?.creatures[0].xp).toBe(7);
});

it('returning to the same profile resumes unsaved progress without another load', async () => {
  await openAccount();
  const state = useGameStore.getState();
  state.updateCreatures([{ ...state.profiles[0]!.creatures[0], xp: 99 }]);
  state.setScreen(Screens.PROFILES);
  await state.loadAccountProfile(0);
  expect(profileClient.load).toHaveBeenCalledTimes(1);
  expect(useGameStore.getState().profiles[0]?.creatures[0].xp).toBe(99);
});

it('does not let local create/delete/test-template paths change account slots', async () => {
  await openAccount();
  const before = useGameStore.getState().profiles;
  const state = useGameStore.getState();
  state.createProfile(1);
  state.deleteProfile(0);
  state.applyTestProfileTemplate('any-template');
  expect(useGameStore.getState().profiles).toBe(before);
});

it('ignores late list responses after switching accounts', async () => {
  const old = deferred<Awaited<ReturnType<typeof profileClient.list>>>();
  const list = vi
    .spyOn(profileClient, 'list')
    .mockReturnValueOnce(old.promise)
    .mockResolvedValue({ slots: [null, null, null] });
  useGameStore.getState().setProfileAccount('account-a');
  const pending = useGameStore.getState().loadAccountSlots();
  const signal = list.mock.calls[0][0]?.signal;
  useGameStore.getState().setProfileAccount('account-b');
  await useGameStore.getState().loadAccountSlots();
  expect(signal?.aborted).toBe(true);
  old.resolve({ slots: [makeCloudSummary(cloud()), null, null] });
  await pending;
  expect(useGameStore.getState().profileAccountId).toBe('account-b');
  expect(useGameStore.getState().cloudSlots).toEqual([null, null, null]);
});

it('ignores late profile responses after logout and clears navigation/battle state', async () => {
  const saved = cloud();
  const old = deferred<typeof saved>();
  vi.spyOn(profileClient, 'list').mockResolvedValue({
    slots: [makeCloudSummary(saved), null, null],
  });
  const load = vi.spyOn(profileClient, 'load').mockReturnValue(old.promise);
  useGameStore.getState().setProfileAccount('account-a');
  await useGameStore.getState().loadAccountSlots();
  const pending = useGameStore.getState().loadAccountProfile(0);
  useGameStore.setState({
    currentScreen: Screens.TOWER_DEFENSE,
    eventQueue: [{ type: 'GO_TO_PARTY' }],
  });
  useGameStore.getState().setProfileAccount(null);
  expect(load.mock.calls[0][1]?.signal?.aborted).toBe(true);
  old.resolve(saved);
  await pending;
  const state = useGameStore.getState();
  expect(state.currentProfileId).toBeNull();
  expect(state.currentTdLevel).toBeNull();
  expect(state.eventQueue).toEqual([]);
  expect(state.profiles.every((p) => p === null)).toBe(true);
});

it.each([401, 404, 503])(
  'a load failure %i retains other working copies and the previous baseline',
  async (status) => {
    await openAccount();
    const second = cloud(1);
    const state = useGameStore.getState();
    useGameStore.setState({
      cloudSlots: [state.cloudSlots[0], makeCloudSummary(second), null],
    });
    vi.mocked(profileClient.load).mockRejectedValueOnce(
      new ProfileApiError(status, 'CONTROLLED', 'Failure')
    );
    await state.loadAccountProfile(1);
    expect(useGameStore.getState().profiles[0]).toBe(state.profiles[0]);
    expect(useGameStore.getState().cloudProfiles[0]).toBe(
      state.cloudProfiles[0]
    );
    expect(useGameStore.getState().profiles[1]).toBeNull();
    expect(useGameStore.getState().failedProfileSlot).toBe(1);
  }
);

it('rejects unsupported cloud versions and unexpected identity without resetting a save', async () => {
  const saved = cloud();
  vi.spyOn(profileClient, 'list').mockResolvedValue({
    slots: [makeCloudSummary(saved), null, null],
  });
  const load = vi
    .spyOn(profileClient, 'load')
    .mockResolvedValueOnce({
      ...saved,
      profileVersion: CURRENT_PROFILE_VERSION + 1,
    })
    .mockResolvedValueOnce({ ...saved, id: 'different-profile' });
  useGameStore.getState().setProfileAccount('account-a');
  await useGameStore.getState().loadAccountSlots();
  await useGameStore.getState().loadAccountProfile(0);
  expect(useGameStore.getState().cloudProfileError).toContain('save format');
  await useGameStore.getState().loadAccountProfile(0);
  expect(useGameStore.getState().currentProfileId).toBeNull();
  expect(useGameStore.getState().profiles[0]).toBeNull();
  expect(load).toHaveBeenCalledTimes(2);
});
