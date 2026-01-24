import { DialogConfig, BackgroundImageKey, SpeakerImageKey } from "@/types/baseGame";



export const TESTING_EDITOR: DialogConfig = {
  "sequence": [
    {
      "text": "New dialog text...",
      "portraits": [
        {
          "key": SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          "displayName": "Guide"
        }
      ]
    },
    {
      "text": "Part two!",
      "portraits": [
        {
          "key": SpeakerImageKey.CALEB_NEUTRAL_STARTER_OUTFIT,
          "displayName": "Guide"
        }
      ]
    }
  ],
  "backgroundImageKey": BackgroundImageKey.CALEB_HOUSE
};