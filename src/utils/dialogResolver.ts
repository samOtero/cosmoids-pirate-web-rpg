import {
  DialogContext,
  DialogLine,
  BackgroundImageKey,
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
): {
  sequence: DialogLine[];
  backgroundImageKey: BackgroundImageKey;
} {
  if (context === DialogContext.GAME_INTRO) {
    return {
      sequence: NEW_PLAYER_WELCOME_DIALOG,
      backgroundImageKey: BackgroundImageKey.CALEB_HOUSE,
    };
  }

  if (
    context === DialogContext.ISLAND_INTRO &&
    contextData?.islandId !== undefined
  ) {
    const sequence = ISLAND_INTRO_DIALOGS[contextData.islandId] || [];
    return {
      sequence,
      backgroundImageKey: BackgroundImageKey.DEFAULT,
    };
  }

  if (
    context === DialogContext.ISLAND_VICTORY &&
    contextData?.islandId !== undefined
  ) {
    const sequence = ISLAND_VICTORY_DIALOGS[contextData.islandId] || [];
    return {
      sequence,
      backgroundImageKey: BackgroundImageKey.DEFAULT,
    };
  }

  if (
    context === DialogContext.ISLAND_DEFEAT &&
    contextData?.islandId !== undefined
  ) {
    const sequence = ISLAND_DEFEAT_DIALOGS[contextData.islandId] || [];
    return {
      sequence,
      backgroundImageKey: BackgroundImageKey.DEFAULT,
    };
  }

  return {
    sequence: [],
    backgroundImageKey: BackgroundImageKey.DEFAULT,
  };
}
