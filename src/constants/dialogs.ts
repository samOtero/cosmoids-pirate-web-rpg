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
 * DIALOG LINE JUMPING FEATURE:
 *
 * You can now add buttons that jump to specific lines within a dialog using the `jumpToLineId` property.
 * This enables branching dialogs where choices can repeat lines, skip ahead, or loop back.
 *
 * LINE NAMING:
 * - Add an optional `id` property to any DialogLine to name that line
 * - Line IDs must be unique within the same dialog
 * - IDs are validated when the dialog loads; duplicates throw an error
 *
 * BUTTON JUMPING:
 * - Add a `jumpToLineId` property to any DialogButton with a target line ID
 * - Jump executes immediately when the button is clicked (before any onClick handler)
 * - Supports jumping backwards (for retries), forwards (to skip), or in any direction
 * - If both `jumpToLineId` and `onClick` are present, jump happens first, then onClick
 *
 * Example usage:
 * {
 *   id: "confirm_choice",
 *   portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
 *   text: "Are you sure about your choice?",
 *   buttons: [
 *     {
 *       label: "Yes, I'm sure",
 *       type: "confirm",
 *       jumpToLineId: "choice_confirmed"
 *     },
 *     {
 *       label: "No, choose again",
 *       type: "cancel",
 *       jumpToLineId: "choice_start"
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
        },
        {
          key: SpeakerImageKey.STARTER_3_MONKEY,
          displayName: "Monkeg",
        },
      ],
      text: "Pick your starter Cosmoid!",
      buttons: [
        {
          label: "Palmit",
          type: "grass",
        },
        {
          label: "Fueguana",
          type: "fire",
        },
        {
          label: "Monkeg",
          type: "water",
        },
      ],
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
          key: SpeakerImageKey.HOOKAW_TIRED_BOX_DIVE_SKIN_1,
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
          key: SpeakerImageKey.HOOKAW_TIRED_BOX_SKIN_1,
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
          key: SpeakerImageKey.HOOKAW_TIRED_BOX_SKIN_1,
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
      text: "Where are my parents?!",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.HOOKAW_TIRED_BOX_SKIN_1,
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
      text: "Scuttles opens its beak to speak. What comes out isn't a bird's squawk.. it is Caleb's father’s voice, perfectly mimicked.",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      text: "(Dad's voice) Caleb... if you're hearing this, it means we didn't make it to your birthday. We are so sorry",
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
      text: "(Mom's voice) We were followed. We have to hide the location. Caleb, do NOT come looking for us. It’s too dangerous.",
    },
    {
      portraits: [
        { key: SpeakerImageKey.HOOKAW_TIRED_SKIN_1, displayName: "Scuttles" },
      ],
      text: "(Mom's voice) Take this chest. It’s your promised birthday gift. Stay safe with Grandpa. We lo—",
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
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      text: "You're just a boy! But... ",
    },
    {
      portraits: [
        {
          key: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          displayName: "Grandpa",
        },
      ],
      text: "...you're a boy with salt in his veins. Alright, lad.",
    },
    {
      portraits: [{ key: SpeakerImageKey.EMPTY, displayName: "" }],
      text: "Grandpa nudges the chest Scuttles dropped toward Caleb.",
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
      text: "If you're going to survive the ocean, you'll need a partner. Open it.",
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
          onClick: () => {
            const { setScreen } = useGameStore.getState();
            setScreen(Screens.MAP);
          },
        },
        {
          label: "No",
          type: "cancel",
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
        text: "This is it. The beginning of my journey.",
      },
      {
        portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
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
 * EXAMPLE: Dialog with button line jumping
 * This demonstrates how to use line IDs and jumping for branching dialogs.
 * When a button has `jumpToLineId`, clicking it jumps to that line within the same dialog.
 */
export const EXAMPLE_DIALOG_WITH_LINE_JUMPING: DialogConfig = {
  sequence: [
    {
      id: "choice_start",
      portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
      text: "Choose your favorite element!",
      buttons: [
        {
          label: "Fire",
          type: "fire",
          jumpToLineId: "fire_choice",
        },
        {
          label: "Grass",
          type: "grass",
          jumpToLineId: "grass_choice",
        },
        {
          label: "Water",
          type: "water",
          jumpToLineId: "water_choice",
        },
      ],
    },
    {
      id: "fire_choice",
      portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
      text: "Fire! A passionate choice. Are you sure?",
      buttons: [
        {
          label: "Yes, fire for me",
          type: "confirm",
          onClick: () => {
            const { setScreen } = useGameStore.getState();
            setScreen(Screens.MAP);
          },
        },
        {
          label: "Choose again",
          type: "cancel",
          jumpToLineId: "choice_start",
        },
      ],
    },
    {
      id: "grass_choice",
      portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
      text: "Grass! Nature's choice. Are you sure?",
      buttons: [
        {
          label: "Yes, grass for me",
          type: "confirm",
          onClick: () => {
            const { setScreen } = useGameStore.getState();
            setScreen(Screens.MAP);
          },
        },
        {
          label: "Choose again",
          type: "cancel",
          jumpToLineId: "choice_start",
        },
      ],
    },
    {
      id: "water_choice",
      portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
      text: "Water! A flowing choice. Are you sure?",
      buttons: [
        {
          label: "Yes, water for me",
          type: "confirm",
          onClick: () => {
            const { setScreen } = useGameStore.getState();
            setScreen(Screens.MAP);
          },
        },
        {
          label: "Choose again",
          type: "cancel",
          jumpToLineId: "choice_start",
        },
      ],
    },
  ],
  backgroundImageKey: BackgroundImageKey.DEFAULT,
  next: {
    screen: Screens.MAP,
  },
};
