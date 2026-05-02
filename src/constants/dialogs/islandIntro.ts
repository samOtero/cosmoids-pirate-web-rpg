import {
  DialogConfig,
  SpeakerImageKey,
  Screens,
  BackgroundImageKey,
} from "@/types/baseGame";

export const ISLAND_INTRO_DIALOGS: Record<string, DialogConfig> = {
  home_shore: {
    sequence: [
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
      screen: Screens.LEVEL_SELECT,
    },
  },
  coral_reef: {
    sequence: [
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
      screen: Screens.LEVEL_SELECT,
    },
  },
};
