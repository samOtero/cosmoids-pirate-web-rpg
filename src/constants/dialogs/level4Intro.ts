import {
  BackgroundImageKey,
  DialogConfig,
  SpeakerImageKey,
} from '@/types/baseGame';

export const LEVEL_4_INTRO: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_PANICKED,
          displayName: 'Kip',
          flipped: true,
        },
      ],
      text: "C-Caleb, we're almost out of supplies. And Vane's ship keeps gaining on us.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_ANNOYED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'You always save the good news for last.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.KIP_NERVOUS_NEUTRAL,
          displayName: 'Kip',
          flipped: true,
        },
      ],
      text: "We should make for Ironbell. The Navy controls the harbor, so even Vane won't follow us under their guns.",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: '' }],
      text: "By afternoon, Ironbell's fortress rises ahead. Vane's sails turn away as they enter the harbor.",
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_HARBOR,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'You look like a courier. Can you point us toward the market?',
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_MARKET,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.MARIBEL_STARTLED,
          displayName: 'Mari',
          flipped: true,
        },
      ],
      text: "Sorry, I can't stop! I'm on an important mission, and a pack of wild Cosmoids is chasing me through town!",
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_MARKET,
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'Supplies can wait a little longer. Show us where you\'re going.',
      backgroundImageKey: BackgroundImageKey.LEVEL_4_IRONBELL_MARKET,
    },
  ],
  backgroundImageKey: BackgroundImageKey.LEVEL_4_VANE_CHASE,
};
