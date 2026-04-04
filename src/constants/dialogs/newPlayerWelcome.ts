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
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "Come on, Captain Lance! I'm ready! Let me join your crew today!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.LANCE_NEUTRAL_OUTFIT_1,
          displayName: 'Lance',
        },
      ],
      text: "***Join my crew? Kid, you don't even have a single Cosmoid. You'll never survive as a pirate like that.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: "***That's not fair! I'm tough enough!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.LANCE_NEUTRAL_OUTFIT_1,
          displayName: 'Lance',
        },
      ],
      text: "***Tough isn't enough out there. But hey, since it's your birthday... catch.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
      text: 'Lance tosses Caleb a handful of Capture Coins.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.LANCE_NEUTRAL_OUTFIT_1,
          displayName: 'Lance',
        },
      ],
      text: 'Use those to catch your first partner. Maybe start small with a little bird or a dock rat.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      text: '***A dock rat?! No way! Come on, Lance! You have a whole chest of rare Cosmoids right there. Let me have one of those!\n',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.LANCE_NEUTRAL_OUTFIT_1,
          displayName: 'Lance',
        },
        {
          key: SpeakerImageKey.STARTER_CHEST_CLOSED,
          displayName: 'Chest',
        },
      ],
      text: "These aren't toys, Caleb. The Cosmoids in this chest are rare. They rarely even listen to a veteran pirate, let alone a rookie.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
      text: 'Heavy, arrogant footsteps echo on the wooden docks as a local Bandit swaggers up.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
      text: '***Well, look at the big, bad pirate playing with kids.',
    },
    {
      text: 'Just enjoying the morning breeze. No trouble here.',
      portraits: [
        {
          key: SpeakerImageKey.LANCE_NEUTRAL_OUTFIT_1,
          displayName: 'Lance',
        },
      ],
    },
    {
      text: "***You pirates are pathetic. Take away your fancy little monsters, and you're all just cowards playing dress-up on the water.",
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
    },
    {
      text: '***Hey! Shut up! Captain Lance is the greatest!',
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
    },
    {
      text: 'Let it go, Caleb. Words can’t sink ships.',
      portraits: [
        {
          key: SpeakerImageKey.LANCE_NEUTRAL_OUTFIT_1,
          displayName: 'Lance',
        },
      ],
    },
    {
      text: ' I need to check the rigging. Watch my cargo.',
      portraits: [
        {
          key: SpeakerImageKey.LANCE_NEUTRAL_OUTFIT_1,
          displayName: 'Lance',
        },
      ],
    },
    {
      text: 'Lance turns his back and walks toward his ship, completely ignoring the Bandit.',
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: '',
        },
      ],
    },
    {
      text: "***See that, kid? A total coward. I think I'll just take his precious cargo then.",
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
    },
    {
      text: "***Don't you dare touch his stuff! I'll show you how a real pirate fights!",
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
    },
    {
      text: '***A real pirate? Please. You and what army, kid?',
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Grandpa',
        },
      ],
    },
    {
      text: '***Me and... ummm... my new partner!',
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
        {
          key: SpeakerImageKey.STARTER_CHEST_OPEN,
          displayName: 'Chest',
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
      text: "You ignore Lance's warning and bust open his treasure chest! Three unique Cosmoids are inside. Who will you choose?",
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
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
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
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
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
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
        {
          key: SpeakerImageKey.STARTER_3_MONKEY,
          displayName: 'Monkeg',
        },
      ],
      id: 'monkeg_choice',
      text: "That's a Monkeg! It may prefer hiding in its barrel right now, but it's a natural navigator. Should I choose it?",
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
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: 'Caleb',
        },
      ],
      id: 'after_starter_choice',
      text: "A Captain is nothing without a loyal First Mate! I've made my choice!",
    },
    {
      text: "***A fancy new pet? Too bad it's stuck with a weak little kid giving the orders. Senticle, crush 'em both!",
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
