export enum Screens {
  START = 'START',
  PROFILES = 'PROFILES',
  DIALOG = 'DIALOG',
  MODE_SELECT = 'MODE_SELECT',
  LEVEL_SELECT = 'LEVEL_SELECT',
  CHALLENGE_SELECT = 'CHALLENGE_SELECT',
  COSMOID_CODEX = 'COSMOID_CODEX',
  PARTY = 'PARTY',
  TOWER_DEFENSE = 'TOWER_DEFENSE',
}

export enum TDLevelContext {
  FIRST_LEVEL = 'FIRST_LEVEL',
  FOREST_LEVEL_2 = 'FOREST_LEVEL_2',
  VANE_LEVEL_3 = 'VANE_LEVEL_3',
  CHALLENGE_FIRST_LEVEL = 'CHALLENGE_FIRST_LEVEL',
  CHALLENGE_FIRST_LEVEL_NO_CAPTURE = 'CHALLENGE_FIRST_LEVEL_NO_CAPTURE',
}

export interface TDLevelConfig {
  levelData: TDLevelData;
  introEvents?: GameEvent[];
  winEvents: GameEvent[];
  loseEvents: GameEvent[];
  /** Kip's Journal entries revealed once this level's completion milestone is reached. */
  journalCompletion?: {
    progression: StoryProgressionValue;
    seenSpeciesIds: string[];
  };
}

export enum ElementType {
  WATER = 'Water',
  FIRE = 'Fire',
  GRASS = 'Grass',
  BUG = 'Bug',
  STEEL = 'Steel',
  POISON = 'Poison',
  ELECTRIC = 'Electric',
  NORMAL = 'Normal',
  FLYING = 'Flying',
}

export enum SpeakerImageKey {
  GUIDE = 'Guide',
  GRANDPA_NEUTRAL_STARTER_OUTFIT = 'Grandpa_Neutral_Starter_Outfit',
  GRANDPA_SURPRISED_STARTER_OUTFIT = 'Grandpa_Surprised_Starter_Outfit',
  CALEB_NEUTRAL_STARTER_OUTFIT = 'Caleb_Neutral_Starter_Outfit',
  CALEB_YAWN_STARTER_OUTFIT = 'Caleb_Yawn_Starter_Outfit',
  CALEB_HAPPY_STARTER_OUTFIT = 'Caleb_Happy_Starter_Outfit',
  CALEB_DISAPPOINTED_STARTER_OUTFIT = 'Caleb_Disappointed_Starter_Outfit',
  CALEB_SCARED_SURPRISED_STARTER_OUTFIT = 'Caleb_Scared_Surprised_Starter_Outfit',
  CALEB_ANGRY_STARTER_OUTFIT = 'Caleb_Angry_Starter_Outfit',
  CALEB_ANNOYED_STARTER_OUTFIT = 'Caleb_Annoyed_Starter_Outfit',
  CALEB_CONFIDENT_STARTER_OUTFIT = 'Caleb_Confident_Starter_Outfit',
  CALEB_FLUSTERED_STARTER_OUTFIT = 'Caleb_Flustered_Starter_Outfit',
  CALEB_SCARED_STARTER_OUTFIT = 'Caleb_Scared_Starter_Outfit',
  CALEB_SHIPWRECKED_DAZED_STARTER_OUTFIT = 'Caleb_Shipwrecked_Dazed_Starter_Outfit',
  HOOKAW_TIRED_DIVE_SKIN_1 = 'Hookaw_Tired_Dive_Skin_1',
  HOOKAW_TIRED_SKIN_1 = 'Hookaw_Tired_Skin_1',
  STARTER_CHEST_CLOSED = 'Starter_Chest_Closed',
  STARTER_CHEST_OPEN = 'Starter_Chest_Open',
  STARTER_1_CRAB = 'Starter_1_Crab',
  STARTER_2_IGUANA = 'Starter_2_Iguana',
  STARTER_3_MONKEY = 'Starter_3_Monkey',
  MOPUP = 'Mopup',
  EEL_SENTICLE = 'Eel_Senticle',
  CREWMATE = 'Crewmate',
  OLD_SAILOR = 'Old Sailor',
  PIRATE_GRUNT_JOE_SMIRK = 'Pirate_Grunt_Joe_Smirk',
  PIRATE_GRUNT_JOE_ANGRY = 'Pirate_Grunt_Joe_Angry',
  PIRATE_GRUNT_JOE_ANGRY_POINTING = 'Pirate_Grunt_Joe_Angry_Pointing',
  LANCE_NEUTRAL_OUTFIT_1 = 'Lance_Neutral_Outfit_1',
  LANCE_AMUSED = 'Lance_Amused',
  LANCE_ANGRY = 'Lance_Angry',
  LANCE_CALM = 'Lance_Calm',
  LANCE_SERIOUS = 'Lance_Serious',
  LANCE_SMILING = 'Lance_Smiling',
  LANCE_SURPRISED = 'Lance_Surprised',
  KIP_NERVOUS_NEUTRAL = 'Kip_Nervous_Neutral',
  KIP_PANICKED = 'Kip_Panicked',
  KIP_WORRIED = 'Kip_Worried',
  KIP_DETERMINED = 'Kip_Determined',
  KIP_HOPEFUL_SURPRISED = 'Kip_Hopeful_Surprised',
  KIP_RELIEVED_HAPPY = 'Kip_Relieved_Happy',
  CAPTAIN_VANE_HAUGHTY_NEUTRAL = 'Captain_Vane_Haughty_Neutral',
  CAPTAIN_VANE_MOCKING_DISBELIEF = 'Captain_Vane_Mocking_Disbelief',
  CAPTAIN_VANE_COMMANDING_ANGRY = 'Captain_Vane_Commanding_Angry',
  CAPTAIN_VANE_SMUG_AMUSED = 'Captain_Vane_Smug_Amused',
  CAPTAIN_VANE_STUNNED_DEFEAT = 'Captain_Vane_Stunned_Defeat',
  BEETADEL_STERN = 'Beetadel_Stern',
  RAT_CATCHER_1 = 'Rat_Catcher_1',
  RAT_CATCHER_ANGRY = 'Rat_Catcher_Angry',
  RAT_CATCHER_CALM = 'Rat_Catcher_Calm',
  RAT_CATCHER_COCKY = 'Rat_Catcher_Cocky',
  RAT_CATCHER_MOCKING = 'Rat_Catcher_Mocking',
  RAT_CATCHER_SMUG = 'Rat_Catcher_Smug',
  ASTROLAPE = 'Astrolape',
  ASTROLAPE_ROAR = 'Astrolape_Roar',
  NARRATOR = 'Narrator',
  DEFAULT = 'default',
  EMPTY = 'empty',
}

