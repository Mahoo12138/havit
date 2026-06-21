import { createFileRoute } from '@tanstack/react-router';
import { useDevice } from '../lib/device';
import { ItemDetailDesktop } from '../features/items/ItemDetailDesktop';
import { ItemDetailMobile } from '../features/items/ItemDetailMobile';

export const Route = createFileRoute('/items/$itemId')({
  component: ItemDetail,
});

function ItemDetail() {
  const { itemId } = Route.useParams();
  const device = useDevice();
  if (device === 'mobile') return <ItemDetailMobile itemId={itemId} />;
  return <ItemDetailDesktop itemId={itemId} />;
}
