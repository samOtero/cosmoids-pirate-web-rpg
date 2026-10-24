import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { StrictMode } from 'react';
import type { MockInstance } from 'vitest';
import Home from '@/app/page';
import { useGameStore } from '@/store/gameStore';
import { Screens, StoryProgression } from '@/types/baseGame';
import { MAX_PROFILES } from '@/constants/game';
import { GUEST_OWNER_ID } from '@/utils/creatureOwnership';
import { resetStore } from '@/__tests__/utils/test-utils';
import {
  makeCloudProfile,
  makeCloudSummary,
} from '@/__tests__/utils/dataBuilders';
import { profileClient, ProfileApiError } from '@/lib/profile-client';
import type { CloudProfileSaveResult } from '@/types/cloudProfile';

const account = vi.hoisted(() => ({
  enabled: true,
  session: null as { user: { id: string } } | null,
  isPending: false,
  hasError: false,
  refetch: vi.fn(async () => {}),
}));
vi.mock('@/app/components/auth/AuthProvider', () => ({
  useAccount: () => account,
}));
vi.mock('@/app/components/auth/AccountIdentity', () => ({
  default: () => null,
}));
vi.mock('@/app/components/dialogScreen', () => ({ default: () => null }));
vi.mock('@/app/components/ModeSelectScreen', () => ({
  default: () => <p>Choose game mode</p>,
}));

const saved = makeCloudProfile({
  id: 'cloud-profile',
  slot: 0,
  boxId: 'box-1',
  profile: {
    name: 'Cloud voyage',
    storyProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
  },
});
const slots = () => ({ slots: [makeCloudSummary(saved), null, null] });
let list: MockInstance<typeof profileClient.list>;
let load: MockInstance<typeof profileClient.load>;
const originalShowModal = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal'
);
const originalClose = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close'
);
beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value() {
        this.setAttribute('open', '');
      },
    },
    close: {
      configurable: true,
      value() {
        this.removeAttribute('open');
      },
    },
  });
});
afterAll(() => {
  for (const [key, descriptor] of [
    ['showModal', originalShowModal],
    ['close', originalClose],
  ] as const) {
    if (descriptor)
      Object.defineProperty(HTMLDialogElement.prototype, key, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, key);
  }
});
beforeEach(() => {
  resetStore();
  account.session = null;
  account.isPending = false;
  account.hasError = false;
  list = vi.spyOn(profileClient, 'list').mockResolvedValue(slots());
  load = vi
    .spyOn(profileClient, 'load')
    .mockResolvedValue(structuredClone(saved));
  useGameStore.getState().setScreen(Screens.PROFILES);
});
afterEach(() => {
  act(() => useGameStore.getState().cancelProfileRequests());
  vi.restoreAllMocks();
});

it('keeps guest creation local in all three slots', async () => {
  render(<Home />);
  for (let slot = 0; slot < MAX_PROFILES; slot++) {
    act(() => useGameStore.getState().setScreen(Screens.PROFILES));
    fireEvent.click(
      await screen.findByRole('button', {
        name: `Create save in slot ${slot + 1}`,
      })
    );
  }
  expect(
    useGameStore
      .getState()
      .profiles.every((profile) => profile?.ownerId === GUEST_OWNER_ID)
  ).toBe(true);
  expect(list).not.toHaveBeenCalled();
});

it('hides guest profiles while identity is unresolved and never fetches early', async () => {
  useGameStore.getState().createProfile(0);
  useGameStore.getState().setScreen(Screens.PROFILES);
  account.isPending = true;
  const view = render(<Home />);
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Checking your account'
  );
  expect(
    screen.queryByRole('button', { name: 'Load Caleb' })
  ).not.toBeInTheDocument();
  expect(list).not.toHaveBeenCalled();
  account.isPending = false;
  account.session = { user: { id: 'account-a' } };
  view.rerender(<Home />);
  expect(
    await screen.findByRole('button', { name: 'Load Cloud voyage' })
  ).toBeEnabled();
  expect(
    screen.queryByRole('button', { name: 'Load Caleb' })
  ).not.toBeInTheDocument();
  expect(useGameStore.getState().guestProfiles[0]?.ownerId).toBe('guest');
});

it('opens cloud data with its account identity, baseline and revision, and enables cloud creation/deletion', async () => {
  account.session = { user: { id: 'account-a' } };
  render(<Home />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Load Cloud voyage' })
  );
  expect(await screen.findByText('Choose game mode')).toBeInTheDocument();
  const state = useGameStore.getState();
  expect(state.profiles[0]?.ownerId).toBe('account-a');
  expect(state.cloudProfiles[0]?.cloud.id).toBe('cloud-profile');
  expect(state.cloudProfiles[0]?.cloud.revision).toBe(1);
  expect(state.cloudProfiles[0]?.baseline.profileData.name).toBe(
    'Cloud voyage'
  );
  act(() => state.setScreen(Screens.PROFILES));
  expect(
    screen.getByRole('button', { name: 'Create save in slot 2' })
  ).toBeEnabled();
  expect(
    screen.getByRole('button', { name: 'Delete Cloud voyage in slot 1' })
  ).toBeEnabled();
});

