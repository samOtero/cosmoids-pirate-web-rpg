import { Item } from '@/types/baseGame';

export const BERRY_ITEM: Item = {
  id: 'BERRY',
  name: 'Berry',
  description: 'A sweet berry that restores 20 HP.',
  effect: 'HEAL',
  value: 20,
  count: 1,
};

export const ITEMS: Record<string, Item> = {
  [BERRY_ITEM.id]: BERRY_ITEM,
};
