import { makeProfile } from '@/__tests__/utils/dataBuilders';
import { render, screen } from '@testing-library/react';

import LevelSelectScreen from '@/app/components/LevelSelectScreen';
import { Profile, StoryProgression } from '@/types/baseGame';

const profile: Profile = makeProfile({
  id: 0,
  name: 'Caleb',
  lastPlayed: 0,
  storyProgression: StoryProgression.DEFEAT_BUG_STAGE_1,
});

describe('LevelSelectScreen', () => {
  it('uses a horizontal swipe row on mobile and a grid on desktop', () => {
    render(
      <LevelSelectScreen
        profile={profile}
        onLevelSelect={() => {}}
        onBack={() => {}}
      />
    );

    const levelList = screen.getByRole('region', { name: 'Story levels' });

    expect(levelList).toHaveClass(
      'min-h-0',
      'flex-1',
      'touch-pan-x',
      'overflow-x-auto',
      'overflow-y-hidden',
      'overscroll-x-contain',
      'snap-x',
      'lg:overflow-y-auto'
    );
    expect(levelList.firstElementChild).toHaveClass(
      'flex',
      'w-max',
      'lg:grid',
      'lg:w-full'
    );
    expect(levelList.querySelector('#level-1')).toHaveClass(
      'min-h-[168px]',
      'sm:min-h-[180px]',
      'lg:min-h-[140px]'
    );
    expect(levelList.parentElement).toHaveClass(
      'flex',
      'min-h-0',
      'flex-col',
      'overflow-hidden'
    );
  });
});