it('creates an account profile before opening its introduction', async () => {
  account.session = { user: { id: 'account-a' } };
  const created = makeCloudProfile({
    id: 'new-cloud',
    slot: 1,
    boxId: 'new-box',
  });
  let resolve!: (value: typeof created) => void;
  const create = vi.spyOn(profileClient, 'create').mockReturnValue(
    new Promise((done) => {
      resolve = done;
    })
  );
  render(<Home />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Create save in slot 2' })
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    'Creating cloud save in slot 2'
  );
  expect(
    screen.getByRole('button', { name: 'Create save in slot 3' })
  ).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
  expect(useGameStore.getState().profiles[1]).toBeNull();
  expect(create).toHaveBeenCalledWith(
    1,
    expect.objectContaining({ ownerId: 'account-a', creatures: [] }),
    expect.anything()
  );
  await act(async () => resolve(created));
  expect(useGameStore.getState().currentProfileId).toBe(1);
  expect(useGameStore.getState().currentScreen).toBe(Screens.DIALOG);
  expect(useGameStore.getState().cloudProfiles[1]?.cloud.id).toBe('new-cloud');
});

it('requires a named cloud deletion confirmation and keeps the slot until the API confirms', async () => {
  account.session = { user: { id: 'account-a' } };
  let resolve!: () => void;
  const remove = vi.spyOn(profileClient, 'delete').mockReturnValue(
    new Promise<void>((done) => {
      resolve = done;
    })
  );
  render(<Home />);
  const button = await screen.findByRole('button', {
    name: 'Delete Cloud voyage in slot 1',
  });
  button.focus();
  fireEvent.click(button);
  let dialog = screen.getByRole('dialog', { name: 'Delete cloud save?' });
  expect(dialog).toHaveTextContent('Cloud voyage · Slot 1');
  expect(dialog).toHaveTextContent('every Cosmoid in its team and storage');
  expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(remove).not.toHaveBeenCalled();
  expect(button).toHaveFocus();
  fireEvent.click(button);
  dialog = screen.getByRole('dialog');
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Delete cloud save' })
  );
  expect(remove).toHaveBeenCalledWith(
    { id: 'cloud-profile', revision: 1 },
    expect.anything()
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Deleting cloud save in slot 1'
  );
  expect(
    screen.getByRole('button', { name: 'Load Cloud voyage' })
  ).toBeDisabled();
  await act(async () => resolve());
  expect(
    screen.queryByRole('button', { name: 'Load Cloud voyage' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Create save in slot 1' })
  ).toBeEnabled();
});

it('blocks another write after an uncertain request until the player refreshes saves', async () => {
  account.session = { user: { id: 'account-a' } };
  const create = vi
    .spyOn(profileClient, 'create')
    .mockRejectedValue(new ProfileApiError(0, 'TIMEOUT', 'Unconfirmed'));
  render(<Home />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Create save in slot 2' })
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Refresh saves to check the result'
  );
  expect(
    screen.getByRole('button', { name: 'Create save in slot 2' })
  ).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh saves' }));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Create save in slot 2' })
    ).toBeEnabled()
  );
  expect(create).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('shows cloud errors and Retry without substituting guest saves', async () => {
  useGameStore.getState().createProfile(0);
  useGameStore.getState().setScreen(Screens.PROFILES);
  list.mockRejectedValueOnce(new Error('offline'));
  account.session = { user: { id: 'account-a' } };
  render(<Home />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t load');
  expect(
    screen.queryByRole('button', { name: 'Load Caleb' })
  ).not.toBeInTheDocument();
  expect(screen.queryByText('Empty Slot')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(
    await screen.findByRole('button', { name: 'Load Cloud voyage' })
  ).toBeEnabled();
  load.mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Load Cloud voyage' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t load');
  expect(useGameStore.getState().currentProfileId).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('Choose game mode')).toBeInTheDocument();
});

it('clears another account before rendering its replacement slots', async () => {
  account.session = { user: { id: 'account-a' } };
  const view = render(<Home />);
  await screen.findByRole('button', { name: 'Load Cloud voyage' });
  list.mockResolvedValueOnce({ slots: [null, null, null] });
  account.session = { user: { id: 'account-b' } };
  view.rerender(<Home />);
  await waitFor(() =>
    expect(useGameStore.getState().cloudSlotsStatus).toBe('ready')
  );
  expect(useGameStore.getState().profileAccountId).toBe('account-b');
  expect(
    screen.queryByRole('button', { name: 'Load Cloud voyage' })
  ).not.toBeInTheDocument();
  expect(screen.getAllByText('Empty Slot')).toHaveLength(3);
});

