import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_3_INTRO: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_PANICKED,
          displayName: 'Kip',
          flipped: true,
        },
      ],
      text: 'C-Captain Vane...',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CAPTAIN_VANE_HAUGHTY_NEUTRAL,
          displayName: 'Captain Vane',
        },
      ],
      text: "Step away from that boat, Kip. You're coming with me.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "He doesn't want to be part of your crew anymore.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CAPTAIN_VANE_MOCKING_DISBELIEF,
          displayName: 'Captain Vane',
        },
      ],
      text: "Kip doesn't know what he wants. Unless you count filling books with useless drawings.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Kip, tell her what you told me.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_WORRIED,
          displayName: 'Kip',
          flipped: true,
        },
      ],
      text: "I... I'm...",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_DETERMINED,
          displayName: 'Kip',
          flipped: true,
        },
      ],
      text: "I'm leaving! I'm going to catalog, study, and draw every kind of Cosmoid in the world!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CAPTAIN_VANE_SMUG_AMUSED,
          displayName: 'Captain Vane',
        },
      ],
      text: "You? HA! You wouldn't survive a day without me.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_DETERMINED,
          displayName: 'Kip',
          flipped: true,
        },
      ],
      text: "Then I'll learn. I may be scared, but I won't let that stop me from chasing my dream!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CAPTAIN_VANE_COMMANDING_ANGRY,
          displayName: 'Captain Vane',
          flipped: true,
        },
      ],
      text: 'Fine! Have it your way! Consider me your enemy!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CAPTAIN_VANE_COMMANDING_ANGRY,
          displayName: 'Captain Vane',
          flipped: true,
        },
      ],
      text: 'Beetadel! Tear their boat apart!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.BEETADEL_STERN,
          displayName: 'Beetadel',
        },
      ],
      text: 'Beetadeeeel!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_PANICKED,
          displayName: 'Kip',
          flipped: true,
        },
      ],
      text: 'Not Beetadel! His armored shell can withstand almost anything!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Almost anything? Then we’ll find the exception. Get the supplies aboard, Kip!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "I'll protect the boat and your dream!",
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_2_REPAIRED_BOAT_SUPPLIES,
};
