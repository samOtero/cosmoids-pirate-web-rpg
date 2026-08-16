import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_3_LOSE: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.CAPTAIN_VANE_SMUG_AMUSED,
          displayName: 'Captain Vane',
          flipped: true,
        },
      ],
      text: 'There. Your grand voyage ends right now.',
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_2_REPAIRED_BOAT_SUPPLIES,
};
