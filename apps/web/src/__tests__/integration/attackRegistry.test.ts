import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { AttackBehaviorRegistry } from '@/engine/tower-defense/attacks/behaviors';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';

function expectAsset(url: string, context: string) {
  expect(url, context).toMatch(/^\/(?!\/)/);
  expect(
    existsSync(join(process.cwd(), 'public', url.replace(/^\/+/, ''))),
    `${context}: missing ${url}`
  ).toBe(true);
}

describe.each(Object.entries(ATTACK_DEFS))(
  '%s attack registration',
  (id, attack) => {
    it('connects to an implemented behavior and valid activation settings', () => {
      expect(attack.id).toBe(id);
      const behavior = AttackBehaviorRegistry[attack.behaviorType];
      expect(
        behavior,
        `${id}: missing behavior ${attack.behaviorType}`
      ).toBeDefined();
      expect(behavior.canExecute).toBeTypeOf('function');
      expect(behavior.execute).toBeTypeOf('function');
      for (const value of [
        attack.power,
        attack.cooldownMs,
        attack.rangeIndex,
      ]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
      for (const effect of attack.effects ?? []) {
        expect(Number.isFinite(effect.chance)).toBe(true);
        expect(effect.chance).toBeGreaterThanOrEqual(0);
        expect(effect.chance).toBeLessThanOrEqual(1);
      }
    });

    it('references existing visual configurations and shipped artwork', () => {
      const effectIds = [
        attack.visualEffectConfigId,
        attack.launchVisualEffectConfigId,
        attack.coirSnapCombo?.bindVisualEffectConfigId,
      ];
      for (const configId of effectIds) {
        if (!configId) continue;
        const visuals = CREATURE_TD_CONFIGS[configId];
        expect(
          visuals,
          `${id}: missing visual configuration ${configId}`
        ).toBeDefined();
        for (const config of Object.values(visuals)) {
          if (config.url) expectAsset(config.url, `${id} ${configId}`);
          for (const layer of config.vfxAnimation?.layers ?? [])
            expectAsset(layer.url, `${id} ${configId} layer`);
        }
      }
      if (attack.spriteUrl) expectAsset(attack.spriteUrl, `${id} sprite`);
      if (attack.projectileVisual && 'spriteUrl' in attack.projectileVisual) {
        expectAsset(attack.projectileVisual.spriteUrl, `${id} projectile`);
      }
      if (attack.riggingNest) {
        expectAsset(attack.riggingNest.nestSpriteUrl, `${id} nest`);
        for (const url of Object.values(
          attack.riggingNest.threadlingSpriteUrls
        ))
          expectAsset(url, `${id} summoned unit`);
      }
    });
  }
);
