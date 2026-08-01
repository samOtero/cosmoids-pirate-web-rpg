import { expect, test } from '@playwright/test';

test('loads the game shell without uncaught browser errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto('/');

  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('button', { name: 'Press Start' })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
