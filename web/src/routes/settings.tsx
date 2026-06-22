import { createFileRoute } from '@tanstack/react-router';
import { SettingsDesktop } from '../features/settings/SettingsDesktop';

export const Route = createFileRoute('/settings')({
  component: SettingsDesktop,
});
