import { expect, test } from '@playwright/test';

test('loads the game shell without uncaught browser errors', async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto('/');

  expect(response?.ok()).toBe(true);
  await page.getByRole('button', { name: 'Play as guest' }).click();
  await expect(
    page.getByRole('heading', { name: 'Select Save File' })
  ).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('toggles fullscreen independently of guest play', async ({ page }) => {
  await page.goto('/');
  const play = page.getByRole('button', { name: 'Play as guest' });
  await page.getByRole('button', { name: 'Enter fullscreen' }).click();
  await expect(
    page.getByRole('button', { name: 'Exit fullscreen' })
  ).toBeVisible();
  await expect(play).toBeVisible();
  expect(await page.evaluate(() => document.fullscreenElement?.tagName)).toBe(
    'HTML'
  );
  await play.click();
  await expect(
    page.getByRole('heading', { name: 'Select Save File' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Exit fullscreen' }).click();
  await expect(
    page.getByRole('button', { name: 'Enter fullscreen' })
  ).toBeVisible();
  expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
});
