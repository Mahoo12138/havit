import { test, expect, type APIRequestContext } from '@playwright/test';
import { loginAsDemo } from './helpers';

const BACKEND_PORT = Number(process.env.HAVIT_E2E_BACKEND_PORT ?? 3300);
const API_BASE_URL = `http://localhost:${BACKEND_PORT}/api/v1/`;

// 1x1 transparent PNG used to exercise the avatar upload pipeline.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

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

test.describe('Account settings', () => {
  let api: APIRequestContext;
  let headers: { Authorization: string };

  test.beforeAll(async ({ playwright }) => {
    api = await playwright.request.newContext({ baseURL: API_BASE_URL });
    headers = { Authorization: `Bearer ${await login(api)}` };
  });

  test.afterAll(async () => {
    // The demo data dir is shared with the other specs.
    await api.patch('auth/me', {
      headers,
      data: { nickname: '', email: '', bio: '', avatar: '' },
    });
    await api.dispose();
  });

  test('the account card opens the profile dialog and the edits persist', async ({ page }) => {
    await loginAsDemo(page);

    await page.getByLabel('Account menu').click();
    await page.getByRole('link', { name: 'Account settings' }).click();
    await expect(page).toHaveURL(/\/settings\?tab=account&panel=profile/);

    await page.getByRole('button', { name: 'Edit' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Username')).toBeDisabled();

    const nickname = 'Demo Owner';
    await dialog.getByLabel('Nickname').fill(nickname);
    await dialog.getByLabel('Email (optional)').fill('owner@demo.local');
    await dialog.getByLabel('Description').fill('Keeper of the ledger');
    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    await expect(dialog.locator('img')).toBeVisible();

    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Profile saved')).toBeVisible();
    await expect(page.getByText(nickname)).toBeVisible();

    const me = (await (await api.get('auth/me', { headers })).json()) as {
      nickname: string;
      email: string;
      bio: string;
      avatar: string;
    };
    expect(me.nickname).toBe(nickname);
    expect(me.email).toBe('owner@demo.local');
    expect(me.bio).toBe('Keeper of the ledger');
    expect(me.avatar.startsWith('data:image/jpeg;base64,')).toBeTruthy();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Account menu').click();
    await expect(page.getByRole('dialog').getByText(nickname)).toBeVisible();
  });

  test('the mobile avatar drawer opens account settings', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsDemo(page);

    await page.getByLabel('Toggle navigation').click();
    await page.getByRole('link', { name: 'Account settings' }).click();

    await expect(page).toHaveURL(/\/settings\?tab=account&panel=profile/);
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
  });

  test('the password dialog is read-only in demo mode', async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/settings?tab=account&panel=profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Change password' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Password changes are disabled in demo mode.')).toBeVisible();
    await expect(dialog.getByLabel('Current password')).toBeDisabled();
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
