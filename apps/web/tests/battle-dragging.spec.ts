import { expect, test } from '@playwright/test';
import type { Application, Container, Sprite } from 'pixi.js';
import { LEVEL_ORDER, TD_LEVELS } from '../src/constants/tdLevels';
import { COSMOID_TEMPLATES } from '../src/constants/creatures';
import { getDefaultAttacksForLevel } from '../src/utils/resolvePlayerCreature';
import { generateCreatureGender } from '../src/utils/creatureGender';
import {
  makePlayerCreature,
  makeProfile,
} from '../src/__tests__/utils/dataBuilders';
import { TD_TOUCH_DRAG_OFFSET_PX } from '../src/utils/tdDragPointer';

declare global {
  interface Window {
    __battleDragApp?: Application;
    __PIXI_APP_INIT__?: (app: Application) => void;
  }
}
const entry = LEVEL_ORDER.find((item) => {
  const data = TD_LEVELS[item.context].levelData;
  return (
    (data.backgroundScale ?? 1) >= 2 &&
    !data.premadeRoster?.length &&
    !data.disableCapture &&
    !data.flagDuel
  );
})!;
const level = TD_LEVELS[entry.context].levelData;
const species = Object.values(COSMOID_TEMPLATES)[0];

for (const input of ['touch', 'mouse'] as const) {
  test.describe(input + ' battlefield dragging', () => {
    test.use({
      viewport:
        input === 'touch'
          ? { width: 844, height: 390 }
          : { width: 1280, height: 800 },
      hasTouch: input === 'touch',
    });
    test('raises touch targets and accelerates the camera without losing the drop location', async ({
      page,
      context,
    }, testInfo) => {
      test.setTimeout(120000);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const creature = makePlayerCreature({
        id: 'browser-drag-creature',
        speciesId: species.id,
        level: 5,
        equippedAttacks: getDefaultAttacksForLevel(species, 5),
        gender: generateCreatureGender(species.id),
      });
      const profile = makeProfile({
        name: 'Drag controls test',
        lastPlayed: Date.now(),
        storyProgression: entry.requiredProgression,
        journalOpened: true,
        journalUnlockShown: true,
        creatures: [creature],
      });
      await page.addInitScript((saved) => {
        localStorage.setItem(
          'cosmoids-game-state',
          JSON.stringify({
            version: 0,
            state: { profiles: [saved, null, null] },
          })
        );
        // Pixi's supported initialization hook allows observing rendering without adding app test hooks.
        window.__PIXI_APP_INIT__ = (app) => {
          if ('stage' in app) window.__battleDragApp = app;
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
      await page.getByRole('button', { name: 'Start', exact: true }).click();
      await page.getByText('Skip', { exact: true }).click();
      const pause = page.getByRole('button', { name: 'Pause', exact: true });
      await expect(pause).toBeEnabled({ timeout: 30000 });
      await pause.click();
      await page.waitForFunction(
        () =>
          !!window.__battleDragApp?.stage.getChildByLabel('backgroundLayer')
            ?.children.length
      );
      const canvas = page.locator('canvas').first();
      const rect = (await canvas.boundingBox())!;
      const roster = page.getByRole('button', {
        name: new RegExp(species.name, 'i'),
      });
      const capture = page.getByRole('button', {
        name: 'Drag capture ball',
        exact: true,
      });
      const cdp = await context.newCDPSession(page);
      const lift = input === 'touch' ? TD_TOUCH_DRAG_OFFSET_PX : 0;
      let pointer = { x: 0, y: 0 };
      const down = async (point: { x: number; y: number }) => {
        pointer = point;
        if (input === 'touch')
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ id: 1, ...point, radiusX: 7, radiusY: 7 }],
          });
        else {
          await page.mouse.move(point.x, point.y);
          await page.mouse.down();
        }
      };
      const move = async (point: { x: number; y: number }) => {
        pointer = point;
        if (input === 'touch')
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ id: 1, ...point, radiusX: 7, radiusY: 7 }],
          });
        else await page.mouse.move(point.x, point.y);
      };
      const up = async () => {
        if (input === 'touch')
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [],
          });
        else await page.mouse.up();
      };
      const cancel = async () => {
        if (input === 'touch')
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchCancel',
            touchPoints: [],
          });
        else {
          await page.evaluate(() => window.dispatchEvent(new Event('blur')));
          await page.mouse.up();
        }
      };
      const camera = () =>
        page.evaluate(() => {
          const app = window.__battleDragApp!;
          const bg = app.stage.getChildByLabel('backgroundLayer')!
            .children[0] as Sprite;
          const world = app.stage.getChildByLabel('worldLayer')!;
          return {
            x: bg.x,
            y: bg.y,
            width: bg.width,
            height: bg.height,
            viewportWidth: app.screen.width,
            viewportHeight: app.screen.height,
            towers: world.children
              .filter((node) =>
                (node as Container).getChildByLabel?.('tower_sprite')
              )
              .map((node) => ({ x: node.x, y: node.y })),
          };
        });
      const projected = (
        spot: { x: number; y: number },
        view: Awaited<ReturnType<typeof camera>>
      ) => ({
        x: rect.x + view.x + (spot.x * view.width) / 100,
        y: rect.y + view.y + (spot.y * view.height) / 100,
      });
      const visibleSpot = async (exclude?: { x: number; y: number }) => {
        const view = await camera();
        const result = level.placementSpots.find((spot) => {
          const p = projected(spot, view);
          return (
            spot !== exclude &&
            p.x > rect.x + 62 &&
            p.x < rect.x + rect.width - 62 &&
            p.y > rect.y + 40 &&
            p.y < rect.y + rect.height - 42 &&
            !view.towers.some(
              (tower) =>
                Math.hypot(tower.x - (p.x - rect.x), tower.y - (p.y - rect.y)) <
                12
            )
          );
        });
        expect(
          result,
          'A discoverable open placement spot must be visible'
        ).toBeTruthy();
        return result!;
      };
      const aimAt = async (spot: { x: number; y: number }) => {
        const point = projected(spot, await camera());
        await move({ x: point.x, y: point.y + lift });
      };
      const preview = page.getByTestId('battle-drag-preview');
      const assertPreview = async () => {
        const bounds = (await preview.boundingBox())!;
        expect(
          Math.abs(bounds.y + bounds.height / 2 - (pointer.y - lift))
        ).toBeLessThan(4);
        if (input === 'touch')
          expect(bounds.y + bounds.height).toBeLessThan(pointer.y - 15);
      };
      const scrollOverBanners = async () => {
        // Ensure there is room above before checking the top banner.
        if ((await camera()).y > -30) {
          await move({
            x: rect.x + rect.width / 2,
            y: (rect.y + rect.height + page.viewportSize()!.height) / 2,
          });
          await expect
            .poll(async () => -(await camera()).y)
            .toBeGreaterThan(30);
        }
        for (const banner of ['top', 'bottom'] as const) {
          const before = await camera();
          await move({
            x: rect.x + rect.width / 2,
            y:
              banner === 'top'
                ? rect.y / 2
                : (rect.y + rect.height + page.viewportSize()!.height) / 2,
          });
          await expect
            .poll(async () => {
              const after = await camera();
              return banner === 'top' ? after.y - before.y : before.y - after.y;
            })
            .toBeGreaterThan(4);
        }
      };
      const assertCameraStopped = async () => {
        const stopped = await camera();
        await page.waitForTimeout(180);
        expect((await camera()).x).toBeCloseTo(stopped.x);
        expect((await camera()).y).toBeCloseTo(stopped.y);
      };

      const start = (await roster.boundingBox())!;
      await down({
        x: start.x + start.width / 2,
        y: start.y + start.height / 2,
      });
      await move({
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2 + lift,
      });
      await expect(preview).toBeVisible();
      await assertPreview();
      const before = await camera();
      const directions = [
        { axis: 'x', sign: -1, room: -before.x },
        {
          axis: 'x',
          sign: 1,
          room: before.width - before.viewportWidth + before.x,
        },
        { axis: 'y', sign: -1, room: -before.y },
        {
          axis: 'y',
          sign: 1,
          room: before.height - before.viewportHeight + before.y,
        },
      ].sort((a, b) => b.room - a.room);
      const edge = directions[0];
      expect(edge.room).toBeGreaterThan(150);
      const edgeAim = { x: rect.width / 2, y: rect.height / 2 };
      if (edge.axis === 'x') edgeAim.x = edge.sign > 0 ? rect.width - 3 : 3;
      else edgeAim.y = edge.sign > 0 ? rect.height - 3 : 3;
      await move({ x: rect.x + edgeAim.x, y: rect.y + edgeAim.y + lift });
      const samples = await page.evaluate(
        () =>
          new Promise<{ time: number; x: number; y: number }[]>((resolve) => {
            const app = window.__battleDragApp!,
              bg = app.stage.getChildByLabel('backgroundLayer')!.children[0];
            const positions: { time: number; x: number; y: number }[] = [];
            const start = performance.now();
            const sample = () => {
              const time = performance.now() - start;
              positions.push({ time, x: bg.x, y: bg.y });
              if (time >= 950) resolve(positions);
              else requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          })
      );
      const distance = (from: number, to: number) => {
        const within = samples.filter(
          (sample) => sample.time >= from && sample.time <= to
        );
        expect(within.length).toBeGreaterThan(1);
        const a = within[0],
          b = within[within.length - 1];
        return Math.abs(
          (edge.axis === 'x' ? b.x - a.x : b.y - a.y) / (b.time - a.time)
        );
      };
      expect(distance(650, 950)).toBeGreaterThan(distance(0, 200) * 2);
      await page.screenshot({
        path: testInfo.outputPath('edge-scroll-' + input + '.png'),
      });
      await scrollOverBanners();
      // A stationary aim point maps to fresh world coordinates after the camera pans.
      const target = await visibleSpot();
      await aimAt(target);
      await up();
      await expect(preview).toHaveCount(0);
      await expect
        .poll(async () => {
          const view = await camera(),
            p = projected(target, view);
          return view.towers.some(
            (tower) =>
              Math.hypot(tower.x - (p.x - rect.x), tower.y - (p.y - rect.y)) < 2
          );
        })
        .toBe(true);
      await assertCameraStopped();

      // Moving an already placed tower uses the same raised target and supports cancellation.
      const placed = projected(target, await camera());
      await down(placed);
      await move({
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2 + lift,
      });
      await expect
        .poll(async () => {
          const view = await camera();
          return view.towers.some(
            (tower) =>
              Math.hypot(tower.x - rect.width / 2, tower.y - rect.height / 2) <
              3
          );
        })
        .toBe(true);
      await scrollOverBanners();
      const beforeInternalPan = await camera();
      const internalAim = {
        x: rect.width / 2,
        y: beforeInternalPan.y < -20 ? 3 : rect.height - 3,
      };
      await move({
        x: rect.x + internalAim.x,
        y: rect.y + internalAim.y + lift,
      });
      await expect
        .poll(async () => Math.abs((await camera()).y - beforeInternalPan.y))
        .toBeGreaterThan(1);
      await cancel();
      await expect
        .poll(async () => {
          const view = await camera(),
            p = projected(target, view);
          return view.towers.some(
            (tower) =>
              Math.hypot(tower.x - (p.x - rect.x), tower.y - (p.y - rect.y)) < 2
          );
        })
        .toBe(true);

      const another = await visibleSpot(target);
      await down(projected(target, await camera()));
      await aimAt(another);
      await up();
      await expect
        .poll(async () => {
          const view = await camera(),
            p = projected(another, view);
          return view.towers.some(
            (tower) =>
              Math.hypot(tower.x - (p.x - rect.x), tower.y - (p.y - rect.y)) < 2
          );
        })
        .toBe(true);

      const cap = (await capture.boundingBox())!;
      await down({ x: cap.x + cap.width / 2, y: cap.y + cap.height / 2 });
      await move({
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2 + lift,
      });
      await expect(preview).toBeVisible();
      await assertPreview();
      await scrollOverBanners();
      // Capture-device drags also pan at an edge inside the map.
      const beforeCapturePan = await camera();
      await move({
        x: rect.x + rect.width / 2,
        y: rect.y + 3 + lift,
      });
      await expect
        .poll(async () => (await camera()).y - beforeCapturePan.y)
        .toBeGreaterThan(1);
      await page.screenshot({
        path: testInfo.outputPath('capture-offset-' + input + '.png'),
      });
      await cancel();
      await expect(preview).toHaveCount(0);
      await assertCameraStopped();
      expect(errors).toEqual([]);
    });
  });
}