export enum BackgroundImageKey {
  CALEB_HOUSE = 'Caleb_House',
  FIRST_TOWN_DOCKS = 'First_Town_Docks',
  ISLAND_1 = 'Island_1',
  FOREST = 'Forest',
  FOREST_2 = 'Forest_2',
  DOCK_PIXEL = 'Dock_Pixel',
  LEVEL_2_STORMY_SEA = 'Level_2_Stormy_Sea',
  LEVEL_2_WAVE_IMPACT = 'Level_2_Wave_Impact',
  LEVEL_2_SHIPWRECK_BEACH = 'Level_2_Shipwreck_Beach',
  LEVEL_2_REPAIRED_BOAT_SUPPLIES = 'Level_2_Repaired_Boat_Supplies',
  DEFAULT = 'default',
}

/** Minimal game flags. Key = human-readable name, value = compact flag ID. */
export const GameFlag = {
  STARTER_PALMIT: '0_1',
  STARTER_FUEGUANA: '0_2',
  STARTER_MONKEG: '0_3',
} as const;

export type GameFlagValue = (typeof GameFlag)[keyof typeof GameFlag];

/** Linear story progression milestones. */
export const StoryProgression = {
  NEW_GAME: 0,
  PICK_STARTER: 1,
  DEFEAT_FIRST_BATTLE: 2,
  DEFEAT_BUG_STAGE_1: 3,
  DEFEAT_BUG_STAGE_2: 4,
} as const;

export type StoryProgressionValue =
  (typeof StoryProgression)[keyof typeof StoryProgression];

export interface VFXSpriteKeyframe {
  progress: number; // 0 to 1
  x?: number; // relative X offset
  y?: number; // relative Y offset
  scaleX?: number;
  scaleY?: number;
  rotation?: number; // angle in degrees
  alpha?: number; // 0 to 1
}

export interface VFXSpriteLayer {
  url: string;
  keyframes: VFXSpriteKeyframe[];
}

