import {
  DialogConfig,
  BackgroundImageKey,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_1_INTRO: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
      text: 'Hold that doubloon tight, Caleb. your journey officially beg-',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
      text: 'Suddenly, a high-pitched screech is heard from the sky. A shape plummets from the clouds!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "Grandpa! Watch out! It's coming straight at us!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.HOOKAW_TIRED_DIVE_SKIN_1,
          displayName: '???',
        },
      ],
      text: 'HOOOKAWWWWWWW....!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
      text: "The bird crashes onto the wooden planks, sliding to a halt at Caleb's feet. It is exhausted.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Scuttles?! Is that you?! Are you okay?',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1,
          displayName: 'Scuttles',
        },
      ],
      text: 'Hookaw.. pant... pant...',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
      text: 'Careful! Someone followed him here.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.PIRATE_GRUNT_JOE_SMIRK,
          displayName: 'Grunt Pirate Joe',
        },
      ],
      text: 'Huff... finally... huff... caught you... you slippery little...',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Who are you? Stay away from Scuttles!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.PIRATE_GRUNT_JOE_ANGRY,
          displayName: 'Grunt Pirate Joe',
        },
      ],
      text: "Give me that bird, kid. The Captain's gonna have my head if I lose it!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EEL_SENTICLE,
          displayName: 'Senticle',
          portraitWidth: 'wide',
        },
        {
          key: SpeakerImageKey.PIRATE_GRUNT_JOE_ANGRY_POINTING,
          displayName: 'Grunt Pirate Joe',
          portraitWidth: 'wide',
        },
      ],
      text: "I'm not going back empty-handed. Tear him up, Senticle!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
      text: 'He leaves us no choice! Caleb, use the gift your parents sent you. Defend your crew!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "Nobody touches my family! Let's go, partner! I choose YOU!",
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
};
