import { MAX_PROFILES } from '@/constants/game';
import {
  ProfileApiError,
  createCloudWorkingCopy,
  createCloudSaveBaseline,
  hasCloudProfileChanges,
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
  CloudProfile,
  CloudProfileReference,
  CloudProfileSummary,
  CloudProfileWorkingCopy,
  CloudProfileBaseline,
} from '@/types/cloudProfile';
import { createNewProfile } from '@/utils/createProfile';
import { canSaveOnScreen } from '@/lib/cloud-save-state';

export type CloudProfileState = Omit<CloudProfileWorkingCopy, 'profile'>;
export type CloudProfileMutation = {
  kind: 'create' | 'delete' | 'save' | 'check';
  slot: number;
};
export interface CloudSaveAttempt {
  slot: number;
  reference: CloudProfileReference;
  submitted: CloudProfileBaseline;
}
export type CloudSaveConflict =
  | { kind: 'updated'; slot: number; latest: CloudProfile }
  | { kind: 'deleted'; slot: number; id: string };
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
  cloudMutation: CloudProfileMutation | null;
  cloudMutationError: string | null;
  cloudMutationNeedsRefresh: boolean;
  cloudSaveAttempt: CloudSaveAttempt | null;
  cloudSaveConflict: CloudSaveConflict | null;
  cloudSaveError: string | null;
  setProfileAccount: (accountId: string | null) => void;
  loadAccountSlots: () => Promise<void>;
  loadAccountProfile: (slot: number) => Promise<void>;
  createAccountProfile: (slot: number) => Promise<void>;
  saveAccountProfile: () => Promise<void>;
  checkAccountSave: () => Promise<void>;
  acknowledgeSaveConflict: () => void;
  deleteAccountProfile: (
    slot: number,
    confirmed: CloudProfileReference
  ) => Promise<void>;
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
const validSlot = (slot: number) =>
  Number.isInteger(slot) && slot >= 0 && slot < MAX_PROFILES;
