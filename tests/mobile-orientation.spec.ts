import { devices, expect, test } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

test('blocks the game in portrait and clears after rotating to landscape', async ({
  page,
}) => {
  await page.goto('/');

  const rotatePrompt = page.getByRole('dialog', {
    name: 'Rotate your device',
  });

  await expect(rotatePrompt).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(rotatePrompt).toBeHidden();
  await expect(page.getByRole('button', { name: 'Press Start' })).toBeVisible();
});
