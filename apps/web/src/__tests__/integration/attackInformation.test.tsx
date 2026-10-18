import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CreatureDetailsScreen from '@/app/components/CreatureDetailsScreen';
import { ActiveAttackMenu } from '@/app/components/tower-defense/ActiveAttackMenu';
import { LearnedAttackDialog } from '@/app/components/attacks/LearnedAttackDialog';
import { makePlayerCreature, testDefinitionId } from '../utils/dataBuilders';
import {
  makeAttack,
  makeBattle,
  registerAttack,
} from '../engine/attacks/helpers';
import { species } from '../engine/behaviorFixtures';
import { resolvePlayerCreature } from '@/utils/resolvePlayerCreature';

const moves = [
  'First move',
  'Second move',
  'Third move',
  'Fourth move',
  'New move',
].map((name) =>
  makeAttack({
    id: testDefinitionId(name),
    name,
    description: `${name} controlled description.`,
  })
);
const speciesId = testDefinitionId('information-species');
beforeEach(() => {
  moves.forEach(registerAttack);
  species(speciesId, {
    learnableAttacks: moves.map((move) => ({ level: 1, attackId: move.id })),
  });
});
const creature = () =>
  makePlayerCreature({
    id: 'information-instance',
    speciesId,
    level: 5,
    equippedAttacks: moves.slice(0, 4).map((move) => move.id),
  });

