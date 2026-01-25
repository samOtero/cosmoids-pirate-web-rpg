import { BattleConfig, BattleContext, BackgroundImageKey, DialogContext } from "@/types/baseGame";
import { SENTICLE } from "./creatures";

export const BATTLES: Record<BattleContext, BattleConfig> = {
  [BattleContext.FIRST_BATTLE]: {
    enemy: SENTICLE,
    backgroundImageKey: BackgroundImageKey.FIRST_TOWN_DOCKS,
    winEvents: [
      {
        type: "SHOW_DIALOG",
        payload: {
           context: DialogContext.ISLAND_VICTORY, 
           contextData: { creatureId: "senticle" }
        }
      }
    ],
    loseEvents: [
       {
        type: "SHOW_DIALOG",
        payload: {
           context: DialogContext.ISLAND_DEFEAT, 
        }
      }
    ]
  },
};
