import {
  DialogConfig,
  SpeakerImageKey,
  Screens,
  BackgroundImageKey,
} from "@/types/baseGame";

/**
 * EXAMPLE: Dialog with button line jumping
 * This demonstrates how to use line IDs and jumping for branching dialogs.
 * When a button has `jumpToLineId`, clicking it jumps to that line within the same dialog.
 */
export const EXAMPLE_DIALOG_WITH_LINE_JUMPING: DialogConfig = {
  "sequence": [
    {
      "id": "choice_start",
      "portraits": [
        {
          "key": SpeakerImageKey.PIRATE_GRUNT_JOE_ANGRY,
          "displayName": "Guide",
          "portraitWidth": "wide"
        }
      ],
      "text": "Choose your favorite element!",
      "buttons": [
        {
          "label": "Fire",
          "type": "fire",
          "jumpToLineId": "fire_choice"
        },
        {
          "label": "Continue",
          "type": "confirm"
        }
      ]
    },
    {
      "id": "fire_choice",
      "portraits": [
        {
          "key": SpeakerImageKey.GUIDE,
          "displayName": "Guide"
        }
      ],
      "text": "Fire! A passionate choice. Are you sure?",
      "buttons": [
        {
          "label": "Yes, fire for me",
          "type": "confirm",
          "action": {
            "type": "CHANGE_SCREEN",
            "payload": {
              "screen": "MAP"
            }
          }
        },
        {
          "label": "Choose again",
          "type": "cancel",
          "jumpToLineId": "choice_start"
        }
      ]
    },
    {
      "id": "grass_choice",
      "portraits": [
        {
          "key": SpeakerImageKey.GUIDE,
          "displayName": "Guide"
        }
      ],
      "text": "Grass! Nature's choice. Are you sure?",
      "buttons": [
        {
          "label": "Yes, grass for me",
          "type": "confirm",
          "action": {
            "type": "CHANGE_SCREEN",
            "payload": {
              "screen": "MAP"
            }
          }
        },
        {
          "label": "Choose again",
          "type": "cancel",
          "jumpToLineId": "choice_start"
        }
      ]
    },
    {
      "id": "water_choice",
      "portraits": [
        {
          "key": SpeakerImageKey.GUIDE,
          "displayName": "Guide"
        }
      ],
      "text": "Water! A flowing choice. Are you sure?",
      "buttons": [
        {
          "label": "Yes, water for me",
          "type": "confirm",
          "action": {
            "type": "CHANGE_SCREEN",
            "payload": {
              "screen": "MAP"
            }
          }
        },
        {
          "label": "Choose again",
          "type": "cancel",
          "jumpToLineId": "choice_start"
        }
      ]
    }
  ],
  "backgroundImageKey": BackgroundImageKey.FIRST_TOWN_DOCKS,
  "next": {
    "screen": "MAP"
  }
};
