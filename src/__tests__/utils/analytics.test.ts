import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
}));
vi.mock('posthog-js', () => ({ default: sdk }));
vi.mock('@/store/gameStore', () => ({
  useGameStore: { getState: () => ({ currentProfileId: null, profiles: [] }) },
}));
vi.mock('@/utils/testProfileAccess', () => ({
  isTestProfileOverrideEnabled: () => false,
}));

describe('optional gameplay analytics', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_test');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('does not initialize or capture before consent or after declining', async () => {
    const analytics = await import('@/utils/analytics');
    await analytics.trackGameEvent('game_started');
    analytics.setAnalyticsPreference('declined');
    await analytics.trackGameEvent('game_started');
    expect(sdk.init).not.toHaveBeenCalled();
    expect(sdk.capture).not.toHaveBeenCalled();
  });

  it('initializes once, strips URL metadata, and stops queued events after withdrawal', async () => {
    const analytics = await import('@/utils/analytics');
    analytics.setAnalyticsPreference('allowed');
    await analytics.trackGameEvent('game_started');
    await analytics.trackGameEvent('level_started', {
      level_id: 'FIRST_LEVEL',
    });
    expect(sdk.init).toHaveBeenCalledTimes(1);
    expect(sdk.capture).toHaveBeenCalledTimes(2);
    const config = sdk.init.mock.calls[0][1];
    expect(config.autocapture).toBe(false);
    expect(config.disable_session_recording).toBe(true);
    expect(
      config.before_send({
        properties: {
          $current_url: 'https://example.com/?name=private',
          level_id: 'FIRST_LEVEL',
        },
      }).properties
    ).toEqual({ level_id: 'FIRST_LEVEL' });
    analytics.setAnalyticsPreference('declined');
    expect(config.before_send({ properties: {} })).toBeNull();
    await analytics.trackGameEvent('game_started');
    expect(sdk.capture).toHaveBeenCalledTimes(2);
    expect(sdk.opt_out_capturing).toHaveBeenCalled();
  });

  it('does not collect from development builds', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const analytics = await import('@/utils/analytics');
    analytics.setAnalyticsPreference('allowed');
    await analytics.trackGameEvent('game_started');
    expect(sdk.init).not.toHaveBeenCalled();
  });

  it('contains SDK failures so gameplay callers can continue', async () => {
    sdk.init.mockImplementationOnce(() => {
      throw new Error('Blocked');
    });
    const analytics = await import('@/utils/analytics');
    analytics.setAnalyticsPreference('allowed');
    await expect(
      analytics.trackGameEvent('game_started')
    ).resolves.toBeUndefined();
    expect(sdk.capture).not.toHaveBeenCalled();
  });

  it('does not load the SDK when consent is withdrawn during initialization', async () => {
    const analytics = await import('@/utils/analytics');
    analytics.setAnalyticsPreference('allowed');
    const pending = analytics.trackGameEvent('game_started');
    analytics.setAnalyticsPreference('declined');
    await pending;
    expect(sdk.init).not.toHaveBeenCalled();
  });
});
