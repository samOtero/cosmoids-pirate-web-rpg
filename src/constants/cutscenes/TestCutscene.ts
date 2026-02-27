import { CutsceneData } from "@/types/cutscene";

export const TestCutscene: CutsceneData = {
  "id": "d989ca05-e8be-4598-9fac-c2e2440bed77",
  "name": "TestCutscene",
  "backgroundKey": "Forest",
  "durationMs": 5000,
  "units": [
    {
      "id": "27a84ec3-0256-4247-8abb-aceccd914610",
      "speciesId": "starter_iguana",
      "keyframes": [
        {
          "timeMs": 0,
          "x": 613,
          "y": 169,
          "scale": 0.3,
          "facingRight": true,
          "opacity": 1
        },
        {
          "timeMs": 1037,
          "x": 163,
          "y": 325,
          "scale": 0.3,
          "opacity": 1,
          "facingRight": true
        },
        {
          "timeMs": 2255,
          "x": 519,
          "y": 136,
          "scale": 0.3,
          "opacity": 1,
          "facingRight": true
        },
        {
          "timeMs": 3565,
          "x": 666,
          "y": 322,
          "scale": 0.3,
          "opacity": 1,
          "facingRight": true
        }
      ]
    }
  ]
};
