import { AnimationDefinition } from '@/types/animation';
import { ANIMATIONS } from '@/constants/animations';
import { VFXSpriteKeyframe } from '@/types/baseGame';

export const generateKeyframesCss = (anim: AnimationDefinition): string => {
  const steps = anim.keyframes
    .map((kf) => {
      const transforms: string[] = [];
      if (kf.transform.x !== undefined || kf.transform.y !== undefined) {
        transforms.push(
          `translate(${kf.transform.x || 0}px, ${kf.transform.y || 0}px)`
        );
      }
      if (
        kf.transform.scaleX !== undefined ||
        kf.transform.scaleY !== undefined
      ) {
        transforms.push(
          `scale(${kf.transform.scaleX ?? 1}, ${kf.transform.scaleY ?? 1})`
        );
      }
      if (kf.transform.rotate !== undefined) {
        transforms.push(`rotate(${kf.transform.rotate}deg)`);
      }

      const styles: string[] = [];
      if (transforms.length > 0) {
        styles.push(`transform: ${transforms.join(' ')}`);
      }
      if (kf.opacity !== undefined) {
        styles.push(`opacity: ${kf.opacity}`);
      }
      if (kf.filter !== undefined) {
        styles.push(`filter: ${kf.filter}`);
      }

      return `
    ${kf.percent}% {
      ${styles.join(';\n      ')}
    }`;
    })
    .join('\n');

  return `
@keyframes anim-${anim.id} {
${steps}
}

.animate-${anim.id} {
  animation: anim-${anim.id} ${anim.duration}s infinite ${anim.easing};
}`;
};

export const getAllAnimationsCss = (): string => {
  return Object.values(ANIMATIONS).map(generateKeyframesCss).join('\n');
};

export function interpolateKeyframes(keyframes: VFXSpriteKeyframe[], progress: number) {
  if (keyframes.length === 0) {
    return { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, alpha: 1 };
  }
  const sorted = [...keyframes].sort((a, b) => a.progress - b.progress);
  if (progress <= sorted[0].progress) {
    const kf = sorted[0];
    return {
      x: kf.x ?? 0,
      y: kf.y ?? 0,
      scaleX: kf.scaleX ?? 1,
      scaleY: kf.scaleY ?? 1,
      rotation: kf.rotation ?? 0,
      alpha: kf.alpha ?? 1,
    };
  }
  if (progress >= sorted[sorted.length - 1].progress) {
    const kf = sorted[sorted.length - 1];
    return {
      x: kf.x ?? 0,
      y: kf.y ?? 0,
      scaleX: kf.scaleX ?? 1,
      scaleY: kf.scaleY ?? 1,
      rotation: kf.rotation ?? 0,
      alpha: kf.alpha ?? 1,
    };
  }
  let kfBefore = sorted[0];
  let kfAfter = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (progress >= sorted[i].progress && progress <= sorted[i + 1].progress) {
      kfBefore = sorted[i];
      kfAfter = sorted[i + 1];
      break;
    }
  }
  const range = kfAfter.progress - kfBefore.progress;
  const t = range === 0 ? 0 : (progress - kfBefore.progress) / range;
  
  const bX = kfBefore.x ?? 0;
  const aX = kfAfter.x ?? 0;
  const bY = kfBefore.y ?? 0;
  const aY = kfAfter.y ?? 0;
  const bSX = kfBefore.scaleX ?? 1;
  const aSX = kfAfter.scaleX ?? 1;
  const bSY = kfBefore.scaleY ?? 1;
  const aSY = kfAfter.scaleY ?? 1;
  const bRot = kfBefore.rotation ?? 0;
  const aRot = kfAfter.rotation ?? 0;
  const bAlpha = kfBefore.alpha ?? 1;
  const aAlpha = kfAfter.alpha ?? 1;

  return {
    x: bX + (aX - bX) * t,
    y: bY + (aY - bY) * t,
    scaleX: bSX + (aSX - bSX) * t,
    scaleY: bSY + (aSY - bSY) * t,
    rotation: bRot + (aRot - bRot) * t,
    alpha: bAlpha + (aAlpha - bAlpha) * t,
  };
}
