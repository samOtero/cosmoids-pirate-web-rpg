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
