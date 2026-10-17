import { testDefinitionId } from '@/__tests__/utils/dataBuilders';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const capture = vi.hoisted(() => vi.fn());
vi.mock('@/utils/analytics', () => ({
  analyticsEnabled: () => true,
  trackGameEvent: capture,
}));
import { createBattleAnalytics } from '@/utils/battleAnalytics';

describe('battle analytics lifecycle', () => {
  beforeEach(() => capture.mockClear());
  it('links start and finish, deduplicates outcomes, and records unique deployed species', () => {
    const battle = createBattleAnalytics('FIRST_LEVEL', 'story', [
      'fueguana:5',
    ]);
    battle.start();
    battle.start();
    battle.deploy(testDefinitionId('fueguana'));
    battle.deploy(testDefinitionId('fueguana'));
    battle.finish('win', 12345, 3, 2);
    battle.finish('quit', 14000, 3, 2);
    expect(capture).toHaveBeenCalledTimes(2);
    expect(capture.mock.calls[1][1]).toMatchObject({
      attempt_id: capture.mock.calls[0][1].attempt_id,
      outcome: 'win',
      simulation_duration_seconds: 12,
      deployed_species: [testDefinitionId('fueguana')],
    });
  });
  it('does not invent starts or outcomes for previews and unstarted battles', () => {
    createBattleAnalytics('unknown', 'story', []).start();
    createBattleAnalytics('FIRST_LEVEL', 'story', []).finish('quit', 0, 0, 3);
    expect(capture).not.toHaveBeenCalled();
  });
  it('allows a separate retry to produce a new attempt ID', () => {
    createBattleAnalytics('FIRST_LEVEL', 'story', []).start();
    createBattleAnalytics('FIRST_LEVEL', 'story', []).start();
    expect(capture.mock.calls[0][1].attempt_id).not.toBe(
      capture.mock.calls[1][1].attempt_id
    );
  });
});
