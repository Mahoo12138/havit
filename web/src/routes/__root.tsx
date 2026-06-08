import {
  createRootRouteWithContext,
  Link,
  Outlet,
  redirect,
  useRouterState,
} from '@tanstack/react-router';
import { type QueryClient } from '@tanstack/react-query';
import {
  IconBox,
  IconFileImport,
  IconInfoCircle,
  IconLogout,
  IconMap2,
  IconHome,
  IconMenu2,
} from '@tabler/icons-react';
import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Row,
  RowBetween,
  Stack,
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

const navItems = [
  { to: '/', label: '仪表盘', icon: IconHome },
  { to: '/items', label: '物品', icon: IconBox },
  { to: '/locations', label: '位置', icon: IconMap2 },
  { to: '/import', label: '批量导入', icon: IconFileImport },
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

  if (isAuthShell) {
    return <Outlet />;
  }

  return (
    <div className={uiStyles.shell}>
      <header className={uiStyles.shellHeader}>
        <Row>
          <button
            className={uiStyles.burger}
            type="button"
            aria-label="切换导航"
            aria-expanded={opened}
            onClick={() => setOpened((value) => !value)}
          >
            <IconMenu2 size={18} />
          </button>
          <span className="brand-mark">
            <IconHome size={19} />
          </span>
          <div>
            <h1 className="brand-lockup">Havit</h1>
            <span className={uiStyles.shellBrandMeta}>home asset ledger</span>
          </div>
          {systemStatus.mode === 'demo' && <Badge>DEMO</Badge>}
        </Row>
        <Button
          variant="subtle"
          leftSection={<IconLogout size={14} />}
          onClick={async () => {
            try {
              await authApi.logout();
            } catch {
              /* ignore */
            }
            clearToken();
            window.location.href = '/login';
          }}
        >
          退出
        </Button>
      </header>

      <div className={uiStyles.shellBody}>
        <nav
          className={[
            uiStyles.shellNav,
            opened ? uiStyles.shellNavOpen : undefined,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className={uiStyles.navSectionLabel}>Inventory</div>
          <Stack>
            {navItems.map((item) => {
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
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </Stack>
        </nav>

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
