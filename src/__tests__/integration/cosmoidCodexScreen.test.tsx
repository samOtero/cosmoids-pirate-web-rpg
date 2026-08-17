import { fireEvent, render, screen } from '@testing-library/react';

import CosmoidCodexScreen from '@/app/components/CosmoidCodexScreen';
import { Profile, StoryProgression } from '@/types/baseGame';

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
      id: 'captured-fueguana',
      speciesId: 'starter_iguana',
      level: 5,
      xp: 0,
      equippedAttacks: ['SCRATCH'],
      isShiny: false,
    },
    {
      id: 'captured-monkeg',
      speciesId: 'starter_monkey',
      level: 5,
      xp: 0,
      equippedAttacks: ['TACKLE'],
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
    {
      id: 'captured-mopup',
      speciesId: 'mopup',
      level: 6,
      xp: 0,
      equippedAttacks: ['TACKLE'],
      isShiny: false,
    },
    {
      id: 'captured-buglet',
      speciesId: 'bug_stage_1',
      level: 4,
      xp: 0,
      equippedAttacks: ['TACKLE'],
      isShiny: false,
    },
    {
      id: 'captured-bugitor',
      speciesId: 'bug_stage_2',
      level: 8,
      xp: 0,
      equippedAttacks: ['TACKLE'],
      isShiny: false,
    },
    {
      id: 'captured-moth',
      speciesId: 'bug_stage_3',
      level: 12,
      xp: 0,
      equippedAttacks: ['TACKLE'],
      isShiny: false,
    },
    {
      id: 'captured-bettle',
      speciesId: 'bettle',
      level: 10,
      xp: 0,
      equippedAttacks: ['PINCH'],
      isShiny: false,
    },
  ],
  storageCreatures: [],
  inventory: [],
  gameFlags: [],
  storyProgression: StoryProgression.DEFEAT_BUG_STAGE_2,
};

describe('CosmoidCodexScreen', () => {
  it(
    'shows discovered species and distinguishes seen from captured',
    () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'Fueguana, captured' }));
    expect(
      screen
        .getByRole('img', { name: 'Fueguana field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/fueguana_journal.png'));

    fireEvent.click(screen.getByRole('button', { name: 'Monkeg, captured' }));
    expect(
      screen
        .getByRole('img', { name: 'Monkeg field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/monkeg_journal.png'));

    fireEvent.click(screen.getByRole('button', { name: 'Harlequill, seen' }));
    expect(
      screen
        .getByRole('img', { name: 'Harlequill field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/harlequill_journal.png'));
    expect(screen.getByText("Kip's notes are unfinished")).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Knotia, captured' }));
    expect(
      screen
        .getByRole('img', { name: 'Knotia field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/knotia_journal.png'));
    expect(screen.getByText('Base Stats')).toBeInTheDocument();
    expect(screen.getByText('Highest Level').parentElement).toHaveTextContent(
      '7'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mopup, captured' }));
    expect(
      screen
        .getByRole('img', { name: 'Mopup field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/mopup_journal.png'));

    fireEvent.click(screen.getByRole('button', { name: 'Buglet, captured' }));
    expect(
      screen
        .getByRole('img', { name: 'Buglet field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/buglet_journal.png'));

    fireEvent.click(screen.getByRole('button', { name: 'Bugitor, captured' }));
    expect(
      screen
        .getByRole('img', { name: 'Bugitor field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/bugitor_journal.png'));

    fireEvent.click(screen.getByRole('button', { name: 'Moth, captured' }));
    expect(
      screen.getByRole('img', { name: 'Moth field sketch' }).getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/moth_journal.png'));

    fireEvent.click(screen.getByRole('button', { name: 'Bettle, captured' }));
    expect(
      screen
        .getByRole('img', { name: 'Bettle field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/bettle_journal.png'));
  }, 15000);
});
