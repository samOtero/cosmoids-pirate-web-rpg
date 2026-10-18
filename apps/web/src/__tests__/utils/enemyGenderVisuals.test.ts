import { describe, expect, it } from 'vitest';
import { Container, Graphics } from 'pixi.js';
import { updateEnemyGenderIndicator } from '@/app/components/tower-defense/enemyGenderVisuals';
import { CREATURE_GENDER_PRESENTATION } from '@/utils/creatureGenderPresentation';

const healthBar = { right: 37, centerY: -43, height: 6 };

describe('enemy gender indicators', () => {
  it.each(['male', 'female', 'genderless'] as const)(
    'shows %s identity beside a full-health enemy without intercepting drags',
    (gender) => {
      const container = new Container();
      try {
        updateEnemyGenderIndicator(
          container,
          { gender, kind: 'creature' },
          healthBar,
          1
        );
        const badge = container.getChildByLabel('enemyGenderIndicator')!;
        expect(badge.visible).toBe(true);
        expect(badge.eventMode).toBe('none');
        expect(badge.y).toBe(healthBar.centerY);
        expect(badge.getBounds().minX).toBeGreaterThan(healthBar.right);
      } finally {
        container.destroy({ children: true });
      }
    }
  );

  it('stays twice the health-bar height with the same proportions at every zoom', () => {
    const container = new Container();
    try {
      for (const scale of [1.5, 1, 0.4, 0.12]) {
        container.scale.set(scale);
        const anchor = {
          right: healthBar.right + scale * 8,
          centerY: healthBar.centerY - scale * 12,
          height: healthBar.height + scale,
        };
        updateEnemyGenderIndicator(
          container,
          { gender: 'female' },
          anchor,
          scale
        );
        const badge = container.getChildByLabel('enemyGenderIndicator')!;
        expect(badge.getBounds().height).toBeCloseTo(anchor.height * scale * 2);
        expect(badge.scale.x).toBe(badge.scale.y);
        expect(badge.y).toBe(anchor.centerY);
        expect(badge.getBounds().minX).toBeGreaterThan(anchor.right * scale);
      }
    } finally {
      container.destroy({ children: true });
    }
  });

  it('reuses the badge while moving and redraws it if its displayed identity changes', () => {
    const container = new Container();
    try {
      updateEnemyGenderIndicator(container, { gender: 'male' }, healthBar, 1);
      const original = container.getChildByLabel('enemyGenderIndicator')!;
      const originalChildren = [...original.children];
      for (let i = 0; i < 10; i++)
        updateEnemyGenderIndicator(
          container,
          { gender: i < 5 ? 'male' : 'female' },
          { ...healthBar, centerY: healthBar.centerY + i },
          0.5
        );
      expect(container.getChildByLabel('enemyGenderIndicator')).toBe(original);
      expect(original.children).toEqual(originalChildren);
      expect(original.y).toBe(healthBar.centerY + 9);
      const symbol = original.getChildByLabel('genderSymbol') as Graphics;
      const strokes = symbol.context.instructions.filter(
        (instruction) => instruction.action === 'stroke'
      );
      expect(strokes.at(-1)!.data.style.color).toBe(
        CREATURE_GENDER_PRESENTATION.female.color
      );
    } finally {
      container.destroy({ children: true });
    }
  });

  it.each([{ gender: 'male' as const, kind: 'structure' as const }, {}])(
    'cleans up indicators for structures or missing identity: %j',
    (enemy) => {
      const container = new Container();
      try {
        updateEnemyGenderIndicator(container, { gender: 'male' }, healthBar, 1);
        const badge = container.getChildByLabel('enemyGenderIndicator')!;
        updateEnemyGenderIndicator(container, enemy, healthBar, 1);
        expect(container.getChildByLabel('enemyGenderIndicator')).toBeNull();
        expect(badge.destroyed).toBe(true);
      } finally {
        container.destroy({ children: true });
      }
    }
  );

  it('hides invalid layouts without producing invalid positions, then recovers', () => {
    const container = new Container();
    try {
      updateEnemyGenderIndicator(container, { gender: 'male' }, healthBar, 1);
      const badge = container.getChildByLabel('enemyGenderIndicator')!;
      for (const scale of [0, Number.NaN]) {
        updateEnemyGenderIndicator(
          container,
          { gender: 'male' },
          healthBar,
          scale
        );
        expect(badge.visible).toBe(false);
        expect(Number.isFinite(badge.x)).toBe(true);
      }
      updateEnemyGenderIndicator(container, { gender: 'male' }, healthBar, 1);
      expect(badge.visible).toBe(true);
    } finally {
      container.destroy({ children: true });
    }
  });

  it('keeps both pink and blue symbols at high contrast against their opaque dark backing', () => {
    const luminance = (color: number) =>
      [16, 8, 0]
        .map((shift) => {
          const channel = ((color >> shift) & 255) / 255;
          return channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
        })
        .reduce(
          (total, value, index) =>
            total + value * [0.2126, 0.7152, 0.0722][index],
          0
        );
    for (const gender of ['female', 'male'] as const) {
      const container = new Container();
      try {
        updateEnemyGenderIndicator(container, { gender }, healthBar, 1);
        const badge = container.getChildByLabel('enemyGenderIndicator')!;
        const backing = badge.getChildByLabel('genderBacking') as Graphics;
        const background = backing.context.instructions.find(
          (instruction) => instruction.action === 'fill'
        )!;
        if (background.action !== 'fill')
          throw new Error('Missing badge backing');
        expect(background.data.style.alpha).toBe(1);
        const contrast =
          (luminance(CREATURE_GENDER_PRESENTATION[gender].color) + 0.05) /
          (luminance(background.data.style.color) + 0.05);
        expect(contrast).toBeGreaterThan(7);
      } finally {
        container.destroy({ children: true });
      }
    }
  });
});
