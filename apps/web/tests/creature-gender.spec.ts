import { expect, test } from '@playwright/test';
import { COSMOID_TEMPLATES } from '../src/constants/creatures';
import { CURRENT_PROFILE_VERSION } from '../src/constants/game';
import { StoryProgression } from '../src/types/baseGame';

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
    await page.addInitScript(
      ({ speciesId, genderlessId, version, progression }) => {
        const creature = (id: string, speciesId: string, gender: string) => ({
          id,
          speciesId,
          gender,
          level: 3,
          xp: 0,
          equippedAttacks: [],
          isShiny: false,
        });
        localStorage.setItem(
          'cosmoids-game-state',
          JSON.stringify({
            version: 0,
            state: {
              profiles: [
                {
                  id: 0,
                  name: 'Gender browser test',
                  lastPlayed: Date.now(),
                  version,
                  storyProgression: progression,
                  journalOpened: true,
                  journalUnlockShown: true,
                  creatures: [creature('party-female', speciesId, 'female')],
                  storageCreatures: [
                    creature('stored-male', speciesId, 'male'),
                    creature('stored-genderless', genderlessId, 'genderless'),
                  ],
                  inventory: [],
                  gameFlags: [],
                },
                null,
                null,
              ],
            },
          })
        );
      },
      {
        speciesId: ordinary.id,
        genderlessId: genderless.id,
        version: CURRENT_PROFILE_VERSION,
        progression: StoryProgression.DEFEAT_FIRST_BATTLE,
      }
    );
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
