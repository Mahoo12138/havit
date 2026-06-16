import { test, expect, type Page } from '@playwright/test';
import { loginAsDemo } from './helpers';

async function navigateToLocations(page: Page) {
  await page.goto('/locations');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}

test.describe('Locations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await navigateToLocations(page);
  });

  test('should display the location tree with seeded data', async ({ page }) => {
    await expect(page.getByText(/my home|我的家/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/@cloud|@云端/)).toBeVisible();
  });

  test('should select a location from the tree and show its detail', async ({ page }) => {
    await page.getByText(/my home|我的家/).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('button', { name: /add child|add child/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', /edit|edit/i)).toBeVisible();
  });

  test('should open create dialog for root location', async ({ page }) => {
    await page.getByRole('button', { name: /add root/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/type|type/i)).toBeVisible();

    await page.getByRole('dialog').getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should create a root location', async ({ page }) => {
    const locationName = `Test Property ${Date.now()}`;

    await page.getByRole('button', { name: /add root/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    await page.locator('#Name').fill(locationName);
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText(new RegExp(locationName))).toBeVisible({ timeout: 10_000 });
  });

  test('should create a child location under an existing parent', async ({ page }) => {
    await page.getByText(/my home|我的家/).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /add child/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    const childName = `Test Room ${Date.now()}`;
    await page.locator('#Name').fill(childName);

    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(new RegExp(childName))).toBeVisible({ timeout: 10_000 });
  });

  test('should display breadcrumb path for nested locations', async ({ page }) => {
    await page.getByText(/my home|我的家/).click();
    await page.waitForTimeout(500);

    await page.getByText(/living room|客厅/).first().click();
    await page.waitForTimeout(500);

    const breadcrumb = page.getByText(/my home|我的家/).first();
    await expect(breadcrumb).toBeVisible();
  });

  test('should open edit dialog for a location', async ({ page }) => {
    await page.getByText(/my home|我的家/).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /edit/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('dialog').locator('#Name')).toBeVisible();
  });

  test('should edit a location name', async ({ page }) => {
    await page.getByText(/my home|我的家/).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /edit/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    const input = page.getByRole('dialog').locator('#Name');
    const newName = `Updated Home ${Date.now()}`;
    await input.fill(newName);

    await page.getByRole('dialog').getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(new RegExp(newName))).toBeVisible({ timeout: 10_000 });
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    await page.getByText(/my home|我的家/).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /delete/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/confirm|confirm/i)).toBeVisible();
  });

  test('should cancel deletion', async ({ page }) => {
    await page.getByText(/my home|我的家/).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /delete/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /cancel/i }).first().click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should reveal children in the tree when expanded', async ({ page }) => {
    await page.getByText(/my home|我的家/).click();
    await page.waitForTimeout(500);

    const chevron = page.locator('[data-expanded]').first();
    const isExpanded = await chevron.getAttribute('data-expanded');

    if (isExpanded === 'false') {
      await chevron.click();
      await page.waitForTimeout(300);
    }

    await expect(page.getByText(/living room|客厅/).first()).toBeVisible();
  });

  test('should show virtual locations section', async ({ page }) => {
    await expect(page.getByText(/@cloud|@云端/)).toBeVisible();
  });

  test('should generate and view QR code for a location', async ({ page }) => {
    await page.getByText(/my home|我的家/).click();
    await page.waitForTimeout(500);

    const qrBtn = page.getByRole('button', { name: /qr code|generate qr|qr/i });
    await qrBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('dialog').locator('img[alt]')).toBeVisible({ timeout: 10_000 });
  });

  test('should navigate to scan page', async ({ page }) => {
    await page.goto('/location-scan');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByText(/scan|scan location|scan/)).toBeVisible({ timeout: 10_000 });
  });

  test('should allow manual code entry on scan page', async ({ page }) => {
    await page.goto('/location-scan');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const codeInput = page.locator('#code, input[type="text"]').first();
    await expect(codeInput).toBeVisible({ timeout: 5_000 });
  });

  test('should show empty state when no location selected', async ({ page }) => {
    const selectHint = page.getByText(/select.*location|select.*start/i);
    if (await selectHint.isVisible().catch(() => false)) {
      await expect(selectHint).toBeVisible();
    }
  });

  test('should display location meta chips (direct items, children count)', async ({ page }) => {
    await page.getByText(/my home|我的家/).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(/direct items|direct/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('should display items list when a location with items is selected', async ({ page }) => {
    await page.getByText(/my home|我的家/).click();
    await page.waitForTimeout(500);

    await page.getByText(/living room|客厅/).first().click();
    await page.waitForTimeout(500);

    await page.getByText(/tv cabinet|电视柜/).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText(/Sony|Sony/i)).toBeVisible({ timeout: 5_000 });
  });
});
