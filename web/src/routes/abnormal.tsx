import { createFileRoute } from '@tanstack/react-router';
import { useDevice } from '../lib/device';
import { AbnormalDesktop } from '../features/abnormal/AbnormalDesktop';
import { AbnormalMobile } from '../features/abnormal/AbnormalMobile';

export const Route = createFileRoute('/abnormal')({
  component: AbnormalPage,
});

function AbnormalPage() {
  const device = useDevice();
  if (device === 'mobile') return <AbnormalMobile />;
  return <AbnormalDesktop />;
}
