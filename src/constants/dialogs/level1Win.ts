import { DialogConfig, BackgroundImageKey, SpeakerImageKey } from "@/types/baseGame";



export const LEVEL_1_WIN: DialogConfig = {
  "sequence": [
    {
      "text": "I lost!",
      "portraits": [
        {
          "key": SpeakerImageKey.PIRATE_GRUNT_JOE_ANGRY,
          "displayName": "Guide"
        }
      ]
    }
  ],
  "backgroundImageKey": BackgroundImageKey.DEFAULT
};