import { Container, Graphics } from 'pixi.js';

function drawSpark(g: Graphics, x: number, y: number, radius: number) {
  g.circle(x, y, radius * 1.7).fill({ color: 0xff6b19, alpha: 0.2 });
  g.moveTo(x, y - radius);
  g.lineTo(x + radius * 0.3, y - radius * 0.3);
  g.lineTo(x + radius, y);
  g.lineTo(x + radius * 0.3, y + radius * 0.3);
  g.lineTo(x, y + radius);
  g.lineTo(x - radius * 0.3, y + radius * 0.3);
  g.lineTo(x - radius, y);
  g.lineTo(x - radius * 0.3, y - radius * 0.3);
  g.closePath().fill({ color: 0xffe7a3 });
  g.stroke({ color: 0xf97316, width: 1.4 });
}

/** Anchored above the actual health bar, including large structure targets. */
export function updateFuseRushMarks(
  container: Container,
  marks: number,
  elapsedMs: number
) {
  let indicator = container.getChildByLabel('fuseRushMarks') as
    | Graphics
    | undefined;
  if (marks <= 0) {
    if (indicator) {
      container.removeChild(indicator);
      indicator.destroy();
    }
    return;
  }
  if (!indicator) {
    indicator = new Graphics();
    indicator.label = 'fuseRushMarks';
    container.addChild(indicator);
  }
  const hpBar = container.getChildByLabel('hpBg');
  indicator.y = (hpBar?.getLocalBounds().minY ?? -40) - 13;
  indicator.clear();
  const count = Math.min(2, marks);
  for (let i = 0; i < count; i += 1) {
    const x = (i - (count - 1) / 2) * 18;
    drawSpark(indicator, x, 0, 5.5 + Math.sin(elapsedMs / 130 + i) * 0.65);
  }
}

export function drawFuseRushTrail(g: Graphics) {
  for (let i = 0; i < 3; i += 1) {
    const y = -12 + i * 12;
    g.moveTo(-5, y);
    g.quadraticCurveTo(-38, y - 9, -76 + i * 9, y + 3);
    g.stroke({ color: 0xe84c14, width: 13 - i * 2, alpha: 0.65, cap: 'round' });
    g.moveTo(-5, y);
    g.quadraticCurveTo(-30, y - 6, -62 + i * 9, y + 3);
    g.stroke({ color: 0xffc55c, width: 5, alpha: 0.95, cap: 'round' });
  }
  drawSpark(g, -83, -12, 3);
  drawSpark(g, -67, 24, 2.5);
}

/** Cosmetic only: the finisher remains strictly single-target. */
export function drawFuseRushImpact(
  g: Graphics,
  progress: number,
  finisher: boolean
) {
  g.clear();
  const p = Math.max(0, Math.min(1, progress));
  if (p >= 1) return;
  const alpha = 1 - p;
  const radius = (finisher ? 17 : 7) + p * (finisher ? 29 : 13);
  g.circle(0, -25, radius);
  g.fill({ color: 0xff751f, alpha: alpha * 0.4 });
  g.stroke({ color: 0xffc55c, width: finisher ? 5 : 2, alpha });
  g.circle(0, -25, radius * 0.52);
  g.fill({ color: 0xfff0c2, alpha: Math.max(0, 1 - p * 2) });
  const rays = finisher ? 9 : 5;
  for (let i = 0; i < rays; i += 1) {
    const angle = (i / rays) * Math.PI * 2;
    const distance = radius * (1 + p * 0.65);
    g.moveTo(
      Math.cos(angle) * radius * 0.7,
      -25 + Math.sin(angle) * radius * 0.7
    );
    g.lineTo(Math.cos(angle) * distance, -25 + Math.sin(angle) * distance);
    g.stroke({ color: 0xffe3a0, width: finisher ? 3 : 2, alpha, cap: 'round' });
  }
}
