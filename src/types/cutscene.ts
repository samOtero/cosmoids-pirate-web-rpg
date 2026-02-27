import { BackgroundImageKey } from './baseGame';

export interface CutsceneKeyframe {
  timeMs: number;
  x?: number;
  y?: number;
  scale?: number;
  facingRight?: boolean;
  opacity?: number;
}

export interface CutsceneUnit {
  id: string; // Unique ID for this unit instance in the cutscene
  speciesId: string; // E.g., 'starter_crab'
  keyframes: CutsceneKeyframe[];
}

export interface CutsceneData {
  id: string;
  name: string;
  backgroundKey: BackgroundImageKey;
  durationMs: number;
  units: CutsceneUnit[];
}
