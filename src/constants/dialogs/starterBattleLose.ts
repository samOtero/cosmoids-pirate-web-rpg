import { DialogConfig, BackgroundImageKey, SpeakerImageKey } from "@/types/baseGame";



export const STARTER_BATTLE_LOSE: DialogConfig = {
  "sequence": [
    {
      "text": "Huff... See? Did you really think... a kid could stop me?",
      "portraits": [
        {
          "key": SpeakerImageKey.PIRATE_GRUNT_JOE_SMIRK,
          "displayName": "Grunt Pirate Joe"
        }
      ]
    },
    {
      "text": "I... I knew it. I’m not strong enough... I’m sorry, Scuttles...",
      "portraits": [
        {
          "key": SpeakerImageKey.CALEB_DISAPPOINTED_STARTER_OUTFIT,
          "displayName": "Caleb"
        }
      ]
    }
  ],
  "backgroundImageKey": BackgroundImageKey.FIRST_TOWN_DOCKS
};