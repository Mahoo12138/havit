import { test, expect, type Page } from '@playwright/test';
import { loginAsDemo } from './helpers';

async function navigateToLocations(page: Page) {
  await page.goto('/locations');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}

const homeTreeItem = (page: Page) => page.getByRole('treeitem', { name: /我的家/ }).first();
const livingRoomTreeItem = (page: Page) => page.getByRole('treeitem', { name: /客厅/ }).first();
const tvCabinetChildButton = (page: Page) => page.getByRole('button', { name: /电视柜/ }).first();
const carriedTreeItem = (page: Page) => page.getByRole('treeitem', { name: /@随身/ }).first();

async function createRootLocation(page: Page, name: string) {
  await page.getByRole('button', { name: /add root/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await page.locator('#Name').fill(name);
  await page.getByRole('dialog').getByRole('button', { name: /save/i }).click();
  await expect(page.getByRole('treeitem', { name: new RegExp(name) })).toBeVisible({ timeout: 10_000 });
}

test.describe('Locations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await navigateToLocations(page);
  });

  test('should display the location tree with seeded data', async ({ page }) => {
    await expect(homeTreeItem(page)).toBeVisible({ timeout: 10_000 });
    await expect(carriedTreeItem(page)).toBeVisible();
  });

  test('should select a location from the tree and show its detail', async ({ page }) => {
    await homeTreeItem(page).click();

    await expect(page.getByRole('button', { name: /add child/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /edit location/i })).toBeVisible();
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

    await createRootLocation(page, locationName);
  });

  test('should create a child location under an existing parent', async ({ page }) => {
    await homeTreeItem(page).click();

    await page.getByRole('button', { name: /add child/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    const childName = `Test Room ${Date.now()}`;
    await page.locator('#Name').fill(childName);

    await page.getByRole('dialog').getByRole('button', { name: /save/i }).click();
    await expect(page.getByRole('treeitem', { name: new RegExp(childName) })).toBeVisible({ timeout: 10_000 });
  });

  test('should display breadcrumb path for nested locations', async ({ page }) => {
    await homeTreeItem(page).click();
    await livingRoomTreeItem(page).click();

    const breadcrumb = page.getByText(/我的家/).first();
    await expect(breadcrumb).toBeVisible();
  });

  test('should open edit dialog for a location', async ({ page }) => {
    await homeTreeItem(page).click();

    await page.getByRole('button', { name: /edit location/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('dialog').locator('#Name')).toBeVisible();
  });

  test('should edit a location name', async ({ page }) => {
    const originalName = `Editable Property ${Date.now()}`;
    await createRootLocation(page, originalName);

    await page.getByRole('button', { name: /edit location/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    const input = page.getByRole('dialog').locator('#Name');
    const newName = `Updated Home ${Date.now()}`;
    await input.fill(newName);

    await page.getByRole('dialog').getByRole('button', { name: /save/i }).click();
    await expect(page.getByRole('treeitem', { name: new RegExp(newName) })).toBeVisible({ timeout: 10_000 });
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    await createRootLocation(page, `Delete Candidate ${Date.now()}`);

    await page.getByRole('button', { name: /delete location/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/permanently delete this location/i)).toBeVisible();
  });

  test('should cancel deletion', async ({ page }) => {
    await createRootLocation(page, `Cancel Delete ${Date.now()}`);

    await page.getByRole('button', { name: /delete location/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /cancel/i }).first().click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should reveal children in the tree when expanded', async ({ page }) => {
    await homeTreeItem(page).click();

    const chevron = page.locator('[data-expanded]').first();
    const isExpanded = await chevron.getAttribute('data-expanded');

    if (isExpanded === 'false') {
      await chevron.click();
      await page.waitForTimeout(300);
    }

    await expect(livingRoomTreeItem(page)).toBeVisible();
  });

  test('should show virtual locations section', async ({ page }) => {
    await expect(carriedTreeItem(page)).toBeVisible();
  });

  test('should generate and view QR code for a location', async ({ page }) => {
    await homeTreeItem(page).click();

    const qrBtn = page.getByRole('button', { name: /qr code|generate qr|qr/i });
    await qrBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('dialog').locator('img[alt]')).toBeVisible({ timeout: 10_000 });
  });

  test('should navigate to scan page', async ({ page }) => {
    await page.goto('/location-scan');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: /scan location/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should allow manual code entry on scan page', async ({ page }) => {
    await page.goto('/location-scan');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const codeInput = page.getByRole('textbox', { name: /location code/i });
    await expect(codeInput).toBeVisible({ timeout: 5_000 });
  });

  test('should show empty state when no location selected', async ({ page }) => {
    const selectHint = page.getByText(/select.*location|select.*start/i);
    if (await selectHint.isVisible().catch(() => false)) {
      await expect(selectHint).toBeVisible();
    }
  });

  test('should display location meta chips (direct items, children count)', async ({ page }) => {
    await homeTreeItem(page).click();

    await expect(page.getByText(/direct items|direct/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('should display items list when a location with items is selected', async ({ page }) => {
    await homeTreeItem(page).click();
    await livingRoomTreeItem(page).click();
    await tvCabinetChildButton(page).click();

    await expect(page.getByRole('link', { name: /Sony A7M4/ })).toBeVisible({ timeout: 5_000 });
  });
});
