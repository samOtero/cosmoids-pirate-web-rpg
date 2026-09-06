import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { ElementType } from '@/types/baseGame';

interface CreatureManifest {
  id: string;
  name: string;
  element: keyof typeof ElementType;
  secondaryElement?: keyof typeof ElementType;
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  baseExperience: number;
  movementId: string;
  learnableAttacks: Array<{ level: number; attackId: string }>;
  assets: Record<'icon' | 'left' | 'up' | 'down', { url: string }>;
}

const manifestDirectory = join(process.cwd(), 'src', 'content', 'creatures');
const manifests: CreatureManifest[] = readdirSync(manifestDirectory)
  .filter((file) => file.endsWith('.json'))
  .map((file) =>
    JSON.parse(readFileSync(join(manifestDirectory, file), 'utf8'))
  );

describe.each(manifests)('$name creature manifest', (manifest) => {
  it('matches the species registry and existing attack catalog', () => {
    const template = COSMOID_TEMPLATES[manifest.id];

    expect(template).toBeDefined();
    expect(template.name).toBe(manifest.name);
    expect(template.type).toBe(ElementType[manifest.element]);
    expect(template.secondaryType).toBe(
      manifest.secondaryElement
        ? ElementType[manifest.secondaryElement]
        : undefined
    );
    expect(template.baseStats).toEqual(manifest.baseStats);
    expect(template.baseExperience).toBe(manifest.baseExperience);
    expect(template.movementId).toBe(manifest.movementId);
    expect(template.learnableAttacks).toEqual(manifest.learnableAttacks);

    for (const attack of manifest.learnableAttacks) {
      expect(ATTACK_DEFS[attack.attackId]).toBeDefined();
    }
  });

  it('matches the directional visual configuration and shipped assets', () => {
    const template = COSMOID_TEMPLATES[manifest.id];
    const visuals = CREATURE_TD_CONFIGS[manifest.id];

    expect(template.iconImg).toBe(manifest.assets.icon.url);
    expect(template.spriteUrl).toBe(manifest.assets.down.url);
    expect(template.battleSpriteUrl).toBe(manifest.assets.left.url);
    expect(visuals.default.url).toBe(manifest.assets.left.url);
    expect(visuals.left?.url).toBe(manifest.assets.left.url);
    expect(visuals.right?.url).toBe(manifest.assets.left.url);
    expect(visuals.right?.flipX).toBe(true);
    expect(visuals.up?.url).toBe(manifest.assets.up.url);
    expect(visuals.down?.url).toBe(manifest.assets.down.url);

    for (const asset of Object.values(manifest.assets)) {
      expect(
        existsSync(join(process.cwd(), 'public', asset.url.replace(/^\/+/, '')))
      ).toBe(true);
    }
  });
});

describe('COSMOID_TEMPLATES icons', () => {
  it('has existing icon files for all templates declaring iconImg', () => {
    for (const [id, template] of Object.entries(COSMOID_TEMPLATES)) {
      if (template.iconImg) {
        const iconPath = join(
          process.cwd(),
          'public',
          template.iconImg.replace(/^\/+/, '')
        );
        expect(
          existsSync(iconPath),
          `Icon file missing for ${id}: ${template.iconImg}`
        ).toBe(true);
      }
    }
  });
});
