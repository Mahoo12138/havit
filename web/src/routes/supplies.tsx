import { createFileRoute } from '@tanstack/react-router';
import { useDevice } from '../lib/device';
import { SuppliesDesktop } from '../features/supplies/SuppliesDesktop';
import { SuppliesMobile } from '../features/supplies/SuppliesMobile';

export const Route = createFileRoute('/supplies')({
  component: SuppliesPage,
});

function SuppliesPage() {
  const device = useDevice();
  if (device === 'mobile') return <SuppliesMobile />;
  return <SuppliesDesktop />;
}
