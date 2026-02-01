import { AnimationDefinition } from '@/types/animation';
import { ANIMATIONS } from '@/constants/animations';

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

      return `
    ${kf.percent}% {
      transform: ${transforms.join(' ') || 'none'};
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