describe('attack information decisions', () => {
  it('activates a known profile move on selection without saving again on reselection', () => {
    const update = vi.fn();
    render(
      <CreatureDetailsScreen
        creature={resolvePlayerCreature(creature())}
        activeAttackIndex={0}
        onBack={vi.fn()}
        onUpdateAttacks={update}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select Second move' }));
    expect(
      screen.getByRole('region', { name: 'Second move details' })
    ).toHaveTextContent('Second move controlled description.');
    expect(update).toHaveBeenCalledWith(creature().equippedAttacks, 1);
    expect(
      screen.getByRole('region', { name: 'Second move details' })
    ).toHaveTextContent('Active');
    expect(
      screen.queryByRole('button', { name: 'Make Active' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select Second move' }));
    expect(update).toHaveBeenCalledOnce();
  });
  it('requires comparison and confirmation before replacing a known move', () => {
    const update = vi.fn();
    render(
      <CreatureDetailsScreen
        creature={resolvePlayerCreature(creature())}
        activeAttackIndex={2}
        onBack={vi.fn()}
        onUpdateAttacks={update}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Inspect forgotten move New move' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Relearn New move' }));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('button', { name: 'Select a move to replace' })
    ).toBeDisabled();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Compare with Third move' })
    );
    expect(update).not.toHaveBeenCalled();
    expect(dialog).toHaveTextContent('New move will become active');
    expect(dialog).toHaveTextContent('You can relearn Third move');
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Replace Third move with New move',
      })
    );
    expect(update).toHaveBeenCalledWith(
      [moves[0].id, moves[1].id, moves[4].id, moves[3].id],
      2
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('lets keyboard users cancel replacement without changing the loadout', () => {
    const update = vi.fn();
    render(
      <CreatureDetailsScreen
        creature={resolvePlayerCreature(creature())}
        activeAttackIndex={0}
        onBack={vi.fn()}
        onUpdateAttacks={update}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Inspect forgotten move New move' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Relearn New move' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(update).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('activates a battle move on selection while preserving its cooldown', () => {
    const support = registerAttack(
      makeAttack({
        ...moves[1],
        power: 0,
        behaviorType: 'SUPPORT_AURA',
        supportBuff: {
          global: true,
          durationMs: 3500,
          attackSpeedMultiplier: 1.15,
        },
      })
    );
    const { source } = makeBattle(moves[0]);
    source.equippedAttacksRuntime = [
      { definitionId: moves[0].id, lastFiredTime: 0 },
      { definitionId: support.id, lastFiredTime: 0, readyAtMs: 5000 },
    ];
    const select = vi.fn();
    const props = {
      creature: creature(),
      name: 'Test creature',
      spriteUrl: '',
      isActive: true,
      displayLevel: 5,
      displayXp: 0,
      equippedAttacks: [moves[0].id, support.id],
      onSelectAttack: select,
      onClose: vi.fn(),
      tower: source,
      elapsedTimeMs: 1000,
      frameTimeMs: 2000,
    };
    const { rerender } = render(
      <ActiveAttackMenu {...props} activeAttackIndex={0} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select Second move' }));
    expect(select).toHaveBeenCalledWith(1);
    rerender(<ActiveAttackMenu {...props} activeAttackIndex={1} />);
    expect(
      screen.getByRole('region', { name: 'Second move details' })
    ).toHaveTextContent('Ready in 4s');
    expect(screen.queryByText('Power')).not.toBeInTheDocument();
    expect(source.equippedAttacksRuntime[1].readyAtMs).toBe(5000);
    expect(
      screen.queryByRole('button', { name: 'Make Active' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select Second move' }));
    fireEvent.click(screen.getByLabelText('More about Second move'));
    expect(select).toHaveBeenCalledOnce();
  });
  it('shows learned move information immediately and keeps activation optional', () => {
    const activate = vi.fn(),
      close = vi.fn();
    render(
      <LearnedAttackDialog
        creatureName="Test creature"
        attack={{ ...moves[4], category: 'physical' }}
        isActive={false}
        canActivate
        onActivate={activate}
        onClose={close}
      />
    );
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Test creature learned New move!'
    );
    expect(screen.getAllByRole('region', { name: / details$/ })).toHaveLength(
      1
    );
    const details = screen.getByRole('region', { name: 'New move details' });
    expect(details).toHaveTextContent(moves[4].description!);
    expect(details).toHaveTextContent('Physical');
    expect(details).toHaveTextContent(moves[4].type);
    for (const label of ['Power', 'Range', 'Cooldown'])
      expect(within(details).getByText(label)).toBeVisible();
    expect(activate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(close).toHaveBeenCalledOnce();
    expect(activate).not.toHaveBeenCalled();
  });
  it('explains target priority, applies it immediately, and leaves the active move alone', () => {
    const selectMove = vi.fn();
    const selectTarget = vi.fn();
    const close = vi.fn();
    const props = {
      creature: creature(),
      name: 'Test creature',
      spriteUrl: '',
      isActive: true,
      displayLevel: 5,
      displayXp: 0,
      equippedAttacks: creature().equippedAttacks!,
      activeAttackIndex: 1,
      onSelectAttack: selectMove,
      onSelectTargetingMode: selectTarget,
      onClose: close,
    };
    const { rerender } = render(<ActiveAttackMenu {...props} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Target priority: First' })
    );
    const choices = screen.getByRole('group', {
      name: 'Target priority options',
    });
    expect(
      within(choices).getByRole('button', { name: 'First' })
    ).toHaveFocus();
    expect(
      within(choices).getByRole('button', { name: 'First' })
    ).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(
      within(choices).getByRole('button', {
        name: 'Most HP',
      })
    );
    expect(selectTarget).toHaveBeenCalledExactlyOnceWith('strongest');
    expect(selectMove).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    rerender(<ActiveAttackMenu {...props} activeTargetingMode="strongest" />);
    const trigger = screen.getByRole('button', {
      name: 'Target priority: Most HP',
    });
    expect(trigger).toHaveAccessibleDescription(
      'Highest remaining HP · within range'
    );
    expect(trigger).toHaveFocus();
    expect(
      screen.getByRole('button', { name: 'Select Second move' })
    ).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Most HP' }));
    expect(selectTarget).toHaveBeenCalledOnce();
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(
      screen.queryByRole('group', { name: 'Target priority options' })
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(close).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(close).toHaveBeenCalledOnce();
  });
});