export interface VFXAnimationConfig {
  type:
    | 'WIPE_LINEAR'
    | 'FADE'
    | 'SCALE'
    | 'CUSTOM'
    | 'NIBBLE'
    | 'COIR_SNARE'
    | 'STRING_SHOT'
    | 'WIND_GUST'
    | 'HARDEN'
    | 'BARREL_BASH'
    | 'KEYFRAME_SPRITES';
  maskRotation?: number; // e.g. Math.PI / 4
  maskSize?: number; // e.g. 200
  fadeInProgress?: number; // 0 to 1
  fadeOutProgress?: number; // 0 to 1
  durationMs?: number; // overall duration of effect in ms
  layers?: VFXSpriteLayer[];
}

export interface UnitSpriteConfig {
  url?: string;
  scale?: number;
  flipX?: boolean;
  flipY?: boolean;
  shadowScaleX?: number;
  shadowScaleY?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  offsetX?: number;
  offsetY?: number;
  healthBarOffsetY?: number;
  vfxAnimation?: VFXAnimationConfig;
}

export interface UnitVisuals {
  default: UnitSpriteConfig;
  up?: UnitSpriteConfig;
  down?: UnitSpriteConfig;
  left?: UnitSpriteConfig;
  right?: UnitSpriteConfig;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  effect: 'HEAL' | 'CATCH';
  value: number;
  count: number;
}

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface LearnableAttack {
  level: number;
  attackId: string;
}

export interface EvolutionNode {
  level: number;
  evolutionDefId: string;
}

export interface CosmoidTemplate {
  id: string; // Species ID (e.g. 'starter_crab')
  name: string;
  type: ElementType;
  secondaryType?: ElementType;
  baseStats: BaseStats;
  baseExperience: number;
  spriteUrl: string;
  iconImg?: string;
  journalImg?: string;
  battleSpriteUrl?: string;
  battlePosition?: { bottom: number; left: number };
  battleScale?: number;
  movementId?: string;
  learnableAttacks: LearnableAttack[];
  evolutionNodes?: EvolutionNode[];
}

export interface Creature {
  id: string; // Unique instance ID
  speciesId: string; // References CosmoidTemplate.id
  name: string;
  type: ElementType;
  secondaryType?: ElementType;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  baseExperience: number; // Copy from species template
  speed: number;
  level: number;
  xp: number;
  moves: string[];
  spriteUrl: string;
  iconImg?: string;
  battleSpriteUrl?: string;
  battlePosition?: { bottom: number; left: number };
  battleScale?: number;
  movementId?: string;
  isShiny: boolean;
}

/** Slim save format for a creature the player owns. Base stats are derived at runtime from species definitions. */
export interface PlayerCreature {
  id: string; // Unique instance ID
  speciesId: string; // References species def (e.g., 'starter_crab')
  level: number;
  xp: number;
  equippedAttacks: string[]; // Attack definition IDs
  activeAttackIndex?: number; // The currently selected attack index
  targetingMode?: string; // Persistent selected targeting mode
  isShiny: boolean;
}

export interface Profile {
  id: number;
  name: string;
  lastPlayed: number; // Timestamp
  creatures: PlayerCreature[]; // Active party (max 6)
  storageCreatures: PlayerCreature[]; // Storage box creatures (independent from party)
  inventory: Item[];
  gameFlags: GameFlagValue[]; // Persistent flags set by events (e.g. GameFlag.STARTER_PALMIT)
  storyProgression: number;
  version?: number;
}

export interface DialogPortrait {
  key: SpeakerImageKey;
  displayName: string;
  portraitWidth?: 'normal' | 'wide';
  flipped?: boolean;
}

export const DialogButtonTypeConfig = {
  confirm: 'bg-cyan-400 text-ocean-dark hover:bg-cyan-300',
  cancel: 'bg-orange-500 text-white hover:bg-orange-600',
  fire: 'bg-orange-600 text-white hover:bg-orange-700',
  grass: 'bg-green-600 text-white hover:bg-green-700',
  water: 'bg-blue-600 text-white hover:bg-blue-700',
} as const;

export type DialogButtonType = keyof typeof DialogButtonTypeConfig;

export function getButtonClasses(type: DialogButtonType): string {
  const BUTTON_BASE_CLASSES =
    'px-10 py-3 font-bold rounded hover:brightness-110 transition-all uppercase tracking-wider text-base';
  const typeClasses = DialogButtonTypeConfig[type];
  return `${BUTTON_BASE_CLASSES} ${typeClasses}`;
}

