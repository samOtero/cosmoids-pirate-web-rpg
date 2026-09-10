import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import TowerDefenseScreen from '@/app/components/tower-defense/TowerDefenseScreen';
import type { TDLevelData } from '@/engine/tower-defense/types';

const tutorialHarness = vi.hoisted(() => ({
  engine: null as null | { events: { emit: (event: unknown) => void } },
  battlefieldProps: null as null | Record<string, unknown>,
}));

vi.mock('@/app/components/tower-defense/PixiBattlefield', () => ({
  default: (props: Record<string, unknown>) => {
    tutorialHarness.battlefieldProps = props;
    return <div data-testid="battlefield" />;
  },
}));

vi.mock('@/engine/tower-defense/TowerDefenseEngine', () => {
  class MockEventBus {
    private listeners = new Set<(event: unknown) => void>();

    subscribe(listener: (event: unknown) => void) {
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
    lives = 1;
    elapsedTimeMs = 0;
    surviveUntil = undefined;
    hasFinishedAllWaves = false;
    hasDestroyedVictoryStructure = false;
    enemies = [{}];
    roster = [];
    towers = [];
    playerSelectedAttacks = {};
    playerSelectedTargetingModes = {};
    disableCapture = true;

    constructor() {
      tutorialHarness.engine = this;
    }
  }

  return {
    TowerDefenseEngine: MockTowerDefenseEngine,
    TD_CREATURE_DEFS: {},
  };
});

describe('Mari healing tutorial', () => {
  afterEach(() => {
    tutorialHarness.engine = null;
    tutorialHarness.battlefieldProps = null;
  });

  it('pauses on the first meaningful hit, then points the injured tower toward recovery', () => {
    render(
      <TowerDefenseScreen
        levelData={
          {
            paths: [],
            placementSpots: [],
            waveEnemyDefinitions: [],
            waves: [],
            towerRecovery: {
              placementSpotIndices: [],
              healerPosition: { x: 50, y: 90 },
              healFraction: 0.35,
              feedingIntervalMs: 8000,
              tutorial: {
                triggerHealthFraction: 0.75,
                speakerName: 'Mari',
                portraitUrl: '/dialog/maribel_determined.png',
                message: "They're hurt! Bring them here—I packed food!",
                instruction:
                  'Drag the injured Cosmoid onto a glowing recovery spot.',
              },
            },
          } satisfies TDLevelData
        }
        onClose={vi.fn()}
      />
    );

    act(() => {
      tutorialHarness.engine!.events.emit({
        type: 'TOWER_DAMAGED',
        towerId: 'tower-1',
        creatureId: 'patient',
        sourceEnemyId: 'voltusk',
        damage: 25,
        hp: 75,
        maxHp: 100,
      });
    });

    const callout = screen.getByRole('dialog');
    expect(callout).toHaveTextContent(
      "They're hurt! Bring them here—I packed food!"
    );
    expect(callout).toHaveClass('max-w-md', 'p-3', 'lg:max-w-xl', 'lg:p-6');
    expect(callout.parentElement).toHaveClass(
      'items-end',
      'bg-black/30',
      'lg:items-center'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show me' }));

    expect(
      screen.getByText('Drag the injured Cosmoid onto a glowing recovery spot.')
    ).toBeInTheDocument();
    expect(tutorialHarness.battlefieldProps).toMatchObject({
      healingTutorialTowerCreatureId: 'patient',
    });
  });
});
