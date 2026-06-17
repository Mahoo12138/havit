import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authApi, itemsApi, locationsApi, remindersApi, type Location } from '../../api/client';

export function countLocations(nodes: Location[] | undefined): number {
  if (!nodes) return 0;
  let n = 0;
  for (const node of nodes) {
    n += 1;
    n += countLocations(node.children);
  }
  return n;
}

export function formatGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 5) return t('greeting.night');
  if (hour < 11) return t('greeting.morning');
  if (hour < 13) return t('greeting.noon');
  if (hour < 18) return t('greeting.afternoon');
  return t('greeting.evening');
}

export function formatPrice(value: number, t: (key: string, opts?: any) => string): string {
  const symbol = t('common.currencySymbol');
  if (value >= 10000) return `${symbol}${t('common.wan', { value: (value / 10000).toFixed(1) })}`;
  return `${symbol}${value.toLocaleString()}`;
}

export function formatDateShort(ts: number): string {
  const d = new Date(ts * 1000);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}/${day}`;
}

export const CATEGORY_PALETTE = ['teal', 'info', 'warning', 'violet', 'amber', 'danger'] as const;

export const STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'danger'> = {
  in_stock: 'info',
  in_use: 'neutral',
  loaned: 'warning',
  archived: 'neutral',
  consumed: 'neutral',
  lost: 'danger',
};

export interface DashboardTotals {
  totalItems: number;
  totalValue: number;
  categoryCount: number;
  inStock: number;
  inUse: number;
}

export function useDashboardData() {
  const { t } = useTranslation();

  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    staleTime: 60_000,
    retry: false,
  });

  const items = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.list(),
  });

  const locs = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  const reminders = useQuery({
    queryKey: ['reminders'],
    queryFn: () => remindersApi.list(true),
  });

  const allItems = items.data?.items ?? [];

  const totals: DashboardTotals = useMemo(() => {
    const totalValue = allItems.reduce((sum, it) => sum + (it.purchase_price ?? 0), 0);
    const categories = new Set(
      allItems.map((i) => i.category).filter((c): c is string => Boolean(c && c.trim())),
    );
    const inStock = allItems.filter((i) => i.status === 'in_stock').length;
    const inUse = allItems.filter((i) => i.status === 'in_use').length;
    return { totalItems: allItems.length, totalValue, categoryCount: categories.size, inStock, inUse };
  }, [allItems]);

  const categoryBreakdown = useMemo(() => {
    const groups = new Map<string, number>();
    for (const it of allItems) {
      const key = (it.category && it.category.trim()) || t('common.uncategorized');
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [allItems, t]);

  const recent = useMemo(() => {
    return [...allItems].sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0)).slice(0, 5);
  }, [allItems]);

  const locationTotal = locs.data ? countLocations(locs.data.tree) : undefined;

  return {
    t,
    me,
    items,
    locs,
    reminders,
    allItems,
    totals,
    categoryBreakdown,
    recent,
    locationTotal,
  };
}
