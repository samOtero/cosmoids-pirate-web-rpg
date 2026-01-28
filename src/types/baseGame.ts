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
  HOOKAW_TIRED_DIVE_SKIN_1 = "Hookaw_Tired_Dive_Skin_1",
  HOOKAW_TIRED_SKIN_1 = "Hookaw_Tired_Skin_1",
  STARTER_CHEST_CLOSED = "Starter_Chest_Closed",
  STARTER_CHEST_OPEN = "Starter_Chest_Open",
  STARTER_1_CRAB = "Starter_1_Crab",
  STARTER_2_IGUANA = "Starter_2_Iguana",
  STARTER_3_MONKEY = "Starter_3_Monkey",
  EEL_SENTICLE = "Eel_Senticle",
  CREWMATE = "Crewmate",
  OLD_SAILOR = "Old Sailor",
  PIRATE_GRUNT_JOE_SMIRK = "Pirate_Grunt_Joe_Smirk",
  PIRATE_GRUNT_JOE_ANGRY = "Pirate_Grunt_Joe_Angry",
  PIRATE_GRUNT_JOE_ANGRY_POINTING = "Pirate_Grunt_Joe_Angry_Pointing",
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
  starterCreatureId: string | null;
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
  portraitWidth?: "normal" | "wide";
}

export const DialogButtonTypeConfig = {
  confirm: "bg-cyan-400 text-ocean-dark hover:bg-cyan-300",
  cancel: "bg-orange-500 text-white hover:bg-orange-600",
  fire: "bg-orange-600 text-white hover:bg-orange-700",
  grass: "bg-green-600 text-white hover:bg-green-700",
  water: "bg-blue-600 text-white hover:bg-blue-700",
} as const;

export type DialogButtonType = keyof typeof DialogButtonTypeConfig;

export function getButtonClasses(type: DialogButtonType): string {
  const BUTTON_BASE_CLASSES =
    "px-8 py-3 md:px-12 md:py-4 font-bold rounded hover:brightness-110 transition-all uppercase tracking-wider text-base md:text-lg";
  const typeClasses = DialogButtonTypeConfig[type];
  return `${BUTTON_BASE_CLASSES} ${typeClasses}`;
}

export type DialogActionType = "PROCESS_EVENT";

export interface DialogAction {
  type: DialogActionType;
  payload: {
    event: GameEvent;
  };
}

export interface DialogButton {
  label: string;
  action?: DialogAction;
  type: DialogButtonType;
  jumpToLineId?: string; // Optional line ID to jump to within the current dialog
}

export interface DialogLine {
  id?: string; // Optional unique identifier for jumping to this line
  portraits: DialogPortrait[];
  text: string;
  buttons?: DialogButton[]; // Optional buttons for this line
}

export enum DialogContext {
  LEVEL_1_WIN = "LEVEL_1_WIN",
  LEVEL_1_THE_MESSAGE = "LEVEL_1_THE_MESSAGE",
  STARTER_BATTLE_LOSE = "STARTER_BATTLE_LOSE",
  NEW_PLAYER_WELCOME_DIALOG_PART_2 = "NEW_PLAYER_WELCOME_DIALOG_PART_2",
  EXAMPLE_DIALOG_WITH_LINE_JUMPING = "EXAMPLE_DIALOG_WITH_LINE_JUMPING",
  GAME_INTRO = "GAME_INTRO",
  GAME_INTRO_AFTER_STARTER = "GAME_INTRO_AFTER_STARTER",
  GAME_INTRO_PART_3 = "GAME_INTRO_PART_3",
  ISLAND_INTRO = "ISLAND_INTRO",
  ISLAND_VICTORY = "ISLAND_VICTORY",
  ISLAND_DEFEAT = "ISLAND_DEFEAT",
}

export interface DialogContextData {
  islandId?: number;
  creatureId?: string;
  dialogStartIndex?: number;
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
  nextEvents?: GameEvent[];
}

export type GameEventType =
  | "SHOW_DIALOG"
  | "START_BATTLE"
  | "GO_TO_MAP"
  | "GO_TO_PROFILES"
  | "PICK_STARTER";

export interface GameEvent {
  type: GameEventType;
  payload?: ShowDialogEventPayload | StartBattleEventPayload | GoToMapEventPayload | PickStarterEventPayload;
  autoProceed?: boolean;
}

export interface ShowDialogEventPayload {
  context: DialogContext;
  contextData?: DialogContextData;
}

export interface PickStarterEventPayload {
  creatureId: string;
}

export enum BattleContext {
  FIRST_BATTLE = "FIRST_BATTLE",
}

export interface BattleConfig {
  enemy: Creature;
  backgroundImageKey: BackgroundImageKey;
  winEvents: GameEvent[];
  loseEvents: GameEvent[];
}

export interface StartBattleEventPayload {
  context: BattleContext;
  enemyId?: string;
  backgroundKey?: BackgroundImageKey;
}

export interface GoToMapEventPayload {
  islandId: number;
}
