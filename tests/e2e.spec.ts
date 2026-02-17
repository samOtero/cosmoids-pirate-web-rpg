import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
  test('Start game with Fueguana and enter first battle', async ({ page }) => {
    // 1. Navigate
    await test.step('Navigate to Game and Verify Title', async () => {
      await page.goto('http://localhost:3000');
      await expect(page.getByText('OCEANIC')).toBeVisible();
    });

    // 2. Inject State
    const state =
      await test.step('Inject Game State (Fueguana + First Battle)', async () => {
        return await page.evaluate(() => {
          // Access the store from the window object
          const store = (window as any).__GAME_STORE__;

          // Ensure we start fresh
          store.getState().deleteProfile(0);
          store.getState().createProfile(0);
          store.getState().selectProfile(0); // This sets up initial events

          // Clear the default "New Player" events (Intro Dialogs)
          store.getState().clearQueue();

          // Enqueue our custom events:
          // 1. Pick Starter (Fueguana/Blazy)
          // 2. Start First Battle
          store.getState().enqueueAndProcessEvents([
            {
              type: 'PICK_STARTER',
              payload: { flag: '0_2' }, // STARTER_FUEGUANA
              autoProceed: true,
            },
            {
              type: 'START_BATTLE',
              payload: { context: 'FIRST_BATTLE' },
            },
          ]);

          return {
            screen: store.getState().currentScreen,
            profile: store.getState().profiles[0],
            queue: store.getState().eventQueue,
          };
        });
      });

    // 3. Verify State
    await test.step('Verify Backend State', async () => {
      expect(state.screen).toBe('BATTLE');
      expect(state.profile).not.toBeNull();
      expect(state.profile.creatures.length).toBeGreaterThan(0);
    });

    // 4. Verify UI
    await test.step('Verify Battle Screen UI', async () => {
      // We expect "Blazy" (the starter Iguana's name) to be visible
      await expect(page.getByText('Blazy')).toBeVisible();

      // The battle starts with a Dialog ("What... What do I do?!")
      await expect(page.getByText('What… What do I do?!')).toBeVisible();
    });
  });
});
