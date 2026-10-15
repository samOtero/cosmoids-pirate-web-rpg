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
      gender: 'female' as const,
      isShiny: false,
    },
    {
      id: 'captured-fueguana',
      speciesId: 'starter_iguana',
      level: 5,
      xp: 0,
      equippedAttacks: ['SCRATCH'],
      gender: 'female' as const,
      isShiny: false,
    },
    {
      id: 'captured-monkeg',
      speciesId: 'starter_monkey',
      level: 5,
      xp: 0,
      equippedAttacks: ['TACKLE'],
      gender: 'female' as const,
      isShiny: false,
    },
    {
      id: 'captured-knotia',
      speciesId: 'mouse_1',
      level: 7,
      xp: 0,
      equippedAttacks: ['NIBBLE'],
      gender: 'female' as const,
      isShiny: false,
    },
    {
      id: 'captured-mopup',
      speciesId: 'mopup',
      level: 6,
      xp: 0,
      equippedAttacks: ['TACKLE'],
      gender: 'female' as const,
      isShiny: false,
    },
    {
      id: 'captured-buglet',
      speciesId: 'bug_stage_1',
      level: 4,
      xp: 0,
      equippedAttacks: ['TACKLE'],
      gender: 'female' as const,
      isShiny: false,
    },
    {
      id: 'captured-bugitor',
      speciesId: 'bug_stage_2',
      level: 8,
      xp: 0,
      equippedAttacks: ['TACKLE'],
      gender: 'female' as const,
      isShiny: false,
    },
    {
      id: 'captured-moth',
      speciesId: 'bug_stage_3',
      level: 12,
      xp: 0,
      equippedAttacks: ['TACKLE'],
      gender: 'female' as const,
      isShiny: false,
    },
    {
      id: 'captured-bettle',
      speciesId: 'bettle',
      level: 10,
      xp: 0,
      equippedAttacks: ['PINCH'],
      gender: 'female' as const,
      isShiny: false,
    },
  ],
  storageCreatures: [],
  inventory: [],
  gameFlags: [],
  storyProgression: StoryProgression.DEFEAT_BUG_STAGE_2,
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
    ).toContain(encodeURIComponent('/UI/Journal/palmit_journal.webp'));
    expect(screen.getByText("Kip's Notes")).toBeInTheDocument();
    expect(
      screen.getByText(/freshwater crab that uses a hollow coconut/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fueguana, captured' }));
    expect(
      screen
        .getByRole('img', { name: 'Fueguana field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/fueguana_journal.webp'));

    fireEvent.click(screen.getByRole('button', { name: 'Monkeg, captured' }));
    expect(
      screen
        .getByRole('img', { name: 'Monkeg field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/monkeg_journal.webp'));

    fireEvent.click(screen.getByRole('button', { name: 'Harlequill, seen' }));
    expect(
      screen
        .getByRole('img', { name: 'Harlequill field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/harlequill_journal.webp'));
    expect(screen.getByText("Kip's notes are unfinished")).toBeInTheDocument();
    expect(screen.queryByText(/aerial comedy/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Knotia, captured' }));
    expect(
      screen
        .getByRole('img', { name: 'Knotia field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/knotia_journal.webp'));
    expect(screen.getByText('Base Stats')).toBeInTheDocument();
    expect(screen.getByText('Highest Level').parentElement).toHaveTextContent(
      '7'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mopup, captured' }));
    expect(
      screen
        .getByRole('img', { name: 'Mopup field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/mopup_journal.webp'));

    fireEvent.click(
      screen.getByRole('button', { name: 'Sailkworm, captured' })
    );
    expect(
      screen
        .getByRole('img', { name: 'Sailkworm field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/buglet_journal.webp'));

    fireEvent.click(screen.getByRole('button', { name: 'Cocoonot, captured' }));
    expect(
      screen
        .getByRole('img', { name: 'Cocoonot field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/bugitor_journal.webp'));

    fireEvent.click(
      screen.getByRole('button', { name: 'Mainscale, captured' })
    );
    expect(
      screen
        .getByRole('img', { name: 'Mainscale field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/moth_journal.webp'));

    fireEvent.click(screen.getByRole('button', { name: 'Beetadel, captured' }));
    expect(
      screen
        .getByRole('img', { name: 'Beetadel field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/bettle_journal.webp'));
  }, 15000);

  it('shows evolved-away forms as captured without invalid owned stats', () => {
    const evolvedProfile: Profile = {
      ...profile,
      creatures: profile.creatures
        .filter((creature) => !creature.speciesId.startsWith('bug_stage_'))
        .concat({
          id: 'evolved-bug',
          speciesId: 'bug_stage_3',
          level: 10,
          xp: 0,
          equippedAttacks: ['TACKLE'],
          gender: 'female' as const,
          isShiny: false,
        }),
      capturedSpeciesIds: ['bug_stage_1', 'bug_stage_2', 'bug_stage_3'],
    };

    render(<CosmoidCodexScreen profile={evolvedProfile} onBack={() => {}} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Sailkworm, captured' })
    );
    expect(screen.getByText("Kip's Notes")).toBeInTheDocument();
    expect(screen.getByText('Owned').parentElement).toHaveTextContent('0');
    expect(screen.queryByText('-Infinity')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cocoonot, captured' }));
    expect(screen.getByText("Kip's Notes")).toBeInTheDocument();
  });

  it('shows the Level 4 pack journal artwork and notes after capture', () => {
    const level4Profile: Profile = {
      ...profile,
      storyProgression: StoryProgression.DEFEAT_LEVEL_4,
      capturedSpeciesIds: ['sonarion', 'resonarion'],
    };

    render(<CosmoidCodexScreen profile={level4Profile} onBack={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Razcall, captured' }));
    expect(
      screen
        .getByRole('img', { name: 'Razcall field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/sonarion_journal.webp'));
    expect(screen.getByText(/howl for Razound when cornered/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Razound, captured' })
    );
    expect(
      screen
        .getByRole('img', { name: 'Razound field sketch' })
        .getAttribute('src')
    ).toContain(encodeURIComponent('/UI/Journal/resonarion_journal.webp'));
    expect(screen.getByText(/At a Razcall's two-toned call/i)).toBeInTheDocument();
  });
});
