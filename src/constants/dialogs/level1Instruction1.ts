import {
  DialogConfig,
  BackgroundImageKey,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_1_INSTRUCTION_1: DialogConfig = {
  sequence: [
    {
      text: 'What… What do I do?!',
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      layout: 'battle-left',
    },
    {
      text: 'Steady your hands, Caleb! Your partner looks to you for courage now. Select an Attack!',
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
      layout: 'battle-left',
    },
  ],
  backgroundImageKey: BackgroundImageKey.DEFAULT,
};
