import { test, expect } from '@playwright/test';
import { loginAsDemo } from './helpers';

test.describe('Login page', () => {
  test('keeps the ledger decorations out of the accessibility tree', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 背景（纸格 / 朱栏 / 纸纤维）与印章标记都是纯装饰，必须对读屏隐藏
    const decorative = page.locator('main.auth-screen [aria-hidden="true"]');
    expect(await decorative.count()).toBeGreaterThanOrEqual(2);

    // 台账抬头：登记行文案 + 当天日期
    await expect(page.getByText(/ledger entry/i)).toBeVisible();

    // 表单本身仍完整可访问
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('submits from the keyboard without any hover', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Username').focus();
    await page.keyboard.press('Tab'); // -> Password
    await page.keyboard.press('Tab'); // -> Login 按钮
    await expect(page.getByRole('button', { name: 'Login' })).toBeFocused();

    await page.keyboard.press('Enter');
    await page.waitForURL('/');
  });

  test('still signs in when reduced motion is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loginAsDemo(page);
    await expect(page).toHaveURL('/');
  });
});
