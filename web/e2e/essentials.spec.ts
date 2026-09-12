import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { loginAsDemo } from './helpers';

const BACKEND_PORT = Number(process.env.HAVIT_E2E_BACKEND_PORT ?? 3300);
const API_BASE_URL = `http://localhost:${BACKEND_PORT}/api/v1/`;

// Demo seed fixtures (internal/db/seeds/demo-seed.sql).
const SEED_ESSENTIALS_ID = '01DEMO000ITEM000003';
const SEED_HOME_ID = '01DEMO000LOC0000001';

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

test.describe('Essentials tabs', () => {
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

  async function openEssentials(page: Page) {
    await loginAsDemo(page);
    await page.goto('/essentials');
    await page.waitForLoadState('networkidle');
  }

  test('departure checklist marks items carried in bulk', async ({ page }) => {
    await openEssentials(page);

    await page.getByRole('tab', { name: 'Departure List' }).click();
    const row = page.getByRole('row', { name: /AirPods Pro 2/ });
    await expect(row).toBeVisible();
    await expect(page.getByText('0 / 1 ready')).toBeVisible();

    await row.getByRole('checkbox', { name: 'AirPods Pro 2' }).click();
    await expect(page.getByText('1 selected')).toBeVisible();

    await page.getByRole('button', { name: 'Mark as Carry' }).click();
    await expect(page.getByText("I've Got All")).toBeVisible();
    await expect(page.getByText('1 / 1 ready')).toBeVisible();

    // The carried item must surface on the main ledger and in the stats.
    await page.getByRole('tab', { name: 'My Essentials' }).click();
    await expect(page.getByRole('row', { name: /AirPods Pro 2/ })).toContainText('Carry');
    await expect(page.getByText('100%', { exact: true })).toBeVisible();
  });

  test('return log lists status changes and filters by type', async ({ page }) => {
    await openEssentials(page);

    await page.getByRole('tab', { name: 'Return Log' }).click();
    const firstEvent = page.getByRole('row', { name: /AirPods Pro 2/ }).first();
    await expect(firstEvent).toBeVisible();
    await expect(firstEvent).toContainText('Status changed');
    await expect(firstEvent).toContainText('Carry');

    // No item has returned home yet, so the filtered ledger is empty.
    await page.getByRole('combobox', { name: 'Event type' }).click();
    await page.getByRole('option', { name: 'Returned home' }).click();
    await expect(page.getByText('No return history yet')).toBeVisible();

    await page.getByRole('combobox', { name: 'Event type' }).click();
    await page.getByRole('option', { name: 'All types' }).click();
    await expect(page.getByText('Status changed').first()).toBeVisible();
  });

  test('return all closes the loop and lands in the return log', async ({ page }) => {
    // Make the test self-sufficient: carry the item, then give it a home base
    // so "Return All" has both a reason and a target.
    const marked = await expectJson<{ updated: number }>(
      api.post('items/essentials/bulk-status', {
        headers,
        data: { ids: [SEED_ESSENTIALS_ID], current_status_tag: 'carry' },
      }),
    );
    expect(marked.updated).toBe(1);
    const patched = await api.patch(`items/${SEED_ESSENTIALS_ID}`, {
      headers,
      data: { home_base_location_id: SEED_HOME_ID },
    });
    expect(patched.ok()).toBeTruthy();

    await openEssentials(page);
    await page.getByRole('button', { name: 'Return All', exact: true }).click();

    await expect(page.getByRole('row', { name: /AirPods Pro 2/ })).toContainText('Home Base');

    await page.getByRole('tab', { name: 'Return Log' }).click();
    const returnEvent = page.getByRole('row', { name: /AirPods Pro 2/ }).first();
    await expect(returnEvent).toContainText('Returned home');
    await expect(returnEvent).toContainText('Carry →');
  });

  test('dynamic node management creates, renames and deletes nodes', async ({ page }) => {
    await openEssentials(page);

    await page.getByRole('tab', { name: 'Dynamic Node Mgmt' }).click();

    // The seeded @随身 node picks up the carried item through tag mapping.
    const seedNode = page.getByRole('row', { name: /@随身/ });
    await expect(seedNode).toBeVisible();

    await page.getByRole('button', { name: 'New node' }).click();
    await page.getByRole('textbox', { name: 'Node name' }).fill('E2E 出差');
    await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
    const created = page.getByRole('row', { name: /@E2E 出差/ });
    await expect(created).toBeVisible();
    await expect(created).toContainText('0 items');

    // Rename through the row action menu.
    await created.getByRole('button', { name: 'Action' }).click();
    await page.getByRole('button', { name: 'Rename node' }).click();
    await page.getByRole('textbox', { name: 'Node name' }).fill('@E2E 出差包');
    await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
    const renamed = page.getByRole('row', { name: /@E2E 出差包/ });
    await expect(renamed).toBeVisible();

    // Delete with the browser confirm dialog.
    page.on('dialog', (dialog) => dialog.accept());
    await renamed.getByRole('button', { name: 'Action' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByRole('row', { name: /@E2E 出差包/ })).toHaveCount(0);
    await expect(page.getByText('Node deleted')).toBeVisible();
  });

  test('essentials events endpoint returns the ledger with payloads', async () => {
    const marked = await expectJson<{ updated: number }>(
      api.post('items/essentials/bulk-status', {
        headers,
        data: { ids: [SEED_ESSENTIALS_ID], current_status_tag: 'travel_bag' },
      }),
    );
    expect(marked.updated).toBe(1);

    const events = await expectJson<{ events: Array<{
      id: string;
      item_name: string;
      event_type: string;
      payload?: string;
    }>; total: number }>(
      api.get('items/essentials/events', { headers }),
    );
    expect(events.total).toBeGreaterThanOrEqual(2);

    const statusChange = events.events.find(
      (event) => event.event_type === 'essentials_status_changed' && event.payload?.includes('travel_bag'),
    );
    expect(statusChange).toBeTruthy();
    expect(statusChange?.item_name).toBe('AirPods Pro 2');
    const payload = JSON.parse(statusChange?.payload ?? '{}') as {
      from?: { tag?: string | null };
      to?: { tag?: string | null };
    };
    expect(payload.to?.tag).toBe('travel_bag');

    const returns = await expectJson<{ total: number }>(
      api.get('items/essentials/events?event_type=essentials_returned_home', { headers }),
    );
    expect(returns.total).toBeGreaterThanOrEqual(1);
  });
});
