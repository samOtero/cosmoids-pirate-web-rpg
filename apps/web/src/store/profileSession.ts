import { MAX_PROFILES } from '@/constants/game';
import {
  ProfileApiError,
  createCloudWorkingCopy,
  profileClient,
} from '@/lib/profile-client';
import {
  Screens,
  type Profile,
  type GameEvent,
  type DialogContext,
  type DialogContextData,
  type TDLevelConfig,
} from '@/types/baseGame';
import type {
  CloudProfileSummary,
  CloudProfileWorkingCopy,
} from '@/types/cloudProfile';

export type CloudProfileState = Omit<CloudProfileWorkingCopy, 'profile'>;
export interface ProfileSessionSlice {
  profileAccountId: string | null;
  guestProfiles: (Profile | null)[];
  cloudSlots: (CloudProfileSummary | null)[];
  cloudProfiles: (CloudProfileState | null)[];
  cloudSlotsStatus: 'idle' | 'loading' | 'ready' | 'error';
  cloudSlotsError: string | null;
  loadingProfileSlot: number | null;
  cloudProfileError: string | null;
  failedProfileSlot: number | null;
  cloudAuthRequired: boolean;
  setProfileAccount: (accountId: string | null) => void;
  loadAccountSlots: () => Promise<void>;
  loadAccountProfile: (slot: number) => Promise<void>;
  cancelProfileRequests: () => void;
}

interface SessionHost extends ProfileSessionSlice {
  profiles: (Profile | null)[];
  currentProfileId: number | null;
  currentScreen: Screens;
  dialogContext: DialogContext | null;
  dialogContextData: DialogContextData | null;
  eventQueue: GameEvent[];
  currentTdLevel: TDLevelConfig | null;
  selectProfile: (slot: number) => void;
}

const emptySlots = () => Array<null>(MAX_PROFILES).fill(null);
function loadError(error: unknown): string {
  if (error instanceof ProfileApiError) {
    if (error.status === 401)
      return 'Your session expired. Log in again to load your cloud profiles.';
    if (error.code === 'UNSUPPORTED_PROFILE_VERSION') return error.message;
    if (error.status === 404)
      return 'This cloud save is no longer available. Refresh your save slots.';
  }
  return 'Couldn’t load your cloud save. Check your connection and try again.';
}

/** Runtime-only account state. Persistence selects only the guest bank. */
export function createProfileSessionSlice(
  set: (state: Partial<SessionHost>) => void,
  get: () => SessionHost
): ProfileSessionSlice {
  let context = 0;
  let listRequest: AbortController | null = null;
  let profileRequest: AbortController | null = null;
  const cancel = () => {
    listRequest?.abort();
    profileRequest?.abort();
  };
  return {
    profileAccountId: null,
    guestProfiles: emptySlots(),
    cloudSlots: emptySlots(),
    cloudProfiles: emptySlots(),
    cloudSlotsStatus: 'idle',
    cloudSlotsError: null,
    loadingProfileSlot: null,
    cloudProfileError: null,
    failedProfileSlot: null,
    cloudAuthRequired: false,
    cancelProfileRequests: () => {
      cancel();
      set({
        loadingProfileSlot: null,
        cloudSlotsStatus:
          get().cloudSlotsStatus === 'loading'
            ? 'idle'
            : get().cloudSlotsStatus,
      });
    },
    setProfileAccount: (accountId) => {
      const previous = get();
      if (previous.profileAccountId === accountId) return;
      context++;
      cancel();
      const guests = previous.profileAccountId
        ? previous.guestProfiles
        : previous.profiles;
      set({
        profileAccountId: accountId,
        guestProfiles: accountId ? guests : emptySlots(),
        profiles: accountId ? emptySlots() : guests,
        cloudSlots: emptySlots(),
        cloudProfiles: emptySlots(),
        cloudSlotsStatus: 'idle',
        cloudSlotsError: null,
        loadingProfileSlot: null,
        cloudProfileError: null,
        failedProfileSlot: null,
        cloudAuthRequired: false,
        currentProfileId: null,
        eventQueue: [],
        currentTdLevel: null,
        dialogContext: null,
        dialogContextData: null,
        currentScreen:
          previous.currentScreen === Screens.START
            ? Screens.START
            : Screens.PROFILES,
      });
    },
    loadAccountSlots: async () => {
      const accountId = get().profileAccountId;
      if (!accountId) return;
      listRequest?.abort();
      const request = (listRequest = new AbortController());
      const generation = context;
      const current = () =>
        !request.signal.aborted &&
        generation === context &&
        get().profileAccountId === accountId;
      set({ cloudSlotsStatus: 'loading', cloudSlotsError: null, cloudProfileError: null, failedProfileSlot: null });
      try {
        const result = await profileClient.list({ signal: request.signal });
        if (current())
          set({ cloudSlots: result.slots, cloudSlotsStatus: 'ready', cloudAuthRequired: false });
      } catch (error) {
        if (current())
          set({ cloudSlotsStatus: 'error', cloudSlotsError: loadError(error), cloudAuthRequired: error instanceof ProfileApiError && error.status === 401 });
      }
    },
    loadAccountProfile: async (slot) => {
      const state = get();
      const accountId = state.profileAccountId;
      const summary = state.cloudSlots[slot];
      if (!accountId || state.cloudSlotsStatus !== 'ready' || !summary) return;
      // Returning to a loaded profile resumes its working copy, not an older save.
      if (state.cloudProfiles[slot] && state.profiles[slot]) {
        profileRequest?.abort();
        set({
          loadingProfileSlot: null,
          cloudProfileError: null,
          failedProfileSlot: null,
        });
        get().selectProfile(slot);
        return;
      }
      profileRequest?.abort();
      const request = (profileRequest = new AbortController());
      const generation = context;
      const current = () =>
        !request.signal.aborted &&
        generation === context &&
        get().profileAccountId === accountId;
      set({
        loadingProfileSlot: slot,
        cloudProfileError: null,
        failedProfileSlot: null,
      });
      try {
        const saved = await profileClient.load(summary.id, {
          signal: request.signal,
        });
        if (!current()) return;
        if (saved.id !== summary.id || saved.slot !== slot)
          throw new Error('Unexpected profile identity');
        const { profile, ...cloud } = createCloudWorkingCopy(saved, accountId);
        const profiles = [...get().profiles];
        const cloudProfiles = [...get().cloudProfiles];
        profiles[slot] = profile;
        cloudProfiles[slot] = cloud;
        set({ profiles, cloudProfiles, loadingProfileSlot: null });
        get().selectProfile(slot);
      } catch (error) {
        if (current())
          set({
            loadingProfileSlot: null,
            cloudProfileError: loadError(error),
            failedProfileSlot: slot,
            cloudAuthRequired: error instanceof ProfileApiError && error.status === 401,
          });
      }
    },
  };
}
