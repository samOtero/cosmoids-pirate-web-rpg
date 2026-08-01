import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_2_SHIPWRECK_INTRO: DialogConfig = {
  sequence: [
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'A towering wave smashes the boat and sends Caleb drifting toward an unfamiliar island.',
      backgroundImageKey: BackgroundImageKey.LEVEL_2_WAVE_IMPACT,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_PANICKED,
          displayName: 'Kip',
        },
      ],
      text: "Hey! Wake up! Please don't be dead!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SHIPWRECKED_DAZED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'My ship! Where is it?',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_NERVOUS_NEUTRAL,
          displayName: 'Kip',
        },
      ],
      text: 'Mostly scattered along the beach.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_NERVOUS_NEUTRAL,
          displayName: 'Kip',
        },
      ],
      text: "I'm Kip. Cabin boy for the pirate crew camped across the island.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SHIPWRECKED_DAZED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "You're a pirate?",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_WORRIED,
          displayName: 'Kip',
        },
      ],
      text: "I never wanted to be a pirate. I just want to draw the islands and Cosmoids I see, but they won't let me go.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "Help me rebuild my boat, and I'll help you escape.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_HOPEFUL_SURPRISED,
          displayName: 'Kip',
        },
      ],
      text: "You'd really stand up to them for me?",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "You saved my life. Besides, nobody should be forced to stay where they don't belong.",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'Together, Caleb and Kip piece the battered boat back together.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_RELIEVED_HAPPY,
          displayName: 'Kip',
        },
      ],
      text: "We did it! It's not pretty, but it should float.",
      backgroundImageKey:
        BackgroundImageKey.LEVEL_2_REPAIRED_BOAT_SUPPLIES,
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'A rustling sound comes from the bushes beside their food supplies.',
      backgroundImageKey:
        BackgroundImageKey.LEVEL_2_REPAIRED_BOAT_SUPPLIES,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_PANICKED,
          displayName: 'Kip',
        },
      ],
      text: 'Wild Cosmoids! They must be hungry!',
      backgroundImageKey:
        BackgroundImageKey.LEVEL_2_REPAIRED_BOAT_SUPPLIES,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Protect the supplies!',
      backgroundImageKey:
        BackgroundImageKey.LEVEL_2_REPAIRED_BOAT_SUPPLIES,
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_2_SHIPWRECK_BEACH,
};
