import { COSMOID_TEMPLATES } from './creatures';
import { AttackId, SpeciesId } from '@/types/definitionIds';
import { PlayerCreature } from '@/types/baseGame';
import { TDLevelData } from '@/engine/tower-defense/types';
import { GUEST_OWNER_ID } from '@/utils/creatureOwnership';
import { RUN_ATTACK_DEFS } from '@/engine/roguelite/attacks/definitions';

export const RUN_WAVES = 8;
export const RUN_COINS = 5;
export const RUN_TEAM_LIMIT = 4;

// Species stats remain in their registry. Fueguana has independent run moves;
// the other prototype partners still use their own natural story moves.
export const RUN_PARTNERS = [
  {
    speciesId: SpeciesId.FUEGUANA,
    attackId: AttackId.ROGUELITE_FIRE_CLAW,
    starter: true,
    role: 'Choose a starting Fire pattern: claw sweeps, aimed cinders, piercing breath, or lobbed bombs.',
  },
  {
    speciesId: SpeciesId.MONKEG,
    attackId: AttackId.BARREL_BASH,
    starter: true,
    role: 'Barrel impacts push nearby enemies back into your defense.',
  },
  {
    speciesId: SpeciesId.PALMIT,
    attackId: AttackId.COIR_SNAP,
    starter: true,
    role: 'Repeated husk shots briefly bind enemies for the team.',
  },
  {
    speciesId: SpeciesId.MAROPHIS,
    attackId: AttackId.VENOM_SPRAY,
    starter: false,
    role: 'Stacks venom. Its poison also prepares targets for Siphon Lash.',
  },
  {
    speciesId: SpeciesId.BUFFLORA,
    attackId: AttackId.NECTAR_SIPHON,
    starter: false,
    role: 'Siphon Lash targets poisoned enemies for stronger hits.',
  },
] as const;

export function createRunCreature(
  speciesId: SpeciesId,
  serial: number,
  startingAttack?: number
): PlayerCreature {
  const partner = RUN_PARTNERS.find((entry) => entry.speciesId === speciesId);
  if (!partner || !COSMOID_TEMPLATES[speciesId])
    throw new Error('Unknown run partner');
  const attackId = startingAttack ?? partner.attackId;
  if (
    speciesId === SpeciesId.FUEGUANA
      ? !RUN_ATTACK_DEFS[attackId]
      : attackId !== partner.attackId
  )
    throw new Error('Move is not available to this run partner');
  return {
    id: `run_partner_${serial}`,
    originalOwnerId: GUEST_OWNER_ID,
    speciesId,
    level: 12,
    xp: 0,
    gender: 'female',
    isShiny: false,
    equippedAttacks: [attackId],
    activeAttackIndex: 0,
    targetingMode: 'first',
  };
}

export const RUN_POSITIONS = [
  { x: 38, y: 37 },
  { x: 62, y: 37 },
  { x: 38, y: 62 },
  { x: 62, y: 62 },
  { x: 20, y: 40 },
  { x: 80, y: 40 },
  { x: 41, y: 81 },
  { x: 59, y: 81 },
  // Aligned positions give fixed-direction breath a clear lane through center.
  { x: 50, y: 22 },
  { x: 50, y: 68 },
];

export function getRunLaneCount(wave: number): number {
  return wave < 3 ? 1 : wave < 5 ? 2 : 3;
}

export function createRunLevel(wave: number, coins: number): TDLevelData {
  const laneCount = getRunLaneCount(wave);
  // Sustain combat before each reward; later waves extend the defense as well
  // as tightening the cadence. Duration is supplied by real spawns, not a wait
  // after the last enemy has died.
  const spawnWindowMs = 45000 + (wave - 1) * 3000;
  const spawnIntervalMs = Math.max(850, 1900 - wave * 90);
  const countPerLane = Math.ceil(spawnWindowMs / spawnIntervalMs);
  return {
    paths: [
      [
        { x: 0, y: 30 },
        { x: 30, y: 30 },
        { x: 30, y: 50 },
        { x: 50, y: 50 },
      ],
      [
        { x: 100, y: 30 },
        { x: 70, y: 30 },
        { x: 70, y: 50 },
        { x: 50, y: 50 },
      ],
      [
        { x: 50, y: 100 },
        { x: 50, y: 75 },
        { x: 50, y: 50 },
      ],
    ],
    placementSpots: RUN_POSITIONS.map((spot) => ({ ...spot })),
    captureUnits: Array.from({ length: coins }, (_, index) => ({
      tdConfigId: 'coin_1',
      position: { x: 48 + (index % 3) * 2, y: 49 + Math.floor(index / 3) * 2 },
    })),
    disableCapture: true,
    backgroundUrl: '/battles/bg/roguelite_clearing.svg',
    fitToScreen: true,
    waveEnemyDefinitions: [
      {
        id: 'run_scout',
        creatureId: SpeciesId.KNOTIA,
        level: 5 + wave,
        hpMultiplier: 0.65 + wave * 0.06,
        speedMultiplier: 0.75,
      },
      {
        id: 'run_runner',
        creatureId: SpeciesId.RAZCALL,
        level: 5 + wave,
        hpMultiplier: 0.6 + wave * 0.05,
        speedMultiplier: 1,
      },
      {
        id: 'run_elite',
        creatureId: SpeciesId.TIGREVEL,
        level: 12,
        hpMultiplier: 3.5,
        speedMultiplier: 0.65,
      },
    ],
    waves: [
      {
        id: `run_wave_${wave}`,
        groups: [
          ...Array.from({ length: laneCount }, (_, pathIndex) => ({
            enemyDefinitionId:
              wave >= 4 && pathIndex === 1 ? 'run_runner' : 'run_scout',
            count: countPerLane,
            spawnIntervalMs,
            delayBeforeGroupMs: pathIndex * 900,
            pathIndex,
            turnAroundAtEnd: true,
            concurrentWithPrevious: pathIndex > 0,
            uncapturable: true,
          })),
          ...(wave === RUN_WAVES
            ? [
                {
                  enemyDefinitionId: 'run_elite',
                  count: 1,
                  spawnIntervalMs: 1000,
                  delayBeforeGroupMs: Math.floor(spawnWindowMs * 0.8),
                  pathIndex: 2,
                  turnAroundAtEnd: true,
                  concurrentWithPrevious: true,
                  uncapturable: true,
                },
              ]
            : []),
        ],
      },
    ],
  };
}
