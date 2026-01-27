import {
  DialogConfig,
  SpeakerImageKey,
  BackgroundImageKey,
} from "@/types/baseGame";

export const NEW_PLAYER_WELCOME_DIALOG: DialogConfig = {
  sequence: [
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "On the morning of Caleb's birthday, in the small coastal town of Seabreeze...",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "...",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      text: "Up with the sun? Usually I can't get you out of bed at all.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "It's special today, Grandpa. They said they'd be back.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      text: "The sea is unpredictable, Caleb. But don't worry, they didn't forget.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
        {
          key: SpeakerImageKey.STARTER_CHEST_CLOSED,
          displayName: "Birthday Chest",
        },
      ],
      text: "They sent your gift ahead of time. Just in case.",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "Grandpa hands Caleb a small wooden chest.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: "Caleb",
        },
        {
          key: SpeakerImageKey.STARTER_CHEST_OPEN,
          displayName: "Birthday Chest",
        },
      ],
      text: "Are these...?",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      text: "Yes, Cosmoid doubloons. As the tradition goes, you must pick one out of the three.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.STARTER_1_CRAB,
          displayName: "Palmit",
        },
        {
          key: SpeakerImageKey.STARTER_2_IGUANA,
          displayName: "Fueguana",
          portraitWidth: "wide",
        },
        {
          key: SpeakerImageKey.STARTER_3_MONKEY,
          displayName: "Monkeg",
        },
      ],
      id: "starter_choice",
      text: "Pick your starter Cosmoid!",
      buttons: [
        {
          label: "Palmit",
          type: "grass",
          jumpToLineId: "palmit_choice",
        },
        {
          label: "Fueguana",
          type: "fire",
          jumpToLineId: "fueguana_choice",
        },
        {
          label: "Monkeg",
          type: "water",
          jumpToLineId: "monkeg_choice",
        },
      ],
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
        {
          key: SpeakerImageKey.STARTER_1_CRAB,
          displayName: "Palmit",
        },
      ],
      id: "palmit_choice",
      text: "A sturdy choice! It has prepared its own coconut raft to brave the salt water. So, are you sure you want to choose Palmit?",
      buttons: [
        {
          label: "Yes",
          type: "confirm",
          jumpToLineId: "after_starter_choice",
          action: {
            type: "PROCESS_EVENT",
            payload: {
              event: {
                type: "PICK_STARTER",
                payload: { creatureId: "starter_grass" },
              },
            },
          },
        },
        {
          label: "No",
          type: "cancel",
          jumpToLineId: "starter_choice",
        },
      ],
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
        {
          key: SpeakerImageKey.STARTER_2_IGUANA,
          displayName: "Fueguana",
          portraitWidth: "wide",
        },
      ],
      id: "fueguana_choice",
      text: "Oho, a fiery spirit! It has a knack for mischief and gunpowder. So, are you sure you want to choose Fueguana?",
      buttons: [
        {
          label: "Yes",
          type: "confirm",
          jumpToLineId: "after_starter_choice",
          action: {
            type: "PROCESS_EVENT",
            payload: {
              event: {
                type: "PICK_STARTER",
                payload: { creatureId: "starter_fire" },
              },
            },
          },
        },
        {
          label: "No",
          type: "cancel",
          jumpToLineId: "starter_choice",
        },
      ],
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
        {
          key: SpeakerImageKey.STARTER_3_MONKEY,
          displayName: "Monkeg",
        },
      ],
      id: "monkeg_choice",
      text: "Ah, the shy stowaway. It may prefer hiding in its barrel right now, but it's a loyal navigator. So, are you sure you want to choose Monkeg?",
      buttons: [
        {
          label: "Yes",
          type: "confirm",
          jumpToLineId: "after_starter_choice",
          action: {
            type: "PROCESS_EVENT",
            payload: {
              event: {
                type: "PICK_STARTER",
                payload: { creatureId: "starter_water" },
              },
            },
          },
        },
        {
          label: "No",
          type: "cancel",
          jumpToLineId: "starter_choice",
        },
      ],
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      id: "after_starter_choice",
      text: "A fine choice! I know you two will look out for each other. Now, hold that doubloon tight, Caleb... your journey officially beg-",
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
};




