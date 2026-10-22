'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Screens } from '@/types/baseGame';
import { useAccount } from './AuthProvider';

/** Follow confirmed identities; an expired session retains its working copies. */
export function useProfileSession() {
  const { session, isPending, enabled } = useAccount();
  const accountId = session?.user.id ?? null;
  const profileAccountId = useGameStore((s) => s.profileAccountId);
  const status = useGameStore((s) => s.cloudSlotsStatus);
  const authRequired = useGameStore((s) => s.cloudAuthRequired);
  const screen = useGameStore((s) => s.currentScreen);
  const setAccount = useGameStore((s) => s.setProfileAccount);
  const loadSlots = useGameStore((s) => s.loadAccountSlots);
  const cancel = useGameStore((s) => s.cancelProfileRequests);

  useEffect(() => {
    if (!accountId) return;
    setAccount(accountId);
    void loadSlots();
    return cancel;
  }, [accountId, setAccount, loadSlots, cancel]);

  useEffect(() => {
    if (
      accountId &&
      accountId === profileAccountId &&
      screen === Screens.PROFILES &&
      status === 'idle'
    )
      void loadSlots();
  }, [accountId, profileAccountId, screen, status, loadSlots]);

  return {
    waitingForIdentity: enabled && isPending && !accountId && !profileAccountId,
    identityMismatch: Boolean(accountId && accountId !== profileAccountId),
    needsSession: Boolean(profileAccountId && (!accountId || authRequired)),
  };
}
