import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
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

async function pickOption(page: Page, label: string, option: string) {
  // Radix Select triggers do not expose their label as an accessible name
  // here, so resolve the combobox through the label's field container.
  const combo = page.locator('label').filter({ hasText: label }).locator('..').getByRole('combobox');
  await combo.click();
  await page.getByRole('option', { name: option }).click();
}

test.describe('Settings page', () => {
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

  test('a preference change auto-saves and persists', async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/settings?tab=preferences&panel=behavior');
    await page.waitForLoadState('networkidle');

    const archivedFlag = async () => {
      const prefs = await expectJson<{ show_archived_in_search: boolean }>(
        api.get('preferences', { headers }),
      );
      return prefs.show_archived_in_search;
    };

    await pickOption(page, 'Show archived items in search', 'Yes');
    await expect(page.getByText('Saved')).toBeVisible();
    await expect.poll(archivedFlag).toBe(true);

    // Revert so the shared e2e data dir stays clean for the search spec.
    await pickOption(page, 'Show archived items in search', 'No');
    await expect.poll(archivedFlag).toBe(false);
  });

  test('a system config change auto-saves and persists', async ({ page }) => {
    const configs = await expectJson<{
      configs: Array<{ key: string; value: string }>;
    }>(api.get('system/configs', { headers }));
    const webp = configs.configs.find((c) => c.key === 'storage.webp_quality');
    expect(webp).toBeTruthy();
    const original = webp!.value;
    const changed = original === '80' ? '75' : '80';

    await loginAsDemo(page);
    await page.goto('/settings?tab=system&panel=infra');
    await page.waitForLoadState('networkidle');

    const field = page.getByLabel('WebP quality (1–100)');
    await field.fill(changed);
    await expect(page.getByText('Saved')).toBeVisible();

    const after = await expectJson<{ configs: Array<{ key: string; value: string }> }>(
      api.get('system/configs', { headers }),
    );
    expect(after.configs.find((c) => c.key === 'storage.webp_quality')?.value).toBe(changed);

    // Restore the original value.
    await field.fill(original);
    await expect(page.getByText('Saved')).toBeVisible();
    const restored = await expectJson<{ configs: Array<{ key: string; value: string }> }>(
      api.get('system/configs', { headers }),
    );
    expect(restored.configs.find((c) => c.key === 'storage.webp_quality')?.value).toBe(original);
  });

  test('owner adds and removes a member from the UI', async ({ page }) => {
    const username = `member${Date.now().toString(36)}@havit.local`;

    await loginAsDemo(page);
    await page.goto('/settings?tab=members');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Add Member' }).click();
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill('member-secret');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText(username, { exact: true })).toBeVisible();

    // The new member can actually log in.
    const memberLogin = await api.post('auth/login', {
      data: { username, password: 'member-secret' },
    });
    expect(memberLogin.ok()).toBeTruthy();

    // Remove the member again from the UI.
    const memberRow = page.getByText(username, { exact: true }).locator('..').locator('..');
    await memberRow.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText(username, { exact: true })).not.toBeVisible();

    // And their login no longer works.
    const goneLogin = await api.post('auth/login', {
      data: { username, password: 'member-secret' },
    });
    expect(goneLogin.ok()).toBeFalsy();
  });
});
