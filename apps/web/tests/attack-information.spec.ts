import { expect, test } from '@playwright/test';
import { COSMOID_TEMPLATES } from '../src/constants/creatures';
import { ATTACK_DEFS } from '../src/engine/tower-defense/attacks/definitions';
import { MAX_COSMOID_LEVEL } from '../src/constants/game';
import { StoryProgression } from '../src/types/baseGame';
import {
  makePlayerCreature,
  makeProfile,
} from '../src/__tests__/utils/dataBuilders';
import { generateCreatureGender } from '../src/utils/creatureGender';

const species = Object.values(COSMOID_TEMPLATES).find((candidate) =>
  candidate.learnableAttacks.some((move) => move.level <= MAX_COSMOID_LEVEL)
)!;
const forgotten =
  ATTACK_DEFS[
    species.learnableAttacks.find((move) => move.level <= MAX_COSMOID_LEVEL)!
      .attackId
  ];
const known = Object.values(ATTACK_DEFS)
  .filter((move) => move.id !== forgotten.id)
  .slice(0, 4);

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 844, height: 390 },
]) {
  test(`inspects moves and confirms replacement at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const creature = makePlayerCreature({
      id: 'attack-info-browser',
      speciesId: species.id,
      gender: generateCreatureGender(species.id),
      level: MAX_COSMOID_LEVEL,
      equippedAttacks: known.map((move) => move.id),
      activeAttackIndex: 0,
    });
    const profile = makeProfile({
      name: 'Attack information test',
      lastPlayed: Date.now(),
      storyProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
      journalOpened: true,
      journalUnlockShown: true,
      creatures: [creature],
    });
    await page.addInitScript(
      (saved) =>
        localStorage.setItem(
          'cosmoids-game-state',
          JSON.stringify({
            version: 0,
            state: { profiles: [saved, null, null] },
          })
        ),
      profile
    );
    await page.goto('/');
    await page.addStyleTag({
      content: 'nextjs-portal { pointer-events: none; }',
    });
    await page
      .getByRole('button', { name: 'Play offline', exact: true })
      .click();
    await page.getByText(profile.name, { exact: true }).click();
    await page.locator('#mode-story').click();
    await page.locator('#level-1').click();
    await page
      .getByRole('img', { name: species.name, exact: true })
      .locator('..')
      .click();
    await page
      .getByRole('button', { name: 'Inspect ' + known[1].name, exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Make Active', exact: true })
    ).toBeVisible();
    const activeIndex = () =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('cosmoids-game-state')!).state
            .profiles[0].creatures[0].activeAttackIndex
      );
    expect(await activeIndex()).toBe(0);
    const profileDetails = page.getByRole('region', {
      name: known[1].name + ' details',
    });
    expect((await profileDetails.boundingBox())!.height).toBeLessThan(
      viewport.height * 0.6
    );
    await page.screenshot({
      path: testInfo.outputPath('profile-move-information.png'),
    });
    await page
      .getByRole('button', {
        name: 'Inspect forgotten move ' + forgotten.name,
        exact: true,
      })
      .click();
    await page
      .getByRole('button', { name: 'Relearn ' + forgotten.name, exact: true })
      .click();
    const comparison = page.getByRole('dialog', {
      name: 'Choose an attack to replace',
    });
    await comparison
      .getByRole('button', {
        name: 'Compare with ' + known[0].name,
        exact: true,
      })
      .click();
    const replace = comparison.getByRole('button', {
      name: 'Replace ' + known[0].name + ' with ' + forgotten.name,
      exact: true,
    });
    await expect(replace).toBeVisible();
    await expect(replace).toBeInViewport({ ratio: 1 });
    await expect(
      comparison.getByRole('region', { name: / details$/ })
    ).toHaveCount(1);
    const comparisonBounds = (await comparison.boundingBox())!;
    expect(comparisonBounds.height).toBeLessThan(viewport.height * 0.9);
    expect(comparisonBounds.x).toBeGreaterThanOrEqual(0);
    expect(comparisonBounds.x + comparisonBounds.width).toBeLessThanOrEqual(
      viewport.width
    );
    await page.screenshot({
      path: testInfo.outputPath('move-replacement-confirmation.png'),
    });
    await replace.click();
    expect(await activeIndex()).toBe(0);
    await expect(
      page.getByRole('button', { name: 'Already Active', exact: true })
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Back to Team', exact: true })
      .click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.getByText('Skip', { exact: true }).click();
    const pause = page.getByRole('button', { name: 'Pause', exact: true });
    await expect(pause).toBeEnabled({ timeout: 20000 });
    await pause.click();
    await page
      .getByRole('button', { name: new RegExp(species.name, 'i') })
      .click();
    const menu = page.getByRole('dialog', { name: 'Moves · ' + species.name });
    await expect(menu).toContainText('Battle paused');
    await menu
      .getByRole('button', { name: 'Inspect ' + known[1].name, exact: true })
      .click();
    await expect(
      menu.getByRole('region', { name: known[1].name + ' details' })
    ).toBeVisible();
    const trayBounds = (await menu.boundingBox())!;
    expect(trayBounds.height).toBeLessThan(viewport.height * 0.55);
    expect(trayBounds.y).toBeGreaterThan(viewport.height * 0.45);
    await expect(
      menu.getByRole('button', { name: 'Make Active', exact: true })
    ).toBeInViewport({ ratio: 1 });
    const close = menu.getByRole('button', { name: 'Close', exact: true });
    await expect(close).toBeInViewport({ ratio: 1 });
    await expect(menu.getByRole('region', { name: / details$/ })).toHaveCount(
      1
    );
    await page.screenshot({
      path: testInfo.outputPath('battle-move-information.png'),
    });
    await menu.getByLabel('More about ' + known[1].name).click();
    expect((await menu.boundingBox())!.height).toBe(trayBounds.height);
    await expect(close).toBeInViewport({ ratio: 1 });
    await menu.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Start', exact: true })
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
