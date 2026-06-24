import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { itemsApi, locationsApi, type Location } from '../../api/client';
import { type LocationType } from '../../features/locations/types';
import { useToast } from '../../components/ui/use-toast';

/* ── Index ── */

export interface LocationIndex {
  byId: Map<string, Location>;
  parentMap: Map<string, string>;
  childrenMap: Map<string, Location[]>;
  roots: Location[];
}

export function buildIndex(tree: Location[] | undefined): LocationIndex {
  const byId = new Map<string, Location>();
  const parentMap = new Map<string, string>();
  const childrenMap = new Map<string, Location[]>();

  function walk(nodes: Location[]) {
    for (const n of nodes) {
      byId.set(n.id, n);
      const kids = n.children ?? [];
      childrenMap.set(n.id, kids);
      for (const k of kids) parentMap.set(k.id, n.id);
      walk(kids);
    }
  }
  if (tree) walk(tree);
  return { byId, parentMap, childrenMap, roots: tree ?? [] };
}

export function breadcrumbOf(index: LocationIndex, id: string | null): Location[] {
  if (!id) return [];
  const chain: Location[] = [];
  let cur: string | undefined = id;
  while (cur) {
    const node = index.byId.get(cur);
    if (!node) break;
    chain.unshift(node);
    cur = index.parentMap.get(cur);
  }
  return chain;
}

function collectSubtreeIds(index: LocationIndex, id: string): string[] {
  const out: string[] = [id];
  for (const k of index.childrenMap.get(id) ?? []) {
    out.push(...collectSubtreeIds(index, k.id));
  }
  return out;
}

/* ── Helpers ── */

export function locationTypeLabel(type: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    property: t('locationType.property'),
    room: t('locationType.room'),
    furniture: t('locationType.furniture'),
    container: t('locationType.container'),
    virtual: t('locationType.virtual'),
  };
  return map[type] ?? type;
}

export function locationTypeDesc(type: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    property: t('locationType.propertyDesc'),
    room: t('locationType.roomDesc'),
    furniture: t('locationType.furnitureDesc'),
    container: t('locationType.containerDesc'),
    virtual: t('locationType.virtualDesc'),
  };
  return map[type] ?? '';
}

export function formatPrice(value: number, t: (key: string, opts?: any) => string): string {
  const symbol = t('common.currencySymbol');
  if (value >= 10000) return `${symbol}${t('common.wan', { value: (value / 10000).toFixed(1) })}`;
  return `${symbol}${value.toLocaleString()}`;
}

/* ── Hook ── */

export function useLocationsData() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();

  const tree = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });

  const items = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.list(),
  });

  const index = useMemo(() => buildIndex(tree.data?.tree), [tree.data]);
  const allItems = items.data?.items ?? [];

  const itemCountByLocation = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of allItems) {
      if (!it.location_id) continue;
      map.set(it.location_id, (map.get(it.location_id) ?? 0) + 1);
    }
    return map;
  }, [allItems]);

  function subtreeItemCount(id: string): number {
    const ids = collectSubtreeIds(index, id);
    let n = 0;
    for (const sid of ids) n += itemCountByLocation.get(sid) ?? 0;
    return n;
  }

  const physicalRoots = index.roots.filter((r) => r.type !== 'virtual');
  const virtualRoots = index.roots.filter((r) => r.type === 'virtual');

  /* ── Mutations ── */

  const createMutation = useMutation({
    mutationFn: (body: { name: string; parent_id?: string; type: LocationType; is_private: boolean }) =>
      locationsApi.create({ name: body.name, parent_id: body.parent_id, type: body.type, is_private: body.is_private }),
    onSuccess: () => {
      toast.show(t('locations.created'));
      qc.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (e: Error) => toast.show(t('locations.createFailed', { error: e.message })),
  });

  const editMutation = useMutation({
    mutationFn: (body: { id: string; name: string; type: LocationType }) =>
      locationsApi.update(body.id, { name: body.name, type: body.type }),
    onSuccess: () => {
      toast.show(t('locations.updated'));
      qc.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (e: Error) => toast.show(t('locations.updateFailed', { error: e.message })),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => locationsApi.delete(id),
    onSuccess: () => {
      toast.show(t('locations.deleted'));
      qc.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (e: Error) => toast.show(t('locations.deleteFailed', { error: e.message })),
  });

  const qrMutation = useMutation({
    mutationFn: (id: string) => locationsApi.generateQRCode(id),
    onSuccess: () => {
      toast.show(t('locations.qrGenerated'));
      qc.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (e: Error) => toast.show(t('locations.qrGenerateFailed', { error: e.message })),
  });

  return {
    t,
    tree,
    items,
    index,
    allItems,
    itemCountByLocation,
    subtreeItemCount,
    physicalRoots,
    virtualRoots,
    createMutation,
    editMutation,
    deleteMutation,
    qrMutation,
  };
}
