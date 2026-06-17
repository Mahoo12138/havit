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
  IconPhoto,
  IconPlus,
  type Icon,
} from '@tabler/icons-react';
import { Badge } from '../../components/ui';
import type { Item } from '../../api/client';
import {
  useDashboardData,
  formatGreeting,
  formatPrice,
  formatDateShort,
  CATEGORY_PALETTE,
  STATUS_VARIANT,
} from './useDashboardData';
import * as s from './dashboardMobile.css';

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

export function DashboardMobile() {
  const { t, me, items, locs, reminders, totals, categoryBreakdown, recent, locationTotal } =
    useDashboardData();

  return (
    <div className={s.page}>
      {/* Greeting */}
      <div className={s.greeting}>
        <h1 className={s.greetingTitle}>
          {formatGreeting(t)}，{me.data?.username ?? t('common.friend')}
        </h1>
        <p className={s.greetingSub}>{t('dashboard.subtitle')}</p>
      </div>

      {/* KPI horizontal scroll */}
      <div className={s.kpiScroll}>
        <KpiCard icon={IconPackage} label={t('kpi.totalItems')} value={totals.totalItems} tone="teal" loading={items.isPending} />
        <KpiCard icon={IconCoin} label={t('kpi.totalValue')} value={totals.totalValue > 0 ? formatPrice(totals.totalValue, t) : '—'} tone="warning" loading={items.isPending} />
        <KpiCard icon={IconCategory2} label={t('kpi.categories')} value={totals.categoryCount} tone="info" loading={items.isPending} />
        <KpiCard icon={IconBox} label={t('kpi.inStock')} value={totals.inStock} tone="violet" loading={items.isPending} />
        <KpiCard icon={IconBuildingWarehouse} label={t('kpi.locations')} value={locationTotal ?? '—'} tone="danger" loading={locs.isPending} />
      </div>

      {/* Quick actions */}
      <section className={s.section}>
        <header className={s.sectionHead}>
          <h2 className={s.sectionTitle}>{t('dashboard.quickActions')}</h2>
        </header>
        <div className={s.sectionBody}>
          <div className={s.quickGrid}>
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <Link key={qa.to} to={qa.to} className={s.quickItem}>
                  <span className={s.quickIcon[qa.tone]}><Icon size={18} /></span>
                  {t(qa.translationKey)}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Category overview */}
      <section className={s.section}>
        <header className={s.sectionHead}>
          <h2 className={s.sectionTitle}>{t('dashboard.assetOverview')}</h2>
          <Link to="/assets" className={s.sectionLink}>
            {t('common.all')} <IconArrowRight size={14} />
          </Link>
        </header>
        <div className={s.sectionBody}>
          {!items.isPending && categoryBreakdown.length === 0 ? (
            <EmptyState
              icon={<IconCategory2 size={20} />}
              title={t('dashboard.noCategories')}
              sub={t('dashboard.noCategoriesHint')}
            />
          ) : (
            <div className={s.catScroll}>
              {categoryBreakdown.map(([name, count], idx) => {
                const tone = CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length];
                return (
                  <Link key={name} className={s.catTile} to="/assets" search={{ category: name } as never}>
                    <div className={s.catThumb[tone]}><IconPhoto size={18} /></div>
                    <span className={s.catName}>{name}</span>
                    <span className={s.catCount}>{count} {t('common.items')}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Recent additions */}
      <section className={s.section}>
        <header className={s.sectionHead}>
          <h2 className={s.sectionTitle}>{t('dashboard.recentAdditions')}</h2>
          <Link to="/assets" className={s.sectionLink}>
            {t('dashboard.viewAll')} <IconArrowRight size={14} />
          </Link>
        </header>
        {!items.isPending && recent.length === 0 ? (
          <div className={s.sectionBody}>
            <EmptyState
              icon={<IconPackage size={20} />}
              title={t('dashboard.noItems')}
              sub={t('dashboard.noItemsHint')}
            />
          </div>
        ) : (
          recent.map((it) => <RecentRow key={it.id} item={it} />)
        )}
      </section>

      {/* Reminders */}
      <section className={s.section}>
        <header className={s.sectionHead}>
          <h2 className={s.sectionTitle}>{t('dashboard.reminders')}</h2>
          <Link to="/operations" className={s.sectionLink}>
            {t('dashboard.manage')} <IconArrowRight size={14} />
          </Link>
        </header>
        <div className={s.sectionBody}>
          {reminders.isPending ? (
            <div className={s.reminderEmpty}>{t('common.loading')}</div>
          ) : (reminders.data?.reminders ?? []).length === 0 ? (
            <div className={s.reminderEmpty}>{t('dashboard.noReminders')}</div>
          ) : (
            (reminders.data?.reminders ?? []).slice(0, 5).map((r: any) => (
              <div key={r.id} className={s.reminderRow}>
                <span>{t(`reminder.${r.type}`, r.type)} — {r.item_id}</span>
                <Badge>{r.is_dismissed ? t('operations.dismissed') : r.sent_at ? t('operations.sent') : t('operations.pending')}</Badge>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Locations */}
      <section className={s.section}>
        <header className={s.sectionHead}>
          <h2 className={s.sectionTitle}>{t('dashboard.locations')}</h2>
          <Link to="/locations" className={s.sectionLink}>
            {t('dashboard.manage')} <IconArrowRight size={14} />
          </Link>
        </header>
        <div className={s.sectionBody}>
          {locs.isPending ? (
            <div className={s.reminderEmpty}>{t('common.loading')}</div>
          ) : (locs.data?.tree ?? []).length === 0 ? (
            <div className={s.reminderEmpty}>{t('dashboard.noLocations')}</div>
          ) : (
            (locs.data?.tree ?? []).slice(0, 8).map((node) => {
              const childCount = node.children?.length ?? 0;
              return (
              <div key={node.id} className={s.locationNode}>
                <IconMap2 size={15} />
                <span>{node.name}</span>
                {childCount > 0 && (
                  <span className={s.locationCount}>{childCount}</span>
                )}
              </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

/* ── sub-components ── */

function KpiCard({
  icon: Icon, label, value, tone, loading,
}: {
  icon: Icon;
  label: string;
  value: number | string;
  tone: keyof typeof s.kpiIconSm;
  loading?: boolean;
}) {
  return (
    <div className={s.kpiCard}>
      <span className={s.kpiIconSm[tone]}><Icon size={18} /></span>
      <span className={s.kpiLabel}>{label}</span>
      <span className={s.kpiValue}>{loading ? '—' : value}</span>
    </div>
  );
}

function RecentRow({ item: it }: { item: Item }) {
  const { t } = useTranslation();
  const statusLabel = (status: string): string => {
    const key = `status.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  const variant = STATUS_VARIANT[it.status] ?? 'neutral';
  const tagClass =
    variant === 'info' ? s.tagInfo
    : variant === 'warning' ? s.tagWarning
    : s.tagNeutral;

  return (
    <Link to="/items/$itemId" params={{ itemId: it.id }} className={s.recentCard}>
      <span className={s.recentThumb}><IconPhoto size={18} /></span>
      <div className={s.recentMeta}>
        <span className={s.recentName}>{it.name}</span>
        <span className={s.recentSub}>
          {it.category ?? t('common.uncategorized')} · {formatDateShort(it.created_at)}
        </span>
      </div>
      <div className={s.recentRight}>
        <span className={tagClass}>{statusLabel(it.status)}</span>
        <span className={s.recentPrice}>
          {it.purchase_price ? formatPrice(it.purchase_price, t) : '—'}
        </span>
      </div>
    </Link>
  );
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className={s.emptyState}>
      <span className={s.emptyIcon}>{icon}</span>
      <strong>{title}</strong>
      <span style={{ color: 'var(--color-muted, #7b8497)', fontSize: '0.82rem' }}>{sub}</span>
    </div>
  );
}
