import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ENEMY_ABILITY_DEFS,
  type EnemyAbilityDefinition,
} from '@/engine/tower-defense/enemyAbilities';

import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { TD_LEVELS } from '@/constants/tdLevels';
import type { UnitSpriteConfig } from '@/types/baseGame';

function nonnegative(value: number, context: string) {
  expect(Number.isFinite(value), context).toBe(true);
  expect(value, context).toBeGreaterThanOrEqual(0);
}
function positiveCount(value: number, context: string) {
  expect(Number.isInteger(value), context).toBe(true);
  expect(value, context).toBeGreaterThan(0);
}

describe.each(Object.entries(ENEMY_ABILITY_DEFS))(
  '%s enemy ability registration',
  (id: string, ability: EnemyAbilityDefinition) => {
    it('has usable activation settings for an implemented mechanic', () => {
      expect(ability.id).toBe(id);
      for (const [field, value] of Object.entries(ability)) {
        if (typeof value === 'number')
          expect(Number.isFinite(value), `${id} ${field}`).toBe(true);
      }
      expect([
        'ALLY_SPEED_BOOST',
        'SELF_DEFENSE_BOOST',
        'PROXIMITY_HOWL_SPEED_STACK',
        'TOWER_GROUND_ORB',
      ]).toContain(ability.type);
      nonnegative(ability.initialCooldownMs, `${id} initial cooldown`);
      if ('cooldownMs' in ability)
        nonnegative(ability.cooldownMs, `${id} cooldown`);
      switch (ability.type) {
        case 'ALLY_SPEED_BOOST':
          nonnegative(ability.durationMs, `${id} duration`);
          expect(ability.speedMultiplier).toBeGreaterThan(1);
          break;
        case 'SELF_DEFENSE_BOOST':
          expect(ability.oncePerFight).toBe(true);
          expect(ability.defenseMultiplier).toBeGreaterThanOrEqual(1);
          expect(ability.specialDefenseMultiplier).toBeGreaterThanOrEqual(1);
          break;
        case 'PROXIMITY_HOWL_SPEED_STACK':
          expect(
            COSMOID_TEMPLATES[ability.targetCreatureId],
            `${id} target species`
          ).toBeDefined();
          expect(
            CREATURE_TD_CONFIGS[ability.triggerCaptureUnitTdConfigId],
            `${id} trigger visuals`
          ).toBeDefined();
          nonnegative(ability.triggerRadius, `${id} radius`);
          nonnegative(
            ability.speedIncreasePerActivation,
            `${id} speed increment`
          );
          expect(ability.maxSpeedMultiplier).toBeGreaterThanOrEqual(1);
          expect(ability.retreatSpeedMultiplier).toBeGreaterThan(0);
          positiveCount(ability.maxActivations, `${id} activation limit`);
          break;
        case 'TOWER_GROUND_ORB':
          for (const key of [
            'projectileTravelMs',
            'aimDurationMs',
            'paralysisDurationMs',
            'impactRadius',
          ] as const)
            nonnegative(ability[key], `${id} ${key}`);
          expect(ability.paralysisAttackSpeedMultiplier).toBeGreaterThan(0);
          expect(ability.paralysisAttackSpeedMultiplier).toBeLessThanOrEqual(1);
          positiveCount(ability.targetCount, `${id} target count`);
          if (ability.cursedTargetCount !== undefined)
            positiveCount(
              ability.cursedTargetCount,
              `${id} cursed target count`
            );
      }
    });
    it('keeps enemy abilities separate from player attacks and learnsets', () => {
      expect(typeof id).toBe('string');
      for (const template of Object.values(COSMOID_TEMPLATES)) {
        expect(
          template.learnableAttacks.every((move) =>
            Number.isSafeInteger(move.attackId)
          ),
          `${template.id}: player moves use numeric attack identities`
        ).toBe(true);
      }
    });
    it('references registered visual effects and shipped assets', () => {
      const visuals = CREATURE_TD_CONFIGS[ability.visualEffectConfigId];
      expect(visuals, `${id} visuals`).toBeDefined();
      const configurations: UnitSpriteConfig[] = Object.values(visuals);
      for (const visual of configurations) {
        const urls = [
          visual.url,
          ...(visual.vfxAnimation?.layers?.map((layer) => layer.url) ?? []),
        ];
        for (const url of urls) {
          if (!url) continue;
          expect(url).toMatch(/^\/(?!\/)/);
          expect(
            existsSync(join(process.cwd(), 'public', url.replace(/^\/+/, ''))),
            `${id}: missing ${url}`
          ).toBe(true);
        }
      }
    });
  }
);

describe.each(Object.entries(TD_LEVELS))(
  '%s enemy ability references',
  (id, { levelData }) => {
    it('uses registered abilities for every configured enemy variant', () => {
      for (const enemy of levelData.waveEnemyDefinitions ?? []) {
        if (enemy.abilityId)
          expect(
            ENEMY_ABILITY_DEFS[enemy.abilityId],
            `${id}/${enemy.id}: unknown ability`
          ).toBeDefined();
      }
    });
  }
);
