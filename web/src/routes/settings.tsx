import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useDevice } from '../lib/device';
import {
  SettingsDesktop,
  type SettingsSearchChange,
} from '../features/settings/SettingsDesktop';
import { SettingsMobile } from '../features/settings/SettingsMobile';

type SettingsSearch = {
  tab?: string;
  panel?: string;
};

export const Route = createFileRoute('/settings')({
  validateSearch: (search: Record<string, unknown>): SettingsSearch => ({
    tab: typeof search.tab === 'string' ? search.tab : undefined,
    panel: typeof search.panel === 'string' ? search.panel : undefined,
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const device = useDevice();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const onSearchChange: SettingsSearchChange = (next, options) => {
    navigate({
      to: '/settings',
      search: {
        tab: next.tab,
        panel: next.panel,
      },
      replace: options?.replace,
    });
  };

  if (device === 'mobile') {
    return <SettingsMobile search={search} onSearchChange={onSearchChange} />;
  }
  return <SettingsDesktop search={search} onSearchChange={onSearchChange} />;
}
