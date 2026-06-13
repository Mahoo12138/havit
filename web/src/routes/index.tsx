import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  IconArrowRight,
  IconBarcode,
  IconBox,
  IconBuildingWarehouse,
  IconCategory2,
  IconClipboardList,
  IconCoin,
  IconDatabaseExport,
  IconFileImport,
  IconMap2,
  IconPackage,
  IconPhoto,
  IconPlus,
  type Icon,
} from '@tabler/icons-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, ScrollArea, uiStyles } from '../components/ui';
import { authApi, itemsApi, locationsApi, remindersApi, type Item, type Location } from '../api/client';

export const Route = createFileRoute('/')({
  component: Dashboard,
});

function countLocations(nodes: Location[] | undefined): number {
  if (!nodes) return 0;
  let n = 0;
  for (const node of nodes) {
    n += 1;
    n += countLocations(node.children);
  }
  return n;
}

function formatGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 5) return t('greeting.night');
  if (hour < 11) return t('greeting.morning');
  if (hour < 13) return t('greeting.noon');
  if (hour < 18) return t('greeting.afternoon');
  return t('greeting.evening');
}

function formatPrice(value: number, t: (key: string, opts?: any) => string): string {
  const symbol = t('common.currencySymbol');
  if (value >= 10000) return `${symbol}${t('common.wan', { value: (value / 10000).toFixed(1) })}`;
  return `${symbol}${value.toLocaleString()}`;
}

