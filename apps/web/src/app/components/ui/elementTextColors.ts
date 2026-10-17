import { ElementType } from '@/types/baseGame';

/** Element label colors chosen for the game's dark panels and selected rows. */
export const ELEMENT_TEXT_COLORS: Record<ElementType, string> = {
  [ElementType.WATER]: 'text-blue-300',
  [ElementType.FIRE]: 'text-orange-300',
  [ElementType.GRASS]: 'text-green-300',
  [ElementType.BUG]: 'text-lime-300',
  [ElementType.ROCK]: 'text-stone-300',
  [ElementType.GROUND]: 'text-amber-300',
  [ElementType.STEEL]: 'text-slate-300',
  [ElementType.POISON]: 'text-purple-300',
  [ElementType.DARK]: 'text-indigo-300',
  [ElementType.PSYCHIC]: 'text-fuchsia-300',
  [ElementType.ELECTRIC]: 'text-yellow-300',
  [ElementType.NORMAL]: 'text-gray-200',
  [ElementType.FIGHTING]: 'text-red-300',
  [ElementType.FLYING]: 'text-sky-300',
};
