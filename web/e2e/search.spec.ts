import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { loginAsDemo } from './helpers';

const BACKEND_PORT = Number(process.env.HAVIT_E2E_BACKEND_PORT ?? 3300);
const API_BASE_URL = `http://localhost:${BACKEND_PORT}/api/v1/`;

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
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

async function expectJson<T>(responsePromise: Promise<APIResponse>) {
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as T;
}

interface SearchFixture {
  locationName: string;
  cameraItemName: string;
  taggedItemName: string;
  tagName: string;
  essentialsItemName: string;
  borrowedItemName: string;
}

async function createSearchFixture(api: APIRequestContext, headers: { Authorization: string }): Promise<SearchFixture> {
  const unique = Date.now().toString(36);
  const fixture = {
    locationName: `搜测防潮箱${unique}`,
    cameraItemName: `搜测相机包${unique}`,
    taggedItemName: `搜测镜头布${unique}`,
    tagName: `搜测尼康${unique}`,
    essentialsItemName: `搜测钥匙扣${unique}`,
    borrowedItemName: `搜测投影仪${unique}`,
  };

  const location = await expectJson<{ id: string }>(
    api.post('locations/', { headers, data: { name: fixture.locationName } }),
  );
  await expectJson<{ id: string }>(
    api.post('items/', {
      headers,
      data: { name: fixture.cameraItemName, type: 'durable', location_id: location.id },
    }),
  );
  const tag = await expectJson<{ id: string }>(
    api.post('tags/', { headers, data: { name: fixture.tagName, color: '#2563eb' } }),
  );
  const taggedItem = await expectJson<{ id: string }>(
    api.post('items/', {
      headers,
      data: { name: fixture.taggedItemName, type: 'durable', location_id: location.id },
    }),
  );
  await expectJson<unknown>(
    api.put(`items/${taggedItem.id}/tags`, { headers, data: { tag_ids: [tag.id] } }),
  );
  await expectJson<{ id: string }>(
    api.post('items/', {
      headers,
      data: {
        name: fixture.essentialsItemName,
        type: 'essentials',
        location_id: location.id,
        home_base_location_id: location.id,
        current_status_tag: '@carry',
      },
    }),
  );
  const borrowedItem = await expectJson<{ id: string }>(
    api.post('items/', {
      headers,
      data: { name: fixture.borrowedItemName, type: 'durable', location_id: location.id },
    }),
  );
  await expectJson<unknown>(
    api.post(`items/${borrowedItem.id}/loans`, {
      headers,
      data: {
        borrower_name: '搜测小王',
        due_at: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
      },
    }),
  );
  return fixture;
}

async function searchFor(page: Page, query: string) {
  await page.goto('/search');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Query').fill(query);
}

test.describe('Search & locate loop', () => {
  let api: APIRequestContext;
  let headers: { Authorization: string };
  let fixture: SearchFixture;

  test.beforeAll(async ({ playwright }) => {
    api = await playwright.request.newContext({ baseURL: API_BASE_URL });
    const token = await login(api);
    headers = { Authorization: `Bearer ${token}` };
    fixture = await createSearchFixture(api, headers);
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test('finds an item by Chinese keyword and shows its location path', async ({ page }) => {
    await loginAsDemo(page);
    await searchFor(page, '相机包');

    await expect(page.getByRole('heading', { name: fixture.cameraItemName })).toBeVisible();
    await expect(page.getByText(fixture.locationName).first()).toBeVisible();
  });

  test('finds an item by tag keyword', async ({ page }) => {
    await loginAsDemo(page);
    await searchFor(page, fixture.tagName.replace('搜测', ''));

    await expect(page.getByRole('heading', { name: fixture.taggedItemName })).toBeVisible();
  });

  test('finds items stored in a location by the location name', async ({ page }) => {
    await loginAsDemo(page);
    await searchFor(page, fixture.locationName.replace('搜测', ''));

    await expect(page.getByRole('heading', { name: fixture.cameraItemName })).toBeVisible();
    await expect(page.getByText(fixture.locationName).first()).toBeVisible();
  });

  test('shows the essentials fallback hint for carried EDC items', async ({ page }) => {
    await loginAsDemo(page);
    await searchFor(page, fixture.essentialsItemName.replace('搜测', ''));

    await expect(page.getByRole('heading', { name: fixture.essentialsItemName })).toBeVisible();
    await expect(page.getByText(/当前状态：@carry/).first()).toBeVisible();
  });

  test('shows a loan hint for borrowed items', async ({ page }) => {
    await loginAsDemo(page);
    await searchFor(page, fixture.borrowedItemName.replace('搜测', ''));

    await expect(page.getByRole('heading', { name: fixture.borrowedItemName })).toBeVisible();
    await expect(page.getByText(/已借给 搜测小王；应还/)).toBeVisible();
  });

  test('search works on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsDemo(page);
    await searchFor(page, '相机包');

    await expect(page.getByRole('heading', { name: fixture.cameraItemName })).toBeVisible();
    await expect(page.getByText(fixture.locationName).first()).toBeVisible();
  });

  test('shows a photo thumbnail for items with photos', async ({ page }) => {
    const unique = Date.now().toString(36);
    const name = `搜测缩略图${unique}`;
    const location = await expectJson<{ id: string }>(
      api.post('locations/', { headers, data: { name: `搜测缩略位${unique}` } }),
    );
    const item = await expectJson<{ id: string }>(
      api.post('items/', { headers, data: { name, type: 'durable', location_id: location.id } }),
    );
    const upload = await api.post(`items/${item.id}/photos`, {
      headers,
      multipart: { file: { name: 'thumb.png', mimeType: 'image/png', buffer: PNG_1X1 } },
    });
    expect(upload.ok()).toBeTruthy();

    await loginAsDemo(page);
    await searchFor(page, name);

    await expect(page.getByRole('heading', { name })).toBeVisible();
    await expect(page.locator('img[src*="/api/v1/attachments/"]').first()).toBeVisible();
  });

  test('hides archived items by default and shows them when the preference is on', async ({ page }) => {
    const unique = Date.now().toString(36);
    const archivedName = `搜测归档件${unique}`;
    const location = await expectJson<{ id: string }>(
      api.post('locations/', { headers, data: { name: `搜测归档位${unique}` } }),
    );
    const archivedItem = await expectJson<{ id: string }>(
      api.post('items/', {
        headers,
        data: { name: archivedName, type: 'durable', location_id: location.id },
      }),
    );
    const archiveResponse = await api.delete(`items/${archivedItem.id}`, { headers });
    expect(archiveResponse.ok()).toBeTruthy();

    // Default preference: the archived item stays out of results.
    await loginAsDemo(page);
    await searchFor(page, archivedName);
    await expect(page.getByText('No results found')).toBeVisible();
    await expect(page.getByRole('heading', { name: archivedName })).not.toBeVisible();

    // Enable the preference: the item reappears with its archived status badge.
    const prefResponse = await api.patch('preferences', {
      headers,
      data: { show_archived_in_search: true },
    });
    expect(prefResponse.ok()).toBeTruthy();
    await searchFor(page, archivedName);
    await expect(page.getByRole('heading', { name: archivedName })).toBeVisible();
    await expect(page.getByText('Archived').first()).toBeVisible();

    // Restore the default so later runs start clean.
    await api.patch('preferences', { headers, data: { show_archived_in_search: false } });
  });
});
