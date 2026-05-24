import {
  DialogConfig,
  BackgroundImageKey,
  SpeakerImageKey,
  Screens,
} from '@/types/baseGame';

export const LEVEL_1_WIN: DialogConfig = {
  sequence: [
    {
      text: 'We did it! We actually won!',
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
    },
    {
      text: "You just got lucky, you little sea-rat! Let's see how you handle a real menace!",
      portraits: [
        {
          key: SpeakerImageKey.RAT_CATCHER_ANGRY,
          displayName: 'Rat Catcher',
          flipped: true,
        },
      ],
    },
    {
      text: 'The Rat Catcher pulls out a strange, shadowy Capture Coin. He hurls it down, unleashing a mutated Senticle seething with a dark, purple aura.',
      portraits: [
        {
          key: SpeakerImageKey.EEL_SENTICLE,
          displayName: 'Cursed Senticle',
          flipped: true,
        },
      ],
    },
    {
      text: 'What is wrong with that thing?! Why is it glowing like that?!',
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
    },
    {
      text: 'A little curse goes a long way! Chomp on that kid, Senticle!',
      portraits: [
        {
          key: SpeakerImageKey.RAT_CATCHER_ANGRY,
          displayName: 'Rat Catcher',
          flipped: true,
        },
      ],
    },
    {
      text: 'The Cursed Senticle lunges at Caleb with terrifying speed.',
      portraits: [
        {
          key: SpeakerImageKey.EEL_SENTICLE,
          displayName: 'Cursed Senticle',
          flipped: true,
        },
      ],
    },
    {
      text: 'Look out, kid!',
      portraits: [
        {
          key: SpeakerImageKey.LANCE_SERIOUS,
          displayName: 'Lance',
        },
      ],
    },
    {
      text: 'Lance dives in front of Caleb, throwing his arm out to shield him.',
      portraits: [
        {
          key: SpeakerImageKey.LANCE_SERIOUS,
          displayName: 'Lance',
        },
        {
          key: SpeakerImageKey.EEL_SENTICLE,
          displayName: 'Cursed Senticle',
          flipped: true,
        },
      ],
    },
    {
      text: 'Gah!',
      portraits: [
        {
          key: SpeakerImageKey.LANCE_ANGRY,
          displayName: 'Lance',
        },
      ],
    },
    {
      text: 'Lance! It bit you!',
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
    },
    {
      text: 'Hah! The mighty pirate, brought down!',
      portraits: [
        {
          key: SpeakerImageKey.RAT_CATCHER_COCKY,
          displayName: 'Rat Catcher',
          flipped: true,
        },
      ],
    },
    {
      text: 'I’ve survived squalls worse than you. Astrolape, clear the deck!',
      portraits: [
        {
          key: SpeakerImageKey.LANCE_SERIOUS,
          displayName: 'Lance',
        },
      ],
    },
    {
      text: 'Lance tosses his own coin. A massive ape crashes onto the wooden planks.',
      portraits: [
        {
          key: SpeakerImageKey.ASTROLAPE,
          displayName: 'Astrolape',
        },
      ],
    },
    {
      text: 'ASTROOOOOLAPE!',
      portraits: [
        {
          key: SpeakerImageKey.ASTROLAPE_ROAR,
          displayName: 'Astrolape',
        },
      ],
    },
    {
      text: 'Astrolape lunges forward with a devastating full-body tackle, blasting the Cursed Senticle and the Rat Catcher straight into the harbor!',
      portraits: [
        {
          key: SpeakerImageKey.ASTROLAPE_ROAR,
          displayName: 'Astrolape',
        },
      ],
    },
    {
      text: 'Lance, your arm... the bite mark is turning purple! Are you okay?!',
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
    },
    {
      text: "It’s just a scratch, kid. I'd take a bite from a Krakenlord for a friend. Don't sweat it.",
      portraits: [
        {
          key: SpeakerImageKey.LANCE_SMILING,
          displayName: 'Lance',
        },
      ],
    },
    {
      text: 'Later that day…',
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
    },
    {
      text: "I'm going to get stronger. I'm not going to need saving next time! I swear, I’m going to be the best Cosmoids Captain of the seas!",
      portraits: [
        {
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
    },
    {
      text: 'I’ll hold you to that, Caleb. Keep that fiery spirit.',
      portraits: [
        {
          key: SpeakerImageKey.LANCE_SMILING,
          displayName: 'Lance',
        },
      ],
    },
    {
      text: 'The sails catch the salty wind, and Caleb watches his hero sail off toward the horizon.',
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
  next: {
    screen: Screens.LEVEL_SELECT,
  },
};
