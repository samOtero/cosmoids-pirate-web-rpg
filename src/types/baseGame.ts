export enum Screens {
  START = "START",
  PROFILES = "PROFILES",
  DIALOG = "DIALOG",
  MAP = "MAP",
  BATTLE = "BATTLE",
}

export enum ElementType {
  WATER = "Water",
  FIRE = "Fire",
  GRASS = "Grass",
  ELECTRIC = "Electric",
  NORMAL = "Normal",
}

export interface Item {
  id: string;
  name: string;
  description: string;
  effect: "HEAL" | "CATCH";
  value: number;
  count: number;
}

export interface Creature {
  id: string;
  name: string;
  type: ElementType;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
  xp: number;
  moves: string[];
  spriteUrl: string; // Placeholder URL
}

export interface Profile {
  id: number;
  name: string;
  lastPlayed: number; // Timestamp
  isNew: boolean;
  creatures: Creature[];
  inventory: Item[];
  unlockedIslands: number; // Max island index unlocked
  currentIslandId: number;
}


export interface Island {
  id: number;
  name: string;
  description: string;
  difficulty: number;
  coordinates: { x: number; y: number }; // Percentage 0-100
  unlocked: boolean;
  cleared: boolean;
}

export interface DialogLine {
  portraitKey: string; // Key for looking up portrait in SPEAKER_IMAGES
  text: string;
  emotion?: "neutral" | "happy" | "angry" | "surprised";
  displayName: string; // The displayed character name
}