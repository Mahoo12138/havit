import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { IconBriefcase, IconPackage, IconRun } from '@tabler/icons-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { useToast } from '../../components/ui/use-toast';
import { essentialsBulkApi, suppliesExtendedApi, type Item } from '../../api/client';
import { getStatusType, getStatusLabel, STATUS_TONE } from './shared';
import * as s from './EssentialsDesktop.css';

const RANK: Record<string, number> = { away: 0, home: 0, bag: 1, carry: 2 };

export function DepartureList({ items }: { items: Item[] }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const invalidateEssentials = () =>
    queryClient.invalidateQueries({ queryKey: ['items', 'essentials'] });

  const bulkStatus = useMutation({
    mutationFn: ({ ids, tag }: { ids: string[]; tag: string }) =>
      essentialsBulkApi.bulkStatus(ids, tag),
    onSuccess: (_data, vars) => {
      toast.show(vars.tag === 'carry' ? t('essentials.iveGotAll') : t('items.statusUpdated'));
      setSelected(new Set());
      invalidateEssentials();
    },
    onError: (error: Error) => toast.show(t('items.statusUpdateFailed', { error: error.message })),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, tag }: { id: string; tag: string }) =>
      suppliesExtendedApi.setEssentialsStatus(id, { current_status_tag: tag }),
    onSuccess: () => invalidateEssentials(),
    onError: (error: Error) => toast.show(t('items.statusUpdateFailed', { error: error.message })),
  });

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const rankDiff = RANK[getStatusType(a)] - RANK[getStatusType(b)];
        return rankDiff !== 0 ? rankDiff : a.name.localeCompare(b.name);
      }),
    [items],
  );

  const withYou = items.filter((i) => ['carry', 'bag'].includes(getStatusType(i))).length;
  const selectableIds = sortedItems.map((item) => item.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const busy = bulkStatus.isPending || setStatus.isPending;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function markSelected(tag: string) {
    if (selected.size === 0) return;
    bulkStatus.mutate({ ids: [...selected], tag });
  }

  return (
    <Card className={s.ledgerCard} padded={false}>
      <div className={s.toolbar}>
        <div className={s.toolbarLeft}>
          <span className={s.hintText}>{t('essentials.departureChecklistHint')}</span>
          <span className={s.badge.info}>
            {t('essentials.departureProgress', { count: withYou, total: items.length })}
          </span>
        </div>
      </div>

      <Table style={{ minWidth: '48rem', whiteSpace: 'nowrap' }}>
        <TableHeader>
          <TableRow>
            <TableHead className={s.checkCol}>
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label={t('essentials.selectAll')}
              />
            </TableHead>
            <TableHead>{t('essentials.item')}</TableHead>
            <TableHead>{t('essentials.currentStatusShort')}</TableHead>
            <TableHead>{t('essentials.action')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map((item) => {
            const statusType = getStatusType(item);
            return (
              <TableRow key={item.id}>
                <TableCell className={s.checkCol}>
                  <Checkbox
                    checked={selected.has(item.id)}
                    onCheckedChange={() => toggleOne(item.id)}
                    aria-label={item.name}
                  />
                </TableCell>
                <TableCell>
                  <div className={s.itemInfo}>
                    <div className={s.itemThumb}><IconPackage size={16} /></div>
                    <div className={s.itemMeta}>
                      <Link to="/items/$itemId" params={{ itemId: item.id }} className={s.itemName}>{item.name}</Link>
                      <span className={s.itemSub}>{item.category ?? t('common.uncategorized')}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={s.badge[STATUS_TONE[statusType]]}>{getStatusLabel(t, item)}</span>
                </TableCell>
                <TableCell>
                  <div className={s.actionGroup}>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy || statusType === 'carry'}
                      onClick={() => setStatus.mutate({ id: item.id, tag: 'carry' })}
                    >
                      <IconRun size={12} />
                      {t('essentials.carry')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy || statusType === 'bag'}
                      onClick={() => setStatus.mutate({ id: item.id, tag: 'travel_bag' })}
                    >
                      <IconBriefcase size={12} />
                      {t('essentials.travelBag')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {sortedItems.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <div className={s.empty}>{t('essentials.noEdc')}</div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {sortedItems.length > 0 && (
        <div className={s.checklistBar}>
          <span className={s.muted}>
            {t('essentials.selectedCount', { count: selected.size })}
          </span>
          <div className={s.actionGroup}>
            <Button variant="outline" size="sm" disabled={busy || selected.size === 0} onClick={() => markSelected('travel_bag')}>
              {t('essentials.markAs', { status: t('essentials.travelBag') })}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={busy || selected.size === 0}
              onClick={() => markSelected('carry')}
            >
              {t('essentials.markAs', { status: t('essentials.carry') })}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
