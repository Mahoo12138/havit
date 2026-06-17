import { createFileRoute } from '@tanstack/react-router';
import { useDevice } from '../lib/device';
import { AssetsDesktop } from '../features/assets/AssetsDesktop';
import { AssetsMobile } from '../features/assets/AssetsMobile';

export const Route = createFileRoute('/assets')({
  component: AssetsPage,
});

function AssetsPage() {
  const device = useDevice();
  if (device === 'mobile') return <AssetsMobile />;
  return <AssetsDesktop />;
}
