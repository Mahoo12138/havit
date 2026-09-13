import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
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
  IconPlus,
  type Icon,
} from '@tabler/icons-react';
import { uiStyles } from '../../components/ui';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Tag } from '../../components/ui/tag';
import type { Item, Location } from '../../api/client';
import { ReminderRow } from '../reminders/reminderUi';
import {
  useDashboardData,
  formatGreeting,
  formatPrice,
  formatDateShort,
  CATEGORY_PALETTE,
  STATUS_VARIANT,
} from './useDashboardData';

const quickActions: Array<{
  to: string;
  translationKey: string;
  icon: Icon;
}> = [
  { to: '/assets', translationKey: 'quickAction.newItem', icon: IconPlus },
  { to: '/capture', translationKey: 'quickAction.scan', icon: IconBarcode },
  { to: '/locations', translationKey: 'quickAction.manageLocations', icon: IconMap2 },
  { to: '/loans', translationKey: 'quickAction.registerLoan', icon: IconClipboardList },
  { to: '/import', translationKey: 'quickAction.batchImport', icon: IconFileImport },
  { to: '/operations', translationKey: 'quickAction.export', icon: IconDatabaseExport },
];

export function DashboardDesktop() {
  const { t, me, items, locs, reminders, totals, categoryBreakdown, recent, locationTotal } =
    useDashboardData();

  return (
    <div className={uiStyles.dashboardLayout}>
      <div className={uiStyles.dashboardMain}>
        <Greeting username={me.data?.username} />

        <div className={uiStyles.kpiStrip}>
          <Kpi icon={IconPackage} label={t('kpi.totalItems')} value={totals.totalItems} loading={items.isPending} />
          <Kpi icon={IconCoin} label={t('kpi.totalValue')} value={formatPrice(totals.totalValue, t)} loading={items.isPending} />
          <Kpi icon={IconCategory2} label={t('kpi.categories')} value={totals.categoryCount} loading={items.isPending} />
          <Kpi icon={IconBox} label={t('kpi.inStock')} value={totals.inStock} loading={items.isPending} />
          <Kpi icon={IconBuildingWarehouse} label={t('kpi.locations')} value={locationTotal ?? '—'} loading={locs.isPending} />
        </div>

        <CategoryOverview categories={categoryBreakdown} empty={!items.isPending && categoryBreakdown.length === 0} />
        <RecentAdditions items={recent} loading={items.isPending} empty={!items.isPending && recent.length === 0} />
      </div>

      <aside className={uiStyles.dashboardRail}>
        <QuickActionsCard />
        <RemindersCard
          reminders={reminders.data?.reminders ?? []}
          loading={reminders.isPending}
        />
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
          {formatGreeting(t)}，{username ?? t('common.friend')}
        </h1>
        <p className="page-kicker">{t('dashboard.subtitle')}</p>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon, label, value, loading,
}: {
  icon: Icon;
  label: string;
  value: number | string;
  loading?: boolean;
}) {
  return (
    <div className={uiStyles.kpiTile}>
      <div className={uiStyles.kpiMeta}>
        <span className={uiStyles.kpiIcon}><Icon size={14} /></span>
        <span className={uiStyles.kpiLabel}>{label}</span>
      </div>
      {loading ? (
        <span className={uiStyles.skeletonLine} style={{ width: '3.5rem', height: '1.5rem' }} />
      ) : (
        <span className={uiStyles.kpiValue}>{value}</span>
      )}
    </div>
  );
}

function CategoryOverview({ categories, empty }: { categories: Array<[string, number]>; empty: boolean }) {
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
                <Link key={name} className={uiStyles.categoryTile} to="/assets" search={{ category: name } as never}>
                  <div className={uiStyles.categoryThumb[tone]}>
                    <span className={uiStyles.categoryInitial}>{name.slice(0, 1)}</span>
                  </div>
                  <div className={uiStyles.categoryMeta}>
                    <span className={uiStyles.categoryName}>{name}</span>
                    <span className={uiStyles.categoryCount}>{count} {t('common.items')}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function RecentAdditions({ items, loading, empty }: { items: Item[]; loading?: boolean; empty: boolean }) {
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
          <EmptyHint icon={<IconPackage size={20} />} title={t('dashboard.noItems')} sub={t('dashboard.noItemsHint')} />
        </div>
      ) : loading ? (
        <div className={uiStyles.sectionBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={uiStyles.skeletonLine} style={{ width: `${78 - i * 14}%` }} />
          ))}
        </div>
      ) : (
        <div className={uiStyles.recentList}>
          {items.map((it) => {
            const variant = STATUS_VARIANT[it.status] ?? 'neutral';
            return (
              <Link key={it.id} to="/items/$itemId" params={{ itemId: it.id }} className={uiStyles.recentRow}>
                <span className={uiStyles.recentThumb}>{it.name.slice(0, 1)}</span>
                <div className={uiStyles.recentMeta}>
                  <span className={uiStyles.recentName}>{it.name}</span>
                  <span className={uiStyles.recentSub}>
                    {it.category ?? t('common.uncategorized')} · {formatDateShort(it.created_at)}
                  </span>
                </div>
                <div className={uiStyles.recentTags}>
                  <Tag variant={variant}>{statusLabel(it.status)}</Tag>
                </div>
                {it.purchase_price ? (
                  <span className={uiStyles.recentPrice}>{formatPrice(it.purchase_price, t)}</span>
                ) : (
                  <span className={uiStyles.recentPrice} />
                )}
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
                <span className={uiStyles.quickActionIcon}><Icon size={18} /></span>
                {t(qa.translationKey)}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RemindersCard({
  reminders,
  loading,
}: {
  reminders: any[];
  loading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <section className={uiStyles.sectionCard}>
      <header className={uiStyles.sectionHead}>
        <h2 className={uiStyles.sectionTitle}>{t('dashboard.reminders')}</h2>
        <Link to="/reminders" className={uiStyles.sectionLink}>
          {t('dashboard.viewAll')} <IconArrowRight size={14} />
        </Link>
      </header>
      <div className={uiStyles.sectionBody}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <span className={uiStyles.skeletonLine} style={{ width: '80%' }} />
            <span className={uiStyles.skeletonLine} style={{ width: '60%' }} />
          </div>
        ) : reminders.length === 0 ? (
          <div className={uiStyles.reminderEmpty}>{t('dashboard.noReminders')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {reminders.slice(0, 5).map((r: any) => (
              <ReminderRow key={r.id} reminder={r} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function LocationsCard({ tree, loading }: { tree: Location[]; loading: boolean }) {
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <span className={uiStyles.skeletonLine} style={{ width: '70%' }} />
            <span className={uiStyles.skeletonLine} style={{ width: '50%' }} />
          </div>
        ) : tree.length === 0 ? (
          <div className={uiStyles.reminderEmpty}>{t('dashboard.noLocations')}</div>
        ) : (
          tree.slice(0, 8).map((node) => (
            <div key={node.id} className={uiStyles.locationNode}>
              <IconMap2 size={15} />
              <span>{node.name}</span>
              {node.children && node.children.length > 0 && (
                <span className={uiStyles.locationNodeMuted}>{node.children.length}</span>
              )}
            </div>
          ))
        )}
      </ScrollArea>
    </section>
  );
}

function EmptyHint({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: '0.5rem', padding: '1.5rem 0', textAlign: 'center' }}>
      <span className={uiStyles.iconTile}>{icon}</span>
      <strong>{title}</strong>
      <span className={uiStyles.muted}>{sub}</span>
    </div>
  );
}
