import {
  DialogConfig,
  SpeakerImageKey,
  Screens,
  BackgroundImageKey,
  DialogContext,
} from "@/types/baseGame";

export const NEW_PLAYER_WELCOME_DIALOG: DialogConfig = {
  sequence: [
    {
      portraitKey: SpeakerImageKey.EMPTY,
      text: "One sunny morning in the small coastal town of Seabreeze...",
      displayName: "",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "Caleb! Wake up, you sleepy sea-pup!",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "You can't sleep through your own birthday. Not when the Horizon Chaser is due in port any minute!",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_YAWN_STARTER_OUTFIT,
      text: "*Yawn* The Horizon Chaser...?",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
      text: "Mom! Dad! Did they sound the horn?! Did I miss them docking?!",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "Easy now! No horn yet. Go wash your face in the basin, then meet me at the docks. I'll keep an eye out for your folks.",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "And fix that mop on your head! You look like a castaway.",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
      text: "I'm on my way! I can't wait to see what new Cosmoids they brought back!",
      displayName: "Caleb",
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
      portraitKey: SpeakerImageKey.EMPTY,
      text: "A few minutes later, at the docks...",
      displayName: "",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
      text: "Grandpa! Do you see them?",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "Hmmph. That's strange. The winds are fair, and your father is never late for a celebration cake...",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
      text: "They aren't coming, are they...?",
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "Now, don't say that...",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
      text: 'They said they\'d be here by sunrise. "For sure this time," Dad said in the letter. I guess... I guess finding that Legendary Island was more important than...',
      displayName: "Caleb",
    },
    {
      portraitKey: SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
      text: "Don't talk like that, lad. They're probably just chasing a rare Cosmoid. You know how your father gets when he sees something shiny.",
      displayName: "Grandpa",
    },
    {
      portraitKey: SpeakerImageKey.EMPTY,
      text: "Suddenly, a high-pitched screech is heard from the sky.",
      displayName: "",
    },
    {
      portraitKey: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
      text: "Grandpa! Watch out! It's coming straight at you!",
      displayName: "Caleb",
    },
  ],
  backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
  next: {
    screen: Screens.MAP,
  },
};

export const ISLAND_INTRO_DIALOGS: Record<number, DialogConfig> = {
  0: {
    sequence: [
      // Home Shore
      {
        portraitKey: SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
        text: "This is it. The beginning of my journey.",
        displayName: "Caleb",
      },
      {
        portraitKey: SpeakerImageKey.GUIDE,
        text: "Be careful out there, Caleb. The seas are unpredictable.",
        displayName: "Guide",
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
        portraitKey: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
        text: "Wow! Look at the colors!",
        displayName: "Caleb",
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
        portraitKey: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
        text: "I did it! I cleared the Home Shore!",
        displayName: "Caleb",
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
        portraitKey: SpeakerImageKey.CALEB_YAWN_STARTER_OUTFIT,
        text: "Ouch... that was tough.",
        displayName: "Caleb",
      },
    ],
    backgroundImageKey: BackgroundImageKey.DEFAULT,
    next: {
      screen: Screens.MAP,
    },
  },
};
