export interface AnimationKeyframe {
  percent: number; // 0 to 100
  transform: {
    x?: number; // pixels
    y?: number; // pixels
    scaleX?: number; // multiplier (1 = normal)
    scaleY?: number; // multiplier
    rotate?: number; // degrees
  };
}

export interface AnimationDefinition {
  id: string;
  name: string;
  duration: number; // seconds
  easing: string; // e.g., "ease-in-out", "linear"
  keyframes: AnimationKeyframe[];
}

export interface AnimationMap {
  [key: string]: AnimationDefinition;
}
