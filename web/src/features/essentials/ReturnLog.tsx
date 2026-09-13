import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  usePaginationRange,
} from '../../components/ui/pagination';
import { Card } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { essentialsBulkApi, locationsApi, type EssentialsEvent } from '../../api/client';
import { flattenLocations, formatDateTime, formatRelative, tagLabel } from './shared';
import * as s from './EssentialsDesktop.css';

const PAGE_SIZE = 20;

type EventFilter = 'all' | 'essentials_returned_home' | 'essentials_status_changed';

interface EventSnapshot {
  tag?: string | null;
  location_id?: string | null;
}

interface EventPayloadShape {
  from?: EventSnapshot;
  to?: EventSnapshot;
}

function parsePayload(payload?: string): EventPayloadShape | null {
  if (!payload) return null;
  try {
    return JSON.parse(payload) as EventPayloadShape;
  } catch {
    return null;
  }
}

export function ReturnLog() {
  const { t } = useTranslation();
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [offset, setOffset] = useState(0);

  const { data: locData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.tree(),
  });
  const locOptions = flattenLocations(locData?.tree);

  const { data, isLoading } = useQuery({
    queryKey: ['essentials', 'events', eventFilter, offset],
    queryFn: () =>
      essentialsBulkApi.listEvents({
        event_type: eventFilter === 'all' ? undefined : eventFilter,
        limit: PAGE_SIZE,
        offset,
      }),
  });

  const events: EssentialsEvent[] = data?.events ?? [];
  const total = data?.total ?? 0;

  function describe(snapshot?: EventSnapshot): string {
    if (!snapshot) return '—';
    const tag = snapshot.tag ? tagLabel(t, snapshot.tag) : null;
    const loc = snapshot.location_id
      ? locOptions.find((option) => option.value === snapshot.location_id)?.label
      : null;
    // No tag and no location means the item sits at its home base (the
    // return-home transition clears both); otherwise show whichever exists.
    if (!tag && !loc) return t('essentials.homeBaseShort');
    return [tag, loc].filter(Boolean).join(' · ');
  }

  function changeText(event: EssentialsEvent): string {
    const payload = parsePayload(event.payload);
    if (!payload?.from && !payload?.to) return '—';
    return `${describe(payload.from)} → ${describe(payload.to)}`;
  }

  return (
    <Card className={s.ledgerCard} padded={false}>
      <div className={s.toolbar}>
        <div className={s.toolbarLeft}>
          <FilterSelect
            label={t('essentials.eventType')}
            options={[
              { value: 'all', label: t('essentials.allTypes') },
              { value: 'essentials_returned_home', label: t('events.essentials_returned_home') },
              { value: 'essentials_status_changed', label: t('events.essentials_status_changed') },
            ]}
            value={eventFilter}
            onChange={(value) => {
              setEventFilter(value as EventFilter);
              setOffset(0);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className={s.tableScroll}>
          <table className={s.table}>
            <thead>
              <tr>
                <th className={s.tableHead}>{t('essentials.time')}</th>
                <th className={s.tableHead}>{t('essentials.item')}</th>
                <th className={s.tableHead}>{t('essentials.action')}</th>
                <th className={s.tableHead}>{t('essentials.change')}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr className={s.tableRow} key={event.id}>
                  <td className={`${s.tableCell} ${s.muted}`}>
                    <div className={s.itemMeta}>
                      <span>{formatRelative(t, event.created_at)}</span>
                      <span className={s.itemSub}>{formatDateTime(event.created_at)}</span>
                    </div>
                  </td>
                  <td className={s.tableCell}>
                    <Link to="/items/$itemId" params={{ itemId: event.item_id }} className={s.itemName}>
                      {event.item_name}
                    </Link>
                  </td>
                  <td className={s.tableCell}>
                    {event.event_type === 'essentials_returned_home' ? (
                      <span className={s.badge.success}>{t('events.essentials_returned_home')}</span>
                    ) : (
                      <span className={s.badge.info}>{t('events.essentials_status_changed')}</span>
                    )}
                  </td>
                  <td className={`${s.tableCell} ${s.muted} ${s.changeText}`}>{changeText(event)}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td className={s.tableCell} colSpan={4}>
                    <div className={s.empty}>{t('essentials.returnLogEmpty')}</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <div className={s.footerBar}>
          <span>共 {total} 条</span>
          <ReturnLogPager
            offset={offset}
            total={total}
            onOffsetChange={setOffset}
          />
        </div>
      )}
    </Card>
  );
}

function FilterSelect({ label, options, value, onChange }: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (typeof nextValue === 'string') onChange(nextValue);
      }}
      items={options}
    >
      <SelectTrigger className={s.filterSelectTrigger} size="sm" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function ReturnLogPager({
  offset,
  total,
  onOffsetChange,
}: {
  offset: number;
  total: number;
  onOffsetChange: (offset: number) => void;
}) {
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const range = usePaginationRange({ page, totalPages });

  const goTo = (next: number) => onOffsetChange((next - 1) * PAGE_SIZE);

  return (
    <Pagination className={s.pagination}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious disabled={page === 1} onClick={() => goTo(page - 1)} />
        </PaginationItem>
        {range.map((p) => (
          <PaginationItem key={p}>
            {typeof p === 'number' ? (
              <PaginationLink isActive={p === page} onClick={() => goTo(p)}>
                {p}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext disabled={offset + PAGE_SIZE >= total} onClick={() => goTo(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
