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
} from "@/constants/dialogs";
import { ISLANDS } from "@/constants/game";

function getIslandKey(islandId: number): string {
  const island = ISLANDS.find((i) => i.id === islandId);
  if (!island) return "";
  return island.name.toLowerCase().replace(/ /g, "_");
}

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

  if (
    context === DialogContext.ISLAND_INTRO &&
    contextData?.islandId !== undefined
  ) {
    const key = getIslandKey(contextData.islandId);
    return (
      (ISLAND_INTRO_DIALOGS as Record<string, DialogConfig>)[key] || {
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
    const key = getIslandKey(contextData.islandId);
    return (
      (ISLAND_VICTORY_DIALOGS as Record<string, DialogConfig>)[key] || {
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
    const key = getIslandKey(contextData.islandId);
    return (
      (ISLAND_DEFEAT_DIALOGS as Record<string, DialogConfig>)[key] || {
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
