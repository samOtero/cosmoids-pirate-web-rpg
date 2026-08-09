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
          key: SpeakerImageKey.KIP_NERVOUS_NEUTRAL,
          displayName: 'Kip',
        },
      ],
      text: 'C-Captain Vane...',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CAPTAIN_VANE_HAUGHTY_NEUTRAL,
          displayName: 'Captain Vane',
          flipped: true,
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
      text: "He doesn't want to.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CAPTAIN_VANE_MOCKING_DISBELIEF,
          displayName: 'Captain Vane',
          flipped: true,
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
      text: 'Tell her, Kip.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_WORRIED,
          displayName: 'Kip',
        },
      ],
      text: "I'm leaving! I'm going to sail every sea and draw every Cosmoid in the world!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CAPTAIN_VANE_SMUG_AMUSED,
          displayName: 'Captain Vane',
          flipped: true,
        },
      ],
      text: "You? You wouldn't survive a day without me.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_HOPEFUL_SURPRISED,
          displayName: 'Kip',
        },
      ],
      text: "Maybe I'm scared—but I'm still going!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CAPTAIN_VANE_COMMANDING_ANGRY,
          displayName: 'Captain Vane',
          flipped: true,
        },
      ],
      text: "Then you won't be needing this miserable little boat.",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'Vane raises a handful of Capture Coins as Bug Cosmoids swarm from the forest.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CAPTAIN_VANE_COMMANDING_ANGRY,
          displayName: 'Captain Vane',
          flipped: true,
        },
      ],
      text: 'Tear their boat apart!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "Kip, get the supplies aboard. We'll protect your dream!",
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_2_REPAIRED_BOAT_SUPPLIES,
};
