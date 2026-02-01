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
  hit: {
    id: 'hit',
    name: 'Hit Reaction',
    duration: 0.5,
    easing: 'linear',
    keyframes: [
      {
        percent: 0,
        transform: { x: 0 },
        opacity: 1,
        filter: 'brightness(1)',
      },
      {
        percent: 10,
        transform: { x: -10 },
        opacity: 0.8,
        filter: 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)', // Flash reddish/bright
      },
      {
        percent: 20,
        transform: { x: 10 },
        opacity: 1,
        filter: 'brightness(1)',
      },
      {
        percent: 30,
        transform: { x: -10 },
      },
      {
        percent: 40,
        transform: { x: 10 },
      },
      {
        percent: 50,
        transform: { x: -5 },
      },
      {
        percent: 60,
        transform: { x: 5 },
      },
      {
        percent: 70,
        transform: { x: -5 },
      },
      {
        percent: 75,
        transform: { x: 5 },
      },
      {
        percent: 80,
        transform: { x: 0 },
      },
      {
        percent: 100,
        transform: { x: 0 },
      },
    ],
  },
  tackle_player: {
    id: 'tackle_player',
    name: 'Tackle (Right)',
    duration: 0.5,
    easing: 'ease-in-out',
    keyframes: [
      {
        percent: 0,
        transform: { x: 0 },
      },
      {
        percent: 20,
        transform: { x: -10 }, // Wind up
      },
      {
        percent: 50,
        transform: { x: 60 }, // Strike
      },
      {
        percent: 100,
        transform: { x: 0 }, // Return
      },
    ],
  },
  tackle_enemy: {
    id: 'tackle_enemy',
    name: 'Tackle (Left)',
    duration: 0.5,
    easing: 'ease-in-out',
    keyframes: [
      {
        percent: 0,
        transform: { x: 0 },
      },
      {
        percent: 20,
        transform: { x: 10 }, // Wind up
      },
      {
        percent: 50,
        transform: { x: -60 }, // Strike
      },
      {
        percent: 100,
        transform: { x: 0 }, // Return
      },
    ],
  },
};
