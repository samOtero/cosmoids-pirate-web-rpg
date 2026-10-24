import { Screens, type Profile } from '@/types/baseGame';
import type { CloudProfileBaseline } from '@/types/cloudProfile';
import { hasCloudProfileChanges } from './profile-client';

export function canSaveOnScreen(screen: Screens) {
  return (
    screen !== Screens.START &&
    screen !== Screens.DIALOG &&
    screen !== Screens.TOWER_DEFENSE
  );
}

export function hasUnsavedCloudProfiles(state: {
  profileAccountId: string | null;
  profiles: (Profile | null)[];
  cloudProfiles: ({ baseline: CloudProfileBaseline } | null)[];
  cloudSaveAttempt: unknown;
}) {
  return Boolean(
    state.profileAccountId &&
    (state.cloudSaveAttempt ||
      state.profiles.some(
        (profile, slot) =>
          profile &&
          state.cloudProfiles[slot] &&
          hasCloudProfileChanges(profile, state.cloudProfiles[slot]!.baseline)
      ))
  );
}
