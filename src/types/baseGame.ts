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

export enum SpeakerImageKey {
  GUIDE = "Guide",
  GRANDPA_NEUTRAL_STARTER_OUTFIT = "Grandpa_Neutral_Starter_Outfit",
  CALEB_NEUTRAL_STARTER_OUTFIT = "Caleb_Neutral_Starter_Outfit",
  CALEB_YAWN_STARTER_OUTFIT = "Caleb_Yawn_Starter_Outfit",
  CALEB_HAPPY_STARTER_OUTFIT = "Caleb_Happy_Starter_Outfit",
  CALEB_DISAPPOINTED_STARTER_OUTFIT = "Caleb_Disappointed_Starter_Outfit",
  CALEB_SCARED_SURPRISED_STARTER_OUTFIT = "Caleb_Scared_Surprised_Starter_Outfit",
  CREWMATE = "Crewmate",
  OLD_SAILOR = "Old Sailor",
  NARRATOR = "Narrator",
  DEFAULT = "default",
  EMPTY = "empty",
}

export enum BackgroundImageKey {
  CALEB_HOUSE = "Caleb_House",
  FIRST_TOWN_DOCKS = "First_Town_Docks",
  DEFAULT = "default",
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
  portraitKey: SpeakerImageKey; // Key for looking up portrait in SPEAKER_IMAGES
  text: string;
  displayName: string; // The displayed character name
}

export enum DialogContext {
  GAME_INTRO = "GAME_INTRO",
  GAME_INTRO_PART_2 = "GAME_INTRO_PART_2",
  ISLAND_INTRO = "ISLAND_INTRO",
  ISLAND_VICTORY = "ISLAND_VICTORY",
  ISLAND_DEFEAT = "ISLAND_DEFEAT",
}

export interface DialogContextData {
  islandId?: number;
}

export interface DialogTransition {
  screen: Screens;
  context?: DialogContext;
  contextData?: DialogContextData;
}

export interface DialogConfig {
  sequence: DialogLine[];
  backgroundImageKey: BackgroundImageKey;
  next?: DialogTransition;
}
