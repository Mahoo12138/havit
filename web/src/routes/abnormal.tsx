import { createFileRoute } from '@tanstack/react-router';
import { AbnormalDesktop } from '../features/abnormal/AbnormalDesktop';

export const Route = createFileRoute('/abnormal')({
  component: AbnormalDesktop,
});
