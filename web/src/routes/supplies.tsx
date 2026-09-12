import { createFileRoute, Outlet, useMatch } from '@tanstack/react-router';
import { useDevice } from '../lib/device';
import { SuppliesDesktop } from '../features/supplies/SuppliesDesktop';
import { SuppliesMobile } from '../features/supplies/SuppliesMobile';

export const Route = createFileRoute('/supplies')({
  component: SuppliesPage,
});

function SuppliesPage() {
  const device = useDevice();
  // /supplies/$itemId is generated as a child of this route; render the detail
  // page on its own instead of embedding it inside the list.
  const isDetail = useMatch({ from: '/supplies/$itemId', shouldThrow: false });
  if (isDetail) return <Outlet />;
  if (device === 'mobile') return <SuppliesMobile />;
  return <SuppliesDesktop />;
}
