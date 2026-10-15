import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TowerDefenseScreen from '@/app/components/tower-defense/TowerDefenseScreen';
import type { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { TDLevelData } from '@/engine/tower-defense/types';
import { battleSpecies } from '../engine/behaviorFixtures';

const harness = vi.hoisted(() => ({
  engine: null as TowerDefenseEngine | null,
  drop: null as ((id: string, x: number, y: number) => void) | null,
}));

vi.mock('@/app/components/tower-defense/PixiBattlefield', () => ({
  default: (props: {
    engine: TowerDefenseEngine;
    onMapDrop: typeof harness.drop;
  }) => {
    harness.engine = props.engine;
    harness.drop = props.onMapDrop;
    return <div data-testid="battlefield" />;
  },
}));

afterEach(() => {
  harness.engine?.destroy();
  harness.engine = null;
  harness.drop = null;
});

describe('flag runner roster availability', () => {
  it('locks the tower button during a committed run and recovery, then enables it again', () => {
    battleSpecies('test_ui_runner');
    const levelData: TDLevelData = {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [{ x: 5, y: 40 }],
      waveEnemyDefinitions: [],
      waves: [],
      disableCapture: true,
      premadeRoster: [
        {
          id: 'runner',
          speciesId: 'test_ui_runner',
          level: 5,
          xp: 0,
          equippedAttacks: ['TACKLE'],
          activeAttackIndex: 0,
          gender: 'female' as const,
          isShiny: false,
        },
      ],
      flagDuel: {
        rivalFlagLives: 3,
        playerLaunch: {
          position: { x: 0, y: 50 },
          speed: 10,
          recoveryDurationMs: 500,
        },
        alliedRunner: {
          creatureId: 'test_ui_runner',
          level: 1,
          pathIndex: 0,
          speed: 10,
          spawnIntervalMs: 1000,
          firstSpawnDelayMs: 10000,
          strikeDurationMs: 100,
        },
        defenders: [],
      },
    };
    const view = <TowerDefenseScreen levelData={levelData} onClose={vi.fn()} />;
    const { rerender } = render(view);
    const button = screen.getByRole('button', {
      name: /Behavior test creature/i,
    });
    expect(button).toBeEnabled();
    act(() => harness.drop!('runner', 0, 50));
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Running');
    expect(harness.engine!.towers).toHaveLength(0);
    expect(harness.engine!.placeTower('runner', 5, 40)).toBe(false);

    act(() => {
      harness.engine!.alliedFlagRunners[0].hp = 0;
      harness.engine!.tick(0, 50);
    });
    rerender(<TowerDefenseScreen levelData={levelData} onClose={vi.fn()} />);
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Recovering 1s');
    act(() => harness.engine!.tick(0, 500));
    rerender(<TowerDefenseScreen levelData={levelData} onClose={vi.fn()} />);
    expect(button).toBeEnabled();
    expect(button).not.toHaveTextContent('Recovering');
    act(() => harness.drop!('runner', 5, 40));
    expect(harness.engine!.towers).toHaveLength(1);
    expect(harness.engine!.towers[0].hp).toBe(harness.engine!.towers[0].maxHp);
  });
});
