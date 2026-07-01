import manifest from './asset-icons.manifest.json';

export type AssetIconGroupId = string;

export interface AssetIconGroup {
  id: AssetIconGroupId;
  en: string;
  zh: string;
  keywords: string[];
}

export interface AssetIconDefinition {
  id: string;
  group: AssetIconGroupId;
  en: string;
  zh: string;
  keywords: string[];
  source: string;
  license: string;
  homepage: string;
}

const source = manifest.source;
const aliases = manifest.aliases as Record<string, string>;

export const assetIconGroups: AssetIconGroup[] = manifest.groups;

export const assetIcons: AssetIconDefinition[] = manifest.icons.map((icon) => ({
  id: icon.id,
  group: icon.group,
  en: titleize(icon.id),
  zh: icon.zh,
  keywords: icon.keywords ?? [],
  source: source.name,
  license: source.license,
  homepage: source.homepage,
}));

export const assetIconById = new Map(assetIcons.map((icon) => [icon.id, icon]));
export const assetIconGroupById = new Map(assetIconGroups.map((group) => [group.id, group]));

export function resolveAssetIconId(id?: string | null) {
  const trimmed = id?.trim();
  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase();
  if (assetIconById.has(normalized)) return normalized;

  const alias = aliases[normalized];
  return alias && assetIconById.has(alias) ? alias : null;
}

export function getAssetIcon(id?: string | null) {
  const resolved = resolveAssetIconId(id);
  return resolved ? assetIconById.get(resolved) ?? null : null;
}

export function defaultAssetIconId(rootType?: string | null) {
  return rootType === 'virtual' ? 'device-desktop' : 'folder';
}

export function titleize(id: string) {
  return id
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
