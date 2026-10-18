import { Container, Graphics } from 'pixi.js';
import type { CreatureGender } from '@/types/baseGame';
import type { Enemy } from '@/engine/tower-defense/types';
import { CREATURE_GENDER_PRESENTATION } from '@/utils/creatureGenderPresentation';

type GenderIndicator = Container & { displayedGender?: CreatureGender };
const BADGE_SIZE = 20;
const BADGE_BORDER_WIDTH = 2;

function drawGenderSymbol(graphics: Graphics, gender: CreatureGender) {
  graphics.clear();
  // Draw the traditional symbols directly so tiny badges do not depend on font glyphs.
  for (const [color, width] of [
    [0x020617, 4],
    [CREATURE_GENDER_PRESENTATION[gender].color, 2.2],
  ]) {
    if (gender === 'female') {
      graphics.circle(0, -3.5, 3.8);
      graphics.moveTo(0, 0.3).lineTo(0, 7);
      graphics.moveTo(-3, 4.5).lineTo(3, 4.5);
    } else if (gender === 'male') {
      graphics.circle(-2.5, 2.5, 3.8);
      graphics.moveTo(0.2, -0.2).lineTo(6, -6);
      graphics.moveTo(1.5, -6).lineTo(6, -6).lineTo(6, -1.5);
    } else {
      graphics.moveTo(-4, 0).lineTo(4, 0);
    }
    graphics.stroke({ color, width, cap: 'round', join: 'round' });
  }
}

/** Keep the badge proportional to the visible HP bar as the camera zooms. */
export function updateEnemyGenderIndicator(
  container: Container,
  enemy: Pick<Enemy, 'gender' | 'kind'>,
  healthBar: { right: number; centerY: number; height: number },
  worldScale: number
) {
  let indicator = container.getChildByLabel('enemyGenderIndicator') as
    | GenderIndicator
    | undefined;
  if (enemy.kind === 'structure' || enemy.gender === undefined) {
    if (indicator) {
      container.removeChild(indicator);
      indicator.destroy({ children: true });
    }
    return;
  }
  if (!Number.isFinite(worldScale) || worldScale <= 0) {
    if (indicator) indicator.visible = false;
    return;
  }
  if (!indicator) {
    indicator = new Container() as GenderIndicator;
    indicator.label = 'enemyGenderIndicator';
    indicator.eventMode = 'none';
    const backing = new Graphics();
    backing.label = 'genderBacking';
    backing.roundRect(-10, -10, BADGE_SIZE, BADGE_SIZE, 5);
    backing.fill({ color: 0x0f172a });
    backing.stroke({ color: 0x020617, width: BADGE_BORDER_WIDTH });
    backing.stroke({ color: 0xe2e8f0, alpha: 0.8, width: 0.8 });
    indicator.addChild(backing);
    const symbol = new Graphics();
    symbol.label = 'genderSymbol';
    indicator.addChild(symbol);
    container.addChild(indicator);
  }
  if (indicator.displayedGender !== enemy.gender) {
    drawGenderSymbol(
      indicator.getChildByLabel('genderSymbol') as Graphics,
      enemy.gender
    );
    indicator.displayedGender = enemy.gender;
  }
  const scale = (healthBar.height * 2) / (BADGE_SIZE + BADGE_BORDER_WIDTH);
  indicator.visible = true;
  indicator.scale.set(scale);
  indicator.position.set(
    healthBar.right + healthBar.height / 2 + (BADGE_SIZE / 2) * scale,
    healthBar.centerY
  );
}
