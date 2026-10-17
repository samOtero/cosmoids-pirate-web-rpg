import { AttackId } from '@/types/definitionIds';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

const preview = vi.hoisted(() => ({
  engine: null as TowerDefenseEngine | null,
}));

vi.mock('@/app/components/tower-defense/PixiBattlefield', () => ({
  default: ({ engine }: { engine: TowerDefenseEngine }) => {
    preview.engine = engine;
    return null;
  },
}));

import TDAttackPreview from '@/components/dev/TDAttackPreview';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';

beforeEach(() => {
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1)
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => vi.unstubAllGlobals());

describe('Attack & Ability Lab AOE targets', () => {
  it('spawns every additional enemy inside the standard AOE radius', () => {
    render(<TDAttackPreview onClose={() => undefined} />);
    const spawnButton = screen.getByRole('button', { name: '+ Spawn' });

    for (let index = 0; index < 9; index += 1) {
      fireEvent.click(spawnButton);
    }

    const engine = preview.engine!;
    const tower = engine.towers[0];
    const additionalEnemies = engine.enemies.filter((enemy) =>
      enemy.id.startsWith('attack-preview-extra-')
    );

    expect(additionalEnemies).toHaveLength(9);
    expect(
      additionalEnemies.every((enemy) =>
        engine.isPositionInAttackRange(
          tower.position,
          enemy.position,
          ATTACK_DEFS[AttackId.TOXIC_POLLEN].rangeIndex
        )
      )
    ).toBe(true);
  });
});
