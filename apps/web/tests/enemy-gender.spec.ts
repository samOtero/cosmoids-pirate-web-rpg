import { expect, test } from '@playwright/test';
import type { Application, Container, Graphics } from 'pixi.js';
import { LEVEL_ORDER, TD_LEVELS } from '../src/constants/tdLevels';
import { COSMOID_TEMPLATES } from '../src/constants/creatures';
import { StoryProgression } from '../src/types/baseGame';
import {
  makePlayerCreature,
  makeProfile,
} from '../src/__tests__/utils/dataBuilders';
import { generateCreatureGender } from '../src/utils/creatureGender';
import { getDefaultAttacksForLevel } from '../src/utils/resolvePlayerCreature';
import { CREATURE_GENDER_PRESENTATION } from '../src/utils/creatureGenderPresentation';

declare global {
  interface Window {
    __enemyGenderApp?: Application;
    __PIXI_APP_INIT__?: (app: Application) => void;
  }
}

const entry = LEVEL_ORDER.find((item) => {
  const data = TD_LEVELS[item.context].levelData;
  const group = data.waves?.[0]?.groups[0];
  const encounter = data.waveEnemyDefinitions?.find(
    (enemy) => enemy.id === group?.enemyDefinitionId
  );
  const species =
    encounter?.creatureId === undefined
      ? undefined
      : COSMOID_TEMPLATES[encounter.creatureId];
  return (
    !data.premadeRoster?.length &&
    encounter?.gender === undefined &&
    typeof species?.genderRatio === 'object' &&
    species.genderRatio.female > 0 &&
    species.genderRatio.female < 1
  );
})!;

for (const scenario of [
  { gender: 'female', roll: 0, viewport: { width: 844, height: 390 } },
  { gender: 'male', roll: 0.999, viewport: { width: 1280, height: 800 } },
] as const) {
  test(`shows a readable ${scenario.gender} enemy badge at ${scenario.viewport.width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90000);
    await page.setViewportSize(scenario.viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const species = Object.values(COSMOID_TEMPLATES)[0];
    const profile = makeProfile({
      name: 'Enemy gender check',
      lastPlayed: Date.now(),
      storyProgression:
        entry.requiredProgression ?? StoryProgression.DEFEAT_FIRST_BATTLE,
      journalOpened: true,
      journalUnlockShown: true,
      creatures: [
        makePlayerCreature({
          id: 'gender-check-party-creature',
          speciesId: species.id,
          level: 3,
          gender: generateCreatureGender(species.id, () => scenario.roll),
          equippedAttacks: getDefaultAttacksForLevel(species, 3),
        }),
      ],
    });
    await page.addInitScript((saved) => {
      localStorage.setItem(
        'cosmoids-game-state',
        JSON.stringify({
          version: 0,
          state: { profiles: [saved, null, null] },
        })
      );
      window.__PIXI_APP_INIT__ = (app) => {
        if ('stage' in app) window.__enemyGenderApp = app;
      };
    }, profile);
    await page.goto('/');
    await page.addStyleTag({
      content: 'nextjs-portal { pointer-events:none; }',
    });
    await page
      .getByRole('button', { name: 'Play offline', exact: true })
      .click();
    await page.getByText(profile.name, { exact: true }).click();
    await page.locator('#mode-story').click();
    await page.locator('#level-' + (LEVEL_ORDER.indexOf(entry) + 1)).click();
    // Control the spawn's gender only after the app has hydrated and loaded the save.
    await page.evaluate((roll) => {
      Math.random = () => roll;
    }, scenario.roll);
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.getByText('Skip', { exact: true }).click();
    const pause = page.getByRole('button', { name: 'Pause', exact: true });
    await expect(pause).toBeEnabled({ timeout: 30000 });
    const readBadges = () =>
      page.evaluate(() => {
        const app = window.__enemyGenderApp;
        const world = app?.stage.getChildByLabel('worldLayer');
        if (!app || !world) return [];
        return world.children.flatMap((node) => {
          const container = node as Container;
          const badge = container.getChildByLabel?.('enemyGenderIndicator');
          const hp = container.getChildByLabel?.('hpBg');
          if (!badge || !hp) return [];
          const bounds = badge.getBounds();
          const symbol = badge.getChildByLabel('genderSymbol') as Graphics;
          const strokes = symbol.context.instructions.filter(
            (instruction) => instruction.action === 'stroke'
          );
          return [
            {
              height: bounds.height,
              left: bounds.minX,
              hpRight: hp.getBounds().maxX,
              color: strokes.at(-1)!.data.style.color,
              visible:
                bounds.minX >= 0 &&
                bounds.maxX <= app.screen.width &&
                bounds.minY >= 0 &&
                bounds.maxY <= app.screen.height,
              eventMode: badge.eventMode,
            },
          ];
        });
      });
    await expect
      .poll(async () => (await readBadges()).some((badge) => badge.visible), {
        timeout: 20000,
      })
      .toBe(true);
    await pause.click();
    for (const badge of await readBadges()) {
      expect(badge.color).toBe(
        CREATURE_GENDER_PRESENTATION[scenario.gender].color
      );
      expect(badge.height).toBeGreaterThanOrEqual(18);
      expect(badge.left).toBeGreaterThan(badge.hpRight);
      expect(badge.eventMode).toBe('none');
    }
    await page.screenshot({
      path: testInfo.outputPath('enemy-' + scenario.gender + '.png'),
    });
    const zoomOut = page.getByRole('button', { name: '−', exact: true });
    if (await zoomOut.isVisible()) {
      await zoomOut.click();
      await zoomOut.click();
      await expect
        .poll(async () =>
          (await readBadges()).every((badge) => badge.height >= 18)
        )
        .toBe(true);
      await page.screenshot({
        path: testInfo.outputPath(
          'enemy-' + scenario.gender + '-zoomed-out.png'
        ),
      });
    }
    expect(errors).toEqual([]);
  });
}
