import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { isCreatureGenderAllowed } from '@/utils/creatureGender';

const publicDirectory = join(process.cwd(), 'public');

function expectShippedAsset(url: string, context: string) {
  expect(url, context).toMatch(/^\/(?!\/)/);
  expect(
    existsSync(join(publicDirectory, url.replace(/^\/+/, ''))),
    `${context}: missing asset ${url}`
  ).toBe(true);
}

describe('creature content ownership', () => {
  it('keeps creature gameplay data in the runtime registry without duplicate manifests', () => {
    expect(existsSync(join(process.cwd(), 'src', 'content', 'creatures'))).toBe(
      false
    );
    expect(Object.keys(COSMOID_TEMPLATES).length).toBeGreaterThan(0);
  });
});

describe.each(Object.entries(COSMOID_TEMPLATES))(
  '%s creature integration',
  (id, template) => {
    it('has a valid gender distribution and preserves supported identities through evolution', () => {
      const ratio = template.genderRatio;
      if (ratio !== 'genderless') {
        expect(Number.isFinite(ratio.female)).toBe(true);
        expect(ratio.female).toBeGreaterThanOrEqual(0);
        expect(ratio.female).toBeLessThanOrEqual(1);
      }
      for (const { evolutionDefId } of template.evolutionNodes ?? []) {
        const evolved = COSMOID_TEMPLATES[evolutionDefId];
        expect(evolved).toBeDefined();
        for (const gender of ['male', 'female', 'genderless'] as const) {
          if (isCreatureGenderAllowed(ratio, gender))
            expect(isCreatureGenderAllowed(evolved.genderRatio, gender)).toBe(
              true
            );
        }
      }
    });
    it('references registered attacks and evolution targets', () => {
      expect(template.id).toBe(id);
      for (const { attackId } of template.learnableAttacks) {
        expect(
          ATTACK_DEFS[attackId],
          `${id}: unknown attack ${attackId}`
        ).toBeDefined();
      }
      for (const { evolutionDefId } of template.evolutionNodes ?? []) {
        expect(
          COSMOID_TEMPLATES[evolutionDefId],
          `${id}: unknown evolution target ${evolutionDefId}`
        ).toBeDefined();
      }
    });

    it('references shipped creature artwork', () => {
      for (const [role, url] of Object.entries({
        sprite: template.spriteUrl,
        battleSprite: template.battleSpriteUrl,
        icon: template.iconImg,
        journal: template.journalImg,
      })) {
        if (url !== undefined) expectShippedAsset(url, `${id} ${role}`);
      }
    });

    it('has usable battle visuals for every direction', () => {
      const visuals = CREATURE_TD_CONFIGS[id];
      expect(
        visuals,
        `${id}: missing battle visual configuration`
      ).toBeDefined();
      const fallbackUrl = template.battleSpriteUrl ?? template.spriteUrl;
      for (const direction of ['left', 'right', 'up', 'down'] as const) {
        // Follow the renderer's state/default and species-texture fallbacks.
        // A separate right image or a shared image with a flip are both valid.
        const config = visuals[direction] ?? visuals.default;
        expectShippedAsset(config.url ?? fallbackUrl, `${id} ${direction}`);
      }
      for (const [state, config] of Object.entries(visuals)) {
        if (config.url !== undefined) {
          expectShippedAsset(config.url, `${id} ${state}`);
        }
      }
    });
  }
);
