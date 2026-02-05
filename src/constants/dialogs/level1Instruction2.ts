import { DialogConfig, BackgroundImageKey, SpeakerImageKey } from "@/types/baseGame";



export const LEVEL_1_INSTRUCTION_2: DialogConfig = {
  "sequence": [
    {
      "text": "Don't just stand there, you oversized slug! Use Crushing Bite!",
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