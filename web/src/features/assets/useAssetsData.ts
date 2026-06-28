import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { categoriesApi, itemsApi, locationsApi, preferencesApi, type Item, type Location } from '../../api/client';
import { useToast } from '../../components/ui/use-toast';

export interface AssetItem extends Item {
  attachments?: Array<{ url: string; type: string }>;
}

export function flatten(
  nodes: Location[] | undefined,
  prefix = '',
): Array<{ value: string; label: string }> {
  if (!nodes) return [];
  const out: Array<{ value: string; label: string }> = [];
  for (const n of nodes) {
    const label = prefix ? `${prefix} → ${n.name}` : n.name;
    out.push({ value: n.id, label });
    out.push(...flatten(n.children, label));
  }
  return out;
}

export function getWarrantyStatus(item: Item): 'active' | 'expiring' | 'expired' | 'none' {
  if (!item.warranty_expires_at) return 'none';
  const now = Math.floor(Date.now() / 1000);
  const daysLeft = (item.warranty_expires_at - now) / 86400;
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 30) return 'expiring';
  return 'active';
}

export function formatDate(ts?: number): string {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  return d.toISOString().split('T')[0];
}

export function formatPrice(price?: number, currency?: string): string {
  if (price == null) return '—';
  if (currency === 'CNY' || currency === '¥') return `¥${price.toLocaleString()}`;
  if (currency === 'USD' || currency === '$') return `$${price.toLocaleString()}`;
  return `${price.toLocaleString()} ${currency ?? ''}`;
}

export function useAssetsData() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['items', 'durable', searchQuery],
    queryFn: () => itemsApi.list({
      type: 'durable',
      ...(searchQuery ? { q: searchQuery } : {}),
    }),
  });

  const { data: locData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const { data: preferences } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesApi.get(),
    staleTime: 60_000,
  });

  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    location_id: '',
    serial_number: '',
    warranty_expires_at: '',
    purchase_price: '',
  });

  const resetForm = () =>
    setForm({
      name: '', category: '', description: '', location_id: '',
      serial_number: '', warranty_expires_at: '',
      purchase_price: '',
    });

  const defaultCurrency = preferences?.default_currency || 'CNY';

  const create = useMutation({
    mutationFn: () =>
      itemsApi.create({
        name: form.name,
        type: 'durable',
        category: form.category || undefined,
        description: form.description || undefined,
        location_id: form.location_id || undefined,
        serial_number: form.serial_number || undefined,
        warranty_expires_at: form.warranty_expires_at
          ? Math.floor(new Date(form.warranty_expires_at).getTime() / 1000)
          : undefined,
        purchase_price: form.purchase_price ? Number(form.purchase_price) : undefined,
        purchase_currency: form.purchase_price ? defaultCurrency : undefined,
      }),
    onSuccess: () => {
      toast.show(t('items.created'));
      queryClient.invalidateQueries({ queryKey: ['items', 'durable'] });
      resetForm();
    },
    onError: (e: Error) => toast.show(t('items.createFailed', { error: e.message })),
  });

  const allItems: AssetItem[] = data?.items ?? [];
  const locOptions = useMemo(() => flatten(locData?.tree), [locData?.tree]);
  const categoryOptions = useMemo(
    () => (categoriesData?.categories ?? [])
      .filter((category) => category.root_type === 'physical')
      .map((category) => ({ value: category.name, label: category.name })),
    [categoriesData?.categories],
  );

  const stats = useMemo(() => {
    const total = allItems.length;
    const inUse = allItems.filter((i) => i.status === 'in_use').length;
    const warrantyActive = allItems.filter((i) => getWarrantyStatus(i) === 'active').length;
    const warrantyExpiring = allItems.filter((i) => {
      const ws = getWarrantyStatus(i);
      return ws === 'expiring' || ws === 'expired';
    }).length;
    const totalValue = allItems.reduce((sum, i) => sum + (i.purchase_price ?? 0), 0);
    const locations = new Map<string, number>();
    allItems.forEach((i) => {
      if (i.location_id) locations.set(i.location_id, (locations.get(i.location_id) ?? 0) + 1);
    });
    return { total, inUse, warrantyActive, warrantyExpiring, totalValue, locations };
  }, [allItems]);

  const warrantyAlerts = allItems
    .filter((i) => { const ws = getWarrantyStatus(i); return ws === 'expiring' || ws === 'expired'; })
    .slice(0, 5);

  const locationBreakdown = Array.from(stats.locations.entries())
    .map(([locId, count]) => ({
      name: locOptions.find((o) => o.value === locId)?.label ?? locId,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    t,
    isLoading,
    allItems,
    locData,
    locOptions,
    categoryOptions,
    defaultCurrency,
    stats,
    warrantyAlerts,
    locationBreakdown,
    searchQuery,
    setSearchQuery,
    form,
    setForm,
    resetForm,
    create,
  };
}
