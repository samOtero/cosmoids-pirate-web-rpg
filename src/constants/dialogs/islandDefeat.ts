import {
  DialogConfig,
  SpeakerImageKey,
  Screens,
  BackgroundImageKey,
} from "@/types/baseGame";

export const ISLAND_DEFEAT_DIALOGS: Record<string, DialogConfig> = {
  home_shore: {
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
      screen: Screens.LEVEL_SELECT,
    },
  },
};
