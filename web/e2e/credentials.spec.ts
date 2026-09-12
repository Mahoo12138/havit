import { test, expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { loginAsDemo } from './helpers';

const BACKEND_PORT = Number(process.env.HAVIT_E2E_BACKEND_PORT ?? 3300);
const API_BASE_URL = `http://localhost:${BACKEND_PORT}/api/v1/`;

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

test.describe('Credentials & warranty closed loop', () => {
  let api: APIRequestContext;
  let headers: { Authorization: string };

  test.beforeAll(async ({ playwright }) => {
    api = await playwright.request.newContext({ baseURL: API_BASE_URL });
    const token = await login(api);
    headers = { Authorization: `Bearer ${token}` };
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test('virtual credentials aggregate API supports the full CRUD round-trip', async () => {
    const unique = Date.now().toString(36);
    const location = await expectJson<{ id: string }>(
      api.post('locations/', { headers, data: { name: `搜测凭证位${unique}` } }),
    );
    const item = await expectJson<{ id: string }>(
      api.post('items/', {
        headers,
        data: { name: `搜测虚拟物品${unique}`, type: 'virtual', location_id: location.id },
      }),
    );

    const created = await expectJson<{ id: string; license_key?: string }>(
      api.post(`items/${item.id}/virtual-credentials`, {
        headers,
        data: { platform: `平台${unique}`, license_key: 'KEY-E2E-0001' },
      }),
    );
    expect(created.license_key).toBe('KEY-E2E-0001');

    // The aggregate list must join the item name (the page's single fetch).
    const list = await expectJson<{ credentials: Array<{ id: string; platform: string; item_name: string }> }>(
      api.get('virtual-credentials', { headers }),
    );
    const found = list.credentials.find((credential) => credential.id === created.id);
    expect(found).toBeTruthy();
    expect(found!.item_name).toBe(`搜测虚拟物品${unique}`);

    // Patching without license_key must keep the stored secret untouched.
    const patched = await expectJson<{ platform: string; license_key?: string }>(
      api.patch(`virtual-credentials/${created.id}`, {
        headers,
        data: { platform: `平台改${unique}`, account: 'e2e@example.com' },
      }),
    );
    expect(patched.platform).toBe(`平台改${unique}`);
    expect(patched.license_key).toBe('KEY-E2E-0001');

    const deleted = await api.delete(`virtual-credentials/${created.id}`, { headers });
    expect(deleted.status()).toBe(204);

    const afterDelete = await expectJson<{ credentials: Array<{ id: string }> }>(
      api.get('virtual-credentials', { headers }),
    );
    expect(afterDelete.credentials.find((credential) => credential.id === created.id)).toBeUndefined();
  });

  test('a credential can be added, edited and deleted from the credentials page', async ({ page }) => {
    test.setTimeout(90_000);
    const unique = Date.now().toString(36);
    const platform = `E2E平台${unique}`;
    const itemName = `搜测凭证物品${unique}`;

    const location = await expectJson<{ id: string }>(
      api.post('locations/', { headers, data: { name: `搜测凭证页位${unique}` } }),
    );
    await expectJson<{ id: string }>(
      api.post('items/', {
        headers,
        data: { name: itemName, type: 'virtual', location_id: location.id },
      }),
    );

    await loginAsDemo(page);
    await page.goto('/credentials');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Virtual Assets' }).click();

    await page.getByRole('button', { name: 'Add Credential' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('combobox', { name: /Virtual Item/ }).click();
    await page.getByRole('option', { name: itemName }).click();
    await dialog.getByLabel('Platform').fill(platform);
    await dialog.getByLabel('Account').fill('e2e@example.com');
    await dialog.getByRole('button', { name: 'Add Credential' }).click();
    await expect(dialog).toBeHidden();

    const card = page.locator('.surface-card .surface-card', { hasText: itemName });
    await expect(card).toBeVisible();
    await expect(card).toContainText(platform);

    // Edit: rename the platform, keep everything else.
    await card.getByRole('button', { name: 'Edit' }).click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel('Platform').fill(`${platform}-改`);
    await editDialog.getByRole('button', { name: 'Save' }).click();
    await expect(editDialog).toBeHidden();
    await expect(page.locator('.surface-card .surface-card', { hasText: `${platform}-改` })).toBeVisible();

    // Delete with confirmation.
    const updatedCard = page.locator('.surface-card .surface-card', { hasText: `${platform}-改` });
    await updatedCard.getByRole('button', { name: 'Delete' }).click();
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: 'Delete' }).click();
    await expect(confirmDialog).toBeHidden();
    await expect(page.locator('.surface-card .surface-card', { hasText: `${platform}-改` })).toBeHidden();
  });

  test('warranty status badge and inline warranty edit form a closed loop', async ({ page }) => {
    test.setTimeout(90_000);
    const unique = Date.now().toString(36);
    const itemName = `搜测保修物品${unique}`;
    const expiresSoon = Math.floor(Date.now() / 1000) + 10 * 24 * 3600;

    const location = await expectJson<{ id: string }>(
      api.post('locations/', { headers, data: { name: `搜测保修位${unique}` } }),
    );
    const item = await expectJson<{ id: string }>(
      api.post('items/', {
        headers,
        data: {
          name: itemName,
          type: 'durable',
          location_id: location.id,
          warranty_expires_at: expiresSoon,
        },
      }),
    );

    await loginAsDemo(page);
    await page.goto('/credentials');
    await page.waitForLoadState('networkidle');

    // The warranty tab is the default tab: the expiring item shows up with a badge.
    const card = page.locator('.surface-card', { hasText: itemName })
      .filter({ has: page.locator('h3') });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Expiring');

    await card.getByRole('button', { name: 'Edit Warranty' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Serial Number').fill('SN-E2E-123456');
    await dialog.getByLabel('Contact').fill('400-123-4567');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden();

    await expect(card).toContainText('SN-E2E-123456');
    const refreshed = await expectJson<{ serial_number?: string; warranty_contact?: string }>(
      api.get(`items/${item.id}`, { headers }),
    );
    expect(refreshed.serial_number).toBe('SN-E2E-123456');
    expect(refreshed.warranty_contact).toBe('400-123-4567');
  });
});
