import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import * as PIXI from 'pixi.js';
import {
  TowerDefenseEngine,
  TD_CREATURE_DEFS,
} from '@/engine/tower-defense/TowerDefenseEngine';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { ElementType } from '@/types/baseGame';
import { TD_BASE_HEIGHT } from '@/constants/game';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import {
  BaseTDUnit,
  Enemy,
  TDInitialView,
  TDOpeningPan,
} from '@/engine/tower-defense/types';
import { interpolateKeyframes } from '@/utils/animationUtils';
import {
  resolveTDInitialView,
  resolveTDOpeningPanView,
} from '@/utils/tdInitialView';
import { applyTDUnitTransforms } from '@/utils/tdUnitVisuals';
import { getCaptureUnitVisualState } from '@/utils/captureUnitVisualState';
import {
  hasActiveSpeedBoost,
  hasActiveSpeedSlow,
} from '@/engine/tower-defense/speedModifiers';

export const WEAKENED_THRESHOLD = 0.9;

export function renderHealthBar(
  unit: BaseTDUnit,
  container: PIXI.Container,
  configId: string,
  hideWhenFull: boolean = false
) {
  const tdConfigMap = CREATURE_TD_CONFIGS[configId] || {
    default: { scale: 1 },
  };
  const tdConfig = tdConfigMap[unit.facingDirection] || tdConfigMap.default;
  const hpOffsetY =
    tdConfig.healthBarOffsetY ?? tdConfigMap.default?.healthBarOffsetY ?? -40; // Default offset

  let hpBg = container.getChildByLabel('hpBg') as PIXI.Graphics | undefined;
  let hpFg = container.getChildByLabel('hpFg') as PIXI.Graphics | undefined;

  if (!hpBg || !hpFg) {
    hpBg = new PIXI.Graphics();
    hpBg.label = 'hpBg';
    container.addChild(hpBg);

    hpFg = new PIXI.Graphics();
    hpFg.label = 'hpFg';
    container.addChild(hpFg);
  }

  // Draw background
  hpBg.clear();
  hpBg.rect(-33, hpOffsetY - 1, 66, 6);
  hpBg.fill({ color: 0x000000 });
  hpBg.stroke({ color: 0x111111, width: 1 });

  // Draw foreground
  const hpRatio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
  const isWeakened = unit.isShiny || hpRatio <= WEAKENED_THRESHOLD;
  const isUncapturable = (unit as any).uncapturable;

  if (hideWhenFull && hpRatio >= 1 && !unit.isShiny) {
    hpBg.visible = false;
    hpFg.visible = false;
  } else {
    hpBg.visible = true;
    hpFg.visible = true;
    hpFg.clear();
    hpFg.rect(-32, hpOffsetY, 64 * Math.max(0, hpRatio), 4);
    if (isUncapturable) {
      hpFg.fill({ color: 0x3b82f6 }); // Blue
    } else {
      hpFg.fill({ color: isWeakened ? 0xff0000 : 0x22c55e });
    }
  }
}

function drawStar(g: PIXI.Graphics, size: number) {
  g.clear();
  g.moveTo(0, -size);
  g.quadraticCurveTo(0, 0, size, 0);
  g.quadraticCurveTo(0, 0, 0, size);
  g.quadraticCurveTo(0, 0, -size, 0);
  g.quadraticCurveTo(0, 0, 0, -size);
  const colors = [0xffeb3b, 0xffffff, 0xffd54f, 0x80deea, 0xf48fb1];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  g.fill({ color: randomColor });
}

function updateSparkles(
  container: PIXI.Container,
  unit: BaseTDUnit,
  delta: number
) {
  let sparkleContainer = container.getChildByLabel('sparkles') as
    | PIXI.Container
    | undefined;
  if (unit.isShiny) {
    if (!sparkleContainer) {
      sparkleContainer = new PIXI.Container();
      sparkleContainer.label = 'sparkles';
      container.addChild(sparkleContainer);
    }

    // Update existing sparkles
    const children = [...sparkleContainer.children] as PIXI.Graphics[];
    children.forEach((child: any) => {
      child.life -= delta;
      if (child.life <= 0) {
        sparkleContainer!.removeChild(child);
        child.destroy();
      } else {
        child.x += child.vx * delta;
        child.y += child.vy * delta;
        child.rotation += child.vRot * delta;

        const lifeRatio = child.life / child.maxLife;
        child.alpha = Math.min(1, lifeRatio * 1.5);
        child.scale.set(Math.min(1, lifeRatio * 1.5) * child.baseScale);
      }
    });

    // Spawn new sparkles if needed
    if (sparkleContainer.children.length < 6 && Math.random() < 0.15) {
      const star = new PIXI.Graphics();
      const size = 3 + Math.random() * 5;
      drawStar(star, size);

      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 20;
      star.x = Math.cos(angle) * radius;
      star.y = Math.sin(angle) * radius - 10; // offset slightly upward

      const speed = 0.2 + Math.random() * 0.3;
      (star as any).vx = Math.cos(angle) * speed;
      (star as any).vy = Math.sin(angle) * speed - 0.1; // slight upward drift
      (star as any).vRot = (Math.random() - 0.5) * 0.05;
      (star as any).maxLife = 30 + Math.random() * 30;
      (star as any).life = (star as any).maxLife;
      (star as any).baseScale = 0.6 + Math.random() * 0.4;

      sparkleContainer.addChild(star);
    }
  } else {
    if (sparkleContainer) {
      container.removeChild(sparkleContainer);
      sparkleContainer.destroy({ children: true });
    }
  }
}

type SpeedBoostIndicator = PIXI.Container & {
  elapsed: number;
  displayedStackCount: number;
  stackPulseElapsed: number;
};

type PersistentSpeedStackAura = PIXI.Container & {
  elapsed: number;
  displayedStackCount: number;
  stackPulseElapsed: number;
};

function drawSpeedChevron(
  graphics: PIXI.Graphics,
  centerX: number,
  color: number
) {
  graphics.moveTo(centerX - 4, -5);
  graphics.lineTo(centerX + 1, 0);
  graphics.lineTo(centerX - 4, 5);
  graphics.stroke({ color, width: 2.5, cap: 'round', join: 'round' });
}

/**
 * Generic indicator for any active positive movement-speed modifier. It reads
 * only shared unit state, so attacks and abilities receive it automatically.
 */
function updateSpeedBoostIndicator(
  container: PIXI.Container,
  unit: BaseTDUnit,
  configId: string,
  currentTimeMs: number,
  delta: number
) {
  let indicator = container.getChildByLabel('speedBoostIndicator') as
    | SpeedBoostIndicator
    | undefined;

  if (!hasActiveSpeedBoost(unit, currentTimeMs)) {
    if (indicator) {
      container.removeChild(indicator);
      indicator.destroy({ children: true });
    }
    return;
  }

  if (!indicator) {
    indicator = new PIXI.Container() as SpeedBoostIndicator;
    indicator.label = 'speedBoostIndicator';
    indicator.elapsed = 0;
    indicator.displayedStackCount = 0;
    indicator.stackPulseElapsed = 999;

    const badge = new PIXI.Graphics();
    badge.label = 'speedBoostBadge';
    badge.circle(0, 0, 11);
    badge.fill({ color: 0x082f49, alpha: 0.9 });
    badge.stroke({ color: 0x67e8f9, alpha: 0.95, width: 2 });
    indicator.addChild(badge);

    const chevrons = new PIXI.Graphics();
    chevrons.label = 'speedBoostChevrons';
    drawSpeedChevron(chevrons, -2.5, 0xecfeff);
    drawSpeedChevron(chevrons, 4, 0x67e8f9);
    indicator.addChild(chevrons);

    const stackBadge = new PIXI.Graphics();
    stackBadge.label = 'speedBoostStackBadge';
    stackBadge.roundRect(8, -9, 26, 18, 9);
    stackBadge.fill({ color: 0x164e63, alpha: 0.96 });
    stackBadge.stroke({ color: 0xfacc15, alpha: 0.98, width: 1.5 });
    stackBadge.visible = false;
    indicator.addChild(stackBadge);

    const stackText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 11,
        fontWeight: 'bold',
        fill: 0xfef9c3,
        stroke: { color: 0x082f49, width: 2 },
      },
    });
    stackText.label = 'speedBoostStackText';
    stackText.anchor.set(0.5);
    stackText.position.set(21, 0);
    stackText.visible = false;
    indicator.addChild(stackText);

    container.addChild(indicator);
  }

  indicator.elapsed += delta;
  indicator.stackPulseElapsed += delta;
  const stackCount = unit.persistentSpeedBoostStackCount ?? 0;
  if (indicator.displayedStackCount !== stackCount) {
    indicator.displayedStackCount = stackCount;
    indicator.stackPulseElapsed = 0;
  }
  const tdConfigMap = CREATURE_TD_CONFIGS[configId] || {
    default: { scale: 1 },
  };
  const tdConfig = tdConfigMap[unit.facingDirection] || tdConfigMap.default;
  const hpOffsetY =
    tdConfig.healthBarOffsetY ?? tdConfigMap.default?.healthBarOffsetY ?? -40;
  indicator.position.set(stackCount > 0 ? 20 : 33, hpOffsetY - 13);

  const pulse = 1 + Math.sin(indicator.elapsed * 0.14) * 0.07;
  const stackArrivalPulse = Math.max(0, 1 - indicator.stackPulseElapsed / 18);
  indicator.scale.set(pulse + stackArrivalPulse * 0.28);
  indicator.alpha = 0.88 + Math.sin(indicator.elapsed * 0.1) * 0.12;

  const stackBadge = indicator.getChildByLabel('speedBoostStackBadge') as
    | PIXI.Graphics
    | undefined;
  const stackText = indicator.getChildByLabel('speedBoostStackText') as
    | PIXI.Text
    | undefined;
  if (stackBadge) stackBadge.visible = stackCount > 0;
  if (stackText) {
    stackText.visible = stackCount > 0;
    stackText.text = stackCount > 0 ? `×${stackCount}` : '';
  }

  const chevrons = indicator.getChildByLabel('speedBoostChevrons') as
    | PIXI.Graphics
    | undefined;
  if (chevrons) {
    chevrons.x = ((indicator.elapsed * 0.08) % 3) - 1.5;
  }
}

/**
 * Persistent howl-stack treatment: each received stack adds a separate
 * counter-rotating energy orbit around the boosted unit.
 */
function updatePersistentSpeedStackAura(
  container: PIXI.Container,
  unit: BaseTDUnit,
  delta: number
) {
  const stackCount = unit.persistentSpeedBoostStackCount ?? 0;
  let aura = container.getChildByLabel('persistentSpeedStackAura') as
    | PersistentSpeedStackAura
    | undefined;

  if (stackCount <= 0) {
    if (aura) {
      container.removeChild(aura);
      aura.destroy({ children: true });
    }
    return;
  }

  if (!aura) {
    aura = new PIXI.Container() as PersistentSpeedStackAura;
    aura.label = 'persistentSpeedStackAura';
    aura.elapsed = 0;
    aura.displayedStackCount = 0;
    aura.stackPulseElapsed = 999;
    aura.y = 5;
    // Place the buildup over the shadow but behind the creature artwork.
    container.addChildAt(aura, Math.min(1, container.children.length));
  }

  aura.elapsed += delta;
  aura.stackPulseElapsed += delta;

  if (aura.displayedStackCount !== stackCount) {
    aura.removeChildren().forEach((child) => child.destroy());
    for (let index = 0; index < stackCount; index += 1) {
      const ring = new PIXI.Graphics();
      ring.label = `persistentSpeedStackRing${index}`;
      const radiusX = 28 + index * 6;
      const radiusY = 10 + index * 2;
      ring.ellipse(0, 0, radiusX, radiusY);
      ring.stroke({
        color: index % 2 === 0 ? 0x67e8f9 : 0xfacc15,
        width: 2.4,
        alpha: 0.76,
      });
      ring.circle(radiusX, 0, 3.2);
      ring.fill({ color: 0xfef9c3, alpha: 0.96 });
      aura.addChild(ring);
    }
    aura.displayedStackCount = stackCount;
    aura.stackPulseElapsed = 0;
  }

  const arrivalPulse = Math.max(0, 1 - aura.stackPulseElapsed / 22);
  const idlePulse = 1 + Math.sin(aura.elapsed * 0.075) * 0.035;
  aura.scale.set(idlePulse + arrivalPulse * 0.24);
  aura.alpha = 0.62 + Math.sin(aura.elapsed * 0.08) * 0.12;

  aura.children.forEach((child, index) => {
    child.rotation =
      aura!.elapsed * (index % 2 === 0 ? 0.012 : -0.009) + index * 0.7;
  });
}

type SpeedSlowIndicator = PIXI.Container & {
  elapsed: number;
};

