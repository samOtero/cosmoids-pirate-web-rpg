import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_3_WIN: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.CAPTAIN_VANE_STUNNED_DEFEAT,
          displayName: 'Captain Vane',
          flipped: true,
        },
      ],
      text: 'Impossible...',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_PANICKED,
          displayName: 'Kip',
        },
      ],
      text: 'We need to leave! The other pirates will be here any minute!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Kip, cast off!',
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: "The boat catches the wind and clears the reef before Vane's crew reaches the shore.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CAPTAIN_VANE_STUNNED_DEFEAT,
          displayName: 'Captain Vane',
          flipped: true,
        },
      ],
      text: 'They... they actually escaped me.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_RELIEVED_HAPPY,
          displayName: 'Kip',
        },
      ],
      text: 'I want to keep a journal of every Cosmoid we meet!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "Perfect. Let's give you a world worth drawing.",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: "Kip's Journal unlocked! New entries appear as you discover and capture Cosmoids.",
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_2_REPAIRED_BOAT_SUPPLIES,
};