function summary(saved: CloudProfile): CloudProfileSummary {
  return {
    id: saved.id,
    slot: saved.slot,
    profileVersion: saved.profileVersion,
    revision: saved.revision,
    name: saved.profileData.name,
    lastPlayed: saved.profileData.lastPlayed,
    storyProgression: saved.profileData.storyProgression,
    partyCount: saved.creatures.length,
    storageCount: saved.storageCreatures.length,
    savedAt: saved.savedAt,
  };
}
function mutationFailure(error: unknown, kind: 'create' | 'delete') {
  if (error instanceof ProfileApiError) {
    if (error.status === 401)
      return {
        cloudMutationError:
          'Your session expired. Log in again before creating or deleting cloud profiles.',
        cloudAuthRequired: true,
        cloudMutationNeedsRefresh: true,
      };
    if (error.status === 409 || error.status === 404)
      return {
        cloudMutationError:
          error.code === 'STALE_PROFILE'
            ? 'This cloud save changed on another device. Refresh saves and confirm deletion again.'
            : 'Your cloud save slots changed. Refresh saves before trying again.',
        cloudMutationNeedsRefresh: true,
      };
    if (
      error.status > 0 &&
      error.status < 500 &&
      error.code !== 'INVALID_RESPONSE'
    )
      return {
        cloudMutationError: error.message,
        cloudMutationNeedsRefresh: false,
      };
  }
  return {
    cloudMutationError: `Couldn’t confirm whether the cloud save was ${kind === 'create' ? 'created' : 'deleted'}. Refresh saves to check the result before trying again.`,
    cloudMutationNeedsRefresh: true,
  };
}
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
  let mutationRequest: AbortController | null = null;
  const cancel = () => {
    listRequest?.abort();
    profileRequest?.abort();
    mutationRequest?.abort();
  };
  const saveFailure = (error: unknown, attempt: CloudSaveAttempt) => {
    if (error instanceof ProfileApiError) {
      if (
        error.code === 'STALE_PROFILE' &&
        error.latest &&
        error.latest.id === attempt.reference.id &&
        error.latest.slot === attempt.slot
      ) {
        set({
          cloudMutation: null,
          cloudSaveAttempt: null,
          cloudSaveError: null,
          cloudSaveConflict: {
            kind: 'updated',
            slot: attempt.slot,
            latest: error.latest,
          },
        });
        return;
      }
      if (error.status === 404) {
        set({
          cloudMutation: null,
          cloudSaveAttempt: null,
          cloudSaveError: null,
          cloudSaveConflict: {
            kind: 'deleted',
            slot: attempt.slot,
            id: attempt.reference.id,
          },
        });
        return;
      }
      if (error.status === 401) {
        set({
          cloudMutation: null,
          cloudSaveAttempt: null,
          cloudAuthRequired: true,
          cloudSaveError:
            'Your session expired. Log in again to save. Your progress is still held in this tab.',
        });
        return;
      }
      if (
        (error.status >= 400 && error.status < 500 && error.status !== 409) ||
        [
          'INVALID_PROFILE',
          'UNSUPPORTED_PROFILE_VERSION',
          'UNSUPPORTED_CREATURE_REMOVAL',
          'UNSUPPORTED_BOX_REMOVAL',
          'NOT_CONFIGURED',
          'SAVE_UNAVAILABLE',
        ].includes(error.code)
      ) {
        set({
          cloudMutation: null,
          cloudSaveAttempt: null,
          cloudSaveError: `${error.message} Your progress is still held in this tab.`,
        });
        return;
      }
    }
    set({
      cloudMutation: null,
      cloudSaveAttempt: attempt,
      cloudSaveError:
        'The save result is unconfirmed. Your progress is still held in this tab. Check cloud save before saving again.',
    });
  };
  const confirmSave = (
    slot: number,
    cloud: CloudProfileState['cloud'],
    baseline: CloudProfileBaseline
  ) => {
    const state = get();
    const cloudProfiles = [...state.cloudProfiles];
    const cloudSlots = [...state.cloudSlots];
    cloudProfiles[slot] = {
      cloud,
      baseline,
      storageBoxes: baseline.storageBoxes.map((box) => ({
        ...box,
        creatureIds: [...box.creatureIds],
      })),
    };
    cloudSlots[slot] = {
      id: cloud.id,
      slot,
      profileVersion: cloud.profileVersion,
      revision: cloud.revision,
      savedAt: cloud.savedAt,
      name: baseline.profileData.name,
      lastPlayed: baseline.profileData.lastPlayed,
      storyProgression: baseline.profileData.storyProgression,
      partyCount: baseline.creatures.length,
      storageCount: baseline.storageCreatures.length,
    };
    set({
      cloudProfiles,
      cloudSlots,
      cloudMutation: null,
      cloudSaveAttempt: null,
      cloudSaveError: null,
    });
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
    cloudMutation: null,
    cloudMutationError: null,
    cloudMutationNeedsRefresh: false,
    cloudSaveAttempt: null,
    cloudSaveConflict: null,
    cloudSaveError: null,
    cancelProfileRequests: () => {
      const mutation = get().cloudMutation;
      const wasMutating =
        mutation?.kind === 'create' || mutation?.kind === 'delete';
      cancel();
      set({
        loadingProfileSlot: null,
        cloudMutation: null,
        ...(wasMutating ? { cloudMutationNeedsRefresh: true } : {}),
        cloudSlotsStatus:
          wasMutating || get().cloudSlotsStatus === 'loading'
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
        cloudMutation: null,
        cloudMutationError: null,
        cloudMutationNeedsRefresh: false,
        cloudSaveAttempt: null,
        cloudSaveConflict: null,
        cloudSaveError: null,
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
      if (!accountId || get().cloudMutation) return;
      listRequest?.abort();
      profileRequest?.abort();
      const request = (listRequest = new AbortController());
      const generation = context;
      const current = () =>
        !request.signal.aborted &&
        generation === context &&
        get().profileAccountId === accountId;
      set({
        cloudSlotsStatus: 'loading',
        loadingProfileSlot: null,
        cloudSlotsError: null,
        cloudProfileError: null,
        failedProfileSlot: null,
      });
      try {
        const result = await profileClient.list({ signal: request.signal });
        if (current()) {
          const state = get();
          const profiles = [...state.profiles];
          const cloudProfiles = [...state.cloudProfiles];
          for (let slot = 0; slot < MAX_PROFILES; slot++) {
            // A deleted/replaced UUID must never resume the previous working copy.
            if (
              slot !== state.cloudSaveAttempt?.slot &&
              cloudProfiles[slot]?.cloud.id !== result.slots[slot]?.id
            ) {
              profiles[slot] = null;
              cloudProfiles[slot] = null;
            }
          }
          set({
            profiles,
            cloudProfiles,
            cloudSlots: result.slots,
            cloudSlotsStatus: 'ready',
            cloudAuthRequired: false,
            cloudMutationError: null,
            cloudMutationNeedsRefresh: false,
            currentProfileId:
              state.currentProfileId !== null &&
              !profiles[state.currentProfileId]
                ? null
                : state.currentProfileId,
          });
        }
      } catch (error) {
        if (current())
          set({
            cloudSlotsStatus: 'error',
            cloudSlotsError: loadError(error),
            cloudAuthRequired:
              error instanceof ProfileApiError && error.status === 401,
          });
      }
    },
    loadAccountProfile: async (slot) => {
      const state = get();
      const accountId = state.profileAccountId;
      const summary = state.cloudSlots[slot];
      if (
        !validSlot(slot) ||
        !accountId ||
        state.cloudSlotsStatus !== 'ready' ||
        !summary ||
        state.cloudMutation ||
        state.cloudSaveAttempt ||
        state.cloudSaveConflict
      )
        return;
      // Returning to a loaded profile resumes its working copy, not an older save.
      if (
        state.cloudProfiles[slot]?.cloud.id === summary.id &&
        state.profiles[slot]
      ) {
        profileRequest?.abort();
        set({
          loadingProfileSlot: null,
          cloudProfileError: null,
          failedProfileSlot: null,
          cloudSaveError: null,
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
        cloudSaveError: null,
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
        const cloudSlots = [...get().cloudSlots];
        profiles[slot] = profile;
        cloudProfiles[slot] = cloud;
        cloudSlots[slot] = {
          ...summary,
          revision: saved.revision,
          savedAt: saved.savedAt,
        };
        set({ profiles, cloudProfiles, cloudSlots, loadingProfileSlot: null });
        get().selectProfile(slot);
      } catch (error) {
        if (current())
          set({
            loadingProfileSlot: null,
            cloudProfileError: loadError(error),
            failedProfileSlot: slot,
            cloudAuthRequired:
              error instanceof ProfileApiError && error.status === 401,
          });
      }
    },
    createAccountProfile: async (slot) => {
      const state = get();
      const accountId = state.profileAccountId;
      if (
        !validSlot(slot) ||
        !accountId ||
        state.cloudAuthRequired ||
        state.cloudSlotsStatus !== 'ready' ||
        state.cloudSlots[slot] ||
        state.cloudMutation ||
        state.cloudMutationNeedsRefresh ||
        state.cloudSaveAttempt ||
        state.cloudSaveConflict ||
        state.loadingProfileSlot !== null
      )
        return;
      const request = (mutationRequest = new AbortController());
      const generation = context;
      const current = () =>
        !request.signal.aborted &&
        generation === context &&
        get().profileAccountId === accountId;
      set({
        cloudMutation: { kind: 'create', slot },
        cloudMutationError: null,
        cloudProfileError: null,
        failedProfileSlot: null,
      });
      try {
        const saved = await profileClient.create(
          slot,
          createNewProfile(slot, accountId),
          { signal: request.signal }
        );
        if (!current()) return;
        if (saved.slot !== slot) throw new Error('Unexpected profile slot');
        const { profile, ...cloud } = createCloudWorkingCopy(saved, accountId);
        const profiles = [...get().profiles];
        const cloudProfiles = [...get().cloudProfiles];
        const cloudSlots = [...get().cloudSlots];
        profiles[slot] = profile;
        cloudProfiles[slot] = cloud;
        cloudSlots[slot] = summary(saved);
        set({
          profiles,
          cloudProfiles,
          cloudSlots,
          cloudMutation: null,
          cloudSaveError: null,
        });
        get().selectProfile(slot);
      } catch (error) {
        if (current())
          set({ cloudMutation: null, ...mutationFailure(error, 'create') });
      }
    },
    deleteAccountProfile: async (slot, confirmed) => {
      const state = get();
      const accountId = state.profileAccountId;
      const target = state.cloudSlots[slot];
      if (
        !validSlot(slot) ||
        !accountId ||
        !target ||
        state.cloudAuthRequired ||
        state.cloudSlotsStatus !== 'ready' ||
        state.cloudMutation ||
        state.cloudMutationNeedsRefresh ||
        state.cloudSaveAttempt ||
        state.cloudSaveConflict ||
        state.loadingProfileSlot !== null
      )
        return;
      if (
        target.id !== confirmed.id ||
        target.revision !== confirmed.revision
      ) {
        set({
          cloudMutationError:
            'This cloud save changed. Refresh saves and confirm deletion again.',
          cloudMutationNeedsRefresh: true,
        });
        return;
      }
      const request = (mutationRequest = new AbortController());
      const generation = context;
      const current = () =>
        !request.signal.aborted &&
        generation === context &&
        get().profileAccountId === accountId;
      set({
        cloudMutation: { kind: 'delete', slot },
        cloudMutationError: null,
        cloudProfileError: null,
        failedProfileSlot: null,
      });
      try {
        await profileClient.delete(
          { id: target.id, revision: target.revision },
          { signal: request.signal }
        );
        if (!current()) return;
        const profiles = [...get().profiles];
        const cloudProfiles = [...get().cloudProfiles];
        const cloudSlots = [...get().cloudSlots];
        profiles[slot] = null;
        cloudProfiles[slot] = null;
        cloudSlots[slot] = null;
        set({
          profiles,
          cloudProfiles,
          cloudSlots,
          cloudMutation: null,
          ...(get().currentProfileId === slot
            ? {
                currentProfileId: null,
                eventQueue: [],
                currentTdLevel: null,
                dialogContext: null,
                dialogContextData: null,
              }
            : {}),
        });
      } catch (error) {
        if (current())
          set({ cloudMutation: null, ...mutationFailure(error, 'delete') });
      }
    },
    saveAccountProfile: async () => {
      const state = get();
      const slot = state.currentProfileId;
      const accountId = state.profileAccountId;
      const profile = slot === null ? null : state.profiles[slot];
      const previous = slot === null ? null : state.cloudProfiles[slot];
      if (
        slot === null ||
        !accountId ||
        !profile ||
        !previous ||
        !canSaveOnScreen(state.currentScreen) ||
        state.cloudMutation ||
        state.cloudSaveAttempt ||
        state.cloudSaveConflict ||
        state.cloudAuthRequired ||
        state.cloudMutationNeedsRefresh ||
        state.loadingProfileSlot !== null ||
        state.cloudSlotsStatus !== 'ready' ||
        !hasCloudProfileChanges(profile, previous.baseline)
      )
        return;
      let submitted: CloudProfileBaseline;
      try {
        submitted = createCloudSaveBaseline(profile, previous.baseline);
      } catch (error) {
        set({
          cloudSaveError:
            error instanceof Error
              ? error.message
              : 'This profile could not be prepared for saving.',
        });
        return;
      }
      listRequest?.abort();
      const request = (mutationRequest = new AbortController());
      const generation = context;
      const current = () =>
        !request.signal.aborted &&
        generation === context &&
        get().profileAccountId === accountId &&
        get().cloudProfiles[slot]?.cloud.id === previous.cloud.id;
      const attempt = {
        slot,
        reference: { id: previous.cloud.id, revision: previous.cloud.revision },
        submitted,
      };
      set({
        cloudMutation: { kind: 'save', slot },
        cloudSaveAttempt: attempt,
        cloudSaveError: null,
      });
      try {
        const saved = await profileClient.save(
          previous.cloud,
          profile,
          previous.baseline,
          { signal: request.signal }
        );
        if (!current()) return;
        if (
          saved.cloud.id !== previous.cloud.id ||
          saved.cloud.slot !== slot ||
          saved.cloud.revision !== previous.cloud.revision + 1
        )
          throw new Error('Unexpected save identity or revision');
        confirmSave(slot, saved.cloud, saved.baseline);
      } catch (error) {
        if (current()) saveFailure(error, attempt);
      }
    },
    checkAccountSave: async () => {
      const state = get();
      const attempt = state.cloudSaveAttempt;
      const accountId = state.profileAccountId;
      if (
        !attempt ||
        !accountId ||
        state.cloudMutation ||
        state.cloudSaveConflict ||
        !canSaveOnScreen(state.currentScreen)
      )
        return;
      const request = (mutationRequest = new AbortController());
      const generation = context;
      const current = () =>
        !request.signal.aborted &&
        generation === context &&
        get().profileAccountId === accountId;
      set({
        cloudMutation: { kind: 'check', slot: attempt.slot },
        cloudSaveError: null,
      });
      try {
        const latest = await profileClient.load(attempt.reference.id, {
          signal: request.signal,
        });
        if (!current()) return;
        if (
          latest.id !== attempt.reference.id ||
          latest.slot !== attempt.slot ||
          latest.revision < attempt.reference.revision
        )
          throw new Error('Unexpected save identity or revision');
        const confirmed = createCloudWorkingCopy(latest, accountId);
        if (latest.revision === attempt.reference.revision) {
          set({
            cloudMutation: null,
            cloudSaveAttempt: null,
            cloudSaveError:
              'The previous save did not reach the cloud. Your progress is kept. Press Save to try again.',
          });
        } else if (
          latest.revision === attempt.reference.revision + 1 &&
          JSON.stringify(confirmed.baseline) ===
            JSON.stringify(attempt.submitted)
        ) {
          confirmSave(attempt.slot, confirmed.cloud, confirmed.baseline);
        } else {
          set({
            cloudMutation: null,
            cloudSaveAttempt: null,
            cloudSaveConflict: { kind: 'updated', slot: attempt.slot, latest },
          });
        }
      } catch (error) {
        if (!current()) return;
        if (error instanceof ProfileApiError && error.status === 404)
          saveFailure(error, attempt);
        else
          set({
            cloudMutation: null,
            cloudSaveError:
              'Couldn’t check the cloud save. Your progress is kept. Try checking again.',
            ...(error instanceof ProfileApiError && error.status === 401
              ? { cloudAuthRequired: true }
              : {}),
          });
      }
    },
    acknowledgeSaveConflict: () => {
      const state = get();
      const conflict = state.cloudSaveConflict;
      const accountId = state.profileAccountId;
      if (!conflict || !accountId || state.cloudMutation) return;
      const profiles = [...state.profiles];
      const cloudProfiles = [...state.cloudProfiles];
      const cloudSlots = [...state.cloudSlots];
      if (conflict.kind === 'updated') {
        try {
          const { profile, ...cloud } = createCloudWorkingCopy(
            conflict.latest,
            accountId
          );
          profiles[conflict.slot] = profile;
          cloudProfiles[conflict.slot] = cloud;
          cloudSlots[conflict.slot] = summary(conflict.latest);
        } catch (error) {
          set({
            cloudSaveError:
              error instanceof Error
                ? error.message
                : 'This save could not be loaded.',
          });
          return;
        }
      } else {
        profiles[conflict.slot] = null;
        cloudProfiles[conflict.slot] = null;
        cloudSlots[conflict.slot] = null;
      }
      set({
        profiles,
        cloudProfiles,
        cloudSlots,
        cloudSaveConflict: null,
        cloudSaveAttempt: null,
        cloudSaveError: null,
        cloudMutationNeedsRefresh: false,
        currentProfileId: null,
        eventQueue: [],
        currentTdLevel: null,
        dialogContext: null,
        dialogContextData: null,
        currentScreen: Screens.PROFILES,
      });
      if (conflict.kind === 'updated') get().selectProfile(conflict.slot);
      else void get().loadAccountSlots();
    },
  };
}
