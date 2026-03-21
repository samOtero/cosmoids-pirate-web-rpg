import {
  DialogConfig,
  BackgroundImageKey,
  SpeakerImageKey,
  Screens,
} from '@/types/baseGame';

export const LEVEL_1_WIN: DialogConfig = {
  sequence: [
    {
      text: ' No! You’ve no idea what you’ve done... The Captain is going to—!',
      portraits: [
        {
          key: SpeakerImageKey.PIRATE_GRUNT_JOE_ANGRY,
          displayName: 'Grunt Pirate Joe',
        },
      ],
    },
    {
      text: 'Dockworkers step out and grab the grunt.',
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
    },
    {
      text: 'Good work holding him off, lad. We’ll handle the trash from here.',
      portraits: [
        {
          key: SpeakerImageKey.OLD_SAILOR,
          displayName: 'Old Sailor',
        },
      ],
    },
    {
      text: 'I... I actually did it? I was so scared I thought I’d freeze up…',
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
    },
    {
      text: "You were shaking, Caleb. But you didn't run. Your parents would be proud.",
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
    },
    {
      text: 'Grandpa, look at Scuttles. He’s barely breathing.',
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
    },
    {
      text: "He pushed himself too far. Let's get him to Mara... she'll know what to do.",
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
  next: {
    screen: Screens.ISLAND_MAP,
  },
};
