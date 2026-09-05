import type { PostHog } from 'posthog-js';
import { isTestProfileOverrideEnabled } from './testProfileAccess';
import { useGameStore } from '@/store/gameStore';

export const ANALYTICS_PREFERENCE_KEY = 'cosmoids.analytics-consent.v1';
export type AnalyticsPreference = 'allowed' | 'declined' | null;
type Properties = Record<string, string | number | boolean | string[]>;
type GameEvent =
  | 'game_started'
  | 'level_started'
  | 'level_finished'
  | 'capture_result'
  | 'feedback_submitted'
  | 'game_error';

let client: PostHog | undefined;
let loading: Promise<PostHog | undefined> | undefined;
let preference: AnalyticsPreference | undefined;

export function getAnalyticsPreference(): AnalyticsPreference {
  if (preference !== undefined) return preference;
  try {
    const saved = localStorage.getItem(ANALYTICS_PREFERENCE_KEY);
    return saved === 'allowed' || saved === 'declined' ? saved : null;
  } catch {
    return null;
  }
}

export function analyticsEnabled(): boolean {
  const state = useGameStore.getState();
  const profile =
    state.currentProfileId === null
      ? null
      : state.profiles[state.currentProfileId];
  const testProfile = profile?.creatures.some((creature) =>
    creature.id.startsWith('test-profile-')
  );

  const isWindowDefined = typeof window !== 'undefined';
  const notTestProfile = !testProfile;
  const nodeEnv = process.env.NODE_ENV;
  const isProduction = nodeEnv === 'production';
  const hostname = isWindowDefined ? window.location.hostname : undefined;
  const testProfileOverride = isWindowDefined
    ? isTestProfileOverrideEnabled(hostname)
    : false;
  const notTestProfileOverride = !testProfileOverride;
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const hasPosthogKey = !!posthogKey;
  const preference = getAnalyticsPreference();
  const isAllowed = preference === 'allowed';

  const enabled =
    isWindowDefined &&
    notTestProfile &&
    isProduction &&
    notTestProfileOverride &&
    hasPosthogKey &&
    isAllowed;

  console.log('[Analytics Debug] analyticsEnabled values:', {
    enabled,
    'typeof window !== undefined': isWindowDefined,
    '!testProfile': notTestProfile,
    testProfile,
    "NODE_ENV === 'production'": isProduction,
    NODE_ENV: nodeEnv,
    '!isTestProfileOverrideEnabled': notTestProfileOverride,
    isTestProfileOverrideEnabled: testProfileOverride,
    hostname,
    NEXT_PUBLIC_COSMOIDS_BUILD_BRANCH:
      process.env.NEXT_PUBLIC_COSMOIDS_BUILD_BRANCH,
    '!!NEXT_PUBLIC_POSTHOG_KEY': hasPosthogKey,
    hasPosthogKey,
    posthogKeyLength: posthogKey ? posthogKey.length : 0,
    getAnalyticsPreference: preference,
    "getAnalyticsPreference() === 'allowed'": isAllowed,
    profileId: state.currentProfileId,
  });

  return enabled;
}


export function setAnalyticsPreference(
  value: Exclude<AnalyticsPreference, null>
) {
  preference = value;
  try {
    localStorage.setItem(ANALYTICS_PREFERENCE_KEY, value);
  } catch {
    /* Session-only choice. */
  }
  try {
    if (value === 'declined') client?.opt_out_capturing();
    else client?.opt_in_capturing({ captureEventName: false });
  } catch {
    /* Analytics must never block play. */
  }
  window.dispatchEvent(new Event('cosmoids-analytics-preference'));
}

async function getClient(): Promise<PostHog | undefined> {
  if (!analyticsEnabled()) return undefined;
  if (client) return client;
  if (!loading) {
    loading = import('posthog-js')
      .then(({ default: posthog }) => {
        if (!analyticsEnabled()) return undefined;
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
          api_host:
            process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: false,
          capture_dead_clicks: false,
          capture_heatmaps: false,
          capture_performance: false,
          capture_exceptions: false,
          disable_session_recording: true,
          disable_surveys: true,
          advanced_disable_flags: true,
          person_profiles: 'never',
          persistence: 'localStorage',
          ip: false,
          before_send: (event) => {
            if (!analyticsEnabled()) return null;
            if (event) {
              for (const key of Object.keys(event.properties)) {
                if (/url|referr|pathname|host/i.test(key))
                  delete event.properties[key];
              }
            }
            return event;
          },
        });
        posthog.opt_in_capturing({ captureEventName: false });
        client = posthog;
        return client;
      })
      .catch(() => undefined)
      .finally(() => {
        loading = undefined;
      });
  }
  return loading;
}

/** Deliberately drop events collected before consent; never buffer them for later. */
export async function trackGameEvent(
  event: GameEvent,
  properties: Properties = {}
): Promise<void> {
  if (!analyticsEnabled()) return;
  try {
    const sdk = await getClient();
    if (!analyticsEnabled()) return;
    sdk?.capture(event, {
      ...properties,
      game_version: process.env.NEXT_PUBLIC_COSMOIDS_BUILD_VERSION || 'unknown',
      schema_version: 1,
      $geoip_disable: true,
    });
  } catch {
    /* Blockers, storage failures, and offline play are expected. */
  }
}
