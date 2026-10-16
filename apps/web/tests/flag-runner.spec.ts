import { expect, test } from '@playwright/test';
import {
  CURRENT_PROFILE_VERSION,
  MAX_COSMOID_LEVEL,
} from '../src/constants/game';
import { COSMOID_TEMPLATES } from '../src/constants/creatures';
import { LEVEL_ORDER, TD_LEVELS } from '../src/constants/tdLevels';
import { resolveTDBattlefieldHeight } from '../src/utils/tdInitialView';
import { getDefaultAttacksForLevel } from '../src/utils/resolvePlayerCreature';
import { generateCreatureGender } from '../src/utils/creatureGender';

const entry = LEVEL_ORDER.find(
  (item) => TD_LEVELS[item.context]?.levelData.flagDuel?.playerLaunch
)!;
const level = TD_LEVELS[entry.context].levelData;
const species = COSMOID_TEMPLATES[level.flagDuel!.alliedRunner.creatureId];

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 844, height: 390 },
]) {
  test(`launches directly from a roster button at ${viewport.width}px`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(
      ({ version, progression, creature }) => {
        localStorage.setItem(
          'cosmoids-game-state',
          JSON.stringify({
            state: {
              profiles: [
                {
                  id: 0,
                  name: 'Flag runner test',
                  lastPlayed: Date.now(),
                  version,
                  storyProgression: progression,
                  journalOpened: true,
                  journalUnlockShown: true,
                  creatures: [creature],
                  storageCreatures: [],
                  capturedSpeciesIds: [creature.speciesId],
                  inventory: [],
                  gameFlags: [],
                },
                null,
                null,
              ],
            },
            version: 0,
          })
        );
      },
      {
        version: CURRENT_PROFILE_VERSION,
        progression: entry.requiredProgression,
        creature: {
          id: 'runner-test',
          speciesId: species.id,
          level: MAX_COSMOID_LEVEL,
          xp: 0,
          equippedAttacks: getDefaultAttacksForLevel(
            species,
            MAX_COSMOID_LEVEL
          ),
          isShiny: false,
          gender: generateCreatureGender(species.id),
        },
      }
    );
    await page.goto('/');
    // Development chrome must not intercept game input on small viewports.
    await page.addStyleTag({
      content: 'nextjs-portal { pointer-events: none; }',
    });
    await page.getByRole('button', { name: 'Play offline' }).click();
    await page.getByText('Flag runner test', { exact: true }).click();
    await page.locator('#mode-story').click();
    await page.locator(`#level-${LEVEL_ORDER.indexOf(entry) + 1}`).click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    const pause = page.getByRole('button', { name: 'Pause', exact: true });
    await expect(pause).toBeEnabled();
    await pause.click();
    await expect(
      page.getByRole('button', { name: 'Enter fullscreen' })
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Exit fullscreen' })
    ).toHaveCount(0);
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    const bounds = (await canvas.boundingBox())!;
    const ratio = await page.evaluate(async (url) => {
      const image = new Image();
      image.src = url!;
      await image.decode();
      return image.naturalWidth / image.naturalHeight;
    }, level.backgroundUrl);
    const height = resolveTDBattlefieldHeight(
      bounds.width,
      bounds.height,
      ratio,
      level.backgroundScale ?? 1,
      !!level.fitToScreen
    );
    const width = height * ratio;
    const launch = level.flagDuel!.playerLaunch!.position;
    const destination = {
      x: bounds.x + (bounds.width - width) / 2 + (width * launch.x) / 100,
      y: bounds.y + (bounds.height - height) / 2 + (height * launch.y) / 100,
    };
    const button = page.getByRole('button', {
      name: new RegExp(species.name, 'i'),
    });
    const origin = (await button.boundingBox())!;
    await page.mouse.move(
      origin.x + origin.width / 2,
      origin.y + origin.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(destination.x, destination.y, { steps: 15 });
    await page.mouse.up();
    await expect(button).toBeDisabled();
    await expect(button).toContainText('Running');
    await page.screenshot({
      path: `../../output/flag-runner-${viewport.width}.png`,
    });
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect
      .poll(
        async () =>
          !(await button.isDisabled()) ||
          (await button.textContent())?.includes('Recovering'),
        { timeout: 20000 }
      )
      .toBeTruthy();
    expect(errors).toEqual([]);
  });
}
