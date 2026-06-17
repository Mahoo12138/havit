import { createFileRoute } from '@tanstack/react-router';
import { useDevice } from '../lib/device';
import { DashboardDesktop } from '../features/dashboard/DashboardDesktop';
import { DashboardMobile } from '../features/dashboard/DashboardMobile';

export const Route = createFileRoute('/')({
  component: Dashboard,
});

function Dashboard() {
  const device = useDevice();
  if (device === 'mobile') return <DashboardMobile />;
  return <DashboardDesktop />;
}
