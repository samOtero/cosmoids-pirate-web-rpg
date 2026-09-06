import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';

import DialogContent from '@/app/components/ui/DialogContent';
import { LEVEL_3_WIN } from '@/constants/dialogs/level3Win';
import { useGameStore } from '@/store/gameStore';
import { resetStore } from '@/__tests__/utils/test-utils';

describe('Level 3 journal unlock presentation', () => {
  beforeEach(() => {
    resetStore();
    useGameStore.getState().createProfile(0);
  });

  it('makes Skip land on an unskippable feature-unlock card', () => {
    const onContinue = vi.fn();

    render(
      <DialogContent
        sequence={LEVEL_3_WIN.sequence}
        onContinue={onContinue}
        onDialogAction={vi.fn()}
        enableTyping={false}
      />
    );

    fireEvent.click(screen.getByText('Skip'));

    expect(
      screen.getByRole('heading', { name: "Kip's Journal" })
    ).toBeInTheDocument();
    expect(screen.getByText('New Feature Unlocked')).toBeInTheDocument();
    expect(screen.queryByText('Skip')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Got it!' }));
    expect(onContinue).toHaveBeenCalledOnce();
    expect(useGameStore.getState().profiles[0]?.journalUnlockShown).toBe(true);
  });

  it('omits the unlock card after it has already been acknowledged', () => {
    const onContinue = vi.fn();
    useGameStore.getState().markJournalUnlockShown();

    render(
      <DialogContent
        sequence={LEVEL_3_WIN.sequence}
        onContinue={onContinue}
        onDialogAction={vi.fn()}
        enableTyping={false}
      />
    );

    fireEvent.click(screen.getByText('Skip'));

    expect(
      screen.queryByRole('heading', { name: "Kip's Journal" })
    ).not.toBeInTheDocument();
    expect(onContinue).toHaveBeenCalledOnce();
  });
});
