export type WarrantyFilter = '' | 'expiring' | 'expired';

export function warrantyDaysLeft(warrantyExpiresAt?: number): number | null {
  if (!warrantyExpiresAt) return null;
  const now = Math.floor(Date.now() / 1000);
  return Math.floor((warrantyExpiresAt - now) / 86400);
}

export function toUnixSeconds(dateValue: string): number | undefined {
  if (!dateValue) return undefined;
  const parsed = new Date(dateValue).getTime();
  return Number.isNaN(parsed) ? undefined : Math.floor(parsed / 1000);
}

export function fromUnixSeconds(ts?: number): string {
  if (!ts) return '';
  return new Date(ts * 1000).toISOString().split('T')[0];
}
