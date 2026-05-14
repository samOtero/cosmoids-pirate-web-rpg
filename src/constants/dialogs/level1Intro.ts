import {
  DialogConfig,
  BackgroundImageKey,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_1_INTRO: DialogConfig = {
  sequence: [
    {
      text: "A fancy new pet? Too bad it's stuck with a weak little kid giving the orders. My lovely Knotia will crush you both!",
      portraits: [
        {
          key: SpeakerImageKey.RAT_CATCHER_MOCKING,
          displayName: 'Rat-Catcher',
        },
      ],
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
};
