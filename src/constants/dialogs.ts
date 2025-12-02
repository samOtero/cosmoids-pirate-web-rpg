import { DialogLine, SpeakerImageKey } from "@/types/baseGame";

export const NEW_PLAYER_WELCOME_DIALOG: DialogLine[] = [
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
];

export const ISLAND_INTRO_DIALOGS: Record<number, DialogLine[]> = {
  0: [
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
  1: [
    // Coral Reef
    {
      portraitKey: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
      text: "Wow! Look at the colors!",
      displayName: "Caleb",
    },
  ],
};

export const ISLAND_VICTORY_DIALOGS: Record<number, DialogLine[]> = {
  0: [
    {
      portraitKey: SpeakerImageKey.CALEB_HAPPY_STARTER_OUTFIT,
      text: "I did it! I cleared the Home Shore!",
      displayName: "Caleb",
    },
  ],
};

export const ISLAND_DEFEAT_DIALOGS: Record<number, DialogLine[]> = {
  0: [
    {
      portraitKey: SpeakerImageKey.CALEB_YAWN_STARTER_OUTFIT,
      text: "Ouch... that was tough.",
      displayName: "Caleb",
    },
  ],
};
