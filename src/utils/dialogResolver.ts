import {
  DialogContext,
  BackgroundImageKey,
  DialogConfig,
  Screens,
} from "@/types/baseGame";
import {
  NEW_PLAYER_WELCOME_DIALOG,
  ISLAND_INTRO_DIALOGS,
  ISLAND_VICTORY_DIALOGS,
  ISLAND_DEFEAT_DIALOGS,
} from "@/constants/dialogs";

export function resolveDialog(
  context: DialogContext | null,
  contextData: { islandId?: number } | null
): DialogConfig {
  if (context === DialogContext.GAME_INTRO) {
    return NEW_PLAYER_WELCOME_DIALOG;
  }

  if (
    context === DialogContext.ISLAND_INTRO &&
    contextData?.islandId !== undefined
  ) {
    return (
      ISLAND_INTRO_DIALOGS[contextData.islandId] || {
        sequence: [],
        backgroundImageKey: BackgroundImageKey.DEFAULT,
        next: { screen: Screens.MAP },
      }
    );
  }

  if (
    context === DialogContext.ISLAND_VICTORY &&
    contextData?.islandId !== undefined
  ) {
    return (
      ISLAND_VICTORY_DIALOGS[contextData.islandId] || {
        sequence: [],
        backgroundImageKey: BackgroundImageKey.DEFAULT,
        next: { screen: Screens.MAP },
      }
    );
  }

  if (
    context === DialogContext.ISLAND_DEFEAT &&
    contextData?.islandId !== undefined
  ) {
    return (
      ISLAND_DEFEAT_DIALOGS[contextData.islandId] || {
        sequence: [],
        backgroundImageKey: BackgroundImageKey.DEFAULT,
        next: { screen: Screens.MAP },
      }
    );
  }

  return {
    sequence: [],
    backgroundImageKey: BackgroundImageKey.DEFAULT,
    next: {
      screen: Screens.MAP,
    },
  };
}
