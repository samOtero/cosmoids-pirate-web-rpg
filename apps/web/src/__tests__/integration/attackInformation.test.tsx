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
  it('separates profile inspection from changing the active move', () => {
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
      screen.getByRole('button', { name: 'Inspect Second move' })
    );
    expect(
      screen.getByRole('region', { name: 'Second move details' })
    ).toHaveTextContent('Second move controlled description.');
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Make Active' }));
    expect(update).toHaveBeenCalledWith(creature().equippedAttacks, 1);
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
  it('inspects live cooldowns without selecting or consuming a move', () => {
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
    render(
      <ActiveAttackMenu
        creature={creature()}
        name="Test creature"
        spriteUrl=""
        isActive
        displayLevel={5}
        displayXp={0}
        equippedAttacks={[moves[0].id, support.id]}
        activeAttackIndex={0}
        onSelectAttack={select}
        onClose={vi.fn()}
        tower={source}
        elapsedTimeMs={1000}
        frameTimeMs={2000}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Inspect Second move' })
    );
    expect(
      screen.getByRole('region', { name: 'Second move details' })
    ).toHaveTextContent('Ready in 4s');
    expect(screen.queryByText('Power')).not.toBeInTheDocument();
    expect(select).not.toHaveBeenCalled();
    expect(source.equippedAttacksRuntime[1].readyAtMs).toBe(5000);
    fireEvent.click(screen.getByRole('button', { name: 'Make Active' }));
    expect(select).toHaveBeenCalledWith(1);
  });
  it('makes learning distinct from activation and offers an optional active-move comparison', () => {
    const activate = vi.fn(),
      close = vi.fn();
    render(
      <LearnedAttackDialog
        creatureName="Test creature"
        attack={moves[4]}
        current={moves[0]}
        isActive={false}
        canActivate
        onActivate={activate}
        onClose={close}
      />
    );
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Test creature learned New move.'
    );
    expect(screen.getAllByRole('region', { name: / details$/ })).toHaveLength(
      1
    );
    const more = screen.getByLabelText('More about New move');
    expect(more.closest('details')).not.toHaveAttribute('open');
    fireEvent.click(more);
    expect(more.closest('details')).toHaveAttribute('open');
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Compare with current active move: First move',
      })
    );
    expect(screen.getAllByRole('region', { name: / details$/ })).toHaveLength(
      1
    );
    expect(
      screen.getByRole('region', { name: 'First move details' })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('More about First move').closest('details')
    ).not.toHaveAttribute('open');
    expect(activate).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Keep Current Active' })
    );
    expect(close).toHaveBeenCalledOnce();
    expect(activate).not.toHaveBeenCalled();
  });
});
