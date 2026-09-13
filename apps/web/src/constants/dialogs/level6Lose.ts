import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_6_LOSE: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.NAVY_COMMANDER_NEUTRAL,
          displayName: 'Commander Strake',
          flipped: true,
        },
      ],
      text: 'Order is restored.',
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_6_TIGREVEL_NETTED,
};
