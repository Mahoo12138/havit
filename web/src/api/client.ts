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

export interface AppError {
  error: string;
  message: string;
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
  home_base_location_id?: string;
  current_status_tag?: string;
  parent_item_id?: string;
  purchase_price?: number;
  purchase_currency?: string;
  purchase_date?: number;
  serial_number?: string;
  warranty_expires_at?: number;
  warranty_contact?: string;
  current_stock?: number;
  min_stock_threshold?: number;
  lifespan_days?: number;
  in_use_since?: number;
  is_private: boolean;
  owner_id?: string;
  created_at: number;
  updated_at: number;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  created_at?: number;
  usage_count?: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  root_type: 'physical' | 'virtual';
  is_system: boolean;
  created_at: number;
  usage_count: number;
}

export interface Attachment {
  id: string;
  item_id: string;
  type: 'photo' | string;
  filename: string;
  path: string;
  size: number;
  content_type?: string;
  url: string;
  is_ai_source: boolean;
  created_at: number;
}

export interface Location {
  id: string;
  parent_id?: string;
  name: string;
  type: string;
  qr_code?: string;
  is_private?: boolean;
  owner_id?: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
  children?: Location[];
}

export interface LocationScanResult {
  location: Location;
  items: Item[];
}

export const itemsApi = {
  list: (params: { q?: string; status?: string; type?: string; location?: string; tag?: string } = {}) =>
    api.get('items/', { searchParams: params as Record<string, string> }).json<{ items: Item[] }>(),
  get: (id: string) => api.get(`items/${id}`).json<Item>(),
  create: (body: Partial<Item>) => api.post('items/', { json: body }).json<Item>(),
  update: (id: string, body: Partial<Item>) =>
    api.patch(`items/${id}`, { json: body }).json<Item>(),
  archive: (id: string) => api.delete(`items/${id}`),
  replaceTags: (id: string, tagIds: string[]) =>
    api.put(`items/${id}/tags`, { json: { tag_ids: tagIds } }).json<Item>(),
  attachments: (id: string) =>
    api.get(`items/${id}/attachments`).json<{ attachments: Attachment[] }>(),
  uploadPhoto: (id: string, file: File) => {
    const body = new FormData();
    body.append('file', file);
    return api.post(`items/${id}/photos`, { body }).json<Attachment>();
  },
};

export const tagsApi = {
  list: () => api.get('tags/').json<{ tags: Tag[] }>(),
  create: (body: { name: string; color?: string }) => api.post('tags/', { json: body }).json<Tag>(),
  update: (id: string, body: { name: string; color?: string }) =>
    api.patch(`tags/${id}`, { json: { name: body.name, color: body.color ?? '' } }).json<Tag>(),
  remove: (id: string) => api.delete(`tags/${id}`),
};

export const categoriesApi = {
  list: () => api.get('categories/').json<{ categories: Category[] }>(),
  create: (body: { name: string; icon?: string; root_type: string }) =>
    api.post('categories/', { json: body }).json<Category>(),
  update: (id: string, body: { name: string; icon?: string; root_type: string }) =>
    api.patch(`categories/${id}`, { json: body }).json<Category>(),
  remove: (id: string) => api.delete(`categories/${id}`),
};

export const locationsApi = {
  tree: () => api.get('locations/').json<{ tree: Location[] }>(),
  get: (id: string) => api.get(`locations/${id}`).json<Location>(),
  create: (body: {
    name: string;
    parent_id?: string;
    type?: string;
    is_private?: boolean;
  }) => api.post('locations/', { json: body }).json<Location>(),
  update: (id: string, body: Partial<Location>) =>
    api.patch(`locations/${id}`, { json: body }).json<Location>(),
  delete: (id: string) => api.delete(`locations/${id}`),
  generateQRCode: (id: string) =>
    api.post(`locations/${id}/qr-code`).json<Location>(),
  scan: (code: string) =>
    api.get(`locations/scan/${encodeURIComponent(code)}`).json<LocationScanResult>(),
};

export interface Loan {
  id: string;
  item_id: string;
  borrower_name: string;
  borrower_contact?: string;
  loaned_at: number;
  due_at?: number;
  returned_at?: number;
  status: string;
  compensation?: number;
  compensation_currency?: string;
  notes?: string;
}

export interface PurchaseEvent {
  id: string;
  item_id: string;
  quantity: number;
  price?: number;
  currency?: string;
  purchased_at: number;
  notes?: string;
}

