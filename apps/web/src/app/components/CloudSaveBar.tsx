'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { hasCloudProfileChanges } from '@/lib/profile-client';
import {
  canSaveOnScreen,
  hasUnsavedCloudProfiles,
} from '@/lib/cloud-save-state';
import { useAccount } from './auth/AuthProvider';
import AccountDialog from './auth/AccountDialog';
import { Button } from './ui/Button';

/** Cloud drafts remain in memory, including while another loaded slot is open. */
export function useCloudSaveExitWarning() {
  const accountId = useGameStore((s) => s.profileAccountId);
  const profiles = useGameStore((s) => s.profiles);
  const cloudProfiles = useGameStore((s) => s.cloudProfiles);
  const attempt = useGameStore((s) => s.cloudSaveAttempt);
  const dirty = useMemo(
    () =>
      hasUnsavedCloudProfiles({
        profileAccountId: accountId,
        profiles,
        cloudProfiles,
        cloudSaveAttempt: attempt,
      }),
    [accountId, profiles, cloudProfiles, attempt]
  );
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
}

export default function CloudSaveBar() {
  const { session } = useAccount();
  const accountId = useGameStore((s) => s.profileAccountId);
  const screen = useGameStore((s) => s.currentScreen);
  const slot = useGameStore((s) => s.currentProfileId);
  const profile = useGameStore((s) =>
    s.currentProfileId === null ? null : s.profiles[s.currentProfileId]
  );
  const cloud = useGameStore((s) =>
    s.currentProfileId === null ? null : s.cloudProfiles[s.currentProfileId]
  );
  const mutation = useGameStore((s) => s.cloudMutation);
  const attempt = useGameStore((s) => s.cloudSaveAttempt);
  const error = useGameStore((s) => s.cloudSaveError);
  const authRequired = useGameStore((s) => s.cloudAuthRequired);
  const needsRefresh = useGameStore((s) => s.cloudMutationNeedsRefresh);
  const slotsStatus = useGameStore((s) => s.cloudSlotsStatus);
  const loadingSlot = useGameStore((s) => s.loadingProfileSlot);
  const save = useGameStore((s) => s.saveAccountProfile);
  const check = useGameStore((s) => s.checkAccountSave);
  const refresh = useGameStore((s) => s.loadAccountSlots);
  const [loginOpen, setLoginOpen] = useState(false);
  const dirty = useMemo(
    () =>
      Boolean(
        profile && cloud && hasCloudProfileChanges(profile, cloud.baseline)
      ),
    [profile, cloud]
  );
  if (
    !accountId ||
    !profile ||
    !cloud ||
    slot === null ||
    !canSaveOnScreen(screen) ||
    (session && session.user.id !== accountId)
  )
    return null;
  const needsLogin = !session || authRequired;
  const saving = mutation?.kind === 'save';
  const checking = mutation?.kind === 'check';
  const busy =
    Boolean(mutation) || slotsStatus === 'loading' || loadingSlot !== null;
  const label = saving
    ? 'Saving…'
    : checking
      ? 'Checking…'
      : needsLogin
        ? 'Log in to save'
        : attempt
          ? 'Check cloud save'
          : needsRefresh || slotsStatus !== 'ready'
            ? 'Refresh saves'
            : 'Save';
  return (
    <section
      aria-label="Cloud save"
      className="z-20 shrink-0 border-b border-cyan-800/60 bg-[#091b2b] px-3 py-1.5 text-sand lg:px-6"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="min-w-0 text-xs lg:text-sm">
          <p className="truncate font-bold">
            {profile.name} · Save {slot + 1}
          </p>
          <p
            aria-live="polite"
            className={dirty ? 'text-amber-200' : 'text-emerald-200'}
          >
            {saving
              ? 'Saving to your account…'
              : checking
                ? 'Checking the saved result…'
                : dirty
                  ? 'Unsaved changes'
                  : 'Saved'}
            {!saving && !checking && (
              <>
                {' '}
                ·{' '}
                <time dateTime={cloud.cloud.savedAt}>
                  {new Date(cloud.cloud.savedAt).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </time>
              </>
            )}
          </p>
        </div>
        <Button
          type="button"
          className="min-h-11 shrink-0 px-4 text-xs lg:text-sm"
          disabled={
            busy ||
            (!needsLogin &&
              !attempt &&
              !needsRefresh &&
              slotsStatus === 'ready' &&
              !dirty)
          }
          onClick={() => {
            if (needsLogin) setLoginOpen(true);
            else if (attempt) void check();
            else if (needsRefresh || slotsStatus !== 'ready') void refresh();
            else void save();
          }}
        >
          {label}
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="mx-auto mt-1 max-w-7xl text-xs leading-snug text-amber-200"
        >
          {error}
        </p>
      )}
      {loginOpen && (
        <AccountDialog
          action="login"
          onClose={() => setLoginOpen(false)}
          onAuthenticated={() => {
            setLoginOpen(false);
            void useGameStore.getState().loadAccountSlots();
          }}
        />
      )}
    </section>
  );
}
