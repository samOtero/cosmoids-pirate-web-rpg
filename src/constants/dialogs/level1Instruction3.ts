import {
  DialogConfig,
  BackgroundImageKey,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_1_INSTRUCTION_3: DialogConfig = {
  sequence: [
    {
      text: 'Just as I thought. That Senticle is exhausted from chasing Scuttles across the ocean. We have a chance!',
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Guide',
        },
      ],
      layout: 'battle-left',
    },
  ],
  backgroundImageKey: BackgroundImageKey.DEFAULT,
};
