import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_2_WIN: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_RELIEVED_HAPPY,
          displayName: 'Kip',
        },
      ],
      text: 'We did it! The supplies are safe! We can finally leave!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Next stop, the open sea!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CAPTAIN_VANE_HAUGHTY_NEUTRAL,
          displayName: '???',
          flipped: true,
        },
      ],
      text: "Leaving, Kip? Without your captain's permission?",
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_2_REPAIRED_BOAT_SUPPLIES,
};
