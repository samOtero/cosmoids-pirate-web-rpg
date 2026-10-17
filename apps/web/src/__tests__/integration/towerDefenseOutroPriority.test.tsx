import { testDefinitionId } from '@/__tests__/utils/dataBuilders';
import { AttackId } from '@/types/definitionIds';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TowerDefenseScreen from '@/app/components/tower-defense/TowerDefenseScreen';

const engineHarness = vi.hoisted(() => ({
  instance: null as null | {
    events: { emit: (event: unknown) => void };
    enemies: unknown[];
    hasCapturedRivalFlag: boolean;
    rivalFlagLives: number;
  },
  outcome: 'win' as 'win' | 'lose' | 'destruction-objective' | 'boss-objective',
}));

vi.mock('@/app/components/tower-defense/PixiBattlefield', () => ({
  default: () => <div data-testid="battlefield" />,
}));

vi.mock('@/engine/tower-defense/TowerDefenseEngine', () => {
  class MockEventBus {
    private listeners = new Set<(event: any) => void>();

    subscribe(listener: (event: any) => void) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }

    emit(event: unknown) {
      this.listeners.forEach((listener) => listener(event));
    }
  }

  class MockTowerDefenseEngine {
    static getDefaultAttacks() {
      return [AttackId.TACKLE];
    }

    static getEquippedAttacks() {
      return [];
    }

    events = new MockEventBus();
    lives = 3;
    elapsedTimeMs = 0;
    surviveUntil = undefined;
    hasFinishedAllWaves = false;
    hasDestroyedVictoryStructure = false;
    enemies: unknown[] = [{}];
    roster: unknown[] = [];
    towers: unknown[] = [];
    playerSelectedAttacks = {};
    playerSelectedTargetingModes = {};
    disableCapture = true;
    cannotLose = false;
    flagDuel?: object;
    rivalFlagLives = 3;
    hasCapturedRivalFlag = false;
    private didFinish = false;

    constructor(levelData: { flagDuel?: object } = {}) {
      this.flagDuel = levelData.flagDuel;
      engineHarness.instance = this;
    }

    tick() {
      if (this.didFinish) return;
      this.didFinish = true;
      this.events.emit({
        type: 'TOWER_LEARNED_ATTACK',
        towerId: 'tower-1',
        attackDefId: AttackId.TACKLE,
      });
      if (engineHarness.outcome === 'lose') {
        this.lives = 0;
      } else if (engineHarness.outcome === 'destruction-objective') {
        this.hasDestroyedVictoryStructure = true;
      } else if (engineHarness.outcome === 'boss-objective') {
        this.hasFinishedAllWaves = true;
      } else {
        this.enemies = [];
        this.hasFinishedAllWaves = true;
      }
    }
  }

  return {
    TowerDefenseEngine: MockTowerDefenseEngine,
    TD_CREATURE_DEFS: {},
  };
});

