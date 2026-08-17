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
          key: SpeakerImageKey.CAPTAIN_VANE_STUNNED_DEFEAT,
          displayName: 'Captain Vane',
          flipped: true,
        },
      ],
      text: 'He... he actually defeated me.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_HOPEFUL_SURPRISED,
          displayName: 'Kip',
          flipped: true,
        },
      ],
      text: 'Wow! He really is strong!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_PANICKED,
          displayName: 'Kip',
          flipped: true,
        },
      ],
      text: 'Umm... Caleb, we need to leave! The other pirates will be here any minute!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "Right! Let's get out of here!",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: "The boat catches the wind and clears the reef before Vane's crew reaches the shore.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_RELIEVED_HAPPY,
          displayName: 'Kip',
        },
      ],
      text: "I can't wait to fill my journal with every Cosmoids we meet!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "Then we'd better sail the whole world!",
    },
    {
      id: 'journal-unlock',
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'Kip records the Cosmoids you encounter and capture.',
      presentation: {
        type: 'feature-unlock',
        eyebrow: 'New Feature Unlocked',
        title: "Kip's Journal",
        hint: 'Find it under Choose Mode.',
        showOnce: true,
      },
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_2_REPAIRED_BOAT_SUPPLIES,
};
