import {
  DialogConfig,
  BackgroundImageKey,
  SpeakerImageKey,
} from '@/types/baseGame';

export const STARTER_BATTLE_LOSE: DialogConfig = {
  sequence: [
    {
      text: 'Hah! What did I tell you? You and your little pet are just playing dress-up. Run home, kid!',
      portraits: [
        {
          key: SpeakerImageKey.RAT_CATCHER_SMUG,
          displayName: 'Rat-Catcher',
          flipped: true,
        },
      ],
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
};
