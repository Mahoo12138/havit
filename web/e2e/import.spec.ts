import { test, expect, type APIRequestContext, type APIResponse, type Page } from '@playwright/test';
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

async function uploadCsv(page: Page, csv: string, filename: string) {
  await page.locator('input[type="file"]').setInputFiles({
    name: filename,
    mimeType: 'text/csv',
    buffer: Buffer.from(csv, 'utf-8'),
  });
}

async function mapAndPreview(page: Page) {
  await expect(page.getByText('Adjust Column Mapping')).toBeVisible();
  await page.getByRole('button', { name: 'Preview & Confirm' }).click();
  await expect(page.getByText('Import Preview')).toBeVisible();
}

function fieldCombo(page: Page, label: string) {
  return page.locator('label').filter({ hasText: label }).locator('..').getByRole('combobox');
}

test.describe('Batch import', () => {
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

  test('downloads a CSV template', async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/import');
    await page.waitForLoadState('networkidle');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CSV Template' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('havit-import-template.csv');
  });

  test('imports CSV with Chinese headers after auto mapping and preview', async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/import');
    await page.waitForLoadState('networkidle');

    const csv =
      '名称,类型,分类,位置,价格,标签\n批量导入相机,durable,数码电子,我的家/客厅,1299,数码|摄影\n';
    await uploadCsv(page, csv, 'cameras.csv');

    // Mapping step auto-detected the Chinese columns.
    await expect(page.getByText('Adjust Column Mapping')).toBeVisible();
    await expect(fieldCombo(page, 'Name')).toContainText('名称');

    await page.getByRole('button', { name: 'Preview & Confirm' }).click();
    await expect(page.getByText('Import Preview')).toBeVisible();
    await expect(page.getByText('批量导入相机')).toBeVisible();

    await page.getByRole('button', { name: 'Start Import' }).click();
    await expect(page.getByText('Import Result')).toBeVisible();
    await expect(page.getByText('Created 1', { exact: true })).toBeVisible();

    // Verify the row landed with mapped columns and tags.
    const items = await expectJson<{
      items: Array<{ name: string; category: string; tags: Array<{ name: string }> }>;
    }>(api.get('items/?q=批量导入相机', { headers }));
    expect(items.items.length).toBeGreaterThan(0);
    expect(items.items[0].category).toBe('数码电子');
    expect(items.items[0].tags.map((t) => t.name).sort()).toEqual(['摄影', '数码']);
  });

  test('skips duplicates by default and updates when chosen', async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/import');
    await page.waitForLoadState('networkidle');

    const csv = 'name,location,description\n重复测试物品,我的家/客厅,初始描述\n';
    await uploadCsv(page, csv, 'dup.csv');
    await mapAndPreview(page);
    await page.getByRole('button', { name: 'Start Import' }).click();
    await expect(page.getByText('Created 1', { exact: true })).toBeVisible();

    // Same file again: default policy skips the duplicate.
    await uploadCsv(page, csv, 'dup.csv');
    await mapAndPreview(page);
    await expect(page.getByText('Duplicates: 1')).toBeVisible();
    await page.getByRole('button', { name: 'Start Import' }).click();
    await expect(page.getByText('Skipped 1', { exact: true })).toBeVisible();

    // Update policy overwrites non-empty fields.
    const updated = 'name,location,description\n重复测试物品,我的家/客厅,更新后的描述\n';
    await uploadCsv(page, updated, 'dup-update.csv');
    await mapAndPreview(page);
    await pickOption(page, 'Duplicate handling', 'Update (overwrite with non-empty fields)');
    await page.getByRole('button', { name: 'Start Import' }).click();
    await expect(page.getByText('Updated 1', { exact: true })).toBeVisible();

    const items = await expectJson<{ items: Array<{ description: string }> }>(
      api.get('items/?q=重复测试物品', { headers }),
    );
    expect(items.items[0].description).toBe('更新后的描述');
  });

  test('shows failed rows and downloads them for correction', async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/import');
    await page.waitForLoadState('networkidle');

    const csv = [
      'name,type,location',
      ',durable,我的家/客厅',
      '坏行,badtype,我的家/客厅',
      '有效行,durable,我的家/客厅',
    ].join('\n');
    await uploadCsv(page, csv, 'mixed.csv');
    await mapAndPreview(page);
    await expect(page.getByText('Errors: 2')).toBeVisible();

    await page.getByRole('button', { name: 'Start Import' }).click();
    await expect(page.getByText('Import Result')).toBeVisible();
    await expect(page.getByText('Created 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Failed 2', { exact: true })).toBeVisible();
    await expect(page.getByText('name required')).toBeVisible();
    await expect(page.getByText('invalid type: badtype')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Failed Rows' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('havit-import-failures.csv');
  });
});
