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

test.describe('Supplies & reminder linkage', () => {
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

  test('using the last spare creates a low-stock reminder and surfaces in the restock list', async ({ page }) => {
    const unique = Date.now().toString(36);
    const itemName = `搜测滤芯${unique}`;
    const location = await expectJson<{ id: string }>(
      api.post('locations/', { headers, data: { name: `搜测耗材位${unique}` } }),
    );
    const item = await expectJson<{ id: string }>(
      api.post('items/', {
        headers,
        data: {
          name: itemName,
          type: 'tracked_spares',
          location_id: location.id,
          current_stock: 1,
          min_stock_threshold: 1,
        },
      }),
    );

    await loginAsDemo(page);
    await page.goto(`/supplies/${item.id}`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Use One' }).first().click();
    await expect(page.getByText('Stock updated')).toBeVisible();

    // The low-stock reminder is due and pending, so it flows into the notify loop.
    const token = await page.evaluate(() => localStorage.getItem('havit_token'));
    const remindersResponse = await page.request.get(`/api/v1/reminders?due_only=true`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(remindersResponse.ok()).toBeTruthy();
    const remindersBody = (await remindersResponse.json()) as {
      reminders: Array<{ item_id: string; type: string; sent_at?: number; is_dismissed: boolean }>;
    };
    const lowStock = remindersBody.reminders.find(
      (reminder) => reminder.item_id === item.id && reminder.type === 'stock_low',
    );
    expect(lowStock).toBeTruthy();

    // The item shows up in the restock checklist on the supplies page.
    await page.goto('/supplies');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Restock Checklist/)).toBeVisible();
    await expect(page.getByText(itemName).first()).toBeVisible();
  });
});
