import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_4_INTRO: DialogConfig = {
  sequence: [
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: 'Caleb and Kip have escaped the island, but not Captain Vane. Her ship is gaining on their little boat.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_PANICKED,
          displayName: 'Kip',
          flipped: true,
        },
      ],
      text: "C-Caleb, we're almost out of supplies. We can't stay out here much longer!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'We beat her once, but our Cosmoids need a break. Is there anywhere we can lose her?',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_NERVOUS_NEUTRAL,
          displayName: 'Kip',
          flipped: true,
        },
      ],
      text: "Hmm... What about Ironbell? The Navy controls the harbor. Even Vane won't follow us under their guns.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "Perfect! Let's go!",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: "By afternoon, Ironbell's fortress rises ahead, and Vane turns away. Caleb and Kip dock beneath its walls and give their Cosmoids time to rest.",
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_HARBOR,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Wow! This place is huge! Look at those cannons!',
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_HARBOR,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
      text: 'A little later, Caleb and Kip reach Ironbell’s market. A girl hurries past them, glancing over her shoulder.',
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_MARKET,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Hey! You look like you know your way around. Where can we buy supplies for our boat?',
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_MARKET,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_STARTLED,
          displayName: '???',
          flipped: true,
        },
      ],
      text: "Uh, what?! Sorry, I can't stop! I'm on an important mission, and I'm being chased!",
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_MARKET,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Chased?! Looks like you need the help of Captain Caleb and his crew!',
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_MARKET,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_WORRIED,
          displayName: 'Kip',
        },
      ],
      text: 'There he goes again...',
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_MARKET,
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_4_VANE_CHASE,
};
