import { createFileRoute } from '@tanstack/react-router';
import { EssentialsDesktop } from '../features/essentials/EssentialsDesktop';

export const Route = createFileRoute('/essentials')({
  component: EssentialsDesktop,
});
