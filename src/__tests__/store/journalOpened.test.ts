import { beforeEach, describe, expect, it } from 'vitest';

import { useGameStore } from '@/store/gameStore';
import { resetStore } from '@/__tests__/utils/test-utils';

describe('journal opened state', () => {
  beforeEach(resetStore);

  it('persists that the current profile has opened the journal', () => {
    useGameStore.getState().createProfile(0);

    expect(useGameStore.getState().profiles[0]?.journalOpened).toBe(false);

    useGameStore.getState().markJournalOpened();

    expect(useGameStore.getState().profiles[0]?.journalOpened).toBe(true);
  });
});
