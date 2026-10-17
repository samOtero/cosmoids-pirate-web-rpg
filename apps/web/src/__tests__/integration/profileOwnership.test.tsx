import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '@/app/page';
import { useGameStore } from '@/store/gameStore';
import { Screens } from '@/types/baseGame';
import { MAX_PROFILES } from '@/constants/game';
import { GUEST_OWNER_ID } from '@/utils/creatureOwnership';
import { resetStore } from '@/__tests__/utils/test-utils';

const account = vi.hoisted(() => ({
  session: null as { user: { id: string } } | null,
  isPending: false,
}));
vi.mock('@/app/components/auth/AuthProvider', () => ({
  useAccount: () => account,
}));
vi.mock('@/app/components/auth/AccountIdentity', () => ({
  default: () => null,
}));
vi.mock('@/app/components/dialogScreen', () => ({ default: () => null }));

beforeEach(() => {
  resetStore();
  account.session = null;
  account.isPending = false;
  useGameStore.getState().setScreen(Screens.PROFILES);
});

describe('profile ownership from account identity', () => {
  it.each([null, 'signed-in-account'])(
    'creates all save slots for account %s',
    async (accountId) => {
      account.session = accountId ? { user: { id: accountId } } : null;
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
          .profiles.every(
            (profile) => profile?.ownerId === (accountId ?? GUEST_OWNER_ID)
          )
      ).toBe(true);
    }
  );

  it('does not relabel an existing save when the account changes', async () => {
    const store = useGameStore.getState();
    store.createProfile(0, 'first-account');
    store.setScreen(Screens.PROFILES);
    account.session = { user: { id: 'second-account' } };
    render(<Home />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Create save in slot 2',
      })
    );
    expect(useGameStore.getState().profiles[0]?.ownerId).toBe('first-account');
    expect(useGameStore.getState().profiles[1]?.ownerId).toBe('second-account');
  });
});
