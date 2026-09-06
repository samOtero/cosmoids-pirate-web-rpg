import {
  DialogConfig,
  SpeakerImageKey,
  BackgroundImageKey,
  GameFlag,
} from '@/types/baseGame';

export const NEW_PLAYER_WELCOME_DIALOG: DialogConfig = {
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
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "Come on, Captain Lance! I'm ready! Let me join your crew!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.LANCE_AMUSED,
          displayName: 'Lance',
        },
      ],
      text: "Join my crew? Kid, you don't even have a single Cosmoid. You'll never survive as a pirate like that.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_ANNOYED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "That's not fair! I'm tough enough!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.LANCE_SMILING,
          displayName: 'Lance',
        },
        {
          key: SpeakerImageKey.STARTER_CHEST_CLOSED,
          displayName: 'Chest',
        },
      ],
      text: "Tough isn't enough out there. But hey, since it's your birthday... catch.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
        {
          key: SpeakerImageKey.STARTER_CHEST_OPEN,
          displayName: 'Chest',
        },
      ],
      text: 'Whoa! Are these Cosmoid coins?!',
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
      text: 'Lance has given you a treasure chest! Three unique Cosmoids are inside. Who will you choose?',
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
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
        {
          key: SpeakerImageKey.STARTER_1_CRAB,
          displayName: 'Palmit',
        },
      ],
      id: 'palmit_choice',
      text: "That's a Palmit! It builds its own coconut raft to brave the salt water. Should I choose it?",
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
                  flag: '0_1',
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
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
        {
          key: SpeakerImageKey.STARTER_2_IGUANA,
          displayName: 'Fueguana',
          portraitWidth: 'wide',
        },
      ],
      id: 'fueguana_choice',
      text: "That's a Fueguana! It has a knack for mischief and gunpowder. Should I choose it?",
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
                  flag: '0_2',
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
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
        {
          key: SpeakerImageKey.STARTER_3_MONKEY,
          displayName: 'Monkeg',
        },
      ],
      id: 'monkeg_choice',
      text: "That's a Monkeg! It may prefer hiding in its barrel right now, but it's a natural deckhand. Should I choose it?",
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
                  flag: '0_3',
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
          key: SpeakerImageKey.CALEB_CONFIDENT_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      id: 'after_starter_choice',
      text: "I've made my choice! I choose you, {StarterName}!",
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
};
