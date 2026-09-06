import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_5_LOSE: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_WORRIED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: "I'm sorry, Tigrevel... we weren't strong enough to set you free.",
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_5_TIGREVEL_CELL,
};
