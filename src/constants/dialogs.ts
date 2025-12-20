import {
  DialogConfig,
  SpeakerImageKey,
  Screens,
  BackgroundImageKey,
  DialogContext,
  Creature,
  ElementType,
} from "@/types/baseGame";
import { useGameStore } from "@/store/gameStore";

// Helper function to create onClick handler for starter selection that goes to unique dialog
const createStarterDialogHandler = (context: DialogContext) => {
  return () => {
    const { setScreen } = useGameStore.getState();
    setScreen(Screens.DIALOG, context);
  };
};

/**
 * DIALOG BUTTONS FEATURE:
 *
 * You can now add interactive buttons to dialog lines using the `buttons` property.
 * When buttons are present on a line:
 * - The player CANNOT advance to the next line by clicking
 * - Buttons display at the bottom-right of the dialog box
 * - Each button is clickable and triggers its onClick handler
 * - Buttons work similarly to portrait onClick handlers - they prevent auto-advancement
 *
 * BUTTON TYPES (DialogButtonTypeConfig):
 * DialogButtonTypeConfig is a simple object where each key maps directly to styled classes:
 * - "confirm" - Cyan color (default) for affirmative actions
 * - "cancel" - Orange color for rejection/back actions
 * - "fire" - Dark orange for fire element choices
 * - "grass" - Green for grass element choices
 * - "water" - Blue for water element choices
 *
 * Each button type automatically includes pre-configured styling!
 *
 * Example usage in a DialogLine:
 * {
 *   portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
 *   speakerIndex: 0,
 *   text: "Which element do you prefer?",
 *   buttons: [
 *     {
 *       label: "Fire",
 *       type: "fire",
 *       onClick: () => {
 *         // Handle fire selection
 *       }
 *     },
 *     {
 *       label: "Grass",
 *       type: "grass",
 *       onClick: () => {
 *         // Handle grass selection
 *       }
 *     },
 *     {
 *       label: "Water",
 *       type: "water",
 *       onClick: () => {
 *         // Handle water selection
 *       }
 *     },
 *     {
 *       label: "Cancel",
 *       type: "cancel",
 *       onClick: () => {
 *         // Handle cancel
 *       }
 *     }
 *   ]
 * }
 */

// Starter Cosmoid Definitions
export const STARTER_CRAB: Creature = {
  id: "starter_crab",
  name: "Crabby",
  type: ElementType.GRASS,
  maxHp: 35,
  currentHp: 35,
  attack: 40,
  defense: 45,
  speed: 35,
  level: 1,
  xp: 0,
  moves: ["Vine Whip", "Scratch"],
  spriteUrl: "/crab-starter-grass-neutral-skin-1.png",
};

export const STARTER_IGUANA: Creature = {
  id: "starter_iguana",
  name: "Blazy",
  type: ElementType.FIRE,
  maxHp: 35,
  currentHp: 35,
  attack: 45,
  defense: 40,
  speed: 40,
  level: 1,
  xp: 0,
  moves: ["Ember", "Scratch"],
  spriteUrl: "/iguana_starter_fire_neutral_skin_1.png",
};

export const STARTER_MONKEY: Creature = {
  id: "starter_monkey",
  name: "Bubbles",
  type: ElementType.WATER,
  maxHp: 40,
  currentHp: 40,
  attack: 40,
  defense: 40,
  speed: 45,
  level: 1,
  xp: 0,
  moves: ["Bubble Beam", "Scratch"],
  spriteUrl: "/monkey_starter_water_neutral_skin_1.png",
};

// Unique Starter Selection Dialogs

export const STARTER_CRAB_DIALOG: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "Crabby! I choose you as my partner!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.STARTER_1_CRAB,
          displayName: "Crabby",
        },
      ],
      speakerIndex: 0,
      text: "Craaaaab! *clicks claws excitedly*",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "With your grass powers and strong defense, we'll protect everyone we meet!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "A wise choice, lad. Crabby's roots run deep. Now let's set sail!",
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
  next: {
    screen: Screens.MAP,
    contextData: { creatureId: "starter_crab" },
  },
};

export const STARTER_IGUANA_DIALOG: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "Blazy! You're my partner now!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.STARTER_2_IGUANA,
          displayName: "Blazy",
        },
      ],
      speakerIndex: 0,
      text: "*roars with a burst of flame*",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "With your fiery spirit and speed, we'll blaze our way to victory!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "Hot-headed but brave! Just like your father. You two will make a formidable team!",
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
  next: {
    screen: Screens.MAP,
    contextData: { creatureId: "starter_iguana" },
  },
};

export const STARTER_MONKEY_DIALOG: DialogConfig = {
  sequence: [
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "Bubbles! Let's go on an adventure together!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.STARTER_3_MONKEY,
          displayName: "Bubbles",
        },
      ],
      speakerIndex: 0,
      text: "*chatters playfully and bounces*",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "With your water magic and quick reflexes, nothing will stop us!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "Swift as the sea itself! Your mother would be proud of this choice. Now off with you!",
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
  next: {
    screen: Screens.MAP,
    contextData: { creatureId: "starter_monkey" },
  },
};

