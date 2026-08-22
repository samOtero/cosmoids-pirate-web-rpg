import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_4_LOSE: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_WORRIED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: 'Mission failed...',
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_MARKET,
};
