import {
  DialogConfig,
  SpeakerImageKey,
  Screens,
  BackgroundImageKey,
} from "@/types/baseGame";

export const ISLAND_VICTORY_DIALOGS: Record<string, DialogConfig> = {
  home_shore: {
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
      screen: Screens.LEVEL_SELECT,
    },
  },
};
