import { fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RogueliteScreen from '@/app/components/roguelite/RogueliteScreen';
import {
  RUN_ATTACK_DEFS,
  drawStartingMoves,
} from '@/engine/roguelite/attacks/definitions';
import type { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { RUN_PARTNERS } from '@/constants/roguelite';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { SpeciesId } from '@/types/definitionIds';

const harness = vi.hoisted(() => ({
  engine: null as TowerDefenseEngine | null,
}));
vi.mock('@/app/components/tower-defense/PixiBattlefield', () => ({
  default: ({ engine }: { engine: TowerDefenseEngine }) => {
    harness.engine = engine;
    return <div data-testid="battlefield" />;
  },
}));
vi.mock('@/engine/roguelite/attacks/definitions', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/engine/roguelite/attacks/definitions')
    >();
  return {
    ...actual,
    drawStartingMoves: vi.fn(() =>
      Object.values(actual.RUN_ATTACK_DEFS)
        .slice(0, 2)
        .map((move) => move.id)
    ),
  };
});
afterEach(() => {
  harness.engine?.destroy();
  harness.engine = null;
  vi.clearAllMocks();
});

describe('Fueguana starting move choice', () => {
  it('offers two moves after choosing Fueguana and starts with only the selected move', () => {
    render(
      <StrictMode>
        <RogueliteScreen onBack={vi.fn()} />
      </StrictMode>
    );
    fireEvent.click(screen.getByRole('button', { name: /Choose Fueguana →/ }));
    expect(
      screen.getByRole('heading', { name: "Choose Fueguana's first move" })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/^Start with /)).toHaveLength(2);
    expect(harness.engine).toBeNull();
    expect(drawStartingMoves).toHaveBeenCalledOnce();
    const choice = Object.values(RUN_ATTACK_DEFS)[1];
    fireEvent.click(screen.getByText(`Start with ${choice.name} →`));
    expect(screen.getByText('Ready!')).toBeInTheDocument();
    expect(harness.engine?.roster[0].equippedAttacks).toEqual([choice.id]);
    expect(harness.engine?.roster[0].speciesId).toBe(SpeciesId.FUEGUANA);
    expect(
      screen.queryByRole('heading', { name: "Choose Fueguana's first move" })
    ).not.toBeInTheDocument();
  });

  it('keeps an offer stable across rerenders and lets the player return to starters', () => {
    const back = vi.fn();
    const { rerender } = render(<RogueliteScreen onBack={back} />);
    fireEvent.click(screen.getByRole('button', { name: /Choose Fueguana →/ }));
    const offers = screen
      .getAllByText(/^Start with /)
      .map((element) => element.textContent);
    rerender(<RogueliteScreen onBack={back} />);
    expect(
      screen.getAllByText(/^Start with /).map((element) => element.textContent)
    ).toEqual(offers);
    expect(drawStartingMoves).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /back to starters/i }));
    expect(
      screen.getByRole('heading', { name: 'Choose your starter' })
    ).toBeInTheDocument();
    expect(back).not.toHaveBeenCalled();
    expect(harness.engine).toBeNull();
  });

  it('keeps the other starter flows unchanged', () => {
    const partner = RUN_PARTNERS.find(
      (entry) => entry.starter && entry.speciesId !== SpeciesId.FUEGUANA
    )!;
    render(<RogueliteScreen onBack={vi.fn()} />);
    fireEvent.click(
      screen.getByText(`Choose ${COSMOID_TEMPLATES[partner.speciesId].name} →`)
    );
    expect(screen.getByText('Ready!')).toBeInTheDocument();
    expect(harness.engine?.roster[0].equippedAttacks).toEqual([
      partner.attackId,
    ]);
    expect(drawStartingMoves).not.toHaveBeenCalled();
  });
});
