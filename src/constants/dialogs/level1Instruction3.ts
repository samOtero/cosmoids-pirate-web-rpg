import {
  DialogConfig,
  BackgroundImageKey,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_1_INSTRUCTION_3: DialogConfig = {
  sequence: [
    {
      text: 'Ha! It barely grazed you. Look at it trembling, that beast has no Energy left.',
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
      layout: 'battle-left',
    },
    {
      text: "It can't fight properly when it's that exhausted. Press the advantage, Captain!",
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
