import {
  SettingsPageContent,
  type SettingsSearch,
  type SettingsSearchChange,
} from './SettingsDesktop';

export function SettingsMobile({
  search,
  onSearchChange,
}: {
  search: SettingsSearch;
  onSearchChange: SettingsSearchChange;
}) {
  return <SettingsPageContent mobile search={search} onSearchChange={onSearchChange} />;
}
