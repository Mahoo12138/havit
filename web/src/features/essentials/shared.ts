import { useTranslation } from 'react-i18next';
import type { Item, Location } from '../../api/client';

export type StatusType = 'carry' | 'bag' | 'home' | 'away';

export const STATUS_TONE = {
  carry: 'success',
  bag: 'info',
  home: 'neutral',
  away: 'warning',
} as const;

export type StatusTone = (typeof STATUS_TONE)[StatusType];

export function getStatusType(item: Item): StatusType {
  // Explicit dynamic-status tags win over location inference, otherwise an
  // item still sitting at its home base (or without one) could never read as
  // carried.
  if (item.current_status_tag === '@随身携带' || item.current_status_tag === 'carry') return 'carry';
  if (item.current_status_tag === '@通勤包' || item.current_status_tag === 'travel_bag') return 'bag';
  if (!item.home_base_location_id) return 'home';
  if (item.location_id === item.home_base_location_id) return 'home';
  return 'away';
}

export function getStatusLabel(t: ReturnType<typeof useTranslation>['t'], item: Item): string {
  const type = getStatusType(item);
  if (type === 'carry') return t('essentials.carry');
  if (type === 'bag') return t('essentials.travelBag');
  if (type === 'home') return t('essentials.homeBaseShort');
  return t('essentials.notOnPersonShort');
}

// canonicalTag normalizes the free-form current_status_tag values that have
// accumulated over time ('@随身携带', 'carry', 'away', custom strings) to the
// code values the essentials page works with.
export function canonicalTag(tag?: string | null): string | null {
  if (!tag) return null;
  if (tag === '@随身携带' || tag === '@随身') return 'carry';
  if (tag === '@通勤包') return 'travel_bag';
  return tag;
}

export function tagLabel(t: ReturnType<typeof useTranslation>['t'], tag?: string | null): string {
  const canonical = canonicalTag(tag);
  if (!canonical) return t('essentials.homeBaseShort');
  if (canonical === 'carry') return t('essentials.carry');
  if (canonical === 'travel_bag') return t('essentials.travelBag');
  if (canonical === 'away') return t('essentials.packedAway');
  return canonical;
}

export function flattenLocations(
  nodes: Location[] | undefined,
  prefix = '',
): Array<{ value: string; label: string }> {
  if (!nodes) return [];
  const out: Array<{ value: string; label: string }> = [];
  for (const node of nodes) {
    const label = prefix ? `${prefix} → ${node.name}` : node.name;
    out.push({ value: node.id, label });
    out.push(...flattenLocations(node.children, label));
  }
  return out;
}

export function formatRelative(t: ReturnType<typeof useTranslation>['t'], ts?: number): string {
  if (!ts) return '—';
  const date = new Date(ts * 1000);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.floor((startOfDay(now) - startOfDay(date)) / 86_400_000);
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (dayDiff <= 0) return t('essentials.todayAt', { time });
  if (dayDiff === 1) return t('essentials.yesterdayAt', { time });
  return t('essentials.daysAgo', { count: dayDiff });
}

export function formatDateTime(ts?: number): string {
  if (!ts) return '—';
  const date = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
