import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { getAttackSpeedMultiplier } from '@/engine/tower-defense/attackSpeedModifiers';

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

beforeEach(() => {
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1)
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

describe('Rally Howl lab preview', () => {
  it('uses real attack swaps without recreating the engine or resetting the buff/cooldown', () => {
    render(<TDAttackPreview onClose={() => undefined} />);
    fireEvent.change(screen.getByLabelText('Tower creature'), {
      target: { value: 'sonarion' },
    });
    const engine = preview.engine!;
    fireEvent.change(screen.getByLabelText('Active attack'), {
      target: { value: 'RALLY_HOWL' },
    });
    expect(preview.engine).toBe(engine);
    engine.tick(1, 1);
    const tower = engine.towers[0];
    const buff = tower.attackSpeedBuff;
    const howlRuntime = tower.equippedAttacksRuntime.find(
      (move) => move.definitionId === 'RALLY_HOWL'
    )!;
    expect(buff?.multiplier).toBe(1.2);
    expect(howlRuntime.readyAtMs).toBe(20001);
    fireEvent.change(screen.getByLabelText('Active attack'), {
      target: { value: 'STATIC_YIP' },
    });
    expect(preview.engine).toBe(engine);
    expect(tower.attackSpeedBuff).toBe(buff);
    expect(
      tower.equippedAttacksRuntime[tower.selectedAttackIndex].definitionId
    ).toBe('STATIC_YIP');
    fireEvent.change(screen.getByLabelText('Active attack'), {
      target: { value: 'RALLY_HOWL' },
    });
    engine.tick(17, 16);
    expect(howlRuntime.readyAtMs).toBe(20001);
    expect(tower.attackSpeedBuff).toBe(buff);
  });

  it('lets the preview include a nearby ally without adding it to the player’s roster', () => {
    render(<TDAttackPreview onClose={() => undefined} />);
    fireEvent.click(screen.getByLabelText('Show nearby ally'));
    fireEvent.change(screen.getByLabelText('Active attack'), {
      target: { value: 'RALLY_HOWL' },
    });
    const engine = preview.engine!;
    expect(engine.towers).toHaveLength(2);
    engine.tick(1, 1);
    expect(
      engine.towers.map((tower) => getAttackSpeedMultiplier(tower, 1))
    ).toEqual([1.2, 1.2]);
  });
});
