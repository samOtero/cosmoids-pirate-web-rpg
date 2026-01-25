import {
  DialogContext,
  BackgroundImageKey,
  DialogConfig,
  Screens,
} from "@/types/baseGame";
import * as AllDialogs from "@/constants/dialogs";
import { ISLANDS } from "@/constants/game";

function getIslandKey(islandId: number): string {
  const island = ISLANDS.find((i) => i.id === islandId);
  if (!island) return "";
  return island.name.toLowerCase().replace(/ /g, "_");
}

function getDefaultDialog(): DialogConfig {
  return {
    sequence: [],
    backgroundImageKey: BackgroundImageKey.DEFAULT,
    next: {
      screen: Screens.MAP,
    },
  };
}

export function resolveDialog(
  context: DialogContext | null,
  contextData: { islandId?: number } | null
): DialogConfig {
  // 1. Explicit Mappings for Legacy Dialogs
  if (context === DialogContext.GAME_INTRO) {
    return AllDialogs.NEW_PLAYER_WELCOME_DIALOG;
  }



  if (context === DialogContext.GAME_INTRO_AFTER_STARTER) {
    return AllDialogs.AFTER_STARTER_CHOICE_DIALOG;
  }


  // 3. Dynamic Lookup
  // Attempts to find a dialog export matching the Context key
  // This supports new dialogs added via the editor where ContextKey matches ExportName
  if (context && context in AllDialogs) {
    return (AllDialogs as any)[context] as DialogConfig;
  }

  return getDefaultDialog();
}
