import { Container, Graphics } from 'pixi.js';
import type { Enemy } from '@/engine/tower-defense/types';
import { hasActiveSailcutterMark } from '@/engine/tower-defense/attacks/sailcutter';

/** A small persistent wind pennant above enemies currently guiding threadlings. */
export function updateSailcutterMark(
  container: Container,
  enemy: Enemy,
  elapsedTimeMs: number
) {
  const active = hasActiveSailcutterMark(enemy, elapsedTimeMs);
  let indicator = container.getChildByLabel('sailcutterMark') as
    | Graphics
    | undefined;

  if (!active) {
    if (indicator) {
      container.removeChild(indicator);
      indicator.destroy();
    }
    return;
  }

  if (!indicator) {
    indicator = new Graphics();
    indicator.label = 'sailcutterMark';
    container.addChild(indicator);
  }

  const hpBar = container.getChildByLabel('hpBg');
  indicator.y = (hpBar?.getLocalBounds().minY ?? -40) - 15;
  indicator.rotation = Math.sin(elapsedTimeMs / 260) * 0.08;
  indicator.clear();

  for (let index = 0; index < 3; index += 1) {
    const y = (index - 1) * 5;
    const sway = Math.sin(elapsedTimeMs / 150 + index) * 2;
    indicator.moveTo(-12 + index * 2, y);
    indicator.quadraticCurveTo(sway, y - 5, 12 - index * 2, y);
    indicator.stroke({
      color: index === 1 ? 0xffffff : 0xbcecff,
      width: index === 1 ? 2 : 1.5,
      alpha: 0.88,
      cap: 'round',
    });
  }
}
