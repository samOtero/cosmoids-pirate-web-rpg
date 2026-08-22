import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_4_WIN: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_RELIEVED_HAPPY,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'We made it! And the food is still safe.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Food? That was your important mission?',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_DETERMINED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'Yes. The Navy captured a tiger-shark Cosmoid and imprisoned it beneath Ironbell.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_WORRIED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: "It can't hunt inside that cell, so I bring it every meal.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "Then let's make sure it gets every bite.",
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_MARKET,
};
