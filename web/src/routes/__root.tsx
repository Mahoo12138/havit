import {
  createRootRouteWithContext,
  Outlet,
  redirect,
  useRouterState,
} from '@tanstack/react-router';
import { type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  getToken,
  systemApi,
  type SystemStatus,
} from '../api/client';
import { useDevice, type DeviceType } from '../lib/device';
import { DesktopShell } from '../layouts/DesktopShell';
import { MobileShell } from '../layouts/MobileShell';
import { TabletShell } from '../layouts/TabletShell';

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

const SHELL_MAP: Record<
  DeviceType,
  React.ComponentType<{ systemStatus: SystemStatus; children?: ReactNode }>
> = {
  desktop: DesktopShell,
  tablet: TabletShell,
  mobile: MobileShell,
};

function RootLayout() {
  const { systemStatus } = Route.useRouteContext();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isAuthShell = PUBLIC_PATHS.has(path);
  const device = useDevice();

  if (isAuthShell) {
    return <Outlet />;
  }

  const Shell = SHELL_MAP[device];

  return (
    <Shell systemStatus={systemStatus}>
      <Outlet />
    </Shell>
  );
}
