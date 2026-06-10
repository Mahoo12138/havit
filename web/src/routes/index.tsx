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
import { uiStyles } from '../components/ui';
import { authApi, itemsApi, locationsApi, type Item, type Location } from '../api/client';

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

function formatGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return '夜深了';
  if (hour < 11) return '早上好';
  if (hour < 13) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function formatPrice(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return value.toLocaleString('zh-CN');
}

function formatDateShort(ts: number): string {
  const d = new Date(ts * 1000);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}/${day}`;
}

const CATEGORY_PALETTE = ['teal', 'info', 'warning', 'violet', 'amber', 'danger'] as const;

const STATUS_LABEL: Record<string, string> = {
  in_stock: '在库',
  in_use: '在用',
  loaned: '借出',
  archived: '归档',
  consumed: '耗尽',
  lost: '遗失',
};

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
  label: string;
  icon: Icon;
  tone: 'teal' | 'info' | 'warning' | 'violet' | 'amber' | 'success';
}> = [
  { to: '/items', label: '新增物品', icon: IconPlus, tone: 'teal' },
  { to: '/capture', label: '扫码录入', icon: IconBarcode, tone: 'info' },
  { to: '/locations', label: '管理位置', icon: IconMap2, tone: 'violet' },
  { to: '/loans', label: '借出登记', icon: IconClipboardList, tone: 'warning' },
  { to: '/import', label: '批量导入', icon: IconFileImport, tone: 'amber' },
  { to: '/operations', label: '运维导出', icon: IconDatabaseExport, tone: 'success' },
];

function Dashboard() {
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
      const key = (it.category && it.category.trim()) || '未分类';
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [allItems]);

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
            label="物品总数"
            value={totals.totalItems}
            tone="teal"
            loading={items.isPending}
          />
          <Kpi
            icon={IconCoin}
            label="总价值"
            value={
              totals.totalValue > 0 ? `¥${formatPrice(totals.totalValue)}` : '—'
            }
            tone="warning"
            loading={items.isPending}
          />
          <Kpi
            icon={IconCategory2}
            label="类别"
            value={totals.categoryCount}
            tone="info"
            loading={items.isPending}
          />
          <Kpi
            icon={IconBox}
            label="在库"
            value={totals.inStock}
            tone="violet"
            loading={items.isPending}
          />
          <Kpi
            icon={IconBuildingWarehouse}
            label="位置"
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
        <RemindersCard />
        <LocationsCard tree={locs.data?.tree ?? []} loading={locs.isPending} />
      </aside>
    </div>
  );
}

function Greeting({ username }: { username: string | undefined }) {
  return (
    <div className={uiStyles.greetingRow}>
      <div>
        <h1 className="page-heading">
          {formatGreeting()}，{username ?? '伙计'} <span aria-hidden>👋</span>
        </h1>
        <p className="page-kicker">看看今天家里都有什么动静。</p>
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
  return (
    <section className={uiStyles.sectionCard}>
      <header className={uiStyles.sectionHead}>
        <h2 className={uiStyles.sectionTitle}>资产概览</h2>
        <Link to="/items" className={uiStyles.sectionLink}>
          全部 <IconArrowRight size={14} />
        </Link>
      </header>
      <div className={uiStyles.sectionBody}>
        {empty ? (
          <EmptyHint
            icon={<IconCategory2 size={20} />}
            title="还没有分类的物品"
            sub="添加几件物品后会自动按类别归集。"
          />
        ) : (
          <div className={uiStyles.categoryRow}>
            {categories.map(([name, count], idx) => {
              const tone = CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length];
              return (
                <Link
                  key={name}
                  className={uiStyles.categoryTile}
                  to="/items"
                  search={{ category: name } as never}
                >
                  <div className={uiStyles.categoryThumb[tone]}>
                    <IconPhoto size={22} />
                  </div>
                  <span className={uiStyles.categoryName}>{name}</span>
                  <span className={uiStyles.categoryCount}>{count} 件</span>
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
  return (
    <section className={uiStyles.sectionCard}>
      <header className={uiStyles.sectionHead}>
        <h2 className={uiStyles.sectionTitle}>最近添加</h2>
        <Link to="/items" className={uiStyles.sectionLink}>
          查看全部 <IconArrowRight size={14} />
        </Link>
      </header>
      {empty ? (
        <div className={uiStyles.sectionBody}>
          <EmptyHint
            icon={<IconPackage size={20} />}
            title="还没有添加任何物品"
            sub="去 物品 页或者扫码录入开始记录。"
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
                    {it.category ?? '未分类'} · 添加于 {formatDateShort(it.created_at)}
                  </span>
                </div>
                <div className={uiStyles.recentTags}>
                  <span className={variantClass}>
                    {STATUS_LABEL[it.status] ?? it.status}
                  </span>
                </div>
                <span className={uiStyles.recentPrice}>
                  {it.purchase_price ? `¥${formatPrice(it.purchase_price)}` : '—'}
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
  return (
    <section className={uiStyles.sectionCard}>
      <header className={uiStyles.sectionHead}>
        <h2 className={uiStyles.sectionTitle}>快捷操作</h2>
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
                {qa.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RemindersCard() {
  return (
    <section className={uiStyles.sectionCard}>
      <header className={uiStyles.sectionHead}>
        <h2 className={uiStyles.sectionTitle}>待办提醒</h2>
        <Link to="/loans" className={uiStyles.sectionLink}>
          管理 <IconArrowRight size={14} />
        </Link>
      </header>
      <div className={uiStyles.reminderEmpty}>暂无待办，一切井井有条。</div>
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
  return (
    <section className={uiStyles.sectionCard}>
      <header className={uiStyles.sectionHead}>
        <h2 className={uiStyles.sectionTitle}>位置</h2>
        <Link to="/locations" className={uiStyles.sectionLink}>
          管理 <IconArrowRight size={14} />
        </Link>
      </header>
      <div className={uiStyles.locationTreeWrap}>
        {loading ? (
          <div className={uiStyles.reminderEmpty}>加载中…</div>
        ) : tree.length === 0 ? (
          <div className={uiStyles.reminderEmpty}>还没创建位置。</div>
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
      </div>
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
