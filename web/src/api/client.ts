import ky from 'ky';

export const api = ky.create({
  prefixUrl: '/api/v1',
  timeout: 30_000,
});

export interface Item {
  id: string;
  name: string;
  description?: string;
  category?: string;
  type: string;
  status: string;
  location_id?: string;
  purchase_price?: number;
  purchase_currency?: string;
  purchase_date?: number;
  serial_number?: string;
  created_at: number;
  updated_at: number;
}

export interface Location {
  id: string;
  parent_id?: string;
  name: string;
  type: string;
  qr_code?: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
  children?: Location[];
}

export const itemsApi = {
  list: (params: { q?: string; status?: string; type?: string; location?: string } = {}) =>
    api.get('items/', { searchParams: params as Record<string, string> }).json<{ items: Item[] }>(),
  get: (id: string) => api.get(`items/${id}`).json<Item>(),
  create: (body: Partial<Item>) => api.post('items/', { json: body }).json<Item>(),
  update: (id: string, body: Partial<Item>) =>
    api.patch(`items/${id}`, { json: body }).json<Item>(),
  archive: (id: string) => api.delete(`items/${id}`),
};

export const locationsApi = {
  tree: () => api.get('locations/').json<{ tree: Location[] }>(),
  create: (body: { name: string; parent_id?: string; type?: string }) =>
    api.post('locations/', { json: body }).json<Location>(),
  update: (id: string, body: Partial<Location>) =>
    api.patch(`locations/${id}`, { json: body }).json<Location>(),
  delete: (id: string) => api.delete(`locations/${id}`),
};