function formatDateShort(ts: number): string {
  const d = new Date(ts * 1000);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}/${day}`;
}

const CATEGORY_PALETTE = ['teal', 'info', 'warning', 'violet', 'amber', 'danger'] as const;

const STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'danger'> = {
  in_stock: 'info',
  in_use: 'neutral',
  loaned: 'warning',
  archived: 'neutral',
  consumed: 'neutral',
  lost: 'danger',
};

const quickActions: Array<{
  to: string;
  translationKey: string;
  icon: Icon;
  tone: 'teal' | 'info' | 'warning' | 'violet' | 'amber' | 'success';
}> = [
  { to: '/assets', translationKey: 'quickAction.newItem', icon: IconPlus, tone: 'teal' },
  { to: '/capture', translationKey: 'quickAction.scan', icon: IconBarcode, tone: 'info' },
  { to: '/locations', translationKey: 'quickAction.manageLocations', icon: IconMap2, tone: 'violet' },
  { to: '/loans', translationKey: 'quickAction.registerLoan', icon: IconClipboardList, tone: 'warning' },
  { to: '/import', translationKey: 'quickAction.batchImport', icon: IconFileImport, tone: 'amber' },
  { to: '/operations', translationKey: 'quickAction.export', icon: IconDatabaseExport, tone: 'success' },
];

function Dashboard() {
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

  const totals = useMemo(() => {
    const totalValue = allItems.reduce(
      (sum, it) => sum + (it.purchase_price ?? 0),
      0,
    );
    const categories = new Set(
      allItems
        .map((i) => i.category)
        .filter((c): c is string => Boolean(c && c.trim())),
    );
    const inStock = allItems.filter((i) => i.status === 'in_stock').length;
    const inUse = allItems.filter((i) => i.status === 'in_use').length;
    return {
      totalItems: allItems.length,
      totalValue,
      categoryCount: categories.size,
      inStock,
      inUse,
    };
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
    return [...allItems]
      .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
      .slice(0, 5);
  }, [allItems]);

  const locationTotal = locs.data ? countLocations(locs.data.tree) : undefined;

  return (
    <div className={uiStyles.dashboardLayout}>
      <div className={uiStyles.dashboardMain}>
        <Greeting username={me.data?.username} />

        <div className={uiStyles.kpiStrip}>
          <Kpi
            icon={IconPackage}
            label={t('kpi.totalItems')}
            value={totals.totalItems}
            tone="teal"
            loading={items.isPending}
          />
          <Kpi
            icon={IconCoin}
            label={t('kpi.totalValue')}
            value={
              totals.totalValue > 0 ? formatPrice(totals.totalValue, t) : '—'
            }
            tone="warning"
            loading={items.isPending}
          />
          <Kpi
            icon={IconCategory2}
            label={t('kpi.categories')}
            value={totals.categoryCount}
            tone="info"
            loading={items.isPending}
          />
          <Kpi
            icon={IconBox}
            label={t('kpi.inStock')}
            value={totals.inStock}
            tone="violet"
            loading={items.isPending}
          />
          <Kpi
            icon={IconBuildingWarehouse}
            label={t('kpi.locations')}
            value={locationTotal ?? '—'}
            tone="danger"
            loading={locs.isPending}
          />
        </div>

        <CategoryOverview categories={categoryBreakdown} empty={!items.isPending && categoryBreakdown.length === 0} />

        <RecentAdditions items={recent} empty={!items.isPending && recent.length === 0} />
      </div>

      <aside className={uiStyles.dashboardRail}>
        <QuickActionsCard />
        <RemindersCard reminders={reminders.data?.reminders ?? []} loading={reminders.isPending} />
        <LocationsCard tree={locs.data?.tree ?? []} loading={locs.isPending} />
      </aside>
    </div>
  );
}

function Greeting({ username }: { username: string | undefined }) {
  const { t } = useTranslation();
  return (
    <div className={uiStyles.greetingRow}>
      <div>
        <h1 className="page-heading">
          {formatGreeting(t)}，{username ?? t('common.friend')} <span aria-hidden>👋</span>
        </h1>
        <p className="page-kicker">{t('dashboard.subtitle')}</p>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: Icon;
  label: string;
  value: number | string;
  tone: keyof typeof uiStyles.kpiIcon;
  loading?: boolean;
}) {
  return (
    <div className={uiStyles.kpiTile}>
      <span className={uiStyles.kpiIcon[tone]}>
        <Icon size={20} />
      </span>
      <div className={uiStyles.kpiMeta}>
        <span className={uiStyles.kpiLabel}>{label}</span>
        <span className={uiStyles.kpiValue}>{loading ? '—' : value}</span>
      </div>
    </div>
  );
}

function CategoryOverview({
  categories,
  empty,
}: {
  categories: Array<[string, number]>;
  empty: boolean;
}) {
  const { t } = useTranslation();
  return (
    <section className={uiStyles.sectionCard}>
      <header className={uiStyles.sectionHead}>
        <h2 className={uiStyles.sectionTitle}>{t('dashboard.assetOverview')}</h2>
        <Link to="/assets" className={uiStyles.sectionLink}>
          {t('common.all')} <IconArrowRight size={14} />
        </Link>
      </header>
      <div className={uiStyles.sectionBody}>
        {empty ? (
          <EmptyHint
            icon={<IconCategory2 size={20} />}
            title={t('dashboard.noCategories')}
            sub={t('dashboard.noCategoriesHint')}
          />
        ) : (
          <div className={uiStyles.categoryRow}>
            {categories.map(([name, count], idx) => {
              const tone = CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length];
              return (
                <Link
                  key={name}
                  className={uiStyles.categoryTile}
                  to="/assets"
                  search={{ category: name } as never}
                >
                  <div className={uiStyles.categoryThumb[tone]}>
                    <IconPhoto size={22} />
                  </div>
                  <span className={uiStyles.categoryName}>{name}</span>
                  <span className={uiStyles.categoryCount}>{count} {t('common.items')}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function RecentAdditions({ items, empty }: { items: Item[]; empty: boolean }) {
  const { t } = useTranslation();
  const statusLabel = (status: string): string => {
    const key = `status.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  return (
    <section className={uiStyles.sectionCard}>
      <header className={uiStyles.sectionHead}>
        <h2 className={uiStyles.sectionTitle}>{t('dashboard.recentAdditions')}</h2>
        <Link to="/assets" className={uiStyles.sectionLink}>
          {t('dashboard.viewAll')} <IconArrowRight size={14} />
        </Link>
      </header>
      {empty ? (
        <div className={uiStyles.sectionBody}>
          <EmptyHint
            icon={<IconPackage size={20} />}
            title={t('dashboard.noItems')}
            sub={t('dashboard.noItemsHint')}
          />
        </div>
      ) : (
        <div className={uiStyles.recentList}>
          {items.map((it) => {
            const variant = STATUS_VARIANT[it.status] ?? 'neutral';
            const variantClass =
              variant === 'info'
                ? uiStyles.tagChipInfo
                : variant === 'warning'
                  ? uiStyles.tagChipWarning
                  : variant === 'danger'
                    ? uiStyles.tagChip
                    : uiStyles.tagChipNeutral;
            return (
              <Link
                key={it.id}
                to="/items/$itemId"
                params={{ itemId: it.id }}
                className={uiStyles.recentRow}
              >
                <span className={uiStyles.recentThumb}>
                  <IconPhoto size={20} />
                </span>
                <div className={uiStyles.recentMeta}>
                  <span className={uiStyles.recentName}>{it.name}</span>
                  <span className={uiStyles.recentSub}>
                    {it.category ?? t('common.uncategorized')} · {formatDateShort(it.created_at)}
                  </span>
                </div>
                <div className={uiStyles.recentTags}>
                  <span className={variantClass}>
                    {statusLabel(it.status)}
                  </span>
                </div>
                <span className={uiStyles.recentPrice}>
                  {it.purchase_price ? formatPrice(it.purchase_price, t) : '—'}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function QuickActionsCard() {
  const { t } = useTranslation();
  return (
    <section className={uiStyles.sectionCard}>
      <header className={uiStyles.sectionHead}>
        <h2 className={uiStyles.sectionTitle}>{t('dashboard.quickActions')}</h2>
      </header>
      <div className={uiStyles.sectionBody}>
        <div className={uiStyles.quickActionsGrid}>
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <Link key={qa.to} to={qa.to} className={uiStyles.quickAction}>
                <span className={uiStyles.quickActionIcon[qa.tone]}>
                  <Icon size={18} />
                </span>
                {t(qa.translationKey)}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RemindersCard({ reminders, loading }: { reminders: any[]; loading: boolean }) {
  const { t } = useTranslation();
  return (
    <section className={uiStyles.sectionCard}>
      <header className={uiStyles.sectionHead}>
        <h2 className={uiStyles.sectionTitle}>{t('dashboard.reminders')}</h2>
        <Link to="/operations" className={uiStyles.sectionLink}>
          {t('dashboard.manage')} <IconArrowRight size={14} />
        </Link>
      </header>
      <div className={uiStyles.sectionBody}>
        {loading ? (
          <div className={uiStyles.reminderEmpty}>{t('common.loading')}</div>
        ) : reminders.length === 0 ? (
          <div className={uiStyles.reminderEmpty}>{t('dashboard.noReminders')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {reminders.slice(0, 5).map((r) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{t(`reminder.${r.type}`, r.type)} — {r.item_id}</span>
                <Badge>{r.is_dismissed ? t('operations.dismissed') : r.sent_at ? t('operations.sent') : t('operations.pending')}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function LocationsCard({
  tree,
  loading,
}: {
  tree: Location[];
  loading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <section className={uiStyles.sectionCard}>
      <header className={uiStyles.sectionHead}>
        <h2 className={uiStyles.sectionTitle}>{t('dashboard.locations')}</h2>
        <Link to="/locations" className={uiStyles.sectionLink}>
          {t('dashboard.manage')} <IconArrowRight size={14} />
        </Link>
      </header>
      <ScrollArea className={uiStyles.locationTreeWrap}>
        {loading ? (
          <div className={uiStyles.reminderEmpty}>{t('common.loading')}</div>
        ) : tree.length === 0 ? (
          <div className={uiStyles.reminderEmpty}>{t('dashboard.noLocations')}</div>
        ) : (
          tree.slice(0, 8).map((node) => (
            <div key={node.id} className={uiStyles.locationNode}>
              <IconMap2 size={15} />
              <span>{node.name}</span>
              {node.children && node.children.length > 0 && (
                <span className={uiStyles.locationNodeMuted}>
                  {node.children.length}
                </span>
              )}
            </div>
          ))
        )}
      </ScrollArea>
    </section>
  );
}

function EmptyHint({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: '0.5rem', padding: '1.5rem 0', textAlign: 'center' }}>
      <span className={uiStyles.iconTile}>{icon}</span>
      <strong>{title}</strong>
      <span className={uiStyles.muted}>{sub}</span>
    </div>
  );
}
