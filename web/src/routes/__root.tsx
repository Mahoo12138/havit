import {
  createRootRouteWithContext,
  Link,
  Outlet,
  redirect,
  useRouterState,
} from '@tanstack/react-router';
import { type QueryClient } from '@tanstack/react-query';
import {
  Alert,
  AppShell,
  Badge,
  Group,
  NavLink,
  Title,
  Button,
} from '@mantine/core';
import {
  IconBox,
  IconFileImport,
  IconInfoCircle,
  IconLogout,
  IconMap2,
  IconHome,
} from '@tabler/icons-react';
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

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  beforeLoad: async ({ context, location }) => {
    const status = await context.queryClient.fetchQuery({
      queryKey: ['system', 'status'],
      queryFn: () => systemApi.status(),
      staleTime: Infinity,
    });

    if (status.mode === 'release' && status.needs_setup && location.pathname !== '/setup') {
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

  if (isAuthShell) {
    return (
      <AppShell>
        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
    );
  }

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <IconHome size={22} />
            <Title order={4}>Havit</Title>
            {systemStatus.mode === 'demo' && (
              <Badge color="yellow" variant="light">
                DEMO
              </Badge>
            )}
          </Group>
          <Button
            variant="subtle"
            size="xs"
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
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <NavLink component={Link} to="/" label="仪表盘" leftSection={<IconHome size={18} />} />
        <NavLink component={Link} to="/items" label="物品" leftSection={<IconBox size={18} />} />
        <NavLink
          component={Link}
          to="/locations"
          label="位置"
          leftSection={<IconMap2 size={18} />}
        />
        <NavLink
          component={Link}
          to="/import"
          label="批量导入"
          leftSection={<IconFileImport size={18} />}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        {systemStatus.mode === 'demo' && <DemoBanner status={systemStatus} />}
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

function DemoBanner({ status }: { status: SystemStatus }) {
  return (
    <Alert
      color="yellow"
      icon={<IconInfoCircle />}
      mb="md"
      title="演示模式"
    >
      当前为演示模式，数据仅供体验，可能在任何时刻被重置。版本 {status.version}。
    </Alert>
  );
}
