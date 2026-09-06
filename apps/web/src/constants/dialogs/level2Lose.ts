import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_2_LOSE: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_WORRIED,
          displayName: 'Kip',
        },
      ],
      text: 'That was everything! We’ll never make it past the reef without supplies!',
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_2_REPAIRED_BOAT_SUPPLIES,
};
