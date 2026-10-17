import { makeProfile } from '@/__tests__/utils/dataBuilders';
import { render, screen } from '@testing-library/react';

import ModeSelectScreen from '@/app/components/ModeSelectScreen';
import { Profile, StoryProgression } from '@/types/baseGame';

const profile: Profile = makeProfile({
  id: 0,
  name: 'Caleb',
  lastPlayed: 0,
  storyProgression: StoryProgression.DEFEAT_BUG_STAGE_1,
});

const callbacks = {
  onSelectStory: () => {},
  onSelectChallenge: () => {},
  onSelectCodex: () => {},
  onBack: () => {},
};

describe('ModeSelectScreen', () => {
  it("unlocks Kip's Journal after completing Level 3", () => {
    const { rerender } = render(
      <ModeSelectScreen profile={profile} {...callbacks} />
    );

    expect(
      screen.queryByRole('heading', { name: "Kip's Journal" })
    ).not.toBeInTheDocument();

    rerender(
      <ModeSelectScreen
        profile={{
          ...profile,
          storyProgression: StoryProgression.DEFEAT_BUG_STAGE_2,
        }}
        {...callbacks}
      />
    );

    expect(
      screen.getByRole('heading', { name: "Kip's Journal" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: "Kip's Journal is new" })
    ).toBeInTheDocument();

    rerender(
      <ModeSelectScreen
        profile={{
          ...profile,
          storyProgression: StoryProgression.DEFEAT_BUG_STAGE_2,
          journalOpened: true,
        }}
        {...callbacks}
      />
    );

    expect(
      screen.queryByRole('status', { name: "Kip's Journal is new" })
    ).not.toBeInTheDocument();
  });
});
