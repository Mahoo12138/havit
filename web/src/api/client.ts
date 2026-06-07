import ky from 'ky';

const TOKEN_KEY = 'havit_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export const api = ky.create({
  prefixUrl: '/api/v1',
  timeout: 30_000,
  hooks: {
    beforeRequest: [
      (req) => {
        const t = getToken();
        if (t) req.headers.set('Authorization', `Bearer ${t}`);
      },
    ],
    afterResponse: [
      (_req, _opt, res) => {
        if (res.status === 401) {
          clearToken();
        }
      },
    ],
  },
});

export interface SystemStatus {
  mode: 'release' | 'demo';
  needs_setup: boolean;
  version: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  role: string;
  created_at: number;
}

export interface AuthResponse {
  user: CurrentUser;
  token: string;
}

export const systemApi = {
  status: () => api.get('system/status').json<SystemStatus>(),
};

export const authApi = {
  setup: (body: { username: string; password: string }) =>
    api.post('auth/setup', { json: body }).json<AuthResponse>(),
  login: (body: { username: string; password: string }) =>
    api.post('auth/login', { json: body }).json<AuthResponse>(),
  me: () => api.get('auth/me').json<CurrentUser>(),
  logout: () => api.post('auth/logout'),
};

export interface ImportError {
  line: number;
  name: string;
  message: string;
}

export interface ImportResult {
  total: number;
  created: number;
  failed: number;
  errors?: ImportError[];
}

export const importApi = {
  items: (format: 'csv' | 'json', body: string | File) => {
    const contentType = format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json';
    return api
      .post(`import/items?format=${format}`, {
        body,
        headers: { 'Content-Type': contentType },
      })
      .json<ImportResult>();
  },
};

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
