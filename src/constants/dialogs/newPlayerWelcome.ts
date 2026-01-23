import {
  DialogConfig,
  SpeakerImageKey,
  Screens,
  BackgroundImageKey,
  DialogContext,
  DialogButtonTypeConfig,
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
      buttons: [
        {
          label: "Yes",
          type: "confirm",
          action: {
            type: "CHANGE_SCREEN",
            payload: { screen: "MAP" },
          },
        },
        {
          label: "[DEBUG] Fight Crab",
          type: "fire",
          action: {
            type: "START_BATTLE",
            payload: { creatureId: "wild_crab" },
          },
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
            type: "PICK_STARTER",
            payload: { creatureId: "starter_grass" },
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
            type: "PICK_STARTER",
            payload: { creatureId: "starter_fire" },
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
            type: "PICK_STARTER",
            payload: { creatureId: "starter_water" },
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
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "Suddenly, a high-pitched screech is heard from the sky.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "Grandpa! Watch out! It's coming straight at you!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.HOOKAW_TIRED_DIVE_SKIN_1,
          displayName: "???",
        },
      ],
      text: "HOOOKAWWWWWWW....!",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "The bird crashes onto the wooden planks, sliding to a halt at Caleb's feet.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "Scuttles?!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1,
          displayName: "Scuttles",
        },
      ],
      text: "Hookaw.. *panting*",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "You look like you flew through a hurricane!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1,
          displayName: "Scuttles",
        },
      ],
      text: "*panting*",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "Where are my parents?! Are they okay?!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1,
          displayName: "Scuttles",
        },
      ],
      text: "Hookaw.. HOOKAW... *panting*",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "Caleb reaches for the bird, but Scuttles snaps his beak shut and hops back defensively.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      text: "He's guarding a message. He won't talk unless we give it right code words. Your father trained him well.",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "Grandpa leans down and whispers into Scuttles' ear.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      text: '*whispers* "Together we fly, alone we fall"',
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "Scuttles opens its beak to speak. What comes out isn't a bird's squawk.. it is Caleb's father's voice, perfectly mimicked.",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      text: "(Dad's voice) Caleb... if you're hearing this, it means we didn't make it to your birthday. We are so sorry...",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      text: "(Dad's voice) But listen carefully... We found it! The Isle of Whispers! It's real!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "...It's real?",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "Scuttles shifts his stance, instantly switching to the soft, urgent tone of Caleb's mother.",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      text: "(Mom's voice) We were followed. We have to hide the location. Caleb, do NOT come looking for us. It's too dangerous.",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      text: "(Mom's voice) I hope you liked your birthday gift. Stay safe with Grandpa. We lo—",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "Suddenly, Scuttles mimics a deafening CRASH—the sound of splintering wood and cannon fire—before letting out a weak, exhausted peep.",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      text: "Hookaawwwww! Hookawww.. Hook.. *faints*",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      text: "They finally did it... Caleb, you have to-",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: '"Stay safe"? No way. I\'m going after them.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      text: "I've seen that look. The same look your mother had when she sailed off.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "They are in danger! The Navy, Pirates or Monsters, I don't care who it is.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "NOBODY STOPS MY PARENTS FROM COMING HOME!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: "",
        },
      ],
      text: "Slow clapping interrupts them. A scruffy man steps from the shadows, eyeing the fainted parrot.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.PIRATE_GRUNT_JOE_SMIRK,
          displayName: "Grunt Pirate Joe",
        },
      ],
      text: "Very touching. But I'll take that bird now. My Captain will pay a great bounty for that message.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "You're not touching Scuttles!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: "",
        },
      ],
      text: "Caleb steps in front of Scuttles.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.PIRATE_GRUNT_JOE_ANGRY,
          displayName: "Grunt Pirate Joe",
        },
      ],
      text: "Have it your way, kid. If you won't hand it over, I'll take it by force!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EMPTY,
          displayName: "",
        },
      ],
      text: "The pirate throws a dark, scratched doubloon onto the dock.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.EEL_SENTICLE,
          displayName: "Senticle",
          portraitWidth: "wide",
        },
        {
          key: SpeakerImageKey.PIRATE_GRUNT_JOE_ANGRY_POINTING,
          displayName: "Grunt Pirate Joe",
          portraitWidth: "wide",
        },
      ],
      text: "Tear him up, Senticle!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      text: "It's a battle, Caleb! Use the gift your parents left you!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      text: "Right... Let's go, partner! I choose YOU!",
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
  next: {
    screen: Screens.DIALOG,
    context: DialogContext.GAME_INTRO_PART_2,
    contextData: { islandId: 0 },
  },
};

export const NEW_PLAYER_WELCOME_DIALOG_PART_2: DialogConfig = {
  sequence: [
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "A few minutes later, at the docks...",
      buttons: [
        {
          label: "Yes",
          type: "confirm",
          action: {
            type: "CHANGE_SCREEN",
            payload: { screen: "MAP" },
          },
        },
        {
          label: "[DEBUG] Fight Crab",
          type: "fire",
          action: {
            type: "START_BATTLE",
            payload: { creatureId: "wild_crab" },
          },
        },
      ],
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
  next: {
    screen: Screens.DIALOG,
    context: DialogContext.GAME_INTRO_PART_2,
    contextData: { islandId: 0 },
  },
};
