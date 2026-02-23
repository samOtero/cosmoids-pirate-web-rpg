import { TDLevelData } from '@/engine/tower-defense/types';

export const FIRST_LEVEL: TDLevelData = {
  "path": [
    {
      "x": 100,
      "y": 20
    },
    {
      "x": 70,
      "y": 20
    },
    {
      "x": 70,
      "y": 80
    },
    {
      "x": 40,
      "y": 80
    },
    {
      "x": 40,
      "y": 20
    },
    {
      "x": 14.97,
      "y": 25.74
    },
    {
      "x": 10,
      "y": 80
    },
    {
      "x": -10,
      "y": 80
    }
  ],
  "placementSpots": [
    {
      "x": 20.52,
      "y": 37.32
    },
    {
      "x": 33.39,
      "y": 35.76
    },
    {
      "x": 46.51,
      "y": 33.59
    },
    {
      "x": 63.39,
      "y": 33.11
    },
    {
      "x": 92.71,
      "y": 33.35
    },
    {
      "x": 17.86,
      "y": 66.44
    },
    {
      "x": 33.13,
      "y": 65.83
    },
    {
      "x": 46.93,
      "y": 66.08
    },
    {
      "x": 63.44,
      "y": 64.99
    },
    {
      "x": 77.03,
      "y": 33.35
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

