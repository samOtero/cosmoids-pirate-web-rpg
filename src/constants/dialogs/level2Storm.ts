import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_2_STORM: DialogConfig = {
  sequence: [
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'Before long, dark clouds swallow the sky and the peaceful sea becomes a raging storm.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_FLUSTERED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "Okay... maybe the greatest captain should've learned how to sail first.",
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_2_STORMY_SEA,
};
