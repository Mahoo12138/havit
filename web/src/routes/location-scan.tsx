import { createFileRoute } from '@tanstack/react-router';
import { LocationScanDesktop } from '../features/location-scan/LocationScanDesktop';

type LocationScanSearch = { code?: string };

export const Route = createFileRoute('/location-scan')({
  validateSearch: (search: Record<string, unknown>): LocationScanSearch => ({
    code: typeof search.code === 'string' ? search.code : undefined,
  }),
  component: LocationScanWrapper,
});

function LocationScanWrapper() {
  const { code } = Route.useSearch();
  return <LocationScanDesktop initialCode={code} />;
}
