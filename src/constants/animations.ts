import { AnimationMap } from '@/types/animation';

export const ANIMATIONS: AnimationMap = {
  lizard: {
    id: 'lizard',
    name: 'Lizard Float',
    duration: 2.5,
    easing: 'ease-in-out',
    keyframes: [
      {
        percent: 0,
        transform: { y: 0, scaleX: 1, scaleY: 1 },
      },
      {
        percent: 25,
        transform: { y: 1, scaleX: 1.01, scaleY: 0.99 },
      },
      {
        percent: 50,
        transform: { y: 0, scaleX: 1, scaleY: 1 },
      },
      {
        percent: 75,
        transform: { y: -3, scaleX: 0.98, scaleY: 1.02 },
      },
      {
        percent: 100,
        transform: { y: 0, scaleX: 1, scaleY: 1 },
      },
    ],
  },
};
