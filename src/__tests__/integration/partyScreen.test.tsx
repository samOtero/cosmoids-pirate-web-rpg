import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/__tests__/utils/test-utils';
import PartyScreen from '@/app/components/PartyScreen';
import { STARTER_CRAB } from '@/constants/creatures';

describe('PartyScreen Empty Party Rules', () => {
  const mockOnBack = vi.fn();
  const mockOnReorder = vi.fn();
  const mockOnContinue = vi.fn();

  it('should disable start button and display warning banner when active party has no creatures', () => {
    render(
      <PartyScreen
        creatures={[]}
        storageCreatures={[]}
        onBack={mockOnBack}
        onReorder={mockOnReorder}
        onContinue={mockOnContinue}
      />
    );

    // The Warning Banner should be visible
    const warningBanner = screen.getByText(/Active party is empty/i);
    expect(warningBanner).toBeInTheDocument();

    // The Start Button should be disabled
    const startButton = screen.getByRole('button', { name: /start/i });
    expect(startButton).toBeInTheDocument();
    expect(startButton).toBeDisabled();
  });

  it('should enable start button and hide warning banner when active party has at least one creature', () => {
    // A mock active creature
    const mockCreatures = [
      {
        ...STARTER_CRAB,
        level: 5,
        xp: 100,
        currentHp: STARTER_CRAB.maxHp,
      },
    ];

    render(
      <PartyScreen
        creatures={mockCreatures}
        storageCreatures={[]}
        onBack={mockOnBack}
        onReorder={mockOnReorder}
        onContinue={mockOnContinue}
      />
    );

    // The Warning Banner should NOT be visible
    const warningBanner = screen.queryByText(/Active party is empty/i);
    expect(warningBanner).not.toBeInTheDocument();

    // The Start Button should be enabled
    const startButton = screen.getByRole('button', { name: /start/i });
    expect(startButton).toBeInTheDocument();
    expect(startButton).not.toBeDisabled();
  });

  it('should NOT show warning banner when start button is NOT showing even if active party has no creatures', () => {
    render(
      <PartyScreen
        creatures={[]}
        storageCreatures={[]}
        onBack={mockOnBack}
        onReorder={mockOnReorder}
      />
    );

    // The Warning Banner should NOT be visible
    const warningBanner = screen.queryByText(/Active party is empty/i);
    expect(warningBanner).not.toBeInTheDocument();

    // The Start Button should NOT be in the document
    const startButton = screen.queryByRole('button', { name: /start/i });
    expect(startButton).not.toBeInTheDocument();
  });
});
