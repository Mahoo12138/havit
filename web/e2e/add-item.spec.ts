import { test, expect } from '@playwright/test';
import { loginAsDemo, navigateToItems } from './helpers';

test.describe('Add Item', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await navigateToItems(page);
  });

  test('should create a new durable item', async ({ page }) => {
    const itemName = `Test Camera ${Date.now()}`;

    await page.getByRole('button', { name: /create item/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.locator('#Name').fill(itemName);
    await page.locator('#Category').fill('Electronics');

    await page.getByRole('combobox', { name: 'Location' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: /客厅/ }).first().click();

    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText(/item created/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: itemName })).toBeVisible({ timeout: 10_000 });
  });

  test('should disable save when required fields are empty', async ({ page }) => {
    await page.getByRole('button', { name: /create item/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const saveButton = page.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeDisabled();

    await page.locator('#Name').fill('Some Item');
    await expect(saveButton).toBeDisabled();

    await page.getByRole('combobox', { name: 'Location' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: /客厅/ }).first().click();

    await expect(saveButton).toBeEnabled();
  });

  test('should close dialog on cancel', async ({ page }) => {
    await page.getByRole('button', { name: /create item/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
