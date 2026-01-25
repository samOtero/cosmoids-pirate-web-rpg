import { DialogConfig, BackgroundImageKey, SpeakerImageKey } from "@/types/baseGame";



export const STARTER_BATTLE_LOSE: DialogConfig = {
  "sequence": [
    {
      "text": "Hah! Like I said... child's play.",
      "portraits": [
        {
          "key": SpeakerImageKey.PIRATE_GRUNT_JOE_SMIRK,
          "displayName": "Grunt Pirate Joe"
        }
      ]
    }
  ],
  "backgroundImageKey": BackgroundImageKey.FIRST_TOWN_DOCKS
};