export interface CalibrationEvent {
  id: string;
  item_id: string;
  signal: string;
  created_at: number;
}

export interface ItemEvent {
  id: string;
  item_id: string;
  actor_id?: string;
  event_type: string;
  payload?: string;
  created_at: number;
}

export interface LossRecord {
  item_id: string;
  name: string;
  status: string;
  loss_date: number;
  exit_type?: string;
  exit_notes?: string;
}

export interface Reminder {
  id: string;
  item_id: string;
  type: string;
  trigger_at: number;
  sent_at?: number;
  is_dismissed: boolean;
}

export interface NotifyProcessResult {
  processed: number;
  sent: number;
  failed: number;
}

export interface BackupResult {
  path: string;
  size: number;
  created_at: number;
}

export interface SearchResult {
  id: string;
  name: string;
  type: string;
  status: string;
  location_id?: string;
  location_path?: string;
  edc_hint?: string;
}

export interface BarcodeLookupResult {
  barcode: string;
  found: boolean;
  fallback?: string;
  draft?: {
    name?: string;
    category?: string;
    description?: string;
  };
  source?: string;
}

export interface VirtualCredential {
  id: string;
  item_id: string;
  platform: string;
  account?: string;
  order_id?: string;
  license_key?: string;
  purchased_at?: number;
  price?: number;
  currency?: string;
}

export interface VirtualAddonPurchase {
  id: string;
  item_id: string;
  name: string;
  platform?: string;
  price?: number;
  currency?: string;
  purchased_at: number;
}

export interface RecognizeItemResult {
  draft?: {
    name?: string;
    category?: string;
    description?: string;
  };
  source_attachment?: Attachment;
  fallback?: string;
}

export const itemsExtendedApi = {
  warranty: (expiringDays?: number) => {
    const params: Record<string, string> = {};
    if (expiringDays) params.expiring_days = String(expiringDays);
    return api.get('items/warranty', { searchParams: params }).json<{ items: Item[] }>();
  },
  graveyard: () => api.get('items/graveyard').json<{ items: Item[] }>(),
  lossRecords: (from?: number, to?: number) => {
    const params: Record<string, string> = {};
    if (from !== undefined) params.from = String(from);
    if (to !== undefined) params.to = String(to);
    return api.get('items/loss-records', { searchParams: params }).json<{ loss_records: LossRecord[] }>();
  },
  exit: (id: string, body: {
    exit_type: string;
    status?: string;
    exit_date?: number;
    exit_price?: number;
    exit_currency?: string;
    exit_notes?: string;
  }) => api.post(`items/${id}/exit`, { json: body }).json<Item>(),
  claimPdf: (id: string) =>
    api.get(`items/${id}/claim-pdf`).blob(),
  useOne: (id: string) => api.post(`items/${id}/use-one`).json<Item>(),
  setEdcStatus: (id: string, body: { current_status_tag: string; location_id?: string }) =>
    api.post(`items/${id}/edc-status`, { json: body }).json<Item>(),
  returnHome: (id: string) => api.post(`items/${id}/return-home`).json<Item>(),
  listPurchaseEvents: (id: string) =>
    api.get(`items/${id}/purchase-events`).json<{ purchase_events: PurchaseEvent[]; next_purchase_at?: number }>(),
  createPurchaseEvent: (id: string, body: {
    quantity: number;
    price?: number;
    currency?: string;
    purchased_at?: number;
    notes?: string;
  }) => api.post(`items/${id}/purchase-events`, { json: body }).json<PurchaseEvent>(),
  listCalibrationEvents: (id: string) =>
    api.get(`items/${id}/calibration-events`).json<{ calibration_events: CalibrationEvent[] }>(),
  createCalibrationEvent: (id: string, body: { signal: string }) =>
    api.post(`items/${id}/calibration-events`, { json: body }).json<CalibrationEvent>(),
  listEvents: (id: string) =>
    api.get(`items/${id}/events`).json<{ events: ItemEvent[] }>(),
};

