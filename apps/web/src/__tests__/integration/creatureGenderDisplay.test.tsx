import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { createWildCreature } from '@/utils/resolvePlayerCreature';
import PartyScreen from '@/app/components/PartyScreen';
import CreatureDetailsScreen from '@/app/components/CreatureDetailsScreen';

const speciesId = Object.values(COSMOID_TEMPLATES).find(
  (t) => t.genderRatio !== 'genderless'
)!.id;

describe('creature gender display', () => {
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