export const NEW_PLAYER_WELCOME_DIALOG: DialogConfig = {
  sequence: [
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      speakerIndex: 0,
      text: "One sunny morning in the small coastal town of Seabreeze...",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "Caleb! Wake up, you sleepy sea-pup!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "You can't sleep through your own birthday. Not when the Horizon Chaser is due in port any minute!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_YAWN_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "*Yawn* The Horizon Chaser...?",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "Mom! Dad! Did they sound the horn?! Did I miss them docking?!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "Easy now! No horn yet. Go wash your face in the basin, then meet me at the docks. I'll keep an eye out for your folks.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "And fix that mop on your head! You look like a castaway.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "I'm on my way! I can't wait to see what new Cosmoids they brought back!",
    },
  ],
  backgroundImageKey: BackgroundImageKey.CALEB_HOUSE,
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
      speakerIndex: 0,
      text: "A few minutes later, at the docks...",
      buttons: [
        {
          label: "Yes",
          type: "confirm",
          onClick: () => {
            const { setScreen } = useGameStore.getState();
            setScreen(Screens.MAP);
          },
        },
        {
          label: "No",
          type: "cancel",
          onClick: () => {
            const { setScreen } = useGameStore.getState();
            setScreen(Screens.MAP);
          },
        },
      ],
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "Grandpa! Do you see them?",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "Hmmph. That's strange. The winds are fair, and your father is never late for a celebration cake...",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_DISAPPOINTED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "They aren't coming, are they...?",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "Now, don't say that...",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_DISAPPOINTED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: 'They said they\'d be here by sunrise. "For sure this time", Dad said in the letter. I guess... I guess finding that Legendary Island was more important than...',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "Don't talk like that, lad. They're probably just chasing a rare Cosmoid. You know how your father gets when he sees something shiny.",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      speakerIndex: 0,
      text: "Suddenly, a high-pitched screech is heard from the sky.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "Grandpa! Watch out! It's coming straight at you!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.HOOKAW_TIRED_BOX_DIVE_SKIN_1,
          displayName: "???",
        },
      ],
      speakerIndex: 0,
      text: "HOOOKAWWWWWWW....",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_SURPRISED_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "By the tides! That's your father's Hookaw!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "Scuttles?!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "What happened to you?",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.HOOKAW_TIRED_BOX_SKIN_1,
          displayName: "Scuttles",
        },
      ],
      speakerIndex: 0,
      text: "*panting*",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "Looks like you flew through a hurricane!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "Are my parents okay?!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.HOOKAW_TIRED_BOX_SKIN_1,
          displayName: "Scuttles",
        },
      ],
      speakerIndex: 0,
      text: "Hookaw.. *panting*",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "Where are they?!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "What's this box for?",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.HOOKAW_TIRED_BOX_SKIN_1,
          displayName: "Scuttles",
        },
      ],
      speakerIndex: 0,
      text: "Hookaw.. HOOKAW... *panting*",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "He's in \"Lockdown Mode.\" He won't deliver the message unless I give the clearance. Your father only uses this for... sensitive matters.",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      speakerIndex: 0,
      text: "Grandpa leans down and whispers into Scuttles' ear.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: '*whispers* "Together we fly, alone we fall"',
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      speakerIndex: 0,
      text: "Scuttles' eyes flash a soft green. The bird drops the box at Caleb's feet and opens its beak to speak.",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      speakerIndex: 0,
      text: "(Dad's voice) Caleb... if you're hearing this, it means we didn't make it to your birthday...",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      speakerIndex: 0,
      text: "(Mom's voice) We are so sorry my muffin! It breaks our hearts to miss this special day...",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "Dad! Mom! Are they okay?!",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      speakerIndex: 0,
      text: "(Dad's voice) Listen carefully, Caleb... We found it! The Isle of Whispers! It's real!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_SCARED_SURPRISED_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "...it's real?",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      speakerIndex: 0,
      text: "(Dad's voice) But... we were followed.. the navy.. or maybe pirates.. we have to hide it.. we can't let them find the isle...",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      speakerIndex: 0,
      text: "(Mom's voice) Caleb.. Don't come looking for us, it's too dangerous! Take this gift from us, it's your birthday gift. Stay safe with Grandpa... We lo-",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      speakerIndex: 0,
      text: "*Dad's voice* WATCH OUT! *CRASHING NOISE* *BZZZZT*",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      speakerIndex: 0,
      text: "Hookaawwwww! Hookawww.. Hook.. *faints*",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "They finally did it... Caleb, you have to-",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: '"Stay safe with Grandpa"? No way.',
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "I've seen that look. The same look your mother had when she sailed off. You're going after them, aren't you?",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "They are in danger! The Navy or Pirates, I don't care who it is.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "NOBODY STOPS MY PARENTS FROM COMING HOME!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "You're just a boy! But... ",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "...you're a boy with salt in his veins. Alright then, lad. Let's get you prepared for a sea voyage.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "But first, let's open this birthday box of yours.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "I wonder what they sent me!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.STARTER_CHEST_CLOSED,
          displayName: "Birthday Chest",
        },
      ],
      speakerIndex: 0,
      text: "*Caleb grabs the small chest-",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.STARTER_CHEST_OPEN,
          displayName: "Birthday Chest",
        },
      ],
      speakerIndex: 0,
      text: "- and opens it*",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
          displayName: "Caleb",
        },
      ],
      speakerIndex: 0,
      text: "Cosmoid doubloons! What kind of Cosmoids do they hold?!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      speakerIndex: 0,
      text: "As the tradition goes, you must pick one doubloon out of the three, choose with your heart.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          displayName: "Caleb",
        },
        {
          key: SpeakerImageKey.STARTER_CHEST_OPEN,
          displayName: "Birthday Chest",
        },
      ],
      speakerIndex: 0,
      text: "Right. With my heart.",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.STARTER_1_CRAB,
          displayName: "Crabby",
          onClick: createStarterDialogHandler(DialogContext.STARTER_CRAB),
        },
        {
          key: SpeakerImageKey.STARTER_2_IGUANA,
          displayName: "Blazy",
          onClick: createStarterDialogHandler(DialogContext.STARTER_IGUANA),
        },
        {
          key: SpeakerImageKey.STARTER_3_MONKEY,
          displayName: "Bubbles",
          onClick: createStarterDialogHandler(DialogContext.STARTER_MONKEY),
        },
      ],
      speakerIndex: 0,
      text: "Pick your starter Cosmoid!",
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
  next: {
    screen: Screens.DIALOG,
    context: DialogContext.GAME_INTRO_PART_2,
    contextData: { islandId: 0 },
  },
};

