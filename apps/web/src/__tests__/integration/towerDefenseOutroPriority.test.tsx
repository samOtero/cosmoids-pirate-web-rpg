import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TowerDefenseScreen from '@/app/components/tower-defense/TowerDefenseScreen';

const engineHarness = vi.hoisted(() => ({
  instance: null as null | { events: { emit: (event: unknown) => void } },
  outcome: 'win' as 'win' | 'lose' | 'destruction-objective',
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
      return ['TACKLE'];
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
    private didFinish = false;

    constructor() {
      engineHarness.instance = this;
    }

    tick() {
      if (this.didFinish) return;
      this.didFinish = true;
      this.events.emit({
        type: 'TOWER_LEARNED_ATTACK',
        towerId: 'tower-1',
        attackDefId: 'TACKLE',
      });
      if (engineHarness.outcome === 'lose') {
        this.lives = 0;
      } else if (engineHarness.outcome === 'destruction-objective') {
        this.hasDestroyedVictoryStructure = true;
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

    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
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
    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.getByText('You Win!')).toBeInTheDocument();
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

    expect(screen.getByRole('heading', { level: 2, name: 'Protect the girl!' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Protect the girl!' })).not.toHaveClass('hidden');

    const messageOverlay = screen.getAllByText('Protect the girl!')[0];
    expect(messageOverlay).not.toHaveClass('animate-bounce');

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('Ready!')).not.toHaveClass('animate-bounce');

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('GO!')).not.toHaveClass('animate-bounce');
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

    const heading = screen.getByRole('heading', { level: 2, name: 'Tower Defense' });
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

    const heading = screen.getByRole('heading', { level: 2, name: 'Protect the girl!' });
    expect(heading).toBeInTheDocument();
    expect(heading).not.toHaveClass('hidden');
    expect(screen.queryByRole('heading', { level: 2, name: 'Tower Defense' })).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.getByText('Defeat!')).not.toHaveClass(
      'animate-bounce',
      'animate-pulse'
    );

    act(() => vi.advanceTimersByTime(3000));
    expect(onLose).toHaveBeenCalledOnce();
  });
});
