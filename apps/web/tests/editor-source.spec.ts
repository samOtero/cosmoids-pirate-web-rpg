import { expect, test } from '@playwright/test';

test('all source-writing editors load a versioned draft', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'No thanks', exact: true }).click();
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Play as guest', exact: true })
  ).toHaveCount(0);
  const tools = [
    { name: 'TD Level Editor', kind: 'level' },
    { name: 'Dialog Editor', kind: 'dialog' },
    { name: 'Animation Editor', kind: 'animations' },
    { name: 'TD Tower Size Editor', kind: 'visuals' },
    { name: 'VFX Effect Editor', kind: 'visuals' },
  ];
  for (const tool of tools) {
    await page.keyboard.press('Control+d');
    const loaded = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/dev/editor-source') &&
        response.request().postDataJSON()?.kind === tool.kind
    );
    await page.getByRole('button', { name: tool.name, exact: true }).click();
    if (tool.kind === 'dialog')
      await page
        .getByRole('button', { name: /^[A-Z][A-Z0-9_]+$/ })
        .first()
        .click();
    const response = await loaded;
    expect(response.ok()).toBe(true);
    const snapshot = await response.json();
    expect(snapshot.revision).toMatch(/^[a-f0-9]{64}$/);
    expect(snapshot.config).not.toBeNull();
    await expect(
      page.getByRole('status').filter({ hasText: 'Loading source' })
    ).toHaveCount(0);
    // Toggle DevTools to close the current editor without saving content.
  }
});