/** A persistent silk ring that makes String Shot's indefinite slow readable. */
function updateSpeedSlowIndicator(
  container: PIXI.Container,
  unit: BaseTDUnit,
  currentTimeMs: number,
  delta: number
) {
  let indicator = container.getChildByLabel('speedSlowIndicator') as
    | SpeedSlowIndicator
    | undefined;

  if (!hasActiveSpeedSlow(unit, currentTimeMs)) {
    if (indicator) {
      container.removeChild(indicator);
      indicator.destroy({ children: true });
    }
    return;
  }

  if (!indicator) {
    indicator = new PIXI.Container() as SpeedSlowIndicator;
    indicator.label = 'speedSlowIndicator';
    indicator.elapsed = 0;
    indicator.y = -7;

    const web = new PIXI.Graphics();
    web.label = 'speedSlowWeb';
    [
      { width: 54, height: 13, y: -7 },
      { width: 60, height: 15, y: 2 },
      { width: 48, height: 11, y: 11 },
    ].forEach(({ width, height, y }) => {
      web.ellipse(0, y, width / 2, height / 2);
      web.stroke({ color: 0x64748b, width: 4, alpha: 0.7 });
      web.ellipse(0, y - 1, width / 2, height / 2);
      web.stroke({ color: 0xf8fafc, width: 2, alpha: 0.95 });
    });
    web.moveTo(-25, -7);
    web.lineTo(-19, 12);
    web.moveTo(25, -7);
    web.lineTo(19, 12);
    web.stroke({ color: 0xbae6fd, width: 1.5, alpha: 0.85 });
    indicator.addChild(web);

    // Keep the lingering web below UI badges but over the creature sprite.
    container.addChildAt(indicator, Math.min(2, container.children.length));
  }

  indicator.elapsed += delta;
  const pulse = 1 + Math.sin(indicator.elapsed * 0.09) * 0.025;
  indicator.scale.set(pulse, 1);
  indicator.alpha = 0.78 + Math.sin(indicator.elapsed * 0.06) * 0.1;
}

type DefenseBoostIndicator = PIXI.Container & {
  elapsed: number;
};

function drawDefenseShield(graphics: PIXI.Graphics) {
  graphics.moveTo(0, -6.5);
  graphics.lineTo(6, -4);
  graphics.lineTo(5, 2);
  graphics.quadraticCurveTo(3.5, 6, 0, 8);
  graphics.quadraticCurveTo(-3.5, 6, -5, 2);
  graphics.lineTo(-6, -4);
  graphics.closePath();
  graphics.fill({ color: 0xf8fafc, alpha: 0.95 });
  graphics.stroke({ color: 0x64748b, width: 1.5, join: 'round' });
  graphics.moveTo(0, -4.5);
  graphics.lineTo(0, 5.5);
  graphics.stroke({ color: 0x94a3b8, width: 1.5, alpha: 0.95 });
}

function hasDefenseBoost(unit: BaseTDUnit) {
  return (
    (unit.defenseBoostMultiplier ?? 1) > 1 ||
    (unit.specialDefenseBoostMultiplier ?? 1) > 1
  );
}

/** Persistent badge for physical and special defense increases. */
function updateDefenseBoostIndicator(
  container: PIXI.Container,
  unit: BaseTDUnit,
  configId: string,
  currentTimeMs: number,
  delta: number
) {
  let indicator = container.getChildByLabel('defenseBoostIndicator') as
    | DefenseBoostIndicator
    | undefined;

  if (!hasDefenseBoost(unit)) {
    if (indicator) {
      container.removeChild(indicator);
      indicator.destroy({ children: true });
    }
    return;
  }

  if (!indicator) {
    indicator = new PIXI.Container() as DefenseBoostIndicator;
    indicator.label = 'defenseBoostIndicator';
    indicator.elapsed = 0;

    const badge = new PIXI.Graphics();
    badge.circle(0, 0, 11);
    badge.fill({ color: 0x1e293b, alpha: 0.92 });
    badge.stroke({ color: 0xcbd5e1, alpha: 0.98, width: 2 });
    indicator.addChild(badge);

    const shield = new PIXI.Graphics();
    shield.label = 'defenseBoostShield';
    drawDefenseShield(shield);
    indicator.addChild(shield);

    container.addChild(indicator);
  }

  indicator.elapsed += delta;
  const tdConfigMap = CREATURE_TD_CONFIGS[configId] || {
    default: { scale: 1 },
  };
  const tdConfig = tdConfigMap[unit.facingDirection] || tdConfigMap.default;
  const hpOffsetY =
    tdConfig.healthBarOffsetY ?? tdConfigMap.default?.healthBarOffsetY ?? -40;
  const hasSpeedBadge = hasActiveSpeedBoost(unit, currentTimeMs);
  indicator.position.set(hasSpeedBadge ? 7 : 33, hpOffsetY - 13);

  const pulse = 1 + Math.sin(indicator.elapsed * 0.1) * 0.045;
  indicator.scale.set(pulse);
  indicator.alpha = 0.9 + Math.sin(indicator.elapsed * 0.075) * 0.1;

  const shield = indicator.getChildByLabel('defenseBoostShield') as
    | PIXI.Graphics
    | undefined;
  if (shield) {
    shield.y = Math.sin(indicator.elapsed * 0.08) * 0.6;
  }
}

type ResonantEvolutionIndicator = PIXI.Container & {
  elapsed: number;
};

