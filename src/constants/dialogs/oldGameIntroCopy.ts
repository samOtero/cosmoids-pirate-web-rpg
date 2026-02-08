import {
  DialogConfig,
  SpeakerImageKey,
  BackgroundImageKey,
} from '@/types/baseGame';

export const OLD_GAME_INTRO_COPY: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
      text: "On the morning of Caleb's birthday, in the small coastal town of Seabreeze...",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: '...',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
      text: "Scanning the horizon already? Usually I can't get you out of bed at all.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: 'It’s today, Grandpa. They promised. They’re coming.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
      text: 'The sea keeps its own schedule, Caleb. Tides turn when they want to.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
        {
          key: SpeakerImageKey.STARTER_CHEST_CLOSED,
          displayName: 'Birthday Chest',
        },
      ],
      text: 'But... they knew you’d be waiting. They sent a package ahead. Just in case.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
      text: 'Grandpa hands Caleb a small wooden chest.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
        {
          key: SpeakerImageKey.STARTER_CHEST_OPEN,
          displayName: 'Birthday Chest',
        },
      ],
      text: 'No way.. Are these real Cosmoid Doubloons?!',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
      text: 'Aye. The first rule of a Captain is choosing the right crew.',
    },
    {
      text: 'Tradition says you must pick one. Choose wisely, lad.',
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.STARTER_1_CRAB,
          displayName: 'Palmit',
        },
        {
          key: SpeakerImageKey.STARTER_2_IGUANA,
          displayName: 'Fueguana',
          portraitWidth: 'wide',
        },
        {
          key: SpeakerImageKey.STARTER_3_MONKEY,
          displayName: 'Monkeg',
        },
      ],
      id: 'starter_choice',
      text: 'Pick your starter Cosmoid!',
      buttons: [
        {
          label: 'Palmit',
          type: 'grass',
          jumpToLineId: 'palmit_choice',
        },
        {
          label: 'Fueguana',
          type: 'fire',
          jumpToLineId: 'fueguana_choice',
        },
        {
          label: 'Monkeg',
          type: 'water',
          jumpToLineId: 'monkeg_choice',
        },
      ],
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
        {
          key: SpeakerImageKey.STARTER_1_CRAB,
          displayName: 'Palmit',
        },
      ],
      id: 'palmit_choice',
      text: 'A sturdy choice! It builds its own coconut raft to brave the salt water. So, are you sure you want to choose Palmit?',
      buttons: [
        {
          label: 'Yes',
          type: 'confirm',
          jumpToLineId: 'after_starter_choice',
          action: {
            type: 'PROCESS_EVENT',
            payload: {
              event: {
                type: 'PICK_STARTER',
                payload: {
                  creatureId: 'starter_grass',
                },
              },
            },
          },
        },
        {
          label: 'No',
          type: 'cancel',
          jumpToLineId: 'starter_choice',
        },
      ],
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
        {
          key: SpeakerImageKey.STARTER_2_IGUANA,
          displayName: 'Fueguana',
          portraitWidth: 'wide',
        },
      ],
      id: 'fueguana_choice',
      text: 'Oho, a fiery spirit! It has a knack for mischief and gunpowder. So, are you sure you want to choose Fueguana?',
      buttons: [
        {
          label: 'Yes',
          type: 'confirm',
          jumpToLineId: 'after_starter_choice',
          action: {
            type: 'PROCESS_EVENT',
            payload: {
              event: {
                type: 'PICK_STARTER',
                payload: {
                  creatureId: 'starter_fire',
                },
              },
            },
          },
        },
        {
          label: 'No',
          type: 'cancel',
          jumpToLineId: 'starter_choice',
        },
      ],
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
        {
          key: SpeakerImageKey.STARTER_3_MONKEY,
          displayName: 'Monkeg',
        },
      ],
      id: 'monkeg_choice',
      text: "Ah, the shy stowaway. It may prefer hiding in its barrel right now, but it's a natural navigator. So, are you sure you want to choose Monkeg?",
      buttons: [
        {
          label: 'Yes',
          type: 'confirm',
          jumpToLineId: 'after_starter_choice',
          action: {
            type: 'PROCESS_EVENT',
            payload: {
              event: {
                type: 'PICK_STARTER',
                payload: {
                  creatureId: 'starter_water',
                },
              },
            },
          },
        },
        {
          label: 'No',
          type: 'cancel',
          jumpToLineId: 'starter_choice',
        },
      ],
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
      id: 'after_starter_choice',
      text: 'A fine heading! I know you two will look out for each other.',
    },
    {
      text: 'Hold that doubloon tight, Caleb. your journey officially beg-',
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
};
