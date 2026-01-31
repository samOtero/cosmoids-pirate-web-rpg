import { DialogConfig, BackgroundImageKey, SpeakerImageKey } from "@/types/baseGame";



export const STARTER_BATTLE_LOSE: DialogConfig = {
  "sequence": [
    {
      "text": "Told you, kid… I’m not losing my life over some brat. That bird is coming with me!",
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