describe('tower-defense outro priority', () => {
  let scheduledFrame: FrameRequestCallback | null;

  beforeEach(() => {
    vi.useFakeTimers();
    scheduledFrame = null;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        scheduledFrame = callback;
        return 1;
      })
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    engineHarness.outcome = 'win';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    engineHarness.instance = null;
  });

  it('waits for a final-enemy progression modal before showing and completing the win outro', () => {
    const onWin = vi.fn();

    render(
      <TowerDefenseScreen
        levelData={{ paths: [], placementSpots: [] } as any}
        onClose={vi.fn()}
        onWin={onWin}
      />
    );

    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));

    act(() => scheduledFrame?.(16));
    act(() => scheduledFrame?.(32));

    expect(screen.getByText('New Attack Learned!')).toBeInTheDocument();
    expect(screen.queryByText('You Win!')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3000));
    expect(onWin).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Keep Current Active' })
    );
    expect(screen.getByText('You Win!')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2999));
    expect(onWin).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onWin).toHaveBeenCalledOnce();
  });

  it('wins from a destroyed victory structure while other enemies remain', () => {
    engineHarness.outcome = 'destruction-objective';

    render(
      <TowerDefenseScreen
        levelData={{ paths: [], placementSpots: [] } as any}
        onClose={vi.fn()}
      />
    );

    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));
    act(() => scheduledFrame?.(16));
    act(() => scheduledFrame?.(32));

    expect(engineHarness.instance).toMatchObject({
      hasDestroyedVictoryStructure: true,
      hasFinishedAllWaves: false,
      enemies: [{}],
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Keep Current Active' })
    );
    expect(screen.getByText('You Win!')).toBeInTheDocument();
  });

  it('waits for the rival flag instead of ending a duel when incoming waves clear', () => {
    const onWin = vi.fn();
    render(
      <TowerDefenseScreen
        levelData={{
          paths: [],
          placementSpots: [],
          waveEnemyDefinitions: [],
          waves: [],
          flagDuel: {
            rivalFlagLives: 3,
            defenders: [],
            alliedRunner: {
              creatureId: testDefinitionId('controlled_runner'),
              level: 1,
              pathIndex: 0,
              speed: 1,
              spawnIntervalMs: 1000,
              firstSpawnDelayMs: 0,
              strikeDurationMs: 100,
            },
          },
        }}
        onClose={vi.fn()}
        onWin={onWin}
      />
    );
    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));
    act(() => scheduledFrame?.(16));
    act(() => scheduledFrame?.(32));
    fireEvent.click(
      screen.getByRole('button', { name: 'Keep Current Active' })
    );
    expect(screen.queryByText('You Win!')).not.toBeInTheDocument();
    expect(screen.getByText('Rival flag: 3')).toBeInTheDocument();
    expect(onWin).not.toHaveBeenCalled();

    engineHarness.instance!.enemies = [{}];
    engineHarness.instance!.rivalFlagLives = 0;
    engineHarness.instance!.hasCapturedRivalFlag = true;
    act(() => scheduledFrame?.(48));
    act(() => scheduledFrame?.(64));
    expect(screen.getByText('Rival flag: 0')).toBeInTheDocument();
    expect(screen.getByText('You Win!')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(onWin).toHaveBeenCalledOnce();
  });

  it('waits for surviving enemies to be cleared after the boss stops spawning', () => {
    engineHarness.outcome = 'boss-objective';
    const onWin = vi.fn();
    render(
      <TowerDefenseScreen
        levelData={{ paths: [], placementSpots: [] } as any}
        onClose={vi.fn()}
        onWin={onWin}
      />
    );
    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));
    act(() => scheduledFrame?.(16));
    act(() => scheduledFrame?.(32));
    expect(engineHarness.instance).toMatchObject({
      hasFinishedAllWaves: true,
      enemies: [{}],
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Keep Current Active' })
    );
    expect(screen.queryByText('You Win!')).not.toBeInTheDocument();
    expect(onWin).not.toHaveBeenCalled();
    engineHarness.instance!.enemies = [];
    act(() => scheduledFrame?.(48));
    act(() => scheduledFrame?.(64));
    expect(screen.getByText('You Win!')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(onWin).toHaveBeenCalledOnce();
  });

  it('shows an optional level message before the static Ready/Go countdown', () => {
    render(
      <TowerDefenseScreen
        levelData={{
          paths: [],
          placementSpots: [],
          waveEnemyDefinitions: [],
          waves: [],
          introMessage: 'Protect the girl!',
        }}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Protect the girl!' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Protect the girl!' })
    ).not.toHaveClass('hidden');

    const messageOverlay = screen.getAllByText('Protect the girl!')[0];
    expect(messageOverlay).not.toHaveClass('animate-bounce');

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('Ready!')).not.toHaveClass('animate-bounce');

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('GO!')).not.toHaveClass('animate-bounce');
  });

  it('treats Close as a win when the level opts into successful closing', () => {
    const onWin = vi.fn();
    const onClose = vi.fn();

    render(
      <TowerDefenseScreen
        levelData={{
          paths: [],
          placementSpots: [],
          waveEnemyDefinitions: [],
          waves: [],
          cannotLose: true,
          closeCompletesLevel: true,
        }}
        onClose={onClose}
        onWin={onWin}
      />
    );

    expect(screen.getByText('No defeat')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Return to boat' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.getByText('You Win!')).toBeInTheDocument();
    expect(screen.queryByText('Setting Sail!')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(3000));
    expect(onWin).toHaveBeenCalledOnce();
  });

  it('shows the finite wave total including repeated runs', () => {
    render(
      <TowerDefenseScreen
        levelData={{
          paths: [],
          placementSpots: [],
          waveEnemyDefinitions: [],
          waves: [{ id: 'wildlife', repeatCount: 3, groups: [] }],
        }}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Wave 1 / 3')).toBeInTheDocument();
  });

  it('renders Tower Defense in header (hidden on mobile) when no introMessage is provided', () => {
    render(
      <TowerDefenseScreen
        levelData={{
          paths: [],
          placementSpots: [],
          waveEnemyDefinitions: [],
          waves: [],
        }}
        onClose={vi.fn()}
      />
    );

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Tower Defense',
    });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('hidden');
    expect(heading).toHaveClass('lg:block');
  });

  it('renders introMessage in header (visible on mobile and desktop) when provided', () => {
    render(
      <TowerDefenseScreen
        levelData={{
          paths: [],
          placementSpots: [],
          waveEnemyDefinitions: [],
          waves: [],
          introMessage: 'Protect the girl!',
        }}
        onClose={vi.fn()}
      />
    );

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Protect the girl!',
    });
    expect(heading).toBeInTheDocument();
    expect(heading).not.toHaveClass('hidden');
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Tower Defense' })
    ).not.toBeInTheDocument();
  });

  it('waits for a progression modal before showing and completing the lose outro', () => {
    const onLose = vi.fn();
    engineHarness.outcome = 'lose';

    render(
      <TowerDefenseScreen
        levelData={{ paths: [], placementSpots: [] } as any}
        onClose={vi.fn()}
        onLose={onLose}
      />
    );

    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));

    act(() => scheduledFrame?.(16));
    act(() => scheduledFrame?.(32));

    expect(screen.getByText('New Attack Learned!')).toBeInTheDocument();
    expect(screen.queryByText('Defeat!')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3000));
    expect(onLose).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Keep Current Active' })
    );
    expect(screen.getByText('Defeat!')).not.toHaveClass(
      'animate-bounce',
      'animate-pulse'
    );

    act(() => vi.advanceTimersByTime(3000));
    expect(onLose).toHaveBeenCalledOnce();
  });
});
