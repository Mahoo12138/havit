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

test.describe('Lending page', () => {
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

  async function createLendedItem(unique: string, name: string, category?: string) {
    const location = await expectJson<{ id: string }>(
      api.post('locations/', { headers, data: { name: `搜测借出位${unique}` } }),
    );
    return expectJson<{ id: string; name: string }>(
      api.post('items/', {
        headers,
        data: { name, type: 'durable', category, location_id: location.id },
      }),
    );
  }

  async function createLoan(itemId: string, borrower: string, dueInSeconds?: number) {
    return expectJson<{ id: string }>(
      api.post(`items/${itemId}/loans`, {
        headers,
        data: {
          borrower_name: borrower,
          ...(dueInSeconds ? { due_at: Math.floor(Date.now() / 1000) + dueInSeconds } : {}),
        },
      }),
    );
  }

  async function openLoans(page: Page) {
    await loginAsDemo(page);
    await page.goto('/loans');
    await page.waitForLoadState('networkidle');
  }

  test('tabs and filter bar narrow the loan records', async ({ page }) => {
    const unique = Date.now().toString(36);
    const category = `搜测分类${unique}`;
    const activeName = `搜测在借${unique}`;
    const returnedName = `搜测已还${unique}`;
    const itemActive = await createLendedItem(unique, activeName, category);
    await createLoan(itemActive.id, '搜测阿珍', 7 * 24 * 3600);
    const itemReturned = await createLendedItem(unique, returnedName);
    const loanReturned = await createLoan(itemReturned.id, '搜测阿珍');
    await api.post(`loans/${loanReturned.id}/return`, { headers, data: {} });

    // GET /loans is the one-shot list feeding tabs, metrics and the reminder.
    const list = await expectJson<{ loans: Array<{ item_id: string; item_name?: string }> }>(
      api.get('loans', { headers }),
    );
    const listed = list.loans.find((loan) => loan.item_id === itemActive.id);
    expect(listed?.item_name).toBe(activeName);

    await openLoans(page);

    // On Loan (default tab): the seeded past-due loan stays DB-active, plus the new one.
    await expect(page.getByRole('tab', { name: 'On Loan' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('row', { name: new RegExp(activeName) })).toBeVisible();
    const seededRow = page.getByRole('row', { name: /Sony 50mm F1\.2 镜头/ });
    await expect(seededRow).toBeVisible();
    await expect(seededRow).toContainText(/Overdue \d+ days/);
    await expect(page.getByRole('row', { name: new RegExp(returnedName) })).toBeHidden();
    await expect(page.getByText('2 items')).toBeVisible();

    // Returned tab: only returned records, and their actions are view-only.
    await page.getByRole('tab', { name: 'Returned' }).click();
    const returnedRow = page.getByRole('row', { name: new RegExp(returnedName) });
    await expect(returnedRow).toBeVisible();
    await expect(returnedRow).toContainText('Returned');
    await expect(returnedRow.getByRole('button', { name: 'Return Item' })).toHaveCount(0);
    await expect(seededRow).toBeHidden();

    // Overdue tab: only derived-overdue records.
    await page.getByRole('tab', { name: 'Overdue' }).click();
    await expect(seededRow).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(activeName) })).toBeHidden();

    // All Records: seeded + the two new ones.
    await page.getByRole('tab', { name: 'All Records' }).click();
    await expect(page.getByRole('row', { name: new RegExp(activeName) })).toBeVisible();
    await expect(returnedRow).toBeVisible();

    // Category filter narrows rows; Clear Filters restores them.
    await page.getByRole('tab', { name: 'On Loan' }).click();
    await page.getByRole('combobox', { name: 'All Categories' }).click();
    await page.getByRole('option', { name: category }).click();
    await expect(page.getByRole('row', { name: new RegExp(activeName) })).toBeVisible();
    await expect(seededRow).toBeHidden();
    await page.getByRole('button', { name: 'Clear Filters' }).click();
    await expect(seededRow).toBeVisible();

    // Borrower filter narrows rows too.
    await page.getByRole('combobox', { name: 'Borrower' }).click();
    await page.getByRole('option', { name: '小王' }).click();
    await expect(seededRow).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(activeName) })).toBeHidden();
  });

  test('overdue reminder lists overdue loans and jumps to the overdue tab', async ({ page }) => {
    await openLoans(page);

    await expect(page.getByRole('heading', { name: 'Overdue Reminder' })).toBeVisible();
    // The reminder entry links the item and names the borrower with days overdue.
    await expect(page.getByRole('link', { name: /Sony 50mm F1\.2 镜头/ })).toBeVisible();
    await expect(page.getByText('Borrower: 小王')).toBeVisible();
    await expect(page.getByText(/Overdue \d+ days/).first()).toBeVisible();

    await page.getByRole('button', { name: 'View All Overdue' }).click();
    await expect(page.getByRole('tab', { name: 'Overdue' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('row', { name: /Sony 50mm F1\.2 镜头/ })).toBeVisible();
  });

  test('return item from the action column', async ({ page }) => {
    const unique = Date.now().toString(36);
    const borrower = `搜测还物${unique}`;
    const item = await createLendedItem(unique, `搜测归还${unique}`);
    await createLoan(item.id, borrower, 7 * 24 * 3600);

    await openLoans(page);
    const row = page.getByRole('row', { name: new RegExp(borrower) });
    await expect(row).toBeVisible();

    await row.getByRole('button', { name: 'Return Item' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Return Item' }).click();

    await expect(dialog).toBeHidden();
    await expect(row).toBeHidden();

    await page.getByRole('tab', { name: 'Returned' }).click();
    await expect(page.getByRole('row', { name: new RegExp(borrower) })).toBeVisible();
  });

  test('register a loan by picking an in-stock item', async ({ page }) => {
    const unique = Date.now().toString(36);
    const itemName = `搜测新借${unique}`;
    await createLendedItem(unique, itemName);

    await openLoans(page);
    await page.getByRole('button', { name: 'New Loan' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('combobox', { name: 'Item' }).click();
    await page.getByRole('option', { name: itemName }).click();
    await dialog.getByRole('textbox', { name: 'Borrower Name' }).fill('搜测阿伟');
    await dialog.getByRole('button', { name: 'Register Loan' }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByRole('row', { name: new RegExp(itemName) })).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp('搜测阿伟') })).toBeVisible();
  });
});
