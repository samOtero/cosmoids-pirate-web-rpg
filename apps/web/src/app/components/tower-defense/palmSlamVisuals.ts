import type { Graphics } from 'pixi.js';

/** A compact, two-palmed impact, deliberately distinct from Shiko Stomp's dirt burst. */
export function drawPalmSlamImpact(g: Graphics, progress: number) {
  g.clear();
  const expansion = 1 - Math.pow(1 - progress, 2);
  const fade = Math.max(0, 1 - progress);
  g.alpha = fade;

  g.ellipse(-5 - expansion * 3, 0, 8 + expansion * 7, 10 + expansion * 4).fill({
    color: 0xeab676,
    alpha: 0.44,
  });
  g.ellipse(5 + expansion * 3, 0, 8 + expansion * 7, 10 + expansion * 4).fill({
    color: 0xeab676,
    alpha: 0.44,
  });
  g.ellipse(0, 0, 11 + expansion * 15, 9 + expansion * 10).stroke({
    color: 0xffe8bc,
    alpha: 0.95,
    width: 3.2,
  });
  g.circle(0, 0, Math.max(1, 8 * (1 - progress))).fill({
    color: 0xfff7df,
    alpha: 0.88,
  });

  for (let index = 0; index < 4; index += 1) {
    const angle = (index * Math.PI) / 2 + Math.PI / 4;
    const inner = 15 + expansion * 5;
    const outer = inner + 9 + expansion * 4;
    g.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    g.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    g.stroke({ color: 0xf8d29a, alpha: 0.8, width: 2.7, cap: 'round' });
  }
}
