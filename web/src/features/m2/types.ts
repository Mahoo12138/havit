export type ItemKind =
  | 'durable'
  | 'consumable_a'
  | 'consumable_b'
  | 'edc'
  | 'virtual';

export type AssetStatus =
  | 'in_stock'
  | 'borrowed'
  | 'idle'
  | 'for_sale'
  | 'sold'
  | 'given_away'
  | 'damaged'
  | 'lost'
  | 'stolen';

export type CaptureFallback = 'barcode' | 'ai_photo' | 'manual';

export interface CaptureDraft {
  id: string;
  source: CaptureFallback;
  title: string;
  confidence: number;
  status: 'ready' | 'needs_review' | 'failed';
  imageUrl?: string;
  fields: Array<{
    label: string;
    value: string;
    confidence: 'high' | 'medium' | 'empty';
  }>;
}

export interface SearchResultHint {
  itemName: string;
  locationPath: string;
  status: AssetStatus | 'edc_away';
  hint: string;
  tags: string[];
}

export interface ConsumableForecast {
  id: string;
  name: string;
  model: 'event_forecast' | 'counter';
  stock: number;
  unit: string;
  threshold: number;
  nextRunoutDate?: string;
  confidence: 'stable' | 'needs_calibration';
  lastSignal: string;
}

export interface EDCAsset {
  id: string;
  name: string;
  baselineLocation: string;
  dynamicState: '@home' | '@carry' | '@travel_bag' | '@unknown';
  lastConfirmedAt: string;
  searchHint: string;
}

export interface LocationLabel {
  id: string;
  code: string;
  name: string;
  path: string;
  itemCount: number;
  printState: 'ready' | 'printed' | 'needs_reprint';
}

export interface CredentialRecord {
  id: string;
  itemName: string;
  platform?: string;
  credentialType: 'invoice' | 'order' | 'license' | 'warranty_card';
  expiresAt?: string;
  warrantyState: 'active' | 'expiring' | 'expired' | 'none';
  attachments: number;
}

export interface LoanRecord {
  id: string;
  itemName: string;
  borrower: string;
  contact: string;
  lentAt: string;
  dueAt: string;
  state: 'active' | 'overdue' | 'returned' | 'lost_by_borrower';
  handoffNote: string;
}

export interface LifecycleRecord {
  id: string;
  itemName: string;
  status: Extract<AssetStatus, 'sold' | 'given_away' | 'damaged' | 'lost' | 'stolen'>;
  date: string;
  amount?: number;
  currency?: string;
  note: string;
}

export interface ReminderJob {
  id: string;
  title: string;
  channel: 'apprise' | 'ntfy' | 'webhook';
  nextRunAt: string;
  state: 'scheduled' | 'paused' | 'failed';
}

export interface BackupRun {
  id: string;
  startedAt: string;
  state: 'success' | 'running' | 'failed';
  target: string;
  size: string;
  steps: Array<'vacuum' | 'archive' | 'manifest'>;
}

export interface ExportPreset {
  id: string;
  label: string;
  format: 'csv' | 'json';
  scope: string;
  lastExportedAt?: string;
}
