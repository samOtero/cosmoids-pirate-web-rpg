import { fireEvent, render, screen } from '@testing-library/react';

import CosmoidCodexScreen from '@/app/components/CosmoidCodexScreen';
import { Profile } from '@/types/baseGame';

const profile: Profile = {
  id: 0,
  name: 'Caleb',
  lastPlayed: 0,
  creatures: [
    {
      id: 'captured-palmit',
      speciesId: 'starter_crab',
      level: 5,
      xp: 0,
      equippedAttacks: ['PINCH'],
      isShiny: false,
    },
    {
      id: 'captured-knotia',
      speciesId: 'mouse_1',
      level: 7,
      xp: 0,
      equippedAttacks: ['NIBBLE'],
      isShiny: false,
    },
  ],
  storageCreatures: [],
  inventory: [],
  gameFlags: [],
  storyProgression: 3,
};

describe('CosmoidCodexScreen', () => {
  it('shows discovered species and distinguishes seen from captured', () => {
    render(<CosmoidCodexScreen profile={profile} onBack={() => {}} />);

    expect(
      screen.getByRole('heading', { name: "Kip's Journal" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Knotia, captured' })
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Harlequill, seen' })
    ).toBeEnabled();
    expect(screen.queryByText('Undiscovered')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Unknown Cosmoid 1' })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Palmit, captured' }));
    expect(
      screen
        .getByRole('img', { name: 'Palmit field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/palmit_journal.png'));

    fireEvent.click(screen.getByRole('button', { name: 'Harlequill, seen' }));
    expect(screen.getByText("Kip's notes are unfinished")).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Knotia, captured' }));
    expect(screen.getByText('Base Stats')).toBeInTheDocument();
    expect(screen.getByText('Highest Level')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
