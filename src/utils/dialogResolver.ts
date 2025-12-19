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
  NEW_PLAYER_WELCOME_DIALOG_PART_2,
  STARTER_CRAB_DIALOG,
  STARTER_IGUANA_DIALOG,
  STARTER_MONKEY_DIALOG,
} from "@/constants/dialogs";

export function resolveDialog(
  context: DialogContext | null,
  contextData: { islandId?: number } | null
): DialogConfig {
  if (context === DialogContext.GAME_INTRO) {
    return NEW_PLAYER_WELCOME_DIALOG;
  }

  if (context === DialogContext.GAME_INTRO_PART_2) {
    return NEW_PLAYER_WELCOME_DIALOG_PART_2;
  }

  if (context === DialogContext.STARTER_CRAB) {
    return STARTER_CRAB_DIALOG;
  }

  if (context === DialogContext.STARTER_IGUANA) {
    return STARTER_IGUANA_DIALOG;
  }

  if (context === DialogContext.STARTER_MONKEY) {
    return STARTER_MONKEY_DIALOG;
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
