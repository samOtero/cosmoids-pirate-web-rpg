import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@/__tests__/utils/test-utils';
import PartyScreen from '@/app/components/PartyScreen';
import { STARTER_CRAB } from '@/constants/creatures';
import { createWildCreature } from '@/utils/resolvePlayerCreature';

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
    const mockCreatures = [createWildCreature(STARTER_CRAB.id, 5)];

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

  it('should render the tutorial overlay when showTutorial is true and dismiss it when Close is clicked', () => {
    render(
      <PartyScreen
        creatures={[]}
        storageCreatures={[]}
        onBack={mockOnBack}
        onReorder={mockOnReorder}
        showTutorial={true}
      />
    );

    // Verify tutorial elements are in the document
    const titleText = screen.getByText(
      /Selecting your team is easy as 1, 2, 3/i
    );
    expect(titleText).toBeInTheDocument();

    const step1Text = screen.getByText(/Step 1:/i);
    expect(step1Text).toBeInTheDocument();

    const step2Text = screen.getByText(/Step 2:/i);
    expect(step2Text).toBeInTheDocument();

    const lanceImage = screen.getByAltText(/Lance/i);
    expect(lanceImage).toBeInTheDocument();

    // Verify Close button trigger
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(
      screen.queryByText(/Selecting your team is easy as 1, 2, 3/i)
    ).not.toBeInTheDocument();
  });

  it('should NOT render the tutorial overlay when showTutorial is false', () => {
    render(
      <PartyScreen
        creatures={[]}
        storageCreatures={[]}
        onBack={mockOnBack}
        onReorder={mockOnReorder}
        showTutorial={false}
      />
    );

    const titleText = screen.queryByText(
      /Selecting your team is easy as 1, 2, 3/i
    );
    expect(titleText).not.toBeInTheDocument();
  });
});
