import { Island } from "@/types/baseGame";

export const MAX_PROFILES = 3;

export const ISLANDS: Island[] = [
  {
    id: 0,
    name: "Home Shore",
    description: "A peaceful starting beach.",
    difficulty: 1,
    coordinates: { x: 10, y: 80 },
    unlocked: true,
    cleared: false,
  },
  {
    id: 1,
    name: "Coral Reef",
    description: "Vibrant colors hide lurking dangers.",
    difficulty: 2,
    coordinates: { x: 30, y: 60 },
    unlocked: false,
    cleared: false,
  },
  {
    id: 2,
    name: "Stormy Atoll",
    description: "Constant rain strengthens water types.",
    difficulty: 3,
    coordinates: { x: 50, y: 40 },
    unlocked: false,
    cleared: false,
  },
  {
    id: 3,
    name: "Volcanic Crag",
    description: "Intense heat and tough enemies.",
    difficulty: 4,
    coordinates: { x: 70, y: 20 },
    unlocked: false,
    cleared: false,
  },
  {
    id: 4,
    name: "Abyssal Point",
    description: "The edge of the known world.",
    difficulty: 5,
    coordinates: { x: 90, y: 50 },
    unlocked: false,
    cleared: false,
  },
];

export const SPEAKER_IMAGES: Record<string, string> = {
  Guide: "/dialog_caleb_neutral_starter_outfit.png",
  Grandpa_Neutral_Starter_Outfit: "/dialog_grandpa_neutral_starter_outfit.png",
  Caleb_Neutral_Starter_Outfit: "/dialog_caleb_neutral_starter_outfit.png",
  Caleb_Yawn_Starter_Outfit: "/dialog_caleb_yawn_starter_outfit.png",
  Caleb_Happy_Starter_Outfit: "/dialog_caleb_happy_starter_outfit.png",
  Crewmate: "https://picsum.photos/seed/crewmate_npc/300/300",
  "Old Sailor": "https://picsum.photos/seed/oldsailor/300/300",
  Narrator: "https://picsum.photos/seed/narrator_book/300/300",
  default: "https://picsum.photos/seed/unknown_npc/300/300",
};

export const NEW_PLAYER_WELCOME_DIALOG = [
  {
    portraitKey: "Grandpa_Neutral_Starter_Outfit",
    text: "Caleb! Wake up, you sleepy sea-pup!",
    displayName: "Grandpa",
  },
  {
    portraitKey: "Grandpa_Neutral_Starter_Outfit",
    text: "You can't sleep through your own birthday. Not when the Horizon Chaser is due in port any minute!",
    displayName: "Grandpa",
  },
  {
    portraitKey: "Caleb_Yawn_Starter_Outfit",
    text: "*Yawn* The Horizon Chaser...?",
    displayName: "Caleb",
  },
  {
    portraitKey: "Caleb_Happy_Starter_Outfit",
    text: "Mom! Dad! Did they sound the horn?! Did I miss them docking?!",
    displayName: "Caleb",
  },
  {
    portraitKey: "Grandpa_Neutral_Starter_Outfit",
    text: "Easy now! No horn yet. Go wash your face in the basin, then meet me at the docks. I'll keep an eye out for your folks.",
    displayName: "Grandpa",
  },
  {
    portraitKey: "Grandpa_Neutral_Starter_Outfit",
    text: "And fix that mop on your head! You look like a castaway.",
    displayName: "Grandpa",
  },
  {
    portraitKey: "Caleb_Happy_Starter_Outfit",
    text: "I'm on my way! I can't wait to see what new cosmoids they brought back!",
    displayName: "Caleb",
  },
];
