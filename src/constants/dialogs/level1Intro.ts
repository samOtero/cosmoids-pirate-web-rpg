import {
  DialogConfig,
  BackgroundImageKey,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_1_INTRO: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
      text: 'Heavy, arrogant footsteps echo on the wooden docks as a local Rat-Catcher swaggers up.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.RAT_CATCHER_MOCKING,
          displayName: 'Rat-Catcher',
          flipped: true,
        },
      ],
      text: 'Well, look at the big, bad pirate playing with kids.',
    },
    {
      text: 'Just enjoying the morning breeze. No trouble here.',
      portraits: [
        {
          key: SpeakerImageKey.LANCE_CALM,
          displayName: 'Lance',
        },
      ],
    },
    {
      text: "See that, kid? A total coward. I think I'll just take his precious cargo then.",
      portraits: [
        {
          key: SpeakerImageKey.RAT_CATCHER_SMUG,
          displayName: 'Rat-Catcher',
          flipped: true,
        },
      ],
    },
    {
      text: "Don't you dare touch his stuff! I'll show you how a real pirate fights!",
      portraits: [
        {
          key: SpeakerImageKey.CALEB_ANGRY_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
};
