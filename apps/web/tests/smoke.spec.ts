import { expect, test } from '@playwright/test';

test('loads the game shell without uncaught browser errors', async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto('/');

  expect(response?.ok()).toBe(true);
  await page.getByRole('button', { name: 'Play in Browser' }).click();
  await expect(
    page.getByRole('heading', { name: 'Select Save File' })
  ).toBeVisible();
  expect(pageErrors).toEqual([]);
});
