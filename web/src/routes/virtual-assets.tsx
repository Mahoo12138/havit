import { createFileRoute } from '@tanstack/react-router';
import { VirtualAssetsDesktop } from '../features/virtual-assets/VirtualAssetsDesktop';

export const Route = createFileRoute('/virtual-assets')({
  component: VirtualAssetsDesktop,
});
