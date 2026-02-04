import {
  DialogConfig,
  BackgroundImageKey,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_1_INSTRUCTION_1: DialogConfig = {
  sequence: [
    {
      text: 'Your partner awaits your order. Select an attack and strike while his guard is down!',
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
    },
  ],
  backgroundImageKey: BackgroundImageKey.DEFAULT,
};
