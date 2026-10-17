import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import TowerDefenseScreen from '@/app/components/tower-defense/TowerDefenseScreen';
import { battleSpecies } from '../engine/behaviorFixtures';
import { makeAttack, registerAttack } from '../engine/attacks/helpers';
import { makePlayerCreature, testDefinitionId } from '../utils/dataBuilders';

const harness = vi.hoisted(() => ({
  engine: null as TowerDefenseEngine | null,
}));
vi.mock('@/app/components/tower-defense/PixiBattlefield', () => ({
  default: ({ engine }: { engine: TowerDefenseEngine }) => {
    harness.engine = engine;
    return <div data-testid="battlefield" />;
  },
}));

const moves = [
  'Flow first',
  'Flow second',
  'Flow third',
  'Flow fourth',
  'Flow new',
].map((name) => makeAttack({ id: testDefinitionId(name), name }));
const speciesId = testDefinitionId('flow-species');
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1)
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  moves.forEach(registerAttack);
  battleSpecies(speciesId, {
    learnableAttacks: moves.map((move) => ({ level: 1, attackId: move.id })),
  });
});
afterEach(() => {
  harness.engine?.destroy();
  harness.engine = null;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function startBattle(knownCount: number, activeAttackIndex = 0) {
  const creature = makePlayerCreature({
    id: 'flow-instance',
    speciesId,
    level: 5,
    activeAttackIndex,
    equippedAttacks: moves.slice(0, knownCount).map((move) => move.id),
  });
  render(
    <TowerDefenseScreen
      onClose={vi.fn()}
      levelData={{
        paths: [
          [
            { x: 0, y: 50 },
            { x: 100, y: 50 },
          ],
        ],
        placementSpots: [{ x: 30, y: 30 }],
        waveEnemyDefinitions: [],
        waves: [{ id: 'empty', groups: [] }],
        premadeRoster: [creature],
      }}
    />
  );
  act(() => vi.advanceTimersByTime(1000));
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  const engine = harness.engine!;
  act(() => {
    engine.placeTower(creature.id, 30, 30);
  });
  return { engine, tower: engine.towers[0] };
}

describe('learning information in the battle screen', () => {
  it('pauses to explain an automatically learned move and activates it only on request', () => {
    const { engine, tower } = startBattle(2);
    act(() => {
      tower.creature.equippedAttacks.push(moves[4].id);
      tower.equippedAttacksRuntime.push({
        definitionId: moves[4].id,
        lastFiredTime: 0,
      });
      engine.events.emit({
        type: 'TOWER_LEARNED_ATTACK',
        towerId: tower.id,
        attackDefId: moves[4].id,
      });
    });
    const dialog = screen.getByRole('dialog', { name: 'New Attack Learned!' });
    expect(dialog).toHaveTextContent('Flow first stays active');
    expect(tower.selectedAttackIndex).toBe(0);
    expect(
      screen.queryByRole('button', { name: 'Pause' })
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Make Active' })
    );
    expect(tower.selectedAttackIndex).toBe(2);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });
  it('keeps combat paused through confirmed replacement and the learned notification', () => {
    const { engine, tower } = startBattle(4, 2);
    act(() =>
      engine.events.emit({
        type: 'TOWER_ASK_REPLACE_ATTACK',
        towerId: tower.id,
        newAttackDefId: moves[4].id,
      })
    );
    const dialog = screen.getByRole('dialog', {
      name: 'Maximum Attacks Reached!',
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Compare with Flow third' })
    );
    expect(tower.creature.equippedAttacks[2]).toBe(moves[2].id);
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Replace Flow third with Flow new',
      })
    );
    expect(tower.creature.equippedAttacks[2]).toBe(moves[4].id);
    expect(tower.selectedAttackIndex).toBe(2);
    const learned = screen.getByRole('dialog', { name: 'New Attack Learned!' });
    expect(learned).toHaveTextContent('Flow new is already active.');
    expect(
      screen.queryByRole('button', { name: 'Pause' })
    ).not.toBeInTheDocument();
    fireEvent.click(within(learned).getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });
  it('does not unpause an already paused battle after reading attack information', () => {
    const { engine, tower } = startBattle(2);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    act(() =>
      engine.events.emit({
        type: 'TOWER_LEARNED_ATTACK',
        towerId: tower.id,
        attackDefId: moves[1].id,
      })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Keep Current Active' })
    );
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(tower.selectedAttackIndex).toBe(0);
  });
});
