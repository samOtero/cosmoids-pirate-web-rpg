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
  GRANDPA_SURPRISED_STARTER_OUTFIT = "Grandpa_Surprised_Starter_Outfit",
  CALEB_NEUTRAL_STARTER_OUTFIT = "Caleb_Neutral_Starter_Outfit",
  CALEB_YAWN_STARTER_OUTFIT = "Caleb_Yawn_Starter_Outfit",
  CALEB_HAPPY_STARTER_OUTFIT = "Caleb_Happy_Starter_Outfit",
  CALEB_DISAPPOINTED_STARTER_OUTFIT = "Caleb_Disappointed_Starter_Outfit",
  CALEB_SCARED_SURPRISED_STARTER_OUTFIT = "Caleb_Scared_Surprised_Starter_Outfit",
  HOOKAW_TIRED_BOX_DIVE_SKIN_1 = "Hookaw_Tired_Box_Dive_Skin_1",
  HOOKAW_TIRED_BOX_SKIN_1 = "Hookaw_Tired_Box_Skin_1",
  HOOKAW_TIRED_SKIN_1 = "Hookaw_Tired_Skin_1",
  STARTER_CHEST_CLOSED = "Starter_Chest_Closed",
  STARTER_CHEST_OPEN = "Starter_Chest_Open",
  STARTER_1_CRAB = "Starter_1_Crab",
  STARTER_2_IGUANA = "Starter_2_Iguana",
  STARTER_3_MONKEY = "Starter_3_Monkey",
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

export interface DialogPortrait {
  key: SpeakerImageKey;
  displayName: string;
  onClick?: () => void;
}

export interface DialogLine {
  portraits: DialogPortrait[];
  speakerIndex: number; // 0-based index into `portraits` for the active speaker
  text: string;
}

export enum DialogContext {
  GAME_INTRO = "GAME_INTRO",
  GAME_INTRO_PART_2 = "GAME_INTRO_PART_2",
  GAME_INTRO_PART_3 = "GAME_INTRO_PART_3",
  STARTER_CRAB = "STARTER_CRAB",
  STARTER_IGUANA = "STARTER_IGUANA",
  STARTER_MONKEY = "STARTER_MONKEY",
  ISLAND_INTRO = "ISLAND_INTRO",
  ISLAND_VICTORY = "ISLAND_VICTORY",
  ISLAND_DEFEAT = "ISLAND_DEFEAT",
}

export interface DialogContextData {
  islandId?: number;
  creatureId?: string;
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
