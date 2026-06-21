import { createFileRoute } from '@tanstack/react-router';
import { useDevice } from '../lib/device';
import { LocationsDesktop } from '../features/locations/LocationsDesktop';
import { LocationsMobile } from '../features/locations/LocationsMobile';

export const Route = createFileRoute('/locations/')({
  component: LocationsPage,
});

function LocationsPage() {
  const device = useDevice();
  if (device === 'mobile') return <LocationsMobile />;
  return <LocationsDesktop />;
}
