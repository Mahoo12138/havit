import { type Page, expect } from '@playwright/test';

const DEMO_USERNAME = 'admin@havit.local';
const DEMO_PASSWORD = 'havit-demo';

export async function loginAsDemo(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  const isDemo = await page.locator('text=Demo mode active').isVisible().catch(() => false);
  if (isDemo) {
    const usernameInput = page.locator('#Username');
    const passwordInput = page.locator('#Password');
    await expect(usernameInput).toBeVisible();
    const currentVal = await usernameInput.inputValue();
    if (!currentVal) {
      await usernameInput.fill(DEMO_USERNAME);
      await passwordInput.fill(DEMO_PASSWORD);
    }
  } else {
    await page.locator('#Username').fill(DEMO_USERNAME);
    await page.locator('#Password').fill(DEMO_PASSWORD);
  }

  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('/');
  await page.waitForLoadState('networkidle');
}

export async function navigateToItems(page: Page) {
  await page.goto('/items');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}
