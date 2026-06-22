import { createFileRoute } from '@tanstack/react-router';
import { useDevice } from '../lib/device';
import { SupplyDetailDesktop } from '../features/supplies/SupplyDetailDesktop';
import { ItemDetailMobile } from '../features/items/ItemDetailMobile';

export const Route = createFileRoute('/supplies/$itemId')({
  component: SupplyDetail,
});

function SupplyDetail() {
  const { itemId } = Route.useParams();
  const device = useDevice();
  if (device === 'mobile') return <ItemDetailMobile itemId={itemId} />;
  return <SupplyDetailDesktop itemId={itemId} />;
}