it('retains a working account copy when a session disappears; the same login resumes it', async () => {
  account.session = { user: { id: 'account-a' } };
  const view = render(<Home />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Load Cloud voyage' })
  );
  await screen.findByText('Choose game mode');
  act(() => useGameStore.getState().setScreen(Screens.PROFILES));
  account.session = null;
  view.rerender(<Home />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'current progress is still held'
  );
  expect(useGameStore.getState().profiles[0]?.name).toBe('Cloud voyage');
  account.session = { user: { id: 'account-a' } };
  view.rerender(<Home />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Load Cloud voyage' })
  );
  await screen.findByText('Choose game mode');
  expect(load).toHaveBeenCalledTimes(1);
});

it('recovers cleanly from Strict Mode request cancellation', async () => {
  account.session = { user: { id: 'account-a' } };
  render(
    <StrictMode>
      <Home />
    </StrictMode>
  );
  expect(
    await screen.findByRole('button', { name: 'Load Cloud voyage' })
  ).toBeEnabled();
  expect(useGameStore.getState().cloudSlotsStatus).toBe('ready');
});

async function openForSaving() {
  account.session = { user: { id: 'account-a' } };
  const view = render(<Home />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Load Cloud voyage' })
  );
  await screen.findByText('Choose game mode');
  return view;
}
function editName() {
  act(() =>
    useGameStore.setState((state) => ({
      profiles: state.profiles.map((profile, slot) =>
        profile && slot === 0 ? { ...profile, name: 'Edited journey' } : profile
      ),
    }))
  );
}
function saveReply(): CloudProfileSaveResult {
  const state = useGameStore.getState();
  const cloud = state.cloudProfiles[0]!;
  const baseline = structuredClone(cloud.baseline);
  baseline.profileData.name = 'Edited journey';
  baseline.profileData.lastPlayed = state.profiles[0]!.lastPlayed;
  return {
    cloud: { ...cloud.cloud, revision: 2, savedAt: '2026-10-22T12:00:00.000Z' },
    baseline,
  };
}

it('shows unsaved, saving and saved states, blocking menu input until the save completes', async () => {
  await openForSaving();
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  editName();
  expect(
    screen.getByText('Unsaved changes', { exact: false })
  ).toBeInTheDocument();
  const reply = saveReply();
  let resolve!: (value: CloudProfileSaveResult) => void;
  vi.spyOn(profileClient, 'save').mockReturnValue(
    new Promise((done) => {
      resolve = done;
    })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  expect(
    screen.getByText('Choose game mode').closest('[inert]')
  ).not.toBeNull();
  await act(async () => resolve(reply));
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  expect(screen.getByText('Choose game mode').closest('[inert]')).toBeNull();
  expect(useGameStore.getState().cloudProfiles[0]!.cloud.revision).toBe(2);
});

it('shows a conflict notice before replacing progress with the newer saved revision', async () => {
  await openForSaving();
  editName();
  const latest = makeCloudProfile({
    id: saved.id,
    slot: 0,
    boxId: 'box-1',
    revision: 3,
    profile: {
      name: 'Other device',
      storyProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
    },
  });
  vi.spyOn(profileClient, 'save').mockRejectedValue(
    new ProfileApiError(409, 'STALE_PROFILE', 'Changed', latest)
  );
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  const dialog = await screen.findByRole('dialog', {
    name: 'A newer cloud save is available',
  });
  expect(dialog).toHaveTextContent(
    'unsaved changes in this tab will be discarded'
  );
  expect(useGameStore.getState().profiles[0]!.name).toBe('Edited journey');
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Load latest save' })
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(useGameStore.getState().profiles[0]!.name).toBe('Other device');
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
});

it('checks an uncertain save without sending a second write', async () => {
  await openForSaving();
  editName();
  const save = vi
    .spyOn(profileClient, 'save')
    .mockRejectedValue(new ProfileApiError(0, 'TIMEOUT', 'Unknown'));
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('unconfirmed');
  const latest = makeCloudProfile({
    id: saved.id,
    slot: 0,
    boxId: 'box-1',
    revision: 2,
    profile: {
      ...saved.profileData,
      name: 'Edited journey',
      lastPlayed: useGameStore.getState().profiles[0]!.lastPlayed,
    },
  });
  load.mockResolvedValue(latest);
  fireEvent.click(screen.getByRole('button', { name: 'Check cloud save' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  );
  expect(save).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('keeps expired-session progress available for signing in again', async () => {
  await openForSaving();
  editName();
  vi.spyOn(profileClient, 'save').mockRejectedValue(
    new ProfileApiError(401, 'UNAUTHENTICATED', 'Expired')
  );
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  fireEvent.click(
    await screen.findByRole('button', { name: 'Log in to save' })
  );
  expect(screen.getByRole('dialog', { name: 'Log in' })).toBeInTheDocument();
  expect(useGameStore.getState().profiles[0]!.name).toBe('Edited journey');
});

it('warns on closing a dirty account tab and hides saving during battles and story dialogs', async () => {
  await openForSaving();
  let event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
  editName();
  event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  for (const target of [Screens.TOWER_DEFENSE, Screens.DIALOG, Screens.START]) {
    act(() => useGameStore.getState().setScreen(target));
    expect(
      screen.queryByRole('region', { name: 'Cloud save' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Save' })
    ).not.toBeInTheDocument();
  }
});
