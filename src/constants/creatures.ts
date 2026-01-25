import { Creature, ElementType } from "@/types/baseGame";

export const SENTICLE: Creature = {
  id: "senticle",
  name: "Senticle",
  type: ElementType.NORMAL,
  maxHp: 20,
  currentHp: 20,
  attack: 10,
  defense: 5,
  speed: 20,
  level: 2,
  xp: 0,
  moves: ["T Tackle", "Leer"], // Placeholder moves
  spriteUrl: "/eel-basic-normal-neutral-skin-1.png",
};
