import { test, expect, type Page } from '@playwright/test';
import { loginAsDemo } from './helpers';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
);

async function openCapture(page: Page) {
  await loginAsDemo(page);
  await page.goto('/capture');
  await page.waitForLoadState('networkidle');
}

async function selectLivingRoom(page: Page) {
  await page.getByRole('button', { name: 'Open location picker' }).click();
  await page.getByRole('treeitem', { name: /客厅/ }).click();
}

async function saveCapture(page: Page, name: string) {
  await expect(page.getByRole('heading', { name: 'Confirm & Save' })).toBeVisible();
  await page.getByLabel('Name').fill(name);
  await selectLivingRoom(page);
  await expect(page.getByRole('button', { name: 'Save Item' })).toBeEnabled();
  const createResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/items/') &&
    response.request().method() === 'POST' &&
    response.status() === 201,
  );
  await page.getByRole('button', { name: 'Save Item' }).click();
  const item = await (await createResponse).json() as { id: string };
  await page.waitForURL('/assets');
  await expect(page.getByRole('link', { name })).toBeVisible();
  return item;
}

test.describe('Capture quick entry', () => {
  test('shows the smart capture workflow with photo, barcode, and manual confirm sections', async ({ page }) => {
    await openCapture(page);

    await expect(page.getByRole('button', { name: 'Recognize Photo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload File' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recognized files' })).toBeVisible();
    await expect(page.getByText('No files recognized yet.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Barcode Entry' })).toBeVisible();
    await expect(page.getByLabel('Barcode', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Query Barcode' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open Camera to Scan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Confirm & Save' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Item' })).toBeDisabled();
    await expect(page.getByRole('heading', { name: 'Recent captures' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Start manual entry' })).toHaveCount(0);
  });

  test('opens manual confirmation when AI draft falls back and saves the photo-backed item', async ({ page }) => {
    const name = `AI Manual ${Date.now()}`;
    await page.route('**/api/v1/ai/recognize-photo', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ draft: {}, fallback: 'manual' }),
      });
    });

    await openCapture(page);
    await page.getByTestId('capture-photo-input').setInputFiles([
      {
        name: 'capture-front.png',
        mimeType: 'image/png',
        buffer: PNG_1X1,
      },
      {
        name: 'capture-label.png',
        mimeType: 'image/png',
        buffer: PNG_1X1,
      },
    ]);

    await expect(page.getByText('Recognition is unavailable.')).toBeVisible();
    await expect(page.getByText('capture-front.png')).toBeVisible();
    await expect(page.getByText('capture-label.png')).toBeVisible();
    await expect(page.getByText('2 files queued').first()).toBeVisible();
    await expect(page.getByText('Needs Review').first()).toBeVisible();
    const item = await saveCapture(page, name);
    const token = await page.evaluate(() => localStorage.getItem('havit_token'));
    const attachmentsResponse = await page.request.get(`/api/v1/items/${item.id}/attachments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(attachmentsResponse.ok()).toBeTruthy();
    const attachmentsBody = await attachmentsResponse.json() as {
      attachments: Array<{ content_type: string; is_ai_source: boolean }>;
    };
    expect(attachmentsBody.attachments).toHaveLength(2);
    for (const attachment of attachmentsBody.attachments) {
      expect(attachment).toMatchObject({
        content_type: 'image/png',
        is_ai_source: false,
      });
    }
  });

  test('autofills the draft when a barcode lookup hits and saves the item', async ({ page }) => {
    const name = `Barcode Hit ${Date.now()}`;
    await page.route('**/api/v1/barcode/6901234567890', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          barcode: '6901234567890',
          found: true,
          source: 'open_food_facts',
          draft: { name, category: '零食', description: 'Mock brand / Mock generic' },
        }),
      });
    });

    await openCapture(page);
    await page.getByLabel('Barcode', { exact: true }).fill('6901234567890');
    await page.getByRole('button', { name: 'Query Barcode' }).click();

    await expect(page.getByLabel('Name')).toHaveValue(name);
    await expect(page.getByLabel('Category')).toHaveValue('零食');
    await expect(page.getByLabel('Description')).toHaveValue('Mock brand / Mock generic');
    const item = await saveCapture(page, name);
    const token = await page.evaluate(() => localStorage.getItem('havit_token'));
    const itemResponse = await page.request.get(`/api/v1/items/${item.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(itemResponse.ok()).toBeTruthy();
    const itemBody = await itemResponse.json() as { category?: string; description?: string };
    expect(itemBody).toMatchObject({ category: '零食', description: 'Mock brand / Mock generic' });
  });

  test('falls back to manual entry when a barcode is not found and still saves', async ({ page }) => {
    const name = `Barcode Miss ${Date.now()}`;
    await page.route('**/api/v1/barcode/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ barcode: '0000000000000', found: false, fallback: 'ai_or_manual' }),
      });
    });

    await openCapture(page);
    await page.getByLabel('Barcode', { exact: true }).fill('0000000000000');
    await page.getByRole('button', { name: 'Query Barcode' }).click();

    await expect(page.getByText('Barcode not found. Fill in the details manually or use photo recognition.')).toBeVisible();
    await expect(page.getByLabel('Name')).toHaveValue('');
    await saveCapture(page, name);
  });

  test('falls back to manual entry when the barcode service errors and still saves', async ({ page }) => {
    const name = `Barcode Error ${Date.now()}`;
    await page.route('**/api/v1/barcode/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'internal', message: 'lookup unavailable' }),
      });
    });

    await openCapture(page);
    await page.getByLabel('Barcode', { exact: true }).fill('1234567890128');
    await page.getByRole('button', { name: 'Query Barcode' }).click();

    await expect(page.getByText('Barcode lookup failed. Fill in the details manually or use photo recognition.')).toBeVisible();
    await saveCapture(page, name);
  });

  test('supports the photo quick entry flow on a mobile viewport', async ({ page }) => {
    const name = `Mobile Capture ${Date.now()}`;
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/v1/ai/recognize-photo', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ draft: {}, fallback: 'manual' }),
      });
    });

    await openCapture(page);
    await expect(page.getByRole('main').getByRole('heading', { name: 'Smart Capture' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Recognize Photo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open Camera to Scan' })).toBeVisible();

    await page.getByTestId('capture-photo-input').setInputFiles([
      {
        name: 'mobile-shot.png',
        mimeType: 'image/png',
        buffer: PNG_1X1,
      },
    ]);
    await expect(page.getByText('Recognition is unavailable.')).toBeVisible();
    await expect(page.getByText('Needs Review').first()).toBeVisible();

    const saveButton = page.getByRole('button', { name: 'Save Item' });
    await page.getByLabel('Name').fill(name);
    await selectLivingRoom(page);
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await page.waitForURL('/assets');
    await expect(page.getByRole('link', { name })).toBeVisible();
  });
});
