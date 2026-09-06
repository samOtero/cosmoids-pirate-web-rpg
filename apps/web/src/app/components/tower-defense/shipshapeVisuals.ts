import type { Graphics } from 'pixi.js';

/** Copper shield with crossed wooden braces, distinct from Harden's silver shield. */
export function drawPhysicalDefenseShield(graphics: Graphics) {
  graphics.moveTo(0, -7);
  graphics.lineTo(7, -4);
  graphics.lineTo(6, 3);
  graphics.quadraticCurveTo(4, 7, 0, 9);
  graphics.quadraticCurveTo(-4, 7, -6, 3);
  graphics.lineTo(-7, -4);
  graphics.closePath();
  graphics.fill({ color: 0xc87941, alpha: 1 });
  graphics.stroke({ color: 0xf7c78a, width: 1.5 });
  graphics.moveTo(-3.5, -2.5);
  graphics.lineTo(3.5, 4);
  graphics.moveTo(3.5, -2.5);
  graphics.lineTo(-3.5, 4);
  graphics.stroke({ color: 0x59361e, width: 2.5, cap: 'round' });
}

export function drawShipshapeHealing(graphics: Graphics, progress: number) {
  graphics.clear();
  // Let the two repair taps establish the action before the healing rises.
  const p = Math.max(0, Math.min(1, (progress - 0.3) / 0.7));
  if (p <= 0 || p >= 1) return;
  const alpha = Math.sin(p * Math.PI);
  graphics.ellipse(0, -3, 27 + p * 7, 9 + p * 3);
  graphics.fill({ color: 0x6ee7b7, alpha: alpha * 0.2 });
  graphics.stroke({ color: 0xa7f3d0, width: 2, alpha: alpha * 0.65 });
  for (let i = 0; i < 4; i += 1) {
    const x = (i - 1.5) * 14;
    const y = -12 - p * 45 - (i % 2) * 9;
    graphics.roundRect(x - 1.5, y - 5, 3, 10, 1);
    graphics.roundRect(x - 5, y - 1.5, 10, 3, 1);
    graphics.fill({ color: 0xa7f3d0, alpha });
  }
}

export function drawShipshapeBrace(graphics: Graphics, progress: number) {
  graphics.clear();
  const p = Math.max(0, Math.min(1, (progress - 0.42) / 0.58));
  graphics.alpha = p > 0 ? Math.min(1, p * 8) * (1 - p * p) : 0;
  graphics.position.set(18 + 15 * p, -27 - 26 * p);
  graphics.scale.set(1 + Math.sin(p * Math.PI) * 0.65);
  drawPhysicalDefenseShield(graphics);
}
