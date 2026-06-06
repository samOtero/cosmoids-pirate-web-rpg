import {
  DialogConfig,
  BackgroundImageKey,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_1_INSTRUCTION_3: DialogConfig = {
  sequence: [
    {
      text: 'Ha! It barely grazed you. Look at it trembling, that beast is already wearing out.',
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
      layout: 'battle-left',
    },
    {
      text: "We have the upper hand now. Press the advantage, Captain!",
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
