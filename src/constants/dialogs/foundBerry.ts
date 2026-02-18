import {
  DialogConfig,
  BackgroundImageKey,
  SpeakerImageKey,
} from '@/types/baseGame';

export const FOUND_ITEM: DialogConfig = {
  backgroundImageKey: BackgroundImageKey.FOREST,
  sequence: [
    {
      text: 'You found a Berry!',
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
    },
  ],
};
