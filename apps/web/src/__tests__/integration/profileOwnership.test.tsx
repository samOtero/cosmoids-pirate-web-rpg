import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
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
import { profileClient } from '@/lib/profile-client';

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

it('opens cloud data with its account identity, baseline and revision, without local creation/deletion', async () => {
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
  ).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: 'Delete Data' })
  ).not.toBeInTheDocument();
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
