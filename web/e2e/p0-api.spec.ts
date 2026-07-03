import { test, expect, type APIRequestContext, type APIResponse } from '@playwright/test';

const BACKEND_PORT = Number(process.env.HAVIT_E2E_BACKEND_PORT ?? 3300);
const API_BASE_URL = `http://localhost:${BACKEND_PORT}/api/v1/`;
const DEMO_LOCATION_ID = '01DEMO000LOC0000002';

async function login(request: APIRequestContext) {
  const response = await request.post('auth/login', {
    data: {
      username: 'admin@havit.local',
      password: 'havit-demo',
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.token).toEqual(expect.any(String));
  return body.token as string;
}

async function expectJson<T>(responsePromise: Promise<APIResponse>) {
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as T;
}

test.describe('P0 API flows', () => {
  test('covers categories, tags, import/export, tag filtering, and archive lifecycle', async ({
    playwright,
  }) => {
    const api = await playwright.request.newContext({ baseURL: API_BASE_URL });
    try {
      const token = await login(api);
      const headers = { Authorization: `Bearer ${token}` };
      const unique = Date.now().toString(36);

      const category = await expectJson<{ id: string; name: string }>(
        api.post('categories/', {
          headers,
          data: {
            name: `P0 Category ${unique}`,
            icon: 'box',
            root_type: 'physical',
          },
        }),
      );
      expect(category.name).toBe(`P0 Category ${unique}`);

      const updatedCategory = await expectJson<{ id: string; name: string }>(
        api.patch(`categories/${category.id}`, {
          headers,
          data: {
            name: `P0 Category Updated ${unique}`,
            icon: 'box',
            root_type: 'physical',
          },
        }),
      );
      expect(updatedCategory.name).toBe(`P0 Category Updated ${unique}`);

      const disposableTag = await expectJson<{ id: string; name: string }>(
        api.post('tags/', {
          headers,
          data: { name: `P0 Disposable Tag ${unique}`, color: '#2563eb' },
        }),
      );
      const updatedDisposableTag = await expectJson<{ id: string; name: string }>(
        api.patch(`tags/${disposableTag.id}`, {
          headers,
          data: { name: `P0 Disposable Tag Updated ${unique}`, color: '#16a34a' },
        }),
      );
      expect(updatedDisposableTag.name).toBe(`P0 Disposable Tag Updated ${unique}`);

      const deleteDisposableTag = await api.delete(`tags/${disposableTag.id}`, { headers });
      expect(deleteDisposableTag.status()).toBe(204);

      const tag = await expectJson<{ id: string; name: string }>(
        api.post('tags/', {
          headers,
          data: { name: `P0 Filter Tag ${unique}`, color: '#ea580c' },
        }),
      );

      const item = await expectJson<{ id: string; name: string; tags?: Array<{ id: string }> }>(
        api.post('items/', {
          headers,
          data: {
            name: `P0 Tagged Asset ${unique}`,
            type: 'durable',
            category: updatedCategory.name,
            location_id: DEMO_LOCATION_ID,
          },
        }),
      );
      expect(item.name).toBe(`P0 Tagged Asset ${unique}`);

      const taggedItem = await expectJson<{ tags: Array<{ id: string; name: string }> }>(
        api.put(`items/${item.id}/tags`, {
          headers,
          data: { tag_ids: [tag.id] },
        }),
      );
      expect(taggedItem.tags.map((entry) => entry.id)).toContain(tag.id);

      const filteredItems = await expectJson<{ items: Array<{ id: string; name: string }> }>(
        api.get(`items/?tag=${encodeURIComponent(tag.id)}`, { headers }),
      );
      expect(filteredItems.items.map((entry) => entry.id)).toContain(item.id);

      const importedName = `P0 Imported Asset ${unique}`;
      const importResult = await expectJson<{ total: number; created: number; failed: number }>(
        api.post('import/items?format=json', {
          headers,
          data: [
            {
              name: importedName,
              type: 'durable',
              category: updatedCategory.name,
              location: '我的家 / 客厅',
              serial_number: `P0-${unique}`,
            },
          ],
        }),
      );
      expect(importResult).toMatchObject({ total: 1, created: 1, failed: 0 });

      const exportJson = await expectJson<{ items: Array<{ id: string; name: string }> }>(
        api.get('export/items?format=json', { headers }),
      );
      expect(exportJson.items.map((entry) => entry.name)).toContain(importedName);

      const archiveResponse = await api.delete(`items/${item.id}`, { headers });
      expect(archiveResponse.status()).toBe(204);

      const activeItems = await expectJson<{ items: Array<{ id: string }> }>(
        api.get('items/', { headers }),
      );
      expect(activeItems.items.map((entry) => entry.id)).not.toContain(item.id);

      const archivedItems = await expectJson<{ items: Array<{ id: string }> }>(
        api.get('items/graveyard', { headers }),
      );
      expect(archivedItems.items.map((entry) => entry.id)).toContain(item.id);

      const deleteCategory = await api.delete(`categories/${category.id}`, { headers });
      expect(deleteCategory.status()).toBe(204);
    } finally {
      await api.dispose();
    }
  });
});