export type DialogActionType = 'PROCESS_EVENT';

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

export type DialogLayout = 'default' | 'battle-left' | 'battle-right';

export interface DialogLine {
  id?: string; // Optional unique identifier for jumping to this line
  portraits: DialogPortrait[];
  text: string;
  backgroundImageKey?: BackgroundImageKey;
  buttons?: DialogButton[]; // Optional buttons for this line
  layout?: DialogLayout;
}

export enum DialogContext {
  LEVEL_1_INSTRUCTION_3 = 'LEVEL_1_INSTRUCTION_3',
  LEVEL_1_INSTRUCTION_2 = 'LEVEL_1_INSTRUCTION_2',
  LEVEL_1_INSTRUCTION_1 = 'LEVEL_1_INSTRUCTION_1',
  NEW_PLAYER_WELCOME_DIALOG = 'NEW_PLAYER_WELCOME_DIALOG',
  LEVEL_1_INTRO = 'LEVEL_1_INTRO',
  LEVEL_1_WIN = 'LEVEL_1_WIN',
  LEVEL_1_THE_MESSAGE = 'LEVEL_1_THE_MESSAGE',
  LEVEL_2_INTRO = 'LEVEL_2_INTRO',
  LEVEL_2_WIN = 'LEVEL_2_WIN',
  LEVEL_2_LOSE = 'LEVEL_2_LOSE',
  LEVEL_3_INTRO = 'LEVEL_3_INTRO',
  LEVEL_3_WIN = 'LEVEL_3_WIN',
  LEVEL_3_LOSE = 'LEVEL_3_LOSE',
  STARTER_BATTLE_LOSE = 'STARTER_BATTLE_LOSE',
  NEW_PLAYER_WELCOME_DIALOG_PART_2 = 'NEW_PLAYER_WELCOME_DIALOG_PART_2',
  GAME_INTRO_AFTER_STARTER = 'GAME_INTRO_AFTER_STARTER',
  GAME_INTRO_PART_3 = 'GAME_INTRO_PART_3',
  FOUND_ITEM = 'FOUND_ITEM',
}

export interface DialogContextData {
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
  | 'SHOW_DIALOG'
  | 'SHOW_LEVEL_SELECT_DIALOG'
  | 'GO_TO_LEVEL_SELECT'
  | 'GO_TO_CHALLENGE_SELECT'
  | 'GO_TO_MODE_SELECT'
  | 'GO_TO_PROFILES'
  | 'PICK_STARTER'
  | 'ADD_CREATURE_TO_PROFILE'
  | 'SET_FLAG'
  | 'REMOVE_FLAG'
  | 'GAIN_ITEM'
  | 'GO_TO_PARTY'
  | 'REORDER_CREATURES'
  | 'GO_TO_TOWER_DEFENSE'
  | 'EXECUTE_TD_ACTION'
  | 'SET_STORY_PROGRESSION';

export interface GameEvent {
  type: GameEventType;
  payload?:
    | ShowDialogEventPayload
    | ShowLevelSelectDialogEventPayload
    | AddCreatureToProfileEventPayload
    | SetFlagEventPayload
    | RemoveFlagEventPayload
    | GainItemEventPayload
    | ReorderCreaturesEventPayload
    | ExecuteTDActionEventPayload
    | SetStoryProgressionEventPayload
    | GoToTowerDefenseEventPayload;
  autoProceed?: boolean;
}

import { TDAction, TDLevelData } from '@/engine/tower-defense/types';

export interface ExecuteTDActionEventPayload {
  action: TDAction;
}

export interface ShowDialogEventPayload {
  context: DialogContext;
  contextData?: DialogContextData;
}

export interface ShowLevelSelectDialogEventPayload {
  context: DialogContext;
  contextData?: DialogContextData;
}

export interface AddCreatureToProfileEventPayload {
  creature: Creature;
  profileId: number;
}

export interface GoToTowerDefenseEventPayload {
  context: TDLevelContext;
}

export interface SetFlagEventPayload {
  flag: GameFlagValue;
}

export interface RemoveFlagEventPayload {
  flag: GameFlagValue;
}

export interface GainItemEventPayload {
  itemId: string;
  count: number;
}

export interface ReorderCreaturesEventPayload {
  startIndex: number;
  endIndex: number;
}

export interface SetStoryProgressionEventPayload {
  progression: StoryProgressionValue;
}