export const loansApi = {
  create: (itemId: string, body: {
    borrower_name: string;
    borrower_contact?: string;
    loaned_at?: number;
    due_at?: number;
    notes?: string;
  }) => api.post(`items/${itemId}/loans`, { json: body }).json<Loan>(),
  listForItem: (itemId: string) =>
    api.get(`items/${itemId}/loans`).json<{ loans: Loan[] }>(),
  returnLoan: (id: string, body?: { returned_at?: number }) =>
    api.post(`loans/${id}/return`, { json: body ?? {} }).json<Loan>(),
  markUnreturned: (id: string, body?: {
    compensation?: number;
    compensation_currency?: string;
    notes?: string;
  }) => api.post(`loans/${id}/unreturned`, { json: body ?? {} }).json<Loan>(),
};

export const virtualAssetsApi = {
  createCredential: (itemId: string, body: {
    platform: string;
    account?: string;
    order_id?: string;
    license_key?: string;
    purchased_at?: number;
    price?: number;
    currency?: string;
  }) => api.post(`items/${itemId}/virtual-credentials`, { json: body }).json<VirtualCredential>(),
  listCredentials: (itemId: string) =>
    api.get(`items/${itemId}/virtual-credentials`).json<{ credentials: VirtualCredential[] }>(),
  createAddon: (itemId: string, body: {
    name: string;
    platform?: string;
    price?: number;
    currency?: string;
    purchased_at?: number;
  }) => api.post(`items/${itemId}/virtual-addons`, { json: body }).json<VirtualAddonPurchase>(),
  listAddons: (itemId: string) =>
    api.get(`items/${itemId}/virtual-addons`).json<{ addons: VirtualAddonPurchase[] }>(),
};

export const remindersApi = {
  list: (dueOnly?: boolean) => {
    const params: Record<string, string> = {};
    if (dueOnly) params.due_only = 'true';
    return api.get('reminders', { searchParams: params }).json<{ reminders: Reminder[] }>();
  },
  markSent: (id: string, body?: { sent_at?: number }) =>
    api.post(`reminders/${id}/sent`, { json: body ?? {} }).json<Reminder>(),
  dismiss: (id: string) => api.post(`reminders/${id}/dismiss`).json<Reminder>(),
};

export const notifyApi = {
  processDue: (now?: number) => {
    const body = now !== undefined ? { now } : {};
    return api.post('notify/process-due', { json: body }).json<NotifyProcessResult>();
  },
};

export const backupApi = {
  run: () => api.post('backups/run').json<BackupResult>(),
};

export const searchApi = {
  search: (q: string): EventSource => {
    const token = getToken();
    const url = new URL('/api/v1/search', window.location.origin);
    url.searchParams.set('q', q);
    const init: RequestInit = {};
    if (token) {
      init.headers = { Authorization: `Bearer ${token}` };
    }
    return new EventSource(url.toString());
  },
};

export const barcodeApi = {
  lookup: (code: string) =>
    api.get(`barcode/${encodeURIComponent(code)}`).json<BarcodeLookupResult>(),
};

export const aiApi = {
  recognizePhoto: (itemId: string, file: File) => {
    const body = new FormData();
    body.append('file', file);
    return api.post(`items/${itemId}/ai-recognize-photo`, { body }).json<RecognizeItemResult>();
  },
};

export const exportApi = {
  items: (format: 'json' | 'csv' = 'json') =>
    api.get('export/items', { searchParams: { format } }).blob(),
};

export interface User {
  id: string;
  username: string;
  role: string;
  created_at: number;
}

export const usersApi = {
  list: () => api.get('users/').json<{ users: User[] }>(),
  create: (body: { username: string; password: string }) =>
    api.post('users/', { json: body }).json<User>(),
  delete: (id: string) => api.delete(`users/${id}`),
  updateRole: (id: string, role: string) =>
    api.patch(`users/${id}/role`, { json: { role } }).json<User>(),
};

export const containerApi = {
  listContents: (id: string) =>
    api.get(`items/${id}/contents`).json<{ items: Item[] }>(),
  putInto: (containerId: string, itemId: string) =>
    api.post(`items/${containerId}/contents`, { json: { item_id: itemId } }),
  remove: (containerId: string, childId: string) =>
    api.delete(`items/${containerId}/contents/${childId}`),
};

export const edcBulkApi = {
  packAll: (locationId: string) =>
    api.post('items/edc/pack-all', { json: { location_id: locationId } }).json<{ moved: number }>(),
  returnAll: () =>
    api.post('items/edc/return-all').json<{ moved: number }>(),
};

