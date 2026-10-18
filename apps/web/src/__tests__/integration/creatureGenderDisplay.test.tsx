import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { createWildCreature } from '@/utils/resolvePlayerCreature';
import PartyScreen from '@/app/components/PartyScreen';
import CreatureDetailsScreen from '@/app/components/CreatureDetailsScreen';
import { GenderBadge } from '@/app/components/ui/GenderBadge';

const speciesId = Object.values(COSMOID_TEMPLATES).find(
  (t) => t.genderRatio !== 'genderless'
)!.id;

describe('creature gender display', () => {
  it('pairs pink female and blue male symbols with a contrasting badge', () => {
    render(
      <>
        <GenderBadge gender="female" compact />
        <GenderBadge gender="male" compact />
      </>
    );
    expect(screen.getByLabelText('Female')).toHaveClass('text-pink-300');
    expect(screen.getByLabelText('Male')).toHaveClass('text-blue-300');
    for (const label of ['Female', 'Male'])
      expect(screen.getByLabelText(label)).toHaveClass(
        'bg-slate-950/95',
        'ring-1'
      );
  });
  it('labels gender in both party and storage portraits', () => {
    render(
      <PartyScreen
        creatures={[{ ...createWildCreature(speciesId, 3), gender: 'female' }]}
        storageCreatures={[
          { ...createWildCreature(speciesId, 3), gender: 'male' },
        ]}
        onBack={vi.fn()}
        onReorder={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Female')).toHaveTextContent('♀');
    expect(screen.getByLabelText('Male')).toHaveTextContent('♂');
  });

  it('shows the full genderless label in details', () => {
    const genderless = Object.values(COSMOID_TEMPLATES).find(
      (t) => t.genderRatio === 'genderless'
    )!;
    render(
      <CreatureDetailsScreen
        creature={createWildCreature(genderless.id, 3)}
        activeAttackIndex={0}
        onBack={vi.fn()}
        onUpdateAttacks={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Genderless')).toHaveTextContent('Genderless');
  });
});