export const ISLAND_INTRO_DIALOGS: Record<number, DialogConfig> = {
  0: {
    sequence: [
      // Home Shore
      {
        portraits: [
          {
            key: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
            displayName: "Caleb",
          },
        ],
        speakerIndex: 0,
        text: "This is it. The beginning of my journey.",
      },
      {
        portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
        speakerIndex: 0,
        text: "Be careful out there, Caleb. The seas are unpredictable.",
      },
    ],
    backgroundImageKey: BackgroundImageKey.DEFAULT,
    next: {
      screen: Screens.MAP, // TODO: Change to BATTLE when ready
    },
  },
  1: {
    sequence: [
      // Coral Reef
      {
        portraits: [
          {
            key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
            displayName: "Caleb",
          },
        ],
        speakerIndex: 0,
        text: "Wow! Look at the colors!",
      },
    ],
    backgroundImageKey: BackgroundImageKey.DEFAULT,
    next: {
      screen: Screens.MAP,
    },
  },
};

export const ISLAND_VICTORY_DIALOGS: Record<number, DialogConfig> = {
  0: {
    sequence: [
      {
        portraits: [
          {
            key: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
            displayName: "Caleb",
          },
        ],
        speakerIndex: 0,
        text: "I did it! I cleared the Home Shore!",
      },
    ],
    backgroundImageKey: BackgroundImageKey.DEFAULT,
    next: {
      screen: Screens.MAP,
    },
  },
};

export const ISLAND_DEFEAT_DIALOGS: Record<number, DialogConfig> = {
  0: {
    sequence: [
      {
        portraits: [
          {
            key: SpeakerImageKey.CALEB_YAWN_STARTER_OUTFIT,
            displayName: "Caleb",
          },
        ],
        speakerIndex: 0,
        text: "Ouch... that was tough.",
      },
    ],
    backgroundImageKey: BackgroundImageKey.DEFAULT,
    next: {
      screen: Screens.MAP,
    },
  },
};

/**
 * EXAMPLE: Dialog with buttons
 * This demonstrates how to use the buttons feature with different button types.
 * When buttons are present, the player cannot click to advance.
 * Each button can trigger custom actions via its onClick handler.
 */
export const EXAMPLE_DIALOG_WITH_BUTTONS: DialogConfig = {
  sequence: [
    {
      portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
      speakerIndex: 0,
      text: "Choose your path!",
      buttons: [
        {
          label: "Confirm",
          type: "confirm",
          onClick: () => {
            const { setScreen } = useGameStore.getState();
            setScreen(Screens.MAP);
          },
        },
        {
          label: "Cancel",
          type: "cancel",
          onClick: () => {
            const { setScreen } = useGameStore.getState();
            setScreen(Screens.MAP);
          },
        },
      ],
    },
    {
      portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
      speakerIndex: 0,
      text: "Pick an element!",
      buttons: [
        {
          label: "Fire",
          type: "fire",
          onClick: () => {
            // Handle fire selection
          },
        },
        {
          label: "Grass",
          type: "grass",
          onClick: () => {
            // Handle grass selection
          },
        },
        {
          label: "Water",
          type: "water",
          onClick: () => {
            // Handle water selection
          },
        },
      ],
    },
  ],
  backgroundImageKey: BackgroundImageKey.DEFAULT,
  next: {
    screen: Screens.MAP,
  },
};

