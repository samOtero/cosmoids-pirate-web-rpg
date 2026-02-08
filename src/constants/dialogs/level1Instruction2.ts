import {
  DialogConfig,
  BackgroundImageKey,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_1_INSTRUCTION_2: DialogConfig = {
  sequence: [
    {
      text: 'Bah! Is that all you got?! Senticle, stop panting and tear them apart!',
      portraits: [
        {
          key: SpeakerImageKey.PIRATE_GRUNT_JOE_ANGRY,
          displayName: 'Pirate Grunt Joe',
        },
      ],
      layout: 'battle-right',
    },
    {
      text: 'Use Crushing Bite, you lazy slug!',
      portraits: [
        {
          key: SpeakerImageKey.PIRATE_GRUNT_JOE_ANGRY_POINTING,
          displayName: 'Pirate Grunt Joe',
        },
      ],
      layout: 'battle-right',
    },
  ],
  backgroundImageKey: BackgroundImageKey.DEFAULT,
};
