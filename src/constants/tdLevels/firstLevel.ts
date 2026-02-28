import { TDLevelData } from '@/engine/tower-defense/types';

export const FIRST_LEVEL: TDLevelData = {
  "paths": [
    [
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
    [
      {
        "x": 99.65,
        "y": 69.08
      },
      {
        "x": 12.99,
        "y": 69.68
      },
      {
        "x": 13.15,
        "y": 59.46
      },
      {
        "x": 0,
        "y": 59.22
      }
    ]
  ],
  "placementSpots": [
    {
      "x": 63.6,
      "y": 88.58
    },
    {
      "x": 39.6,
      "y": 32.75
    },
    {
      "x": 37.93,
      "y": 89.32
    },
    {
      "x": 63.73,
      "y": 33.59
    }
  ],
  "waves": [
    {
      "id": "wave_1771807082096",
      "groups": [
        {
          "definitionId": "senticle",
          "count": 1,
          "spawnIntervalMs": 1500,
          "delayBeforeGroupMs": 100,
          "pathIndex": 0
        },
        {
          "definitionId": "bug_stage_1",
          "count": 2,
          "spawnIntervalMs": 1500,
          "delayBeforeGroupMs": 3000,
          "pathIndex": 0
        },
        {
          "definitionId": "bug_stage_1",
          "count": 3,
          "spawnIntervalMs": 1500,
          "delayBeforeGroupMs": 3000,
          "pathIndex": 1
        },
        {
          "definitionId": "senticle",
          "count": 5,
          "spawnIntervalMs": 1500,
          "delayBeforeGroupMs": 3000,
          "pathIndex": 1
        }
      ]
    }
  ],
  "surviveUntil": 60
};

