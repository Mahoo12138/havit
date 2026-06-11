import {
  createRootRouteWithContext,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { type QueryClient, useQuery } from '@tanstack/react-query';
import {
  IconBarcode,
  IconBell,
  IconBox,
  IconBriefcase,
  IconClipboardList,
  IconDatabaseExport,
  IconFileImport,
  IconHistory,
  IconHome,
  IconInfoCircle,
  IconLayoutDashboard,
  IconLogout,
  IconMap2,
  IconMenu2,
  IconPrinter,
  IconReceipt,
  IconSearch,
  IconShoppingBag,
  IconX,
} from '@tabler/icons-react';
import { type FormEvent, useState } from 'react';
import {
  Alert,
  Badge,
  RowBetween,
  uiStyles,
} from '../components/ui';
import {
  authApi,
  clearToken,
  getToken,
  systemApi,
  type SystemStatus,
} from '../api/client';

interface RouterContext {
  queryClient: QueryClient;
}

const PUBLIC_PATHS = new Set(['/login', '/setup']);

const navSections = [
  {
    label: '总览',
    items: [
      { to: '/', label: '仪表盘', icon: IconLayoutDashboard },
      { to: '/search', label: '搜索', icon: IconSearch },
    ],
  },
  {
    label: '资产',
    items: [
      { to: '/items', label: '物品', icon: IconBox },
      { to: '/locations', label: '位置', icon: IconMap2 },
      { to: '/consumables', label: '消耗品', icon: IconShoppingBag },
      { to: '/edc', label: 'EDC', icon: IconBriefcase },
      { to: '/credentials', label: '凭证保修', icon: IconReceipt },
    ],
  },
  {
    label: '流转',
    items: [
      { to: '/loans', label: '借出', icon: IconClipboardList },
      { to: '/lifecycle', label: '退场归档', icon: IconHistory },
    ],
  },
  {
    label: '录入与维护',
    items: [
      { to: '/capture', label: '录入增强', icon: IconBarcode },
      { to: '/import', label: '批量导入', icon: IconFileImport },
      { to: '/qr-print', label: 'QR 标签打印', icon: IconPrinter },
      { to: '/operations', label: '运维导出', icon: IconDatabaseExport },
    ],
  },
] as const;

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  beforeLoad: async ({ context, location }) => {
    const status = await context.queryClient.fetchQuery({
      queryKey: ['system', 'status'],
      queryFn: () => systemApi.status(),
      staleTime: Infinity,
    });

    if (
      status.mode === 'release' &&
      status.needs_setup &&
      location.pathname !== '/setup'
    ) {
      throw redirect({ to: '/setup' });
    }

    if (!status.needs_setup && location.pathname === '/setup') {
      throw redirect({ to: '/login', search: { redirect: undefined } });
    }

    const isPublic = PUBLIC_PATHS.has(location.pathname);
    if (!isPublic && !getToken()) {
      throw redirect({ to: '/login', search: { redirect: location.pathname } });
    }

    return { systemStatus: status };
  },
});

function RootLayout() {
  const { systemStatus } = Route.useRouteContext();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isAuthShell = PUBLIC_PATHS.has(path);
  const [opened, setOpened] = useState(false);
  const navigate = useNavigate();
  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    enabled: !isAuthShell,
    retry: false,
    staleTime: 60_000,
  });

  if (isAuthShell) {
    return <Outlet />;
  }

  const username = me.data?.username ?? '用户';
  const initials = username.slice(0, 1).toUpperCase();

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const q = String(data.get('q') ?? '').trim();
    if (!q) return;
    navigate({ to: '/search', search: { q } as never });
  }

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    clearToken();
    window.location.href = '/login';
  }

  return (
    <div className={uiStyles.shell}>
      {opened && (
        <div
          className={uiStyles.shellNavScrim}
          onClick={() => setOpened(false)}
          aria-hidden
        />
      )}
      <nav
        className={[
          uiStyles.shellNav,
          opened ? uiStyles.shellNavOpen : undefined,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={uiStyles.sidebarBrand}>
          <span className={uiStyles.sidebarBrandMark}>
            <IconHome size={17} />
          </span>
          <span className={uiStyles.sidebarBrandText}>Havit</span>
          <button
            type="button"
            className={uiStyles.sidebarBrandClose}
            aria-label="关闭导航"
            onClick={() => setOpened(false)}
          >
            <IconX size={16} />
          </button>
        </div>

        <div className={uiStyles.sidebarScroll}>
          {navSections.map((section, sectionIdx) => (
            <div key={section.label}>
              {sectionIdx > 0 && (
                <div className={uiStyles.navGroupDivider} aria-hidden />
              )}
              <div className={uiStyles.navSectionLabel}>{section.label}</div>
              <div className={uiStyles.navGroup}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.to === '/' ? path === '/' : path.startsWith(item.to);
                  return (
                    <Link
                      className={uiStyles.navLink}
                      data-active={active}
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpened(false)}
                    >
                      <span className={uiStyles.navLinkIcon}>
                        <Icon size={17} />
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={uiStyles.sidebarFooter}>
          <div className={uiStyles.sidebarUser}>
            <span className={uiStyles.sidebarUserAvatar}>{initials}</span>
            <div className={uiStyles.sidebarUserMeta}>
              <span className={uiStyles.sidebarUserName}>{username}</span>
              <span className={uiStyles.sidebarUserMetaSub}>
                v{systemStatus.version}
              </span>
            </div>
            <button
              type="button"
              className={uiStyles.sidebarLogout}
              aria-label="退出登录"
              onClick={handleLogout}
            >
              <IconLogout size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div className={uiStyles.shellMainArea}>
        <header className={uiStyles.shellHeader}>
          <button
            type="button"
            className={uiStyles.burger}
            aria-label="切换导航"
            aria-expanded={opened}
            onClick={() => setOpened((value) => !value)}
          >
            <IconMenu2 size={18} />
          </button>

          <form className={uiStyles.headerSearchWrap} onSubmit={handleSearchSubmit} role="search">
            <span className={uiStyles.headerSearchIcon} aria-hidden>
              <IconSearch size={16} />
            </span>
            <input
              className={uiStyles.headerSearchInput}
              name="q"
              type="search"
              placeholder="搜索物品、位置、标签…"
              aria-label="搜索"
            />
          </form>

          <div className={uiStyles.headerActions}>
            {systemStatus.mode === 'demo' && <Badge>DEMO</Badge>}
            <span className={uiStyles.shellHeaderDate}>{formatToday()}</span>
            <button type="button" className={uiStyles.headerIconBtn} aria-label="通知">
              <IconBell size={18} />
              <span className={uiStyles.headerIconDot} aria-hidden />
            </button>
            <span className={uiStyles.headerAvatar} aria-label={username}>
              {initials}
            </span>
          </div>
        </header>

        <main className={uiStyles.shellMain}>
          <div className="page-shell">
            {systemStatus.mode === 'demo' && (
              <DemoBanner status={systemStatus} />
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function DemoBanner({ status }: { status: SystemStatus }) {
  return (
    <div className={uiStyles.bannerOffset}>
      <Alert icon={<IconInfoCircle size={18} />}>
        <RowBetween>
          <strong>演示模式</strong>
          <span>版本 {status.version}</span>
        </RowBetween>
        <div>当前为演示模式，数据仅供体验，可能在任何时刻被重置。</div>
      </Alert>
    </div>
  );
}

function formatToday() {
  const now = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${weekdays[now.getDay()]} · ${m}/${d}`;
}