export interface SystemConfig {
  key: string;
  value: string;
  controlled_by: 'env' | 'database' | 'default';
  can_edit: boolean;
  type?: 'string' | 'bool' | 'int' | 'sensitive' | 'enum';
  options?: string[];
  description?: string;
}

export interface UserPreferences {
  user_id?: string;
  theme: 'light' | 'dark' | 'system';
  default_currency: string;
  date_format: 'absolute' | 'relative';
  home_view: 'spaces' | 'edc' | 'restock';
  scan_behavior: 'confirm' | 'silent';
  default_visibility: 'shared' | 'private';
  personal_bark_key?: string;
  personal_ntfy_topic?: string;
  show_archived_in_search: boolean;
}

export const systemConfigsApi = {
  list: () => api.get('system/configs').json<{ configs: SystemConfig[] }>(),
  update: (key: string, value: string) =>
    api.patch(`system/configs/${key}`, { json: { value } }).json<SystemConfig>(),
};

export const preferencesApi = {
  get: () => api.get('preferences').json<UserPreferences>(),
  update: (body: Partial<UserPreferences>) =>
    api.patch('preferences', { json: body }).json<UserPreferences>(),
};

// ── Abnormal Asset Management ────────────────────────────────────────────────

export interface AbnormalListItem {
  item_id: string;
  name: string;
  status: string;
  serial_number?: string;
  category?: string;
  location_id?: string;
  location_name?: string;
  purchase_price?: number;
  purchase_currency?: string;
  exit_date?: number;
  updated_at: number;
  photo_url?: string;
  abnormal_id: string;
  abnormal_type: string;
  processing_status: string;
  processing_notes?: string;
  responsible_person?: string;
  estimated_loss?: number;
  estimated_loss_currency?: string;
  recoverable_amount?: number;
  recoverable_currency?: string;
}

export interface AbnormalStats {
  total: number;
  lost: number;
  stolen: number;
  unreturned: number;
  damaged: number;
}

export interface AbnormalTrendPoint {
  month: string;
  count: number;
}

export interface ProgressStatsItem {
  status: string;
  count: number;
}

export interface LossValuation {
  total_estimated: number;
  estimated_currency: string;
  recoverable_amount: number;
  recoverable_currency: string;
}

export interface AbnormalRecord {
  id: string;
  item_id: string;
  abnormal_type: string;
  processing_status: string;
  processing_notes?: string;
  responsible_person?: string;
  estimated_loss?: number;
  estimated_loss_currency?: string;
  recoverable_amount?: number;
  recoverable_currency?: string;
  created_at: number;
  updated_at: number;
}

export const abnormalApi = {
  list: (params?: { type?: string; status?: string; limit?: number; offset?: number }) => {
    const sp: Record<string, string> = {};
    if (params?.type) sp.type = params.type;
    if (params?.status) sp.status = params.status;
    if (params?.limit !== undefined) sp.limit = String(params.limit);
    if (params?.offset !== undefined) sp.offset = String(params.offset);
    return api.get('abnormal', { searchParams: sp }).json<{ items: AbnormalListItem[]; total: number }>();
  },
  stats: () => api.get('abnormal/stats').json<AbnormalStats>(),
  trend: () => api.get('abnormal/trend').json<{ trend: AbnormalTrendPoint[] }>(),
  progress: () => api.get('abnormal/progress').json<{ progress: ProgressStatsItem[] }>(),
  valuation: () => api.get('abnormal/valuation').json<LossValuation>(),
  updateProgress: (id: string, body: {
    processing_status?: string;
    processing_notes?: string;
    responsible_person?: string;
    recoverable_amount?: number;
    recoverable_currency?: string;
  }) => api.patch(`abnormal/${id}`, { json: body }).json<AbnormalRecord>(),
};

// ── API Tokens (Personal Access Tokens) ──────────────────────────────────────

export interface APIToken {
  id: string;
  user_id: string;
  name: string;
  expires_at?: number;
  last_used_at?: number;
  created_at: number;
}

export interface APITokenCreated extends APIToken {
  plain_token: string;
}

export const apiTokensApi = {
  list: () => api.get('api-tokens/').json<{ tokens: APIToken[] }>(),
  create: (body: { name: string; expires_at?: number }) =>
    api.post('api-tokens/', { json: body }).json<APITokenCreated>(),
  revoke: (id: string) => api.delete(`api-tokens/${id}`),
  revokeAllSessions: () => api.post('api-tokens/revoke-all-sessions').json<{ status: string }>(),
};
