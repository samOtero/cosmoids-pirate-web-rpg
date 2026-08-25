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
      text: 'The Navy is keeping a wild Cosmoid beneath Ironbell. They call it too dangerous to release.',
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
      text: 'Then lead the way.',
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'Far below the market, an iron bowl scrapes across stone.',
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_CELL,
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'Behind the bars, a striped head rises. Golden eyes fix on the approaching footsteps.',
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_CELL,
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_MARKET,
};