function updateResonantEvolutionIndicator(
  container: PIXI.Container,
  enemy: Enemy,
  currentTimeMs: number,
  delta: number
) {
  const state = enemy.resonantEvolutionState;
  const isRecovering =
    (enemy.resonantEvolutionRecoveryUntilMs ?? 0) > currentTimeMs;
  let indicator = container.getChildByLabel('resonantEvolutionIndicator') as
    | ResonantEvolutionIndicator
    | undefined;

  if (!state && !isRecovering) {
    if (indicator) {
      container.removeChild(indicator);
      indicator.destroy({ children: true });
    }
    return;
  }

  if (!indicator) {
    indicator = new PIXI.Container() as ResonantEvolutionIndicator;
    indicator.label = 'resonantEvolutionIndicator';
    indicator.elapsed = 0;
    const rings = new PIXI.Graphics();
    rings.label = 'resonantEvolutionRings';
    indicator.addChild(rings);
    container.addChildAt(indicator, Math.min(1, container.children.length));
  }

  indicator.elapsed += delta;
  const rings = indicator.getChildByLabel('resonantEvolutionRings') as
    | PIXI.Graphics
    | undefined;
  if (!rings) return;

  const isChanneling = state?.phase === 'channeling';
  const isEvolving = isChanneling && state?.role === 'evolving';
  const progress = state
    ? Math.max(
        0,
        Math.min(1, (currentTimeMs - state.startedAtMs) / state.durationMs)
      )
    : 1;
  const pulse = Math.sin(indicator.elapsed * 0.12);
  const primaryColor = isEvolving || isRecovering ? 0xfacc15 : 0x67e8f9;

  rings.clear();
  const ringCount = state?.phase === 'forming' ? 2 : 3;
  for (let index = 0; index < ringCount; index++) {
    const radius = 20 + index * 7 + pulse * (1.5 + index * 0.4);
    rings.circle(0, 0, radius);
    rings.stroke({
      color: index === 1 ? 0x67e8f9 : primaryColor,
      alpha: 0.28 + index * 0.12,
      width: isEvolving ? 2.5 : 1.8,
    });
  }
  if (state || isRecovering) {
    rings.arc(0, 0, 38, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    rings.stroke({
      color: primaryColor,
      alpha: 0.95,
      width: isEvolving || isRecovering ? 4 : 2.5,
      cap: 'round',
    });
  }
  indicator.rotation = isEvolving
    ? indicator.elapsed * 0.003
    : -indicator.elapsed * 0.002;
  indicator.alpha = isRecovering ? 1 : 0.78 + progress * 0.22;
}

type CursedFlame = PIXI.Graphics & {
  age: number;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  phase: number;
  wobbleSpeed: number;
  baseScale: number;
};

type CursedAuraContainer = PIXI.Container & {
  elapsed: number;
};

function drawCursedFlame(flame: PIXI.Graphics, size: number) {
  const outerColors = [0x3b0764, 0x581c87, 0x6b21a8];
  const innerColors = [0xa855f7, 0xc084fc, 0xe879f9];
  const colorIndex = Math.floor(Math.random() * outerColors.length);

  flame.moveTo(0, -size);
  flame.bezierCurveTo(
    size * 0.85,
    -size * 0.05,
    size * 0.62,
    size * 0.72,
    0,
    size
  );
  flame.bezierCurveTo(
    -size * 0.68,
    size * 0.68,
    -size * 0.72,
    -size * 0.08,
    0,
    -size
  );
  flame.fill({ color: outerColors[colorIndex], alpha: 0.88 });

  flame.moveTo(size * 0.06, -size * 0.38);
  flame.bezierCurveTo(
    size * 0.42,
    size * 0.04,
    size * 0.25,
    size * 0.48,
    0,
    size * 0.62
  );
  flame.bezierCurveTo(
    -size * 0.25,
    size * 0.35,
    -size * 0.22,
    0,
    size * 0.06,
    -size * 0.38
  );
  flame.fill({ color: innerColors[colorIndex], alpha: 0.9 });
}

function drawProjectileFlame(
  flame: PIXI.Graphics,
  outerColor: number,
  innerColor: number
) {
  const size = 8;

  flame.moveTo(0, -size * 1.25);
  flame.bezierCurveTo(
    size * 0.9,
    -size * 0.25,
    size * 0.85,
    size * 0.75,
    0,
    size
  );
  flame.bezierCurveTo(
    -size * 0.85,
    size * 0.75,
    -size * 0.9,
    -size * 0.25,
    0,
    -size * 1.25
  );
  flame.fill({ color: outerColor });

  flame.moveTo(0, -size * 0.45);
  flame.bezierCurveTo(size * 0.42, 0, size * 0.38, size * 0.48, 0, size * 0.62);
  flame.bezierCurveTo(
    -size * 0.38,
    size * 0.48,
    -size * 0.42,
    0,
    0,
    -size * 0.45
  );
  flame.fill({ color: innerColor });

  // The flame is drawn vertically; turn its rounded edge toward travel.
  flame.rotation = -Math.PI / 2;
}

function drawWaterStreamSegment(
  water: PIXI.Graphics,
  outerColor: number,
  innerColor: number,
  highlightColor: number
) {
  water.moveTo(-11, 0);
  water.bezierCurveTo(-5, -6, 5, -7, 11, 0);
  water.bezierCurveTo(5, 7, -5, 6, -11, 0);
  water.fill({ color: outerColor });

  water.moveTo(-7, -0.5);
  water.bezierCurveTo(-2, -3.8, 5, -4.2, 8, -0.3);
  water.bezierCurveTo(3, 3.7, -2, 3.2, -7, -0.5);
  water.fill({ color: innerColor });

  water.ellipse(2.5, -2.1, 3.8, 1.25);
  water.fill({ color: highlightColor, alpha: 0.9 });
}

function drawSailcutterBlade(
  blade: PIXI.Graphics,
  shadowColor: number,
  windColor: number,
  highlightColor: number
) {
  blade.moveTo(-5, -33);
  blade.bezierCurveTo(15, -24, 23, -7, 19, 8);
  blade.bezierCurveTo(15, 22, 5, 30, -7, 34);
  blade.bezierCurveTo(6, 18, 10, 5, 8, -7);
  blade.bezierCurveTo(6, -18, 1, -27, -5, -33);
  blade.closePath();
  blade.fill({ color: windColor, alpha: 0.96 });
  blade.stroke({ color: shadowColor, width: 2.5, alpha: 0.76, join: 'round' });

  blade.moveTo(-1, -28);
  blade.bezierCurveTo(11, -19, 16, -4, 12, 9);
  blade.bezierCurveTo(9, 20, 3, 27, -3, 31);
  blade.stroke({
    color: highlightColor,
    width: 2.4,
    alpha: 0.95,
    cap: 'round',
  });
}

function drawSailcutterProjectile(
  container: PIXI.Container,
  shadowColor: number,
  windColor: number,
  highlightColor: number
) {
  const upperBlade = new PIXI.Graphics();
  upperBlade.label = 'sailcutter_upper_blade';
  drawSailcutterBlade(upperBlade, shadowColor, windColor, highlightColor);
  upperBlade.position.set(-6, -3);
  upperBlade.rotation = -0.09;
  upperBlade.scale.set(0.88);
  upperBlade.alpha = 0.82;
  container.addChild(upperBlade);

  const lowerBlade = new PIXI.Graphics();
  lowerBlade.label = 'sailcutter_lower_blade';
  drawSailcutterBlade(lowerBlade, shadowColor, windColor, highlightColor);
  lowerBlade.position.set(6, 3);
  lowerBlade.rotation = 0.09;
  container.addChild(lowerBlade);
}

function drawWaterDashTrail(trail: PIXI.Graphics) {
  const streaks = [
    { y: -16, length: 58, width: 7, color: 0x7dd3fc },
    { y: -5, length: 76, width: 10, color: 0x0ea5e9 },
    { y: 7, length: 70, width: 9, color: 0x38bdf8 },
    { y: 18, length: 52, width: 6, color: 0xbae6fd },
  ];

  streaks.forEach(({ y, length, width, color }, index) => {
    const drawStreakPath = () => {
      trail.moveTo(-5, y);
      trail.bezierCurveTo(
        -length * 0.35,
        y - 7 + index * 2,
        -length * 0.72,
        y + 7 - index * 2,
        -length,
        y
      );
    };
    drawStreakPath();
    trail.stroke({
      color: 0x075985,
      width: width + 6,
      alpha: 0.72,
      cap: 'round',
    });
    drawStreakPath();
    trail.stroke({ color, width, alpha: 1, cap: 'round' });
  });

  const droplets = [
    { x: -23, y: -27, r: 4.2 },
    { x: -42, y: 27, r: 3.8 },
    { x: -62, y: -22, r: 3.2 },
    { x: -17, y: 29, r: 3 },
    { x: -71, y: 13, r: 2.6 },
  ];
  droplets.forEach(({ x, y, r }) => trail.circle(x, y, r));
  trail.fill({ color: 0xd9f7ff, alpha: 1 });
}

function drawCoirBola(
  container: PIXI.Container,
  shadowColor: number,
  fiberColor: number,
  highlightColor: number,
  sparkColor: number
) {
  const core = new PIXI.Container();
  core.label = 'coir_bola_core';

  const knot = new PIXI.Graphics();
  knot.circle(0, 0, 9);
  knot.fill({ color: shadowColor });
  knot.circle(0, 0, 7.2);
  knot.fill({ color: fiberColor });
  knot.arc(0, 0, 5.2, -0.35, Math.PI * 1.5);
  knot.stroke({ color: highlightColor, width: 1.7, alpha: 0.95 });
  knot.arc(0, 0, 3.1, Math.PI * 0.75, Math.PI * 2.35);
  knot.stroke({ color: shadowColor, width: 1.3, alpha: 0.75 });
  knot.ellipse(2.2, -3.1, 2.1, 1.2);
  knot.fill({ color: highlightColor, alpha: 0.72 });
  core.addChild(knot);

  const leafGlint = new PIXI.Graphics();
  leafGlint.moveTo(5.5, -7);
  leafGlint.quadraticCurveTo(10, -9, 10.5, -4.5);
  leafGlint.quadraticCurveTo(7.5, -3.5, 5.5, -7);
  leafGlint.fill({ color: sparkColor, alpha: 0.9 });
  core.addChild(leafGlint);

  container.addChild(core);
}

function drawCoirSnareImpact(
  container: PIXI.Container,
  shadowColor: number,
  fiberColor: number,
  highlightColor: number,
  sparkColor: number
) {
  const snare = new PIXI.Container();
  snare.label = 'coir_snare_loops';
  snare.y = -9;

  const loops = new PIXI.Graphics();
  const loopSpecs = [
    { y: -13, width: 48, height: 11, rotation: -0.08 },
    { y: -2, width: 55, height: 13, rotation: 0.06 },
    { y: 9, width: 45, height: 10, rotation: -0.04 },
  ];
  loopSpecs.forEach(({ y, width, height }) => {
    loops.ellipse(0, y, width / 2, height / 2);
    loops.stroke({ color: shadowColor, width: 6, alpha: 0.9 });
    loops.ellipse(0, y, width / 2, height / 2);
    loops.stroke({ color: fiberColor, width: 3.5, alpha: 1 });
    loops.ellipse(0, y - 0.8, width / 2, height / 2);
    loops.stroke({ color: highlightColor, width: 1, alpha: 0.75 });
  });
  loops.rotation = loopSpecs[1].rotation;
  snare.addChild(loops);

  const knot = new PIXI.Graphics();
  knot.label = 'coir_snare_knot';
  knot.circle(27, -2, 5.2);
  knot.fill({ color: shadowColor });
  knot.circle(27, -2, 3.5);
  knot.fill({ color: fiberColor });
  knot.moveTo(25, -4);
  knot.lineTo(30, 1);
  knot.stroke({ color: highlightColor, width: 1.2, alpha: 0.9 });
  snare.addChild(knot);

  container.addChild(snare);

  const fibers = new PIXI.Graphics();
  fibers.label = 'coir_snare_fibers';
  const fiberAngles = [-2.8, -2.1, -1.3, -0.55, 0.2, 0.85, 1.55, 2.35];
  fiberAngles.forEach((angle, index) => {
    const innerRadius = 23 + (index % 2) * 3;
    const outerRadius = innerRadius + 8 + (index % 3) * 2;
    fibers.moveTo(
      Math.cos(angle) * innerRadius,
      -8 + Math.sin(angle) * innerRadius * 0.45
    );
    fibers.lineTo(
      Math.cos(angle) * outerRadius,
      -8 + Math.sin(angle) * outerRadius * 0.55
    );
  });
  fibers.stroke({ color: highlightColor, width: 2, alpha: 0.88 });
  container.addChild(fibers);

  const sparks = new PIXI.Graphics();
  sparks.label = 'coir_snare_sparks';
  const sparkPositions = [
    { x: -30, y: -23, scale: 1 },
    { x: -21, y: 10, scale: 0.7 },
    { x: 4, y: -30, scale: 0.85 },
    { x: 25, y: -19, scale: 0.75 },
    { x: 32, y: 6, scale: 0.9 },
  ];
  sparkPositions.forEach(({ x, y, scale }) => {
    sparks.moveTo(x, y - 4 * scale);
    sparks.quadraticCurveTo(x + 4 * scale, y, x, y + 4 * scale);
    sparks.quadraticCurveTo(x - 4 * scale, y, x, y - 4 * scale);
    sparks.fill({ color: sparkColor, alpha: 0.95 });
  });
  container.addChild(sparks);
}

function updateCoirSnareImpact(container: PIXI.Container, progress: number) {
  const snare = container.getChildByLabel('coir_snare_loops') as
    | PIXI.Container
    | undefined;
  const fibers = container.getChildByLabel('coir_snare_fibers') as
    | PIXI.Graphics
    | undefined;
  const sparks = container.getChildByLabel('coir_snare_sparks') as
    | PIXI.Graphics
    | undefined;

  const unfurl = Math.min(1, progress / 0.18);
  const tighten = Math.min(1, Math.max(0, (progress - 0.18) / 0.22));
  const fade = Math.min(1, Math.max(0, (progress - 0.78) / 0.22));

  if (snare) {
    const widthScale = (0.2 + unfurl * 0.95) * (1 - tighten * 0.12);
    const heightScale = (0.35 + unfurl * 0.8) * (1 - tighten * 0.2);
    snare.scale.set(widthScale, heightScale);
    snare.rotation = Math.sin(progress * Math.PI * 5) * 0.025;
  }

  if (fibers) {
    fibers.scale.set(0.55 + unfurl * 0.65);
    fibers.alpha = Math.max(0, 1 - progress / 0.42);
  }

  if (sparks) {
    sparks.scale.set(0.7 + unfurl * 0.6);
    sparks.alpha = Math.max(0, 1 - progress / 0.5);
    sparks.rotation = progress * 0.35;
  }

  container.alpha = 1 - fade;
}

function drawBarrelBashImpact(container: PIXI.Container) {
  const wave = new PIXI.Graphics();
  wave.label = 'barrel_bash_wave';
  container.addChild(wave);

  const splash = new PIXI.Graphics();
  splash.label = 'barrel_bash_splash';
  container.addChild(splash);
}

function updateBarrelBashImpact(container: PIXI.Container, progress: number) {
  const wave = container.getChildByLabel('barrel_bash_wave') as
    | PIXI.Graphics
    | undefined;
  const splash = container.getChildByLabel('barrel_bash_splash') as
    | PIXI.Graphics
    | undefined;
  const burst = Math.min(1, progress / 0.35);
  const fade = Math.min(1, Math.max(0, (progress - 0.62) / 0.38));
  const opacity = 1 - fade;

  if (wave) {
    const radius = 10 + burst * 42;
    wave.clear();
    wave.ellipse(0, 5, radius, radius * 0.42);
    wave.stroke({ color: 0x38bdf8, width: 8, alpha: 0.72 * opacity });
    wave.ellipse(0, 5, radius * 0.78, radius * 0.31);
    wave.stroke({ color: 0xbae6fd, width: 3, alpha: 0.9 * opacity });
  }

  if (splash) {
    splash.clear();
    for (let index = 0; index < 12; index += 1) {
      const angle = -Math.PI * 0.9 + (index / 11) * Math.PI * 1.8;
      const distance = (18 + (index % 4) * 6) * burst;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - 8 * burst;
      const size = 2.5 + (index % 3);
      splash.ellipse(x, y, size, size * 1.7);
      splash.fill({
        color: index % 3 === 0 ? 0xbae6fd : 0x0ea5e9,
        alpha: 0.85 * opacity,
      });
    }
  }

  container.alpha = opacity;
}

function drawWindGust(container: PIXI.Container) {
  const haze = new PIXI.Graphics();
  haze.label = 'wind_gust_haze';
  container.addChild(haze);

  const rings = new PIXI.Graphics();
  rings.label = 'wind_gust_rings';
  container.addChild(rings);

  const streaks = new PIXI.Graphics();
  streaks.label = 'wind_gust_streaks';
  container.addChild(streaks);
}

function drawHowl(container: PIXI.Container) {
  const rings = new PIXI.Graphics();
  rings.label = 'howl_rings';
  container.addChild(rings);

  const accents = new PIXI.Graphics();
  accents.label = 'howl_accents';
  container.addChild(accents);
}

function updateHowl(
  container: PIXI.Container,
  progress: number,
  maxRadius: number
) {
  const rings = container.getChildByLabel('howl_rings') as
    | PIXI.Graphics
    | undefined;
  const accents = container.getChildByLabel('howl_accents') as
    | PIXI.Graphics
    | undefined;
  const expansion = 1 - Math.pow(1 - progress, 2.6);
  const fade = 1 - Math.max(0, (progress - 0.68) / 0.32);
  const radius = Math.max(3, maxRadius * expansion);

  if (rings) {
    rings.clear();
    for (let index = 0; index < 3; index += 1) {
      const ringRadius = radius * (0.56 + index * 0.2);
      rings.circle(0, 0, ringRadius);
      rings.stroke({
        color: index === 1 ? 0xfacc15 : 0x67e8f9,
        width: 4 - index * 0.7,
        alpha: fade * (0.9 - index * 0.16),
      });
    }
  }

  if (accents) {
    accents.clear();
    for (let index = 0; index < 10; index += 1) {
      const angle = index * 2.399 + progress * 0.8;
      const innerRadius = radius * 0.72;
      const outerRadius = innerRadius + 8 + (index % 3) * 4;
      accents.moveTo(
        Math.cos(angle) * innerRadius,
        Math.sin(angle) * innerRadius
      );
      accents.lineTo(
        Math.cos(angle) * outerRadius,
        Math.sin(angle) * outerRadius
      );
    }
    accents.stroke({ color: 0xfef08a, width: 3, alpha: fade * 0.75 });
  }
}

function updateWindGust(
  container: PIXI.Container,
  progress: number,
  maxRadius: number
) {
  const haze = container.getChildByLabel('wind_gust_haze') as
    | PIXI.Graphics
    | undefined;
  const rings = container.getChildByLabel('wind_gust_rings') as
    | PIXI.Graphics
    | undefined;
  const streaks = container.getChildByLabel('wind_gust_streaks') as
    | PIXI.Graphics
    | undefined;
  const expansion = 1 - Math.pow(1 - progress, 3);
  const radius = Math.max(2, maxRadius * expansion);
  const fade = Math.min(1, Math.max(0, (progress - 0.72) / 0.28));
  const opacity = 1 - fade;

  if (haze) {
    haze.clear();
    haze.circle(0, 0, radius * 0.82);
    haze.fill({ color: 0xdff7ff, alpha: 0.07 * opacity });
  }

  if (rings) {
    rings.clear();
    for (let index = 0; index < 8; index += 1) {
      const ringRadius = radius * (0.25 + index * 0.1);
      const start = index * 0.83 + progress * 4.5;
      rings.arc(0, 0, ringRadius, start, start + 1.3);
    }
    rings.stroke({ color: 0xd8f5ff, width: 4, alpha: 0.72 * opacity });
  }

  if (streaks) {
    streaks.clear();
    for (let index = 0; index < 20; index += 1) {
      const angle = index * 2.399 + progress * 3.4;
      const distance = radius * (0.3 + (index % 7) * 0.095);
      const length = 8 + (index % 5) * 3;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const tangentX = -Math.sin(angle) * length;
      const tangentY = Math.cos(angle) * length;
      streaks.moveTo(x - tangentX, y - tangentY);
      streaks.quadraticCurveTo(
        x + Math.cos(angle) * 3,
        y + Math.sin(angle) * 3,
        x + tangentX,
        y + tangentY
      );
    }
    streaks.stroke({ color: 0xffffff, width: 2.5, alpha: 0.8 * opacity });
  }

  container.rotation = progress * 0.32;
  container.alpha = opacity;
}

function drawHarden(container: PIXI.Container) {
  const overlay = new PIXI.Graphics();
  overlay.label = 'harden_overlay';
  container.addChild(overlay);

  const plates = new PIXI.Graphics();
  plates.label = 'harden_plates';
  container.addChild(plates);

  const glints = new PIXI.Graphics();
  glints.label = 'harden_glints';
  container.addChild(glints);
}

function updateHarden(container: PIXI.Container, progress: number) {
  const overlay = container.getChildByLabel('harden_overlay') as
    | PIXI.Graphics
    | undefined;
  const plates = container.getChildByLabel('harden_plates') as
    | PIXI.Graphics
    | undefined;
  const glints = container.getChildByLabel('harden_glints') as
    | PIXI.Graphics
    | undefined;
  const lockIn = 1 - Math.pow(1 - Math.min(1, progress / 0.42), 3);
  const fade = Math.min(1, Math.max(0, (progress - 0.72) / 0.28));
  const opacity = 1 - fade;
  const shellRadius = 50 - lockIn * 10;

  if (overlay) {
    overlay.clear();
    overlay.moveTo(0, -46);
    overlay.lineTo(34, -30);
    overlay.lineTo(43, 5);
    overlay.lineTo(24, 36);
    overlay.lineTo(0, 48);
    overlay.lineTo(-24, 36);
    overlay.lineTo(-43, 5);
    overlay.lineTo(-34, -30);
    overlay.closePath();
    overlay.fill({ color: 0x94a3b8, alpha: 0.2 * lockIn * opacity });
    overlay.stroke({
      color: 0xf8fafc,
      width: 2.5,
      alpha: 0.78 * opacity,
      join: 'round',
    });
  }

  if (plates) {
    plates.clear();
    for (let index = 0; index < 8; index += 1) {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / 8;
      const tangentX = -Math.sin(angle);
      const tangentY = Math.cos(angle);
      const radialX = Math.cos(angle);
      const radialY = Math.sin(angle);
      const radius = shellRadius + (1 - lockIn) * (16 + (index % 2) * 7);
      const x = radialX * radius;
      const y = radialY * radius;
      const halfWidth = 11;
      const halfDepth = 5.5;
      plates.moveTo(
        x - tangentX * halfWidth - radialX * halfDepth,
        y - tangentY * halfWidth - radialY * halfDepth
      );
      plates.lineTo(
        x + tangentX * halfWidth - radialX * halfDepth,
        y + tangentY * halfWidth - radialY * halfDepth
      );
      plates.lineTo(
        x + tangentX * (halfWidth - 3) + radialX * halfDepth,
        y + tangentY * (halfWidth - 3) + radialY * halfDepth
      );
      plates.lineTo(
        x - tangentX * (halfWidth - 3) + radialX * halfDepth,
        y - tangentY * (halfWidth - 3) + radialY * halfDepth
      );
      plates.closePath();
      plates.fill({
        color: index % 2 === 0 ? 0x64748b : 0x94a3b8,
        alpha: 0.9 * opacity,
      });
      plates.stroke({ color: 0xe2e8f0, width: 1.5, alpha: 0.9 * opacity });
    }
  }

  if (glints) {
    glints.clear();
    const glintProgress = Math.min(1, Math.max(0, (progress - 0.25) / 0.35));
    const glintAlpha = Math.sin(glintProgress * Math.PI) * opacity;
    const glintX = -30 + glintProgress * 60;
    const glintY = -30 + glintProgress * 18;
    glints.moveTo(glintX - 9, glintY);
    glints.lineTo(glintX + 9, glintY);
    glints.moveTo(glintX, glintY - 12);
    glints.lineTo(glintX, glintY + 12);
    glints.stroke({ color: 0xffffff, width: 3, alpha: glintAlpha });
  }

  const impactPulse =
    1 + Math.sin(Math.min(1, progress / 0.5) * Math.PI) * 0.08;
  overlay?.scale.set(impactPulse);
  plates?.scale.set(impactPulse);
  glints?.scale.set(impactPulse);
  container.alpha = opacity;
}

function spawnCursedFlame(
  aura: PIXI.Container,
  spriteWidth: number,
  spriteHeight: number
) {
  const flame = new PIXI.Graphics() as CursedFlame;
  flame.label = 'cursedFlame';
  flame.age = 0;
  flame.maxLife = 38 + Math.random() * 28;
  flame.life = flame.maxLife;
  flame.vx = (Math.random() - 0.5) * 0.18;
  flame.vy = -(0.22 + Math.random() * 0.28);
  flame.phase = Math.random() * Math.PI * 2;
  flame.wobbleSpeed = 0.08 + Math.random() * 0.06;
  flame.baseScale = 0.62 + Math.random() * 0.48;

  const spawnOnSide = Math.random() < 0.58;
  if (spawnOnSide) {
    const side = Math.random() < 0.5 ? -1 : 1;
    flame.x = side * spriteWidth * (0.4 + Math.random() * 0.12);
    flame.y = (Math.random() - 0.5) * spriteHeight * 0.78;
  } else {
    flame.x = (Math.random() - 0.5) * spriteWidth * 0.82;
    flame.y = spriteHeight * (0.24 + Math.random() * 0.18);
  }

  drawCursedFlame(flame, 6 + Math.random() * 5);
  aura.addChild(flame);
}

/**
 * Tints a cursed unit purple and surrounds its silhouette with rising,
 * flickering purple flames. The effect sizes itself from the current sprite.
 */
function updateCursedAura(
  container: PIXI.Container,
  unit: BaseTDUnit,
  sprite: PIXI.Sprite,
  delta: number
) {
  let aura = container.getChildByLabel('cursedAura') as
    | CursedAuraContainer
    | undefined;

  if (!unit.isCursed) {
    if (aura) {
      container.removeChild(aura);
      aura.destroy({ children: true });
    }
    return;
  }

  // The hit's light elemental flash takes priority; cursed tint returns after.
  if ((unit.damageFlashTimerMs || 0) <= 0) {
    sprite.tint = 0xc084fc;
  }

  if (!aura) {
    aura = new PIXI.Container() as CursedAuraContainer;
    aura.label = 'cursedAura';
    aura.elapsed = 0;

    // Keep the aura above the ground shadow but behind the creature artwork.
    container.addChildAt(aura, container.getChildIndex(sprite));
  }

  aura.elapsed += delta;
  aura.position.set(sprite.x, sprite.y);

  const spriteWidth = sprite.texture.width * Math.abs(sprite.scale.x);
  const spriteHeight = sprite.texture.height * Math.abs(sprite.scale.y);
  const effectWidth = Math.max(72, spriteWidth);
  const effectHeight = Math.max(42, spriteHeight);

  const flames = [...aura.children] as CursedFlame[];
  for (const flame of flames) {
    flame.age += delta;
    flame.life -= delta;
    if (flame.life <= 0) {
      aura.removeChild(flame);
      flame.destroy();
      continue;
    }

    flame.x +=
      (flame.vx +
        Math.sin(flame.age * flame.wobbleSpeed + flame.phase) * 0.11) *
      delta;
    flame.y += flame.vy * delta;
    flame.rotation =
      Math.sin(flame.age * flame.wobbleSpeed + flame.phase) * 0.16;

    const lifeRatio = flame.life / flame.maxLife;
    const fadeIn = Math.min(1, flame.age / 7);
    flame.alpha = fadeIn * Math.min(1, lifeRatio * 1.65);
    const flicker = 1 + Math.sin(flame.age * 0.32 + flame.phase) * 0.1;
    flame.scale.set(flame.baseScale * (0.65 + lifeRatio * 0.4) * flicker);
  }

  if (aura.children.length === 0) {
    for (let index = 0; index < 7; index++) {
      spawnCursedFlame(aura, effectWidth, effectHeight);
      const flame = aura.children[aura.children.length - 1] as CursedFlame;
      flame.age = Math.random() * flame.maxLife * 0.75;
      flame.life = flame.maxLife - flame.age;
    }
  }

  if (aura.children.length < 14 && Math.random() < Math.min(0.5, delta * 0.3)) {
    spawnCursedFlame(aura, effectWidth, effectHeight);
  }
}

type DrenchedDroplet = PIXI.Graphics & {
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
};

type DrenchedAura = PIXI.Container;

function drawDrenchedDroplet(droplet: PIXI.Graphics) {
  droplet.moveTo(0, -7);
  droplet.bezierCurveTo(6, -1, 5, 6, 0, 7);
  droplet.bezierCurveTo(-5, 6, -6, -1, 0, -7);
  droplet.fill({ color: 0x0ea5e9, alpha: 0.82 });
  droplet.ellipse(1.4, -1.8, 1.6, 2.2);
  droplet.fill({ color: 0xbae6fd, alpha: 0.9 });
}

function spawnDrenchedDroplet(aura: DrenchedAura) {
  const droplet = new PIXI.Graphics() as DrenchedDroplet;
  droplet.maxLife = 34 + Math.random() * 30;
  droplet.life = droplet.maxLife;
  droplet.vx = (Math.random() - 0.5) * 0.18;
  droplet.vy = 0.42 + Math.random() * 0.55;
  droplet.x = (Math.random() - 0.5) * 58;
  droplet.y = -48 + Math.random() * 36;
  const scale = 0.42 + Math.random() * 0.38;
  droplet.scale.set(scale);
  drawDrenchedDroplet(droplet);
  aura.addChild(droplet);
}

function updateDrenchedAura(
  container: PIXI.Container,
  enemy: Enemy,
  sprite: PIXI.Sprite,
  delta: number
) {
  const isDrenched = enemy.statusConditions.some(
    (status) => status.type === 'DRENCHED'
  );
  let aura = container.getChildByLabel('drenchedAura') as
    | DrenchedAura
    | undefined;

  if (!isDrenched) {
    if (aura) {
      container.removeChild(aura);
      aura.destroy({ children: true });
    }
    return;
  }

  if ((enemy.damageFlashTimerMs || 0) <= 0) {
    sprite.tint = 0x67c7f7;
  }

  if (!aura) {
    aura = new PIXI.Container() as DrenchedAura;
    aura.label = 'drenchedAura';
    for (let index = 0; index < 6; index += 1) {
      spawnDrenchedDroplet(aura);
      const droplet = aura.children[
        aura.children.length - 1
      ] as DrenchedDroplet;
      droplet.life -= Math.random() * droplet.maxLife * 0.65;
    }
    container.addChild(aura);
  }

  for (const child of [...aura.children]) {
    const droplet = child as DrenchedDroplet;
    droplet.life -= delta;
    if (droplet.life <= 0) {
      aura.removeChild(droplet);
      droplet.destroy();
      continue;
    }
    droplet.x += droplet.vx * delta;
    droplet.y += droplet.vy * delta;
    const lifeRatio = droplet.life / droplet.maxLife;
    droplet.alpha = Math.min(1, lifeRatio * 1.8);
  }

  if (
    aura.children.length < 10 &&
    Math.random() < Math.min(0.75, delta * 0.3)
  ) {
    spawnDrenchedDroplet(aura);
  }
}

const TYPE_COLORS: Record<ElementType, number> = {
  [ElementType.WATER]: 0x3b82f6,
  [ElementType.FIRE]: 0xef4444,
  [ElementType.GRASS]: 0x22c55e,
  [ElementType.BUG]: 0x65a30d,
  [ElementType.STEEL]: 0x64748b,
  [ElementType.POISON]: 0xa855f7,
  [ElementType.ELECTRIC]: 0xeab308,
  [ElementType.NORMAL]: 0xa3a3a3,
  [ElementType.FLYING]: 0x38bdf8,
};

interface PixiBattlefieldProps {
  engine: TowerDefenseEngine;
  onMapDrop: (defId: string, x: number, y: number) => void;
  onMapRemove: (defId: string) => void;
  onEnemyCaptured?: (enemyId: string) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  getDragState?: () => 'tower' | 'capture' | false;
  backgroundUrl?: string;
  backgroundScale?: number;
  initialView?: TDInitialView;
  openingPan?: TDOpeningPan;
  onOpeningPanComplete?: () => void;
  hideUi?: boolean;
}

export interface PixiBattlefieldRef {
  handleExternalMove: (
    clientX: number,
    clientY: number,
    type: 'tower' | 'capture'
  ) => void;
  handleExternalLeave: () => void;
  handleExternalDrop: (
    clientX: number,
    clientY: number,
    towerIdStr: string | null,
    isCaptureDevice: boolean
  ) => void;
}

const PixiBattlefield = forwardRef<PixiBattlefieldRef, PixiBattlefieldProps>(
  (
    {
      engine,
      onMapDrop,
      onMapRemove,
      onEnemyCaptured,
      onDragStateChange,
      getDragState,
      backgroundUrl,
      backgroundScale = 1,
      initialView,
      openingPan,
      onOpeningPanComplete,
      hideUi = false,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const fpsRef = useRef<HTMLDivElement>(null);
    const onMapDropRef = useRef(onMapDrop);
    const onMapRemoveRef = useRef(onMapRemove);
    const onEnemyCapturedRef = useRef(onEnemyCaptured);
    const onDragStateChangeRef = useRef(onDragStateChange);
    const onOpeningPanCompleteRef = useRef(onOpeningPanComplete);
    const getDragStateRef = useRef(getDragState);
    const dragPosRef = useRef<{ x: number; y: number } | null>(null);
    const draggingCaptureDeviceRef = useRef<boolean>(false);
    const bgBoundsRef = useRef<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>({ x: 0, y: 0, width: 0, height: 0 });
    const scrollRef = useRef({ x: 0, y: 0 });
    const isScrollDraggingRef = useRef(false);
    const isOpeningPanActiveRef = useRef(!!openingPan);
    const scrollDragStartRef = useRef<{
      x: number;
      y: number;
      scrollX: number;
      scrollY: number;
    } | null>(null);
    const zoomRef = useRef(
      resolveTDInitialView(backgroundScale, initialView).zoom
    ); // Same value changed by the in-game +/- controls.

    useImperativeHandle(ref, () => ({
      handleExternalMove: (clientX, clientY, type) => {
        if (isOpeningPanActiveRef.current) return;
        draggingCaptureDeviceRef.current = type === 'capture';
        const bgBounds = bgBoundsRef.current;
        if (bgBounds && bgBounds.width > 0 && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const localX = clientX - rect.left - bgBounds.x;
          const localY = clientY - rect.top - bgBounds.y;
          const x = (localX / bgBounds.width) * 100;
          const y = (localY / bgBounds.height) * 100;
          dragPosRef.current = { x, y };
        }
      },
      handleExternalLeave: () => {
        dragPosRef.current = null;
        draggingCaptureDeviceRef.current = false;
      },
      handleExternalDrop: (clientX, clientY, towerIdStr, isCaptureDevice) => {
        if (isOpeningPanActiveRef.current) return;
        dragPosRef.current = null;
        draggingCaptureDeviceRef.current = false;

        const bgBounds = bgBoundsRef.current;
        if (!bgBounds || bgBounds.width === 0 || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const localX = clientX - rect.left - bgBounds.x;
        const localY = clientY - rect.top - bgBounds.y;
        const x = (localX / bgBounds.width) * 100;
        const y = (localY / bgBounds.height) * 100;

        if (isCaptureDevice && engine) {
          let targetedEnemyId: string | null = null;
          let isWeakened = false;
          let minSqDist = Infinity;
          const CAPTURE_DIST_SQ = 64; // distance squared for hovering enemy

          engine.enemies.forEach((enemy) => {
            const dx = x - enemy.position.x;
            const dy = y - enemy.position.y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= CAPTURE_DIST_SQ && distSq < minSqDist) {
              minSqDist = distSq;
              targetedEnemyId = enemy.id;
              isWeakened =
                enemy.isShiny || enemy.hp / enemy.maxHp <= WEAKENED_THRESHOLD;
            }
          });

          if (targetedEnemyId && isWeakened) {
            if (onEnemyCapturedRef.current) {
              onEnemyCapturedRef.current(targetedEnemyId);
            }
          }
          return;
        }

        if (towerIdStr) {
          if (engine) {
            let closestSpot: { x: number; y: number } | null = null;
            let minSqDist = Infinity;
            const SNAP_DIST_SQ = 100; // 10 units squared

            for (const spot of engine.placementSpots) {
              const dx = x - spot.x;
              const dy = y - spot.y;
              const distSq = dx * dx + dy * dy;

              if (distSq <= SNAP_DIST_SQ && distSq < minSqDist) {
                minSqDist = distSq;
                closestSpot = spot;
              }
            }

            if (closestSpot) {
              onMapDropRef.current(towerIdStr, closestSpot.x, closestSpot.y);
            } else {
              if (onMapRemoveRef.current) {
                onMapRemoveRef.current(towerIdStr);
              }
            }
          }
        }
      },
    }));

    // Keep the latest callback without triggering re-runs of the PIXI initializer
    useEffect(() => {
      onMapDropRef.current = onMapDrop;
    }, [onMapDrop]);

    useEffect(() => {
      getDragStateRef.current = getDragState;
    }, [getDragState]);

    useEffect(() => {
      onMapRemoveRef.current = onMapRemove;
    }, [onMapRemove]);

    useEffect(() => {
      onDragStateChangeRef.current = onDragStateChange;
    }, [onDragStateChange]);

    useEffect(() => {
      onEnemyCapturedRef.current = onEnemyCaptured;
    }, [onEnemyCaptured]);

    useEffect(() => {
      onOpeningPanCompleteRef.current = onOpeningPanComplete;
    }, [onOpeningPanComplete]);

    useEffect(() => {
      if (!containerRef.current) return;

      isOpeningPanActiveRef.current = !!openingPan;
      const app = new PIXI.Application();

      let isDestroyed = false;
      let isInitialized = false;
      let bgBounds = { x: 0, y: 0, width: 0, height: 0 };

      const initPixi = async () => {
        await app.init({
          resizeTo: containerRef.current!,
          backgroundAlpha: 0,
          preference: 'webgl',
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        isInitialized = true;
        if (isDestroyed) {
          app.destroy(true, { children: true });
          return;
        }

        containerRef.current!.appendChild(app.canvas);

        // Add background
        const bgUrl = backgroundUrl || '/battles/bg/bg_dock_battle_td.png';
        const scale = backgroundScale > 1 ? backgroundScale : 1;
        const resolvedInitialView = resolveTDInitialView(scale, initialView);
        zoomRef.current = resolvedInitialView.zoom;
        await PIXI.Assets.load(bgUrl);
        if (isDestroyed) return;

        const bgSprite = PIXI.Sprite.from(bgUrl);
        app.stage.addChild(bgSprite);

        // Full (unscrolled) background dimensions — used to derive scroll limits
        let fullBgHeight = 0;
        let fullBgWidth = 0;
        let displayBgHeight = 0;
        let displayBgWidth = 0;
        let shouldApplyInitialView = true;
        let openingPanStartTime: number | null = null;
        let openingPanCompleted = !openingPan;

        // Handle resize + zoom — called each tick to pick up zoom changes
        const updateBgLayout = () => {
          if (
            bgSprite.texture.width > 0 &&
            bgSprite.texture.height > 0 &&
            app.screen.height > 0
          ) {
            const ratio = bgSprite.texture.width / bgSprite.texture.height;
            const zoom = zoomRef.current;
            fullBgHeight = app.screen.height * scale;
            fullBgWidth = fullBgHeight * ratio;

            // Display dimensions = world dims * zoom
            const displayH = fullBgHeight * zoom;
            const displayW = fullBgWidth * zoom;
            displayBgHeight = displayH;
            displayBgWidth = displayW;
            bgSprite.height = displayH;
            bgSprite.width = displayW;

            // Clamp scroll (in pixel space)
            const maxScrollY = Math.max(0, displayH - app.screen.height);
            const maxScrollX = Math.max(0, displayW - app.screen.width);
            if (shouldApplyInitialView) {
              openingPanStartTime = openingPan ? performance.now() : null;
              const openingView = openingPan
                ? resolveTDOpeningPanView(resolvedInitialView, openingPan, 0)
                : resolvedInitialView;
              scrollRef.current = {
                x: maxScrollX * (openingView.offsetX / 100),
                y: maxScrollY * (openingView.offsetY / 100),
              };
              shouldApplyInitialView = false;
            } else if (
              openingPan &&
              openingPanStartTime !== null &&
              !openingPanCompleted
            ) {
              const progress = Math.min(
                1,
                (performance.now() - openingPanStartTime) /
                  Math.max(1, openingPan.durationMs)
              );
              const openingView = resolveTDOpeningPanView(
                resolvedInitialView,
                openingPan,
                progress
              );
              scrollRef.current = {
                x: maxScrollX * (openingView.offsetX / 100),
                y: maxScrollY * (openingView.offsetY / 100),
              };

              if (progress === 1) {
                openingPanCompleted = true;
                isOpeningPanActiveRef.current = false;
                onOpeningPanCompleteRef.current?.();
              }
            } else {
              scrollRef.current.y = Math.min(scrollRef.current.y, maxScrollY);
              scrollRef.current.x = Math.min(scrollRef.current.x, maxScrollX);
            }

            const centeredX = Math.max(0, (app.screen.width - displayW) / 2);
            const centeredY = Math.max(0, (app.screen.height - displayH) / 2);
            bgSprite.x = centeredX - scrollRef.current.x;
            bgSprite.y = centeredY - scrollRef.current.y;

            bgBounds = {
              x: bgSprite.x,
              y: bgSprite.y,
              width: displayW,
              height: displayH,
            };
            bgBoundsRef.current = bgBounds;
            if (engine) {
              engine.setAspectRatio(ratio);
            }
          }
        };
        app.renderer.on('resize', updateBgLayout);
        updateBgLayout(); // Initial setting

        // Interactive background
        bgSprite.eventMode = 'static';

        // --- Scroll drag on background ---
        if (scale > 1) {
          bgSprite.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
            // Only start scroll if not dragging a tower or capture device
            if (
              isOpeningPanActiveRef.current ||
              draggingTowerCreatureId ||
              getDragStateRef.current?.()
            )
              return;
            isScrollDraggingRef.current = true;
            scrollDragStartRef.current = {
              x: e.global.x,
              y: e.global.y,
              scrollX: scrollRef.current.x,
              scrollY: scrollRef.current.y,
            };
          });
        }

        // Sprite caching structure
        const towerSprites = new Map<string, PIXI.Container>();
        const enemySprites = new Map<string, PIXI.Container>();
        const environmentUnitSprites = new Map<string, PIXI.Container>();
        const captureUnitSprites = new Map<string, PIXI.Container>();
        const projectileSprites = new Map<string, PIXI.Container>();
        const vfxSprites = new Map<string, PIXI.Container>();
        const floatingTextSprites = new Map<string, PIXI.Text>();
        const spotGraphics = new PIXI.Graphics();
        const invalidSpotGraphics = new PIXI.Graphics();
        const resonantEvolutionGraphics = new PIXI.Graphics();

        let draggingNode: PIXI.Container | null = null;
        let draggingTowerCreatureId: string | null = null;

        app.stage.eventMode = 'static';
        app.stage.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000);

        const onDragEnd = (e: PIXI.FederatedPointerEvent) => {
          if (draggingTowerCreatureId && bgBounds.width > 0) {
            const x = ((e.global.x - bgBounds.x) / bgBounds.width) * 100;
            const y = ((e.global.y - bgBounds.y) / bgBounds.height) * 100;

            let closestSpot: { x: number; y: number } | null = null;
            let minSqDist = Infinity;
            const SNAP_DIST_SQ = 100; // 10 units squared (percentage)

            for (const spot of engine.placementSpots) {
              const dx = x - spot.x;
              const dy = y - spot.y;
              const distSq = dx * dx + dy * dy;

              if (distSq <= SNAP_DIST_SQ && distSq < minSqDist) {
                minSqDist = distSq;
                closestSpot = spot;
              }
            }

            if (closestSpot) {
              onMapDropRef.current(
                draggingTowerCreatureId,
                closestSpot.x,
                closestSpot.y
              );
            } else {
              if (onMapRemoveRef.current) {
                onMapRemoveRef.current(draggingTowerCreatureId);
              }
            }

            dragPosRef.current = null;
            if (draggingNode) draggingNode.cursor = 'grab';
            draggingNode = null;
            draggingTowerCreatureId = null;
            if (onDragStateChangeRef.current) {
              onDragStateChangeRef.current(false);
            }
          }
        };

        app.stage.on('pointerup', onDragEnd);
        app.stage.on('pointerupoutside', onDragEnd);
        app.stage.on('pointermove', (e) => {
          // Handle scroll dragging
          if (
            isScrollDraggingRef.current &&
            scrollDragStartRef.current &&
            scale > 1
          ) {
            const dx = scrollDragStartRef.current.x - e.global.x;
            const dy = scrollDragStartRef.current.y - e.global.y;
            const maxScrollY = Math.max(0, displayBgHeight - app.screen.height);
            const maxScrollX = Math.max(0, displayBgWidth - app.screen.width);
            scrollRef.current.y = Math.max(
              0,
              Math.min(maxScrollY, scrollDragStartRef.current.scrollY + dy)
            );
            scrollRef.current.x = Math.max(
              0,
              Math.min(maxScrollX, scrollDragStartRef.current.scrollX + dx)
            );
            const centeredX = Math.max(
              0,
              (app.screen.width - displayBgWidth) / 2
            );
            const centeredY = Math.max(
              0,
              (app.screen.height - displayBgHeight) / 2
            );
            bgSprite.x = centeredX - scrollRef.current.x;
            bgSprite.y = centeredY - scrollRef.current.y;
            bgBounds = {
              x: bgSprite.x,
              y: bgSprite.y,
              width: bgSprite.width,
              height: bgSprite.height,
            };
            bgBoundsRef.current = bgBounds;
          }

          if (draggingNode && bgBounds.width > 0) {
            draggingNode.x = e.global.x;
            draggingNode.y = e.global.y;

            dragPosRef.current = {
              x: ((e.global.x - bgBounds.x) / bgBounds.width) * 100,
              y: ((e.global.y - bgBounds.y) / bgBounds.height) * 100,
            };
          }
        });

        // Stop scroll dragging on pointer up
        app.stage.on('pointerup', () => {
          isScrollDraggingRef.current = false;
          scrollDragStartRef.current = null;
        });
        app.stage.on('pointerupoutside', () => {
          isScrollDraggingRef.current = false;
          scrollDragStartRef.current = null;
        });

        // PIXI's internal ticker, synced to monitor refresh rate.
        // This DOES NOT run game logic, it ONLY draws current state.
        app.ticker.add(() => {
          // Re-evaluate bg layout each tick to pick up zoom changes
          updateBgLayout();

          if (fpsRef.current) {
            fpsRef.current.innerText = `FPS: ${Math.round(app.ticker.FPS)}`;
          }

          if (!engine || bgBounds.width === 0) return;

          const zoom = zoomRef.current;
          const screenW = bgBounds.width;
          const screenH = bgBounds.height;
          const offsetX = bgBounds.x;
          const offsetY = bgBounds.y;
          const viewportH = app.screen.height; // For sizing UI elements (not affected by bg scale)

          const externalDragState = getDragStateRef.current
            ? getDragStateRef.current()
            : false;
          const isDraggingCapture =
            draggingCaptureDeviceRef.current || externalDragState === 'capture';
          const isDraggingTower =
            externalDragState === 'tower' ||
            (!isDraggingCapture && dragPosRef.current !== null) ||
            draggingTowerCreatureId !== null;

          // --- Render Environment Units ---
          const currentEnvUnitIds = new Set(
            engine.environmentUnits.map((e) => e.id)
          );
          for (const [id, sprite] of environmentUnitSprites.entries()) {
            if (!currentEnvUnitIds.has(id)) {
              app.stage.removeChild(sprite);
              sprite.destroy({ children: true });
              environmentUnitSprites.delete(id);
            }
          }

          for (const envUnit of engine.environmentUnits) {
            let container = environmentUnitSprites.get(envUnit.id);
            if (!container) {
              container = new PIXI.Container();
              container.eventMode = 'none'; // Not interactive

              const shadow = new PIXI.Graphics();
              shadow.label = 'shadow';
              container.addChild(shadow);

              const sprite = new PIXI.Sprite();
              sprite.label = 'env_sprite';
              sprite.anchor.set(0.5);
              container.addChildAt(sprite, 1);

              app.stage.addChild(container);
              app.stage.setChildIndex(container, 1); // just above background

              environmentUnitSprites.set(envUnit.id, container);
            }

            container.x = offsetX + (envUnit.position.x / 100) * screenW;
            container.y = offsetY + (envUnit.position.y / 100) * screenH;

            // Calculate responsive scale based on the editor's 80x80 box matching 5vh placement spots
            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;

            container.scale.set(finalScale);

            const sprite = container.getChildByLabel('env_sprite') as
              | PIXI.Sprite
              | undefined;
            const shadow = container.getChildByLabel('shadow') as
              | PIXI.Graphics
              | undefined;

            if (sprite && shadow) {
              applyTDUnitTransforms(
                envUnit,
                sprite,
                shadow,
                envUnit.tdConfigId,
                undefined,
                (t) => {
                  if (!isDestroyed) sprite.texture = t;
                }
              );
            }
            renderHealthBar(
              envUnit,
              container,
              envUnit.tdConfigId,
              true /* hideWhenFull */
            );
          }

          // --- Render Capture Units ---
          const currentCaptureUnitIds = new Set(
            engine.captureUnits.map((c) => c.id)
          );
          for (const [id, sprite] of captureUnitSprites.entries()) {
            if (!currentCaptureUnitIds.has(id)) {
              app.stage.removeChild(sprite);
              sprite.destroy({ children: true });
              captureUnitSprites.delete(id);
            }
          }

          for (const capUnit of engine.captureUnits) {
            let container = captureUnitSprites.get(capUnit.id);
            if (!container) {
              container = new PIXI.Container();
              container.eventMode = 'none'; // Not interactive initially

              const shadow = new PIXI.Graphics();
              shadow.label = 'shadow';
              container.addChild(shadow);

              const sprite = new PIXI.Sprite();
              sprite.label = 'cap_sprite';
              sprite.anchor.set(0.5);
              container.addChildAt(sprite, 1);

              app.stage.addChild(container);
              app.stage.setChildIndex(container, 1); // just above background

              captureUnitSprites.set(capUnit.id, container);
            }

            // If held, maybe offset slightly so it looks carried,
            // or just render it at the enemy position (with a small Y offset)
            const heldOffset = capUnit.heldByEnemyId ? screenH * -0.02 : 0;

            container.x = offsetX + (capUnit.position.x / 100) * screenW;
            container.y =
              offsetY + (capUnit.position.y / 100) * screenH + heldOffset;

            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;
            container.scale.set(finalScale);

            // Make it render above the enemy if held (enemy might be index 1 or so, we'll just push to top)
            if (capUnit.heldByEnemyId) {
              app.stage.setChildIndex(container, app.stage.children.length - 1);
            }

            const sprite = container.getChildByLabel('cap_sprite') as
              | PIXI.Sprite
              | undefined;
            const shadow = container.getChildByLabel('shadow') as
              | PIXI.Graphics
              | undefined;

            if (sprite && shadow) {
              // Hide shadow if held
              shadow.visible = !capUnit.heldByEnemyId;

              applyTDUnitTransforms(
                capUnit,
                sprite,
                shadow,
                capUnit.tdConfigId,
                undefined,
                (t) => {
                  if (!isDestroyed) sprite.texture = t;
                },
                getCaptureUnitVisualState(capUnit, engine.elapsedTimeMs)
              );
            }
            renderHealthBar(
              capUnit,
              container,
              capUnit.tdConfigId,
              true /* hideWhenFull */
            );
          }

          // --- Render Towers ---
          const currentTowerKeys = new Set(
            engine.towers.map((t) => `${t.id}_${t.creature.id}`)
          );
          for (const [key, sprite] of towerSprites.entries()) {
            if (!currentTowerKeys.has(key)) {
              app.stage.removeChild(sprite);
              sprite.destroy({ children: true });
              towerSprites.delete(key);
            }
          }
          for (const tower of engine.towers) {
            const cacheKey = `${tower.id}_${tower.creature.id}`;
            let container = towerSprites.get(cacheKey);
            if (!container) {
              const newContainer = new PIXI.Container();
              container = newContainer;

              newContainer.eventMode = tower.isFixed ? 'none' : 'static';
              newContainer.cursor = tower.isFixed ? 'default' : 'grab';
              if (!tower.isFixed) {
                newContainer.on('pointerdown', () => {
                  draggingNode = newContainer;
                  draggingTowerCreatureId = tower.creature.id;
                  newContainer.cursor = 'grabbing';
                  app.stage.setChildIndex(
                    newContainer,
                    app.stage.children.length - 1
                  );
                  if (onDragStateChangeRef.current) {
                    onDragStateChangeRef.current(true);
                  }
                });
              }

              const baseCreature =
                TD_CREATURE_DEFS[tower.creature.speciesId].baseCreature;

              const shadow = new PIXI.Graphics();
              shadow.label = 'shadow';
              container.addChild(shadow);

              const tsprite = new PIXI.Sprite();
              tsprite.label = 'tower_sprite';
              tsprite.anchor.set(0.5);
              container.addChildAt(tsprite, 1);

              const rangeCircle = new PIXI.Graphics();
              rangeCircle.label = 'rangeCircle';
              const radius = TD_BASE_HEIGHT * 0.4; // dynamically scales to viewportH * 0.4
              rangeCircle.circle(0, 0, radius);
              rangeCircle.fill({ color: 0x22d3ee, alpha: 0.05 });
              rangeCircle.stroke({ color: 0x22d3ee, alpha: 0.3, width: 1 });

              container.addChild(rangeCircle);

              app.stage.addChild(container);
              towerSprites.set(cacheKey, container);
            }
            if (draggingTowerCreatureId !== tower.creature.id) {
              container.x = offsetX + (tower.position.x / 100) * screenW;
              container.y = offsetY + (tower.position.y / 100) * screenH;
              const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
              const finalScale = zoom * responsiveScale;
              container.scale.set(finalScale);
            }

            const rCircle = container.getChildByLabel('rangeCircle');
            if (rCircle) {
              rCircle.visible = draggingTowerCreatureId === tower.creature.id;
            }

            const tsprite = container.getChildByLabel('tower_sprite') as
              | PIXI.Sprite
              | undefined;
            const shadow = container.getChildByLabel('shadow') as
              | PIXI.Graphics
              | undefined;

            if (tsprite && shadow) {
              const baseCreature =
                TD_CREATURE_DEFS[tower.creature.speciesId].baseCreature;
              applyTDUnitTransforms(
                tower,
                tsprite,
                shadow,
                tower.creature.speciesId,
                baseCreature.battleSpriteUrl || baseCreature.spriteUrl,
                (t) => {
                  if (!isDestroyed) tsprite.texture = t;
                }
              );

              // Fade tower if it's currently performing a Tackle attack
              const isTackling = engine.projectiles.some(
                (p) =>
                  p.sourceId === tower.id && p.attackDefinitionId === 'TACKLE'
              );
              tsprite.alpha = isTackling ? 0 : 1;
              shadow.alpha = isTackling ? 0 : 1;
            }
            renderHealthBar(
              tower,
              container,
              tower.creature.speciesId,
              true /* hideWhenFull */
            );
            updateSparkles(container, tower, app.ticker.deltaTime);
            updateSpeedBoostIndicator(
              container,
              tower,
              tower.creature.speciesId,
              engine.elapsedTimeMs,
              app.ticker.deltaTime
            );
            updatePersistentSpeedStackAura(
              container,
              tower,
              app.ticker.deltaTime
            );
            updateDefenseBoostIndicator(
              container,
              tower,
              tower.creature.speciesId,
              engine.elapsedTimeMs,
              app.ticker.deltaTime
            );

            const hpBg = container.getChildByLabel('hpBg') as
              | PIXI.Graphics
              | undefined;
            const hpFg = container.getChildByLabel('hpFg') as
              | PIXI.Graphics
              | undefined;
            // Check if tower is currently doing a Dash Attack
            // It disappears if any of its active projectiles are dash attacks
            const isDashing = engine.projectiles.some((p) => {
              if (p.sourceId !== tower.id || !p.attackDefinitionId)
                return false;
              const def = ATTACK_DEFS[p.attackDefinitionId];
              return def && def.isDashAttack;
            });

            if (isDashing) {
              container.alpha = 0;
            } else {
              container.alpha = 1;
            }
          }

          // --- Render Placement Spots & Capture Hover ---
          spotGraphics.clear();
          invalidSpotGraphics.clear();
          resonantEvolutionGraphics.clear();

          if (!resonantEvolutionGraphics.parent) {
            app.stage.addChildAt(
              resonantEvolutionGraphics,
              Math.min(1, app.stage.children.length)
            );
          }

          app.stage.addChild(spotGraphics); // Ensure it's on the stage
          app.stage.addChild(invalidSpotGraphics);
          app.stage.setChildIndex(spotGraphics, app.stage.children.length - 2);
          app.stage.setChildIndex(
            invalidSpotGraphics,
            app.stage.children.length - 1
          );

          let isHoveringValidSpot = false;

          if (isDraggingCapture) {
            // Capture Device Logic
            let targetedEnemyId: string | null = null;
            let isWeakened = false;

            if (dragPosRef.current) {
              let minSqDist = Infinity;
              const CAPTURE_DIST_SQ = 64; // distance squared for hovering enemy

              // Find closest enemy
              engine.enemies.forEach((enemy) => {
                const dx = dragPosRef.current!.x - enemy.position.x;
                const dy = dragPosRef.current!.y - enemy.position.y;
                const distSq = dx * dx + dy * dy;

                if (distSq <= CAPTURE_DIST_SQ && distSq < minSqDist) {
                  minSqDist = distSq;
                  targetedEnemyId = enemy.id;
                  isWeakened =
                    enemy.isShiny ||
                    enemy.hp / enemy.maxHp <= WEAKENED_THRESHOLD;
                }
              });

              if (targetedEnemyId) {
                const enemy = engine.enemies.find(
                  (e) => e.id === targetedEnemyId
                )!;
                const isValidCapture = isWeakened && !enemy.uncapturable;

                isHoveringValidSpot = isValidCapture;

                const pxX = offsetX + (enemy.position.x / 100) * screenW;
                const pxY = offsetY + (enemy.position.y / 100) * screenH;
                const radius = viewportH * 0.05 * zoom;

                if (isValidCapture) {
                  // Green circle for valid capture
                  spotGraphics.circle(pxX, pxY, radius);
                  spotGraphics.fill({ color: 0x22c55e, alpha: 0.3 }); // Transparent green
                  spotGraphics.stroke({
                    color: 0x22c55e,
                    alpha: 1,
                    width: 4,
                  });
                } else {
                  // Red X for invalid capture (not weakened enough)
                  invalidSpotGraphics.circle(pxX, pxY, radius);
                  invalidSpotGraphics.fill({ color: 0xef4444, alpha: 0.2 });
                  invalidSpotGraphics.stroke({
                    color: 0xef4444,
                    alpha: 0.8,
                    width: 3,
                  });

                  const crossSize = radius * 0.5;
                  invalidSpotGraphics.moveTo(pxX - crossSize, pxY - crossSize);
                  invalidSpotGraphics.lineTo(pxX + crossSize, pxY + crossSize);
                  invalidSpotGraphics.moveTo(pxX + crossSize, pxY - crossSize);
                  invalidSpotGraphics.lineTo(pxX - crossSize, pxY + crossSize);
                  invalidSpotGraphics.stroke({
                    color: 0xef4444,
                    width: 4,
                    join: 'round',
                    cap: 'round',
                  });
                }
              }
            }
          } else if (isDraggingTower) {
            // Normal Tower Placement Logic
            if (draggingTowerCreatureId === null && dragPosRef.current) {
              const pxX = offsetX + (dragPosRef.current.x / 100) * screenW;
              const pxY = offsetY + (dragPosRef.current.y / 100) * screenH;
              const radius = viewportH * 0.15 * zoom;
              spotGraphics.circle(pxX, pxY, radius);
              spotGraphics.fill({ color: 0x22d3ee, alpha: 0.05 });
              spotGraphics.stroke({ color: 0x22d3ee, alpha: 0.3, width: 1 });
            }

            engine.placementSpots.forEach((spot) => {
              const pxX = offsetX + (spot.x / 100) * screenW;
              const pxY = offsetY + (spot.y / 100) * screenH;

              let isHovered = false;

              if (dragPosRef.current) {
                const dx = dragPosRef.current.x - spot.x;
                const dy = dragPosRef.current.y - spot.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= 10) {
                  // Hover/Snap threshold is 10vw/vh approx
                  isHovered = true;
                  isHoveringValidSpot = true;
                }
              }

              const strokeWidth = isHovered ? 4 : 2;
              const alpha = isHovered ? 1 : 0.8;
              let baseColor = 0xf97316; // Orange

              if (engine.isSpotOccupied(spot.x, spot.y)) {
                // Let's color occupied spots differently while dragging to indicate swap!
                // blue-ish if occupied! Wait, let's keep it orange to stay consistent but it proves it works.
                baseColor = 0xf97316;
              }

              if (isHovered) {
                spotGraphics.circle(pxX, pxY, viewportH * 0.05 * zoom); // 5vh radius
                spotGraphics.fill({ color: baseColor, alpha: 0.3 }); // Transparent
                spotGraphics.stroke({
                  color: baseColor,
                  alpha: alpha,
                  width: strokeWidth,
                }); // Solid thicker border
              } else {
                spotGraphics.circle(pxX, pxY, viewportH * 0.05 * zoom);
                spotGraphics.stroke({
                  color: baseColor,
                  alpha: alpha,
                  width: strokeWidth,
                }); // Standard outline
              }
            });

            // If dragging tower but not hovering a valid open spot, show error indicator
            if (
              dragPosRef.current &&
              !isHoveringValidSpot &&
              dragPosRef.current
            ) {
              const pxX = offsetX + (dragPosRef.current.x / 100) * screenW;
              const pxY = offsetY + (dragPosRef.current.y / 100) * screenH;
              const radius = viewportH * 0.05 * zoom;

              invalidSpotGraphics.circle(pxX, pxY, radius);
              invalidSpotGraphics.fill({ color: 0xef4444, alpha: 0.2 }); // Transparent red
              invalidSpotGraphics.stroke({
                color: 0xef4444,
                alpha: 0.8,
                width: 3,
              }); // Solid red border

              // Draw an X
              const crossSize = radius * 0.5;
              invalidSpotGraphics.moveTo(pxX - crossSize, pxY - crossSize);
              invalidSpotGraphics.lineTo(pxX + crossSize, pxY + crossSize);
              invalidSpotGraphics.moveTo(pxX + crossSize, pxY - crossSize);
              invalidSpotGraphics.lineTo(pxX - crossSize, pxY + crossSize);
              invalidSpotGraphics.stroke({
                color: 0xef4444,
                width: 4,
                join: 'round',
                cap: 'round',
              });
            }
          }

          // --- Render Enemies ---
          engine.enemies.forEach((enemy) => {
            const state = enemy.resonantEvolutionState;
            if (!state) return;
            const linkTarget = state.linkTargetEnemyId
              ? engine.enemies.find(
                  (candidate) => candidate.id === state.linkTargetEnemyId
                )
              : engine.captureUnits.find(
                  (captureUnit) => captureUnit.id === state.captureUnitId
                );
            if (!linkTarget) return;

            resonantEvolutionGraphics.moveTo(
              offsetX + (enemy.position.x / 100) * screenW,
              offsetY + (enemy.position.y / 100) * screenH
            );
            resonantEvolutionGraphics.lineTo(
              offsetX + (linkTarget.position.x / 100) * screenW,
              offsetY + (linkTarget.position.y / 100) * screenH
            );
            resonantEvolutionGraphics.stroke({
              color: 0x67e8f9,
              alpha: state.phase === 'channeling' ? 0.9 : 0.58,
              width: Math.max(
                2,
                (state.phase === 'channeling' ? 4 : 2.5) * zoom
              ),
              cap: 'round',
              join: 'round',
            });
          });

          const currentEnemyIds = new Set(engine.enemies.map((e) => e.id));
          for (const [id, sprite] of enemySprites.entries()) {
            if (!currentEnemyIds.has(id)) {
              app.stage.removeChild(sprite);
              sprite.destroy({ children: true });
              enemySprites.delete(id);
            }
          }
          for (const enemy of engine.enemies) {
            let container = enemySprites.get(enemy.id);
            if (!container) {
              container = new PIXI.Container();

              const shadow = new PIXI.Graphics();
              shadow.label = 'shadow';
              container.addChild(shadow);

              const esprite = new PIXI.Sprite();
              esprite.label = 'enemy_sprite';
              esprite.anchor.set(0.5);
              container.addChildAt(esprite, 1);

              app.stage.addChild(container);
              enemySprites.set(enemy.id, container);
            }
            container.x = offsetX + (enemy.position.x / 100) * screenW;
            container.y = offsetY + (enemy.position.y / 100) * screenH;
            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;
            container.scale.set(finalScale);

            const esprite = container.getChildByLabel('enemy_sprite') as
              | PIXI.Sprite
              | undefined;
            const shadow = container.getChildByLabel('shadow') as
              | PIXI.Graphics
              | undefined;

            if (esprite && shadow) {
              const baseCreature =
                TD_CREATURE_DEFS[enemy.definitionId].baseCreature;
              applyTDUnitTransforms(
                enemy,
                esprite,
                shadow,
                enemy.definitionId,
                baseCreature.battleSpriteUrl || baseCreature.spriteUrl,
                (t) => {
                  if (!isDestroyed) esprite.texture = t;
                }
              );
            }

            renderHealthBar(enemy, container, enemy.definitionId);
            updateSparkles(container, enemy, app.ticker.deltaTime);
            updateSpeedBoostIndicator(
              container,
              enemy,
              enemy.definitionId,
              engine.elapsedTimeMs,
              app.ticker.deltaTime
            );
            updatePersistentSpeedStackAura(
              container,
              enemy,
              app.ticker.deltaTime
            );
            updateSpeedSlowIndicator(
              container,
              enemy,
              engine.elapsedTimeMs,
              app.ticker.deltaTime
            );
            updateDefenseBoostIndicator(
              container,
              enemy,
              enemy.definitionId,
              engine.elapsedTimeMs,
              app.ticker.deltaTime
            );
            updateResonantEvolutionIndicator(
              container,
              enemy,
              engine.elapsedTimeMs,
              app.ticker.deltaTime
            );
            if (esprite) {
              updateCursedAura(container, enemy, esprite, app.ticker.deltaTime);
              updateDrenchedAura(
                container,
                enemy,
                esprite,
                app.ticker.deltaTime
              );
            }
          }

          // --- Render Projectiles ---
          const currentProjIds = new Set(engine.projectiles.map((p) => p.id));
          for (const [id, container] of projectileSprites.entries()) {
            if (!currentProjIds.has(id)) {
              app.stage.removeChild(container);
              container.destroy({ children: true });
              projectileSprites.delete(id);
            }
          }
          for (const proj of engine.projectiles) {
            let container = projectileSprites.get(proj.id);
            if (!container) {
              container = new PIXI.Container();

              const def = proj.attackDefinitionId
                ? ATTACK_DEFS[proj.attackDefinitionId]
                : undefined;

              if (def && def.isDashAttack) {
                if (def.dashTrailType === 'WATER') {
                  const trail = new PIXI.Graphics();
                  trail.label = 'dash_trail';
                  drawWaterDashTrail(trail);
                  container.addChild(trail);
                }

                const shadow = new PIXI.Graphics();
                shadow.label = 'shadow';
                container.addChild(shadow);

                const psprite = new PIXI.Sprite();
                psprite.label = 'proj_sprite';
                psprite.anchor.set(0.5);
                container.addChild(psprite);
              } else if (def?.projectileVisual?.type === 'FLAME') {
                const flame = new PIXI.Graphics();
                flame.label = 'proj_graphics';
                drawProjectileFlame(
                  flame,
                  def.projectileVisual.outerColor,
                  def.projectileVisual.innerColor
                );
                container.addChild(flame);
              } else if (def?.projectileVisual?.type === 'WATER_STREAM') {
                const water = new PIXI.Graphics();
                water.label = 'proj_graphics';
                drawWaterStreamSegment(
                  water,
                  def.projectileVisual.outerColor,
                  def.projectileVisual.innerColor,
                  def.projectileVisual.highlightColor
                );
                container.addChild(water);
              } else if (def?.projectileVisual?.type === 'COIR_BOLA') {
                drawCoirBola(
                  container,
                  def.projectileVisual.shadowColor,
                  def.projectileVisual.fiberColor,
                  def.projectileVisual.highlightColor,
                  def.projectileVisual.sparkColor
                );
              } else if (def?.projectileVisual?.type === 'STRING_COIL') {
                drawCoirBola(
                  container,
                  def.projectileVisual.shadowColor,
                  def.projectileVisual.fiberColor,
                  def.projectileVisual.highlightColor,
                  def.projectileVisual.sparkColor
                );
              } else if (def?.projectileVisual?.type === 'SAILCUTTER') {
                drawSailcutterProjectile(
                  container,
                  def.projectileVisual.shadowColor,
                  def.projectileVisual.windColor,
                  def.projectileVisual.highlightColor
                );
              } else {
                const g = new PIXI.Graphics();
                g.label = 'proj_graphics';
                g.circle(0, 0, 8);

                let projColor = 0x22d3ee; // Default cyan
                if (proj.attackDefinitionId) {
                  const def = ATTACK_DEFS[proj.attackDefinitionId];
                  if (def) {
                    projColor = TYPE_COLORS[def.type] || projColor;
                  }
                }

                g.fill({ color: projColor });
                container.addChild(g);
              }

              app.stage.addChild(container);
              projectileSprites.set(proj.id, container);
            }

            container.x = offsetX + (proj.position.x / 100) * screenW;
            container.y = offsetY + (proj.position.y / 100) * screenH;
            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;
            container.scale.set(finalScale * (proj.visualScale ?? 1));

            const def = proj.attackDefinitionId
              ? ATTACK_DEFS[proj.attackDefinitionId]
              : undefined;

            if (
              def?.projectileVisual?.type === 'FLAME' ||
              def?.projectileVisual?.type === 'WATER_STREAM' ||
              def?.projectileVisual?.type === 'COIR_BOLA' ||
              def?.projectileVisual?.type === 'STRING_COIL' ||
              def?.projectileVisual?.type === 'SAILCUTTER'
            ) {
              const travelX = proj.target.x - proj.position.x;
              const travelY = proj.target.y - proj.position.y;
              container.rotation = Math.atan2(travelY, travelX);
            } else {
              container.rotation = 0;
            }

            if (
              def?.projectileVisual?.type === 'COIR_BOLA' ||
              def?.projectileVisual?.type === 'STRING_COIL'
            ) {
              const core = container.getChildByLabel('coir_bola_core') as
                | PIXI.Container
                | undefined;
              if (core) {
                core.rotation += 0.3 * app.ticker.deltaTime;
              }
            }

            if (def && def.isDashAttack) {
              const trail = container.getChildByLabel('dash_trail') as
                | PIXI.Graphics
                | undefined;
              if (trail) {
                const travelX = proj.target.x - proj.position.x;
                const travelY = proj.target.y - proj.position.y;
                trail.rotation = Math.atan2(travelY, travelX);
                trail.alpha =
                  0.92 + Math.sin(app.ticker.lastTime * 0.018) * 0.08;
              }

              const psprite = container.getChildByLabel('proj_sprite') as
                | PIXI.Sprite
                | undefined;
              const shadow = container.getChildByLabel('shadow') as
                | PIXI.Graphics
                | undefined;
              if (psprite && shadow) {
                const sourceTower = engine.towers.find(
                  (t) => t.id === proj.sourceId
                );
                if (sourceTower) {
                  const baseCreature =
                    TD_CREATURE_DEFS[sourceTower.creature.speciesId]
                      .baseCreature;
                  applyTDUnitTransforms(
                    {
                      ...proj,
                      hp: 1,
                      maxHp: 1,
                      facingDirection: proj.facingDirection || 'down',
                    } as BaseTDUnit,
                    psprite,
                    shadow,
                    sourceTower.creature.speciesId,
                    baseCreature.battleSpriteUrl || baseCreature.spriteUrl,
                    (t) => {
                      if (!isDestroyed) psprite.texture = t;
                    }
                  );
                  if (def.dashTrailType === 'WATER') {
                    psprite.tint = 0x7dd3fc;
                  }
                  shadow.visible = false; // Keep shadow hidden
                }
              }
            }
          }

          // --- Render Visual Effects ---
          const currentVfxIds = new Set(engine.visualEffects.map((v) => v.id));
          for (const [id, container] of vfxSprites.entries()) {
            if (!currentVfxIds.has(id)) {
              app.stage.removeChild(container);
              container.destroy({ children: true });
              vfxSprites.delete(id);
            }
          }
          for (const vfx of engine.visualEffects) {
            const existingContainer = vfxSprites.get(vfx.id);
            const container = existingContainer || new PIXI.Container();

            // Fetch the visual effect configuration
            const tdConfigMap = CREATURE_TD_CONFIGS[vfx.configId] || {
              default: { scale: 1 },
            };
            const tdConfig =
              tdConfigMap[vfx.facingDirection || 'default'] ||
              tdConfigMap.default;
            const animConfig = tdConfig.vfxAnimation;

            if (!existingContainer) {
              if (animConfig && animConfig.type === 'KEYFRAME_SPRITES') {
                animConfig.layers?.forEach((layer, layerIdx) => {
                  const sprite = new PIXI.Sprite();
                  sprite.label = `vfx_layer_${layerIdx}`;
                  sprite.anchor.set(0.5);
                  container.addChild(sprite);

                  PIXI.Assets.load(layer.url).then((t) => {
                    if (!isDestroyed) sprite.texture = t;
                  });
                });
              } else if (animConfig?.type === 'COIR_SNARE') {
                const coirVisual = ATTACK_DEFS.COIR_SNARE.projectileVisual;
                if (coirVisual?.type === 'COIR_BOLA') {
                  drawCoirSnareImpact(
                    container,
                    coirVisual.shadowColor,
                    coirVisual.fiberColor,
                    coirVisual.highlightColor,
                    coirVisual.sparkColor
                  );
                }
              } else if (animConfig?.type === 'STRING_SHOT') {
                const stringVisual = ATTACK_DEFS.STRING_SHOT.projectileVisual;
                if (stringVisual?.type === 'STRING_COIL') {
                  drawCoirSnareImpact(
                    container,
                    stringVisual.shadowColor,
                    stringVisual.fiberColor,
                    stringVisual.highlightColor,
                    stringVisual.sparkColor
                  );
                }
              } else if (animConfig?.type === 'WIND_GUST') {
                drawWindGust(container);
              } else if (animConfig?.type === 'HOWL') {
                drawHowl(container);
              } else if (animConfig?.type === 'HARDEN') {
                drawHarden(container);
              } else if (animConfig?.type === 'BARREL_BASH') {
                drawBarrelBashImpact(container);
              } else {
                const sprite = new PIXI.Sprite();
                sprite.label = 'vfx_sprite';
                sprite.anchor.set(0.5);
                container.addChild(sprite);

                const mask = new PIXI.Graphics();
                mask.label = 'vfx_mask';
                container.addChild(mask);
                sprite.mask = mask;
              }

              app.stage.addChild(container);
              vfxSprites.set(vfx.id, container);
            }

            const responsiveScale = app.screen.height / TD_BASE_HEIGHT;
            const finalScale = zoom * responsiveScale;
            const usesLayerOffsets = animConfig?.type === 'KEYFRAME_SPRITES';
            const effectOffsetX = usesLayerOffsets
              ? 0
              : (tdConfig.offsetX ?? 0);
            const effectOffsetY = usesLayerOffsets
              ? 0
              : (tdConfig.offsetY ?? 0);
            container.x =
              offsetX +
              (vfx.position.x / 100) * screenW +
              effectOffsetX * finalScale;
            container.y =
              offsetY +
              (vfx.position.y / 100) * screenH +
              effectOffsetY * finalScale;
            if (
              animConfig?.type === 'WIND_GUST' ||
              animConfig?.type === 'HOWL'
            ) {
              container.scale.set(
                (zoom * app.screen.width) / TD_BASE_HEIGHT,
                finalScale
              );
            } else {
              container.scale.set(finalScale);
            }

            const progress = Math.min(1, vfx.elapsedMs / vfx.durationMs);

            if (animConfig && animConfig.type === 'KEYFRAME_SPRITES') {
              animConfig.layers?.forEach((layer, layerIdx) => {
                const sprite = container.getChildByLabel(
                  `vfx_layer_${layerIdx}`
                ) as PIXI.Sprite | undefined;
                if (sprite) {
                  const baseScale = tdConfig.scale ?? 0.3;
                  const ox = tdConfig.offsetX ?? 0;
                  const oy = tdConfig.offsetY ?? 0;

                  const values = interpolateKeyframes(
                    layer.keyframes,
                    progress
                  );

                  sprite.scale.set(
                    baseScale * values.scaleX,
                    baseScale * values.scaleY
                  );
                  sprite.x = ox + values.x;
                  sprite.y = oy + values.y;
                  sprite.rotation = (values.rotation * Math.PI) / 180;
                  sprite.alpha = values.alpha;
                }
              });
            } else if (
              animConfig?.type === 'COIR_SNARE' ||
              animConfig?.type === 'STRING_SHOT'
            ) {
              updateCoirSnareImpact(container, progress);
            } else if (animConfig?.type === 'WIND_GUST') {
              const radius = (TD_BASE_HEIGHT * (vfx.rangeIndex ?? 20)) / 100;
              updateWindGust(container, progress, radius);
            } else if (animConfig?.type === 'HOWL') {
              const radius = (TD_BASE_HEIGHT * (vfx.rangeIndex ?? 11)) / 100;
              updateHowl(container, progress, radius);
            } else if (animConfig?.type === 'HARDEN') {
              updateHarden(container, progress);
            } else if (animConfig?.type === 'BARREL_BASH') {
              updateBarrelBashImpact(container, progress);
            } else {
              const sprite = container.getChildByLabel('vfx_sprite') as
                | PIXI.Sprite
                | undefined;
              const mask = container.getChildByLabel('vfx_mask') as
                | PIXI.Graphics
                | undefined;

              if (sprite) {
                applyTDUnitTransforms(
                  {
                    ...vfx,
                    hp: 1,
                    maxHp: 1,
                    facingDirection: vfx.facingDirection || 'down',
                  } as BaseTDUnit,
                  sprite,
                  new PIXI.Graphics(), // dummy shadow
                  vfx.configId,
                  undefined,
                  (t) => {
                    if (!isDestroyed) sprite.texture = t;
                  }
                );

                if (animConfig) {
                  // Handle Alpha/Fade
                  if (
                    animConfig.fadeOutProgress !== undefined &&
                    progress > animConfig.fadeOutProgress
                  ) {
                    const fadePortion = 1 - animConfig.fadeOutProgress;
                    container.alpha =
                      1 - (progress - animConfig.fadeOutProgress) / fadePortion;
                  } else {
                    container.alpha = 1;
                  }

                  // Handle Masks based on Type
                  if (mask) {
                    switch (animConfig.type) {
                      case 'WIPE_LINEAR': {
                        const size = animConfig.maskSize || 200;
                        mask.clear();
                        mask.rotation = animConfig.maskRotation || 0;
                        const wipeProgress = Math.min(1, progress * 1.5); // Finishes wiping before full duration usually
                        mask.rect(
                          -size,
                          -size,
                          size * 2,
                          size * 2 * wipeProgress
                        );
                        mask.fill(0xffffff);
                        break;
                      }
                      case 'FADE':
                      case 'SCALE':
                      case 'CUSTOM':
                      default: {
                        const size = 500;
                        mask.clear();
                        mask.rect(-size, -size, size * 2, size * 2);
                        mask.fill(0xffffff);
                        break;
                      }
                    }
                  }
                } else {
                  // Default fallback if no config
                  container.alpha =
                    progress > 0.8 ? 1 - (progress - 0.8) * 5 : 1;
                  if (mask) {
                    const size = 500;
                    mask.clear();
                    mask.rect(-size, -size, size * 2, size * 2);
                    mask.fill(0xffffff);
                  }
                }
              }
            }
          }

          // --- Render Floating Texts ---
          const currentFtIds = new Set(engine.floatingTexts.map((ft) => ft.id));
          for (const [id, textObj] of floatingTextSprites.entries()) {
            if (!currentFtIds.has(id)) {
              app.stage.removeChild(textObj);
              textObj.destroy();
              floatingTextSprites.delete(id);
            }
          }
          for (const ft of engine.floatingTexts) {
            let textObj = floatingTextSprites.get(ft.id);
            if (!textObj) {
              textObj = new PIXI.Text({
                text: ft.text,
                style: {
                  fontFamily: 'monospace',
                  fontSize: Math.max(16, viewportH * 0.02) * (ft.scale ?? 1),
                  fontWeight: 'bold',
                  fill: ft.color ?? 0xffffff,
                  stroke: { color: 0x000000, width: 3 },
                },
              });
              textObj.anchor.set(0.5);
              app.stage.addChild(textObj);

              // Render on top
              app.stage.setChildIndex(textObj, app.stage.children.length - 1);

              floatingTextSprites.set(ft.id, textObj);
            }

            const progress = ft.elapsedMs / ft.durationMs;

            textObj.x = offsetX + (ft.position.x / 100) * screenW;
            // Float up calculation: start at position, go up by up to 5% of screen height
            textObj.y =
              offsetY +
              (ft.position.y / 100) * screenH -
              progress * screenH * 0.05 -
              screenH * 0.02;
            textObj.scale.set(zoom);
            textObj.alpha = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
          }
        });
      };

      initPixi();

      return () => {
        isDestroyed = true;
        isOpeningPanActiveRef.current = false;
        if (isInitialized) {
          app.destroy(true, { children: true });
        }
      };
    }, [engine, backgroundScale, backgroundUrl, initialView, openingPan]);

    return (
      <div className="relative flex-1 overflow-hidden">
        <div ref={containerRef} className="absolute inset-0" />
        <div
          ref={fpsRef}
          className={`pointer-events-none absolute top-2 left-2 z-10 rounded bg-black/60 px-2 py-1 font-mono text-sm font-bold text-green-400 shadow select-none ${
            hideUi ? 'invisible' : ''
          }`}
        >
          FPS: 0
        </div>

        {/* Zoom Controls */}
        {backgroundScale > 1 && !hideUi && (
          <div className="absolute right-3 bottom-3 z-10 flex flex-col gap-1">
            <button
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-black/60 text-lg font-bold text-white transition-colors select-none hover:bg-black/80"
              onClick={() => {
                zoomRef.current = Math.min(1, zoomRef.current + 0.1);
              }}
            >
              +
            </button>
            <button
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-black/60 text-lg font-bold text-white transition-colors select-none hover:bg-black/80"
              onClick={() => {
                const minZoom = 1 / backgroundScale;
                zoomRef.current = Math.max(minZoom, zoomRef.current - 0.1);
              }}
            >
              −
            </button>
          </div>
        )}
      </div>
    );
  }
);

export default PixiBattlefield;
