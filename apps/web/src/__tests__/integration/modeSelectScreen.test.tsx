import { makeProfile } from '@/__tests__/utils/dataBuilders';
import { fireEvent, render, screen } from '@testing-library/react';

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
  onSelectRoguelite: () => {},
  onSelectCodex: () => {},
  onBack: () => {},
};

beforeEach(() => vi.stubEnv('NEXT_PUBLIC_ENABLE_ROGUELITE', undefined));
afterEach(() => vi.unstubAllEnvs());

describe('ModeSelectScreen', () => {
  it('offers Roguelite as its own mode without invoking Story or Challenge', () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_ROGUELITE', 'true');
    const story = vi.fn();
    const challenge = vi.fn();
    const roguelite = vi.fn();
    render(
      <ModeSelectScreen
        profile={profile}
        {...callbacks}
        onSelectStory={story}
        onSelectChallenge={challenge}
        onSelectRoguelite={roguelite}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Roguelite/i }));
    expect(roguelite).toHaveBeenCalledOnce();
    expect(story).not.toHaveBeenCalled();
    expect(challenge).not.toHaveBeenCalled();
  });

  it('hides Roguelite by default while keeping Story and Challenge available', () => {
    const story = vi.fn();
    const challenge = vi.fn();
    const roguelite = vi.fn();
    render(
      <ModeSelectScreen
        profile={profile}
        {...callbacks}
        onSelectStory={story}
        onSelectChallenge={challenge}
        onSelectRoguelite={roguelite}
      />
    );
    expect(
      screen.queryByRole('button', { name: /Roguelite/i })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Story/i }));
    fireEvent.click(screen.getByRole('button', { name: /Challenge/i }));
    expect(story).toHaveBeenCalledOnce();
    expect(challenge).toHaveBeenCalledOnce();
    expect(roguelite).not.toHaveBeenCalled();
  });

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
