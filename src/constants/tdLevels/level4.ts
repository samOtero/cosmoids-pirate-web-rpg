import { TDLevelData } from '@/engine/tower-defense/types';
import { VANE_LEVEL } from './vaneLevel';

const MARKET_POSITION_WEST = { x: 26.8, y: 50 };
const MARKET_POSITION_CENTER = { x: 47, y: 50 };
const MARKET_POSITION_EAST = { x: 70.6, y: 50 };

/**
 * Level 4 stays inside one navy-controlled market block. Mari advances to a
 * new delivery position after each cleared wave, while the unchecked wild
 * Sonarion line enters through a new pair of increasingly divided routes.
 */
export const LEVEL_4: TDLevelData = {
  paths: [
    // 1: simple northwest approach to the western market position.
    [
      { x: 11.8, y: -3 },
      { x: 11.8, y: 29 },
      { x: 26.8, y: 29 },
      MARKET_POSITION_WEST,
    ],
    // 2: simple southwest approach sharing the western defense pocket.
    [
      { x: 11.2, y: 103 },
      { x: 16.5, y: 103 },
      { x: 16.5, y: 82 },
      { x: 26.8, y: 82 },
      MARKET_POSITION_WEST,
    ],
    // 3: northern switchback around the fountain market stalls.
    [
      { x: 46, y: -3 },
      { x: 46, y: 16 },
      { x: 40, y: 16 },
      { x: 40, y: 31 },
      { x: 55, y: 31 },
      { x: 55, y: 50 },
      MARKET_POSITION_CENTER,
    ],
    // 4: southern switchback that only briefly crosses earlier coverage.
    [
      { x: 47, y: 103 },
      { x: 47, y: 83 },
      { x: 52, y: 83 },
      { x: 52, y: 72 },
      { x: 47, y: 72 },
      MARKET_POSITION_CENTER,
    ],
    // 5: short upper loading-yard route with limited shared coverage.
    [
      { x: 86.5, y: -3 },
      { x: 86.5, y: 20 },
      { x: 83.5, y: 20 },
      { x: 83.5, y: 27 },
      { x: 70.6, y: 27 },
      MARKET_POSITION_EAST,
    ],
    // 6: long lower loading-yard switchback that converges at the last turn.
    [
      { x: 89.6, y: 103 },
      { x: 89.6, y: 80 },
      { x: 83.5, y: 80 },
      { x: 83.5, y: 72 },
      { x: 74, y: 72 },
      { x: 74, y: 63 },
      { x: 78, y: 63 },
      { x: 78, y: 57 },
      { x: 70.6, y: 57 },
      MARKET_POSITION_EAST,
    ],
  ],
  placementSpots: [
    { x: 28, y: 24 },
    { x: 38, y: 23 },
    { x: 88, y: 25 },
    { x: 28, y: 42 },
    { x: 38, y: 39 },
    { x: 70, y: 41 },
    { x: 24, y: 57 },
    { x: 25, y: 74 },
    { x: 88, y: 78 },
  ],
  environmentUnits: [
    {
      position: { x: 31, y: 53 },
      tdConfigId: 'caleb_battle',
      facingDirection: 'right',
    },
    {
      position: { x: 34, y: 54 },
      tdConfigId: 'kip_battle',
      facingDirection: 'right',
    },
  ],
  startingTowers: VANE_LEVEL.startingTowers?.map((tower) => ({
    ...tower,
    position: { x: 40, y: 55 },
  })),
  captureUnits: [
    {
      position: MARKET_POSITION_WEST,
      tdConfigId: 'maribel_capture',
      returnHome: {
        pathIndex: 0,
        speed: 2,
        delayMs: 500,
      },
      waveRelocations: [
        {
          afterWaveIndex: 0,
          path: [MARKET_POSITION_WEST, MARKET_POSITION_CENTER],
          speed: 7,
        },
        {
          afterWaveIndex: 1,
          path: [MARKET_POSITION_CENTER, MARKET_POSITION_EAST],
          speed: 7,
        },
      ],
    },
  ],
  waveEnemyDefinitions: [
    {
      id: 'ironbell_sonarion',
      creatureId: 'sonarion',
      level: 5,
      speedMultiplier: 1.7,
      hpMultiplier: 2,
      canCarryCaptureUnits: false,
    },
    {
      id: 'ironbell_resonarion',
      creatureId: 'resonarion',
      level: 8,
      speedMultiplier: 1.15,
      hpMultiplier: 4,
    },
  ],
  waves: [
    {
      id: 'market_west',
      groups: [
        {
          enemyDefinitionId: 'ironbell_sonarion',
          count: 4,
          spawnIntervalMs: 1300,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'ironbell_sonarion',
          count: 4,
          spawnIntervalMs: 1300,
          delayBeforeGroupMs: 900,
          pathIndex: 1,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
        },
        {
          enemyDefinitionId: 'ironbell_resonarion',
          count: 1,
          spawnIntervalMs: 1500,
          delayBeforeGroupMs: 3200,
          pathIndex: 0,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
        },
      ],
    },
    {
      id: 'market_center',
      groups: [
        {
          enemyDefinitionId: 'ironbell_sonarion',
          count: 6,
          spawnIntervalMs: 1050,
          delayBeforeGroupMs: 250,
          pathIndex: 2,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'ironbell_sonarion',
          count: 6,
          spawnIntervalMs: 1050,
          delayBeforeGroupMs: 900,
          pathIndex: 3,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
        },
        {
          enemyDefinitionId: 'ironbell_resonarion',
          count: 2,
          spawnIntervalMs: 1800,
          delayBeforeGroupMs: 4000,
          pathIndex: 3,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
        },
      ],
    },
    {
      id: 'market_loading_yard',
      groups: [
        {
          enemyDefinitionId: 'ironbell_sonarion',
          count: 8,
          spawnIntervalMs: 850,
          delayBeforeGroupMs: 250,
          pathIndex: 4,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'ironbell_sonarion',
          count: 8,
          spawnIntervalMs: 850,
          delayBeforeGroupMs: 650,
          pathIndex: 5,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
        },
        {
          enemyDefinitionId: 'ironbell_resonarion',
          count: 2,
          spawnIntervalMs: 1600,
          delayBeforeGroupMs: 3000,
          pathIndex: 4,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
        },
        {
          enemyDefinitionId: 'ironbell_resonarion',
          count: 2,
          spawnIntervalMs: 1600,
          delayBeforeGroupMs: 5200,
          pathIndex: 5,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
        },
      ],
    },
  ],
  enemyHpMultiplier: 2,
  backgroundUrl: '/battles/bg/bg_market_level_4.png',
  backgroundScale: 3,
  initialView: {
    offsetX: 0,
    offsetY: 50,
    zoom: 0.72,
  },
};
