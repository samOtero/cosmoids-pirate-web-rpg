import { TDLevelData } from '@/engine/tower-defense/types';

export const FIRST_LEVEL: TDLevelData = {
  "path": [
    {
      "x": 100,
      "y": 46.71
    },
    {
      "x": 53.8,
      "y": 45.74
    },
    {
      "x": 12.92,
      "y": 46.11
    },
    {
      "x": 12.76,
      "y": 58.62
    },
    {
      "x": 0,
      "y": 58.38
    }
  ],
  "placementSpots": [
    {
      "x": 74.9,
      "y": 84.36
    },
    {
      "x": 51.63,
      "y": 31.91
    },
    {
      "x": 51.32,
      "y": 84.24
    },
    {
      "x": 75.37,
      "y": 35.04
    },
    {
      "x": 27.89,
      "y": 32.39
    }
  ],
  "waves": [
    {
      "id": "wave_1771807082096",
      "groups": [
        {
          "definitionId": "bug_stage_1",
          "count": 1,
          "spawnIntervalMs": 1500,
          "delayBeforeGroupMs": 100
        },
        {
          "definitionId": "bug_stage_1",
          "count": 2,
          "spawnIntervalMs": 1500,
          "delayBeforeGroupMs": 3000
        },
        {
          "definitionId": "bug_stage_1",
          "count": 3,
          "spawnIntervalMs": 1500,
          "delayBeforeGroupMs": 3000
        },
        {
          "definitionId": "bug_stage_2",
          "count": 5,
          "spawnIntervalMs": 1500,
          "delayBeforeGroupMs": 3000
        }
      ]
    }
  ]
};

