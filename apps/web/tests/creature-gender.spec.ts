import { expect, test } from '@playwright/test';
import { COSMOID_TEMPLATES } from '../src/constants/creatures';
import { StoryProgression } from '../src/types/baseGame';
import {
  makePlayerCreature,
  makeProfile,
} from '../src/__tests__/utils/dataBuilders';

const ordinary = Object.values(COSMOID_TEMPLATES).find(
  (template) => template.genderRatio !== 'genderless'
)!;
const genderless = Object.values(COSMOID_TEMPLATES).find(
  (template) => template.genderRatio === 'genderless'
)!;

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 844, height: 390 },
]) {
  test(`displays saved genders in party, storage and details at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const profile = makeProfile({
      name: 'Gender browser test',
      lastPlayed: Date.now(),
      storyProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
      journalOpened: true,
      journalUnlockShown: true,
      creatures: [
        makePlayerCreature({
          id: 'party-female',
          speciesId: ordinary.id,
          gender: 'female',
          level: 3,
        }),
      ],
      storageCreatures: [
        makePlayerCreature({
          id: 'stored-male',
          speciesId: ordinary.id,
          gender: 'male',
          level: 3,
        }),
        makePlayerCreature({
          id: 'stored-genderless',
          speciesId: genderless.id,
          gender: 'genderless',
          level: 3,
        }),
      ],
    });
    await page.addInitScript((savedProfile) => {
      localStorage.setItem(
        'cosmoids-game-state',
        JSON.stringify({
          version: 0,
          state: {
            profiles: [savedProfile, null, null],
          },
        })
      );
    }, profile);
    await page.goto('/');
    await page.addStyleTag({
      content: 'nextjs-portal { pointer-events: none; }',
    });
    const decline = page.getByRole('button', {
      name: 'No thanks',
      exact: true,
    });
    if (await decline.isVisible()) await decline.click();
    await page
      .getByRole('button', { name: 'Play offline', exact: true })
      .click();
    await page.getByText('Gender browser test', { exact: true }).click();
    await page.locator('#mode-story').click();
    await page.locator('#level-1').click();
    await expect(
      page.getByRole('heading', { name: 'Current Team', exact: true })
    ).toBeVisible();
    for (const label of ['Female', 'Male', 'Genderless'])
      await expect(
        page.getByRole('img', { name: label, exact: true })
      ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath('gender-party.png'),
      animations: 'disabled',
    });
    await page
      .getByRole('img', { name: genderless.name, exact: true })
      .locator('..')
      .click();
    await expect(
      page.getByRole('heading', { name: genderless.name, exact: true })
    ).toBeVisible();
    await expect(
      page
        .getByRole('img', { name: 'Genderless', exact: true })
        .filter({ hasText: 'Genderless' })
    ).toContainText('Genderless');
    await page.screenshot({
      path: testInfo.outputPath('gender-details.png'),
      animations: 'disabled',
    });
    expect(errors).toEqual([]);
  });
}
