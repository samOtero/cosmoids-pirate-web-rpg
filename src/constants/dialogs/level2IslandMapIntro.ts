import { DialogConfig, BackgroundImageKey, SpeakerImageKey } from "@/types/baseGame";



export const LEVEL_2_ISLAND_MAP_INTRO: DialogConfig = {
  "sequence": [
    {
      "text": "There.. the edge of the woods! We need to find Mara before it's too late!",
      "portraits": [
        {
          "key": SpeakerImageKey.GRANDPA_NEUTRAL_STARTER_OUTFIT,
          "displayName": "Grandpa"
        }
      ],
      "layout": "battle-left"
    }
  ],
  "backgroundImageKey": BackgroundImageKey.DEFAULT
};