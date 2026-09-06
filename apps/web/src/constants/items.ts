import { Item } from '@/types/baseGame';

export const BERRY_ITEM: Item = {
  id: 'BERRY',
  name: 'Berry',
  description: 'A sweet berry that restores 20 HP.',
  effect: 'HEAL',
  value: 20,
  count: 1,
};

export const CAPTURE_DEVICE_ITEM: Item = {
  id: 'CATCH_DEVICE',
  name: 'Capture Device',
  description: 'A device that can trap a weakened Cosmoid. (50% Catch Rate)',
  effect: 'CATCH',
  value: 0.5,
  count: 1,
};

export const ITEMS: Record<string, Item> = {
  [BERRY_ITEM.id]: BERRY_ITEM,
  [CAPTURE_DEVICE_ITEM.id]: CAPTURE_DEVICE_ITEM,
};
