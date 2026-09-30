import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import type { UnitSpriteConfig } from '@/types/baseGame';

describe.each(Object.entries(CREATURE_TD_CONFIGS))(
  '%s visual configuration',
  (id, visuals) => {
    it('references shipped textures and usable layout values', () => {
      expect(visuals.default).toBeDefined();
      for (const [state, config] of Object.entries(visuals) as [
        string,
        UnitSpriteConfig,
      ][]) {
        const context = `${id}.${state}`;
        const urls = [
          config.url,
          ...(config.vfxAnimation?.layers ?? []).map((layer) => layer.url),
        ];
        for (const url of urls) {
          if (url === undefined) continue;
          expect(url, context).toMatch(/^\/(?!\/)/);
          expect(
            existsSync(join(process.cwd(), 'public', url.slice(1))),
            `${context}: missing ${url}`
          ).toBe(true);
        }
        for (const [key, value] of Object.entries(config)) {
          if (typeof value === 'number')
            expect(Number.isFinite(value), `${context}.${key}`).toBe(true);
        }
        if (config.scale !== undefined)
          expect(config.scale, context).toBeGreaterThan(0);
        for (const scale of [config.shadowScaleX, config.shadowScaleY]) {
          if (scale !== undefined)
            expect(scale, context).toBeGreaterThanOrEqual(0);
        }
      }
    });
  }
);
