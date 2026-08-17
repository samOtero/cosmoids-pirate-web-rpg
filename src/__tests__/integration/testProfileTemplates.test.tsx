import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileScreen from '@/app/components/profileScreen';
import {
  createTestProfileFromTemplate,
  TEST_PROFILE_TEMPLATE_OPTIONS,
} from '@/constants/testProfileTemplates';
import { useGameStore } from '@/store/gameStore';
import { GameFlag, StoryProgression } from '@/types/baseGame';
import { render, resetStore } from '@/__tests__/utils/test-utils';
import {
  isLocalHostname,
  shouldEnableTestProfileOverride,
} from '@/utils/testProfileAccess';

describe('test profile templates', () => {
  beforeEach(() => {
    resetStore();
  });

  it('provides every Level 1-3 and starter combination', () => {
    expect(TEST_PROFILE_TEMPLATE_OPTIONS).toHaveLength(9);

    expect(
      TEST_PROFILE_TEMPLATE_OPTIONS.map((template) => [
        template.level,
        template.starterSpeciesId,
      ])
    ).toEqual([
      [1, 'starter_crab'],
      [1, 'starter_iguana'],
      [1, 'starter_monkey'],
      [2, 'starter_crab'],
      [2, 'starter_iguana'],
      [2, 'starter_monkey'],
      [3, 'starter_crab'],
      [3, 'starter_iguana'],
      [3, 'starter_monkey'],
    ]);
  });

  it('builds a Level 3 party with the starter and prior-level catches', () => {
    const profile = createTestProfileFromTemplate(
      'level-3-starter_monkey',
      12345
    );

    expect(profile).toMatchObject({
      id: 2,
      name: 'Test L3 · Monkeg',
      lastPlayed: 12345,
      storyProgression: StoryProgression.DEFEAT_BUG_STAGE_1,
      gameFlags: [GameFlag.STARTER_MONKEG],
    });
    expect(profile.creatures).toEqual([
      expect.objectContaining({
        speciesId: 'starter_monkey',
        level: 10,
        equippedAttacks: ['TACKLE', 'BARREL_BASH'],
      }),
      expect.objectContaining({
        speciesId: 'mouse_1',
        level: 3,
        equippedAttacks: ['NIBBLE'],
      }),
      expect.objectContaining({
        speciesId: 'harlequill',
        level: 5,
        equippedAttacks: ['PECK', 'WIND_GUST'],
      }),
    ]);
  });

  it('adds only catches from levels before the selected level', () => {
    const level1Profile = createTestProfileFromTemplate('level-1-starter_crab');
    const level2Profile = createTestProfileFromTemplate('level-2-starter_crab');

    expect(
      level1Profile.creatures.map((creature) => creature.speciesId)
    ).toEqual(['starter_crab']);
    expect(
      level2Profile.creatures.map((creature) => creature.speciesId)
    ).toEqual(['starter_crab', 'mouse_1']);
  });

  it('replaces only profile 3 through the store action', () => {
    const { createProfile, applyTestProfileTemplate } = useGameStore.getState();
    createProfile(0);
    const firstProfile = useGameStore.getState().profiles[0];

    applyTestProfileTemplate('level-2-starter_iguana');

    const state = useGameStore.getState();
    expect(state.profiles[0]).toEqual(firstProfile);
    expect(state.profiles[1]).toBeNull();
    expect(state.profiles[2]).toMatchObject({
      id: 2,
      storyProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
      gameFlags: [GameFlag.STARTER_FUEGUANA],
      creatures: [
        expect.objectContaining({
          speciesId: 'starter_iguana',
          level: 7,
          equippedAttacks: ['SCRATCH'],
        }),
        expect.objectContaining({
          speciesId: 'mouse_1',
          level: 3,
          equippedAttacks: ['NIBBLE'],
        }),
      ],
    });
  });

  it('shows the template dialog only when the guarded props are supplied', async () => {
    const user = userEvent.setup();
    const onApplyTestTemplate = vi.fn();
    const commonProps = {
      profiles: [null, null, null],
      onSelect: vi.fn(),
      onCreate: vi.fn(),
      onDelete: vi.fn(),
    };
    const { rerender } = render(<ProfileScreen {...commonProps} />);

    expect(
      screen.queryByRole('button', { name: /profile 3 templates/i })
    ).not.toBeInTheDocument();

    rerender(
      <ProfileScreen
        {...commonProps}
        testProfileTemplates={TEST_PROFILE_TEMPLATE_OPTIONS}
        onApplyTestTemplate={onApplyTestTemplate}
      />
    );
    await user.click(
      screen.getByRole('button', { name: /profile 3 templates/i })
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: /template/i }),
      'level-3-starter_crab'
    );
    await user.click(
      screen.getByRole('button', { name: /replace profile 3/i })
    );

    expect(onApplyTestTemplate).toHaveBeenCalledWith('level-3-starter_crab');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('enables the tool only for development, experimental, or localhost', () => {
    expect(
      shouldEnableTestProfileOverride({
        nodeEnv: 'production',
        buildBranch: 'main',
        hostname: 'cosmoids.example.com',
      })
    ).toBe(false);
    expect(
      shouldEnableTestProfileOverride({
        nodeEnv: 'production',
        buildBranch: 'experimental',
        hostname: 'cosmoids.example.com',
      })
    ).toBe(true);
    expect(
      shouldEnableTestProfileOverride({
        nodeEnv: 'development',
        buildBranch: 'main',
        hostname: '192.168.1.10',
      })
    ).toBe(true);
    expect(isLocalHostname('127.0.0.1')).toBe(true);
    expect(isLocalHostname('cosmoids.example.com')).toBe(false);
  });
});
