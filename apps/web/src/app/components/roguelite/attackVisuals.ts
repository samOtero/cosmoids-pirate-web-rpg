import type { Graphics } from 'pixi.js';
import type { BattlefieldEffectLayout } from '../tower-defense/PixiBattlefield';
import type { RogueliteBattleEngine } from '@/engine/roguelite/RogueliteRun';
import { BREATH_ANGLES } from '@/engine/roguelite/attacks/RunAttackController';
import { RUN_ATTACK_DEFS } from '@/engine/roguelite/attacks/definitions';

/** Smooth procedural effects reuse the existing creature and cinder artwork. */
export function drawRunAttackPatterns(
  g: Graphics,
  layout: BattlefieldEffectLayout,
  engine: RogueliteBattleEngine,
  preparation: boolean
) {
  const { screenW, screenH, offsetX, offsetY } = layout;
  const unit = screenH / (100 * engine.backgroundScale);
  const x = (value: number) => offsetX + (value / 100) * screenW;
  const y = (value: number) => offsetY + (value / 100) * screenH;
  g.clear();
  if (preparation) {
    for (const tower of engine.towers) {
      const move = tower.equippedAttacksRuntime
        .map((runtime) => RUN_ATTACK_DEFS[runtime.definitionId])
        .find((attack) => attack?.pattern.kind === 'piercing');
      if (!move || move.pattern.kind !== 'piercing') continue;
      const angle =
        BREATH_ANGLES[
          engine.attackPatterns.breathDirections.get(tower.creature.id) ??
            'left'
        ];
      const startX = x(tower.position.x);
      const startY = y(tower.position.y);
      const reach = engine.getTowerAttackRange(move.rangeIndex) * unit;
      g.moveTo(startX, startY)
        .lineTo(
          startX + Math.cos(angle) * reach,
          startY + Math.sin(angle) * reach
        )
        .stroke({
          color: 0xfb923c,
          width: move.pattern.width * unit * 2,
          alpha: 0.1,
        });
      g.moveTo(startX, startY)
        .lineTo(
          startX + Math.cos(angle) * reach,
          startY + Math.sin(angle) * reach
        )
        .stroke({ color: 0xfed7aa, width: 2, alpha: 0.6 });
    }
  }
  for (const effect of engine.attackPatterns.visuals) {
    const px = x(effect.position.x);
    const py = y(effect.position.y);
    const radius = effect.radius * unit;
    if (effect.kind === 'claw') {
      const sweep = (effect.side ?? 1) * (effect.progress - 0.5) * 1.8;
      for (let trail = 0; trail < 3; trail++) {
        const r = radius * (0.65 + trail * 0.13);
        g.arc(
          px,
          py,
          r,
          effect.angle + sweep - 0.45,
          effect.angle + sweep + 0.45
        ).stroke({
          color: trail === 2 ? 0xfff0b3 : 0xfb6a24,
          width: (5 - trail) * layout.zoom,
          alpha: 1 - effect.progress * 0.7,
        });
      }
    } else if (effect.kind === 'breath') {
      const tailX = px - Math.cos(effect.angle) * unit * 10;
      const tailY = py - Math.sin(effect.angle) * unit * 10;
      g.moveTo(tailX, tailY)
        .lineTo(px, py)
        .stroke({ color: 0xdc451c, width: radius * 1.65, alpha: 0.65 });
      g.moveTo(tailX, tailY)
        .lineTo(px, py)
        .stroke({ color: 0xfb923c, width: radius, alpha: 0.95 });
      g.circle(px, py, radius * 0.4).fill({ color: 0xfff1ac });
    } else if (effect.kind === 'bomb') {
      const flight = effect.flightProgress ?? 1;
      const lift = Math.sin(flight * Math.PI) * unit * 12;
      if (effect.landing)
        g.circle(x(effect.landing.x), y(effect.landing.y), radius)
          .fill({ color: 0xfb923c, alpha: 0.06 })
          .stroke({ color: 0xfbbf24, width: 1, alpha: 0.3 });
      g.ellipse(px, py + unit, unit * 2, unit * 0.7).fill({
        color: 0x071e26,
        alpha: 0.55,
      });
      g.circle(px, py - lift, unit * 2.4)
        .fill({ color: 0x792d22 })
        .stroke({ color: 0xffa143, width: 2 });
      g.circle(px - unit * 0.5, py - lift - unit * 0.4, unit).fill({
        color: 0xfed7aa,
      });
      g.moveTo(px + unit, py - lift - unit * 2)
        .lineTo(px + unit * 2, py - lift - unit * 4)
        .stroke({ color: 0xfbbf24, width: 2 });
      g.circle(
        px + unit * 2,
        py - lift - unit * 4,
        unit * (0.6 + effect.progress * 0.5)
      ).fill({ color: 0xfff1ac });
    } else {
      const blastRadius = radius * (0.45 + effect.progress * 0.65);
      g.circle(px, py, blastRadius)
        .fill({ color: 0xf97316, alpha: (1 - effect.progress) * 0.5 })
        .stroke({
          color: 0xffd989,
          width: 3 * layout.zoom,
          alpha: 1 - effect.progress,
        });
      g.circle(px, py, blastRadius * 0.5).fill({
        color: 0xfff0b3,
        alpha: (1 - effect.progress) * 0.8,
      });
    }
  }
}
