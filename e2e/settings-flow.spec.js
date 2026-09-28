import { test, expect } from '@playwright/test';

test('Flatpaks não verificados podem ser ativados, persistidos e desativados', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => route.fulfill({
    json: { apt: [], flatpaks: [], aptStatus: 'available', flatpakStatus: 'available' }
  }));
  await page.goto('/');
  const openSettings = async () => {
    await page.getByTitle('Menu do aplicativo').click();
    await page.getByText('Preferências', { exact: true }).click();
    await page.getByRole('button', { name: 'Flatpaks', exact: true }).click();
  };
  await openSettings();
  const checkbox = page.getByRole('checkbox', { name: /Incluir resultados online não verificados/ });
  await checkbox.check();
  await expect(page.getByText('Preferências salvas automaticamente!')).toBeVisible();
  await expect(checkbox).toBeChecked();
  await page.reload();
  await openSettings();
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await expect(page.getByText('Preferências salvas automaticamente!')).toBeVisible();
  await page.reload();
  await openSettings();
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByText('Algo deu errado', { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});
