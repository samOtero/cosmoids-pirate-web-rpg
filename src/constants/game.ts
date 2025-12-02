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
  Crewmate: "https://picsum.photos/seed/crewmate_npc/300/300",
  "Old Sailor": "https://picsum.photos/seed/oldsailor/300/300",
  Narrator: "https://picsum.photos/seed/narrator_book/300/300",
  default: "https://picsum.photos/seed/unknown_npc/300/300",
};

export const NEW_PLAYER_WELCOME_DIALOG = [
  {
    speaker: "Grandpa_Neutral_Starter_Outfit",
    text: "Ahoy there, sailor! Welcome to the Cosmoid Islands!",
  },
  {
    speaker: "Grandpa_Neutral_Starter_Outfit",
    text: "These waters are filled with mysterious creatures waiting to be discovered. Some will become your loyal companions on this journey.",
  },
  {
    speaker: "Caleb_Neutral_Starter_Outfit",
    text: "Navigate between islands, collect creatures, and prove yourself as the greatest pirate explorer in these seas!",
  },
  {
    speaker: "Grandpa_Neutral_Starter_Outfit",
    text: "Your adventure begins at Home Shore. Fair winds and following seas, captain!",
  },
];
