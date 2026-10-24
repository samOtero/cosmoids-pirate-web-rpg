import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import {
  createRunCreature,
  createRunLevel,
  RUN_COINS,
  RUN_PARTNERS,
  RUN_WAVES,
} from '@/constants/roguelite';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import {
  RUN_ATTACK_DEFS,
  getRunAttackDefinition,
} from '@/engine/roguelite/attacks/definitions';
import { AttackId } from '@/types/definitionIds';
import { validateDefinitionRegistry } from '@/utils/definitionRegistry';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { validateTDLevelDraft } from '@/utils/tdLevelDraft';

describe('roguelite content references', () => {
  it('uses registered mode moves or existing natural moves and fresh creature instances', () => {
    for (const partner of RUN_PARTNERS) {
      const creature = createRunCreature(partner.speciesId, 1);
      const second = createRunCreature(partner.speciesId, 2);
      const template = COSMOID_TEMPLATES[creature.speciesId];
      expect(template).toBeDefined();
      expect(creature.id).not.toBe(second.id);
      expect(creature.equippedAttacks).not.toBe(second.equippedAttacks);
      for (const attackId of creature.equippedAttacks) {
        expect(getRunAttackDefinition(attackId)).toBeDefined();
        if (RUN_ATTACK_DEFS[attackId]) continue;
        expect(
          template.learnableAttacks.some(
            (node) => node.attackId === attackId && node.level <= creature.level
          )
        ).toBe(true);
      }
    }
  });

  it('keeps run attack identities separate and reuses shipped effect references', () => {
    expect(() =>
      validateDefinitionRegistry('all moves', AttackId, {
        ...ATTACK_DEFS,
        ...RUN_ATTACK_DEFS,
      })
    ).not.toThrow();
    for (const attack of Object.values(RUN_ATTACK_DEFS)) {
      expect(ATTACK_DEFS[attack.id]).toBeUndefined();
      for (const value of [
        attack.power,
        attack.cooldownMs,
        attack.rangeIndex,
        attack.castMs,
      ]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThan(0);
      }
      if (attack.visualEffectConfigId)
        expect(CREATURE_TD_CONFIGS[attack.visualEffectConfigId]).toBeDefined();
      expect(attack.placementHint.length).toBeGreaterThan(0);
    }
  });

  it('generates valid encounter routes and shipped objective/background references for every wave', () => {
    const species = new Set(
      Object.values(COSMOID_TEMPLATES).map((template) => template.id)
    );
    for (let wave = 1; wave <= RUN_WAVES; wave++) {
      const level = createRunLevel(wave, RUN_COINS);
      expect(validateTDLevelDraft(level, species)).toEqual([]);
      expect(
        existsSync(join(process.cwd(), 'public', level.backgroundUrl!))
      ).toBe(true);
      const definitions = new Set(
        level.waveEnemyDefinitions.map((enemy) => enemy.id)
      );
      for (const encounter of level.waves.flatMap((entry) => entry.groups)) {
        expect(definitions.has(encounter.enemyDefinitionId)).toBe(true);
        expect(level.paths[encounter.pathIndex]).toBeDefined();
      }
    }
  });
});
