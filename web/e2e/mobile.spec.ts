import { test, expect, type APIRequestContext, type APIResponse, type Page } from '@playwright/test';
import { loginAsDemo } from './helpers';

const BACKEND_PORT = Number(process.env.HAVIT_E2E_BACKEND_PORT ?? 3300);
const API_BASE_URL = `http://localhost:${BACKEND_PORT}/api/v1/`;

// Matches the viewport used by the existing mobile search E2E.
const MOBILE_VIEWPORT = { width: 390, height: 844 };

async function login(request: APIRequestContext) {
  const response = await request.post('auth/login', {
    data: {
      username: 'admin@havit.local',
      password: 'havit-demo',
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.token as string;
}

async function expectJson<T>(responsePromise: Promise<APIResponse>) {
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as T;
}

// The MobileShell bottom navigation is the only <nav> on top-level pages.
const bottomNavLink = (page: Page, name: string) =>
  page.locator('nav').getByRole('link', { name });

test.describe('Mobile four main chains', () => {
  let api: APIRequestContext;
  let headers: { Authorization: string };
  let spareId: string;

  test.beforeAll(async ({ playwright }) => {
    api = await playwright.request.newContext({ baseURL: API_BASE_URL });
    const token = await login(api);
    headers = { Authorization: `Bearer ${token}` };

    const unique = Date.now().toString(36);
    const location = await expectJson<{ id: string }>(
      api.post('locations/', { headers, data: { name: `搜测移动位${unique}` } }),
    );
    const spare = await expectJson<{ id: string }>(
      api.post('items/', {
        headers,
        data: {
          name: `搜测移动备件${unique}`,
          type: 'tracked_spares',
          location_id: location.id,
          current_stock: 1,
          min_stock_threshold: 1,
        },
      }),
    );
    spareId = spare.id;
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test('mobile shell shows bottom navigation and links across the main pages', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await loginAsDemo(page);

    await expect(bottomNavLink(page, 'Dashboard')).toBeVisible();
    await expect(bottomNavLink(page, 'Asset Ledger')).toBeVisible();
    await expect(bottomNavLink(page, 'Locations')).toBeVisible();

    await bottomNavLink(page, 'Locations').click();
    await expect(page.getByRole('heading', { name: 'Locations' })).toBeVisible();

    await bottomNavLink(page, 'Asset Ledger').click();
    await expect(page.getByRole('heading', { name: 'Asset Ledger' })).toBeVisible();
  });

  test('asset ledger lists items and opens the item detail on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await loginAsDemo(page);
    await page.goto('/assets');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Total Assets').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Sony A7M4 相机机身/ })).toBeVisible();

    await page.getByRole('link', { name: /Sony A7M4 相机机身/ }).click();
    await page.waitForURL(/\/items\/\w+/);

    await expect(page.getByRole('heading', { name: 'Sony A7M4 相机机身' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Locations' })).toHaveCount(0);

    await expect(page.getByText('Current Location')).toBeVisible();
    await expect(page.getByText('我的家 → 客厅 → 电视柜').first()).toBeVisible();
    await expect(page.getByText('Event Log').first()).toBeVisible();
    await expect(page.getByText('Loan History').first()).toBeVisible();

    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(/\/assets/);
  });

  test('asset search filters the card list on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await loginAsDemo(page);
    await page.goto('/assets');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/Search items/);

    await searchInput.fill('50mm');
    await expect(page.getByRole('link', { name: /Sony 50mm/ })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /Sony A7M4/ })).toHaveCount(0);

    await searchInput.fill('zzz-no-match');
    await expect(page.getByText('No assets found. Add one to get started.')).toBeVisible({ timeout: 10_000 });

    await searchInput.fill('');
    await expect(page.getByRole('link', { name: /Sony A7M4/ })).toBeVisible({ timeout: 10_000 });
  });

  test('asset creation opens from the mobile primary action', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await loginAsDemo(page);
    await page.goto('/assets');
    await page.waitForLoadState('networkidle');

    // The bottom-nav + button dispatches the mobile primary action on /assets.
    await page.locator('nav').getByRole('button', { name: 'Smart Capture' }).click();
    await expect(page.getByRole('heading', { name: 'New Asset' })).toBeVisible();

    const itemName = `搜测移动资产${Date.now().toString(36)}`;
    await page.locator('#Name').fill(itemName);
    await page.getByRole('button', { name: 'Open location picker' }).click();
    await page.getByRole('treeitem', { name: '客厅' }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(page.getByRole('link', { name: new RegExp(itemName) })).toBeVisible({ timeout: 10_000 });
  });

  test('location drill-down, breadcrumb and direct items on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await loginAsDemo(page);
    await page.goto('/locations');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Location Tree').first()).toBeVisible();
    await expect(page.getByText('我的家', { exact: true })).toBeVisible();

    await page.getByText('我的家', { exact: true }).click();
    await expect(page.getByText('客厅', { exact: true }).first()).toBeVisible();

    await page.getByText('客厅', { exact: true }).first().click();
    await expect(page.getByText('埃塞俄比亚咖啡豆').first()).toBeVisible();
    await expect(page.getByText('净水器滤芯').first()).toBeVisible();
    await expect(page.getByText('电视柜', { exact: true }).first()).toBeVisible();

    await page.getByText('电视柜', { exact: true }).first().click();
    await expect(page.getByText('我的家', { exact: true })).toBeVisible();
    await expect(page.getByText('客厅', { exact: true })).toBeVisible();
    await expect(page.getByText('Sony A7M4 相机机身').first()).toBeVisible();
  });

  test('location creation opens from the top-bar primary action on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await loginAsDemo(page);
    await page.goto('/locations');
    await page.waitForLoadState('networkidle');

    // The consolidated mobile add entry: the top-bar "+" dispatches a primary
    // action that /locations handles by opening the create-location dialog.
    await page.getByRole('banner').getByRole('button', { name: 'Smart Capture' }).click();
    await expect(page.getByRole('heading', { name: 'Add Root' })).toBeVisible();

    const locationName = `搜测移动位置${Date.now().toString(36)}`;
    await page.locator('#Name').fill(locationName);
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(page.getByText(locationName, { exact: true }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('supplies overview, tabs and restock list on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await loginAsDemo(page);
    await page.goto('/supplies');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Total Supplies').first()).toBeVisible();
    await expect(page.getByText('埃塞俄比亚咖啡豆').first()).toBeVisible();
    await expect(page.getByText('净水器滤芯').first()).toBeVisible();

    await page.getByRole('tab', { name: 'Tracked Spares' }).click();
    await expect(page.getByText('净水器滤芯').first()).toBeVisible();
    await expect(page.getByText('埃塞俄比亚咖啡豆')).toHaveCount(0);

    await page.getByRole('tab', { name: 'Restock List' }).click();
    await expect(page.getByText('净水器滤芯').first()).toBeVisible();
  });

  test('consumable detail supports use-one on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await loginAsDemo(page);
    await page.goto(`/supplies/${spareId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Locations' })).toHaveCount(0);

    await expect(page.getByText('Current Stock')).toBeVisible();
    await expect(page.getByText('1 pieces')).toBeVisible();
    await expect(page.getByText('Min Stock Threshold')).toBeVisible();

    await page.getByRole('button', { name: 'Use One' }).click();
    await expect(page.getByText('0 pieces')).toBeVisible({ timeout: 10_000 });
  });
});
