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

test.describe('Loan & abnormal linkage', () => {
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

  test('a lost loan lands in the abnormal module and on the item event log', async ({ page }) => {
    const unique = Date.now().toString(36);
    const itemName = `搜测借出遗失${unique}`;
    const location = await expectJson<{ id: string }>(
      api.post('locations/', { headers, data: { name: `搜测借出位${unique}` } }),
    );
    const item = await expectJson<{ id: string }>(
      api.post('items/', {
        headers,
        data: { name: itemName, type: 'durable', location_id: location.id },
      }),
    );
    const loan = await expectJson<{ id: string }>(
      api.post(`items/${item.id}/loans`, {
        headers,
        data: {
          borrower_name: '搜测老李',
          due_at: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        },
      }),
    );
    const unreturned = await api.post(`loans/${loan.id}/unreturned`, {
      headers,
      data: { compensation: 200, compensation_currency: 'CNY', notes: '对方遗失' },
    });
    expect(unreturned.ok()).toBeTruthy();

    await loginAsDemo(page);

    // The item appears in the abnormal module as "Lent & Lost".
    await page.goto('/abnormal');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(itemName).first()).toBeVisible();
    await expect(page.getByText('Lent & Lost').first()).toBeVisible();

    // The liability settlement stays on the item's permanent event log.
    await page.goto(`/items/${item.id}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Event Log').first()).toBeVisible();
    await expect(page.getByText('Loan Lost & Unreturned').first()).toBeVisible();
  });
});
